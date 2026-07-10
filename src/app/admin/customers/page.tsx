import { AdminPanel, AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdminSession();
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      orders: { select: { id: true } },
      subscriptions: { select: { id: true, status: true } },
      payments: { where: { status: "APPROVED" }, select: { amount: true } }
    }
  });

  return (
    <AdminShell title="Customer Directory">
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-8">
        {customers.map((customer) => (
          <AdminPanel key={customer.id}>
            <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">{customer.name}</h2>
                <div className="mt-4 grid gap-2 text-sm text-brand-green/70 sm:grid-cols-2 lg:grid-cols-4">
                  <span>{customer.email}</span>
                  <span>{customer.phone}</span>
                  <span>{customer.addressType ?? "Address type missing"}</span>
                  <span>{customer.area ?? "Area missing"}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-brand-green/65">{customer.addressLine}</p>
              </div>
              <div className="grid gap-2 text-sm">
                <span>Orders: {customer.orders.length}</span>
                <span>Meal plans: {customer.subscriptions.length}</span>
                <span>
                  Approved spend: {money(customer.payments.reduce((total, payment) => total + payment.amount, 0))}
                </span>
              </div>
            </div>
          </AdminPanel>
        ))}
      </section>
    </AdminShell>
  );
}
