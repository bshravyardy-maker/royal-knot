# 👑 The Royal Knot

> **Palatial Wedding Agency Management Platform**  
> Unified digital operating system for luxury destination wedding planners across Jaipur & Udaipur palaces.

---

## 🏛️ Overview

**The Royal Knot** is an end-to-end management platform designed specifically for luxury destination wedding agencies. Managing 25+ palatial weddings per season—each hosting 400 to 600 guests with 15 to 20 artisan vendors across historic forts and heritage venues—demands flawless operational precision.

The platform eliminates fragmented communication channels, spreadsheets, and manual notebooks by establishing a single connected digital backbone where every planning action naturally triggers the next: from the couple's initial enquiry to the final post-wedding vendor balance settlement.

---

## ✨ Key Capabilities

### 1. Palatial Dashboard & Live Operations
- **Real-Time Financial Metrics:** Instant visibility into settled client revenue, outstanding receivables, estimated season profit, and active weddings.
- **Conversion Pipeline:** Funnel tracking across all enquiry consultation stages (*New, Contacted, Meeting, Proposal, Won, Lost*).
- **Live Operations Stream:** Verified chronological activity feed of payments received, new enquiries, and contract executions.

### 2. Enquiry Pipeline & Digital Service Agreements
- **Lifecycle Management:** Structured progression from initial client reach-out to won booking.
- **In-App Agreement Signing:** Digital service agreement generation with an interactive, touch-friendly signature pad.
- **Private Document Archiving:** Signed agreements are secured within a private Supabase Storage vault (`signatures`).

### 3. Automated Wedding Provisioning & Task Orchestration
- **Atomic Booking Deposit:** A single transactional database function (`record_booking_deposit`) automatically advances the enquiry to *Won*, provisions the wedding record, schedules ~30 milestone tasks from templates, and establishes 3 client payment milestones (*Booking, Advance, Final*).
- **Interactive Task Board:** Kanban-style task tracking categorized by operational phases (*Planning, Countdown, Day-of, Post-event*) with role-based team ownership.

### 4. Vendor Tenders & Side-by-Side Rate Cards
- **Request for Proposals (RFPs):** Create structured quote requests with target guest counts, deadlines, and requirements.
- **Multi-Vendor Rate Card Comparison:** Aligned column comparison evaluating price per plate, overtime rates, and inclusions.
- **Single-Click Tendering:** Awarding a vendor automatically closes competing bids and creates an attached vendor contract in a single database transaction (`award_quote`).

### 5. Day-of Command Center & Live Run-Sheet
- **Minute-by-Minute Timeline:** Synchronized schedule tracking for baraat processions, high teas, sunset pheras, and fireworks.
- **Vendor Arrival Tracking:** Idempotent arrival check-in with automatic flags for late vendors.
- **Live Incident Desk:** Real-time logging of day-of exceptions with severity ratings (*Low, Medium, High*), assigned coordinators, and resolution tracking.

### 6. Financial Reconciliation & Payment Guard
- **Milestone Invoicing:** Automated calculation of contract values, client-billable extras, and remaining balances.
- **Vendor Bill Matching:** Three-way reconciliation comparing agreed contract amounts against actual vendor invoices.
- **Double-Payment Guard:** Transaction-level payment validation (`pay_vendor`) ensuring vendor payments never exceed outstanding balances.
- **Extra Charges Classification:** Separation between client-billable additions and agency-absorbed emergency costs.

### 7. Founder Analytics & Season P&L
- **Unit Economics (P&L):** Accurate per-wedding profit and margin calculations factoring vendor bills, absorbed extras, and logged team hours.
- **Loss Driver Attribution:** Automatic root-cause detection (*Vendor Overrun, Absorbed Extras, Team Hours*) for underperforming celebrations.
- **Vendor Scorecards:** Performance metrics tracking vendor punctuality, billing variance percentages, and ratings.
- **30-Day Liquidity Forecast & Overdue Dues:** Cashflow forecast comparing upcoming receivables with vendor payables, highlighting overdue obligations.
- **Executive Share Links:** Tokenized, read-only dashboard access for partners, co-founders, and auditors.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/) with custom luxury palatial palette (*Navy, Gold, Ivory, Wine*) |
| **Typography** | Local font delivery (*Cormorant Garamond* and *Manrope*) via `next/font/local` |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security) |
| **File Storage** | Supabase Storage (Private encrypted bucket for client contracts and signatures) |
| **State & Server Actions** | Next.js Server Actions with strict `server-only` service role isolation |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 📐 Engineering & Architecture Principles

- **Transactional Integrity:** Complex multi-step operations (such as converting an enquiry into a wedding with tasks and payment milestones, or awarding vendor tenders) run inside dedicated PostgreSQL functions (`PL/pgSQL`) to guarantee atomic execution.
- **Zero Client-Side Secret Exposure:** All database mutations execute strictly through Next.js Server Actions using a private server-side Supabase client (`SUPABASE_SERVICE_ROLE_KEY`). The public browser client utilizes the restricted anonymous key with `SELECT`-only privileges.
- **Derived Analytics via Security Views:** Founder analytics, vendor balances, and cashflow projections are computed on the fly through PostgreSQL views (`wedding_profit`, `vendor_scorecard`, `vendor_balances`, `client_invoice`, `dues_next_30_days`, `overdue_dues`).
- **Resilient Seed Engine:** The seed system is fully idempotent and deterministic, utilizing batched operations with automatic exponential backoff to handle network interruptions.
- **Network-Independent Build:** All web fonts and assets are hosted locally inside the repository, preventing remote CDN downtime from impacting production builds.

---

## 📁 Repository Structure

```
royal-knot/
├── app/                              # Next.js Application Root
│   ├── actions/                      # Server Actions (Mutations & Service Role Operations)
│   │   ├── analytics.ts              # Executive share tokens & reporting
│   │   ├── command-center.ts         # Live arrivals & day-of incidents
│   │   ├── enquiries.ts              # Enquiry pipeline & agreement signing
│   │   ├── payments.ts               # Vendor bills, client payments & extras
│   │   ├── quotes.ts                 # Vendor quote tenders & awards
│   │   └── weddings.ts               # Wedding provisioning & task state
│   ├── app/                          # Next.js App Router Pages
│   │   ├── (overview)/page.tsx       # Palatial dashboard & KPI metrics
│   │   ├── analytics/                # Founder P&L, scorecards & dues
│   │   ├── command-center/           # Day-of live schedule run-sheet
│   │   ├── enquiries/                # Enquiry funnel & digital agreement view
│   │   ├── payments/                 # Financial ledger & balance reconciliation
│   │   ├── share/[token]/            # Public read-only analytics view
│   │   ├── vendor-quotes/            # RFP comparison & tender awards
│   │   ├── vendors/                  # Curated artisan vendor directory
│   │   ├── wedding-tasks/            # Multi-phase planning task board
│   │   ├── weddings/                 # Wedding details & run-sheets
│   │   ├── loading.tsx               # Animated skeleton loading state
│   │   └── error.tsx                 # Client error boundary with retry handler
│   ├── components/                   # UI Components & Interactive Clients
│   │   ├── AnalyticsClient.tsx       # Founder analytics & cashflow tables
│   │   ├── PaymentsClient.tsx        # Billing, milestone & extras ledger
│   │   ├── QuoteComparisonClient.tsx # Multi-vendor rate card comparison
│   │   ├── Sidebar.tsx               # Palatial responsive navigation drawer
│   │   └── ...
│   ├── lib/                          # Database Clients & Data Utilities
│   │   ├── supabase/
│   │   │   ├── client.ts             # Anon public client (Browser)
│   │   │   └── server.ts             # Service role client (Server-only)
│   │   └── overview.ts               # KPI aggregation queries
│   ├── scripts/
│   │   └── seed.ts                   # Deterministic database seeding engine
│   └── supabase/
│       └── migrations/               # PostgreSQL Schemas, Functions & Views
├── docs/                             # Architecture specifications & domain playbooks
└── README.md                         # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v20.0.0 or higher
- **Package Manager:** `npm` (v10+)
- **Database:** A [Supabase](https://supabase.com/) project (PostgreSQL 15+)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/bshravyardy-maker/royal-knot.git
cd royal-knot/app
npm install
```

### 2. Environment Configuration

Create a local environment file in the `app` directory:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
```

> **Security Note:** `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side. Never commit `.env.local` to source control.

### 3. Apply Database Migrations

In your Supabase project's **SQL Editor**, execute the migration scripts located in `app/supabase/migrations/` in sequential order:

1. `20261031000001_phase0_schema.sql` — Initial schema (19 core tables, RLS policies, indexes)
2. `20261031000002_phase2.sql` — Storage bucket, digital agreements, and `record_booking_deposit`
3. `20261031000003_phase3.sql` — RFP quotation system and `award_quote`
4. `20261031000004_fixes.sql` — Integrity constraints & deposit validation
5. `20261031000005_phase4.sql` — Day-of schedule items & live incident desk
6. `20261031000006_phase5.sql` — Vendor bills, extra charges, and `pay_vendor` guard
7. `20261031000007_phase6.sql` — Founder analytics views (`wedding_profit`, `vendor_scorecard`) & share tokens
8. `20261031000008_phase7.sql` — Cashflow views (`dues_next_30_days`, `overdue_dues`)

### 4. Seed Palatial Demo Data

Populate realistic demo records including 60 curated vendors, 25 destination weddings, task templates, bills, client payments, and verified P&L figures:

```bash
npm run seed
```

### 5. Launch Development Server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Data Integrity

- **Row Level Security (RLS):** Enabled across all database tables. The anonymous role (`anon`) possesses read-only access (`SELECT`), while write mutations (`INSERT`, `UPDATE`, `DELETE`) are strictly guarded and executed via the server-only service role.
- **Signature Storage Privacy:** Digital contracts are stored within a private Supabase Storage bucket (`signatures`) with access restricted to authenticated service-role requests.
- **Idempotency:** Payment requests and schedule check-ins require unique transaction keys to prevent duplicate execution upon multiple clicks or retransmissions.

---

## 📄 License

Internal proprietary software developed for **The Royal Knot Luxury Wedding Concierge**. All rights reserved.
