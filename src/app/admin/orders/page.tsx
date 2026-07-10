import { updateOrderStatus } from "@/actions/admin-ops";
import { AdminPanel, AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = ["PENDING_PAYMENT", "CONFIRMED", "REJECTED", "FULFILLED", "CANCELLED"];

export default async function AdminOrdersPage() {
  await requireAdminSession();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true, area: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true }
      }
    }
  });

  return (
    <AdminShell title="Orders And Requests">
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-8">
        {orders.length ? (
          orders.map((order) => (
            <AdminPanel key={order.id}>
              <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-ochre">{order.type}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-[0.06em]">{order.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-green/70">{order.details}</p>
                  <div className="mt-4 grid gap-2 text-sm text-brand-green/70 sm:grid-cols-3">
                    <span>{order.user.name}</span>
                    <span>{order.user.phone}</span>
                    <span>{order.area}</span>
                  </div>
                </div>
                <form action={updateOrderStatus} className="grid content-start gap-3">
                  <input type="hidden" name="id" value={order.id} />
                  <div className="font-semibold">{money(order.finalTotal ?? order.estimatedTotal)}</div>
                  <select name="status" defaultValue={order.status}>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button className="border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream">
                    Update status
                  </button>
                </form>
              </div>
            </AdminPanel>
          ))
        ) : (
          <AdminPanel>No orders have been submitted yet.</AdminPanel>
        )}
      </section>
    </AdminShell>
  );
}
