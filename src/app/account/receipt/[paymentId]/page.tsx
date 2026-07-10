import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/current-session";
import { prisma } from "@/lib/prisma";
import { ReceiptClient } from "@/components/receipt-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Receipt",
  robots: {
    index: false,
    follow: false
  }
};

export default async function ReceiptPage({
  params
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?next=/account");
  }

  const { paymentId } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          addressType: true,
          addressLine: true,
          area: true
        }
      },
      subscription: {
        select: {
          tier: true,
          total: true,
          requestedDeliverySlot: true,
          approvedDeliverySlot: true,
          notes: true
        }
      },
      order: {
        select: {
          type: true,
          title: true,
          details: true,
          addressLine: true,
          area: true,
          estimatedTotal: true,
          guestCount: true,
          deliveryDate: true,
          deliverySlot: true
        }
      }
    }
  });

  if (!payment) {
    notFound();
  }

  // Security authorization: only admins or the user who owns the payment can view the receipt
  if (session.role !== "ADMIN" && payment.userId !== session.userId) {
    notFound();
  }

  // Map database enum to a clean type before passing to Client Component
  const paymentDetails = {
    ...payment,
    subscription: payment.subscription
      ? {
          ...payment.subscription,
          tier: payment.subscription.tier
        }
      : null,
    order: payment.order
      ? {
          ...payment.order,
          type: payment.order.type
        }
      : null
  };

  return <ReceiptClient payment={paymentDetails} />;
}
