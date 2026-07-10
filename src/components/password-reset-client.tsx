"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { requestPasswordResetAction, resetPasswordAction } from "@/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const initialState = { ok: false, message: "" };

export function ForgotPasswordClient() {
  const [state, action] = useActionState(requestPasswordResetAction, initialState);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <AuthPanel title="Reset password" copy="Enter your account email. If it exists, we will send a reset link that expires in 30 minutes.">
      <form action={action} className="mt-8 grid gap-4">
        <input required className="border-brand-green/15 bg-brand-cream" name="email" type="email" placeholder="Email address" />
        <SubmitButton>Send reset link</SubmitButton>
        <Link className="text-sm font-semibold underline decoration-brand-ochre underline-offset-4" href="/login">
          Back to sign in
        </Link>
      </form>
    </AuthPanel>
  );
}

export function ResetPasswordClient({ token }: { token: string }) {
  const router = useRouter();
  const [state, action] = useActionState(resetPasswordAction, initialState);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success("Password updated. Sign in with the new password.");
      router.push(state.message);
    } else {
      toast.error(state.message);
    }
  }, [router, state]);

  return (
    <AuthPanel title="Choose a new password" copy="Use at least 8 characters. This reset link can only be used once.">
      <form action={action} className="mt-8 grid gap-4">
        <input type="hidden" name="token" value={token} />
        <input required className="border-brand-green/15 bg-brand-cream" name="password" type="password" minLength={8} placeholder="New password" />
        <SubmitButton>Update password</SubmitButton>
      </form>
    </AuthPanel>
  );
}

function AuthPanel({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-cream px-4 py-12">
      <section className="w-full max-w-xl border border-brand-green/15 bg-brand-cream-dark p-6 sm:p-8">
        <div className="flex items-center border-b border-brand-green/10 pb-3 mb-6">
          <Link href="/" className="inline-flex items-center text-xs font-bold tracking-[0.2em] text-brand-green/70 hover:text-brand-green transition-colors duration-150">
            <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BACK TO HOME
          </Link>
        </div>
        <p className="mb-4 text-sm font-bold tracking-[0.26em] text-brand-ochre">CUSTOMER ACCOUNT</p>
        <h1 className="font-display text-4xl font-semibold tracking-[0.06em] text-brand-green sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-brand-green/68">{copy}</p>
        {children}
      </section>
    </main>
  );
}
