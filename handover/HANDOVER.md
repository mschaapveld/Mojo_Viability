# Mojo Viability Handover — 2026-05-10 (Step 10b)

## Session Summary

Step 10b — code mutations + cross-section sync. Built the cross-section sync function and period scaling pure functions, wired them through `patchProjectData` (sync) and a synchronous local-state setter (period). Smoke caught two bugs: customFixedCosts entries silently failed to scale (legacy gap, fixed inline), and the original `useUpdateProjectPeriod` mutation hook introduced a cache-vs-local-state race (autosave debounce of 1200ms means cache can be older than local state when user changes period mid-typing). Strategic-advisor adjudicated: remove the period mutation hook entirely, use a synchronous setter that scales local state and lets autosave persist normally. Final shape ships with `useUpdateProjectData` (still useful for explicit syncs) but not `useUpdateProjectPeriod`. The HIGH-severity Step-9b carry-forward (cross-section sync) is **resolved by the sync function**; the related "rent ↔ mortgage swap" feature is reclassified as Phase 2.5 wishlist (never built in mojo_business — it's forward feature work, not a port-fidelity bug).

## Completed

**Cross-section sync — pure function**
- [src/lib/calculations/crossSectionSync.ts](src/lib/calculations/crossSectionSync.ts) — `applyCrossSectionSync(prev, updates)` returns the merged + synced ProjectData. Two internal helpers mirror property fields when `occupancyType` differs between scenario pairs:
  - `syncFitoutToDetailed`: copies 8 property fields from financing scenarios into matching detailed scenarios (only when occupancyType differs); also resolves `loanType` (defaults to `'principalAndInterest'` when transitioning to purchasing).
  - `syncDetailedToFitout`: mirror, but `loanType` is NOT synced back (asymmetric — fitout-side concern).
- Field set covered (per Section 2 fan-out): `occupancyType`, `propertyPurchasePrice`, `propertyDeposit`, `propertyClosingCosts`, `propertyStampDuty`, `propertyGstPayable`, `propertyInterestRate`, `propertyLoanTerm`. `loanType` covered fitout→detailed only.
- Loop-safe by design: the `if occupancyType differs` guard means the sync only runs on mode flips (renting↔purchasing), not on every property-field edit. After mode flip, occupancyTypes match → no further sync triggers.

**Period scaling — pure function**
- [src/lib/scaleProjectByPeriod.ts](src/lib/scaleProjectByPeriod.ts) — `scaleProjectByPeriod(prev, newPeriod)` returns ProjectData with numeric fields in `simpleBreakEven` + `detailedBreakEven` (all 3 scenarios) scaled by `multipliers[newPeriod] / multipliers[oldPeriod]` (Weekly=1, Monthly=4.33, Yearly=52).
- Substring exclusion list preserved verbatim from legacy: `'variable'`, `'percent'`, `'Percent'`, `'Interest'`, `'Term'`.
- **`customFixedCosts[].value` now scales** — closes a latent gap in the legacy mojo_business `scaleData` which only iterated top-level numeric properties and silently skipped array-of-objects entries.

**Mutation hook**
- [src/features/project/hooks/useUpdateProjectData.ts](src/features/project/hooks/useUpdateProjectData.ts) — TanStack mutation. Reads cached project from `['project', id]`, runs `applyCrossSectionSync`, persists, invalidates cache.
- **`useUpdateProjectPeriod.ts` was authored then deleted** during smoke — see strategic-advisor diagnosis below.

**ProjectLayout wiring**
- [src/features/project/components/ProjectLayout.tsx](src/features/project/components/ProjectLayout.tsx):
  - `patchProjectData` now runs `applyCrossSectionSync(prev, patch)` instead of plain spread merge — local state is always sync-coherent; autosave persists the synced shape (no autosave changes needed).
  - Period sub-header replaced from static `<span>Period: {project.period}</span>` to interactive shadcn `<Select>` with Weekly/Monthly/Yearly options.
  - `handlePeriodChange` is a synchronous local-state setter: `setProjectData((prev) => prev ? scaleProjectByPeriod(prev, newPeriod) : prev)`. Autosave persists naturally on next debounce tick.

**Smoke + adjudications during Section 8**

Smoke pass 1 — Max ran locally and reported: cross-section sync ✓, autosave ✓, but **fixed-cost fields in `/break-even/detailed` don't scale** when period changes.
- Investigation: standard fixed costs (rent, insurance, accounting, marketing, utilities, otherFixed, labourMinimumCost) DO scale via the substring-exclusion logic. The gap was specifically `customFixedCosts` (an array of `{id, name, value}` objects — the scaler's top-level iteration didn't reach the `value` property). Same gap existed in legacy mojo_business. Fix applied: explicit `scaleCustomFixedCosts` helper called from a per-scenario wrapper inside the scaler.

Smoke pass 2 — Max re-smoked with strategic-advisor adjudication: discovered a more fundamental bug in the period mutation. **Cache-vs-local-state race:**
- The original `useUpdateProjectPeriod` hook read cached project data via `queryClient.getQueryData(['project', id])`.
- Cache lags local state when autosave is mid-debounce (1200ms). User types in a field, then immediately changes period — cache still holds the pre-typing data.
- Mutation scaled the stale cache, persisted scaled-stale, refetched scaled-stale, useEffect overwrote local state with scaled-stale → **user's typed values vanished**.
- **Fix:** delete `useUpdateProjectPeriod` entirely. Period change is a pure transform on already-loaded ProjectData — synchronous local-state setter + normal autosave persistence avoids the race.

**Verification**
- `npm run typecheck`: GREEN
- `npm run build`: GREEN (2,558 → 2,557 modules — net +2 from the +3 new files minus 1 deleted hook)
- Browser smoke: confirmed by Max — cross-section sync works, period scaling works including custom fixed costs, autosave persists, console clean.

**Sub-agent fan-out execution log — 2 dispatches this step**
- **Fan-out #1 (sync logic in mojo_business):** mapped `handleFitoutFinancingUpdate` (L772–800), `handleDetailedBreakEvenUpdate` (L802–829), `handlePeriodChange` (L686–721) from `/tmp/mojo-pre-phase-c/src/App.tsx`. Returned exact field sets, loop-prevention via occupancyType-differs guard, asymmetric loanType sync. No 360-platform concept usage.
- **Fan-out #2 (viability destination wiring):** recommended sync inside `patchProjectData` (centralised — local state always synced; autosave dumb). Recommendation accepted.

**Commits + push**
- Step 10b code commit: `3024833 feat: cross-section sync + period scaling + mutation hooks (Step 10b)` — 4 files, 228 insertions, 5 deletions.
- Handover commit: pending push (this commit).

## In Progress

None — Step 10b complete. The HIGH-severity Step-9b carry-forward is resolved.

## Phase 2.5 / future-cleanup follow-ups

6 items total (severity-tagged). Reclassifications + new entries from 10b flagged with **(10b)**.

### Reclassified from previous handovers

- **(reclassified at NORMAL severity, was HIGH on Step 9b) Phase 2.5 wishlist — `occupancyType` cross-section feature:** when `financing.occupancyType === 'renting'`, show rent line in break-even fixed costs; when `'purchasing'`, show mortgage repayment line instead. **Never built in mojo_business** — this is forward feature work, not a port-fidelity bug. Was misclassified as the HIGH carry-forward; the ACTUAL HIGH carry-forward (cross-section sync of property fields) is resolved by `crossSectionSync.ts`.

### From Step 10b

- **(10b) Phase 2.5 / future-cleanup (LOW):** Opt into React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`). Cosmetic dev-console warnings only; not blocking. Adopt before the eventual v7 upgrade.

### From Step 10a

- Phase 2.5 / future-cleanup (LOW): Triple-nested EXISTS in `project_content_uploads`'s "Business members can view uploads of linked assessments" policy. Functionally correct; rewrite as a JOIN-style or a denormalised `business_id` on uploads when the Phase 2.5 archive UI starts hitting it.
- Phase 2.5: Both new indexes (`idx_business_scenarios_business_id`, `idx_business_scenarios_business_active`) currently appear in `unused_index` advisor. Resolves when Phase 2.5 archive UI ships.

### From Step 9b (still outstanding)

- **Phase 2.5:** Inline rename dialog (~30 LOC placeholder, name + town only). Anatomy §1.4 calls for full `<EditProjectSettingsDialog>` (name + locality + business type + Single/Multi mode toggle).
- **Phase 2.5:** Inline export dialog is PDF+Excel only. Anatomy §1.4 calls for 3-button full export + simple-export variants for guests + Save-before-export gate + Business-name-for-export gate.
- **Phase 2.5:** "New project" creation flow is a stub. Wire to `useCreateProject` mutation + redirect.
- **Future-cleanup (LOW):** `@/lib/export` index re-exports invisible to TS bundler module resolution. Deep imports used as workaround.

### From Step 9 (still outstanding)

- Phase 2.5 (anatomy §6.4): `StartPage`'s "Try as guest" routes to `/projects` (auth-gated). Guest-mode plumbing deferred.
- Phase 2.5 (anatomy §6.3): `InviteAcceptancePage` is a placeholder. Token acceptance logic is genuine TODO.
- Future-cleanup: `ProjectsListPage` uses `useEffect` + manual fetch instead of `useQuery`.
- Documented pattern: `InviteAcceptancePage`'s auth gate is internal (asymmetric vs other protected routes). Intentional per anatomy.

## Audit-pattern improvements (Step 10b learnings)

**Bake into future dispatches:**

> **When a "mutation" is purely a transform on already-loaded ProjectData, prefer local state + autosave over a dedicated React Query mutation hook.** Dedicated mutation hooks introduce a cache-vs-local-state staleness race when local state can be ahead of cache (e.g. autosave debouncing). Local-state-then-autosave avoids the race entirely. Caught in Step 10b's smoke; would have shipped silently broken otherwise.

This complements the Step 9b learning ("verify mutation hooks exist BEFORE chrome composition assumes them") — together they form the rule: **mutation hooks are for true server-state mutations, not for client-state transformations of already-loaded data.**

**Other learning carried forward:**
- Section 8 smoke is the falsifiable test of intent — it catches what types and unit tests can't (cache-staleness races, latent legacy gaps in customFixedCosts scaling).
- The "compare against legacy" check (dispatch §8b) is high-leverage — it surfaces port-fidelity gaps in the source repo that propagated forward.

## Blockers

None blocking Step 11.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 11 — Browser smoke (live).** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 11. Full end-to-end verification on the deployed Vercel preview URL (or temporary mojobusiness.ai cutover, depending on DNS plan).

Pre-conditions met:
- ✓ Step 10 migrations applied to live Supabase
- ✓ Vercel preview URL reachable
- ✓ Test user account exists in `auth.users`

This is verification only — no commit unless issues surface. If issues surface: fix and commit; loop until clean.

After Step 11:
- **Step 12 — Mojo 360 cleanup** (per plan §3 Step 12): in the *other* repo (`mojo_business`). Remove the V-ONLY surfaces. After this lands, viability lives entirely in this repo.

## Key References

**Repo state:**
- Bootstrap (Step 1): `2950ee6`
- CLAUDE.md handover patch: `213389e`
- Step 2 commit: `7c40fa9`
- Step 2 handover: `c634ff7`
- Step 3 commit: `ce4228a`
- Step 3 handover: `5e41404`
- Step 4 commit: `fdafc70`
- Step 4 handover: `6c1cd4f`
- Step 5 commit: `c9dbe5f`
- Step 5 handover: `b873d65`
- Step 6 commit: `6daaabc`
- Step 6 handover: `aca502c`
- Step 7 commit: `590ce47`
- Step 7 handover: `a395809`
- Step 8 commit: `5732982`
- Step 8 handover: `c943b24`
- Step 9 code commit: `d9b883f`
- Step 9 handover: `42707c4`
- TooltipProvider hotfix: `b229c74`
- Step 9b commit: `13bb476`
- Step 9b handover: `d6eb33c`
- Step 10a commit: `e11ef56`
- Step 10a handover: `2f63b42`
- **Step 10b commit: `3024833`** — cross-section sync + period scaling shipped
- Branch: `main`

**Step 10b metrics:**
- New files: 3 (`crossSectionSync.ts`, `scaleProjectByPeriod.ts`, `useUpdateProjectData.ts`)
- Deleted files: 1 (`useUpdateProjectPeriod.ts` — authored then removed during smoke)
- Modified files: 1 (`ProjectLayout.tsx` — chrome wiring + interactive period selector)
- Module count: 2,555 → 2,557 (+2 net; +3 from new files, −1 from deleted hook)
- Sub-agent fan-outs: 2 (sync logic mapping, destination wiring)
- Cascade theory: not exercised in 10b
- Smoke iterations: 2 (initial + customFixedCosts fix; re-smoke caught cache-staleness race → simpler architecture)
- New audit-pattern category: "transforms on loaded data should use local-state + autosave, not React Query mutations"

**Cumulative inventory misses (still 8 — Step 10b added zero):**

| # | File | Step surfaced | LOC |
|---:|---|---|---:|
| 1 | `src/lib/hoursVisualization/` | 2 | ~600 |
| 2 | `src/lib/contentUploads.ts` | 2 | 6.4KB |
| 3 | `src/lib/walkthrough.ts` | 4 | 354 |
| 4 | `src/lib/menuUtils.ts` | 4 | 486 |
| 5 | `src/lib/liquorLicences.ts` | 4 | 116 |
| 6 | `src/lib/naturalLanguageParser.ts` | 4 | 432 |
| 7 | `src/lib/calculations.ts` | 4 (second-pass) | 24 |
| 8 | `src/hooks/useAutoSave.ts` (consolidated to `src/features/project/hooks/useProjectAutoSave.ts` in Step 8) | 5 | 121 |

**Cumulative standard mechanical rewrites (still 7, still active — none exercised in 10b since this was new authoring, not porting).**

**Architectural strip log (deliberate adaptations away from Mojo 360 concepts):**
- Step 1: `<AuthProvider>` stripped of `is_super_user`, `is_advisor`, `signInWithProvider`, `OrgProvider`
- Step 6: `HospoOSModal` stripped of `useBusinessContext` dependency
- Step 9b: `ProjectLayout`'s `onReturnToHub` is a no-op
- Step 10a: dead super_admin policy + `is_project_owner_check` overloads dropped at DB layer
- (No new strips in 10b.)

**Cleanup tracker:**
- ✓ Step 7: 2 `@ts-expect-error` directives in AIBusinessPlanPage.tsx — REMOVED.
- (No new cleanup tracker entries from 10b.)

**Step 10b architectural decisions:**
- Cross-section sync lives inside `patchProjectData` (centralised) so local state is always sync-coherent. Autosave reads coherent state and persists it — no autosave changes needed.
- Period scaling is a synchronous local-state transform, NOT a React Query mutation. Avoids the cache-vs-local-state race that would otherwise discard user's pending edits.
- `useUpdateProjectData` retained as a generic mutation hook — useful for explicit "persist now" calls that bypass autosave debounce. Currently no consumer; logged as available infrastructure for future steps.
- `customFixedCosts.value` scaling closed — legacy mojo_business gap that would have shipped to viability.

**Source clones in /tmp:**
- `/tmp/mojo-business-current/` — `src/App.tsx` deleted in Phase C-light; remaining tree usable for component reads.
- `/tmp/mojo-pre-phase-c/` — full pre-deletion clone, used for `App.tsx` references throughout extraction.

**Auth surface (unchanged):**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }`
- Supabase client localStorage namespace: `mojo-viability-auth`

**Hooks at `src/features/project/hooks/` (now 7 — net +1 from 9b's 6):**
- `useProject.ts` (query)
- `useProjectAutoSave.ts` (autosave)
- `useKeyboardShortcuts.ts`
- `useProjectPermissions.ts` (Step 9b)
- `useRenameProject.ts` (Step 9b)
- `useSaveProject.ts` (Step 9b)
- **`useUpdateProjectData.ts` (Step 10b)** — generic update mutation, runs cross-section sync. No consumer yet; available for explicit-persist use cases.

**Pure functions added in 10b:**
- `applyCrossSectionSync(prev, updates)` in `src/lib/calculations/crossSectionSync.ts`
- `scaleProjectByPeriod(prev, newPeriod)` in `src/lib/scaleProjectByPeriod.ts`

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan (**Step 11 = next; verification-only**)
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY inventory
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md)
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md)
