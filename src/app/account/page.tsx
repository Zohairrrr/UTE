import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { currentDeliveryWeek, ensureCurrentWeekDeliveries } from "@/lib/delivery";
import { money } from "@/lib/format";
import { getCurrentSession } from "@/lib/current-session";
import { prisma } from "@/lib/prisma";
import { CancelButton } from "@/components/cancel-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Account",
  robots: {
    index: false,
    follow: false
  }
};

const statusTone: Record<string, string> = {
  PENDING: "border-brand-ochre/45 text-brand-ochre",
  DELIVERED: "border-brand-green bg-brand-green text-brand-cream",
  SKIPPED: "border-brand-green/20 text-brand-green/58",
  ISSUE: "border-brand-ochre bg-brand-cream text-brand-green"
};

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/account");

  const active = await prisma.subscription.findFirst({
    where: {
      userId: session.userId,
      status: "CONFIRMED",
      endDate: { gte: new Date() }
    },
    orderBy: { endDate: "desc" }
  });

  if (active) {
    await ensureCurrentWeekDeliveries(active.id);
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, amount: true, createdAt: true, rejectionReason: true }
      },
      deliveries: {
        where: {
          deliveryDate: {
            gte: currentDeliveryWeek()[0].date,
            lte: endOfWeek()
          }
        },
        orderBy: { deliveryDate: "asc" }
      }
    }
  });

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, amount: true, createdAt: true, rejectionReason: true }
      }
    }
  });

  const current = subscriptions.find((subscription) => subscription.id === active?.id) ?? subscriptions[0] ?? null;
  const latestPayment = current?.payments[0] ?? null;
  const progress = current ? subscriptionProgress(current.startDate, current.endDate) : null;
  const week = currentDeliveryWeek();
  const deliveriesByTime = new Map(current?.deliveries.map((delivery) => [delivery.deliveryDate.toDateString(), delivery]) ?? []);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-brand-cream">
        <section className="border-b border-brand-green/10 bg-brand-cream-dark">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-bold tracking-[0.26em] text-brand-ochre">CUSTOMER DASHBOARD</p>
            <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h1 className="font-display text-4xl font-semibold tracking-[0.05em] sm:text-6xl">Your Meal Orders</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-green/68">
                  Check your meal plan, payment status, delivery time, and this week&apos;s food.
                </p>
              </div>
              <Link className="inline-flex border border-brand-green bg-brand-green px-5 py-3 text-sm font-semibold text-brand-cream" href="/subscriptions">
                Choose another plan
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div className="grid content-start gap-6">
            <article className="border border-brand-green/15 bg-brand-cream p-6">
              <p className="text-sm font-bold text-brand-ochre">Meal Plan</p>
              {current ? (
                <>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-3xl font-semibold tracking-[0.06em] sm:text-4xl">{formatTier(current.tier)}</h2>
                      <p className="mt-2 text-sm text-brand-green/62">{money(current.total)} monthly plan</p>
                    </div>
                    <span className="border border-brand-green/15 px-3 py-1 text-xs font-semibold">{current.status.replaceAll("_", " ")}</span>
                  </div>

                  {progress ? (
                    <div className="mt-8">
                      <div className="mb-2 flex justify-between text-sm font-semibold">
                        <span>{progress.daysLeft} days left</span>
                        <span>{progress.percent}% used</span>
                      </div>
                      <div className="h-3 border border-brand-green/20 bg-brand-cream-dark">
                        <div className="h-full bg-brand-green" style={{ width: `${progress.percent}%` }} />
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-brand-green/68 sm:grid-cols-2">
                        <span>Started: {formatDate(current.startDate)}</span>
                        <span>Ends: {formatDate(current.endDate)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6">
                      <p className="text-sm leading-6 text-brand-green/68">
                        Payment is still under review. Your 30-day plan starts after admin approval.
                      </p>
                      {current.status === "PENDING_PAYMENT" && (
                        <CancelButton id={current.id} type="subscription" />
                      )}
                    </div>
                  )}

                  <div className="mt-6 grid gap-3 border-t border-brand-green/10 pt-5 text-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                      <span className="text-brand-green/55">Requested slot</span>
                      <span className="font-semibold">{current.requestedDeliverySlot ?? "Not requested"}</span>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                      <span className="text-brand-green/55">Approved slot</span>
                      <span className="font-semibold">{current.approvedDeliverySlot ?? "Pending approval"}</span>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                      <span className="text-brand-green/55">Payment</span>
                      <span className="font-semibold flex items-center gap-2">
                        <span>{latestPayment?.status ?? "Not linked"}</span>
                        {latestPayment && (
                          <Link href={`/account/receipt/${latestPayment.id}`} className="text-xs font-bold text-brand-ochre hover:underline">
                            View Receipt
                          </Link>
                        )}
                      </span>
                    </div>
                    {latestPayment?.status === "REJECTED" ? (
                      <div className="border border-brand-ochre/45 bg-brand-cream-dark p-3 text-sm leading-6 text-brand-green">
                        <span className="font-semibold text-brand-ochre">Denied:</span>{" "}
                        {latestPayment.rejectionReason ?? "Admin rejected this payment screenshot. Upload a new screenshot to try again."}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="mt-5 text-sm leading-6 text-brand-green/68">
                  No meal plan has been submitted yet. Choose a plan to start payment review.
                </div>
              )}
            </article>

            <article className="border border-brand-green/15 bg-brand-cream p-6">
              <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">Plan History</h2>
              <div className="mt-5 grid gap-3">
                {subscriptions.length ? (
                  subscriptions.map((subscription) => (
                    <div key={subscription.id} className="border border-brand-green/10 bg-brand-cream-dark p-4 text-sm">
                      <div className="flex justify-between gap-3 font-semibold">
                        <span>{formatTier(subscription.tier)}</span>
                        <span>{subscription.status.replaceAll("_", " ")}</span>
                      </div>
                      <div className="mt-2 text-brand-green/62">{formatDate(subscription.createdAt)} · {money(subscription.total)}</div>
                      {subscription.payments.length ? (
                        <div className="mt-3 grid gap-2">
                          {subscription.payments.slice(0, 3).map((payment) => (
                            <div key={payment.id} className="flex flex-wrap justify-between items-center gap-2 border-t border-brand-green/10 pt-2 text-xs text-brand-green/62">
                              <div>
                                <span>{payment.status} payment screenshot</span>
                                <span className="mx-2">·</span>
                                <span>{formatDate(payment.createdAt)} · {money(payment.amount)}</span>
                              </div>
                              <Link href={`/account/receipt/${payment.id}`} className="font-semibold text-brand-ochre hover:underline">
                                View Receipt
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-brand-green/62">No history yet.</p>
                )}
              </div>
            </article>

            <article className="border border-brand-green/15 bg-brand-cream p-6">
              <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">Custom & Frozen Orders</h2>
              <div className="mt-5 grid gap-3">
                {orders.length ? (
                  orders.map((order) => (
                    <div key={order.id} className="border border-brand-green/10 bg-brand-cream-dark p-4 text-sm">
                      <div className="flex justify-between gap-3 font-semibold">
                        <span>{order.title}</span>
                        <span className="border border-brand-green/15 px-2 py-0.5 text-xs font-semibold">
                          {order.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-brand-ochre font-bold">
                        Type: {order.type.replaceAll("_", " ")}
                      </div>
                      <p className="mt-2 text-brand-green/72 text-xs line-clamp-2">{order.details}</p>
                      <div className="mt-2 text-brand-green/62 text-xs">
                        {order.deliveryDate ? `Delivery: ${formatDate(order.deliveryDate)}` : "No delivery date set"} · {money(order.estimatedTotal)}
                      </div>
                      {order.status === "PENDING_PAYMENT" && (
                        <CancelButton id={order.id} type="order" />
                      )}
                      
                      {order.payments.length ? (
                        <div className="mt-3 grid gap-2">
                          {order.payments.map((payment) => (
                            <div key={payment.id} className="flex flex-wrap justify-between items-center gap-2 border-t border-brand-green/10 pt-2 text-xs text-brand-green/62">
                              <div>
                                <span>{payment.status} payment screenshot</span>
                                <span className="mx-2">·</span>
                                <span>{formatDate(payment.createdAt)} · {money(payment.amount)}</span>
                              </div>
                              <Link href={`/account/receipt/${payment.id}`} className="font-semibold text-brand-ochre hover:underline">
                                View Receipt
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-brand-green/62">No orders placed yet.</p>
                )}
              </div>
            </article>
          </div>

          <article className="border border-brand-green/15 bg-brand-cream p-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-green/10 pb-5">
              <div>
                <p className="text-sm font-bold text-brand-ochre">This week</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-[0.06em] sm:text-4xl">Delivery Status</h2>
              </div>
              <span className="text-sm font-semibold text-brand-green/65">{current?.approvedDeliverySlot ?? "Slot pending"}</span>
            </div>

            <div className="mt-5 grid gap-3">
              {week.map(({ weekday, date }) => {
                const delivery = deliveriesByTime.get(date.toDateString());
                const isToday = date.toDateString() === new Date().toDateString();
                const outOfWindow = current?.startDate && current?.endDate
                  ? date < startOfDay(current.startDate) || date > endOfDay(current.endDate)
                  : false;
                const status = delivery?.status ?? (outOfWindow ? "SKIPPED" : current?.status === "CONFIRMED" ? "PENDING" : "PENDING_PAYMENT");
                return (
                  <div key={weekday} className={isToday ? "border border-brand-ochre bg-brand-cream-dark p-4" : "border border-brand-green/10 p-4"}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{weekday}</div>
                        <div className="mt-1 text-xs text-brand-green/55">{formatDate(date)}</div>
                      </div>
                      <span className={`border px-3 py-1 text-xs font-semibold ${statusTone[status] ?? "border-brand-green/15 text-brand-green/60"}`}>
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <ul className="mt-4 grid gap-2 text-sm text-brand-green/72">
                      {(delivery?.menuItems.length ? delivery.menuItems : ["Menu appears after plan approval."]).map((item) => (
                        <li key={item} className="border-b border-brand-green/10 pb-2">{item}</li>
                      ))}
                    </ul>
                    {delivery?.issueNote ? <p className="mt-3 text-sm font-semibold text-brand-ochre">{delivery.issueNote}</p> : null}
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

function endOfWeek() {
  const week = currentDeliveryWeek();
  const end = new Date(week[week.length - 1].date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function subscriptionProgress(startDate: Date | null, endDate: Date | null) {
  if (!startDate || !endDate) return null;
  const total = Math.max(1, endDate.getTime() - startDate.getTime());
  const elapsed = Math.min(total, Math.max(0, Date.now() - startDate.getTime()));
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return {
    daysLeft,
    percent: Math.min(100, Math.round((elapsed / total) * 100))
  };
}

function formatTier(tier: string) {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function formatDate(date: Date | null) {
  if (!date) return "Pending";
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}
