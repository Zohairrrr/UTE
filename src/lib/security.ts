import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function normalizeEmail(value: FormDataEntryValue | string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function cleanText(value: FormDataEntryValue | string | null | undefined, max = 240) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function cleanMultiline(value: FormDataEntryValue | string | null | undefined, max = 1000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function hashSalt() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("SESSION_SECRET must be set to at least 24 characters.");
  }
  return secret;
}

export function hashSecret(value: string) {
  return createHash("sha256").update(`${hashSalt()}:${value}`).digest("hex");
}

export function randomOtp() {
  return String(randomInt(100000, 1000000));
}

export function randomResetToken() {
  return randomBytes(32).toString("base64url");
}

export function secretsMatch(rawValue: string, expectedHash: string) {
  const actual = Buffer.from(hashSecret(rawValue));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
