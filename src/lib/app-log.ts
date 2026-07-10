import { prisma } from "@/lib/prisma";

type LogLevel = "INFO" | "WARN" | "ERROR";

export async function logEvent(input: {
  level?: LogLevel;
  scope: string;
  action: string;
  userId?: string | null;
  identifier?: string | null;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  try {
    await prisma.appEventLog.create({
      data: {
        level: input.level ?? "INFO",
        scope: input.scope,
        action: input.action,
        userId: input.userId ?? null,
        identifier: input.identifier ?? null,
        summary: input.summary,
        metadata: input.metadata ?? undefined
      }
    });
  } catch (error) {
    console.error("[app-log]", input.scope, input.action, error);
  }
}

export function logUnexpected(scope: string, action: string, error: unknown, context?: { userId?: string | null; identifier?: string | null }) {
  console.error(`[${scope}:${action}]`, error);
  return logEvent({
    level: "ERROR",
    scope,
    action,
    userId: context?.userId,
    identifier: context?.identifier,
    summary: error instanceof Error ? error.message.slice(0, 240) : "Unexpected error"
  });
}
