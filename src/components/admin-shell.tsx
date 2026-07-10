import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/actions/session";
import { NoticeToast } from "@/components/notice-toast";
import { AdminMobileMenu } from "@/components/admin-mobile-menu";

const adminLinks: [string, string][] = [
  ["Overview", "/admin"],
  ["Payments", "/admin/payments"],
  ["Deliveries", "/admin/deliveries"],
  ["Orders", "/admin/orders"],
  ["Customers", "/admin/customers"],
  ["Menus", "/admin/menus"],
  ["Frozen Goods", "/admin/frozen-goods"],
  ["Settings", "/admin/settings"]
];

export function AdminShell({
  children,
  title,
  kicker = "ADMIN"
}: {
  children: React.ReactNode;
  title: string;
  kicker?: string;
}) {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-green">
      <Suspense fallback={null}>
        <NoticeToast />
      </Suspense>
      <header className="sticky top-0 z-40 border-b border-brand-green/10 bg-brand-cream">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.28em] text-brand-ochre">{kicker}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-[0.06em] sm:text-4xl">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link className="hidden border border-brand-green/15 px-4 py-2 text-sm font-semibold transition hover:bg-brand-cream-dark sm:inline-flex" href="/">
                View customer site
              </Link>
              <form action={signOutAction} className="hidden sm:block">
                <button className="border border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream">
                  Sign out
                </button>
              </form>
              <AdminMobileMenu links={adminLinks} />
            </div>
          </div>
          <nav className="hidden w-fit max-w-full gap-px overflow-x-auto bg-brand-green/10 md:flex">
            {adminLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 bg-brand-cream px-4 py-3 text-sm font-semibold text-brand-green/72 transition hover:bg-brand-cream-dark hover:text-brand-green"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}

export function AdminPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`border border-brand-green/15 bg-brand-cream p-5 ${className}`}>{children}</section>;
}
