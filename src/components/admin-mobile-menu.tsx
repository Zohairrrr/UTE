"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { signOutAction } from "@/actions/session";

type AdminLink = [string, string];

const spring = { type: "spring" as const, stiffness: 280, damping: 25 };

export function AdminMobileMenu({ links }: { links: AdminLink[] }) {
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
        className="inline-flex min-h-11 min-w-11 items-center justify-center border border-brand-green/15 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open admin navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-brand-cream text-brand-green md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
          >
            <div className="flex min-h-dvh flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="flex items-start justify-between gap-4 border-b border-brand-green/10 pb-5">
                <div>
                  <p className="text-xs font-bold tracking-[0.24em] text-brand-ochre">ADMIN</p>
                  <h2 className="mt-2 text-2xl font-semibold">Admin menu</h2>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center border border-brand-green/15"
                  onClick={() => setOpen(false)}
                  aria-label="Close admin navigation"
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
                      className="flex min-h-14 items-center justify-between border-b border-brand-green/10 py-3 text-xl font-semibold"
                    >
                      <span>{label}</span>
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-ochre">Open</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <button
                type="button"
                disabled={isPending}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-cream disabled:opacity-55"
                onClick={() => startTransition(() => { void signOutAction(); })}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
