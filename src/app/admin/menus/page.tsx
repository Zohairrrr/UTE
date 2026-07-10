import { addMenuItem, deactivateMenuItem, saveSubscriptionPlan } from "@/actions/admin-ops";
import { AdminPanel, AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const tiers = ["STANDARD", "PREMIUM", "EXECUTIVE"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default async function AdminMenusPage() {
  await requireAdminSession();
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { displayOrder: "asc" },
    include: { menuItems: { where: { active: true }, orderBy: [{ weekday: "asc" }, { displayOrder: "asc" }] } }
  });

  return (
    <AdminShell title="Menus And Meal Plans">
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-8">
        {plans.map((plan) => (
          <AdminPanel key={plan.id}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-brand-green/10 pb-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-brand-ochre">{plan.tier}</div>
                <h2 className="mt-2 font-display text-4xl font-semibold tracking-[0.06em]">{plan.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-px bg-brand-green/10 text-sm">
                <div className="bg-brand-cream-dark px-4 py-3">
                  <div className="text-brand-green/55">Price</div>
                  <div className="font-semibold">{money(plan.price)}</div>
                </div>
                <div className="bg-brand-cream-dark px-4 py-3">
                  <div className="text-brand-green/55">Menu lines</div>
                  <div className="font-semibold">{plan.menuItems.length}</div>
                </div>
              </div>
            </div>
            <form action={saveSubscriptionPlan} className="grid gap-4 lg:grid-cols-6">
              <input type="hidden" name="id" value={plan.id} />
              <select name="tier" defaultValue={plan.tier}>
                {tiers.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
              <input name="name" defaultValue={plan.name} placeholder="Plan name" />
              <input name="label" defaultValue={plan.label} placeholder="Primary label" />
              <input name="secondaryLabel" defaultValue={plan.secondaryLabel} placeholder="Secondary label" />
              <input name="price" type="number" defaultValue={plan.price} placeholder="Price" />
              <input name="cadence" defaultValue={plan.cadence} placeholder="Plan duration, for example monthly office plan" />
              <input name="displayOrder" type="number" defaultValue={plan.displayOrder} placeholder="Order" />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="active" type="checkbox" defaultChecked={plan.active} />
                Active
              </label>
              <button className="border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/92 lg:col-span-2">
                Save {plan.name}
              </button>
              <div className="text-sm font-semibold lg:col-span-2">{plan.active ? "Visible to customers" : "Hidden from customers"}</div>
            </form>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-2">
                {weekdays.map((weekday) => (
                  <div key={weekday} className="border border-brand-green/10 bg-brand-cream-dark p-3">
                    <div className="mb-2 text-sm font-bold text-brand-ochre">{weekday}</div>
                    <div className="grid gap-2">
                      {plan.menuItems
                        .filter((item) => item.weekday === weekday)
                        .map((item) => (
                          <form key={item.id} action={deactivateMenuItem} className="flex items-center justify-between gap-3 text-sm">
                            <input type="hidden" name="id" value={item.id} />
                            <span>{item.itemText}</span>
                            <button className="border border-brand-green/15 px-3 py-1 text-xs transition hover:border-brand-ochre">Hide</button>
                          </form>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <form action={addMenuItem} className="grid content-start gap-3 border border-brand-green/10 bg-brand-cream-dark p-4">
                <input type="hidden" name="planId" value={plan.id} />
                <h3 className="font-display text-2xl font-semibold tracking-[0.06em]">Add menu item</h3>
                <select name="weekday">
                  {weekdays.map((weekday) => (
                    <option key={weekday} value={weekday}>
                      {weekday}
                    </option>
                  ))}
                </select>
                <input name="itemText" placeholder="Menu item" />
                <input name="displayOrder" type="number" defaultValue={0} placeholder="Display order" />
                <button className="border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/92">
                  Add item
                </button>
              </form>
            </div>
          </AdminPanel>
        ))}
      </section>
    </AdminShell>
  );
}
