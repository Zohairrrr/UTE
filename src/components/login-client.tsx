"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { loginAction, registerAction, verifyRegistrationOtpAction } from "@/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { SubmitButton } from "@/components/submit-button";
import { SUPPORTED_AREAS } from "@/lib/geo";

const initialState: { ok: boolean; message: string; email?: string } = { ok: false, message: "" };

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [loginState, login] = useActionState(loginAction, initialState);
  const [registerState, register] = useActionState(registerAction, initialState);
  const [otpState, verifyOtp] = useActionState(verifyRegistrationOtpAction, initialState);
  const pendingEmail = otpState.email || registerState.email || "";

  useEffect(() => {
    if (!loginState.message) return;
    if (loginState.ok) {
      router.push(params.get("next") || loginState.message);
    } else {
      toast.error(loginState.message);
    }
  }, [loginState, params, router]);

  useEffect(() => {
    if (!registerState.message) return;
    if (registerState.ok) {
      toast.success(registerState.message);
    } else {
      toast.error(registerState.message);
    }
  }, [registerState]);

  useEffect(() => {
    if (!otpState.message) return;
    if (otpState.ok) {
      router.push(otpState.message);
    } else {
      toast.error(otpState.message);
    }
  }, [otpState, router]);

  return (
    <main className="min-h-screen bg-brand-cream">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-px bg-brand-green/10 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="flex flex-col justify-between bg-brand-green p-8 text-brand-cream sm:p-12">
          <Link href="/" aria-label="Back to home" className="inline-flex">
            <BrandLogo compact />
          </Link>
          <div className="py-16">
            <p className="mb-5 text-sm font-bold tracking-[0.28em] text-brand-ochre">CUSTOMER ACCOUNT</p>
            <h1 className="text-balance font-display text-4xl leading-[0.98] tracking-[0.06em] sm:text-7xl">
              Manage Your Meal Orders.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-brand-cream/70">
              Sign in to send payment screenshots, track orders, and check your delivery details.
            </p>
          </div>
          <div className="border border-brand-cream/20 p-4 text-sm text-brand-cream/70">
            New customers can create an account before ordering meal plans, frozen food, or event catering.
          </div>
        </section>

        <section className="grid content-center gap-8 bg-brand-cream p-6 sm:p-10">
          <div className="flex items-center border-b border-brand-green/10 pb-4">
            <Link href="/" className="inline-flex items-center text-xs font-bold tracking-[0.2em] text-brand-green/70 hover:text-brand-green transition-colors duration-150">
              <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              BACK TO HOME
            </Link>
          </div>
          <div className="grid gap-8 xl:grid-cols-2">
            <form action={login} className="border border-brand-green/15 bg-brand-cream-dark p-6">
              <h2 className="font-display text-4xl tracking-[0.08em]">Sign in</h2>
              <div className="mt-8 grid gap-4">
                <input type="hidden" name="next" value={params.get("next") || ""} />
                <input required className="border-brand-green/15 bg-brand-cream" name="email" type="email" placeholder="Email address" />
                <input required className="border-brand-green/15 bg-brand-cream" name="password" type="password" minLength={8} placeholder="Password" />
                <SubmitButton>Sign in</SubmitButton>
                <Link className="text-sm font-semibold underline decoration-brand-ochre underline-offset-4" href="/forgot-password">
                  Reset password
                </Link>
              </div>
            </form>

            <div className="grid gap-5">
              <form action={register} className="border border-brand-green/15 bg-brand-cream p-6">
                <h2 className="font-display text-4xl tracking-[0.08em]">Create account</h2>
                <div className="mt-8 grid gap-4">
                  <input type="hidden" name="next" value={params.get("next") || ""} />
                  <input required className="border-brand-green/15 bg-brand-cream" name="name" placeholder="Full name" />
                  <input required className="border-brand-green/15 bg-brand-cream" name="email" type="email" placeholder="Email address" />
                  <input required className="border-brand-green/15 bg-brand-cream" name="phone" placeholder="Phone number" />
                  <input required className="border-brand-green/15 bg-brand-cream" name="password" type="password" minLength={8} placeholder="Password" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select required className="border-brand-green/15 bg-brand-cream text-sm" name="addressType">
                      <option value="Office">Office</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Home">Home</option>
                    </select>
                    <select required className="border-brand-green/15 bg-brand-cream text-sm" name="area">
                      <option value="">Select Area</option>
                      {SUPPORTED_AREAS.map((a) => (
                        <option key={a.name} value={a.name}>
                          {a.name} {a.surcharge > 0 ? `(+${a.surcharge} PKR)` : ""}
                        </option>
                      ))}
                      <option value="Other Lahore Area">Other/All Lahore Areas</option>
                    </select>
                  </div>
                  <textarea required className="min-h-24 border-brand-green/15 bg-brand-cream" name="addressLine" placeholder="Complete delivery address" />
                  <SubmitButton>Send OTP</SubmitButton>
                </div>
              </form>

              {pendingEmail ? (
                <form action={verifyOtp} className="border border-brand-ochre bg-brand-cream-dark p-6">
                  <h2 className="font-display text-3xl tracking-[0.08em]">Verify email OTP</h2>
                  <p className="mt-3 text-sm leading-6 text-brand-green/68">
                    Enter the 6-digit code sent to {pendingEmail}. The code expires in 10 minutes.
                  </p>
                  <div className="mt-6 grid gap-4">
                    <input type="hidden" name="next" value={params.get("next") || ""} />
                    <input type="hidden" name="email" value={pendingEmail} />
                    <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className="border-brand-green/15 bg-brand-cream" name="otp" placeholder="6-digit OTP" />
                    <SubmitButton>Verify and create account</SubmitButton>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
