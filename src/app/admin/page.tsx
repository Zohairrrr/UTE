import Link from "next/link";
import { AdminPanel, AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();
  const [pendingPayments, orders, customers, plans, frozenProducts, recentActivity] = await Promise.all([
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.subscriptionPlan.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.frozenProduct.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 })
  ]);
  const activeRevenue = await prisma.payment.aggregate({
    where: { status: "APPROVED" },
    _sum: { amount: true }
  });

  return (
    <AdminShell title="Admin Dashboard">
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-8 lg:grid-cols-4">
        {[
          ["Pending payments", pendingPayments, "/admin/payments"],
          ["Orders", orders, "/admin/orders"],
          ["Customers", customers, "/admin/customers"],
          ["Approved revenue", money(activeRevenue._sum.amount ?? 0), "/admin/payments"]
        ].map(([label, value, href]) => (
          <Link key={label} href={String(href)} className="border border-brand-green/15 bg-brand-cream p-5 transition hover:bg-brand-cream-dark">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-ochre">{label}</p>
            <div className="mt-6 font-display text-4xl font-semibold tracking-[0.06em]">{value}</div>
          </Link>
        ))}
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-8 lg:grid-cols-[1fr_1fr_0.85fr]">
        <AdminPanel>
          <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">Meal Plans And Menus</h2>
          <div className="mt-5 divide-y divide-brand-green/10">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold">{plan.name}</span>
                <span>{money(plan.price)} / {plan.cadence}</span>
              </div>
            ))}
          </div>
          <Link className="mt-6 inline-flex border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream" href="/admin/menus">
            Manage menus
          </Link>
        </AdminPanel>
        <AdminPanel>
          <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">Frozen Goods</h2>
          <div className="mt-5 divide-y divide-brand-green/10">
            {frozenProducts.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold">{item.name}</span>
                <span className={item.active ? "text-brand-green/70" : "text-brand-ochre"}>{item.active ? "Active" : "Hidden"}</span>
              </div>
            ))}
          </div>
          <Link className="mt-6 inline-flex border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream" href="/admin/frozen-goods">
            Manage frozen goods
          </Link>
        </AdminPanel>
        <AdminPanel>
          <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">Recent Activity</h2>
          <div className="mt-5 divide-y divide-brand-green/10">
            {recentActivity.length ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="py-3 text-sm">
                  <div className="font-semibold">{activity.action.replaceAll("_", " ")}</div>
                  <div className="mt-1 text-brand-green/62">{activity.summary}</div>
                </div>
              ))
            ) : (
              <div className="py-3 text-sm text-brand-green/62">No admin actions recorded yet.</div>
            )}
          </div>
          <Link className="mt-6 inline-flex border border-brand-green/15 px-4 py-2 text-sm font-semibold" href="/admin/orders">
            Review orders
          </Link>
        </AdminPanel>
      </section>
    </AdminShell>
  );
}
