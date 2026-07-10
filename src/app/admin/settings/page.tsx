import { saveBusinessSettings } from "@/actions/admin-ops";
import { AdminPanel, AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fields = [
  ["BUSINESS_PHONE", "Business phone", true],
  ["BUSINESS_WHATSAPP_URL", "WhatsApp URL", true],
  ["BANK_ACCOUNT_TITLE", "Bank account title", true],
  ["BANK_ACCOUNT_NUMBER", "Bank account number", true],
  ["BANK_IBAN", "IBAN"],
  ["BANK_NAME", "Bank name", true],
  ["LOGISTICS_POLICY", "Logistics policy"]
] as const;

export default async function AdminSettingsPage() {
  await requireAdminSession();
  const settings = await prisma.businessSetting.findMany();
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const missingRequired = fields
    .filter((field) => field[2] && !String(values[field[0]] ?? "").trim())
    .map((field) => field[1]);

  return (
    <AdminShell title="Business Settings">
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <AdminPanel>
          <div className="mb-6 border border-brand-green/10 bg-brand-cream-dark p-4">
            <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">Payment Setup</h2>
            <p className="mt-3 text-sm leading-6 text-brand-green/70">
              Customers can upload payment screenshots after the required phone and bank details are filled.
            </p>
            {missingRequired.length ? (
              <div className="mt-4 border border-brand-ochre/60 bg-brand-cream p-4 text-sm font-semibold text-brand-green">
                Missing required setup: {missingRequired.join(", ")}.
              </div>
            ) : (
              <div className="mt-4 border border-brand-green/20 bg-brand-cream p-4 text-sm font-semibold text-brand-green">
                Payment screenshot upload is active.
              </div>
            )}
          </div>
          <form action={saveBusinessSettings} className="grid gap-4">
            {fields.map(([key, label, required]) => (
              <label key={key} className="grid gap-2 text-sm font-semibold">
                <span className="flex items-center justify-between gap-3">
                  {label}
                  {required ? <span className="text-[0.65rem] uppercase tracking-[0.18em] text-brand-ochre">Required</span> : null}
                </span>
                {key === "LOGISTICS_POLICY" ? (
                  <textarea name={key} defaultValue={values[key] ?? ""} className="min-h-24" />
                ) : (
                  <input name={key} defaultValue={values[key] ?? ""} />
                )}
              </label>
            ))}
            <button className="border border-brand-green bg-brand-green px-5 py-3 text-sm font-semibold text-brand-cream">
              Save settings
            </button>
          </form>
        </AdminPanel>
      </section>
    </AdminShell>
  );
}
