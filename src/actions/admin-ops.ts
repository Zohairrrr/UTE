"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DeliveryStatus, OrderStatus, Tier } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/security";
import { assertRateLimit, requestIdentifier } from "@/lib/rate-limit";
import { triggerN8nWebhook } from "@/lib/webhook";

async function assertAdminRateLimit(userId: string) {
  await assertRateLimit("admin:ops", await requestIdentifier(userId), { limit: 30, windowMs: 5 * 60 * 1000 });
}

const planSchema = z.object({
  id: z.string().optional(),
  tier: z.nativeEnum(Tier),
  name: z.string().min(2),
  label: z.string().min(2),
  secondaryLabel: z.string().min(2),
  price: z.coerce.number().int().min(1),
  cadence: z.string().min(2),
  displayOrder: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(false)
});

export async function saveSubscriptionPlan(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);
  const parsed = planSchema.parse({
    ...Object.fromEntries(formData),
    active: formData.get("active") === "on"
  });

  await prisma.subscriptionPlan.upsert({
    where: { tier: parsed.tier },
    update: {
      name: parsed.name,
      label: parsed.label,
      secondaryLabel: parsed.secondaryLabel,
      price: parsed.price,
      cadence: parsed.cadence,
      displayOrder: parsed.displayOrder,
      active: parsed.active
    },
    create: {
      tier: parsed.tier,
      name: parsed.name,
      label: parsed.label,
      secondaryLabel: parsed.secondaryLabel,
      price: parsed.price,
      cadence: parsed.cadence,
      displayOrder: parsed.displayOrder,
      active: parsed.active
    }
  });

  await audit(session.userId, "SAVE_PLAN", parsed.tier, `Updated ${parsed.name}`);
  revalidateOperations();
  redirectWithNotice("/admin/menus", `${parsed.name} plan saved.`);
}

const menuItemSchema = z.object({
  planId: z.string().min(1),
  weekday: z.string().min(2),
  itemText: z.string().min(2),
  displayOrder: z.coerce.number().int().default(0)
});

export async function addMenuItem(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);
  const parsed = menuItemSchema.parse(Object.fromEntries(formData));

  await prisma.mealMenuItem.create({
    data: {
      planId: parsed.planId,
      weekday: parsed.weekday,
      itemText: parsed.itemText,
      displayOrder: parsed.displayOrder
    }
  });

  await audit(session.userId, "ADD_MENU_ITEM", parsed.planId, `${parsed.weekday}: ${parsed.itemText}`);
  revalidateOperations();
  redirectWithNotice("/admin/menus", "Menu item added.");
}

export async function deactivateMenuItem(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.mealMenuItem.update({ where: { id }, data: { active: false } });
  await audit(session.userId, "DEACTIVATE_MENU_ITEM", id, "Menu item hidden");
  revalidateOperations();
  redirectWithNotice("/admin/menus", "Menu item hidden from public menu.");
}

const frozenSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  pack: z.string().min(2),
  price: z.coerce.number().int().min(1),
  stockNote: z.string().optional(),
  displayOrder: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(false)
});

export async function saveFrozenProduct(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);
  const parsed = frozenSchema.parse({
    ...Object.fromEntries(formData),
    active: formData.get("active") === "on"
  });

  if (parsed.id) {
    await prisma.frozenProduct.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        pack: parsed.pack,
        price: parsed.price,
        stockNote: parsed.stockNote || null,
        displayOrder: parsed.displayOrder,
        active: parsed.active
      }
    });
  } else {
    await prisma.frozenProduct.create({
      data: {
        name: parsed.name,
        pack: parsed.pack,
        price: parsed.price,
        stockNote: parsed.stockNote || null,
        displayOrder: parsed.displayOrder,
        active: parsed.active
      }
    });
  }

  await audit(session.userId, "SAVE_FROZEN_PRODUCT", parsed.id || "new", parsed.name);
  revalidateOperations();
  redirectWithNotice("/admin/frozen-goods", `${parsed.name} saved.`);
}

export async function deactivateFrozenProduct(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.frozenProduct.update({ where: { id }, data: { active: false } });
  await audit(session.userId, "DEACTIVATE_FROZEN_PRODUCT", id, "Frozen product hidden");
  revalidateOperations();
  redirectWithNotice("/admin/frozen-goods", "Frozen item hidden from customers.");
}

const settingsKeys = [
  "BUSINESS_PHONE",
  "BUSINESS_WHATSAPP_URL",
  "BANK_ACCOUNT_TITLE",
  "BANK_ACCOUNT_NUMBER",
  "BANK_IBAN",
  "BANK_NAME",
  "LOGISTICS_POLICY"
];

export async function saveBusinessSettings(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);

  for (const key of settingsKeys) {
    const value = String(formData.get(key) ?? "");
    await prisma.businessSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  await audit(session.userId, "SAVE_SETTINGS", "business_settings", "Updated contact, bank, and policy settings");
  revalidateOperations();
  redirectWithNotice("/admin/settings", "Business settings saved.");
}

export async function updateOrderStatus(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);
  const id = z.string().min(1).parse(formData.get("id"));
  const status = z.nativeEnum(OrderStatus).parse(formData.get("status"));

  await prisma.order.update({ where: { id }, data: { status } });
  await audit(session.userId, "UPDATE_ORDER_STATUS", id, `Order status changed to ${status}`);
  revalidatePath("/admin/orders");
  redirectWithNotice("/admin/orders", `Order marked ${status.replaceAll("_", " ").toLowerCase()}.`);
}

export async function updateDeliveryStatus(formData: FormData) {
  const session = await requireAdminSession();
  await assertAdminRateLimit(session.userId);
  const id = z.string().min(1).parse(formData.get("id"));
  const status = z.nativeEnum(DeliveryStatus).parse(formData.get("status"));
  const issueNote = cleanText(formData.get("issueNote"), 240);
  const returnTo = safeAdminDeliveriesPath(cleanText(formData.get("returnTo"), 240));

  const delivery = await prisma.subscriptionDelivery.update({
    where: { id },
    data: {
      status,
      deliveredAt: status === "DELIVERED" ? new Date() : null,
      issueNote: status === "ISSUE" ? issueNote || "Delivery issue flagged by admin." : null
    },
    include: {
      user: true
    }
  });

  await audit(session.userId, "UPDATE_DELIVERY_STATUS", id, `Delivery marked ${status}`);

  // Trigger n8n webhook notification
  if (delivery) {
    await triggerN8nWebhook("delivery.updated", {
      deliveryId: delivery.id,
      subscriptionId: delivery.subscriptionId,
      status,
      weekday: delivery.weekday,
      deliverySlot: delivery.deliverySlot,
      menuItems: delivery.menuItems,
      issueNote: status === "ISSUE" ? issueNote || "Delivery issue flagged by admin." : null,
      customerName: delivery.user.name,
      customerPhone: delivery.user.phone,
      customerEmail: delivery.user.email,
      addressType: delivery.user.addressType,
      addressLine: delivery.user.addressLine,
      area: delivery.user.area
    });
  }

  revalidatePath("/admin/deliveries");
  revalidatePath("/account");
  redirectWithNotice(returnTo, `Delivery marked ${status.toLowerCase()}.`);
}

async function audit(adminId: string, action: string, target: string, summary: string) {
  await prisma.adminAuditLog.create({
    data: { adminId, action, target, summary }
  });
}

function revalidateOperations() {
  revalidatePath("/");
  revalidatePath("/subscriptions");
  revalidatePath("/frozen-goods");
  revalidatePath("/custom-order");
  revalidatePath("/events");
  revalidatePath("/admin");
  revalidatePath("/admin/menus");
  revalidatePath("/admin/frozen-goods");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/deliveries");
}

function redirectWithNotice(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}notice=${encodeURIComponent(message)}`);
}

function safeAdminDeliveriesPath(path: string) {
  if (!path.startsWith("/admin/deliveries")) return "/admin/deliveries";
  if (path.startsWith("//") || path.includes("://")) return "/admin/deliveries";
  return path;
}
