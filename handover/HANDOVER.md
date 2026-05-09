# Mojo Viability Handover — 2026-05-09 (Step 2)

## Session Summary

Step 2 of the 12-step extraction plan: 14 viability calculation engines copied verbatim from mojo_business current main into `src/lib/calculations/`, with `eventUplift.ts` dropped as the confirmed orphan. Two HARD STOPs along the way (an inventory miss + a cascade-error question) were both adjudicated by the strategic-advisor session and accepted. Typecheck is red as expected — 17 TS2307s across 7 unresolved paths plus 19 cascade errors confined to 3 files; all expected to vanish once Step 3 lands the type model + utils. Commit pushed; Vercel build will fail on this commit by design — production stays on Step 1's last green deploy `2950ee6`.

## Completed

**File operations**
- 14 calc engines copied from `/tmp/mojo-business-current/src/lib/calculations/` to `src/lib/calculations/`: businessPlanGenerator, businessPlanReadiness, dataSourceSelector, forecastEngine, holidayBumpProfiles, hourlyBenchmarks, insightsEngine, locationSuitability, mojoFitScore, orderSourceFees, projectSummary, seasonalityProfiles, summaryViability, weeklyForecastEngine
- `eventUplift.ts` dropped (confirmed orphan per pre-extraction-punch-list.md §1)
- 2,854 LOC ported

**Audit findings (logged in commit message)**
- `dataSourceSelector.ts` and `orderSourceFees.ts` confirmed NOT orphans (sibling-imported by `projectSummary.ts`); shipped per punch-list §1's correction to inventory.md
- Inventory miss caught: `businessPlanGenerator.ts` imports from `../hoursVisualization` (a 4-file V-ONLY directory at `src/lib/hoursVisualization/`) and `../contentUploads` (a V-ONLY util at `src/lib/contentUploads.ts`) — neither was in the dispatch's Step-3 allowlist nor in inventory.md. Both confirmed real V-ONLY surface. Strategic-advisor session expanded Step 3 scope to absorb them.

**Cascade analysis (logged in commit message)**
- Typecheck output: 17 TS2307 + 19 non-TS2307 errors. The non-TS2307 errors (TS7006 implicit-any × 15, TS18046 unknown × 2, TS2345 unknown→number × 1) appear ONLY in the 3 files that operate on unresolved types via `.reduce/.sort/.flatMap` or destructure unknown values: `businessPlanGenerator.ts`, `businessPlanReadiness.ts`, `projectSummary.ts`. The 8 other engines have only TS2307 errors. Perfect correlation supports the cascade-from-missing-types hypothesis. Math layer typechecks green in mojo_business production, so these are cascade artefacts, not inherent bugs. Step 3 includes a falsifiable cascade check (see Next Session).

**Commits + push**
- Step 2 commit: `7c40fa9 feat: import 14 viability calculation engines (eventUplift dropped as orphan)` — pushed to `origin/main` (`213389e..7c40fa9`)
- Vercel build on `7c40fa9` will be red (typecheck fails); production stays on `2950ee6` (last green deploy from Step 1). This is by design per the dispatch.

## In Progress

None — Step 2 is complete.

## Blockers

None blocking Step 3.

**Carried over from Step 1 (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. The plaintext leaked into chat during Step 1's Task 13 smoke debug. Treat as compromised.

## Next Session

**Step 3 — type model + shared utils.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 3, with two scope adjustments noted below. Estimated 1.5–2h (slight bump from the plan's 1–2h to absorb the inventory miss).

Step 3 must satisfy SEVEN missing import paths that the calc engines reference:

- `@/lib/types/projectTypes` — projectTypes.ts (per plan)
- `../timeUtils`, `../addressUtils`, `../format`, `../htmlEscape` — small utils (per plan)
- `../contentUploads` — **KEEP at `src/lib/contentUploads.ts`**. Strategic-advisor session overrode the plan's rename to `features/project/api/contentUploadsApi.ts`; the rename is deferred to a later cleanup step. Keeping it at `/lib/` avoids forcing a one-line edit inside `businessPlanGenerator.ts` (a calc engine) to point at a feature folder.
- `../hoursVisualization` — **NEW to Step 3 scope.** Port the full directory (4 files: `index.ts`, `dataTransform.ts`, `htmlGenerator.ts`, `types.ts`) verbatim from `/tmp/mojo-business-current/src/lib/hoursVisualization/` to `src/lib/hoursVisualization/`. No rename. `lib/export/` consumers will need it again at Step 7.

Other Step 3 ports per plan still apply: `projectFactory.ts`, `uploadValidation.ts`, `projects.ts → projectsApi.ts` (RENAMED), `permissions.ts → permissionsApi.ts` (RENAMED), drop `resolveJoinCode.ts`.

**Step 3 acceptance — falsifiable cascade check:**

After landing the 7 modules, run `npm run typecheck`. Three outcomes:

- **GREEN (0 errors)** → cascade theory confirmed. Step 3 done. `npm run build` should also be green; verify.
- **RED with persistent TS7006 / TS18046 / TS2345 in `businessPlanGenerator.ts` / `businessPlanReadiness.ts` / `projectSummary.ts`** → cascade theory was wrong. **HARD STOP** and investigate before commit. Likely causes: (a) the ported types/utils have shape drift from what the engines expect; (b) genuine bugs in the math layer that mojo_business hasn't surfaced because of looser tsconfig flags; (c) a TypeScript version delta between the two repos surfacing latent strict-mode issues.
- **RED with TS2307 only** → some import path is still wrong. Easy fix; not a theory failure.

**Caveats for Step 3:**
- Source path: `/tmp/mojo-business-current/` (current main, like Step 2). Re-clone with `git clone --depth 1 https://github.com/mschaapveld/mojo_business.git /tmp/mojo-business-current` if `/tmp` has been cleared.
- The `pre-phase-c-deletion` tag clone (`/tmp/mojo-pre-phase-c/`) is for Steps 4+ when V-ONLY UI surface needs to come from the tag, not for Step 3.
- Step 3 needs its own structured dispatch from Max's Claude.ai strategic-advisor session.

## Key References

**Repo state:**
- Bootstrap commit (Step 1): `2950ee6` — last green Vercel deploy
- CLAUDE.md handover patch: `213389e`
- Step 2 commit: `7c40fa9` — Vercel build red here by design
- Branch: `main` (no feature branches; pushing direct per Step 1 pattern)

**The 7 unresolved paths Step 3 must satisfy:**
1. `@/lib/types/projectTypes` (also imported as `../types/projectTypes`)
2. `../timeUtils`
3. `../addressUtils`
4. `@/lib/format`
5. `@/lib/htmlEscape`
6. `../contentUploads` ← inventory miss, KEEP at /lib/
7. `../hoursVisualization` ← inventory miss, directory port to /lib/

**The 3 cascade-emitting files (Step 3's falsifiable check targets):**
- `src/lib/calculations/businessPlanGenerator.ts` (15 cascade errors expected to vanish)
- `src/lib/calculations/businessPlanReadiness.ts` (1 cascade error expected to vanish)
- `src/lib/calculations/projectSummary.ts` (4 cascade errors expected to vanish)

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan (Step 3 spec at §3 Step 3, with the contentUploads-rename override above)
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY file inventory (note: missed `hoursVisualization/` and `contentUploads.ts`; treat as under-catalogued)
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) — orphan corrections
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md) — informational, post-Phase-2

**Auth surface (unchanged from Step 1):**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }`
- Supabase client localStorage namespace: `mojo-viability-auth`
- `window.supabase` exposed in dev only
