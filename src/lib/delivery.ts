import type { Prisma, Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const deliveryWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function currentDeliveryWeek(now = new Date()) {
  const start = startOfDay(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? 1 : day === 6 ? 2 : 1 - day;
  const monday = new Date(start);
  monday.setDate(start.getDate() + diffToMonday);
  return deliveryWeekdays.map((weekday, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { weekday, date };
  });
}

function inSubscriptionWindow(date: Date, subscription: Pick<Subscription, "startDate" | "endDate">) {
  if (!subscription.startDate || !subscription.endDate) return false;
  const current = startOfDay(date).getTime();
  return current >= startOfDay(subscription.startDate).getTime() && current <= startOfDay(subscription.endDate).getTime();
}

export async function ensureCurrentWeekDeliveries(subscriptionId: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  const subscription = await client.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      deliveries: true
    }
  });

  if (!subscription || subscription.status !== "CONFIRMED" || !subscription.approvedDeliverySlot) return;

  const plan = await client.subscriptionPlan.findUnique({
    where: { tier: subscription.tier },
    include: {
      menuItems: {
        where: { active: true },
        orderBy: [{ weekday: "asc" }, { displayOrder: "asc" }]
      }
    }
  });

  const existingDates = new Set(subscription.deliveries.map((delivery) => startOfDay(delivery.deliveryDate).getTime()));
  const rows = currentDeliveryWeek()
    .filter(({ date }) => inSubscriptionWindow(date, subscription))
    .filter(({ date }) => !existingDates.has(startOfDay(date).getTime()))
    .map(({ weekday, date }) => ({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      deliveryDate: date,
      weekday,
      deliverySlot: subscription.approvedDeliverySlot || subscription.requestedDeliverySlot || "To be confirmed",
      menuItems: plan?.menuItems.filter((item) => item.weekday === weekday).map((item) => item.itemText) ?? []
    }));

  if (rows.length) {
    await client.subscriptionDelivery.createMany({
      data: rows,
      skipDuplicates: true
    });
  }
}
