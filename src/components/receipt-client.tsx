"use client";

import Link from "next/link";
import { ArrowLeft, Printer, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { money } from "@/lib/format";

type PaymentDetails = {
  id: string;
  amount: number;
  screenshotUrl: string;
  status: string;
  createdAt: Date;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  user: {
    name: string;
    email: string;
    phone: string;
    addressType: string | null;
    addressLine: string | null;
    area: string | null;
  };
  subscription: {
    tier: string;
    total: number;
    requestedDeliverySlot: string | null;
    approvedDeliverySlot: string | null;
    notes: string | null;
  } | null;
  order: {
    type: string;
    title: string;
    details: string;
    addressLine: string;
    area: string;
    estimatedTotal: number;
    guestCount: number | null;
    deliveryDate: Date | null;
    deliverySlot: string | null;
  } | null;
};

export function ReceiptClient({ payment }: { payment: PaymentDetails }) {
  const tokenNumber = `UT-${new Date(payment.createdAt).getFullYear()}-${payment.id.slice(-8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const statusIcons: Record<string, React.ReactNode> = {
    APPROVED: <CheckCircle2 className="h-5 w-5 text-brand-green" />,
    PENDING: <Clock className="h-5 w-5 text-brand-ochre" />,
    REJECTED: <AlertCircle className="h-5 w-5 text-red-600" />
  };

  const statusText: Record<string, string> = {
    APPROVED: "Approved & Verified",
    PENDING: "Pending Verification",
    REJECTED: "Declined"
  };

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Navigation & Controls */}
        <div className="no-print mb-8 flex items-center justify-between border-b border-brand-green/10 pb-5">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-ochre transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to account
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-green/90 transition shadow-sharp"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        </div>

        {/* Printable Invoice Container */}
        <article className="border border-brand-green/15 bg-brand-cream p-6 sm:p-10 shadow-sharp print:border-none print:shadow-none print:p-0">
          
          {/* Receipt Header */}
          <div className="flex flex-col justify-between gap-6 border-b border-brand-green/15 pb-8 sm:flex-row sm:items-start">
            <div>
              <p className="font-display text-2xl font-bold tracking-wider text-brand-green">
                URBAN TIFFIN AND EVENTS
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-brand-ochre font-bold">
                Premium Meal Plans & Catering
              </p>
              <p className="mt-4 text-sm text-brand-green/70">
                Lahore, Pakistan<br />
                WhatsApp: +92 308 2225656<br />
                Email: support@urbantiffin.local
              </p>
            </div>
            
            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-2 border border-brand-green/10 bg-brand-cream-dark px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-green">
                {statusIcons[payment.status] || null}
                <span>{statusText[payment.status]}</span>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-ochre">Receipt Token Number</p>
              <p className="font-mono text-lg font-bold tracking-wider text-brand-green mt-1">{tokenNumber}</p>
            </div>
          </div>

          {/* Customer & Transaction Meta */}
          <div className="grid gap-8 py-8 border-b border-brand-green/15 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ochre mb-3">Customer Information</h3>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-xs text-brand-green/50 font-semibold">Name</dt>
                  <dd className="font-semibold text-brand-green">{payment.user.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-green/50 font-semibold">Contact</dt>
                  <dd className="text-brand-green/80">{payment.user.email} · {payment.user.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-green/50 font-semibold">Delivery Address ({payment.user.addressType})</dt>
                  <dd className="text-brand-green/80 mt-0.5">{payment.user.addressLine}, {payment.user.area}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ochre mb-3">Payment Details</h3>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-xs text-brand-green/50 font-semibold">Payment Method</dt>
                  <dd className="font-semibold text-brand-green">Manual Bank Transfer</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-green/50 font-semibold">Submission Date</dt>
                  <dd className="text-brand-green/80" suppressHydrationWarning>{new Date(payment.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</dd>
                </div>
                {payment.reviewedAt && (
                  <div>
                    <dt className="text-xs text-brand-green/50 font-semibold">Verification Date</dt>
                    <dd className="text-brand-green/80" suppressHydrationWarning>
                      {new Date(payment.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Receipt Itemization */}
          <div className="py-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ochre mb-4">Itemized Description</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-green/15 text-xs font-bold uppercase tracking-wider text-brand-green/60">
                  <th className="py-3 font-semibold">Service Details</th>
                  <th className="py-3 text-right font-semibold">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-green/10">
                {payment.subscription ? (
                  <tr>
                    <td className="py-4">
                      <p className="font-semibold text-base text-brand-green">
                        {payment.subscription.tier.charAt(0) + payment.subscription.tier.slice(1).toLowerCase()} Tiffin Meal Plan
                      </p>
                      <p className="mt-1 text-xs text-brand-green/60">
                        Monthly subscription · Preferred Delivery slot: {payment.subscription.approvedDeliverySlot || payment.subscription.requestedDeliverySlot || "Standard Time"}
                      </p>
                      {payment.subscription.notes && (
                        <p className="mt-2 text-xs italic text-brand-green/50">Notes: {payment.subscription.notes}</p>
                      )}
                    </td>
                    <td className="py-4 text-right font-semibold text-brand-green">
                      {money(payment.subscription.total)}
                    </td>
                  </tr>
                ) : payment.order ? (
                  <tr>
                    <td className="py-4">
                      <p className="font-semibold text-base text-brand-green">{payment.order.title}</p>
                      <p className="mt-1 text-xs text-brand-green/60">
                        Category: {payment.order.type.replaceAll("_", " ")}
                        {payment.order.deliveryDate && (
                          <span suppressHydrationWarning>
                            {" "}· Delivery Date: {new Date(payment.order.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                        {payment.order.deliverySlot && ` · Slot: ${payment.order.deliverySlot}`}
                        {payment.order.guestCount && ` · Guests: ${payment.order.guestCount}`}
                      </p>
                      <p className="mt-2 text-xs text-brand-green/72">{payment.order.details}</p>
                    </td>
                    <td className="py-4 text-right font-semibold text-brand-green">
                      {money(payment.order.estimatedTotal)}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-4 font-semibold text-brand-green">General Service Charge</td>
                    <td className="py-4 text-right font-semibold text-brand-green">{money(payment.amount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="border-t border-brand-green/15 pt-6">
            <div className="ml-auto max-w-xs grid gap-3 text-sm">
              <div className="flex justify-between text-brand-green/70">
                <span>Subtotal</span>
                <span>{money(payment.amount)}</span>
              </div>
              <div className="flex justify-between text-brand-green/70">
                <span>Sales Tax (0%)</span>
                <span>{money(0)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-green/15 pt-3 text-base font-bold text-brand-green">
                <span>Total Paid</span>
                <span>{money(payment.amount)}</span>
              </div>
            </div>
          </div>

          {/* Rejection / Issue Details */}
          {payment.status === "REJECTED" && (
            <div className="mt-8 border border-red-200 bg-red-50/50 p-4 text-sm text-red-800">
              <p className="font-bold">Payment Rejection Notice:</p>
              <p className="mt-1">{payment.rejectionReason || "The uploaded bank screenshot could not be verified by the admin team. Please verify the amount and upload a valid screenshot."}</p>
            </div>
          )}

          {/* Footer Notice */}
          <div className="mt-12 text-center text-xs text-brand-green/50 border-t border-brand-green/10 pt-6">
            <p>Thank you for choosing URBAN TIFFIN AND EVENTS.</p>
            <p className="mt-1">This is a system-generated electronic receipt. No physical signature is required.</p>
          </div>
        </article>

        {/* Customer Receipt Screenshot Attachment Preview (Hidden on print) */}
        <div className="no-print mt-8 border border-brand-green/15 bg-brand-cream p-6 shadow-sharp">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ochre mb-4">Your Uploaded Proof of Payment</h3>
          <div className="flex justify-center border border-brand-green/10 bg-brand-cream-dark p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/receipts/${payment.id}`}
              alt="Uploaded bank transfer screenshot"
              className="max-h-96 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
