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

### 3. Automated Wedding Provisioning & Interactive Task Operations
- **Atomic Booking Deposit:** A single transactional database function (`record_booking_deposit`) automatically advances the enquiry to *Won*, provisions the wedding record, schedules ~30 milestone tasks from templates, and establishes 3 client payment milestones (*Booking, Advance, Final*).
- **Interactive Wedding Task Command:** Clickable per-wedding selector with real-time completion progress bars (% complete, X of Y Done), dedicated "What's Done" vs "What's Not Done" tabs, 1-click circular status toggles, and dual-view (Checklist vs Kanban) modes.

### 4. Vendor Tenders & Side-by-Side Rate Cards
- **Curated Artisan Network:** 110 curated vendors (exactly 10 verified vendors across 11 luxury categories: Catering, Decor, Photography, Music, Makeup, Transport, Florals, Fireworks, Invitation, Venue, Hospitality).
- **Request for Proposals (RFPs):** Create structured quote requests with target guest counts, deadlines, and requirements.
- **Multi-Vendor Rate Card Comparison:** Aligned column comparison evaluating price per plate, overtime rates, and inclusions with instant zero-flicker optimistic quote logging.
- **Single-Click Tendering:** Awarding a vendor automatically closes competing bids and creates an attached vendor contract in a single database transaction (`award_quote`).

### 5. Day-of Command Center & Live Run-Sheet
- **Minute-by-Minute Timeline:** Synchronized schedule tracking for baraat processions, high teas, sunset pheras, and fireworks across 350+ milestones.
- **Vendor Arrival Tracking:** Idempotent arrival check-in with automatic flags for late vendors.
- **Live Incident Desk:** Real-time logging of day-of exceptions with severity ratings (*Low, Medium, High, Critical*), assigned coordinators, and resolution tracking.

### 6. Royal Guest Concierge & Digital Wedding Passports
- **Personalised Digital Passports (`/passport/[token]`):** Unique mobile-first digital wedding passport for every guest, opening via dedicated QR code scan without staff sidebar clutter.
- **Cryptographic Token Security:** Access tokens are generated with `crypto.randomBytes(24)` and stored exclusively as one-way SHA-256 hashes (`token_hash`) in PostgreSQL. Raw bearer tokens are never stored at rest.
- **3-Day Royal Itinerary:** Interactive multi-day celebration schedule with event timings, venue sublocations, dress codes (*e.g. Royal Emeralds, Imperial Velvet*), and Google Maps location links.
- **Travel & Chauffeur Logistics:** Palatial suite allocations, airport pickup tracking, chauffeur assignment, and flight monitoring.
- **Single Source-of-Truth RSVPs:** Online RSVP submissions update `guests.rsvp_status` and `guests.dietary_notes` directly on the canonical `guests` table, preventing conflicting duplicate state.
- **Palace Concierge Desk:** 24/7 hotline and WhatsApp emergency links for immediate guest assistance.
- **Agency Concierge Operations:** Dedicated management tab in `/guests` providing 1-click QR pass generation, token regeneration, revocation, transport assignment, and print-ready invitation card downloads.

### 7. Digital Contracts Vault
- **Legal Repository (`/contracts`):** Centralized ledger for Client Agreements, Vendor Contracts, and Heritage Venue Bookings with total value tracking and live execution status updates.

### 8. Agency Settings & Operational Diagnostics
- **Settings & SLA Management (`/settings`):** Agency treasury settings, team partner roster, luxury package tiers, and operational emergency escalation SLAs.
- **Supabase Diagnostics:** Real-time latency, storage health, and database connectivity status check.

### 9. Staff Authentication & Client Request Desk
- **Manager & Staff Authentication (`/login`):** Cookie-backed session authentication (`royal_knot_session`) supporting 30-day "Remember Me" sessions for agency leadership, principal planners, and logistics directors.
- **Interactive Sidebar Profile:** Active manager avatar and role indicator with 1-click secure sign-out.
- **Direct Client Enquiry Desk:** Public customer portal allowing prospective couples to submit wedding enquiries and receive unique tracking reference codes.

### 10. Financial Reconciliation & Payment Guard
- **Milestone Invoicing:** Automated calculation of contract values, client-billable extras, and remaining balances.
- **Vendor Bill Matching:** Three-way reconciliation comparing agreed contract amounts against actual vendor invoices.
- **Double-Payment Guard:** Transaction-level payment validation (`pay_vendor`) ensuring vendor payments never exceed outstanding balances.
- **Extra Charges Classification:** Separation between client-billable additions and agency-absorbed emergency costs.

### 11. Founder Analytics & Season P&L
- **Unit Economics (P&L):** Accurate per-wedding profit and margin calculations factoring vendor bills, absorbed extras, and logged team hours.
- **Loss Driver Attribution:** Automatic root-cause detection (*Vendor Overrun, Absorbed Extras, Team Hours*) for underperforming celebrations.
- **Vendor Scorecards:** Performance metrics tracking vendor punctuality, billing variance percentages, and ratings.
- **30-Day Liquidity Forecast & Overdue Dues:** Cashflow forecast comparing upcoming receivables with vendor payables, highlighting overdue obligations.
- **Executive Share Links (`/share/[token]`):** Tokenized, read-only dashboard access for partners, co-founders, and auditors.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/) with luxury palatial palette (*Navy #151B2B, Gold #C6A46A, Ivory #F7F5F0*) |
| **Typography** | Local font delivery (*Cormorant Garamond* and *Manrope*) via `next/font/local` |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15+ with Row Level Security & Indexes) |
| **QR Code Engine** | High-precision vector SVG and DataURL generation via `qrcode` |
| **File Storage** | Supabase Storage (Private encrypted bucket for client contracts and signatures) |
| **State & Server Actions** | Next.js Server Actions with strict `server-only` service role isolation |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🔑 Pre-Configured Staff Profiles

For agency manager evaluation, three pre-configured staff accounts are available on the **Staff & Manager Login** tab at `/login`:

| Email | Name | Palace Role | Password |
|---|---|---|---|
| `founder@royalknot.in` | Maharani Gayatri Devi (Hon.) | Founder & Principal Planner | `RoyalKnot@2026` |
| `concierge@royalknot.in` | Raghvendra Singh Rathore | Senior Wedding Concierge | `RoyalKnot@2026` |
| `logistics@royalknot.in` | Vikramaditya Shekhawat | Finance & Logistics Director | `RoyalKnot@2026` |

---

## 📐 Engineering & Architecture Principles

- **Transactional Integrity:** Complex multi-step operations (such as converting an enquiry into a wedding with tasks and payment milestones, or awarding vendor tenders) run inside dedicated PostgreSQL functions (`PL/pgSQL`) to guarantee atomic execution.
- **Zero Client-Side Secret Exposure:** All database mutations execute strictly through Next.js Server Actions using a private server-side Supabase client (`SUPABASE_SERVICE_ROLE_KEY`). The public browser client utilizes the restricted anonymous key with `SELECT`-only privileges.
- **Derived Analytics via Security Views:** Founder analytics, vendor balances, and cashflow projections are computed on the fly through PostgreSQL views (`wedding_profit`, `vendor_scorecard`, `vendor_balances`, `client_invoice`, `dues_next_30_days`, `overdue_dues`).
- **Resilient Seed Engine:** The seed system is fully idempotent and deterministic, utilizing batched operations with automatic exponential backoff to handle network interruptions.
- **Responsive Mobile Layouts:** Every page includes viewport scaling, responsive grid breakpoints (`sm:`, `lg:`), horizontal scroll wrappers (`overflow-x-auto`) for dense tabular data, and full-screen mobile optimization for guest passports.
- **Cache Invalidation:** Configured `cache: "no-store"` on Supabase server client fetch operations to prevent stale cache artifacts.

---

## 📁 Repository Structure

```
royal-knot/
├── app/                              # Next.js Application Root
│   ├── actions/                      # Server Actions (Mutations & Service Role Operations)
│   │   ├── analytics.ts              # Executive share tokens & reporting
│   │   ├── auth.ts                   # Staff session auth & cookie management
│   │   ├── command-center.ts         # Live arrivals & day-of incidents
│   │   ├── concierge.ts              # Guest digital passports, itineraries & RSVPs
│   │   ├── contracts.ts              # Contract registration & status lifecycle
│   │   ├── enquiries.ts              # Enquiry pipeline, digital agreement & portal requests
│   │   ├── guests.ts                 # Guest RSVP management & VIP protocols
│   │   ├── payments.ts               # Vendor bills, client payments & extras
│   │   ├── quotes.ts                 # Vendor quote tenders & awards
│   │   ├── search.ts                 # Live search across weddings, enquiries & vendors
│   │   └── weddings.ts               # Wedding provisioning & task state
│   ├── app/                          # Next.js App Router Pages
│   │   ├── page.tsx                  # Palatial dashboard & KPI metrics
│   │   ├── analytics/                # Founder P&L, scorecards & dues
│   │   ├── command-center/           # Day-of live schedule run-sheet
│   │   ├── contracts/                # Digital contracts & legal agreements vault
│   │   ├── enquiries/                # Enquiry funnel & digital agreement view
│   │   │   └── [id]/                 # Individual client enquiry dossier
│   │   ├── guests/                   # Guest hospitality, RSVPs & Concierge tabs
│   │   ├── login/                    # Dual-mode Concierge entry & public request desk
│   │   ├── passport/                 # Royal Guest Concierge mobile-first portal
│   │   │   └── [token]/              # Personalised digital wedding passport
│   │   ├── payments/                 # Financial ledger & balance reconciliation
│   │   ├── settings/                 # Agency configuration, SLAs & Supabase diagnostics
│   │   ├── share/                    # Executive tokenized share link view
│   │   │   └── [token]/              # Read-only stakeholder briefing
│   │   ├── vendor-quotes/            # RFP comparison & tender awards
│   │   │   └── [id]/                 # Side-by-side vendor tender comparison
│   │   ├── vendors/                  # Curated artisan vendor directory
│   │   │   └── [id]/                 # Artisan profile & scorecard
│   │   ├── wedding-tasks/            # Interactive multi-phase task operations hub
│   │   ├── weddings/                 # Wedding details & run-sheets
│   │   │   └── [id]/                 # Wedding production command dossier
│   │   ├── loading.tsx               # Animated skeleton loading state
│   │   └── error.tsx                 # Client error boundary with retry handler
│   ├── components/                   # UI Components & Interactive Clients
│   │   ├── AnalyticsClient.tsx       # Founder analytics & cashflow tables
│   │   ├── AppShell.tsx              # Responsive app frame with route isolation
│   │   ├── ConciergeAgencyTab.tsx    # Agency Concierge & passport management
│   │   ├── ContractsClient.tsx       # Legal agreements & vault UI
│   │   ├── GuestPassportClient.tsx   # Mobile guest digital passport experience
│   │   ├── GuestsClient.tsx          # Guest RSVP & room allocation management
│   │   ├── Header.tsx                # Top navigation with live search & portal shortcut
│   │   ├── PaymentsClient.tsx        # Billing, milestone & extras ledger
│   │   ├── PrintableQrPassModal.tsx  # Printable luxury QR invitation card
│   │   ├── QuoteComparisonClient.tsx # Multi-vendor rate card comparison
│   │   ├── SettingsClient.tsx        # Agency profile, SLAs & system diagnostics
│   │   ├── Sidebar.tsx               # Palatial responsive navigation drawer & auth footer
│   │   ├── WeddingTasksBoardClient.tsx# Clickable wedding task operations board
│   │   └── ...
│   ├── lib/                          # Database Clients, Types & Utilities
│   │   ├── qrcode.ts                 # High-resolution vector QR code generator
│   │   ├── types.ts                  # Comprehensive TypeScript domain interfaces
│   │   ├── supabase/
│   │   │   ├── client.ts             # Anon public client (Browser)
│   │   │   └── server.ts             # Service role client (Server-only)
│   │   └── overview.ts               # KPI aggregation queries
│   ├── scripts/
│   │   └── seed.ts                   # Deterministic database seeding engine
│   └── supabase/
│       └── migrations/               # PostgreSQL Schemas, Functions & Views
├── supabase/
│   └── migrations/                   # Root database migration files
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
9. `20261101000009_royal_guest_concierge.sql` — Guest passports with SHA-256 tokens, multi-day itineraries, and RLS policies

### 4. Seed Palatial Demo Data

Populate realistic demo records including 110 curated vendors (10 per category), 25 destination weddings, task templates, bills, client payments, itineraries, and verified P&L figures:

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
- **SHA-256 Token Vault:** Guest passport bearer tokens are cryptographically random and stored only as one-way SHA-256 hashes, ensuring compromised database dumps cannot be used to forge guest passes.
- **Signature Storage Privacy:** Digital contracts are stored within a private Supabase Storage bucket (`signatures`) with access restricted to authenticated service-role requests.
- **Idempotency:** Payment requests, quote tender submissions, and schedule check-ins require unique transaction keys to prevent duplicate execution upon multiple clicks or retransmissions.

---

## 📄 License

Internal proprietary software developed for **The Royal Knot Luxury Wedding Concierge**. All rights reserved.
