import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureCurrentWeekDeliveries } from "@/lib/delivery";
import { triggerN8nWebhook } from "@/lib/webhook";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  // 1. Verify Secret Token
  const authHeader = req.headers.get("Authorization");
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!secret || !authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, paymentId, reason, approvedDeliverySlot } = body;

    if (!paymentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid paymentId or action" }, { status: 400 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    let finalPayment = null;

    if (action === "approve") {
      finalPayment = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { subscription: true, order: true, user: true }
        });

        if (!payment) {
          throw new Error("Payment record not found");
        }

        if (payment.status !== PaymentStatus.PENDING) {
          throw new Error("Only pending payments can be approved");
        }

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.APPROVED,
            reviewedAt: now,
            reviewedById: "system:n8n"
          }
        });

        if (payment.subscriptionId) {
          await tx.subscription.update({
            where: { id: payment.subscriptionId },
            data: {
              status: "CONFIRMED",
              startDate: now,
              endDate,
              approvedDeliverySlot: approvedDeliverySlot || payment.subscription?.requestedDeliverySlot || "To be confirmed"
            }
          });
          await ensureCurrentWeekDeliveries(payment.subscriptionId, tx);
        }

        if (payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "CONFIRMED" }
          });
        }

        return payment;
      });

      // Trigger standard outbound approval webhook (n8n will use this to send WhatsApp confirmation to the user)
      if (finalPayment) {
        await triggerN8nWebhook("payment.approved", {
          paymentId: finalPayment.id,
          amount: finalPayment.amount,
          type: finalPayment.subscriptionId ? "SUBSCRIPTION" : "ORDER",
          customerName: finalPayment.user.name,
          customerPhone: finalPayment.user.phone,
          customerEmail: finalPayment.user.email,
          approvedDeliverySlot: approvedDeliverySlot || finalPayment.subscription?.requestedDeliverySlot || "To be confirmed",
          screenshotUrl: finalPayment.screenshotUrl,
          verifiedBy: "AI/Automation (n8n)"
        });
      }
    } else {
      finalPayment = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { user: true }
        });

        if (!payment) {
          throw new Error("Payment record not found");
        }

        if (payment.status !== PaymentStatus.PENDING) {
          throw new Error("Only pending payments can be rejected");
        }

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.REJECTED,
            reviewedAt: now,
            reviewedById: "system:n8n",
            rejectionReason: reason || "Rejected by automated verification."
          }
        });

        if (payment.subscriptionId) {
          await tx.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: "REJECTED" }
          });
        }

        if (payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "REJECTED" }
          });
        }

        return payment;
      });

      // Trigger standard outbound rejection webhook (n8n will send WhatsApp rejection reason to the user)
      if (finalPayment) {
        await triggerN8nWebhook("payment.rejected", {
          paymentId: finalPayment.id,
          amount: finalPayment.amount,
          type: finalPayment.subscriptionId ? "SUBSCRIPTION" : "ORDER",
          customerName: finalPayment.user.name,
          customerPhone: finalPayment.user.phone,
          customerEmail: finalPayment.user.email,
          rejectionReason: reason || "Rejected by automated verification.",
          screenshotUrl: finalPayment.screenshotUrl,
          verifiedBy: "AI/Automation (n8n)"
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/deliveries");
    revalidatePath("/account");

    return NextResponse.json({ ok: true, status: action === "approve" ? "APPROVED" : "REJECTED" });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to process callback";
    console.error("n8n Webhook Callback Error:", errMessage);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
