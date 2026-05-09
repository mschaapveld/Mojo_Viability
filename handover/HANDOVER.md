# Mojo Viability Handover — 2026-05-09 (Step 6)

## Session Summary

Step 6 of the 12-step extraction plan: **8 new files** (6 pages + 2 top-level components) ported from the `pre-phase-c-deletion` git tag. **Typecheck + build remain GREEN** throughout — Vercel stays green on this push. Two HARD STOPs adjudicated by strategic-advisor: a 7th mechanical rewrite category surfaced (`@/features/<feature>/components/<NAME>` → `@/components/<NAME>` when destination is top-level), and an architectural strip on HospoOSModal (Option B — removed `useBusinessContext` dependency rather than port the Mojo 360 platform-membership chain). Cumulative inventory misses remain at 8 — Option B avoided adding the platform-membership chain. The 2 `@ts-expect-error` directives in AIBusinessPlanPage stay in place until Step 7 ships the export pipeline.

## Completed

**Landing + onboarding + legal (8 files)**
- 6 pages at [src/pages/](src/pages/): `LandingPage` (renamed from `LandingPage1`), `HowItWorksPage`, `ReachOutPage`, `StartPage` (renamed from `ViabilityPath`), `PrivacyPage`, `TermsPage`
- 2 top-level components at [src/components/](src/components/): `LandingHeader.tsx`, `HospoOSModal.tsx`

**File + identifier renames**
- `LandingPage1.tsx` → `LandingPage.tsx`; identifier `LandingPage1`/`LandingPage1Props` → `LandingPage`/`LandingPageProps` (2 occurrences renamed via `replace_all`)
- `ViabilityPath.tsx` → `StartPage.tsx`; identifier `ViabilityPath`/`ViabilityPathProps` → `StartPage`/`StartPageProps` (2 occurrences renamed)

**HospoOSBanner conditional decision: DROPPED**
0 importers in the 8 ported files. Per dispatch.

**Source-path corrections (logged for archaeology)**
- `LandingHeader.tsx` was at `/tmp/mojo-pre-phase-c/src/features/landing/components/`, not the dispatch-spec'd `src/components/landing/`. Content verified identical.
- `ViabilityPath.tsx` was at `/tmp/mojo-pre-phase-c/src/features/viability/components/`, not the dispatch-spec'd `src/components/onboarding/`. Content verified identical.
- Same archaeological pattern as Step 5's GuestBanner discovery — the tag had partial `features/<feature>/` reorganisation underway. Step 7+ should continue cross-referencing both standard `/components/<X>/` AND `/features/<feature>/components/` locations.

**Six standard mechanical rewrites applied + one new (7th) surfaced**
1. `@/shared/components/ui/X` → `@/components/ui/X` (shadcn path shift)
2. `../../lib/X` and `../lib/X` → `@/lib/X` (relative-to-absolute lib)
3. `@/components/<NAME>` → `@/features/project/components/<NAME>` (forward-pointers to ported components)
4. `@/app/providers/X` → `@/providers/X` (provider path shift)
5. `../hooks/X` and `../../hooks/X` → `@/hooks/X` (relative-to-absolute hooks)
6. `@/lib/projects` / `@/lib/permissions` → `@/features/project/api/<projectsApi|permissionsApi>` (Step 3 renames)
7. **NEW — `@/features/<feature>/components/<NAME>` → `@/components/<NAME>`** when destination is top-level (Issue 1 of Step 6's pre-emptive audit). Applied to `@/features/landing/components/LandingHeader` × 3 page files.

**Architectural strip — HospoOSModal Option B**
HospoOSModal at the tag imported `useBusinessContext` (108 LOC) which transitively pulled `useActiveBusinessId` + `usePlatformRole` + `business_memberships` table reads + impersonation support — the full Mojo 360 platform-membership stack. This contradicts viability's owner-only auth model (Q1-Q7 Q3 + anatomy §2.3 + Step 1's AuthProvider strip).

Surgical strip applied per strategic-advisor adjudication:
- Removed `import { useBusinessContext } from '@/hooks/useBusinessContext';`
- Replaced `const { businessId, businessName } = useBusinessContext();` with `const businessId: string | null = null; const businessName: string | null = null;` plus an explanatory comment
- Form pre-fill paths (`if (businessName) setBizName(businessName)`, `business_id: businessId ?? null`) all already null-tolerant — fall through to non-prefilled state for viability users
- Modal's external API unchanged; future Mojo 360 use could re-introduce the hook there or pass values as props

This is the second deliberate Mojo-360-strip (after Step 1's AuthProvider). **Pattern: "strip the consumer, don't carry the chain."** Step 7+ executor should look for similar consumer-strip opportunities when ported files reach for hooks like `useBusinessContext`, `useActiveBusinessId`, `usePlatformRole`.

**Verification**
- `npm run typecheck`: **GREEN** (exit 0, zero errors)
- `npm run build`: **GREEN** (141 modules, 440 KB JS / 59 KB CSS, 957 ms)

**Commits + push**
- Step 6 commit: `6daaabc feat: import landing pages and onboarding (Step 6 of viability extraction)` — pushed to `origin/main` (`b873d65..6daaabc`)
- 8 files changed, 2,441 insertions
- **Vercel stays GREEN** — production transitions to Step 6

## In Progress

None — Step 6 complete.

## Blockers

None blocking Step 7.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 7 — Export pipeline.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 7. Estimated 2–3h.

The export pipeline lives at `src/lib/export/` in mojo_business. Per [`extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) §2.1, the export surface partially survived Phase C-light (some files in current main, others at the tag). Step 7's dispatch should determine source-path mix:
- Verify whether `/tmp/mojo-business-current/src/lib/export/` has the relevant files, OR fall back to `/tmp/mojo-pre-phase-c/src/lib/export/` for missing ones
- `html2canvas` dependency is already in `package.json` from Step 1's curated deps (per [`pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) §4) — confirm at start

**Step 7 acceptance:**
1. Typecheck + build remain GREEN
2. **The 2 `@ts-expect-error` directives in [src/features/project/pages/AIBusinessPlanPage.tsx](src/features/project/pages/AIBusinessPlanPage.tsx) lines 174, 187 must be removed once `@/lib/export/exportBusinessPlan` resolves**. TypeScript will error on them if not removed (self-prompting cleanup).

**Cumulative standard mechanical rewrites for Step 7+ dispatches (bake-in pre-emptively):**
1. `@/shared/components/ui/X` → `@/components/ui/X` (shadcn path shift)
2. `../../lib/X` and `../lib/X` → `@/lib/X` (relative-to-absolute lib)
3. `@/components/<NAME>` → `@/features/project/components/<NAME>` (forward-pointers to Step-4/5 ported components — list grows each step)
4. `@/app/providers/X` → `@/providers/X` (provider path shift)
5. `../hooks/X` and `../../hooks/X` → `@/hooks/X`
6. `@/lib/projects` / `@/lib/permissions` → `@/features/project/api/<projectsApi|permissionsApi>` (Step 3 renames)
7. **`@/features/<feature>/components/<NAME>` → `@/components/<NAME>`** when destination is top-level (NEW from Step 6)

**Pre-emptive audit pattern (continues from Step 5/6):**
Before running typecheck, audit `@/lib/*`, `@/hooks/*`, `@/features/*`, `@/components/*`, `@/providers/*` imports. For each unique path, confirm the target file exists in our repo. If not, check the tag — if it exists at the tag, that's an inventory miss to surface for adjudication.

**Mojo-360-strip pattern alert for Step 7+:**
If ported files import `useBusinessContext`, `useActiveBusinessId`, `usePlatformRole`, `useOrgContext`, `useAdvisorContext`, `useImpersonation`, `OrgProvider`, or similar platform-membership concepts, surface for adjudication. Default playbook: "strip the consumer, don't carry the chain" (analogous to Step 6's HospoOSModal strip + Step 1's AuthProvider strip).

**Caveats for Step 7:**
- Source-path defensiveness: cross-reference both `/components/<X>/` AND `/features/<feature>/components/` locations at the tag.
- The export pipeline includes Excel + PDF + Business Plan HTML generation; check for `exceljs` (already in package.json via menuUtils Step 4 inventory miss) and `html2canvas` (already in package.json from Step 1) — likely uses both.
- Step 7 needs its own structured dispatch from Max's Claude.ai strategic-advisor session.

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
- **Step 6 commit: `6daaabc` — Vercel green, production updates to Step 6**
- Branch: `main`

**Cumulative inventory misses (still 8 — Option B avoided adding platform-membership chain):**

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
- Step 1: `<AuthProvider>` stripped of `is_super_user`, `is_advisor`, `signInWithProvider`, `OrgProvider` (per anatomy §2.3 + Q3)
- Step 6: `HospoOSModal` stripped of `useBusinessContext` dependency (Option B — hardcoded null businessId/businessName + explanatory comment)

**Step 7 cleanup tracker:**
- 2 `@ts-expect-error` directives in [AIBusinessPlanPage.tsx](src/features/project/pages/AIBusinessPlanPage.tsx) lines 174, 187 — REMOVE when Step 7 ships `src/lib/export/exportBusinessPlan.ts`. TypeScript will error on the directives if not removed.

**Cascade theory: not exercised this step (typecheck stayed green throughout — Step 6 didn't introduce expected red).** Theory remains confirmed for Steps 3, 4, 5.

**Source clones in /tmp:**
- `/tmp/mojo-business-current/` — current main, used Steps 2–3 + likely Step 7 (export pipeline)
- `/tmp/mojo-pre-phase-c/` — `pre-phase-c-deletion` tag at commit `2fc45f7`, used Steps 4–6 + likely Step 7

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
