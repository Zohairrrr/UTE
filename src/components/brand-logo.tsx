import Image from "next/image";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {!compact && (
        <Image
          src="/brand/urban-tiffin-logo.jpeg"
          alt="URBAN TIFFIN AND EVENTS logo"
          width={52}
          height={52}
          className="hidden h-12 w-12 border border-brand-green/15 object-cover sm:block"
          priority
        />
      )}
      <div className="leading-none">
        <div className="font-display text-xl tracking-[0.18em] text-brand-green sm:text-3xl sm:tracking-[0.22em]">URBAN</div>
        <div className="mt-1 text-[0.48rem] font-semibold tracking-[0.28em] text-brand-green/70 sm:text-[0.58rem] sm:tracking-[0.42em]">
          TIFFIN AND EVENTS
        </div>
      </div>
    </div>
  );
}
