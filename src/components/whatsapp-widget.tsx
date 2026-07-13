"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MessageSquare, Phone, X } from "lucide-react";
import { usePathname } from "next/navigation";

// Register useGSAP plugin
gsap.registerPlugin(useGSAP);

interface WhatsAppWidgetProps {
  phone: string;
  whatsappUrl: string;
}


export function WhatsAppWidget({ phone, whatsappUrl }: WhatsAppWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Safe client-side checks
  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // GSAP Menu Animations
  useGSAP(
    () => {
      if (prefersReducedMotion) {
        if (isOpen) {
          gsap.set(menuRef.current, { display: "block", opacity: 1, scale: 1, y: 0 });
          gsap.set(".whatsapp-menu-item", { opacity: 1, x: 0 });
          gsap.set(".whatsapp-icon-main", { opacity: 0, scale: 0 });
          gsap.set(".whatsapp-icon-close", { opacity: 1, scale: 1, rotate: 0 });
        } else {
          gsap.set(menuRef.current, { display: "none", opacity: 0 });
          gsap.set(".whatsapp-icon-main", { opacity: 1, scale: 1, rotate: 0 });
          gsap.set(".whatsapp-icon-close", { opacity: 0, scale: 0 });
        }
        return;
      }

      if (isOpen) {
        // Menu container animation
        gsap.fromTo(
          menuRef.current,
          { opacity: 0, y: 15, scale: 0.96 },
          {
            display: "block",
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.38,
            ease: "power3.out"
          }
        );

        // Stagger menu options
        gsap.fromTo(
          ".whatsapp-menu-item",
          { opacity: 0, x: 8 },
          {
            opacity: 1,
            x: 0,
            duration: 0.25,
            stagger: 0.06,
            ease: "power2.out",
            delay: 0.08
          }
        );

        // Toggle icon crossfade
        gsap.to(".whatsapp-icon-main", {
          rotate: 90,
          scale: 0,
          opacity: 0,
          duration: 0.25,
          ease: "power2.inOut"
        });
        gsap.to(".whatsapp-icon-close", {
          rotate: 0,
          scale: 1,
          opacity: 1,
          duration: 0.25,
          ease: "power2.inOut"
        });
      } else {
        // Close menu animation
        gsap.to(menuRef.current, {
          opacity: 0,
          y: 12,
          scale: 0.96,
          duration: 0.22,
          ease: "power2.in",
          onComplete: () => {
            if (menuRef.current) menuRef.current.style.display = "none";
          }
        });

        // Toggle icon crossface back
        gsap.to(".whatsapp-icon-main", {
          rotate: 0,
          scale: 1,
          opacity: 1,
          duration: 0.25,
          ease: "power2.inOut"
        });
        gsap.to(".whatsapp-icon-close", {
          rotate: -90,
          scale: 0,
          opacity: 0,
          duration: 0.25,
          ease: "power2.inOut"
        });
      }
    },
    { dependencies: [isOpen, prefersReducedMotion], scope: containerRef }
  );

  // GSAP Pulse Ring Animation
  useGSAP(
    () => {
      if (isOpen || prefersReducedMotion || !ringRef.current) return;

      const pulse = gsap.to(ringRef.current, {
        scale: 1.45,
        opacity: 0,
        duration: 2.2,
        repeat: -1,
        ease: "power1.out"
      });

      return () => {
        pulse.kill();
      };
    },
    { dependencies: [isOpen, prefersReducedMotion], scope: containerRef }
  );

  // Magnetic hover handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isOpen || prefersReducedMotion || !containerRef.current || !buttonRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;

    // Apply gentle magnetic pull (35% force)
    gsap.to(buttonRef.current, {
      x: relX * 0.35,
      y: relY * 0.35,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = () => {
    if (prefersReducedMotion || !buttonRef.current) return;

    // Release back to center with rubber-band elastic ease
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1.1, 0.4)"
    });
  };

  // Redirection Link Builders
  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  const cleanWhatsAppNumber =
    whatsappUrl.split("wa.me/")[1]?.split("?")[0] || cleanPhone.replace(/[^0-9]/g, "");

  const msgText = "Hello! I would like to inquire about your catering/meal plans.";
  const callText = "Hi! I would like to request a voice call to discuss my order.";

  const messageHref = isMobile
    ? `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(msgText)}`
    : `https://web.whatsapp.com/send?phone=${cleanWhatsAppNumber}&text=${encodeURIComponent(msgText)}`;

  const callHref = isMobile
    ? `tel:${cleanPhone}`
    : `https://web.whatsapp.com/send?phone=${cleanWhatsAppNumber}&text=${encodeURIComponent(callText)}`;

  const isHiddenRoute = pathname?.startsWith("/admin") || 
                        pathname?.startsWith("/login") || 
                        pathname?.startsWith("/forgot-password") || 
                        pathname?.startsWith("/reset-password");

  if (isHiddenRoute) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-6 right-6 z-[60] flex items-center justify-center h-20 w-20 pointer-events-auto"
    >
      {/* Pulse Ring (visible only when closed) */}
      {!isOpen && !prefersReducedMotion && (
        <div
          ref={ringRef}
          className="absolute inset-[13px] border border-brand-green/30 rounded-full -z-10 pointer-events-none"
        />
      )}

      {/* Options Menu */}
      <div
        ref={menuRef}
        style={{ display: "none" }}
        className="absolute bottom-24 right-3 bg-brand-cream border border-brand-green/18 p-4 shadow-sharp w-64 md:w-72"
      >
        <div className="mb-3">
          <h4 className="font-display text-lg text-brand-green tracking-wide">
            Connect with us
          </h4>
          <p className="text-[10px] uppercase tracking-widest text-brand-green/50 mt-0.5">
            Tiffin & Events Support
          </p>
        </div>

        <div className="border-t border-brand-green/10 my-3" />

        <div className="flex flex-col gap-2">
          {/* Option 1: Message */}
          <a
            href={messageHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="whatsapp-menu-item flex items-center justify-between border border-brand-green bg-brand-green px-4 py-2.5 text-xs font-semibold text-brand-cream transition hover:bg-brand-ochre hover:border-brand-ochre hover:pl-5 duration-200"
          >
            <span className="tracking-wide">MESSAGE ON WHATSAPP</span>
            <MessageSquare className="h-4 w-4 shrink-0" />
          </a>

          {/* Option 2: Call */}
          <a
            href={callHref}
            target={isMobile ? undefined : "_blank"}
            rel={isMobile ? undefined : "noopener noreferrer"}
            onClick={() => setIsOpen(false)}
            className="whatsapp-menu-item flex items-center justify-between border border-brand-green bg-transparent px-4 py-2.5 text-xs font-semibold text-brand-green transition hover:bg-brand-green hover:text-brand-cream hover:pl-5 duration-200"
          >
            <span className="tracking-wide">{isMobile ? "CALL DIRECTLY" : "REQUEST VOICE CALL"}</span>
            <Phone className="h-4 w-4 shrink-0" />
          </a>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 flex items-center justify-center relative focus:outline-none z-50"
        aria-label="Toggle contact menu"
      >
        {/* Main WhatsApp Icon */}
        <div className="absolute inset-0 flex items-center justify-center whatsapp-icon-main p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/whatsapp-logo.png" alt="WhatsApp" className="h-full w-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]" />
        </div>

        {/* Close Icon (reveals on click) */}
        <div className="absolute inset-0 flex items-center justify-center whatsapp-icon-close opacity-0 scale-0 -rotate-90">
          <div className="h-12 w-12 rounded-full bg-brand-green text-brand-cream border border-brand-green/20 flex items-center justify-center shadow-sharp">
            <X className="h-6 w-6" />
          </div>
        </div>
      </button>
    </div>
  );
}
