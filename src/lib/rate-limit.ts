import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/app-log";
import { hashSecret } from "@/lib/security";
import { PublicActionError } from "@/lib/safe-action";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

function windowStartFor(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export async function requestIdentifier(fallback?: string) {
  try {
    const store = await headers();
    const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = store.get("x-real-ip")?.trim();
    const raw = forwarded || realIp || fallback || "unknown";
    return hashSecret(raw.toLowerCase());
  } catch {
    return hashSecret((fallback || "unknown").toLowerCase());
  }
}

export async function assertRateLimit(scope: string, identifier: string, options: RateLimitOptions) {
  const now = new Date();
  const windowStart = windowStartFor(now, options.windowMs);
  await cleanupOldCounters(now);

  const counter = await prisma.rateLimitCounter.upsert({
    where: {
      scope_identifier_windowStart: {
        scope,
        identifier,
        windowStart
      }
    },
    create: {
      scope,
      identifier,
      windowStart,
      count: 1
    },
    update: {
      count: { increment: 1 }
    }
  });

  if (counter.count > options.limit) {
    await logEvent({
      level: "WARN",
      scope: "rate-limit",
      action: scope,
      identifier,
      summary: `Rate limit exceeded for ${scope}`
    });
    throw new PublicActionError("Too many attempts. Wait a few minutes and try again.");
  }
}

async function cleanupOldCounters(now: Date) {
  if (Math.random() > 0.02) return;
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  await prisma.rateLimitCounter.deleteMany({
    where: { windowStart: { lt: cutoff } }
  });
}
