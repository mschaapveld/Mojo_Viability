# Mojo Viability Handover — 2026-05-09 (Step 8)

## Session Summary

Step 8 of the 12-step extraction plan: **smallest step in the plan**, executed cleanly. `useAutoSave` consolidated to its proper home (`src/features/project/hooks/useProjectAutoSave.ts`) and `useKeyboardShortcuts` ported. Three sub-agent fan-outs all returned clean. Typecheck + build remain GREEN throughout. Vercel stays green on `5732982`. Cumulative inventory misses still 8. Next: Step 9 — App.tsx → Router (the biggest single step in the plan, 6–8h).

## Completed

**Hook consolidation (1 file, rename + move + identifier rename)**
- `src/hooks/useAutoSave.ts` → [src/features/project/hooks/useProjectAutoSave.ts](src/features/project/hooks/useProjectAutoSave.ts)
- `git mv` used; rename detected at 98% similarity (history preserved)
- Function rename: `export function useAutoSave` → `export function useProjectAutoSave`
- Per [anatomy §6.3](../context/viability-extraction/app-tsx-anatomy.md) — clarity rename for the project-level autosave
- Recap: `useAutoSave.ts` was originally surfaced as inventory-miss #8 in Step 5's pre-emptive audit and parked at `src/hooks/`. Step 8 now consolidates it to its proper home in `src/features/project/hooks/`.

**New hook port (1 file)**
- `src/hooks/useKeyboardShortcuts.ts` (43 LOC) → [src/features/project/hooks/useKeyboardShortcuts.ts](src/features/project/hooks/useKeyboardShortcuts.ts)
- Verbatim copy from `/tmp/mojo-business-current/`
- Single import (`useEffect` from `react`); zero `@/`-paths
- **No consumers yet** — Step 9's App.tsx → Router rewrite will wire it up

**Consumer update (1 file)**
- [src/features/project/components/SaveStatusIndicator.tsx:2](src/features/project/components/SaveStatusIndicator.tsx#L2) — import path rewritten from `@/hooks/useAutoSave` to `@/features/project/hooks/useProjectAutoSave`. Imported symbol stays `SaveStatus` (it's a type-only import; the rename only affected the file path).
- Sub-agent #2 confirmed SaveStatusIndicator was the SOLE consumer (just one type-only import; no hook function call sites in the repo).

**Sub-agent fan-out execution log — three this step, all clean**
- **Fan-out #1 (source verification for useKeyboardShortcuts):** found at canonical path in both clones, identical, 43 LOC, single React import. Tested clean.
- **Fan-out #2 (consumer audit for useAutoSave rename):** only `SaveStatusIndicator.tsx` line 2 imports it (`SaveStatus` type-only). No other consumers anywhere in the repo. Tested clean.
- **Fan-out #3 (import audit on useKeyboardShortcuts post-rewrite):** bucket A only — single React import, no `@/`-paths, no inventory misses, no Mojo-360 platform-membership leakage. Tested clean.

**Verification**
- `npm run typecheck`: **GREEN** (exit 0, zero errors)
- `npm run build`: **GREEN** (141 modules, 440 KB JS / 59 KB CSS, 955 ms)

**Commits + push**
- Step 8 commit: `5732982 feat: consolidate useAutoSave + import useKeyboardShortcuts (Step 8 of viability extraction)` — pushed to `origin/main` (`a395809..5732982`)
- 3 files changed (1 rename at 98% similarity + 1 new + 1 modified import line), 45 insertions, 2 deletions
- **Vercel stays GREEN** — production transitions from Step 7 to Step 8

## In Progress

None — Step 8 complete.

## Blockers

None blocking Step 9.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 9 — App.tsx → Router rewrite.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 9. **The biggest single step in the plan: 6–8h estimated.** This is where the structural rebuild happens.

**What Step 9 does (per plan):**
- Replace the current bootstrap `App.tsx` (which renders only `<HelloUser>`) with a proper App + Router using `react-router-dom`
- Build out the route tree per [app-tsx-anatomy.md §4](../context/viability-extraction/app-tsx-anatomy.md):
  - Public landing routes: `/`, `/how-it-works`, `/reach-out`, `/start`, `/privacy`, `/terms`, `/login`
  - `/project/:id/*` editor tree with 12 sub-routes (one per tab page from Step 4)
- Replace App.tsx state with React Query (per anatomy §6.1):
  - `useProject(id)` as the canonical project read
  - `useUpdateProjectData()` as the autosave-debounced write
- Wire up the project layout shell:
  - `<ProjectLayout>` with `<ProjectSideNav>`, `<BusinessSnapshot>`, `<Outlet />` for tab content
  - Save / share / export wiring
  - Autosave (using `useProjectAutoSave` from Step 8)
  - Keyboard shortcuts (using `useKeyboardShortcuts` from Step 8)
  - Walkthrough navigation
- Wire up the landing → start → guest/signup → project flow

**Step 9 acceptance:**
1. Typecheck + build remain GREEN
2. **`npm run dev` smoke test must pass:** sign-in, navigate to `/project/<id>`, every tab renders, autosave fires on edit, sign-out works, landing pages render. **This is the first step where end-to-end UI verification matters** — module count in build will jump significantly (currently 141; expected to reach 400+ as all the ported files become entry-reachable for the first time).
3. **Bundle size sanity check:** `dist/` after Step 9's build should be in the same ballpark as mojo_business's pre-extraction size (per plan §3 Step 7 "comparable to mojo_business's").

**Cumulative standard mechanical rewrites (still 7, still active):**
1. `@/shared/components/ui/X` → `@/components/ui/X`
2. `../../lib/X` and `../lib/X` → `@/lib/X`
3. `@/components/<NAME>` → `@/features/project/components/<NAME>` for the cumulative 12-component forward-pointer list
4. `@/app/providers/X` → `@/providers/X`
5. `../hooks/X` and `../../hooks/X` → `@/hooks/X`
6. `@/lib/projects` / `@/lib/permissions` → `@/features/project/api/<projectsApi|permissionsApi>`
7. `@/features/<feature>/components/<NAME>` → `@/components/<NAME>` when destination is top-level

**Step 9 caveats:**
- This is mostly a write-step (authoring the new App.tsx + Router), not a port-step. Path-shift mechanical rewrites apply less than in prior steps.
- The anatomy doc captures App.tsx's *shape* (state slices, handlers, fan-in branches, cross-section sync logic, risk register) — use as the "what to author" reference. The current mojo_business `App.tsx` is gone (deleted in Phase C-light); recoverable as text from `/tmp/mojo-pre-phase-c/src/App.tsx` if needed for byte-level reference.
- Sub-agent fan-out pattern can still help: e.g. one agent to audit anatomy.md against the actual ported components for fitness, another to scan for any remaining inventory misses surfaced by the wiring.
- Step 9 needs its own structured dispatch from Max's Claude.ai strategic-advisor session.

**Mojo-360-strip pattern alert continues:** if Step 9's wiring exposes calls into platform-membership concepts (any consumer trying to use `useBusinessContext`, `useActiveBusinessId`, `usePlatformRole`, or platform RPCs), surface for adjudication.

## Key References

**Repo state:**
- Bootstrap (Step 1): `2950ee6`
- CLAUDE.md handover patch: `213389e`
- Step 2 commit: `7c40fa9` (Vercel red, by design)
- Step 2 handover: `c634ff7`
- Step 3 commit: `ce4228a` (Vercel green)
- Step 3 handover: `5e41404`
- Step 4 commit: `fdafc70` (Vercel red, by design)
- Step 4 handover: `6c1cd4f`
- Step 5 commit: `c9dbe5f` (Vercel green; production transitioned here)
- Step 5 handover: `b873d65`
- Step 6 commit: `6daaabc` (Vercel green)
- Step 6 handover: `aca502c`
- Step 7 commit: `590ce47` (Vercel green)
- Step 7 handover: `a395809`
- **Step 8 commit: `5732982` — Vercel green, production updates to Step 8**
- Branch: `main`

**Cumulative inventory misses (still 8 — Step 8 added zero):**

| # | File | Step surfaced | LOC |
|---:|---|---|---:|
| 1 | `src/lib/hoursVisualization/` (4-file directory) | 2 | ~600 |
| 2 | `src/lib/contentUploads.ts` | 2 | 6.4KB |
| 3 | `src/lib/walkthrough.ts` | 4 | 354 |
| 4 | `src/lib/menuUtils.ts` | 4 | 486 |
| 5 | `src/lib/liquorLicences.ts` | 4 | 116 |
| 6 | `src/lib/naturalLanguageParser.ts` | 4 | 432 |
| 7 | `src/lib/calculations.ts` | 4 (second-pass) | 24 |
| 8 | `src/hooks/useAutoSave.ts` (now consolidated to `src/features/project/hooks/useProjectAutoSave.ts`) | 5 (Step 8 consolidated) | 121 |

**Architectural strip log (deliberate adaptations away from Mojo 360 concepts):**
- Step 1: `<AuthProvider>` stripped of `is_super_user`, `is_advisor`, `signInWithProvider`, `OrgProvider`
- Step 6: `HospoOSModal` stripped of `useBusinessContext` dependency

**Cleanup tracker:**
- ✓ Step 7: 2 `@ts-expect-error` directives in AIBusinessPlanPage.tsx — REMOVED.
- (No new cleanup tracker entries from Step 8.)

**Cascade theory status: 4-for-4 confirmed.** Step 8 didn't exercise it (no expected red baseline). Step 9 may or may not depending on how Router-wiring goes.

**Step 8 hooks now at `src/features/project/hooks/`:**
- `useProjectAutoSave.ts` (was `useAutoSave`) — exports `useProjectAutoSave` function + `SaveStatus` type
- `useKeyboardShortcuts.ts` — exports `useKeyboardShortcuts` function (no consumer yet)

**Source clones in /tmp:**
- `/tmp/mojo-business-current/` — current main, used Steps 2–3, 7, 8
- `/tmp/mojo-pre-phase-c/` — `pre-phase-c-deletion` tag at commit `2fc45f7`, used Steps 4–6. The original `App.tsx` (deleted in Phase C-light) is recoverable from this clone as text reference for Step 9.

**Auth surface (unchanged):**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }`
- Supabase client localStorage namespace: `mojo-viability-auth`
- `window.supabase` exposed in dev only

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY inventory (treat as under-catalogued; 8 misses surfaced so far)
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map (**critical reference for Step 9**)
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) — orphan corrections
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md) — informational, post-Phase-2
