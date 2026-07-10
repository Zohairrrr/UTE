"use client";

import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import { StarBadge } from "@/components/motifs";
import type { Plan } from "@/lib/catalog";
import { money } from "@/lib/format";

const spring = { type: "spring" as const, stiffness: 280, damping: 25 };

export function PlanCard({
  plan,
  onChoose,
  focused = false
}: {
  plan: Plan;
  onChoose: () => void;
  focused?: boolean;
}) {
  const executive = plan.tier === "EXECUTIVE";
  const premium = plan.tier === "PREMIUM";

  return (
    <motion.article
      layout
      className={
        executive
          ? "min-h-[420px] bg-brand-green p-5 text-left text-brand-cream sm:min-h-[520px] sm:p-7"
          : premium
            ? "min-h-[420px] border border-brand-ochre bg-brand-cream p-5 text-left sm:min-h-[520px] sm:p-7"
            : "min-h-[420px] bg-brand-cream p-5 text-left sm:min-h-[520px] sm:p-7"
      }
      transition={spring}
    >
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className={executive ? "text-sm font-bold text-brand-cream/70" : "text-sm font-bold text-brand-ochre"}>
            {plan.label}
          </p>
          <p className={executive ? "mt-1 text-xs text-brand-cream/58" : "mt-1 text-xs text-brand-green/55"}>
            {plan.secondaryLabel}
          </p>
        </div>
        {premium ? <StarBadge className="text-brand-ochre" /> : null}
      </div>
      <h3 className="font-display text-4xl tracking-[0.08em] sm:text-5xl">{plan.name}</h3>
      <div className="mt-5 text-2xl font-semibold">{money(plan.price)}</div>
      <p className={executive ? "mt-2 text-sm text-brand-cream/65" : "mt-2 text-sm text-brand-green/62"}>
        {plan.cadence}
      </p>
      <ul className="mt-10 grid gap-4">
        {plan.menu.map((item) => (
          <li key={item} className="flex gap-3 text-sm">
            <Utensils className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onChoose}
        className={
          executive
            ? "mt-10 w-full border border-brand-cream bg-brand-cream px-5 py-4 text-sm font-semibold text-brand-green"
            : "mt-10 w-full border border-brand-green bg-brand-green px-5 py-4 text-sm font-semibold text-brand-cream"
        }
      >
        {focused ? "Purchase this plan" : "View and purchase"}
      </button>
    </motion.article>
  );
}
