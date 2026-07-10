"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, CheckCircle2, ChefHat, FileImage, Landmark, Package, Phone, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createOrderPayment, createSubscriptionPayment } from "@/actions/checkout";
import { FlagDivider } from "@/components/motifs";
import { SubmitButton } from "@/components/submit-button";
import { PlanCard } from "@/components/plan-card";
import type { FrozenGood, Plan } from "@/lib/catalog";
import { money } from "@/lib/format";
import { SUPPORTED_AREAS } from "@/lib/geo";

type Business = {
  missing: string[];
  phone: string;
  whatsappUrl: string;
  bank: {
    title: string;
    accountNumber: string;
    iban: string;
    name: string;
  };
  logisticsPolicy?: string;
};

type Props = {
  business: Business;
  plans: Plan[];
  frozenGoods: FrozenGood[];
  signedIn: boolean;
  setupMode?: boolean;
  view?: "home" | "about" | "subscriptions" | "custom-order" | "frozen-goods" | "events";
};

const spring = { type: "spring" as const, stiffness: 280, damping: 25 };
const initialState = { ok: false, message: "" };

function Reveal({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}

const acceptedReceiptTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const maxReceiptSize = 5 * 1024 * 1024;
const missingBusinessLabels: Record<string, string> = {
  BUSINESS_PHONE: "business phone",
  BUSINESS_WHATSAPP_URL: "WhatsApp link",
  BANK_ACCOUNT_TITLE: "bank account title",
  BANK_ACCOUNT_NUMBER: "bank account number",
  BANK_NAME: "bank name"
};

function readableMissingBusiness(keys: string[]) {
  return keys.map((key) => missingBusinessLabels[key] ?? key).join(", ");
}

function BankPanel({ business }: { business: Business }) {
  if (business.missing.length) {
    return (
      <div className="border border-brand-ochre/50 bg-brand-cream-dark p-4 text-sm text-brand-green">
        Payment setup is incomplete. Please add {readableMissingBusiness(business.missing)} before customers upload payment screenshots.
      </div>
    );
  }

  return (
    <div className="border border-brand-green/15 bg-brand-cream-dark p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Landmark className="h-4 w-4" />
        Bank transfer details
      </div>
      <dl className="grid gap-2 text-sm text-brand-green/78 sm:grid-cols-2">
        <div>
          <dt className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-brand-green/50">Bank</dt>
          <dd>{business.bank.name}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-brand-green/50">Title</dt>
          <dd>{business.bank.title}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-brand-green/50">Account</dt>
          <dd>{business.bank.accountNumber}</dd>
        </div>
        {business.bank.iban ? (
          <div>
            <dt className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-brand-green/50">IBAN</dt>
            <dd>{business.bank.iban}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function ReceiptField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function attachFile(nextFile: File | undefined) {
    if (!nextFile || !inputRef.current) return;

    if (!acceptedReceiptTypes.has(nextFile.type)) {
      setError("Upload PNG, JPG, WEBP, or GIF only.");
      inputRef.current.value = "";
      setFile(null);
      return;
    }

    if (nextFile.size > maxReceiptSize) {
      setError("Payment screenshot must stay under 5MB.");
      inputRef.current.value = "";
      setFile(null);
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(nextFile);
    inputRef.current.files = transfer.files;
    setFile(nextFile);
    setError("");
  }

  return (
    <div className="grid gap-2">
      <motion.label
        className={
          isDragging
            ? "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 border border-brand-ochre bg-brand-cream p-5 text-center transition"
            : "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-brand-green/35 bg-brand-cream-dark p-5 text-center transition hover:border-brand-ochre hover:bg-brand-cream"
        }
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          attachFile(event.dataTransfer.files[0]);
        }}
        whileHover={{ y: -2 }}
        transition={spring}
      >
        <input
          ref={inputRef}
          required
          className="sr-only"
          name="receipt"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => attachFile(event.target.files?.[0])}
        />
        {file ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-brand-ochre" />
            <span className="text-sm font-semibold">{file.name}</span>
            <span className="text-xs text-brand-green/62">{(file.size / 1024 / 1024).toFixed(2)}MB attached</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6" />
            <span className="text-sm font-semibold">Drop or select payment screenshot</span>
            <span className="text-xs text-brand-green/60">PNG, JPG, WEBP, or GIF. Maximum 5MB.</span>
          </>
        )}
      </motion.label>
      {error ? (
        <div className="flex items-center gap-2 border border-brand-ochre/55 bg-brand-cream p-3 text-xs font-semibold text-brand-green">
          <FileImage className="h-4 w-4 text-brand-ochre" />
          {error}
        </div>
      ) : null}
    </div>
  );
}

function ActionMessage({ state }: { state: typeof initialState }) {
  if (!state.message) return null;
  return (
    <div
      className={
        state.ok
          ? "border border-brand-green/25 bg-brand-cream-dark p-4 text-sm font-semibold text-brand-green"
          : "border border-brand-ochre/60 bg-brand-cream p-4 text-sm font-semibold text-brand-green"
      }
    >
      {state.message}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-brand-green">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SubscriptionDrawer({
  plan,
  business,
  signedIn,
  onClose
}: {
  plan: Plan | null;
  business: Business;
  signedIn: boolean;
  onClose: () => void;
}) {
  const [state, action] = useActionState(createSubscriptionPayment, initialState);
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (plan) {
      setSlot(localStorage.getItem(`draft_sub_slot_${plan.tier}`) || "");
      setNotes(localStorage.getItem(`draft_sub_notes_${plan.tier}`) || "");
    }
  }, [plan]);

  useEffect(() => {
    if (state.ok && plan) {
      localStorage.removeItem(`draft_sub_slot_${plan.tier}`);
      localStorage.removeItem(`draft_sub_notes_${plan.tier}`);
      setSlot("");
      setNotes("");
    }
  }, [state, plan]);

  function handleSlotChange(val: string) {
    setSlot(val);
    if (plan) localStorage.setItem(`draft_sub_slot_${plan.tier}`, val);
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    if (plan) localStorage.setItem(`draft_sub_notes_${plan.tier}`, val);
  }

  return (
    <AnimatePresence>
      {plan ? (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close meal plan drawer" className="absolute inset-0 bg-brand-green/30" onClick={onClose} />
          <motion.aside
            className="absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-brand-green/15 bg-brand-cream p-4 sm:max-w-xl sm:p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={spring}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-brand-ochre">{plan.label}</p>
                <h3 className="font-display text-3xl tracking-[0.08em] sm:text-4xl">{plan.name}</h3>
                <p className="mt-2 text-sm text-brand-green/65">{money(plan.price)} for {plan.cadence}</p>
              </div>
              <button className="border border-brand-green/15 p-2" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-8 grid gap-3">
              {Object.entries(plan.weekly).map(([day, meals]) => (
                <div key={day} className="grid gap-3 border border-brand-green/10 p-4 sm:grid-cols-[110px_1fr]">
                  <div className="font-semibold">{day}</div>
                  <div className="text-sm text-brand-green/72">{meals.join(" / ")}</div>
                </div>
              ))}
            </div>

            <form action={action} className="grid gap-4">
              <input type="hidden" name="tier" value={plan.tier} />
              <BankPanel business={business} />
              <FieldLabel label="Preferred delivery slot">
                <input
                  required
                  className="border-brand-green/15 bg-brand-cream text-sm"
                  name="requestedDeliverySlot"
                  placeholder="1:00 PM to 2:00 PM"
                  value={slot}
                  onChange={(e) => handleSlotChange(e.target.value)}
                />
              </FieldLabel>
              <FieldLabel label="Delivery notes">
                <textarea
                  className="min-h-24 border-brand-green/15 bg-brand-cream text-sm"
                  name="notes"
                  placeholder="Office timing, hostel gate instructions, packaging requests"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                />
              </FieldLabel>
              <ReceiptField />
              {!signedIn ? (
                <div className="border border-brand-ochre/50 bg-brand-cream-dark p-4 text-sm">
                  Sign in or create an account before sending your payment screenshot.
                  <Link className="ml-2 font-semibold underline decoration-brand-ochre underline-offset-4" href="/login?next=/subscriptions">
                    Open account access
                  </Link>
                </div>
              ) : null}
              <ActionMessage state={state} />
              <SubmitButton disabled={!signedIn || Boolean(business.missing.length) || state.ok}>
                {state.ok
                  ? "Submitted for review"
                  : business.missing.length
                    ? "Payment setup incomplete"
                    : signedIn
                      ? "Send payment screenshot"
                      : "Login required to submit"}
              </SubmitButton>
            </form>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConfiguredOrderForm({
  business,
  signedIn,
  type,
  frozenGoods = []
}: {
  business: Business;
  signedIn: boolean;
  type: "CUSTOM" | "EVENT" | "FROZEN_GOODS";
  frozenGoods?: FrozenGood[];
}) {
  const [state, action] = useActionState(createOrderPayment, initialState);
  const [selectedFrozen, setSelectedFrozen] = useState(0);
  const isFrozen = type === "FROZEN_GOODS";
  const selected = frozenGoods[selectedFrozen] ?? frozenGoods[0];

  const [formDataState, setFormDataState] = useState({
    title: "",
    details: "",
    guestCount: "",
    estimatedTotal: "",
    deliveryDate: "",
    deliverySlot: "",
    addressLine: "",
    area: ""
  });

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    setFormDataState({
      title: localStorage.getItem(`draft_ord_title_${type}`) || "",
      details: localStorage.getItem(`draft_ord_details_${type}`) || "",
      guestCount: localStorage.getItem(`draft_ord_guestCount_${type}`) || "",
      estimatedTotal: localStorage.getItem(`draft_ord_estimatedTotal_${type}`) || "",
      deliveryDate: localStorage.getItem(`draft_ord_deliveryDate_${type}`) || "",
      deliverySlot: localStorage.getItem(`draft_ord_deliverySlot_${type}`) || "",
      addressLine: localStorage.getItem(`draft_ord_addressLine_${type}`) || "",
      area: localStorage.getItem(`draft_ord_area_${type}`) || ""
    });
  }, [type]);

  useEffect(() => {
    if (state.ok) {
      localStorage.removeItem(`draft_ord_title_${type}`);
      localStorage.removeItem(`draft_ord_details_${type}`);
      localStorage.removeItem(`draft_ord_guestCount_${type}`);
      localStorage.removeItem(`draft_ord_estimatedTotal_${type}`);
      localStorage.removeItem(`draft_ord_deliveryDate_${type}`);
      localStorage.removeItem(`draft_ord_deliverySlot_${type}`);
      localStorage.removeItem(`draft_ord_addressLine_${type}`);
      localStorage.removeItem(`draft_ord_area_${type}`);
      setFormDataState({
        title: "",
        details: "",
        guestCount: "",
        estimatedTotal: "",
        deliveryDate: "",
        deliverySlot: "",
        addressLine: "",
        area: ""
      });
    }
  }, [state, type]);

  function updateField(key: string, value: string) {
    setFormDataState((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(`draft_ord_${key}_${type}`, value);
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="type" value={type} />
      {isFrozen ? (
        <>
          <FieldLabel label="Frozen item">
            <select
              className="border-brand-green/15 bg-brand-cream"
              value={selectedFrozen}
              onChange={(event) => setSelectedFrozen(Number(event.target.value))}
            >
              {frozenGoods.map((item, index) => (
                <option key={item.name} value={index}>
                  {item.name} - {item.pack}
                </option>
              ))}
            </select>
          </FieldLabel>
          <input type="hidden" name="productId" value={selected?.id ?? ""} />
          <input type="hidden" name="title" value={selected?.name ?? "Frozen goods order"} />
          <input type="hidden" name="details" value={`${selected?.pack ?? "Frozen goods"} order`} />
          <input type="hidden" name="estimatedTotal" value={selected?.price ?? 1} />
          <div className="border border-brand-green/10 bg-brand-cream-dark p-4 text-sm font-semibold">
            Transfer amount: {money(selected?.price ?? 0)}
          </div>
        </>
      ) : (
        <>
          <FieldLabel label={type === "EVENT" ? "Event title" : "Request title"}>
            <input
              required
              className="border-brand-green/15 bg-brand-cream"
              name="title"
              placeholder={type === "EVENT" ? "Office dinner, mehndi lunch, private table" : "Weekly office lunch, hostel dinner batch"}
              value={formDataState.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </FieldLabel>
          <FieldLabel label={type === "EVENT" ? "Event details" : "Meal details"}>
            <textarea
              required
              className="min-h-32 border-brand-green/15 bg-brand-cream"
              name="details"
              placeholder={type === "EVENT" ? "Decor direction, catering style, guest profile, service expectations" : "Quantities, dietary requests, packaging, delivery needs"}
              value={formDataState.details}
              onChange={(e) => updateField("details", e.target.value)}
            />
          </FieldLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Guest or meal count">
              <input
                className="border-brand-green/15 bg-brand-cream"
                name="guestCount"
                type="number"
                min="1"
                placeholder="30"
                value={formDataState.guestCount}
                onChange={(e) => updateField("guestCount", e.target.value)}
              />
            </FieldLabel>
            <FieldLabel label="Bank transfer amount">
              <input
                required
                className="border-brand-green/15 bg-brand-cream"
                name="estimatedTotal"
                type="number"
                min="1"
                placeholder="15000"
                value={formDataState.estimatedTotal}
                onChange={(e) => updateField("estimatedTotal", e.target.value)}
              />
            </FieldLabel>
          </div>
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Delivery date">
          <input
            className="border-brand-green/15 bg-brand-cream"
            name="deliveryDate"
            type="date"
            value={formDataState.deliveryDate}
            onChange={(e) => updateField("deliveryDate", e.target.value)}
          />
        </FieldLabel>
        <FieldLabel label="Preferred delivery slot">
          <input
            className="border-brand-green/15 bg-brand-cream"
            name="deliverySlot"
            placeholder="1:00 PM to 2:00 PM"
            value={formDataState.deliverySlot}
            onChange={(e) => updateField("deliverySlot", e.target.value)}
          />
        </FieldLabel>
      </div>
      <FieldLabel label="Hostel, office, or venue address">
        <input
          required
          className="border-brand-green/15 bg-brand-cream"
          name="addressLine"
          placeholder="Building, floor, room, gate instructions"
          value={formDataState.addressLine}
          onChange={(e) => updateField("addressLine", e.target.value)}
        />
      </FieldLabel>
      <FieldLabel label="Delivery area">
        <select
          required
          className="border-brand-green/15 bg-brand-cream text-sm"
          name="area"
          value={formDataState.area}
          onChange={(e) => updateField("area", e.target.value)}
        >
          <option value="">Select Area</option>
          {SUPPORTED_AREAS.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name} {a.surcharge > 0 ? `(+${a.surcharge} PKR)` : ""}
            </option>
          ))}
          <option value="Other Lahore Area">Other/All Lahore Areas</option>
        </select>
      </FieldLabel>
      <BankPanel business={business} />
      <ReceiptField />
      {!signedIn ? (
        <div className="border border-brand-ochre/50 bg-brand-cream-dark p-4 text-sm">
          Sign in or create an account before sending your payment screenshot.
          <Link
            className="ml-2 font-semibold underline decoration-brand-ochre underline-offset-4"
            href={`/login?next=/${type === "EVENT" ? "events" : type === "FROZEN_GOODS" ? "frozen-goods" : "custom-order"}`}
          >
            Open account access
          </Link>
        </div>
      ) : null}
      <ActionMessage state={state} />
      <SubmitButton disabled={!signedIn || Boolean(business.missing.length) || state.ok}>
        {state.ok
          ? "Submitted for review"
          : business.missing.length
            ? "Payment setup incomplete"
            : signedIn
              ? "Send order request"
              : "Login required to submit"}
      </SubmitButton>
    </form>
  );
}



const routeCopy = {
  about: {
    kicker: "Our service",
    title: "Homemade Meals For Offices, Hostels, And Events.",
    copy: "URBAN TIFFIN AND EVENTS is for customers who want reliable homemade food, clear delivery timing, and simple bank transfer review."
  },
  subscriptions: {
    kicker: "Monthly meal plans",
    title: "Choose Your Monthly Meal Plan.",
    copy: "Compare Standard, Premium, and Executive plans, then send your bank transfer screenshot for approval."
  },
  "custom-order": {
    kicker: "Custom food orders",
    title: "Order Food For Offices, Hostels, Or Groups.",
    copy: "Add quantity, date, address, amount, and payment screenshot in one simple form."
  },
  "frozen-goods": {
    kicker: "Frozen food",
    title: "Ready-To-Freeze Food Packs For Home And Office.",
    copy: "Choose frozen items, send your bank transfer screenshot, and wait for order approval."
  },
  events: {
    kicker: "Decor and catering",
    title: "Catering And Decor For Family And Office Events.",
    copy: "Share event details, guest count, venue timing, and payment screenshot in one place."
  }
} as const;

function RouteMasthead({ view }: { view: Exclude<Props["view"], "home" | undefined> }) {
  const copy = routeCopy[view];
  return (
    <section className="border-b border-brand-green/10 bg-brand-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-18">
        <div className="border-t border-brand-green/20 pt-5">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-brand-ochre">{copy.kicker}</p>
          <div className="mt-10 h-px bg-brand-green/15" />
        </div>
        <div>
          <h1 className="text-balance font-display text-4xl font-semibold leading-[0.96] tracking-[0.045em] sm:text-6xl lg:text-7xl">
            {copy.title}
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-brand-green/70">{copy.copy}</p>
        </div>
      </div>
    </section>
  );
}

export function HomeClient({ business, plans, frozenGoods, signedIn, setupMode = false, view = "home" }: Props) {
  const [activeTier, setActiveTier] = useState<Plan>(plans[1] ?? plans[0]);
  const [drawerPlan, setDrawerPlan] = useState<Plan | null>(null);
  const activePlan = activeTier ?? plans[0];
  const isHome = view === "home";

  return (
    <main>
      {isHome ? (
        <>
          <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-82px)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-12">
            <Reveal className="flex flex-col justify-center border-b border-brand-green/10 pb-8 lg:border-b-0 lg:pb-0">
              <div>
                <FlagDivider className="mb-8 text-brand-ochre" />
                <p className="mb-5 max-w-md text-xs font-bold uppercase tracking-[0.24em] text-brand-ochre sm:text-sm">
                  Office meals, hostel plans, frozen food, event catering
                </p>
                <h1 className="text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[0.04em] sm:text-6xl lg:text-[5.35rem]">
                  Homemade meals, delivered with proper planning.
                </h1>
                <p className="mt-7 max-w-xl text-base leading-7 text-brand-green/72 sm:text-lg">
                  Daily tiffins, frozen food, and event catering with clear payment review before confirmation.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="border border-brand-green bg-brand-green px-6 py-3 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/92 active:translate-y-px" href="/subscriptions">
                  View meal plans
                </Link>
                <Link className="border border-brand-green/20 px-6 py-3 text-sm font-semibold text-brand-green transition hover:border-brand-ochre active:translate-y-px" href="/events">
                  Plan an event
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.08} className="relative min-w-0">
              <div className="grid grid-cols-[1fr_74px] gap-3 sm:grid-cols-[1fr_88px]">
                <div className="border border-brand-green/15 bg-brand-cream-dark p-3">
                  <Image
                    src="/brand/editorial-tiffin.png"
                    alt="Premium tiffin meal service arranged for office lunch"
                    width={1024}
                    height={1024}
                    className="aspect-[5/5.4] w-full object-cover lg:aspect-[5/5.7]"
                    priority
                  />
                </div>
                <div className="grid content-between border border-brand-green/15 bg-brand-cream-dark p-2">
                  <Image
                    src="/brand/urban-tiffin-logo.jpeg"
                    alt="URBAN TIFFIN AND EVENTS logo"
                    width={160}
                    height={160}
                    className="w-full border border-brand-green/10 object-cover"
                  />
                  <div className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold uppercase tracking-[0.24em] text-brand-green/58">
                  Fresh meals daily
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 left-6 hidden border border-brand-green/15 bg-brand-cream px-5 py-4 text-sm font-semibold shadow-sharp sm:block">
                Fresh daily tiffin service, checked before dispatch.
              </div>
            </Reveal>
          </section>

          <section className="border-y border-brand-green/10 bg-brand-cream-dark">
            <div className="mx-auto grid max-w-7xl gap-px bg-brand-green/10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-6 lg:px-8">
              {[
                ["Meal Plans", "/subscriptions", "Standard, Premium, and Executive monthly plans.", "lg:col-span-2 lg:row-span-2 min-h-72"],
                ["Custom Order", "/custom-order", "Bulk meals with date, address, and payment screenshot.", "lg:col-span-2 min-h-52"],
                ["Events", "/events", "Catering and decor for family or office events.", "bg-brand-green text-brand-cream lg:col-span-2 min-h-52"],
                ["Frozen Food", "/frozen-goods", "Ready-to-freeze packs for homes and offices.", "lg:col-span-2 min-h-52"],
                ["About", "/about", "How our food and delivery service works.", "lg:col-span-2 min-h-52"]
              ].map(([title, href, copy, className]) => (
                <motion.div key={href} className={title === "Events" ? className : `${className} bg-brand-cream`} whileHover={{ y: -5 }} transition={spring}>
                  <Link href={href} className={title === "Events" ? "flex h-full flex-col justify-between p-5 transition hover:bg-brand-green/95" : "flex h-full flex-col justify-between p-5 transition hover:bg-brand-cream-dark"}>
                    <span className={title === "Events" ? "text-xs font-bold uppercase tracking-[0.22em] text-brand-cream/60" : "text-xs font-bold uppercase tracking-[0.22em] text-brand-ochre"}>
                      View option
                    </span>
                    <div>
                      <h2 className="font-display text-4xl font-semibold tracking-[0.055em]">{title}</h2>
                      <p className={title === "Events" ? "mt-4 text-sm leading-6 text-brand-cream/68" : "mt-4 text-sm leading-6 text-brand-green/68"}>{copy}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-brand-green/10">
            <Reveal className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Left Column: Plan Comparison Table */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-brand-ochre">COMPARE SERVICES</p>
                <h2 className="font-display text-3xl font-semibold tracking-[0.05em] sm:text-4xl">Plan Tier Comparisons</h2>
                <p className="mt-4 text-sm text-brand-green/68 mb-8">
                  A detailed comparison of our homemade monthly meal subscription tiers designed for corporate office workers, hostel residents, and families in Lahore.
                </p>
                
                <div className="overflow-x-auto border border-brand-green/15">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-brand-cream-dark border-b border-brand-green/15 text-brand-green uppercase font-bold text-xs tracking-wider">
                        <th className="p-4 font-semibold">Tier Feature</th>
                        <th className="p-4 font-semibold">Standard</th>
                        <th className="p-4 font-semibold">Premium</th>
                        <th className="p-4 font-semibold">Executive</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-green/10">
                      <tr>
                        <td className="p-4 font-semibold text-brand-green">Monthly Price</td>
                        <td className="p-4">12,000 PKR</td>
                        <td className="p-4">18,000 PKR</td>
                        <td className="p-4">25,000 PKR</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-brand-green">Menu Variety</td>
                        <td className="p-4">Single main course (standard menu)</td>
                        <td className="p-4">Main course + side + dessert (premium catalog)</td>
                        <td className="p-4">Bespoke main + side + salad + premium dessert</td>
                      </tr>

                      <tr>
                        <td className="p-4 font-semibold text-brand-green">Delivery Window</td>
                        <td className="p-4">Standard slots (1 hr window)</td>
                        <td className="p-4">Custom slots (30 min window)</td>
                        <td className="p-4">Precise slot locking (15 min window)</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-brand-green">Hygiene Guarantee</td>
                        <td className="p-4 font-medium text-brand-green">Standard AAA Grade</td>
                        <td className="p-4 font-medium text-brand-green">Premium ISO Certified</td>
                        <td className="p-4 font-medium text-brand-green">Executive VIP Sterile Room</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: AI Crawler FAQ */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-brand-ochre">KNOWLEDGE BASE & FAQS</p>
                <h2 className="font-display text-3xl font-semibold tracking-[0.05em] sm:text-4xl">Common Inquiries</h2>
                
                <div className="mt-8 grid gap-6">
                  {[
                    [
                      "How does the manual bank transfer verification work at Urban Tiffin?",
                      "When you purchase a meal plan or place an order, you transfer the amount to our bank account and upload a screenshot of the transaction. Our admin team verifies the transfer and confirms your order/subscription, instantly issuing a printable digital receipt with a unique token number."
                    ],
                    [
                      "Which areas in Lahore does Urban Tiffin deliver to?",
                      "We deliver premium homemade tiffin meals, frozen goods, and event catering throughout the entirety of Lahore, Pakistan. Whether your home, hostel, office, or event venue is in DHA, Gulberg, Cantt, Johar Town, or any other region in Lahore, we provide full delivery coverage."
                    ],
                    [
                      "What are the hygiene and preparation standards of Urban Tiffin?",
                      "All meals are prepared in a highly sterile commercial kitchen using premium grade ingredients. We maintain extreme sanitization, clean packaging, and rigorous temperature checks throughout food preparation and transport."
                    ],
                    [
                      "Can I customize the weekly menu for office tiffin subscriptions?",
                      "Yes! Our Standard, Premium, and Executive plans come with diverse weekly schedules. Admins can adjust delivery time slots, and corporate buyers can request custom meal adjustments through our custom order form."
                    ]
                  ].map(([question, answer]) => (
                    <div key={question} className="border-b border-brand-green/10 pb-4">
                      <h3 className="text-sm font-semibold text-brand-green leading-snug">{question}</h3>
                      <p className="mt-2 text-xs sm:text-sm text-brand-green/68 leading-relaxed">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        </>
      ) : null}

      {!isHome ? <RouteMasthead view={view} /> : null}

      {setupMode ? (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border border-brand-ochre/50 bg-brand-cream-dark p-4 text-sm text-brand-green">
            Setup mode: public content is using built-in seed data until Supabase database credentials are configured.
          </div>
        </div>
      ) : null}

      {view === "about" ? (
        <section className="border-y border-brand-green/10 bg-brand-cream-dark">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            ["Office Meal Plans", "Monthly meals with a clear weekly menu and payment approval."],
            ["Hostel Delivery", "Daily food planning for students and residents who need reliable timing."],
            ["Events And Decor", "Catering and decor for family gatherings, office events, and hosted dinners."]
          ].map(([title, copy]) => (
            <Reveal key={title} className="border-brand-green/10 pr-0 lg:border-r lg:pr-8 lg:last:border-r-0">
              <h2 className="font-display text-3xl tracking-[0.08em]">{title}</h2>
              <p className="mt-4 leading-7 text-brand-green/70">{copy}</p>
            </Reveal>
          ))}
        </div>
      </section>
      ) : null}

      {view === "subscriptions" ? (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-sm font-bold tracking-[0.28em] text-brand-ochre">ORDER NOW</p>
            <h1 className="font-display text-4xl font-semibold tracking-[0.05em] sm:text-6xl">Meal Plans</h1>
          </div>
          <div className="relative grid w-full grid-cols-3 border border-brand-green/15 p-1 text-xs font-semibold sm:w-auto sm:text-sm lg:hidden">
            {plans.map((plan) => (
              <button key={plan.tier} className="relative min-h-11 px-2 py-2 sm:px-4" onClick={() => setActiveTier(plan)}>
                {activePlan.tier === plan.tier ? (
                  <motion.span layoutId="tier-indicator" className="absolute inset-0 bg-brand-green" transition={spring} />
                ) : null}
                <span className={activePlan.tier === plan.tier ? "relative text-brand-cream" : "relative text-brand-green"}>
                  {plan.name}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="lg:hidden">
          <PlanCard plan={activePlan} onChoose={() => setDrawerPlan(activePlan)} focused />
        </div>

        <div className="hidden gap-px bg-brand-green/15 lg:grid lg:grid-cols-3">
          {plans.map((plan) => {
            return (
              <PlanCard key={plan.tier} plan={plan} onChoose={() => setDrawerPlan(plan)} />
            );
          })}
        </div>
      </section>
      ) : null}

      {view === "custom-order" ? (
      <section className="border-y border-brand-green/10 bg-brand-cream-dark">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <Reveal>
            <ChefHat className="mb-8 h-9 w-9 text-brand-ochre" />
            <h1 className="font-display text-4xl font-semibold tracking-[0.05em] sm:text-6xl">Custom Food Order</h1>
            <p className="mt-6 leading-8 text-brand-green/70">
              Send custom food requests for offices, hostels, families, or bulk orders with delivery time, address, amount, and payment screenshot.
            </p>
            <div className="mt-8 border border-brand-ochre bg-brand-cream p-5 text-sm font-semibold text-brand-green">
              {business.logisticsPolicy || "Order policy: Custom requests should be placed at least 1 day before delivery."}
            </div>
          </Reveal>
          <Reveal delay={0.06} className="border border-brand-green/15 bg-brand-cream p-6">
            <ConfiguredOrderForm business={business} signedIn={signedIn} type="CUSTOM" />
          </Reveal>
        </div>
      </section>
      ) : null}

      {view === "frozen-goods" ? (
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <Reveal className="min-w-0 border border-brand-green/15 bg-brand-cream p-6">
          <div className="mb-8 flex items-center gap-3">
            <Package className="h-6 w-6 text-brand-ochre" />
            <h2 className="font-display text-4xl tracking-[0.08em]">Frozen Goods</h2>
          </div>
          <ConfiguredOrderForm business={business} signedIn={signedIn} type="FROZEN_GOODS" frozenGoods={frozenGoods} />
        </Reveal>
        <Reveal delay={0.06} className="grid min-w-0 content-between border border-brand-green/15 bg-brand-cream-dark p-8">
          <div>
            <h3 className="font-display text-4xl tracking-[0.08em]">Frozen food service</h3>
            <p className="mt-5 leading-8 text-brand-green/70">
              Rolls, kebabs, and samosas prepared for home freezers, hostel kitchens, and office tea tables. Every order is confirmed after payment review.
            </p>
          </div>
          <ul className="mt-10 grid gap-4">
            {frozenGoods.map((item) => (
              <li key={item.name} className="flex justify-between border-b border-brand-green/10 pb-3 text-sm">
                <span>{item.name}</span>
                <span>{money(item.price)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
      ) : null}

      {view === "events" ? (
      <section className="bg-brand-green text-brand-cream">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <Reveal>
            <CalendarClock className="mb-8 h-10 w-10 text-brand-ochre" />
            <h2 className="text-balance font-display text-4xl tracking-[0.06em] sm:text-6xl">
              Event Catering And Decor
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-9 text-brand-cream/72">
              From family dinners to office events, we handle food, presentation, decor needs, guest count, timing, and payment review in one form.
            </p>
            <div className="mt-10 border border-brand-cream/25 p-6">
              <p className="text-sm text-brand-cream/60">Primary customer contact</p>
              <div className="mt-2 break-words font-display text-2xl tracking-[0.06em] sm:text-4xl">{business.phone || "Contact number required"}</div>
              <div className="mt-5 flex flex-wrap gap-3">
                <motion.a
                  whileHover={{ x: 4, y: -2 }}
                  transition={spring}
                  className="inline-flex items-center gap-2 border border-brand-cream bg-brand-cream px-5 py-3 text-sm font-semibold text-brand-green"
                  href={business.phone ? `tel:${business.phone}` : "#"}
                >
                  <Phone className="h-4 w-4" />
                  Call us
                </motion.a>
                <motion.a
                  whileHover={{ x: 4, y: -2 }}
                  transition={spring}
                  className="inline-flex items-center gap-2 border border-brand-cream/35 px-5 py-3 text-sm font-semibold text-brand-cream"
                  href={business.whatsappUrl || "#"}
                >
                  Open WhatsApp
                </motion.a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.06} className="border border-brand-cream/20 bg-brand-cream p-6 text-brand-green">
            <ConfiguredOrderForm business={business} signedIn={signedIn} type="EVENT" />
          </Reveal>
        </div>
      </section>
      ) : null}

      <SubscriptionDrawer plan={drawerPlan} business={business} signedIn={signedIn} onClose={() => setDrawerPlan(null)} />

      {/* Footer Section */}
      <footer className="bg-brand-green text-brand-cream border-t border-brand-green/20 py-16 mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Column 1: Brand & Contact */}
            <div>
              <h3 className="font-display text-2xl tracking-[0.06em] text-brand-cream mb-4">
                URBAN TIFFIN & EVENTS
              </h3>
              <p className="text-sm text-brand-cream/70 leading-6 max-w-sm">
                Premium daily tiffin delivery, bulk orders, and custom event catering in Lahore, Pakistan. Homemade meals, prepared in sterile kitchens and delivered on time.
              </p>
              <div className="mt-6 text-sm text-brand-cream/60">
                <span className="block">Phone: {business.phone || "+92 300 1234567"}</span>
                <span className="block mt-1">Lahore, Pakistan</span>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="md:pl-10">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ochre mb-4">
                Quick Navigation
              </h4>
              <ul className="grid gap-3 text-sm">
                {[
                  ["Home", "/"],
                  ["Subscriptions & Meal Plans", "/subscriptions"],
                  ["Custom Order Inquiry", "/custom-order"],
                  ["Frozen Goods Pack", "/frozen-goods"],
                  ["Event Catering & Decor", "/events"],
                  ["About Our Kitchen", "/about"]
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-brand-cream/75 hover:text-brand-cream hover:underline transition">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Privacy & Security Statement */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ochre mb-4">
                Privacy & Payment Security
              </h4>
              <p className="text-sm text-brand-cream/75 leading-6">
                We value your privacy. Uploaded payment proofs and bank transfer screenshots are kept completely private and secure. They are only viewable by authorized administrators during verification and are deleted permanently once your payment is reviewed. We do not store or keep transaction screenshots after validation.
              </p>
            </div>
          </div>

          <div className="mt-16 border-t border-brand-cream/10 pt-8 flex flex-col justify-between gap-4 sm:flex-row text-xs text-brand-cream/50">
            <div>
              &copy; {new Date().getFullYear()} Urban Tiffin and Events. All rights reserved.
            </div>
            <div>
              Delivery available throughout the entirety of Lahore.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
