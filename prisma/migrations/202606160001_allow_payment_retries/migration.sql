ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_subscriptionId_key";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_orderId_key";

CREATE INDEX IF NOT EXISTS "payments_subscriptionId_status_createdAt_idx"
  ON "payments"("subscriptionId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "payments_orderId_status_createdAt_idx"
  ON "payments"("orderId", "status", "createdAt");
