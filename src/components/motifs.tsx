import { clsx } from "clsx";

export function StarBadge({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={clsx("h-7 w-7", className)}
      viewBox="0 0 36 36"
      fill="none"
    >
      <path
        d="M18 2.5L21.6 14.4L33.5 18L21.6 21.6L18 33.5L14.4 21.6L2.5 18L14.4 14.4L18 2.5Z"
        fill="currentColor"
      />
      <path d="M18 9.5V26.5M9.5 18H26.5" stroke="#F9F7F2" strokeWidth="1.25" />
    </svg>
  );
}

export function FlagDivider({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={clsx("h-8 w-32", className)} viewBox="0 0 160 42" fill="none">
      <path d="M8 8C45 25 106 25 152 8" stroke="currentColor" strokeWidth="2" />
      <path d="M41 17L56 20L47 36L41 17Z" fill="currentColor" />
      <path d="M72 22H88V38L80 30L72 38V22Z" fill="currentColor" />
      <path d="M104 20L121 17L115 36L104 20Z" fill="currentColor" />
      <circle cx="8" cy="8" r="4" fill="currentColor" />
      <circle cx="152" cy="8" r="4" fill="currentColor" />
    </svg>
  );
}
