import { deactivateFrozenProduct, saveFrozenProduct } from "@/actions/admin-ops";
import { AdminPanel, AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-access";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFrozenGoodsPage() {
  await requireAdminSession();
  const products = await prisma.frozenProduct.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <AdminShell title="Frozen Goods Control">
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {products.map((item) => (
            <AdminPanel key={item.id}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-brand-green/10 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-brand-ochre">{item.active ? "Listed" : "Hidden"}</div>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-[0.06em]">{item.name}</h2>
                </div>
                <div className="border border-brand-green/10 bg-brand-cream-dark px-4 py-3 text-sm font-semibold">{money(item.price)}</div>
              </div>
              <form action={saveFrozenProduct} className="grid gap-3 lg:grid-cols-6">
                <input type="hidden" name="id" value={item.id} />
                <input name="name" defaultValue={item.name} placeholder="Product name" />
                <input name="pack" defaultValue={item.pack} placeholder="Pack size" />
                <input name="price" type="number" defaultValue={item.price} placeholder="Price" />
                <input name="stockNote" defaultValue={item.stockNote ?? ""} placeholder="Stock note" />
                <input name="displayOrder" type="number" defaultValue={item.displayOrder} placeholder="Order" />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="active" type="checkbox" defaultChecked={item.active} />
                  Active
                </label>
                <button className="border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/92 lg:col-span-2">
                  Save product
                </button>
                <div className="text-sm font-semibold lg:col-span-2">{item.stockNote || "No stock note"}</div>
              </form>
              <form action={deactivateFrozenProduct} className="mt-3">
                <input type="hidden" name="id" value={item.id} />
                <button className="border border-brand-ochre px-3 py-2 text-xs font-semibold transition hover:bg-brand-cream-dark">Hide from public page</button>
              </form>
            </AdminPanel>
          ))}
        </div>
        <AdminPanel>
          <h2 className="font-display text-3xl font-semibold tracking-[0.06em]">Add Frozen Item</h2>
          <form action={saveFrozenProduct} className="mt-5 grid gap-3">
            <input name="name" placeholder="Product name" />
            <input name="pack" placeholder="Pack size" />
            <input name="price" type="number" placeholder="Price" />
            <input name="stockNote" placeholder="Stock note" />
            <input name="displayOrder" type="number" defaultValue={products.length} placeholder="Order" />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input name="active" type="checkbox" defaultChecked />
              Active
            </label>
            <button className="border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/92">
              Create item
            </button>
          </form>
        </AdminPanel>
      </section>
    </AdminShell>
  );
}
