"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-cream px-4">
      <section className="max-w-lg border border-brand-green/15 bg-brand-cream-dark p-8 text-brand-green">
        <p className="text-sm font-bold tracking-[0.26em] text-brand-ochre">SERVICE NOTICE</p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[0.06em]">Something went wrong.</h1>
        <p className="mt-5 text-sm leading-6 text-brand-green/68">
          The request could not be completed. Try again, or contact the URBAN TIFFIN AND EVENTS team if it keeps happening.
        </p>
        <button className="mt-6 border border-brand-green bg-brand-green px-5 py-3 text-sm font-semibold text-brand-cream" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
