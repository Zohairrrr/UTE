"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { signOutAction } from "@/actions/session";

type NavLink = [string, string];

const spring = { type: "spring" as const, stiffness: 280, damping: 25 };

export function MobileNavigation({
  links,
  signedIn
}: {
  links: NavLink[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center border border-brand-green/15 text-brand-green transition hover:bg-brand-cream-dark xl:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-brand-cream text-brand-green xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex min-h-dvh flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="flex items-center justify-between gap-4 border-b border-brand-green/10 pb-5">
                <div>
                  <div className="font-display text-3xl tracking-[0.18em]">URBAN</div>
                  <div className="mt-1 text-[0.58rem] font-semibold tracking-[0.32em] text-brand-green/70">
                    TIFFIN AND EVENTS
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center border border-brand-green/15 transition hover:bg-brand-cream-dark"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="grid flex-1 content-center gap-2 py-8">
                {links.map(([label, href], index) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: index * 0.025 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-14 items-center justify-between border-b border-brand-green/10 py-3 text-2xl font-semibold tracking-[0.02em]"
                    >
                      <span>{label}</span>
                      <span className="text-sm text-brand-ochre">Open</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="grid gap-3 border-t border-brand-green/10 pt-5">
                {signedIn ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-cream"
                    >
                      <UserRound className="h-4 w-4" />
                      Open account
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      className="inline-flex min-h-12 items-center justify-center gap-2 border border-brand-green/15 px-4 text-sm font-semibold disabled:opacity-55"
                      onClick={() => startTransition(() => { void signOutAction(); })}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-cream"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
