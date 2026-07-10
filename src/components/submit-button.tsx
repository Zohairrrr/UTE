"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  inverted = false,
  disabled = false
}: {
  children: React.ReactNode;
  inverted?: boolean;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || disabled}
      className={
        inverted
          ? "w-full border border-brand-cream bg-brand-cream px-5 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream-dark disabled:cursor-not-allowed disabled:border-brand-cream/30 disabled:bg-brand-cream/35 disabled:text-brand-cream/70"
          : "w-full border border-brand-green bg-brand-green px-5 py-3 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:border-brand-green/25 disabled:bg-brand-green/35 disabled:text-brand-green/65"
      }
      type="submit"
    >
      {pending ? "Processing..." : children}
    </button>
  );
}
