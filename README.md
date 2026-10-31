# 👑 The Royal Knot

> A luxury wedding-agency management platform — from a couple's first enquiry to the founder's season P&L review.

Built for a hackathon around the brief for **The Royal Knot**, a luxury agency in Jaipur and Udaipur that plans ~25 three-day destination weddings a season, each with 400+ guests and ~18 vendors.

---

## The Problem

The agency loses enquiries across Instagram and WhatsApp, compares vendor quotes by hand, rewrites checklists for every wedding, misses advance payments, and only learns a wedding's profit long after the season ends. The brief asks for one **digital backbone** where each action triggers the next.

---

## What It Does — Scene by Scene

| Scene | Feature | Status |
|---|---|---|
| First consultation | Enquiry pipeline with stage tracking, couple sign a service agreement on a touch-friendly signature pad, signed copy stored in private Supabase bucket | ✅ Done |
| Three caterers, one decision | Vendor quotes shown side-by-side with aligned columns (price/plate, extras, inclusions, rating). Awarding one closes siblings in a single DB transaction | ✅ Done |
| The instant wedding plan | Recording the booking deposit runs `record_booking_deposit()` — creates the wedding, ~30 tasks from templates, and 3 payment milestones atomically | ✅ Done |
| Big day schedule | Live minute-by-minute run-sheet with vendor arrival check-in, late flags, and incident logging | ✅ Done |
| Paying vendors and extras | Vendor bills, extra charges (client-billable vs absorbed), double-payment guard, vendor balance reconciliation | ✅ Done |
| Founder's season review | Profit per wedding, vendor scorecards, 30-day liquidity forecast, **overdue obligations** (highlighted red), read-only share link | ✅ Done |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS · Cormorant Garamond + Manrope (local fonts, no Google Fonts CDN dependency) |
| Database | Supabase (Postgres) with Row Level Security on every table |
| Storage | Supabase Storage — private `signatures` bucket |
| Business logic | PL/pgSQL functions (`record_booking_deposit`, `award_quote`) — multi-step actions succeed or fail together |
| Writes | Next.js server actions + `server-only` service role client — secret key never reaches the browser |
| Analytics | Postgres views: `wedding_profit`, `vendor_scorecard`, `dues_next_30_days`, `overdue_dues`, `vendor_balances`, `client_invoice` |

---

## Architecture Highlights

- **One transaction, no orphans.** `record_booking_deposit` and `award_quote` are database functions. A wedding can never exist without its payment milestones; a quote award can never leave siblings half-open.
- **Computed, never typed.** Every dashboard number is derived from database rows — no denormalised counters to drift.
- **Secure by default.** RLS is enabled on every table. The public anon key can only `SELECT`. All writes go through server actions. `SUPABASE_SERVICE_ROLE_KEY` never touches the browser.
- **Demo vs live.** Every seeded row carries `is_demo = true` and shows a **Demo** badge. Records created through the UI show **Live Client**.
- **No network at build time.** Fonts are loaded from `public/fonts/` via `next/font/local` — a Google Fonts timeout cannot break the build.

---

## Project Structure

```
royal-knot/
├── app/                          Next.js application root
│   ├── app/                      Routes (App Router pages)
│   │   ├── page.tsx              Overview / dashboard
│   │   ├── enquiries/            Enquiry pipeline + detail + agreement signing
│   │   ├── weddings/             Wedding detail + task board
│   │   ├── vendor-quotes/        Quote requests + side-by-side comparison + award
│   │   ├── command-center/       Day-of run-sheet, arrival check-in, incidents
│   │   ├── payments/             Client payments + vendor bills + extras
│   │   ├── analytics/            Profit, scorecards, dues, share link
│   │   ├── vendors/              Vendor directory
│   │   ├── share/[token]/        Public read-only analytics view
│   │   ├── loading.tsx           Root loading skeleton
│   │   └── error.tsx             Root error boundary with retry
│   ├── actions/                  Server actions (all writes)
│   │   ├── enquiries.ts
│   │   ├── weddings.ts
│   │   ├── quotes.ts
│   │   ├── command-center.ts
│   │   ├── payments.ts
│   │   └── analytics.ts
│   ├── components/               Shared UI components
│   │   ├── AnalyticsClient.tsx   Profit, scorecard, dues, overdue, share
│   │   ├── PaymentsClient.tsx    Bills, client payments, extras
│   │   ├── QuoteComparisonClient.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts         Service role client (server-only)
│   │   │   └── client.ts         Anon client (browser)
│   │   └── overview.ts           Dashboard metric queries
│   ├── scripts/seed.ts           Idempotent demo data seed
│   └── supabase/migrations/      SQL — run in filename order
│       ├── 20261031000001_phase0_schema.sql
│       ├── 20261031000002_phase2.sql
│       ├── 20261031000003_phase3.sql
│       ├── 20261031000004_fixes.sql
│       ├── 20261031000005_phase4.sql
│       ├── 20261031000006_phase5.sql
│       ├── 20261031000007_phase6.sql
│       └── 20261031000008_phase7.sql
├── docs/                         Brief and build playbook
└── prototype/                    Phase 1 HTML design prototype
```

---

## Running Locally

**Requirements:** Node.js 20+, a free [Supabase](https://supabase.com) project.

### 1 — Clone and install

```bash
git clone https://github.com/bshravyardy-maker/royal-knot.git
cd royal-knot/app
npm install
```

### 2 — Environment variables

Copy `.env.example` to `.env.local` and fill in your own values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Security:** The URL has no path or trailing slash. Never commit `.env.local`. The service role key must never reach the browser — the app enforces this with `import "server-only"`.

### 3 — Run migrations

In the Supabase **SQL Editor**, run each file in `app/supabase/migrations/` in filename order (oldest first). Each file is idempotent — safe to re-run.

### 4 — Seed demo data

```bash
npm run seed
```

The seed script is idempotent: it deletes all `is_demo = true` rows before re-inserting. It prints row counts per table and exits non-zero on any Supabase error, naming the failing table.

### 5 — Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Trying the Main Flows

### Enquiry → Wedding
1. Click **New Enquiry**, fill in couple details and budget.
2. Open the enquiry, advance through stages (New → Contacted → Meeting → Proposal).
3. Generate and sign the service agreement on the signature pad.
4. Record the booking deposit. A wedding, ~30 tasks and 3 payment milestones are created atomically.

### Vendor Quotes → Award
1. Open **Vendor Quotes** and create a new quote request for a wedding.
2. Add quotes from different vendors (price/plate, extra-hour rate, inclusions).
3. Compare them side-by-side and click **Award** — the winner is linked to the wedding; others close automatically.

### Day-of Command Center
1. Open **Command Center** for today's wedding.
2. Click **Mark Arrived** as vendors check in — the button becomes idempotent after the first press.
3. Log an incident (e.g. generator needed) with severity and owner.

### Payments & Billing
1. Open **Payments** to view client milestones (Booking, Advance, Final).
2. Record vendor bills and match payments against them.
3. Add extra charges — mark whether billable to the client or absorbed.

### Analytics & Share
1. Open **Analytics** to see profit per wedding, vendor scorecards, 30-day dues forecast and overdue obligations (highlighted in red).
2. Create a **Share Link** to send a read-only view to a co-founder or investor.

---

## Database Functions

| Function | What it does |
|---|---|
| `record_booking_deposit(p_enquiry_id, p_amount)` | Single transaction: validates the enquiry, sets it to Won, creates the wedding, generates tasks from templates, inserts 3 client payment milestones |
| `award_quote(p_quote_id)` | Single transaction: rejects if request is not Open, marks chosen quote Awarded, closes siblings, closes the request, inserts a `wedding_vendors` row |

---

## Database Views

| View | Purpose |
|---|---|
| `wedding_profit` | Revenue, vendor cost, absorbed extras, team cost, profit, margin %, loss reason |
| `vendor_scorecard` | Per-vendor on-time rate, avg bill variance, rating, wedding count |
| `vendor_balances` | Per `wedding_vendor`: agreed, billed, paid, remaining |
| `client_invoice` | Contract value + billable extras − received = outstanding |
| `dues_next_30_days` | Unpaid client/vendor items due within the next 30 days |
| `overdue_dues` | Unpaid items past their due date, with `days_overdue` |

---

## Build Checklist

- [x] Phase 0 — Scaffold, schema, shell, overview dashboard, quick-create enquiry, seed
- [x] Phase 2 — Enquiry pipeline, agreement signing, booking deposit → wedding + tasks + payments
- [x] Phase 3 — Vendor quote requests, side-by-side comparison, award transaction
- [x] Phase 4 — Day-of command center: run-sheet, vendor arrival check-in, incident logging
- [x] Phase 5 — Vendor bills, extra charges, double-payment guard, balance reconciliation
- [x] Phase 6 — Founder analytics: profit view, vendor scorecard, dues forecast, share link
- [x] Phase 7 — Overdue dues view and UI, loading skeletons, error boundaries, deploy readiness
- [ ] Phase 7 (remaining) — Full 25-wedding / 60-vendor seed with batch inserts, per-route loading/error files, mobile polish

---

## Known Limitations

- **No authentication.** Anyone with the URL can view all data. Auth is the next planned phase.
- **Demo data only.** All seeded records are fictional. The `is_demo` flag separates them from live entries.
- **Seed validation.** The profit-per-wedding verification step (exactly 4 loss weddings) is not yet implemented in the seed script — the financial ecosystem (vendor bills, extra charges, overruns) still needs a full rewrite.
- **Per-route loading/error files** exist only at the root level; sub-routes show the root skeleton.

---

## Security Notes

- Row Level Security is enabled on every table.
- The anon key has `SELECT` only on all tables. All `INSERT`/`UPDATE`/`DELETE` goes through server actions with the service role key.
- No client component imports the service role client.
- `.env.local` is in `.gitignore` and has never been committed.
- `app/.env.example` contains only placeholder strings — never real credentials.

---

## Built With

- **[Supabase](https://supabase.com)** — Postgres, RLS, Storage
- **[Next.js](https://nextjs.org)** — App Router, server actions, `server-only`
- **[Tailwind CSS](https://tailwindcss.com)** — utility styling
- **[Lucide React](https://lucide.dev)** — icons
- **[Antigravity](https://antigravity.dev)** — AI coding agent used throughout the build
