# Mojo Viability — Project Brief

## What is Mojo Viability

Mojo Viability is a hospitality business viability assessment tool. It helps prospective venue operators (cafes, restaurants, bars, take-aways) and existing operators considering expansion or refits sanity-check the numbers before signing a lease. The product runs the user through:

- **Simple and detailed break-even** modelling
- **Fitout financing** (rent vs purchase, deposit, loan, capital schedule)
- **Hours of operation** + **labour costing**
- **Sales modelling** (entered, predicted, and breakup-driven)
- **Menu-driven sales** (price-point sensitivity)
- **Location suitability** (foot traffic, demographics, competitor mapping)
- **Business plan generation** (AI-assisted; PDF + Excel export)

Output is a saved scenario in Supabase (`business_scenarios`) plus exportable artefacts (PDF business plan, Excel financial model). Mojo Suite admins read these scenarios as leads via mojo_business's admin surface.

## Production domain

Production target: **mojobusiness.ai**.

Pre-cutover the app lives at a Vercel preview URL — DNS cutover from mojo_business (currently serving mojo360.com.au + mojobusiness.ai) to viability is gated on the smoke pass at the end of Phase 2.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **Supabase** (auth + Postgres) — same project + same anon key as `mojo_business`
- **TanStack Query** for server state
- **React Router** (post-bootstrap; the legacy app uses tab state — Step 9 of the extraction plan re-authors this as a router)
- **react-hook-form + zod** for form state
- **recharts** for charts
- **jspdf + jspdf-autotable + html2canvas + exceljs** for export pipeline
- **@react-google-maps/api** for the location-suitability and venue-address features
- Deployed to **Vercel**

## Shared Supabase project

Per `context/viability-extraction/Q1-Q7-Decisions.md` Q1: viability and `mojo_business` (Mojo 360) point at the same Supabase project. Same `auth.users`. Viability owns these tables: `business_scenarios`, `project_invites`, `project_content_uploads`, `collaborators`. The `profiles` table is shared (viability columns + 360 columns coexist).

## Docs index

Read these in order before any code work — they capture the full extraction plan and architecture decisions:

1. [`context/viability-extraction/extraction-plan-2026-05-09.md`](context/viability-extraction/extraction-plan-2026-05-09.md) — **read first.** Reconciliation plan; tells you what changed since the other docs were written.
2. [`context/viability-extraction/Q1-Q7-Decisions.md`](context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions.
3. [`context/viability-extraction/inventory.md`](context/viability-extraction/inventory.md) — file-by-file V-ONLY surface.
4. [`context/viability-extraction/app-tsx-anatomy.md`](context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router rewrite map (referenced by Step 9).
5. [`context/viability-extraction/phase-2-implementation-plan.md`](context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan. This bootstrap is Step 1.
6. [`context/viability-extraction/pre-extraction-punch-list.md`](context/viability-extraction/pre-extraction-punch-list.md) — orphans, html2canvas, RLS dead-branch.
7. [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](context/viability-extraction/phase-2.5-hub-viability-spec.md) — what mojo_business builds after Phase 2 (informational).

## Dispatch entry rule

Before any code work in this repo: **read the 7 docs in `context/viability-extraction/` in order, starting with `extraction-plan-2026-05-09.md`.** That doc supersedes pre-cutover assumptions in the others.

## Current phase

**Phase 2 extraction.** Step 1 (this bootstrap — Vite + Tailwind + shadcn + Supabase + Hello-user smoke) is complete in the first commit.

Steps 2–11 port viability code from `mojo_business`'s `pre-phase-c-deletion` git tag and re-author `App.tsx` as a React Router tree. They land in subsequent dispatches. Step 12 (mojo_business cleanup) happens in the `mojo_business` repo, not here.
