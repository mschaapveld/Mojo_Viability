# Mojo Viability Handover — 2026-05-09 (Step 7)

## Session Summary

Step 7 of the 12-step extraction plan: **9 export-pipeline files** ported from mojo_business current main into `src/lib/export.ts` + `src/lib/export/`. **Cleanest step yet** — sub-agent fan-out caught zero issues (no inventory misses, no rewrites needed beyond the standard 7, no Mojo-360 leakage). Cascade theory now **4-for-4**. The 2 `@ts-expect-error` directives from Step 5 self-triggered cleanup as designed (TS2578 fired immediately when `exportBusinessPlan` resolved, prompting removal). Typecheck + build remain GREEN; Vercel stays green on this push. Cumulative inventory misses still **8** — no new misses since Step 5.

## Completed

**Export pipeline (9 files, ~2,260 LOC)**
- `src/lib/export.ts` (422 LOC) — simple-export functions for SimpleBreakEven; coexists with `src/lib/export/` by design per [punch-list §1](../context/viability-extraction/pre-extraction-punch-list.md)
- `src/lib/export/index.ts` (6 LOC) — barrel re-exporting from siblings
- `src/lib/export/exportDataBuilder.ts` (69 LOC) — `buildExportData`, `getAnnualExpectedSales`, `getViabilityNarrative`
- `src/lib/export/exportToPDF.ts` (373 LOC) — `exportComprehensivePDF`
- `src/lib/export/exportToExcel.ts` (339 LOC) — `exportComprehensiveExcel`
- `src/lib/export/exportBusinessPlan.ts` (238 LOC) — `exportBusinessPlanPDF`, `exportBusinessPlanWord` (the targets of the Step 5 dynamic imports + `@ts-expect-error` directives)
- `src/lib/export/printHtmlBuilder.ts` (447 LOC) — `buildPrintReadyHTML`
- `src/lib/export/chartToImage.ts` (86 LOC) — chart rendering
- `src/lib/export/hoursChartSvgRenderer.ts` (289 LOC) — `generateHoursChartSvg`

**Sub-agent fan-out execution**
- **Fan-out #1 (source verification):** all 9 files at canonical paths in BOTH clones (current main + tag). No "neither" rows, no alt-located files, no inventory misses. **Tested clean.**
- **Fan-out #2 (pre-emptive import audit):** all imports clean (bucket A only). Buckets B, C, D all empty. No mechanical rewrites needed beyond the 7 standard categories applied pre-emptively (which resulted in 0 actual changes — the export files were already using the canonical `@/lib/*` convention). No Mojo 360 platform-membership leakage. **Tested clean.**

This was the first step where both sub-agent fan-outs returned zero flags — pattern is showing maturity (export pipeline was always clean by design; the `@/lib/*` imports inside it referenced files we'd already shipped in Steps 2/3).

**Cleanup tracker satisfied**
- 2 `@ts-expect-error` directives REMOVED from [src/features/project/pages/AIBusinessPlanPage.tsx](src/features/project/pages/AIBusinessPlanPage.tsx) (Step 5 lines 174, 187).
- **Self-cleaning trigger fired as designed:** typecheck immediately after the export pipeline landed produced `TS2578: Unused '@ts-expect-error' directive` × 2 — the precise prompt to remove. Both directives + their explanatory single-line comments deleted via Edit tool.

**Cascade theory: 4-for-4 confirmed**
- Step 3 → green (theory established)
- Step 4 → partial-then-green
- Step 5 → green
- **Step 7 → green** (Step 6 was a green-throughout step, didn't exercise cascade)

After directive removal, typecheck went straight to 0 errors. No surprise cascade needed cleanup. Diagnostic framework continues to be reliable.

**Verification**
- `npm run typecheck`: **GREEN** (exit 0, zero errors)
- `npm run build`: **GREEN** (141 modules, 440 KB JS / 59 KB CSS, 933 ms)
- Module count unchanged from prior steps because the export pipeline isn't yet entry-reachable (App.tsx still renders only HelloUser); Vite tree-shakes it. Step 9 wires it up.

**Commits + push**
- Step 7 commit: `590ce47 feat: import export pipeline (Step 7 of viability extraction)` — pushed to `origin/main` (`aca502c..590ce47`)
- 10 files changed (9 new + 1 modified — AIBusinessPlanPage with directives removed), 2,269 insertions, 2 deletions
- **Vercel stays GREEN** — production transitions from Step 6 to Step 7

## In Progress

None — Step 7 complete.

## Blockers

None blocking Step 8.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 8 — Move hooks.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 8. Estimated 30 min. Smallest step in the plan.

**Files expected:**
- `src/hooks/useAutoSave.ts` → **`src/features/project/hooks/useProjectAutoSave.ts`** (rename per anatomy §6.3 — clarity rename for the project-level autosave). NOTE: `useAutoSave.ts` was already ported to `src/hooks/useAutoSave.ts` in Step 5 as inventory-miss #8. Step 8 should MOVE it (not re-port from tag) to the new home + rename, AND update the import in [src/features/project/components/SaveStatusIndicator.tsx](src/features/project/components/SaveStatusIndicator.tsx) (currently imports from `@/hooks/useAutoSave`).
- `src/hooks/useKeyboardShortcuts.ts` → `src/hooks/useKeyboardShortcuts.ts` (verbatim copy, no rename)

Source: source for `useKeyboardShortcuts.ts` likely `/tmp/mojo-pre-phase-c/src/hooks/useKeyboardShortcuts.ts` (verify).

**Step 8 acceptance:** typecheck + build remain GREEN.

**Cumulative standard mechanical rewrites (still 7, still active):**
1. `@/shared/components/ui/X` → `@/components/ui/X`
2. `../../lib/X` and `../lib/X` → `@/lib/X`
3. `@/components/<NAME>` → `@/features/project/components/<NAME>` for the cumulative 12-component forward-pointer list
4. `@/app/providers/X` → `@/providers/X`
5. `../hooks/X` and `../../hooks/X` → `@/hooks/X`
6. `@/lib/projects` / `@/lib/permissions` → `@/features/project/api/<projectsApi|permissionsApi>`
7. `@/features/<feature>/components/<NAME>` → `@/components/<NAME>` when destination is top-level

**Note for Step 8:** the move + rename of `useAutoSave` will require a cross-file import update — the old `@/hooks/useAutoSave` reference in SaveStatusIndicator must be rewritten to `@/features/project/hooks/useProjectAutoSave`. Add this as a one-off rewrite during Step 8 execution.

**Pre-emptive audit pattern (continues):**
Sub-agent fan-out is now established as the canonical pattern. Step 8 dispatch should call the same two fan-outs (source verification + import audit) even though the step is small.

**Mojo-360-strip pattern alert:** continues to apply but unlikely to fire in Step 8 (just two hook files, both already vetted).

**Caveats for Step 8:**
- Step 8 needs its own structured dispatch from Max's Claude.ai strategic-advisor session.

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
- **Step 7 commit: `590ce47` — Vercel green, production updates to Step 7**
- Branch: `main`

**Cumulative inventory misses (still 8 — Step 7 added zero):**

| # | File | Step surfaced | LOC |
|---:|---|---|---:|
| 1 | `src/lib/hoursVisualization/` (4-file directory) | 2 | ~600 |
| 2 | `src/lib/contentUploads.ts` | 2 | 6.4KB |
| 3 | `src/lib/walkthrough.ts` | 4 | 354 |
| 4 | `src/lib/menuUtils.ts` | 4 | 486 |
| 5 | `src/lib/liquorLicences.ts` | 4 | 116 |
| 6 | `src/lib/naturalLanguageParser.ts` | 4 | 432 |
| 7 | `src/lib/calculations.ts` | 4 (second-pass) | 24 |
| 8 | `src/hooks/useAutoSave.ts` | 5 (pre-emptive audit) | 121 |

**Architectural strip log (deliberate adaptations away from Mojo 360 concepts):**
- Step 1: `<AuthProvider>` stripped of `is_super_user`, `is_advisor`, `signInWithProvider`, `OrgProvider`
- Step 6: `HospoOSModal` stripped of `useBusinessContext` dependency

**Cleanup tracker:**
- ✓ Step 7: 2 `@ts-expect-error` directives in AIBusinessPlanPage.tsx — REMOVED.

**Cascade theory status: 4-for-4 confirmed.** Use the falsifiable check on every future step that's expected to be red.

**Source clones in /tmp:**
- `/tmp/mojo-business-current/` — current main, used Steps 2–3, 7. Likely Step 8 (useKeyboardShortcuts).
- `/tmp/mojo-pre-phase-c/` — `pre-phase-c-deletion` tag at commit `2fc45f7`, used Steps 4–6. Could fall back for Step 8.

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
