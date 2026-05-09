# CLAUDE.md — mojo_viability

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file is read automatically by Claude Code at the start of every session. Follow all instructions here without being asked.

---

## About This Project

**Mojo Viability** is a hospitality business viability assessment tool — break-even, fitout financing, hours of operation, sales modelling, location suitability, AI-assisted business plan generation. Built with Vite + React 18 + TypeScript, deployed to Vercel. Production target: **mojobusiness.ai**.

It is part of the broader **Mojo 360 ecosystem**. The `mojo_business` repo (Mojo 360 — operations + admin) shipped to mojo360.com.au yesterday. Viability extracted out of that repo into this one because the two products serve different user personas (prospective vs operating venues) and share only the auth surface.

**Shared Supabase project with `mojo_business`** — same project, same anon key. Viability owns these tables: `business_scenarios`, `project_invites`, `project_content_uploads`, `collaborators`. `profiles` is shared. See [`context/viability-extraction/Q1-Q7-Decisions.md`](context/viability-extraction/Q1-Q7-Decisions.md) Q1.

---

## Current Phase

**Phase 2 — viability extraction.** This repo was bootstrapped as Step 1 of the 12-step plan in [`context/viability-extraction/phase-2-implementation-plan.md`](context/viability-extraction/phase-2-implementation-plan.md). Steps 2–11 follow in subsequent dispatches; Step 12 (cleanup of `mojo_business`) happens in the other repo.

If a dispatch arrives that doesn't reference a specific step, **confirm with Max which step it implements** before starting.

---

## Session Start Checklist

Before writing any code:

1. Read [`context/viability-extraction/extraction-plan-2026-05-09.md`](context/viability-extraction/extraction-plan-2026-05-09.md) first — it reconciles the older planning docs against post-rebuild reality.
2. If a `handover/HANDOVER.md` exists, read it for the previous session's context.
3. Confirm with Max which Phase 2 step (or other task) is in scope for this session.
4. State what you plan to do before doing it.

---

## Rules — Always Follow Without Being Asked

- **Australian English** in all copy, labels, comments, toasts, error messages, and documentation.
- **Confirm before running any migrations** — describe what you plan to do and wait for approval. The Supabase project is shared with `mojo_business`; a bad migration affects both products.
- **Never modify `.env` or `.env.local`** — Max owns env values.
- **Never commit Supabase types** if generated — `src/integrations/supabase/types.ts` (or equivalent) is auto-generated and should not be hand-edited.
- **Ask before installing new packages** — describe why the package is needed first. The bootstrap dependencies were curated; adding a new one is a deliberate decision.
- **One thing at a time** — complete and confirm each change before moving to the next.
- **Hard stop on stop-conditions** — if a dispatch defines stop conditions and one fires, halt and surface to Max. Don't try to recover by improvising.

---

## How Max Works

Max plans and ideates in Claude.ai (the strategic-advisor session) and brings structured dispatches into Claude Code to execute. Sessions are focused sprints on one step at a time — not open-ended exploration. Keep explanations concise. Max is building his development skills — explain the *why* briefly when doing something non-obvious, but don't over-explain.

---

## Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc --noEmit -p tsconfig.app.json
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

No test framework is configured.

---

## Architecture

**Bootstrap state (now):** providers + shadcn primitives wired, "Hello user" smoke page proves the auth chain. No router, no project routes, no calculation engines yet — those land in Steps 2–9.

**Target architecture (Phase 2 complete):**

- **Routing** — React Router (`react-router-dom`) with a route tree per `app-tsx-anatomy.md` §4. Public landing routes + `/project/:id/*` editor tree (12 sub-routes).
- **Feature folders** — `src/features/project/{api,components,hooks,pages,routes.tsx}` per [`phase-2-implementation-plan.md`](context/viability-extraction/phase-2-implementation-plan.md) §6.3. Pages are routes; components are sub-pieces; api wraps Supabase calls; hooks compose React Query.
- **Server state** — TanStack Query, with `useProject(id)` as the canonical project read and `useUpdateProjectData()` as the autosave-debounced write (cross-section sync runs inside the mutation — see [`app-tsx-anatomy.md`](context/viability-extraction/app-tsx-anatomy.md) §6.1).
- **Auth** — `<AuthProvider>` exposes `{ user, isLoading, signIn, signUp, signOut }`. Owner-only — no advisor / mojo-employee / super-user concepts (per [`Q1-Q7-Decisions.md`](context/viability-extraction/Q1-Q7-Decisions.md) Q3 + [`app-tsx-anatomy.md`](context/viability-extraction/app-tsx-anatomy.md) §2.3).
- **Theme + toasts** — `ThemeProvider` (light/dark via `data-theme`), `ToastProvider` (sonner).
- **Calculations** — pure functions in `src/lib/calculations/` (15 engines arrive in Step 2).
- **Export pipeline** — `src/lib/export/` (PDF + Excel + business plan HTML; `html2canvas` is an explicit dependency from day 1).

---

## Deployment

- **Vercel** — project at https://vercel.com/mschaapvelds-projects/mojo-viability, auto-deploys from `main`.
- **Domain** — `mojobusiness.ai` post-cutover. Pre-cutover, smoke happens on the Vercel preview URL.
- **Supabase** — shared with `mojo_business` (same project, same anon key). DB migrations for the 4 V-ONLY tables move to this repo's ownership in Step 10.

---

## End of Session

Write a handover doc to `handover/HANDOVER.md` summarising:
- What was completed (which step + which sub-tasks)
- Acceptance criteria status (each `[ ]` ticked or noted blocked)
- Any decisions Max made during the session
- Next concrete step + estimated time

Keep handovers concise — they're the bridge between sessions.
