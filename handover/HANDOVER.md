# Mojo Viability Handover — 2026-05-09 (Step 4)

## Session Summary

Step 4 of the 12-step extraction plan: **24 new files** (12 pages + 7 components + 5 lib) ported from the `pre-phase-c-deletion` git tag (commit `2fc45f7`) — first major step and first use of the tag rather than current main. Four HARD STOPs during execution, all adjudicated by the strategic-advisor session as "absorb and proceed." Net result: 19 V-ONLY UI files restructured into the `features/project/{pages,components}/` convention with renames + import rewrites; **5 inventory-miss `lib` files** ported alongside; mechanical shadcn path-shift applied; pages-vs-components sibling-shift cleaned up. Typecheck red as expected (Shape A + Shape B): **11 TS2307 + 6 TS7006** → resolves at Step 5 (and the 2 export-pipeline forward-refs at Step 7). Vercel red on `fdafc70` by design; production stays on Step 3's `ce4228a`.

## Completed

**Tab UI surface (19 files)**
- 12 pages at `src/features/project/pages/`: SimpleBreakEvenPage, DetailedBreakEvenPage, FitoutFinancingPage, HoursOfOperationPage, SalesBreakupPage, ViabilityMenuBuilderPage, LabourCostingPage, LocationSuitabilityPage, SalesPredictionsPage, BusinessPlanningPage, AIBusinessPlanPage, BusinessPlanBuilderPage
- 7 components at `src/features/project/components/`: FitoutFinancingColumn, FitoutFinancingExisting, FitoutFinancingNew, VenueOpeningHours, LinkParsingSection, ScenarioColumn, ScenarioSelectionDialog
- ChangelogView.tsx dropped (orphan)

**File + component-identifier renames**
- `MenuBuilder` → `ViabilityMenuBuilder` (file `MenuBuilder.tsx` → `ViabilityMenuBuilderPage.tsx`; identifier `MenuBuilder`/`MenuBuilderProps` → `ViabilityMenuBuilder`/`ViabilityMenuBuilderProps`)
- `AIBusinessPlanBuilder` → `AIBusinessPlan` (file `AIBusinessPlanBuilder.tsx` → `AIBusinessPlanPage.tsx`; identifier `AIBusinessPlanBuilder`/`AIBusinessPlanBuilderProps` → `AIBusinessPlan`/`AIBusinessPlanProps`)
- 10 other top-level pages got a `Page` filename suffix only

**Inventory-miss recoveries (5 files at `src/lib/`)**
- `walkthrough.ts` (354 LOC) — used by 8 V-ONLY pages + Step 5's WalkthroughNavigation
- `menuUtils.ts` (486 LOC) — used by ViabilityMenuBuilderPage
- `liquorLicences.ts` (116 LOC) — used by AIBusinessPlanPage
- `naturalLanguageParser.ts` (432 LOC) — used by HoursOfOperationPage
- `calculations.ts` (24 LOC, distinct from the `calculations/` directory) — re-exports `formatCurrency`/`formatPercentage`; exports `calculateRequiredSales`/`calculateFixedCosts`. Used by SimpleBreakEvenPage, SalesBreakupPage, DetailedBreakEvenPage

**Import rewrites applied**
- `@/shared/components/ui/*` → `@/components/ui/*` (mechanical, 20+ primitives across the 19 files)
- `@/components/WalkthroughNavigation` → `@/features/project/components/WalkthroughNavigation` (× 6 files)
- `@/components/ContentUploadsPanel` → `@/features/project/components/ContentUploadsPanel` (× 1 file)
- `./ScenarioColumn`, `./ScenarioSelectionDialog`, `./FitoutFinancingColumn`, `./VenueOpeningHours` → `@/features/project/components/<NAME>` (× 4 sibling-shift fixes in 3 page files)
- `../../lib/X` → `@/lib/X` (× 4 relative-to-absolute fixes in 2 page files: BusinessPlanBuilderPage, LocationSuitabilityPage)

**Typecheck end-state — matches prediction**
17 errors total: **11 TS2307 + 6 TS7006**.
- TS2307 breakdown: WalkthroughNavigation × 6 (Step 5), HoursScheduleChart × 2 (Step 5, leave-as-is at `@/components/shared/HoursScheduleChart`), ContentUploadsPanel × 1 (Step 5), `@/lib/export/exportBusinessPlan` × 2 (Step 7 dynamic imports in AIBusinessPlanPage)
- TS7006 breakdown: 6 cascade errors confined to HoursOfOperationPage (lines 968, 979) — implicit-any on callback parameters destructuring from VenueOpeningHours/WalkthroughNavigation/HoursScheduleChart props. Will vanish at Step 5.
- DetailedBreakEvenPage's 11 cascades + FitoutFinancingPage's 3 cascades from the pre-fix typecheck both fully cleared after the rewrites.

**Commits + push**
- Step 4 commit: `fdafc70 feat: import 19 viability tab pages and components (Step 4 of viability extraction)` — pushed to `origin/main` (`5e41404..fdafc70`)
- 24 files, 16,251 insertions
- Vercel build will fail on `fdafc70` (Shape A + B errors); production stays on `ce4228a` from Step 3.

## In Progress

None — Step 4 complete.

## Blockers

None blocking Step 5.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 5 — Move shell + dialogs.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 5. Estimated 2–3h. Source: same `pre-phase-c-deletion` tag at `/tmp/mojo-pre-phase-c/`.

**Step 5 must satisfy these specific TS2307s left by Step 4:**

| Path | × | Notes |
|---|---:|---|
| `@/features/project/components/WalkthroughNavigation` | 6 | Port `src/components/WalkthroughNavigation.tsx` from the tag → `src/features/project/components/WalkthroughNavigation.tsx` |
| `@/features/project/components/ContentUploadsPanel` | 1 | Port `src/components/ContentUploadsPanel.tsx` → `src/features/project/components/ContentUploadsPanel.tsx` |
| `@/components/shared/HoursScheduleChart` | 2 | Port `src/components/shared/HoursScheduleChart.tsx` → **same path** (`src/components/shared/HoursScheduleChart.tsx`); per dispatch override the path stays unchanged |

Step 5's other expected ports per plan: BusinessSnapshot, the project dialogs (CreateProjectDialog, JoinProjectDialog, etc.), the ProjectLayout shell. Let strategic-advisor session source the full Step 5 file list from the plan.

**Step 5 acceptance — falsifiable cascade check:**
After landing the shell components, run `npm run typecheck`. Three outcomes:
- **GREEN** (0 errors) **OR ≤2 TS2307 only on `@/lib/export/exportBusinessPlan`** → cascade theory + Shape-A predictions confirmed. Step 5 done. (The export-pipeline references resolve at Step 7.)
- **RED with persistent TS7006/TS18046/TS2345 in HoursOfOperationPage / any other Step-4 file** → cascade theory was wrong. **HARD STOP** and investigate.
- **RED with new TS2307 paths beyond Step-7 export references** → another inventory miss. HARD STOP, expand scope per the established pattern.

**Caveats for Step 5 — pre-emptive guidance learned in Step 4:**

- **Inventory.md is officially treated as unreliable for completeness from this point on.** 5 inventory misses surfaced in Step 4 alone (`walkthrough`, `menuUtils`, `liquorLicences`, `naturalLanguageParser`, `calculations.ts`), on top of Step 2's earlier 2 (`hoursVisualization/`, `contentUploads.ts`). Future steps' executors should expect more `@/lib/*` and other surface misses; pre-emptively run a thorough import audit during port and HARD STOP on any unfamiliar path.

- **Mechanical rewrites that EVERY tag-sourced port needs (bake into the Step 5 dispatch up front):**
  1. `@/shared/components/ui/*` → `@/components/ui/*` (shadcn path shift; mojo_business's pre-extraction layout had primitives at `src/shared/components/ui/`, viability has them at `src/components/ui/`)
  2. `@/components/<NAME>` → `@/features/project/components/<NAME>` for non-`ui`/non-`shared` paths (forward-pointers)
  3. `../../lib/X` → `@/lib/X` (relative-path shifts when the file moves between layout layers — this hit Step 4's pages because they moved from `src/components/modules/` to `src/features/project/pages/`; will likely hit Step 5's shell similarly)
  4. Sibling-relative imports (`./X`) when the sibling has moved to a different folder in the new layout — e.g. pages → components

- **Shape-A category formally widened** from "Step-5 only" to "any future-step forward reference, including Step 7 (export pipeline)." `@/lib/export/exportBusinessPlan` references in Step 4's AIBusinessPlanPage are legitimate Shape-A; they resolve at Step 7.

- **Step 4's HARD STOP count:** four — `hoursVisualization/contentUploads/walkthrough/menuUtils/liquorLicences/naturalLanguageParser` inventory misses (HSc#3), shadcn path-shift surfaced alongside (HSc#3), `calculations.ts` inventory miss (HSc#4), path-shift cleanup (HSc#4). Strategic-advisor adjudicated all as "absorb." Pattern: dispatches under-spec'd path-shift consequences of the new layout. Step 5 dispatch should pre-emptively spell out all 4 mechanical rewrites + assume more inventory misses possible.

- Step 5 needs its own structured dispatch from Max's Claude.ai strategic-advisor session.

## Key References

**Repo state:**
- Bootstrap (Step 1): `2950ee6` — last green Vercel deploy before this branch went red
- CLAUDE.md handover patch: `213389e`
- Step 2 commit: `7c40fa9` (Vercel red, by design)
- Step 2 handover: `c634ff7`
- Step 3 commit: `ce4228a` — last green Vercel deploy
- Step 3 handover: `5e41404`
- **Step 4 commit: `fdafc70`** — Vercel red (Shape A+B), production stays on `ce4228a`
- Branch: `main`

**Cumulative inventory misses (7 files, ~2,500+ LOC):**
1. `src/lib/hoursVisualization/` (4 files, 4-file directory) — Step 2 audit, ported in Step 3
2. `src/lib/contentUploads.ts` — Step 2 audit, ported in Step 3 (kept at `/lib/`, NOT renamed)
3. `src/lib/walkthrough.ts` — Step 4 audit
4. `src/lib/menuUtils.ts` — Step 4 audit
5. `src/lib/liquorLicences.ts` — Step 4 audit
6. `src/lib/naturalLanguageParser.ts` — Step 4 audit
7. `src/lib/calculations.ts` (24 LOC, distinct from `calculations/`) — Step 4 second-pass audit

**Auth surface (unchanged):**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }`
- Supabase client localStorage namespace: `mojo-viability-auth`
- `window.supabase` exposed in dev only

**Source clones in /tmp:**
- `/tmp/mojo-business-current/` — current main, used Steps 2–3 (math layer + utils)
- `/tmp/mojo-pre-phase-c/` — `pre-phase-c-deletion` tag at commit `2fc45f7`, used Step 4 (V-ONLY UI surface). Will be used by Steps 5–8.

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY inventory **(treat as under-catalogued; 7 misses surfaced so far)**
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) — orphan corrections
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md) — informational, post-Phase-2
