"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const SPLASH_SEEN_KEY = "urban_tiffin_splash_seen";
const PUBLIC_SPLASH_PATHS = new Set(["/", "/about", "/subscriptions", "/custom-order", "/frozen-goods", "/events"]);
const LETTERS = "URBAN".split("");
const easeOutQuart: [number, number, number, number] = [0.22, 1, 0.36, 1];
const exitEase: [number, number, number, number] = [0.76, 0, 0.24, 1];

function normalizedPath(pathname: string | null) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function shouldShowForPath(pathname: string | null) {
  return PUBLIC_SPLASH_PATHS.has(normalizedPath(pathname));
}

export function BrandSplash() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  const isPublicSplashPath = useMemo(() => shouldShowForPath(pathname), [pathname]);

  useEffect(() => {
    if (!isPublicSplashPath) {
      setIsVisible(false);
      setIsExiting(false);
      setHasCheckedSession(true);
      return;
    }

    try {
      const hasSeenSplash = window.sessionStorage.getItem(SPLASH_SEEN_KEY) === "true";
      setIsVisible(!hasSeenSplash);
    } catch {
      setIsVisible(true);
    } finally {
      setHasCheckedSession(true);
    }
  }, [isPublicSplashPath]);

  useEffect(() => {
    if (!isPublicSplashPath || !hasCheckedSession || !isVisible) return;

    const duration = prefersReducedMotion ? 650 : 1800;
    const timeout = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SPLASH_SEEN_KEY, "true");
      } catch {
        // Session storage can be unavailable in private or locked-down browser contexts.
      }
      setIsExiting(true);
      setIsVisible(false);
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [hasCheckedSession, isPublicSplashPath, isVisible, prefersReducedMotion]);

  useEffect(() => {
    if (!isVisible && !isExiting) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible, isExiting]);

  if (!isPublicSplashPath || (!isVisible && !isExiting)) return null;

  const lineTransition: Transition = prefersReducedMotion ? { duration: 0.01 } : { duration: 0.5, ease: easeOutQuart, delay: 0.22 };
  const accentTransition: Transition = prefersReducedMotion ? { duration: 0.01 } : { duration: 0.18, ease: easeOutQuart };

  return (
    <AnimatePresence onExitComplete={() => setIsExiting(false)}>
      {isVisible && (
        <motion.div
          aria-label="URBAN TIFFIN AND EVENTS loading"
          className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-brand-cream text-brand-green"
          initial={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0.98, y: "-3.5rem", clipPath: "inset(0% 0% 100% 0%)" }
          }
          transition={{ duration: prefersReducedMotion ? 0.18 : 0.35, ease: exitEase }}
        >
          <div className="flex w-[min(82vw,26rem)] flex-col items-center">
            <motion.svg
              aria-hidden="true"
              className="mb-4 h-8 w-48 text-brand-ochre sm:w-56"
              viewBox="0 0 224 34"
              fill="none"
              initial={false}
            >
              <motion.path
                d="M8 18C56 6 162 6 216 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 0.75 : 0 }}
                animate={{ pathLength: 1, opacity: 0.75 }}
                transition={lineTransition}
              />
              {[58, 112, 166].map((x, index) => (
                <motion.path
                  key={x}
                  d={index === 1 ? `M${x - 8} 16H${x + 8}V31L${x} 24L${x - 8} 31V16Z` : `M${x - 9} 14L${x + 8} 17L${x - 2} 32L${x - 9} 14Z`}
                  fill="currentColor"
                  initial={prefersReducedMotion ? { opacity: 0.8 } : { opacity: 0, scale: 0.72, y: -2 }}
                  animate={{ opacity: 0.8, scale: 1, y: 0 }}
                  transition={{ ...accentTransition, delay: prefersReducedMotion ? 0 : 0.58 + index * 0.06 }}
                />
              ))}
            </motion.svg>

            <div className="flex items-baseline justify-center gap-[0.16em] font-display text-[2.7rem] font-semibold leading-none tracking-[0.18em] text-brand-green sm:text-[4rem] sm:tracking-[0.22em]">
              {LETTERS.map((letter, index) => (
                <motion.span
                  key={letter}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.16 : 0.28,
                    delay: prefersReducedMotion ? 0 : 0.38 + index * 0.075,
                    ease: easeOutQuart
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.div
              className="mt-2 text-center text-[0.58rem] font-semibold tracking-[0.34em] text-brand-green/70 sm:text-[0.68rem] sm:tracking-[0.44em]"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.18 : 0.28, delay: prefersReducedMotion ? 0.08 : 0.85, ease: easeOutQuart }}
            >
              TIFFIN AND EVENTS
            </motion.div>

            <motion.svg
              aria-hidden="true"
              className="mt-5 h-10 w-44 text-brand-ochre sm:w-52"
              viewBox="0 0 208 42"
              fill="none"
            >
              <motion.path
                d="M8 10C58 28 149 28 200 10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 0.7 : 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ ...lineTransition, delay: prefersReducedMotion ? 0 : 0.72 }}
              />
              {[8, 200].map((cx, index) => (
                <motion.circle
                  key={cx}
                  cx={cx}
                  cy="10"
                  r="4"
                  fill="currentColor"
                  initial={prefersReducedMotion ? { opacity: 0.75 } : { opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 0.75, scale: 1 }}
                  transition={{ ...accentTransition, delay: prefersReducedMotion ? 0 : 1 + index * 0.04 }}
                />
              ))}
              <motion.path
                d="M104 4L108 16L120 20L108 24L104 36L100 24L88 20L100 16L104 4Z"
                fill="currentColor"
                initial={prefersReducedMotion ? { opacity: 0.9 } : { opacity: 0, rotate: -10, scale: 0.55 }}
                animate={{ opacity: 0.9, rotate: 0, scale: 1 }}
                transition={{ ...accentTransition, delay: prefersReducedMotion ? 0 : 1.06 }}
              />
            </motion.svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
