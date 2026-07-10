# Urban Tiffin & Events

A premium, tactile, and grounded hospitality portal for homemade meal subscriptions, custom food requests, frozen goods ordering, and event catering/decor.

---

## 📂 Project Directory Structure

```
Client1/
├── 📂 planning/            # Core Product, Design & Architecture Blueprints
│   ├── DESIGN.md           # Visual identity, color tokens, typography & motion specs
│   ├── PRODUCT.md          # Users, purpose, anti-references & accessibility standards
│   └── SUPABASE_SETUP.md   # Supabase database, auth & storage bucket setup guidelines
│
├── 📂 scripts/             # Utility & Testing Scripts (isolated from runtime code)
│   ├── setup-trigger.ts    # Supabase user auto-sync database trigger setup
│   ├── test-db.ts          # Postgres / Prisma database connectivity verify utility
│   ├── test-mail.ts        # Nodemailer SMTP transport delivery validation
│   └── test-register.ts    # Server actions authentication flow test suite
│
├── 📂 src/                 # Next.js 15 Web Application Source Code
│   ├── 📂 actions/         # Server Actions (Auth, payments, bookings, etc.)
│   ├── 📂 app/             # App Router pages and API route endpoints
│   ├── 📂 components/      # UI components (tactile design system)
│   └── 📂 lib/             # Shared utility modules, clients, and types
│
├── 📂 prisma/              # Prisma Database Schema & Seed Data
│   ├── schema.prisma       # Active database schema models & relationship definitions
│   └── seed.ts             # Admin, standard subscription plans, & test data seed script
│
├── 📂 public/              # Static Assets & Global Images
│
└── ⚙️ Configuration Files (Root)
    ├── .admin-login.txt    # Generated admin seed credentials (git-ignored)
    ├── .env                # Local environmental variables (git-ignored)
    ├── .env.example        # Environmental variable template
    ├── eslint.config.mjs   # ESLint code style config
    ├── middleware.ts       # Next.js authentication & route security middleware
    ├── next.config.mjs     # Next.js configuration rules
    ├── postcss.config.mjs  # PostCSS Tailwind engine processing options
    ├── tailwind.config.ts  # Theme definitions matching Design system tokens
    └── tsconfig.json       # Strict TypeScript compiler options
```

---

## 🛠️ Getting Started & Commands

For detailed guide on the database, auth, and storage infrastructure setup, refer to [SUPABASE_SETUP.md](file:///home/zhrysn/Client1/planning/SUPABASE_SETUP.md).

### Installation
```bash
npm install
```

### Database Sync & Seed
Ensure you have copied `.env.example` to `.env` and populated all active connection credentials, then run:
```bash
# Push database schemas
npm run db:push

# Generate Prisma Client
npm run db:generate

# Seed essential catalog data & admin roles
npm run seed
```

### Running Utility Scripts
To execute any test or setup script, run using `tsx`:
```bash
# Setup Supabase Database Trigger (Must be run after db:push)
npx tsx scripts/setup-trigger.ts

# Test Database Connection
npx tsx scripts/test-db.ts

# Test SMTP Mail Dispatcher
npx tsx scripts/test-mail.ts

# Test Server Actions Registration
npx tsx scripts/test-register.ts
```

### Development Server
Run the local next.js instance:
```bash
npm run dev
```

---

## 🎨 Branding & Aesthetics

URBAN TIFFIN AND EVENTS utilizes an editorial visual system matching the logo:
* **Deep Forest Green** (`#233426`) - Main theme color
* **Muted Ochre** (`#A07A4B`) - Accentuation details
* **Warm Cream** (`#F9F7F2`) - Body canvas surface
* **Radius Specs** - Restrained to `0px` - `8px` max to reinforce the tactile, print-catalog feel.
* **Anti-goals** - No glassmorphism, pure-whites, gradient glows, or rounded pills.

For detailed guidelines on styling, check [DESIGN.md](file:///home/zhrysn/Client1/planning/DESIGN.md).
