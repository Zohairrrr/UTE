"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { approvePayment, rejectPayment } from "@/actions/admin";
import { money } from "@/lib/format";

type PaymentRow = {
  id: string;
  amount: number;
  screenshotUrl: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string;
    addressType: string | null;
    addressLine: string | null;
    area: string | null;
  };
  subscription: null | {
    tier: string;
    total: number;
    requestedDeliverySlot: string | null;
    approvedDeliverySlot: string | null;
    notes: string | null;
  };
  order: null | {
    type: string;
    title: string;
    details: string;
    addressLine: string;
    area: string;
    estimatedTotal: number;
    deliveryDate: string | null;
  };
};

const spring = { type: "spring" as const, stiffness: 280, damping: 25 };

export function AdminDesk({ payments }: { payments: PaymentRow[] }) {
  const [rows, setRows] = useState(payments);
  const [selected, setSelected] = useState<PaymentRow | null>(payments[0] ?? null);
  const [zoom, setZoom] = useState(false);
  const [isPending, startTransition] = useTransition();

  const removeFromQueue = useCallback((id: string) => {
    const nextRows = rows.filter((payment) => payment.id !== id);
    setRows(nextRows);
    setSelected((active) => (active?.id === id ? (nextRows[0] ?? null) : active));
  }, [rows]);

  const approve = useCallback((id: string, approvedDeliverySlot?: string) => {
    startTransition(async () => {
      try {
        await approvePayment(id, approvedDeliverySlot);
        removeFromQueue(id);
        toast.success("Payment approved and linked record confirmed.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Approval failed.");
      }
    });
  }, [removeFromQueue]);

  const reject = useCallback((id: string) => {
    startTransition(async () => {
      try {
        await rejectPayment(id);
        removeFromQueue(id);
        toast.success("Payment rejected.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Rejection failed.");
      }
    });
  }, [removeFromQueue]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (zoom) {
          setZoom(false);
        } else {
          setSelected(null);
        }
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const index = rows.findIndex((r) => r.id === selected?.id);
        const nextIndex = index + 1 < rows.length ? index + 1 : 0;
        if (rows[nextIndex]) {
          setSelected(rows[nextIndex]);
        }
        return;
      }

      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const index = rows.findIndex((r) => r.id === selected?.id);
        const prevIndex = index - 1 >= 0 ? index - 1 : rows.length - 1;
        if (rows[prevIndex]) {
          setSelected(rows[prevIndex]);
        }
        return;
      }

      if (selected) {
        if (e.key === "a") {
          e.preventDefault();
          const slotInput = document.getElementById(`slot-${selected.id}`) as HTMLInputElement | null;
          approve(selected.id, slotInput?.value);
        } else if (e.key === "r") {
          e.preventDefault();
          reject(selected.id);
        } else if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setZoom((z) => !z);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, rows, zoom, isPending, approve, reject]);

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-brand-green/15 bg-brand-cream">
          <div className="flex items-center justify-between gap-3 border-b border-brand-green/10 p-4">
            <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-brand-ochre" />
              <span className="text-sm font-semibold">{rows.length} pending payments</span>
            </div>
            <span className="border border-brand-ochre/45 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brand-ochre">
              Live queue
            </span>
          </div>
          <div className="divide-y divide-brand-green/10">
            {rows.length ? (
              rows.map((payment) => (
                <motion.button
                  key={payment.id}
                  layout
                  onClick={() => setSelected(payment)}
                  className={
                    selected?.id === payment.id
                      ? "relative grid w-full gap-3 bg-brand-cream-dark p-4 text-left transition sm:grid-cols-[1fr_auto]"
                      : "relative grid w-full gap-3 p-4 text-left transition hover:bg-brand-cream-dark sm:grid-cols-[1fr_auto]"
                  }
                >
                  {selected?.id === payment.id ? (
                    <motion.span layoutId="payment-row-active" className="absolute bottom-0 left-0 top-0 w-1 bg-brand-ochre" transition={spring} />
                  ) : null}
                  <div>
                    <div className="font-semibold">{payment.user.name}</div>
                    <div className="mt-1 text-sm text-brand-green/62">
                      {payment.subscription ? `${payment.subscription.tier} monthly plan` : payment.order?.title}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-semibold">{money(payment.amount)}</div>
                    <div className="mt-1 text-xs text-brand-green/55" suppressHydrationWarning>
                      {new Date(payment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="p-8 text-sm text-brand-green/65">No pending payments are waiting for review.</div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.article
              key={selected.id}
              layoutId={`payment-${selected.id}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={spring}
              className="min-w-0 border border-brand-green/15 bg-brand-cream-dark p-4 sm:p-5"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.26em] text-brand-ochre">PENDING REVIEW</p>
                  <h2 className="mt-2 break-words font-display text-3xl tracking-[0.08em] sm:text-4xl">{selected.user.name}</h2>
                </div>
                <div className="text-right text-sm font-semibold">{money(selected.amount)}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBlock
                  title="Customer"
                  rows={[
                    ["Email", selected.user.email],
                    ["Phone", selected.user.phone],
                    ["Address type", selected.user.addressType ?? "Not captured"],
                    ["Address", selected.user.addressLine ?? "Not captured"],
                    ["Area", selected.user.area ?? "Not captured"]
                  ]}
                />
                <InfoBlock
                  title="Transaction"
                  rows={
                    selected.subscription
                      ? [
                          ["Plan", selected.subscription.tier],
                          ["Total", money(selected.subscription.total)],
                          ["Requested slot", selected.subscription.requestedDeliverySlot ?? "Not requested"],
                          ["Notes", selected.subscription.notes ?? "No notes"]
                        ]
                      : [
                          ["Order type", selected.order?.type ?? "Order"],
                          ["Title", selected.order?.title ?? "Order"],
                          ["Address", selected.order?.addressLine ?? ""],
                          ["Area", selected.order?.area ?? ""],
                          ["Details", selected.order?.details ?? ""]
                        ]
                  }
                />
              </div>

              {selected.subscription ? (
                <label className="mt-6 grid gap-2 text-sm font-semibold">
                  <span>Approved delivery slot</span>
                  <input
                    id={`slot-${selected.id}`}
                    className="border-brand-green/15 bg-brand-cream"
                    defaultValue={selected.subscription.approvedDeliverySlot ?? selected.subscription.requestedDeliverySlot ?? ""}
                    placeholder="1:00 PM to 2:00 PM"
                  />
                </label>
              ) : null}

              <button onClick={() => setZoom(true)} className="mt-6 block w-full border border-brand-green/15 bg-brand-cream p-3 text-left">
                <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                  Uploaded payment screenshot
                  <ExternalLink className="h-4 w-4" />
                </div>
                <ReceiptPreview
                  src={selected.screenshotUrl}
                  alt={`Payment screenshot uploaded by ${selected.user.name}`}
                  className="max-h-[360px] w-full object-contain"
                />
              </button>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  disabled={isPending}
                  onClick={() => approve(selected.id, (document.getElementById(`slot-${selected.id}`) as HTMLInputElement | null)?.value)}
                  className="inline-flex items-center justify-center gap-2 border border-brand-green bg-brand-green px-5 py-4 text-sm font-semibold text-brand-cream disabled:opacity-55"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Approve Payment
                </button>
                <button
                  disabled={isPending}
                  onClick={() => reject(selected.id)}
                  className="inline-flex items-center justify-center gap-2 border border-brand-ochre bg-brand-cream px-5 py-4 text-sm font-semibold text-brand-green disabled:opacity-55"
                >
                  <XCircle className="h-5 w-5" />
                  Reject Payment
                </button>
              </div>

              <div className="mt-3">
                <Link
                  href={`/account/receipt/${selected.id}`}
                  target="_blank"
                  className="inline-flex w-full items-center justify-center gap-2 border border-brand-green/20 bg-brand-cream px-5 py-3 text-sm font-semibold text-brand-green hover:bg-brand-cream-dark transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Printable Invoice & Receipt
                </Link>
              </div>
            </motion.article>
          ) : null}
        </AnimatePresence>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-8 text-center text-xs text-brand-green/50">
        <span className="font-semibold text-brand-ochre border border-brand-ochre/30 px-1.5 py-0.5 rounded-sm mr-2 select-none">Keyboard Shortcuts</span>
        <kbd className="bg-brand-cream-dark px-1 border border-brand-green/10 rounded">↑/↓</kbd> or <kbd className="bg-brand-cream-dark px-1 border border-brand-green/10 rounded">j/k</kbd> navigate list &bull; <kbd className="bg-brand-cream-dark px-1 border border-brand-green/10 rounded">Enter</kbd> zoom screenshot &bull; <kbd className="bg-brand-cream-dark px-1 border border-brand-green/10 rounded">a</kbd> approve &bull; <kbd className="bg-brand-cream-dark px-1 border border-brand-green/10 rounded">r</kbd> reject &bull; <kbd className="bg-brand-cream-dark px-1 border border-brand-green/10 rounded">Esc</kbd> back
      </div>

      <AnimatePresence>
        {zoom && selected ? (
          <motion.div className="fixed inset-0 z-50 overflow-y-auto bg-brand-green/92 p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="mb-4 border border-brand-cream px-4 py-2 text-brand-cream" onClick={() => setZoom(false)}>
              Close screenshot
            </button>
            <ReceiptPreview
              src={selected.screenshotUrl}
              alt={`Payment screenshot uploaded by ${selected.user.name}`}
              className="mx-auto max-h-[82vh] w-auto object-contain"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ReceiptPreview({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid min-h-44 place-items-center border border-brand-ochre/45 bg-brand-cream-dark p-5 text-center text-sm font-semibold text-brand-green">
        Payment screenshot is unavailable. New uploads are stored privately and will appear here after submission.
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function InfoBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="border border-brand-green/10 bg-brand-cream p-4">
      <h3 className="mb-4 text-sm font-bold tracking-[0.2em] text-brand-ochre">{title}</h3>
      <dl className="grid gap-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold text-brand-green/50">{label}</dt>
            <dd className="mt-1 break-words leading-6 text-brand-green/80">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
