# Mojo Viability Handover — 2026-05-09 (Step 3)

## Session Summary

Step 3 of the 12-step extraction plan: type model + shared utils ported from mojo_business current main. 14 new files landed (11 verbatim + 2 renames + 1 directory port; 1 file dropped). The falsifiable cascade-theory check from Step 2's HANDOVER passed cleanly: `npm run typecheck` went from 36 errors to 0 the moment the 7 unresolved modules landed, confirming the 19 non-TS2307 errors in Step 2 were cascade artefacts from missing types — not inherent bugs. `npm run build` also green. Vercel should now redeploy `ce4228a` successfully (production was stuck on Step 1's `2950ee6` while Step 2's `7c40fa9` was deliberately red).

## Completed

**Verbatim ports (8 destinations, 11 files)**
- `src/lib/types/projectTypes.ts` — type model (per Q4 decision: lives in viability, not duplicated)
- `src/lib/projectFactory.ts` — `createEmptyProject` template
- `src/lib/timeUtils.ts`, `src/lib/addressUtils.ts`, `src/lib/format.ts`, `src/lib/htmlEscape.ts` — small utils consumed by calc engines + future export pipeline
- `src/lib/uploadValidation.ts` — used by future ContentUploadsPanel
- `src/lib/contentUploads.ts` — KEPT at `/lib/` per strategic-advisor override (plan said rename to `features/project/api/contentUploadsApi.ts`; deferred to a later cleanup so `businessPlanGenerator.ts` doesn't have to point at a feature folder)
- `src/lib/hoursVisualization/` — directory port (4 files: `index.ts`, `dataTransform.ts`, `htmlGenerator.ts`, `types.ts`) — inventory miss recovery from Step 2

**Renames into feature-folder convention (2 files)**
- `mojo_business/src/lib/projects.ts` → `src/features/project/api/projectsApi.ts`
- `mojo_business/src/lib/permissions.ts` → `src/features/project/api/permissionsApi.ts`
- Internal sibling imports rewritten to absolute `@/lib/*` paths:
  - `projectsApi.ts`: `'./supabase'` → `'@/lib/supabase'`, `'./types/projectTypes'` → `'@/lib/types/projectTypes'`
  - `permissionsApi.ts`: `'./supabase'` → `'@/lib/supabase'`

**Drop (1 file)**
- `mojo_business/src/lib/resolveJoinCode.ts` — not ported (per Q3: no team-member join-code path in viability)

**Cascade-theory falsifiable check: CONFIRMED**
Pre-Step-3 baseline: 36 errors (18 TS2307 module-not-found + 18 cascade-shape: TS7006 × 15, TS18046 × 2, TS2345 × 1). Post-Step-3: `npm run typecheck` exit code 0, zero errors. The cascade errors confined to `businessPlanGenerator.ts`, `businessPlanReadiness.ts`, `projectSummary.ts` all vanished simultaneously with the 7 modules landing — perfect support for the cascade hypothesis. The math layer is not buggy; strict-mode TS just couldn't infer callback parameter types when the underlying type module was missing.

**Build green** — `npm run build` succeeds: 141 modules transformed, 440 KB JS / 43 KB CSS, ~852 ms. (Module count unchanged from Step 1 because the new files aren't entry-point reachable yet — App.tsx still only renders HelloUser. Vite tree-shakes them out until Steps 4–9 wire them up.)

**Commit + push**
- Step 3 commit: `ce4228a feat: import type model and shared utils (Step 3 of viability extraction)`
- Pushed: `c634ff7..ce4228a` to `origin/main`
- 14 files changed, 2,433 insertions
- Vercel should redeploy `ce4228a` successfully (this is the first green push since `2950ee6`)

## In Progress

None — Step 3 complete.

## Blockers

None blocking Step 4.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 4 — Move tab content components.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 4. Estimated 3–4h. **First major step** — 21 files, ~17,500 LOC. Source path shifts from current main to the **`pre-phase-c-deletion` git tag** because most of these files were deleted in Phase C-light.

**Source-path setup (pre-step):**
```bash
git clone --depth 1 -b pre-phase-c-deletion \
  https://github.com/mschaapveld/mojo_business.git \
  /tmp/mojo-pre-phase-c
```

The 21 files (per [`pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) §1's confirmed inventory): `SimpleBreakEven`, `DetailedBreakEven`, the 4 FitoutFinancing files, `HoursOfOperation`, `VenueOpeningHours`, `SalesBreakup`, `MenuBuilder`, `LabourCosting`, `LinkParsingSection`, `LocationSuitability`, `SalesPredictions`, `BusinessPlanning`, `AIBusinessPlanBuilder`, `BusinessPlanBuilder`, `ScenarioColumn`, `ScenarioSelectionDialog`. (Inventory said 21; this list above counts to 21 once the 4 FitoutFinancing files expand. Verify exact set against `inventory.md` §1.5 at dispatch time.)

**Caveats for Step 4:**
- Watch for inventory misses similar to Step 2's `hoursVisualization`/`contentUploads`. Run an import audit after copy and HARD STOP on any unexpected `@/...` paths beyond what's already shipped (`@/lib/*`, `@/components/ui/*`, `@/providers/*`, `@/features/project/api/*`).
- The tab content components likely import from `@/lib/calculations` (shipped Step 2), `@/lib/types/projectTypes` (shipped Step 3), `@/components/ui/*` (shipped Step 1), and probably some shared `@/components/shared/*` that haven't been ported yet — those will need a Step 4.5 or get rolled into Step 4.
- Step 4 needs its own structured dispatch from Max's Claude.ai strategic-advisor session.

## Key References

**Repo state:**
- Bootstrap (Step 1): `2950ee6` — last green Vercel deploy before Step 3
- CLAUDE.md handover patch: `213389e`
- Step 2 commit: `7c40fa9` — Vercel red here by design
- Step 2 handover: `c634ff7`
- **Step 3 commit: `ce4228a`** — Vercel should be green again from this push
- Branch: `main` (no feature branches)

**14 files added in Step 3:**
- `src/lib/types/projectTypes.ts`
- `src/lib/projectFactory.ts`
- `src/lib/timeUtils.ts`, `addressUtils.ts`, `format.ts`, `htmlEscape.ts`
- `src/lib/uploadValidation.ts`
- `src/lib/contentUploads.ts`
- `src/lib/hoursVisualization/{index,dataTransform,htmlGenerator,types}.ts`
- `src/features/project/api/projectsApi.ts`, `permissionsApi.ts`

**Imports now satisfied (all 7 from Step 2's HANDOVER):**
1. `@/lib/types/projectTypes` (also imported as `../types/projectTypes`) ✓
2. `../timeUtils` ✓
3. `../addressUtils` ✓
4. `@/lib/format` ✓
5. `@/lib/htmlEscape` ✓
6. `../contentUploads` ✓
7. `../hoursVisualization` ✓

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan (Step 4 spec at §3 Step 4)
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY file inventory (note: under-catalogues `hoursVisualization/` + `contentUploads.ts`; trust but verify)
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) — orphan corrections
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md) — informational, post-Phase-2

**Auth surface (unchanged):**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }`
- Supabase client localStorage namespace: `mojo-viability-auth`
- `window.supabase` exposed in dev only
