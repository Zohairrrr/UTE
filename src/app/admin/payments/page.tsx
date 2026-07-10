import { AdminDesk } from "@/components/admin-desk";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdminSession();
  const payments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, phone: true, addressType: true, addressLine: true, area: true }
      },
      subscription: { select: { tier: true, total: true, requestedDeliverySlot: true, approvedDeliverySlot: true, notes: true } },
      order: {
        select: {
          type: true,
          title: true,
          details: true,
          addressLine: true,
          area: true,
          estimatedTotal: true,
          deliveryDate: true
        }
      }
    }
  });

  return (
    <AdminShell title="Payment Review">
      <AdminDesk
        payments={payments.map((payment) => ({
          ...payment,
          screenshotUrl: `/api/admin/receipts/${payment.id}`,
          createdAt: payment.createdAt.toISOString(),
          order: payment.order
            ? {
                ...payment.order,
                deliveryDate: payment.order.deliveryDate?.toISOString() ?? null
              }
            : null
        }))}
      />
    </AdminShell>
  );
}
