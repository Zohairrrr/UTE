"use server";

import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@prisma/client";
import { ensureCurrentWeekDeliveries } from "@/lib/delivery";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/current-session";
import { cleanText } from "@/lib/security";
import { assertRateLimit, requestIdentifier } from "@/lib/rate-limit";
import { triggerN8nWebhook } from "@/lib/webhook";
import { sendMail } from "@/lib/mail";

async function assertAdminRateLimit(userId: string) {
  await assertRateLimit("admin:ops", await requestIdentifier(userId), { limit: 30, windowMs: 5 * 60 * 1000 });
}

async function requireAdmin() {
  const session = await getCurrentSession();
  if (session?.role !== "ADMIN") {
    throw new Error("Admin access is required.");
  }
  return session;
}

export async function approvePayment(paymentId: string, approvedDeliverySlot?: string) {
  const session = await requireAdmin();
  await assertAdminRateLimit(session.userId);
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);
  const cleanSlot = cleanText(approvedDeliverySlot, 80);

  const approvedPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true, order: true, user: true }
    });

    if (!payment || payment.status !== PaymentStatus.PENDING) {
      throw new Error("Only pending payments can be approved.");
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.APPROVED,
        reviewedAt: now,
        reviewedById: session.userId
      }
    });

    if (payment.subscriptionId) {
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "CONFIRMED",
          startDate: now,
          endDate,
          approvedDeliverySlot: cleanSlot || payment.subscription?.requestedDeliverySlot || "To be confirmed"
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

  // Trigger n8n webhook notification
  if (approvedPayment) {
    await triggerN8nWebhook("payment.approved", {
      paymentId: approvedPayment.id,
      amount: approvedPayment.amount,
      type: approvedPayment.subscriptionId ? "SUBSCRIPTION" : "ORDER",
      customerName: approvedPayment.user.name,
      customerPhone: approvedPayment.user.phone,
      customerEmail: approvedPayment.user.email,
      approvedDeliverySlot: cleanSlot || approvedPayment.subscription?.requestedDeliverySlot || "To be confirmed",
      screenshotUrl: approvedPayment.screenshotUrl
    });

    // Send direct email notification to customer
    try {
      const activeSlot = cleanSlot || approvedPayment.subscription?.requestedDeliverySlot || "To be confirmed";
      await sendMail({
        to: approvedPayment.user.email,
        subject: "Payment Approved - Subscription Activated! 🎉",
        text: `Hi ${approvedPayment.user.name},\n\nYour payment of PKR ${approvedPayment.amount} has been approved, and your subscription is now ACTIVE!\n\nApproved delivery slot: ${activeSlot}\n\nThank you for choosing Urban Tiffin!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #2e7d32;">Payment Approved! 🎉</h2>
            <p>Hi <strong>${approvedPayment.user.name}</strong>,</p>
            <p>Your payment of <strong>PKR ${approvedPayment.amount}</strong> has been successfully verified and approved.</p>
            <p>Your subscription is now <strong style="color: #2e7d32;">ACTIVE</strong>!</p>
            <p><strong>Approved Delivery Slot:</strong> ${activeSlot}</p>
            <br />
            <p>Thank you for choosing <strong>Urban Tiffin</strong>!</p>
          </div>
        `
      });
      console.log(`Email notification sent to ${approvedPayment.user.email} for payment approval.`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to send approval email:", errMsg);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/deliveries");
  revalidatePath("/account");
}

export async function rejectPayment(paymentId: string, reason?: string) {
  const session = await requireAdmin();
  await assertAdminRateLimit(session.userId);

  const rejectedPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });
    if (!payment || payment.status !== PaymentStatus.PENDING) {
      throw new Error("Only pending payments can be rejected.");
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: session.userId,
        rejectionReason: reason || "Rejected by admin review."
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

  // Trigger n8n webhook notification
  if (rejectedPayment) {
    await triggerN8nWebhook("payment.rejected", {
      paymentId: rejectedPayment.id,
      amount: rejectedPayment.amount,
      type: rejectedPayment.subscriptionId ? "SUBSCRIPTION" : "ORDER",
      customerName: rejectedPayment.user.name,
      customerPhone: rejectedPayment.user.phone,
      customerEmail: rejectedPayment.user.email,
      rejectionReason: reason || "Rejected by admin review.",
      screenshotUrl: rejectedPayment.screenshotUrl
    });

    // Send direct email notification to customer
    try {
      const rejectReason = reason || "Rejected by admin review.";
      await sendMail({
        to: rejectedPayment.user.email,
        subject: "Payment Review Update - Action Required ⚠️",
        text: `Hi ${rejectedPayment.user.name},\n\nYour payment of PKR ${rejectedPayment.amount} could not be approved.\n\nReason: ${rejectReason}\n\nPlease visit your dashboard at ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3006'}/account to re-submit your payment proof.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #c62828;">Payment Review Update ⚠️</h2>
            <p>Hi <strong>${rejectedPayment.user.name}</strong>,</p>
            <p>We reviewed your payment of <strong>PKR ${rejectedPayment.amount}</strong>, and unfortunately, it could not be approved at this time.</p>
            <p style="padding: 10px; background-color: #ffebee; border-left: 4px solid #c62828; margin: 15px 0;">
              <strong>Reason for rejection:</strong> ${rejectReason}
            </p>
            <p>Please visit your <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3006'}/account" style="color: #1976d2; font-weight: bold;">Account Dashboard</a> to upload a valid payment screenshot.</p>
            <br />
            <p>Thank you,<br/>The Urban Tiffin Team</p>
          </div>
        `
      });
      console.log(`Email notification sent to ${rejectedPayment.user.email} for payment rejection.`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to send rejection email:", errMsg);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/account");
}
