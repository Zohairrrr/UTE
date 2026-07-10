CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone");
CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users"("name");
CREATE INDEX IF NOT EXISTS "subscription_deliveries_deliveryDate_status_idx"
  ON "subscription_deliveries"("deliveryDate", "status");
