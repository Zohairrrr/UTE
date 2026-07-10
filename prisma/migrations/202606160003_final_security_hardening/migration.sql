UPDATE storage.buckets
SET public = false
WHERE id = 'payment-receipts';

REVOKE ALL PRIVILEGES ON TABLE
  "users",
  "subscriptions",
  "orders",
  "payments",
  "subscription_plans",
  "meal_menu_items",
  "frozen_products",
  "business_settings",
  "admin_audit_logs",
  "pending_registrations",
  "password_reset_tokens",
  "rate_limit_counters",
  "subscription_deliveries",
  "app_event_logs"
FROM anon, authenticated;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscription_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meal_menu_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "frozen_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pending_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_reset_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limit_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscription_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app_event_logs" ENABLE ROW LEVEL SECURITY;
