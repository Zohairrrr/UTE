import { updateDeliveryStatus } from "@/actions/admin-ops";
import { AdminPanel, AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { getSearchParam } from "@/lib/page-props";
import { prisma } from "@/lib/prisma";
import type { DeliveryStatus, Prisma } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statuses: DeliveryStatus[] = ["PENDING", "DELIVERED", "SKIPPED", "ISSUE"];
const pageSize = 50;

export default async function AdminDeliveriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminSession();
  const params = await searchParams;
  const query = cleanQuery(getSearchParam(params, "q"));
  const dateValue = parseDateValue(getSearchParam(params, "date")) ?? todayInputValue();
  const statusValue = getSearchParam(params, "status");
  const status = statuses.includes(statusValue as DeliveryStatus) ? statusValue as DeliveryStatus : "";
  const page = Math.max(1, Number.parseInt(getSearchParam(params, "page") || "1", 10) || 1);
  const day = dateRange(dateValue);
  const where: Prisma.SubscriptionDeliveryWhereInput = {
    deliveryDate: {
      gte: day.start,
      lte: day.end
    },
    ...(status ? { status } : {}),
    ...(query
      ? {
          user: {
            OR: [
              { phone: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { area: { contains: query, mode: "insensitive" } },
              { addressLine: { contains: query, mode: "insensitive" } }
            ]
          }
        }
      : {})
  };
  const baseParams = new URLSearchParams();
  if (query) baseParams.set("q", query);
  if (dateValue) baseParams.set("date", dateValue);
  if (status) baseParams.set("status", status);
  const returnTo = `/admin/deliveries?${baseParams.toString()}${page > 1 ? `&page=${page}` : ""}`;

  const [deliveries, total, statusCounts] = await Promise.all([
    prisma.subscriptionDelivery.findMany({
      where,
      orderBy: [{ deliveryDate: "asc" }, { deliverySlot: "asc" }, { createdAt: "asc" }],
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        user: { select: { name: true, phone: true, area: true, addressLine: true } },
        subscription: { select: { tier: true } }
      }
    }),
    prisma.subscriptionDelivery.count({ where }),
    prisma.subscriptionDelivery.groupBy({
      by: ["status"],
      where: { deliveryDate: { gte: day.start, lte: day.end } },
      _count: { _all: true }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const counts = Object.fromEntries(statusCounts.map((item) => [item.status, item._count._all]));

  return (
    <AdminShell title="Meal Plan Deliveries">
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-8">
        <AdminPanel>
          <form className="grid gap-4 lg:grid-cols-[1.3fr_180px_170px_auto]" action="/admin/deliveries">
            <label className="grid gap-2 text-sm font-semibold">
              <span>Find customer</span>
              <input
                name="q"
                defaultValue={query}
                placeholder="Phone, customer name, area, or address"
                className="border-brand-green/15 bg-brand-cream-dark"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span>Delivery date</span>
              <input name="date" type="date" defaultValue={dateValue} className="border-brand-green/15 bg-brand-cream-dark" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span>Status</span>
              <select name="status" defaultValue={status} className="border-brand-green/15 bg-brand-cream-dark">
                <option value="">All statuses</option>
                {statuses.map((nextStatus) => (
                  <option key={nextStatus} value={nextStatus}>{formatStatus(nextStatus)}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button className="border border-brand-green bg-brand-green px-5 py-3 text-sm font-semibold text-brand-cream">
                Search
              </button>
              <Link className="border border-brand-green/15 px-5 py-3 text-sm font-semibold transition hover:bg-brand-cream-dark" href="/admin/deliveries">
                Reset
              </Link>
            </div>
          </form>
          <div className="mt-5 grid gap-3 border-t border-brand-green/10 pt-4 text-sm text-brand-green/70 sm:grid-cols-5">
            <Metric label="Showing" value={`${deliveries.length} of ${total}`} />
            <Metric label="Pending" value={String(counts.PENDING ?? 0)} />
            <Metric label="Delivered" value={String(counts.DELIVERED ?? 0)} />
            <Metric label="Skipped" value={String(counts.SKIPPED ?? 0)} />
            <Metric label="Issues" value={String(counts.ISSUE ?? 0)} />
          </div>
        </AdminPanel>

        {deliveries.length ? (
          deliveries.map((delivery) => (
            <AdminPanel key={delivery.id} className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-bold text-brand-ochre">{delivery.weekday}</span>
                  <span>{delivery.deliveryDate.toLocaleDateString()}</span>
                  <span>{delivery.deliverySlot}</span>
                  <span className="border border-brand-green/15 px-2 py-1 text-xs font-semibold">{delivery.status}</span>
                </div>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[0.06em]">{delivery.user.name}</h2>
                <p className="mt-2 text-sm leading-6 text-brand-green/68">
                  {delivery.subscription.tier} plan, {delivery.user.phone}, {delivery.user.area}
                </p>
                <p className="mt-2 text-sm leading-6 text-brand-green/68">{delivery.user.addressLine}</p>
                <ul className="mt-4 grid gap-2 text-sm">
                  {delivery.menuItems.map((item) => (
                    <li key={item} className="border-b border-brand-green/10 pb-2">{item}</li>
                  ))}
                </ul>
              </div>
              <form action={updateDeliveryStatus} className="grid content-start gap-3 border border-brand-green/10 bg-brand-cream-dark p-4">
                <input type="hidden" name="id" value={delivery.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <select name="status" defaultValue={delivery.status}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{formatStatus(status)}</option>
                  ))}
                </select>
                <input name="issueNote" placeholder="Issue note, if needed" defaultValue={delivery.issueNote ?? ""} />
                <button className="border border-brand-green bg-brand-green px-4 py-3 text-sm font-semibold text-brand-cream">
                  Update delivery
                </button>
              </form>
            </AdminPanel>
          ))
        ) : (
          <AdminPanel>No deliveries match this date and search.</AdminPanel>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-brand-green/62">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link className="border border-brand-green/15 px-4 py-2 text-sm font-semibold hover:bg-brand-cream-dark" href={paginationHref(baseParams, page - 1)}>
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link className="border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream" href={paginationHref(baseParams, page + 1)}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brand-green/10 bg-brand-cream-dark px-3 py-2">
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-green/48">{label}</div>
      <div className="mt-1 font-semibold text-brand-green">{value}</div>
    </div>
  );
}

function cleanQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

function parseDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function dateRange(value: string) {
  const start = new Date(`${value}T00:00:00`);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function paginationHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  if (page > 1) next.set("page", String(page));
  else next.delete("page");
  return `/admin/deliveries?${next.toString()}`;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}
