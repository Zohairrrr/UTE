"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/app-log";
import { sendMail } from "@/lib/mail";
import { assertRateLimit, requestIdentifier } from "@/lib/rate-limit";
import { ActionState, safeAction } from "@/lib/safe-action";
import { cleanMultiline, cleanText, hashSecret, normalizeEmail, publicSiteUrl, randomOtp, randomResetToken, secretsMatch } from "@/lib/security";
import { signSessionToken } from "@/lib/session";
import { isSupportedArea } from "@/lib/geo";

type AuthState = ActionState & {
  email?: string;
};

const genericResetMessage = "If that email is registered, a reset link has been sent.";
const genericOtpMessage = "If those details are valid, an OTP has been sent to the email address.";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(30),
  addressType: z.string().min(2).max(40),
  addressLine: z.string().min(6).max(500),
  area: z.string().min(2).max(80)
});

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
  next: z.string().optional()
});

const resetRequestSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128)
});

async function setSession(user: {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  name: string;
}) {
  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });
  const store = await cookies();
  store.set("urban_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && publicSiteUrl().startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  return safeAction("auth", "login", async () => {
    const email = normalizeEmail(formData.get("email"));
    const identifier = await requestIdentifier(email);
    await assertRateLimit("auth:login", identifier, { limit: 8, windowMs: 10 * 60 * 1000 });

    const parsed = loginSchema.safeParse({
      email,
      password: String(formData.get("password") ?? "")
    });
    if (!parsed.success) {
      return { ok: false, message: "Enter a valid email and password." };
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user?.role === "ADMIN") {
      await assertRateLimit("auth:admin_login", identifier, { limit: 4, windowMs: 15 * 60 * 1000 });
    }
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      await logEvent({
        level: "WARN",
        scope: "auth",
        action: user?.role === "ADMIN" ? "admin_login_failed" : "login_failed",
        identifier,
        summary: "Invalid login attempt"
      });
      return { ok: false, message: "Credentials did not match an active account." };
    }

    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    await logEvent({
      scope: "auth",
      action: user.role === "ADMIN" ? "admin_login_success" : "login_success",
      userId: user.id,
      summary: "User signed in"
    });
    return { ok: true, message: resolvePostAuthPath(user.role, formData.get("next")) };
  }, "Sign in failed. Try again.");
}

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  return safeAction("auth", "register_request", async () => {
    const email = normalizeEmail(formData.get("email"));
    const identifier = await requestIdentifier(email);
    await assertRateLimit("auth:register", identifier, { limit: 4, windowMs: 30 * 60 * 1000 });

    const parsed = registerSchema.safeParse({
      name: cleanText(formData.get("name"), 80),
      email,
      phone: cleanText(formData.get("phone"), 30),
      password: String(formData.get("password") ?? ""),
      addressType: cleanText(formData.get("addressType"), 40),
      addressLine: cleanMultiline(formData.get("addressLine"), 500),
      area: cleanText(formData.get("area"), 80)
    });

    if (!parsed.success) {
      return { ok: false, message: "Complete every account field before requesting OTP." };
    }

    if (!isSupportedArea(parsed.data.area)) {
      return { ok: false, message: "We only deliver to DHA, Gulberg, Johar Town, Cantt, Model Town, Garden Town, Faisal Town, and Iqbal Town." };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (existing) {
      await logEvent({ level: "WARN", scope: "auth", action: "register_existing_email", identifier, summary: "Registration requested for existing email" });
      return { ok: true, message: genericOtpMessage, email: parsed.data.email };
    }

    const otp = randomOtp();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingRegistration.upsert({
      where: { email: parsed.data.email },
      update: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        passwordHash,
        addressType: parsed.data.addressType,
        addressLine: parsed.data.addressLine,
        area: parsed.data.area,
        otpHash: hashSecret(otp),
        expiresAt,
        attemptCount: 0
      },
      create: {
        email: parsed.data.email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        passwordHash,
        addressType: parsed.data.addressType,
        addressLine: parsed.data.addressLine,
        area: parsed.data.area,
        otpHash: hashSecret(otp),
        expiresAt
      }
    });

    await sendMail({
      to: parsed.data.email,
      subject: "Your URBAN TIFFIN account OTP",
      text: `Your URBAN TIFFIN AND EVENTS verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your URBAN TIFFIN AND EVENTS verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });

    await logEvent({ scope: "auth", action: "otp_sent", identifier, summary: "Registration OTP sent" });
    return { ok: true, message: genericOtpMessage, email: parsed.data.email };
  }, "Could not request OTP. Try again.");
}

export async function verifyRegistrationOtpAction(_: AuthState, formData: FormData): Promise<AuthState> {
  return safeAction("auth", "register_verify", async () => {
    const email = normalizeEmail(formData.get("email"));
    const identifier = await requestIdentifier(email);
    await assertRateLimit("auth:otp_verify", identifier, { limit: 6, windowMs: 15 * 60 * 1000 });

    const parsed = otpSchema.safeParse({
      email,
      otp: cleanText(formData.get("otp"), 6),
      next: cleanText(formData.get("next"), 160)
    });
    if (!parsed.success) {
      return { ok: false, message: "Enter the 6-digit OTP sent to your email.", email };
    }

    const pending = await prisma.pendingRegistration.findUnique({ where: { email: parsed.data.email } });
    if (!pending || pending.expiresAt <= new Date()) {
      return { ok: false, message: "OTP expired. Request a new code.", email: parsed.data.email };
    }
    if (pending.attemptCount >= 5) {
      return { ok: false, message: "Too many OTP attempts. Request a new code.", email: parsed.data.email };
    }

    if (!secretsMatch(parsed.data.otp, pending.otpHash)) {
      await prisma.pendingRegistration.update({
        where: { email: pending.email },
        data: { attemptCount: { increment: 1 } }
      });
      return { ok: false, message: "OTP did not match. Check the code and try again.", email: pending.email };
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          phone: pending.phone,
          passwordHash: pending.passwordHash,
          addressType: pending.addressType,
          addressLine: pending.addressLine,
          area: pending.area
        }
      });
      await tx.pendingRegistration.delete({ where: { email: pending.email } });
      return created;
    });

    await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    await logEvent({ scope: "auth", action: "register_success", userId: user.id, summary: "User verified OTP and registered" });
    return { ok: true, message: resolvePostAuthPath(user.role, parsed.data.next) };
  }, "Could not verify OTP. Try again.");
}

export async function requestPasswordResetAction(_: AuthState, formData: FormData): Promise<AuthState> {
  return safeAction("auth", "password_reset_request", async () => {
    const email = normalizeEmail(formData.get("email"));
    const identifier = await requestIdentifier(email);
    await assertRateLimit("auth:password_reset_request", identifier, { limit: 4, windowMs: 30 * 60 * 1000 });

    const parsed = resetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      return { ok: false, message: "Enter a valid email address." };
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true, name: true } });
    if (user) {
      const token = randomResetToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashSecret(token),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        }
      });

      const resetUrl = `${publicSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: user.email,
        subject: "Reset your URBAN TIFFIN password",
        text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl}`,
        html: `<p>Use this link to reset your password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`
      });
      await logEvent({ scope: "auth", action: "password_reset_sent", userId: user.id, summary: "Password reset email sent" });
    }

    return { ok: true, message: genericResetMessage };
  }, "Could not request password reset. Try again.");
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  return safeAction("auth", "password_reset_submit", async () => {
    const identifier = await requestIdentifier("password-reset");
    await assertRateLimit("auth:password_reset_submit", identifier, { limit: 6, windowMs: 30 * 60 * 1000 });

    const parsed = resetPasswordSchema.safeParse({
      token: cleanText(formData.get("token"), 200),
      password: String(formData.get("password") ?? "")
    });
    if (!parsed.success) {
      return { ok: false, message: "Reset link or password is invalid." };
    }

    const tokenHash = hashSecret(parsed.data.token);
    const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      return { ok: false, message: "Reset link expired. Request a new password reset." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: token.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } })
    ]);

    await logEvent({ scope: "auth", action: "password_reset_success", userId: token.userId, summary: "Password reset completed" });
    return { ok: true, message: "/login" };
  }, "Could not reset password. Try again.");
}

function resolvePostAuthPath(role: "CUSTOMER" | "ADMIN", nextValue: FormDataEntryValue | string | null | undefined) {
  if (role === "ADMIN") return "/admin";
  const next = typeof nextValue === "string" ? nextValue : "";
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin")) {
    return next;
  }
  return "/account";
}
