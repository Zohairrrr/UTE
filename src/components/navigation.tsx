import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentSession } from "@/lib/current-session";
import { signOutAction } from "@/actions/session";
import { MobileNavigation } from "@/components/mobile-navigation";

const links: [string, string][] = [
  ["Home", "/"],
  ["About", "/about"],
  ["Meal Plans", "/subscriptions"],
  ["Custom Order", "/custom-order"],
  ["Frozen Goods", "/frozen-goods"],
  ["Events", "/events"]
];

export async function Navigation() {
  const session = await getCurrentSession();
  const navLinks: [string, string][] = session ? [...links, ["Account", "/account"]] : links;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-green/10 bg-brand-cream">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link href="/" aria-label="URBAN TIFFIN AND EVENTS home">
          <BrandLogo />
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-brand-green/75 xl:flex">
          {navLinks.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-brand-green">
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 xl:flex">
          {session ? (
            <>
              <form action={signOutAction}>
                <button className="border border-brand-green/15 px-3 py-2 text-xs font-semibold text-brand-green/75 hover:text-brand-green">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              className="border border-brand-green/15 px-3 py-2 text-xs font-semibold text-brand-green/75 hover:text-brand-green"
              href="/login"
            >
            Login
          </Link>
          )}
        </div>
        <MobileNavigation links={navLinks} signedIn={Boolean(session)} />
      </nav>
    </header>
  );
}
