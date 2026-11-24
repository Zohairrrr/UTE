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

---

## 📱 Phase 4 app (CS3014 AHCI) — `/app`

A mobile web app for the three core tasks of our AHCI project, built from the Phase 4 Figma design
(file “Urban Tiffin & Events — AHCI”, pages *Phase 4 – Design System* and *Phase 4 – Hi-fi Screens*).
It lives in `public/app/` as plain HTML, CSS and JavaScript — no build step, no new dependencies —
and is served by this Next.js site at **`/app`** (for example `https://urbantiffinandevents.vercel.app/app`).

| Task | Flow in the app |
|------|-----------------|
| T1 – Subscribe to the Premium plan and upload the payment screenshot | Home → Menu (S-02) → Sign in (S-03) → Plan Checkout (S-04) → Order Submitted (S-05) |
| T2 – Check the dholki booking is confirmed and the amount received | Orders (S-06) → Order Details (S-07) → Receipt / Token (S-08, real PDF download) |
| T3 – Fix the mehndi booking after the screenshot was rejected | Order Details “Needs Attention” (S-07) → Upload New Screenshot (S-09) → Resubmitted (S-10) |

### Run it

```bash
npm install
npm run dev            # then open http://localhost:3000/app on a phone-sized window
```

No database is needed for `/app`: it reads mock data from `public/app/data/*.json` and keeps your
changes in the browser’s `localStorage`. To run it without Next.js, serve the `public/` folder with any
static server (e.g. `cd public && python3 -m http.server 8080`, then open `http://localhost:8080/app/index.html`).

**Test login:** mobile `0301 2345678`, password `tiffin123`.

**Showing every state in the demo:** Account → *Demo tools* can simulate a server error, a new user with no
orders, an expired session, and an admin confirming or rejecting the newest “Under Review” order. Use the
browser’s offline mode (or airplane mode) for the “no internet” state. *Reset all demo data* restores the start.

### Files

- `public/app/index.html` – app shell (top bar, screen area, tab bar, toast and dialog layers)
- `public/app/app.css` – design tokens that mirror the Figma variables (colours, type, spacing, radius)
- `public/app/app.js` – hash router, screens S-01–S-12, validation, states, mock back end, receipt PDF
- `public/app/icons.js` – Lucide icons (ISC licence), the same set as the Figma components
- `public/app/data/plans.json`, `orders.json` – mock data (the bank account shown is a sample, not real)
- `next.config.mjs` – adds the `/app` rewrite and allows Google Fonts (Cormorant Garamond, Plus Jakarta Sans, Noto Nastaliq Urdu) in the CSP

### Who built what (Group: 24F-0706, 24F-0688, 24F-0825, 24F-0660)

| Member | Built |
|--------|-------|
| Zohair Yaseen (24F-0706) | App shell and router, Orders list (S-06), offline/server-error handling, deployment |
| Abdullah Gujjar (24F-0688) | Design-system tokens in CSS, Home (S-01), Meal Plans (S-02), Sign in (S-03) |
| Talha Hussnain (24F-0825) | Plan Checkout (S-04), Order Submitted (S-05), Order Details (S-07), Receipt PDF (S-08) |
| Taha Humayun (24F-0660) | Fix payment (S-09), Resubmitted (S-10), Account (S-11), Notification settings (S-12), Urdu text |

Credits: photos are the business’s own; icons from Lucide (ISC); fonts from Google Fonts (OFL).
