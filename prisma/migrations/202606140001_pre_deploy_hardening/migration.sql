-- Pre-deployment hardening and customer subscription delivery tracking.

DO $$ BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'SKIPPED', 'ISSUE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "requestedDeliverySlot" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedDeliverySlot" TEXT;

CREATE TABLE IF NOT EXISTS "pending_registrations" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "addressType" TEXT NOT NULL,
  "addressLine" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rate_limit_counters" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subscription_deliveries" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deliveryDate" TIMESTAMP(3) NOT NULL,
  "weekday" TEXT NOT NULL,
  "deliverySlot" TEXT NOT NULL,
  "menuItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "deliveredAt" TIMESTAMP(3),
  "issueNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "app_event_logs" (
  "id" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "userId" TEXT,
  "identifier" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_event_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_registrations_email_key" ON "pending_registrations"("email");
CREATE INDEX IF NOT EXISTS "pending_registrations_email_expiresAt_idx" ON "pending_registrations"("email", "expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_counters_scope_identifier_windowStart_key" ON "rate_limit_counters"("scope", "identifier", "windowStart");
CREATE INDEX IF NOT EXISTS "rate_limit_counters_windowStart_idx" ON "rate_limit_counters"("windowStart");

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_deliveries_subscriptionId_deliveryDate_key" ON "subscription_deliveries"("subscriptionId", "deliveryDate");
CREATE INDEX IF NOT EXISTS "subscription_deliveries_userId_deliveryDate_idx" ON "subscription_deliveries"("userId", "deliveryDate");
CREATE INDEX IF NOT EXISTS "subscription_deliveries_subscriptionId_deliveryDate_idx" ON "subscription_deliveries"("subscriptionId", "deliveryDate");

CREATE INDEX IF NOT EXISTS "subscriptions_userId_status_endDate_idx" ON "subscriptions"("userId", "status", "endDate");
CREATE INDEX IF NOT EXISTS "payments_userId_status_createdAt_idx" ON "payments"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "app_event_logs_scope_createdAt_idx" ON "app_event_logs"("scope", "createdAt");
CREATE INDEX IF NOT EXISTS "app_event_logs_userId_createdAt_idx" ON "app_event_logs"("userId", "createdAt");

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_deliveries"
  ADD CONSTRAINT "subscription_deliveries_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_deliveries"
  ADD CONSTRAINT "subscription_deliveries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
