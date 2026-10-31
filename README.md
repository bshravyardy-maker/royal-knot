# The Royal Knot

A wedding-agency management platform that replaces WhatsApp groups and paper diaries with one connected system, from a couple's first enquiry to the final vendor payment.

Built for a hackathon around the brief for The Royal Knot, a luxury agency in Jaipur and Udaipur that plans about 25 three-day weddings a season, each with 400+ guests and around 18 vendors.

## The problem

Today the agency loses enquiries on Instagram and WhatsApp, compares vendor quotes by hand, rewrites checklists for every wedding, misses advance payments, and only learns a wedding's profit long after it ends. The brief asks for one "digital backbone" where each action triggers the next.

## What it does

| Scene from the brief | What the app does | Status |
|---|---|---|
| **1. First consultation** | Captures an enquiry in one place, moves it through a stage pipeline, and has the couple sign a service agreement on a touch-friendly pad. The signed copy is stored privately and attached to the record. | Done |
| **2. Three caterers, one decision** | Shows vendor quotes side by side with price per plate and inclusions. Awarding one closes the others and links the winner to the wedding. | Built, in testing |
| **3. The instant wedding plan** | Recording the booking deposit creates the wedding, about 30 tasks from templates (fewer for a Partial package) and 3 payment milestones in a single database transaction. | Done |
| **4. Big day schedule** | Live minute-by-minute board with vendor arrival and late flags | Planned |
| **5. Paying vendors and extras** | Bill matching, extra charges and a guard against double payment | Planned |
| **6. Founder's season review** | Profit per wedding, vendor scorecards, upcoming dues and a share link | Planned |

## Tech stack

- **App:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS, with Cormorant Garamond and Manrope loaded locally
- **Database:** Supabase (Postgres) with Row Level Security
- **File storage:** Supabase Storage (private bucket for signatures)
- **Business logic:** Postgres functions in PL/pgSQL, so multi-step actions succeed or fail together
- **Writes:** Next.js server actions using a server-only Supabase client

## How it is built

- **Connected workflows.** `record_booking_deposit` and `award_quote` are database functions that run as one transaction, so a wedding can never exist without its payments and an award can never leave a quote half-closed.
- **Computed, not typed.** Dashboard numbers are calculated from database rows.
- **Secure by default.** Row Level Security is on for every table. The public key can only read. All writes run on the server, and the service role key never reaches the browser (`import "server-only"`).
- **Honest demo data.** Seeded rows carry `is_demo = true` and show a "Demo" badge. Records created in the app show "Live".

## Project structure

```
royal-knot/
├── app/                  Next.js application
│   ├── app/              routes (pages)
│   ├── actions/          server actions
│   ├── components/       UI components
│   ├── lib/              Supabase clients and data helpers
│   ├── scripts/seed.ts   demo data
│   └── supabase/migrations/   SQL migrations, run in order
├── docs/                 brief and build playbook
└── prototype/            Phase 1 design prototype (royal-knot.html)
```

## Running it locally

**Requirements:** Node.js 20 or newer and a free Supabase project.

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/bshravyardy-maker/royal-knot.git
   cd royal-knot/app
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your own values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-secret-key
   ```
   The URL has no path or trailing slash. Never commit `.env.local` or share the secret key.
3. In the Supabase **SQL Editor**, run each file in `app/supabase/migrations/` in filename order.
4. Seed the demo data and start the app:
   ```bash
   npm run seed
   npm run dev
   ```
5. Open http://localhost:3000.

## Trying the main flow

1. Create an enquiry with the **New Enquiry** button.
2. Open it and move it through the stages.
3. Generate and sign the agreement on the signature pad.
4. Record the booking deposit. A wedding, its task plan and its three payment milestones appear together.
5. Open the task board and move tasks between stages.
6. Open **Vendor Quotes**, compare the caterer quotes and award one.

## Roadmap

- [x] Phase 0: scaffold, schema, app shell, overview, quick-create, seed
- [x] Phase 2: enquiry to wedding (agreement signing, deposit, task plan, payment milestones)
- [ ] Phase 3: vendor quote comparison and award (built, in testing)
- [ ] Phase 4: day-of command center with arrival check-in and late flags
- [ ] Phase 5: vendor bills, extra charges and a double-payment guard
- [ ] Phase 6: founder analytics and a read-only share link
- [ ] Phase 7: full seed data, polish and demo

## Known limitations

- There is no login yet. Anyone with the URL can view the data.
- All data is fictional demo data.
- Guest management, contracts, payments, command center, analytics and settings are placeholder pages until their phases are built.

## Built with

Claude for planning and the design prototype, and Antigravity as the coding agent. Every phase was reviewed and tested before moving on.
