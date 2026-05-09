# Mojo Viability Handover — 2026-05-09 (Step 5)

## Session Summary

Step 5 of the 12-step extraction plan: **15 new files** (12 features + 1 LoadingScreen + 1 HoursScheduleChart + 1 useAutoSave hook) ported from the `pre-phase-c-deletion` git tag. **Cascade theory confirmed for the third step running** — `npm run typecheck` collapsed from 17 errors (Step 4 baseline) to 0; `npm run build` green. Two HARD STOPs adjudicated by strategic-advisor: pre-emptive lib audit caught inventory miss #8 (`useAutoSave.ts`), then post-typecheck audit caught two new mechanical rewrite patterns (`@/app/providers/*` → `@/providers/*` and `../hooks/*` → `@/hooks/*`). Step-7 export-pipeline forward references handled via 2 `@ts-expect-error` directives (self-cleaning; Step 7 executor removes them when the export module lands). Vercel should now redeploy `c9dbe5f` GREEN — production updates from Step 3's `ce4228a`.

## Completed

**Shell + dialogs (12 files at `src/features/project/components/`)**
- BusinessSnapshot, ProjectSideNav (renamed from Sidebar), NewProjectOriginDialog, SaveProjectCTA, SaveProjectValidationDialog, SaveStatusIndicator, ShareProjectDialog, WalkthroughNavigation, ContentUploadsPanel, HelpDialog, OnboardingTour, GuestBanner

**Top-level components (2 files)**
- `src/components/LoadingScreen.tsx` (top-level, coexists with Step 1's `src/components/ui/LoadingScreen.tsx`; Step 9's App.tsx picks which to use)
- `src/components/shared/HoursScheduleChart.tsx`

**Inventory miss #8 (1 file at `src/hooks/`)**
- `src/hooks/useAutoSave.ts` (121 LOC) — used only by SaveStatusIndicator. Surfaced by the **new pre-emptive audit pattern** (which audits `@/lib/*` and `@/hooks/*` imports BEFORE running typecheck). First time the pattern caught a miss before typecheck — pattern works as designed. Inline rewrite applied: `@/lib/projects` → `@/features/project/api/projectsApi` (Step 3 rename).

**File + component-identifier rename**
- `Sidebar.tsx` → `ProjectSideNav.tsx`; identifier `Sidebar`/`SidebarProps` → `ProjectSideNav`/`ProjectSideNavProps` (3 occurrences renamed)

**File dropped**
- `ProjectManager.tsx` — per plan, replaced by `<ProjectsListPage>` route in Step 9

**Five mechanical rewrites applied across all 15 newly-ported files**
1. `@/shared/components/ui/X` → `@/components/ui/X` (shadcn path shift, ~10+ primitives)
2. `../../lib/X` and `../lib/X` → `@/lib/X` (relative-to-absolute lib)
3. `@/components/<NAME>` → `@/features/project/components/<NAME>` for the 12 forward-pointer targets (BusinessSnapshot, SaveProjectCTA, SaveProjectValidationDialog, SaveStatusIndicator, ShareProjectDialog, NewProjectOriginDialog, WalkthroughNavigation, ContentUploadsPanel, HelpDialog, OnboardingTour, onboarding/GuestBanner, layout/Sidebar)
4. **NEW: `@/app/providers/X` → `@/providers/X`** (provider path shift; mojo_business kept providers at `src/app/providers/`, viability has them at `src/providers/` per Step 1's bootstrap). SaveProjectCTA was the only Step-5 file affected (imported ThemeProvider).
5. **NEW: `../hooks/X` → `@/hooks/X`** (relative-to-absolute hooks). ShareProjectDialog imported `../hooks/use-toast` which resolved in mojo_business's flat `/components/` layout but breaks in our `/features/project/components/` structure. Same family as the relative-lib rewrite.

Plus: `@/lib/permissions` → `@/features/project/api/permissionsApi` (Step 3 rename, found inside ProjectSideNav).

**Source-path correction logged**
- `GuestBanner.tsx` was located at `/tmp/mojo-pre-phase-c/src/features/viability/components/GuestBanner.tsx`, NOT at the dispatch-specified `/src/components/onboarding/` path. Content verified identical; ported from the correct path. The pre-phase-c-deletion tag already had partial `features/viability/` structure — relevant archaeology for Steps 6+.

**Step-7 forward-reference handling**
- 2 `@ts-expect-error` directives added to [AIBusinessPlanPage.tsx](src/features/project/pages/AIBusinessPlanPage.tsx) at lines 174 and 187 for the `@/lib/export/exportBusinessPlan` dynamic imports. **Self-cleaning**: TypeScript will error on the directives once Step 7 ships the export module, prompting deletion. Comments include the Step-7 cleanup instruction.

**Verification**
- `npm run typecheck`: **GREEN** (exit 0, zero errors)
- `npm run build`: **GREEN** (141 modules, 440 KB JS / 57 KB CSS, 952 ms)
- Cascade theory holds: Step 4's 6 TS7006 cascades in HoursOfOperationPage all vanished as predicted

**Commits + push**
- Step 5 commit: `c9dbe5f feat: import 14 viability shell + dialog components (Step 5 of viability extraction)` — pushed to `origin/main` (`6c1cd4f..c9dbe5f`)
- 16 files changed (15 new + 1 modified — AIBusinessPlanPage with directives), 3,157 insertions
- **Vercel will redeploy `c9dbe5f` GREEN** — production transitions from Step 3's `ce4228a` to Step 5

## In Progress

None — Step 5 complete.

## Blockers

None blocking Step 6.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 6 — Landing pages + onboarding.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 6. Estimated ~2h. Source: same `pre-phase-c-deletion` tag.

**Step 6 acceptance:** typecheck + build remain GREEN throughout. The 2 `@ts-expect-error` directives in AIBusinessPlanPage stay in place until Step 7 lands.

**Cumulative standard mechanical rewrites for Step 6+ dispatches (bake-in pre-emptively):**
1. `@/shared/components/ui/X` → `@/components/ui/X` (shadcn path shift)
2. `../../lib/X` and `../lib/X` → `@/lib/X` (relative-to-absolute lib)
3. `@/components/<NAME>` → `@/features/project/components/<NAME>` (forward-pointers to ported components — list grows each step)
4. `@/app/providers/X` → `@/providers/X` (provider path shift)
5. `../hooks/X` → `@/hooks/X` (relative-to-absolute hooks)
6. `@/lib/projects` → `@/features/project/api/projectsApi` and `@/lib/permissions` → `@/features/project/api/permissionsApi` (Step 3 renames; surfaces in any file that imports those APIs)

**Pre-emptive audit pattern (continues from Step 5):**
Before running typecheck, audit `@/lib/*`, `@/hooks/*`, `@/features/*`, `@/components/*`, `@/providers/*` imports. For each unique path, confirm the target file exists in our repo. If not, check the tag — if it exists at the tag, that's an inventory miss to surface for adjudication. **8 inventory misses across Steps 2/4/5; treat `inventory.md` as unreliable for completeness.**

**Caveats for Step 6:**
- When looking for files at the tag, cross-reference BOTH `/src/components/<X>/` AND `/src/features/viability/components/` — the rebuild had already partially started reorganising before Phase C-light (GuestBanner discovery).
- Step 6 needs its own structured dispatch from Max's Claude.ai strategic-advisor session.

## Key References

**Repo state:**
- Bootstrap (Step 1): `2950ee6`
- CLAUDE.md handover patch: `213389e`
- Step 2 commit: `7c40fa9` (Vercel red, by design)
- Step 2 handover: `c634ff7`
- Step 3 commit: `ce4228a` (Vercel green; was production-serving until Step 5)
- Step 3 handover: `5e41404`
- Step 4 commit: `fdafc70` (Vercel red, by design — Shape A+B)
- Step 4 handover: `6c1cd4f`
- **Step 5 commit: `c9dbe5f` — Vercel GREEN, production transitions here**
- Branch: `main`

**Cumulative inventory misses (8 files, ~2,700+ LOC):**

| # | File | Step surfaced | LOC |
|---:|---|---|---:|
| 1 | `src/lib/hoursVisualization/` (4-file directory) | 2 | ~600 |
| 2 | `src/lib/contentUploads.ts` | 2 | 6.4KB |
| 3 | `src/lib/walkthrough.ts` | 4 | 354 |
| 4 | `src/lib/menuUtils.ts` | 4 | 486 |
| 5 | `src/lib/liquorLicences.ts` | 4 | 116 |
| 6 | `src/lib/naturalLanguageParser.ts` | 4 | 432 |
| 7 | `src/lib/calculations.ts` | 4 (second-pass) | 24 |
| 8 | `src/hooks/useAutoSave.ts` | **5 (pre-emptive audit)** | 121 |

**Step 7 cleanup tracker:**
- 2 `@ts-expect-error` directives in [AIBusinessPlanPage.tsx](src/features/project/pages/AIBusinessPlanPage.tsx) lines 174, 187 — REMOVE when Step 7 ships `src/lib/export/exportBusinessPlan.ts`. TypeScript will error on the directives if not removed (self-prompting cleanup).

**Cascade theory status: CONFIRMED for the 3rd step running.**
- Step 3 → green (theory established)
- Step 4 → partial-then-green (after path-shift fixes)
- Step 5 → green
Diagnostic framework is reliable. Use the falsifiable check on every future step.

**Source clones in /tmp:**
- `/tmp/mojo-business-current/` — current main, used Steps 2–3
- `/tmp/mojo-pre-phase-c/` — `pre-phase-c-deletion` tag at commit `2fc45f7`, used Steps 4–5. Will be used by Steps 6–8.

**Auth surface (unchanged):**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }`
- Supabase client localStorage namespace: `mojo-viability-auth`
- `window.supabase` exposed in dev only

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY inventory **(treat as under-catalogued; 8 misses surfaced so far)**
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) — orphan corrections
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md) — informational, post-Phase-2
