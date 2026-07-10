# Supabase Setup

Yes, create one Supabase project for this app.

## 1. Create Project
- Go to Supabase and create a new project.
- Copy the PostgreSQL connection string for Prisma.
- Use the pooled connection for `DATABASE_URL` if deploying to Vercel.
- Use the direct connection for `DIRECT_URL`.

## 2. Fill `.env`
Copy `.env.example` to `.env`, then fill:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://mcjfrbhtvimpkbszblue.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://mcjfrbhtvimpkbszblue.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-public-anon-key"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_i6KjKBskl_3YybEExWYraw_PcYIjgGQ"
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_STORAGE_BUCKET="payment-receipts"
SESSION_SECRET="make-this-long-and-random"
ADMIN_EMAIL="your-admin-email"
ADMIN_PASSWORD="your-admin-password"
BUSINESS_PHONE="+92..."
BUSINESS_WHATSAPP_URL="https://wa.me/92..."
BANK_ACCOUNT_TITLE="URBAN TIFFIN AND EVENTS"
BANK_ACCOUNT_NUMBER="..."
BANK_IBAN="..."
BANK_NAME="..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

The anon and publishable keys are public. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `DIRECT_URL` in client components.

## 3. Create Storage Bucket
In Supabase Storage:
- Create bucket: `payment-receipts`
- For the current implementation, make it public so receipt URLs render in the admin dashboard.
- A stricter private signed-URL flow can be added later if receipts must be hidden from public URLs.

## 4. Push Schema And Seed Admin
Run:

```bash
npm run db:push
npm run seed
```

If the direct database host resolves to IPv6 only on your machine, `db:push` may fail with `ENETUNREACH` or `P1001`. In that case, use the Supabase MCP/SQL migrations for schema changes and keep `DATABASE_URL` pointed at the pooler URL for the running app.

## 5. Run
```bash
npm run dev
```

Admin login uses the same `/login` page. If the seeded account has role `ADMIN`, it routes to `/admin`.

## Prisma Cost
Prisma ORM is free. Supabase free-tier limits are the only practical limit for the database/storage side unless you upgrade Supabase later.
