"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelPendingRequestAction } from "@/actions/checkout";

export function CancelButton({
  id,
  type
}: {
  id: string;
  type: "subscription" | "order";
}) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm("Are you sure you want to cancel this pending request? This will permanently delete your request and upload details.")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await cancelPendingRequestAction(id, type);
        if (res.ok) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("An unexpected error occurred while cancelling your request.");
      }
    });
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-ochre border border-brand-ochre/30 bg-brand-cream hover:bg-brand-cream-dark transition disabled:opacity-50"
    >
      {isPending ? "Cancelling..." : "Cancel Request"}
    </button>
  );
}
