"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderType, Tier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logUnexpected } from "@/lib/app-log";
import { getCurrentSession } from "@/lib/current-session";
import { assertRateLimit, requestIdentifier } from "@/lib/rate-limit";
import { PublicActionError } from "@/lib/safe-action";
import { cleanMultiline, cleanText } from "@/lib/security";
import { paymentBucket, supabaseAdmin } from "@/lib/supabase";
import { planByTier } from "@/lib/catalog";
import { businessConfig } from "@/lib/config";
import { isSupportedArea } from "@/lib/geo";
import { triggerN8nWebhook } from "@/lib/webhook";

type CheckoutState = {
  ok: boolean;
  message: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

async function requireCustomer() {
  const session = await getCurrentSession();
  if (!session || session.role !== "CUSTOMER") {
    throw new PublicActionError("Sign in as a customer before uploading your payment screenshot.");
  }
  return session;
}

async function uploadReceipt(file: File, userId: string) {
  if (!imageTypes.has(file.type)) {
    throw new PublicActionError("Upload a raw image file: PNG, JPG, WEBP, or GIF.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new PublicActionError("Receipt image must be under 5MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const supabase = supabaseAdmin();
  const bucket = paymentBucket();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return { path };
}

async function deleteReceipt(path: string) {
  const supabase = supabaseAdmin();
  await supabase.storage.from(paymentBucket()).remove([path]);
}

async function assertPaymentSetupReady() {
  const envBusiness = businessConfig();
  const settings = await prisma.businessSetting.findMany();
  const settingMap = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const missing = [
    !((settingMap.BUSINESS_PHONE || envBusiness.phone).trim()) ? "business phone" : "",
    !((settingMap.BUSINESS_WHATSAPP_URL || envBusiness.whatsappUrl).trim()) ? "WhatsApp link" : "",
    !((settingMap.BANK_ACCOUNT_TITLE || envBusiness.bank.title).trim()) ? "bank account title" : "",
    !((settingMap.BANK_ACCOUNT_NUMBER || envBusiness.bank.accountNumber).trim()) ? "bank account number" : "",
    !((settingMap.BANK_NAME || envBusiness.bank.name).trim()) ? "bank name" : ""
  ].filter(Boolean);

  if (missing.length) {
    throw new PublicActionError(`Payment setup is incomplete. Missing: ${missing.join(", ")}.`);
  }
}

const subscriptionSchema = z.object({
  tier: z.nativeEnum(Tier),
  requestedDeliverySlot: z.string().min(3).max(80),
  notes: z.string().max(1000).optional()
});

export async function createSubscriptionPayment(
  _: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  let userId: string | null = null;
  try {
    const session = await requireCustomer();
    userId = session.userId;
    await assertRateLimit("checkout:subscription", await requestIdentifier(session.userId), { limit: 5, windowMs: 30 * 60 * 1000 });
    await assertPaymentSetupReady();
    const parsed = subscriptionSchema.safeParse({
      tier: formData.get("tier"),
      requestedDeliverySlot: cleanText(formData.get("requestedDeliverySlot"), 80),
      notes: cleanMultiline(formData.get("notes"), 1000)
    });
    if (!parsed.success) {
      return { ok: false, message: "Choose a delivery time before sending your payment screenshot." };
    }

    const dbPlan = await prisma.subscriptionPlan.findUnique({ where: { tier: parsed.data.tier } });
    const plan = dbPlan
      ? {
          tier: dbPlan.tier,
          price: dbPlan.price
        }
      : planByTier(parsed.data.tier);
    const receipt = formData.get("receipt");

    if (!(receipt instanceof File) || receipt.size === 0) {
      return { ok: false, message: "Attach the bank-transfer screenshot before submitting." };
    }

    const uploaded = await uploadReceipt(receipt, session.userId);

    let createdPaymentId = "";
    try {
      await prisma.$transaction(async (tx) => {
        const retrySubscription = await tx.subscription.findFirst({
          where: {
            userId: session.userId,
            tier: plan.tier,
            status: "REJECTED"
          },
          orderBy: { createdAt: "desc" }
        });

        const subscription = retrySubscription
          ? await tx.subscription.update({
              where: { id: retrySubscription.id },
              data: {
                status: "PENDING_PAYMENT",
                startDate: null,
                endDate: null,
                total: plan.price,
                requestedDeliverySlot: parsed.data.requestedDeliverySlot,
                approvedDeliverySlot: null,
                notes: parsed.data.notes ?? ""
              }
            })
          : await tx.subscription.create({
              data: {
                userId: session.userId,
                tier: plan.tier,
                total: plan.price,
                requestedDeliverySlot: parsed.data.requestedDeliverySlot,
                notes: parsed.data.notes ?? ""
              }
            });

        const payment = await tx.payment.create({
          data: {
            userId: session.userId,
            subscriptionId: subscription.id,
            amount: plan.price,
            screenshotUrl: uploaded.path,
            storagePath: uploaded.path
          }
        });
        createdPaymentId = payment.id;
      });
    } catch (error) {
      await deleteReceipt(uploaded.path);
      throw error;
    }

    // Trigger n8n webhook notification
    const customer = await prisma.user.findUnique({ where: { id: session.userId } });
    if (createdPaymentId && customer) {
      await triggerN8nWebhook("payment.submitted", {
        paymentId: createdPaymentId,
        amount: plan.price,
        type: "SUBSCRIPTION",
        tier: plan.tier,
        screenshotUrl: uploaded.path,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        addressType: customer.addressType || "",
        addressLine: customer.addressLine || "",
        area: customer.area || ""
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/payments");
    revalidatePath("/account");
    return { ok: true, message: "Your payment screenshot has been sent for admin review." };
  } catch (error) {
    if (error instanceof PublicActionError) return { ok: false, message: error.message };
    await logUnexpected("checkout", "create_subscription_payment", error, { userId });
    return { ok: false, message: "Payment submission failed. Try again." };
  }
}

const orderSchema = z.object({
  type: z.enum(["CUSTOM", "EVENT", "FROZEN_GOODS"]),
  title: z.string().min(3).max(120),
  details: z.string().min(10).max(1000),
  deliveryDate: z.string().optional(),
  deliverySlot: z.string().max(80).optional(),
  addressLine: z.string().min(6).max(500),
  area: z.string().min(2).max(80),
  estimatedTotal: z.coerce.number().int().min(1),
  productId: z.string().optional(),
  guestCount: z.coerce.number().int().min(1).optional()
});

export async function createOrderPayment(_: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let userId: string | null = null;
  try {
    const session = await requireCustomer();
    userId = session.userId;
    await assertRateLimit("checkout:order", await requestIdentifier(session.userId), { limit: 6, windowMs: 30 * 60 * 1000 });
    await assertPaymentSetupReady();
    const parsed = orderSchema.safeParse({
      type: formData.get("type"),
      title: cleanText(formData.get("title"), 120),
      details: cleanMultiline(formData.get("details"), 1000),
      deliveryDate: cleanText(formData.get("deliveryDate"), 40),
      deliverySlot: cleanText(formData.get("deliverySlot"), 80),
      addressLine: cleanMultiline(formData.get("addressLine"), 500),
      area: cleanText(formData.get("area"), 80),
      estimatedTotal: formData.get("estimatedTotal"),
      productId: cleanText(formData.get("productId"), 120),
      guestCount: formData.get("guestCount")
    });
    const receipt = formData.get("receipt");

    if (!parsed.success) {
      return { ok: false, message: "Complete the order details before sending your payment screenshot." };
    }

    if (!isSupportedArea(parsed.data.area)) {
      return { ok: false, message: "We only deliver to DHA, Gulberg, Johar Town, Cantt, Model Town, Garden Town, Faisal Town, and Iqbal Town." };
    }

    if (!(receipt instanceof File) || receipt.size === 0) {
      return { ok: false, message: "Attach the bank-transfer screenshot before submitting." };
    }

    let estimatedTotal = parsed.data.estimatedTotal;
    let title = parsed.data.title;
    let details = parsed.data.details;

    if (parsed.data.type === "FROZEN_GOODS" && parsed.data.productId) {
      const product = await prisma.frozenProduct.findFirst({
        where: { id: parsed.data.productId, active: true }
      });
      if (!product) {
        return { ok: false, message: "Selected frozen item is no longer available." };
      }
      estimatedTotal = product.price;
      title = product.name;
      details = `${product.pack} frozen goods order`;
    }

    const uploaded = await uploadReceipt(receipt, session.userId);

    let createdPaymentId = "";
    let createdOrderId = "";
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: session.userId,
            type: parsed.data.type as OrderType,
            title,
            details,
            deliveryDate: parsed.data.deliveryDate ? new Date(parsed.data.deliveryDate) : undefined,
            deliverySlot: parsed.data.deliverySlot,
            addressLine: parsed.data.addressLine,
            area: parsed.data.area,
            estimatedTotal,
            guestCount: parsed.data.guestCount
          }
        });
        createdOrderId = order.id;

        const payment = await tx.payment.create({
          data: {
            userId: session.userId,
            orderId: order.id,
            amount: estimatedTotal,
            screenshotUrl: uploaded.path,
            storagePath: uploaded.path
          }
        });
        createdPaymentId = payment.id;
      });
    } catch (error) {
      await deleteReceipt(uploaded.path);
      throw error;
    }

    // Trigger n8n webhook notification
    const customer = await prisma.user.findUnique({ where: { id: session.userId } });
    if (createdPaymentId && customer) {
      await triggerN8nWebhook("payment.submitted", {
        paymentId: createdPaymentId,
        orderId: createdOrderId,
        amount: estimatedTotal,
        type: parsed.data.type, // CUSTOM, EVENT, FROZEN_GOODS
        title,
        details,
        screenshotUrl: uploaded.path,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        addressType: customer.addressType || "",
        addressLine: customer.addressLine || "",
        area: customer.area || ""
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { ok: true, message: "Your payment screenshot has been sent for admin review." };
  } catch (error) {
    if (error instanceof PublicActionError) return { ok: false, message: error.message };
    await logUnexpected("checkout", "create_order_payment", error, { userId });
    return { ok: false, message: "Order submission failed. Try again." };
  }
}

export async function cancelPendingRequestAction(id: string, type: "subscription" | "order"): Promise<{ ok: boolean; message: string }> {
  let userId: string | null = null;
  try {
    const session = await requireCustomer();
    userId = session.userId;
    
    await assertRateLimit("checkout:cancel", await requestIdentifier(session.userId), { limit: 10, windowMs: 15 * 60 * 1000 });

    if (type === "subscription") {
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { payments: true }
      });

      if (!subscription || subscription.userId !== session.userId) {
        throw new PublicActionError("Subscription request not found.");
      }

      if (subscription.status !== "PENDING_PAYMENT") {
        throw new PublicActionError("Only pending subscription requests can be cancelled.");
      }

      await prisma.$transaction(async (tx) => {
        for (const payment of subscription.payments) {
          if (payment.storagePath) {
            await deleteReceipt(payment.storagePath).catch(() => {});
          }
        }
        await tx.payment.deleteMany({ where: { subscriptionId: id } });
        await tx.subscription.delete({ where: { id } });
      });

    } else {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { payments: true }
      });

      if (!order || order.userId !== session.userId) {
        throw new PublicActionError("Order request not found.");
      }

      if (order.status !== "PENDING_PAYMENT") {
        throw new PublicActionError("Only pending orders can be cancelled.");
      }

      await prisma.$transaction(async (tx) => {
        for (const payment of order.payments) {
          if (payment.storagePath) {
            await deleteReceipt(payment.storagePath).catch(() => {});
          }
        }
        await tx.payment.deleteMany({ where: { orderId: id } });
        await tx.order.delete({ where: { id } });
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    
    return { ok: true, message: "Request cancelled successfully." };
  } catch (error) {
    if (error instanceof PublicActionError) return { ok: false, message: error.message };
    await logUnexpected("checkout", "cancel_pending_request", error, { userId });
    return { ok: false, message: "Cancellation failed. Try again." };
  }
}

