"use client";

import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import Image from "next/image";
import { StarBadge } from "@/components/motifs";
import type { Plan } from "@/lib/catalog";
import { money } from "@/lib/format";

const spring = { type: "spring" as const, stiffness: 280, damping: 25 };

function getPlanImage(tier: string) {
  switch (tier) {
    case "STANDARD":
      return "/food/web/img_8710.jpeg";
    case "PREMIUM":
      return "/food/web/img_8675.jpeg";
    case "EXECUTIVE":
      return "/food/web/img_8700.jpeg";
    default:
      return "/food/web/img_8675.jpeg";
  }
}

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
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.995 }}
      className={
        executive
          ? "min-h-[420px] bg-brand-green p-5 text-left text-brand-cream sm:min-h-[520px] sm:p-7 relative overflow-hidden group border border-brand-green/10"
          : premium
            ? "min-h-[420px] border border-brand-ochre bg-brand-cream p-5 text-left sm:min-h-[520px] sm:p-7 relative overflow-hidden group"
            : "min-h-[420px] bg-brand-cream p-5 text-left sm:min-h-[520px] sm:p-7 relative overflow-hidden group border border-brand-green/5"
      }
      transition={spring}
    >
      {/* Visual Food Header Image */}
      <div className="relative mb-6 aspect-[16/10] w-full overflow-hidden border border-brand-green/10">
        <Image
          src={getPlanImage(plan.tier)}
          alt={plan.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
        />
      </div>

      <div className="mb-6 flex items-start justify-between">
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
      <ul className="mt-8 grid gap-3">
        {plan.menu.map((item) => (
          <li key={item} className="flex gap-3 text-sm">
            <Utensils className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onChoose}
        className={
          executive
            ? "mt-10 w-full border border-brand-cream bg-brand-cream px-5 py-4 text-sm font-semibold text-brand-green transition-colors hover:bg-brand-cream-dark"
            : "mt-10 w-full border border-brand-green bg-brand-green px-5 py-4 text-sm font-semibold text-brand-cream transition-colors hover:bg-brand-green/92"
        }
      >
        {focused ? "Purchase this plan" : "View and purchase"}
      </motion.button>
    </motion.article>
  );
}
