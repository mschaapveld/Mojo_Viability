# Mojo Viability Extraction — Pre-Extraction Punch List

**Date:** 2026-04-29
**Purpose:** Capture the small cleanups that should happen BEFORE Phase 2 starts so the extraction begins from a known-good baseline. Doc only — no actual cleanups happen this session, no code or DB changes. The future Phase 2 session (or a dedicated pre-Phase-2 mini-session) executes these.
**Companion docs:** [`inventory.md`](./inventory.md), [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md), [`app-tsx-anatomy.md`](./app-tsx-anatomy.md).
**Read-only:** no `src/` modifications, no DB writes, rebuild orchestrator unimpeded.

---

## 0. Executive summary

Re-verifying the inventory's "orphan" claims surfaced **two false positives** and **one inventory error**:

| Inventory claim | Verified result |
|---|---|
| `lib/calculations/dataSourceSelector.ts` orphan | **NOT an orphan** — sibling-imported by `lib/calculations/projectSummary.ts:5` (`from "./dataSourceSelector"`) |
| `lib/calculations/orderSourceFees.ts` orphan | **NOT an orphan** — sibling-imported by `lib/calculations/projectSummary.ts:4` (`from "./orderSourceFees"`) |
| `lib/export.ts` orphan | **NOT an orphan** — dynamically imported by `src/App.tsx` 4× via `await import('@/lib/export')` (lines 914, 927, 942, 946) |

Cause: the Phase 1 inventory grep used module-path patterns (`from "@/lib/..."`, `from "../..."`) and missed:
- Sibling imports (`from "./dataSourceSelector"`)
- Dynamic imports (`await import('@/lib/export')`)

Net effect on extraction: **nothing breaks** — these files still travel to viability per inventory's recommendation. But the "orphan, drop before extraction" plan goes from 7 files to 4.

Other findings:
- **`html2canvas`** is installed transitively via `jspdf@3.0.3 → html2canvas@1.4.1`. Resolves today, but fragile — explicit dependency recommended.
- **Dead RLS branch on `business_scenarios`** confirmed: `platform_roles` has 0 rows with `role = 'super_admin'`; the policy is a no-op. Safe to replace with `is_super_user()`.
- **Both `is_project_owner_check` RPCs** are unused at the DB layer today (no current `pg_policies` row references either function). Both are safe to drop during the migration that moves viability tables to the new repo.
- **Only one filename collision** with the rebuild surface (`LoadingScreen`), and it's not a real clash post-extraction since the two files live in separate repos.

---

## 1. Orphan files

Re-verified via fresh grep with broader patterns (sibling imports, dynamic imports, type-only imports). Updated table:

| File | LOC | Original inventory claim | Verified status | Pre-extraction action |
|---|---:|---|---|---|
| `src/components/landing/LandingPage.tsx` | 833 | orphan | **CONFIRMED orphan** — 0 importers anywhere in `src/`. (Note: `src/components/LandingPage.tsx` (root) is the active one used by App.tsx; the `landing/` subfolder version is duplicate dead code.) | **delete-before-extraction** |
| `src/components/landing/LandingPage2.tsx` | 583 | orphan | **CONFIRMED orphan** — 0 importers. | **delete-before-extraction** |
| `src/lib/export.ts` | 555 | orphan | **NOT an orphan** — dynamically imported by `App.tsx` lines 914/927/942/946 via `await import('@/lib/export')`. Vite resolves `@/lib/export` to `src/lib/export.ts` (file), distinct from `src/lib/export/index.ts` (directory barrel). The two files coexist intentionally: `lib/export.ts` exposes simple-export functions (`exportSimpleBreakEvenToPDF`, `exportSimpleBreakEvenToExcel`), `lib/export/index.ts` exposes the comprehensive-export pipeline. | **keep — travels to new repo as-is.** Phase 2 may want to consolidate the two export pipelines but that's a clean-up not a pre-extraction action. |
| `src/lib/calculations/eventUplift.ts` | 30 | orphan | **CONFIRMED orphan** — 0 importers anywhere. | **delete-before-extraction** OR **keep-as-spec** (the file may be a stub for unimplemented event-uplift modelling — Phase 2 can defer the call). Recommendation: delete. The code is small enough that re-implementation later is cheap if needed. |
| `src/lib/calculations/dataSourceSelector.ts` | 137 | orphan | **NOT an orphan** — `projectSummary.ts:5` imports `selectDataSource, DataSource` from `./dataSourceSelector`. Sibling import escaped Phase 1 inventory's grep pattern. | **keep — travels to new repo as a `projectSummary` dependency.** |
| `src/lib/calculations/orderSourceFees.ts` | 60 | orphan | **NOT an orphan** — `projectSummary.ts:4` imports `calculateAggregatorFees, AggregatorFees` from `./orderSourceFees`. Sibling import. | **keep — travels.** |
| `src/components/modules/ChangelogView.tsx` | 24 | orphan | **CONFIRMED orphan** — 0 importers. The file is a stub (24 LOC). | **delete-before-extraction** |

**Net pre-extraction deletes: 4 files (~1,470 LOC)** — `landing/LandingPage.tsx`, `landing/LandingPage2.tsx`, `calculations/eventUplift.ts`, `modules/ChangelogView.tsx`.

**Pre-extraction action sequence:**
1. Delete the 4 confirmed orphans in mojo_business
2. Run `npm run typecheck` — confirm no break
3. Run `npm run build` — confirm no break
4. Commit as a single "chore: drop pre-extraction orphans" commit
5. Phase 2 extraction proceeds from this baseline

---

## 2. Dead RLS branch on `business_scenarios`

### 2.1 — Verified state

Live DB query (read-only):
```sql
SELECT COUNT(*) FROM platform_roles WHERE role = 'super_admin';
-- Result: 0
```

The `business_scenarios` SELECT policy "Super users can read all business scenarios" reads:
```sql
((user_id = auth.uid()) OR (EXISTS (
  SELECT 1 FROM platform_roles
  WHERE platform_roles.user_id = auth.uid()
    AND platform_roles.role = 'super_admin'
)))
```

The `OR` branch is a permanent dead path — `platform_roles.role` enum values are `super_user` / `mojo_team` / `standard` per [`USER_MODEL_INVENTORY.md`](../USER_MODEL_INVENTORY.md). No row ever matches `super_admin`.

### 2.2 — Recommended replacement

Drop the policy and replace with one using `is_super_user()` (the canonical RPC used everywhere else in the codebase):

```sql
DROP POLICY "Super users can read all business scenarios" ON business_scenarios;

CREATE POLICY "Users can view projects they collaborate on or super-users can view all"
  ON business_scenarios
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.project_id = business_scenarios.id
        AND collaborators.user_id = (SELECT auth.uid())
    )
    OR is_super_user()
  );
```

Or, if Q3's "single Mojo Suite admin backend in 360" decision lands cleanly, drop the super-user branch entirely — 360's MojoAdminPanel uses the service-role key for cross-tenant reads, not RLS-bypass at the auth-user level. Spec to be settled at Phase 2 implementation time; recommend defaulting to the `is_super_user()` replacement (preserves admin-read for emergencies).

### 2.3 — Action

**Phase 2 (during the migration that transfers viability tables to the new repo):** include the policy replacement as part of the migration. NOT a pre-extraction action — leaving the dead branch in place during the extraction transition is harmless and avoids touching RLS while the rebuild orchestrator is active.

---

## 3. Duplicate `is_project_owner_check` RPC

### 3.1 — Verified state

Two functions exist in DB with the same name, different signatures and very different bodies:

**`is_project_owner_check(project_uuid uuid) RETURNS boolean`** (plpgsql, SECURITY DEFINER):
```sql
RETURN EXISTS (
  SELECT 1 FROM business_scenarios
  WHERE id = project_uuid AND user_id = auth.uid()
);
```
Created by migrations `20260102093434_consolidate_rls_policies.sql` and `20260102092803_fix_security_and_performance_issues.sql`. Checks original-owner status via `business_scenarios.user_id`.

**`is_project_owner_check(p_project_id uuid, p_user_id uuid) RETURNS boolean`** (sql, SECURITY DEFINER):
```sql
SELECT EXISTS (
  SELECT 1 FROM collaborators
  WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND role = 'owner'
);
```
Created by `20260102074748_fix_collaborators_rls_recursion.sql`. Checks owner status via `collaborators.role = 'owner'` relationship.

### 3.2 — Usage check

**No current RLS policies reference either function.** Live `pg_policies` query for `qual::text LIKE '%is_project_owner_check%'` returned zero rows. The migrations that created them also created policies that called them, but later migrations refactored the policies to use inline subqueries instead (e.g. `EXISTS (SELECT 1 FROM business_scenarios WHERE business_scenarios.id = collaborators.project_id AND business_scenarios.user_id = auth.uid())` — visible in `pg_policies` for `collaborators` today).

**No `src/` code references either function** (grep confirmed — only matches are in `supabase/migrations/`).

### 3.3 — Action

**Phase 2 (during the migration that transfers viability tables):** drop both functions in the same migration:

```sql
DROP FUNCTION IF EXISTS is_project_owner_check(uuid);
DROP FUNCTION IF EXISTS is_project_owner_check(uuid, uuid);
```

The new repo's migration baseline starts without them. If the new repo's RLS designer decides they want a similar helper, they author one cleanly (likely under a different name to avoid the legacy confusion).

NOT a pre-extraction action. Bundling with the extraction migration keeps the cleanup in one place.

---

## 4. `html2canvas` resolution

### 4.1 — Verified state

```
$ ls node_modules/html2canvas/package.json     ← exists, v1.4.1
$ npm ls html2canvas
└─ jspdf@3.0.3
   └─ html2canvas@1.4.1
```

`html2canvas` is installed **transitively** via `jspdf`'s declared dependency. It is **not** listed in `mojo_business/package.json`'s `dependencies` block, but works today because jspdf installs it.

Code usage: `src/lib/export/exportBusinessPlan.ts:5` imports `html2canvas` directly (default import) and uses it on lines 79 and 111 to convert HTML sections to canvas snapshots for PDF business plan rendering.

### 4.2 — Risk

**Fragile.** If jspdf releases a future version that drops `html2canvas` from its dependencies (or makes it `peerDependencies`/`optionalDependencies`), the import breaks silently — the build still passes, but `await html2canvas(...)` throws at runtime when the user tries to export a business plan PDF.

This is exactly the kind of issue that surfaces only when a customer reports "PDF export is broken" weeks after a routine `npm install`.

### 4.3 — Action

**Pre-extraction (recommended) OR Phase 2 (acceptable):** add `html2canvas` to the new repo's `package.json` as an explicit dependency from the start.

```json
"html2canvas": "^1.4.1"
```

In mojo_business, the same fix is technically not pre-extraction work — but since the new repo will install `html2canvas` explicitly, mojo_business's transitive resolution is unchanged. Once viability extracts and `lib/export/exportBusinessPlan.ts` leaves mojo_business, the transitive `html2canvas` becomes truly orphaned in mojo_business and `npm prune` removes it. No action needed in mojo_business beyond letting `npm install` re-evaluate after extraction.

**Verification step at Phase 2 hour zero:** `cd new-repo && npm install && npm run build` — confirm `html2canvas` resolves and `lib/export/exportBusinessPlan.ts` builds clean.

---

## 5. `showNamePrompt` unweave (informational)

[Anatomy doc §1.4](./app-tsx-anatomy.md) flagged the 150-LOC welcome dialog (`App.tsx` lines 2230–2379) as a structural call. This section captures the "what stays / what drops" decision so the future Phase 2 session doesn't have to re-derive it.

### 5.1 — Fields by user-type branch (legacy)

| User type branch | Fields collected today | Profile column writes |
|---|---|---|
| **Business Owner** | first_name, last_name, organisation_name, phone, town, venue_type, business_intent, timeline | `first_name`, `last_name`, `user_type='Business Owner'`, `phone`, `town`, `organisation_name`, `venue_type`, `business_intent`, `timeline` |
| **Business Advisor** | first_name, last_name, organisation_name (firm), phone, town | `first_name`, `last_name`, `user_type='Business Advisor'`, `phone`, `town`, `organisation_name`, `is_advisor=true` |
| **Team Member** | first_name, last_name, phone, town, signupJoinCode | `first_name`, `last_name`, `user_type='Business Team Member'`, `phone`, `town`, `pending_join_code` |

### 5.2 — Viability-standalone simplification

Per Q3 (single Mojo Suite admin backend, owned in 360) and the architectural fact that viability is owner-only, the new repo has only one user type:

| Viability `<WelcomePage>` fields | Profile column writes |
|---|---|
| first_name, last_name, venue_type, town, timeline | `first_name`, `last_name`, `user_type='Business Owner'` (literal default), `venue_type`, `town`, `timeline` |

**Drops entirely:**
- `userType` selector (no advisor or team member option)
- `organisation_name` field (a viability scenario name covers this; advisors who use viability don't have a "firm name" concept)
- `phone` field (not used by viability lead flow)
- `business_intent` field (every viability user has the same intent: "evaluate a venue")
- `is_advisor=true` write (no advisor flag in viability — all users are scenarios-owners)
- `pending_join_code` write + `resolveJoinCode()` call (no team-member path in viability)

**Net LOC:** ~150 → ~50.

### 5.3 — Trigger condition

In legacy, `showNamePrompt` fires when `profile.first_name`, `profile.last_name`, OR `profile.user_type` is missing on sign-in. In viability standalone:

- Trigger: `profile.first_name IS NULL OR profile.last_name IS NULL` (drop user_type check — defaulted)
- New route: `/welcome` (a regular route, not a dialog)
- Guard: `<RequireWelcomeComplete>` wrapper that redirects to `/welcome` when name is missing

### 5.4 — Action

**Not pre-extraction work.** Phase 2 implementation owns this. Captured here so the implementer doesn't blindly port the legacy 3-branch dialog.

---

## 6. Renames required during extraction

### 6.1 — Filename collision check

Searched all 51 V-ONLY files (per inventory §1) against the rebuild's `src/features/`, `src/shared/`, `src/app/`, `src/pages/` directories. **One match found, and it's not a real clash:**

| Viability file | Rebuild file at same name | Real clash? | Action |
|---|---|---|---|
| `src/components/LoadingScreen.tsx` | `src/shared/components/ui/LoadingScreen.tsx` | **No** — they live in separate repos post-extraction. The two `LoadingScreen.tsx` files exist concurrently in mojo_business today (legacy + rebuild) but the legacy one moves to viability repo and the rebuild keeps its own. No rename needed. | none |

### 6.2 — Conceptual / clarity renames

These have no filesystem clash but benefit from renaming during extraction for code clarity:

| Viability file | Recommended new name | Reason |
|---|---|---|
| `src/components/modules/MenuBuilder.tsx` | `ViabilityMenuBuilder.tsx` (or `MenuModellingTab.tsx`) | Distinct from 360's [`features/menu/`](../../src/features/menu/) which is the production menu management feature. Same colloquial name, two different products. Rename clarifies that this is the **viability menu-driven sales modelling tab**, not the menu management feature. (Inventory §1.1 already flagged this.) |
| `src/components/modules/SimpleBreakEven.tsx` | (keep) | Will live at `src/features/break-even/SimpleBreakEvenPage.tsx` — folder structure disambiguates. |
| `src/components/modules/DetailedBreakEven.tsx` | (keep) | Same — folder structure disambiguates. |
| `src/components/AdminPanel.tsx` | n/a — does NOT ship to viability per Q3 | n/a |

### 6.3 — Folder restructure during extraction

The rebuild's `src/features/{feature}/{api,components,hooks,pages,routes.tsx}` structure is the target for the new repo too. So during extraction, viability files don't just move — they go from a flat `components/modules/*.tsx` layout into a structured one:

```
src/features/project/
  components/
    BusinessSnapshot.tsx
    ProjectSideNav.tsx           (was layout/Sidebar.tsx)
    EditProjectSettingsDialog.tsx (was the inline showRenameDialog)
    GuestBanner.tsx              (was components/onboarding/GuestBanner.tsx)
    ContentUploadsPanel.tsx
    ...
  hooks/
    useProject.ts                (new — wraps useQuery for business_scenarios)
    useProjectAutoSave.ts        (was hooks/useAutoSave.ts)
    useUpdateProjectData.ts      (new — wraps mutation + cross-section sync)
    useExportProject.ts          (new — wraps the export decision tree)
  pages/
    SimpleBreakEvenPage.tsx      (was components/modules/SimpleBreakEven.tsx)
    DetailedBreakEvenPage.tsx
    FitoutFinancingPage.tsx
    HoursOfOperationPage.tsx
    SalesBreakupPage.tsx
    ViabilityMenuBuilderPage.tsx (was MenuBuilder.tsx, renamed)
    LabourCostingPage.tsx
    LocationSuitabilityPage.tsx
    SalesPredictionsPage.tsx
    BusinessPlanningPage.tsx
    AIBusinessPlanPage.tsx       (was AIBusinessPlanBuilder.tsx)
    BusinessPlanBuilderPage.tsx
  api/
    projectsApi.ts               (was lib/projects.ts — wraps Supabase calls)
    contentUploadsApi.ts         (was lib/contentUploads.ts)
    shareApi.ts                  (new — handles project_invites)
  routes.tsx
  ProjectLayout.tsx              (new — extracted from App.tsx fallback)
```

### 6.4 — Action

**Not pre-extraction work.** All renames happen at Phase 2 file-move time. Captured here so the Phase 2 implementer has the target shape upfront.

---

## 7. Stop conditions

If any of the following surfaces during pre-extraction work, halt extraction until investigated.

### 7.1 — An "orphan" turns out to have an importer

If during the actual delete of one of the 4 confirmed orphans, `npm run build` or `npm run typecheck` fails with "Module not found" or "Cannot find name X", the file isn't actually orphaned. STOP, restore the file, and add it to the "verify" column of the table in §1.

Likely culprits if this happens: dynamic imports we missed (similar to the `lib/export.ts` case), or test files / story files that aren't in the `src/` grep scope.

### 7.2 — `html2canvas` doesn't resolve in the new repo

If after `npm install` in the new repo, `lib/export/exportBusinessPlan.ts` fails to build with `Cannot find module 'html2canvas'`, **don't** rely on `npm install jspdf` to bring it transitively — different Node/npm versions resolve transitive deps differently. Add `html2canvas` to the new repo's `package.json` as an explicit dependency (recommended in §4.3 anyway).

### 7.3 — A migration drop leaves a broken policy

If during the extraction migration that drops `is_project_owner_check`, a downstream CI check or smoke test reveals a policy somewhere uses it that we missed (the live `pg_policies` query was a snapshot — if a new policy lands between today and Phase 2 that references the function, the drop breaks it), STOP. Rerun the `pg_policies` LIKE search at Phase 2 hour zero. If still 0 references, proceed. If references exist, fix the policies first (or skip the function drop and leave them in place).

### 7.4 — `business_scenarios.business_id` column add conflicts with an active migration

Per Q2, Phase 2 adds a nullable `business_id` column. If the live DB schema differs from migration history (drift surfaces during the schema-add), **don't** force-add. Investigate whether the column already exists with a different type, and reconcile before proceeding.

### 7.5 — Rebuild orchestrator activity in `src/`

Pre-extraction work and Phase 2 should not run while the foundation rebuild orchestrator is actively modifying `src/`. Confirm the rebuild has merged to main before pre-extraction action begins. If a rebuild branch is open, hold pre-extraction work — even read-only verification can mislead the planner if files are in flux.

---

## 8. Summary — pre-extraction action checklist

Of the 6 topics covered, only 2 are actual pre-extraction actions. The rest bundle into Phase 2 itself:

| # | Topic | Pre-extraction action? | Notes |
|---|---|---|---|
| 1 | Orphan files | **YES** — 4 deletes | Run typecheck + build, single commit. |
| 2 | Dead RLS branch | NO — Phase 2 migration | Bundle with viability table migration. |
| 3 | Duplicate RPCs | NO — Phase 2 migration | Bundle with viability table migration. |
| 4 | `html2canvas` | **YES** — verify-then-add | Add to new repo's `package.json` from day 1. |
| 5 | `showNamePrompt` unweave | NO — Phase 2 implementation | Informational only. |
| 6 | Renames required | NO — Phase 2 file-move | Informational only. |

**Pre-extraction time estimate: ~45 minutes.** Delete 4 files, verify `html2canvas` install plan, commit, hand off to Phase 2.

---

## Appendix — Phase 1 inventory corrections

For traceability, the inventory items that turned out to be wrong:

| Inventory location | Claim | Correction |
|---|---|---|
| `inventory.md` §1.2 row "dataSourceSelector" | "0 importers" | Actually 1 importer: `projectSummary.ts` (sibling import) |
| `inventory.md` §1.2 row "orderSourceFees" | "0 importers" | Actually 1 importer: `projectSummary.ts` (sibling import) |
| `inventory.md` §1.4 row "lib/export.ts" | "0 importers in src/, possibly superseded by lib/export/" | Actually 4 dynamic imports in `App.tsx`. Co-exists with `lib/export/` intentionally — different export pipelines. |

These corrections do not change the **extraction outcome** — all three files travel to viability either way (they were going to ship, just with different motivations). They do change the **pre-extraction delete count** from 7 files to 4.

The Phase 1 inventory grep used module-path patterns and missed sibling and dynamic imports. For future inventory work, add these patterns:

```
# Sibling imports (within the same directory)
grep "from ['\"]\./<basename>"

# Dynamic imports
grep "import\(['\"][^'\"]*<basename>['\"]"
```

---

## Stand-down

Punch list captured. No code or DB changes performed. The future Phase 2 session has 2 pre-extraction actions to run and 4 informational items to apply during extraction itself.
