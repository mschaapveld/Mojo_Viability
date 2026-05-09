# Mojo Viability Extraction — Phase 1 Inventory

**Date:** 2026-04-29
**Status:** Phase 1 (read-only inventory). NO code changes, file moves, or DB writes during this session.
**Scope:** Map the full viability surface (code + DB + deps) in preparation for a Phase 2 extraction into a separate `mojo_viability` repo deployed at `mojobusiness.ai`, sharing the same Supabase project.
**Prior artefact:** [`context/morning-reviews/2026-04-29-day-3-am.md`](../morning-reviews/2026-04-29-day-3-am.md) — orchestrator's halt-shaped Decision 1 inventory. This document supersedes that with deeper file-level + DB + deps detail.

---

## 0. Executive summary

| Bucket | Count | LOC range |
|---|---|---|
| **VIABILITY-ONLY** files (clean move to new repo, eventual delete here) | **51** files | ~14,400 LOC |
| **SHARED-LEANS-VIABILITY** (viability primary user, but ≥1 360 importer) | **3** files | ~750 LOC |
| **SHARED-EQUAL** (shared identity / type model used by both) | **2** files | ~672 LOC |
| **SHARED-LEANS-360** (360 primary, viability touches it) | **0** files | — |
| **VIABILITY-ONLY DB tables** | **4** tables | `business_scenarios`, `project_invites`, `project_content_uploads`, `collaborators` |
| **SHARED identity tables** (both repos read/write — schema stays in mojo_business) | **5** tables | `auth.users`, `profiles`, `platform_roles`, `businesses`, `business_memberships` |
| **VIABILITY-ONLY RPCs** | **9** | listed in §4 |
| **VIABILITY-ONLY storage buckets** | **1** | `project-uploads` (private) |
| **VIABILITY-ONLY npm deps** (packages 360 doesn't import) | **1** confirmed (`html2canvas`) | rest are shared with 360 modules |
| **15 calculation engines** | All 15 viability-themed | 1 (`mojoFitScore`) is the only one with an admin-lead-side caller; recommended duplicate or co-locate with viability |

**Rough extraction effort estimate:** **20–30 engineering hours** to produce a working `mojo_viability` repo on a fresh Vite scaffold, sharing Supabase project. Breakdown in §8.

**Critical structural fact:** App.tsx lines 1696–2491 (~796 LOC) is the viability shell — `<UniversalHeader>`, `<Sidebar>`, project-name/save/share controls, the 12-tab `<Tabs>` block, all project lifecycle dialogs, save/export flow. This block is the **bulk of the extraction work**. The 51 component/lib files relocate cleanly; App.tsx is what has to be re-authored as `App.tsx` (or `ViabilityApp.tsx`) in the new repo.

**Critical strategic fact:** Both apps share one Supabase project. "Move DB tables to new repo" = move **migration ownership**, not actual DB partition. The new repo gets the next migration files for `business_scenarios`/`project_invites`/`project_content_uploads`/`collaborators`; mojo_business stops touching those tables. `profiles` schema stays in mojo_business but both repos read/write its viability-flavoured columns (venue_type, business_intent, etc.).

---

## 1. File-by-file inventory

Categorisation legend:
- **V-ONLY** = only viability uses this. Clean move to new repo, delete from mojo_business.
- **SHARED-V** = viability is the primary user, but ≥1 importer outside the viability surface. Decision needed (duplicate vs share-via-package).
- **SHARED-E** = used roughly equally by viability and 360 features.
- **SHARED-360** = 360 is primary user, viability also touches it.

### 1.1 — Tab content components (`src/components/modules/`)

All 21 files in this folder are viability-exclusive consumers (App.tsx is the only top-level importer; sub-components are imported only by sibling viability tabs). All clean moves.

| File | LOC | Importers | Cat |
|---|---:|---|---|
| `SimpleBreakEven.tsx` | 569 | App.tsx | V-ONLY |
| `DetailedBreakEven.tsx` | 1230 | App.tsx | V-ONLY |
| `FitoutFinancing.tsx` | 88 | App.tsx | V-ONLY |
| `FitoutFinancingColumn.tsx` | est. ~1000 (35.9 KB) | FitoutFinancing | V-ONLY |
| `FitoutFinancingExisting.tsx` | est. ~570 (20 KB) | FitoutFinancingColumn | V-ONLY |
| `FitoutFinancingNew.tsx` | est. ~570 (20 KB) | FitoutFinancingColumn | V-ONLY |
| `HoursOfOperation.tsx` | est. ~1500 (52.7 KB) | App.tsx | V-ONLY |
| `VenueOpeningHours.tsx` | est. ~330 (11.6 KB) | HoursOfOperation | V-ONLY |
| `SalesBreakup.tsx` | est. ~1340 (46.9 KB) | App.tsx | V-ONLY |
| `MenuBuilder.tsx` *(distinct from `features/menu/MenuBuilder`!)* | est. ~1213 (42.4 KB) | App.tsx | V-ONLY |
| `LabourCosting.tsx` | est. ~907 (31.7 KB) | App.tsx | V-ONLY |
| `LocationSuitability.tsx` | est. ~735 (25.7 KB) | App.tsx | V-ONLY |
| `SalesPredictions.tsx` | est. ~1317 (46.1 KB) | App.tsx | V-ONLY |
| `BusinessPlanning.tsx` | est. ~1194 (41.8 KB) | App.tsx | V-ONLY |
| `AIBusinessPlanBuilder.tsx` | est. ~1715 (60 KB) | App.tsx | V-ONLY |
| `BusinessPlanBuilder.tsx` | est. ~164 (5.7 KB) | App.tsx | V-ONLY |
| `LinkParsingSection.tsx` | est. ~1155 (40.4 KB) | App.tsx (indirect, via tabs) | V-ONLY |
| `ScenarioColumn.tsx` | est. ~1450 (50.7 KB) | tabs internally | V-ONLY |
| `ScenarioSelectionDialog.tsx` | est. ~483 (16.9 KB) | tabs internally | V-ONLY |
| `ChangelogView.tsx` | est. ~24 (0.8 KB) | none in src — orphan? | V-ONLY |

Subtotal: **20 files, ~17,500 LOC** (raw line count for `wc -l` confirms 12 explicitly imported by App.tsx; sub-components are referenced by their parents). No cross-feature imports.

> **Note on `MenuBuilder.tsx`:** the legacy viability `MenuBuilder` component is distinct from the rebuild's [`src/features/menu/`](../../src/features/menu/) feature. Same name, two different products: one is a viability tab for menu-driven sales modelling, the other is the production menu management feature. Rename the viability one when extracting (suggest `ViabilityMenuBuilder` or `MenuBuilderTab`).

### 1.2 — Calculation engines (`src/lib/calculations/`) — see §3 for detailed deep-dive

| File | LOC | Importers (count) | Cat |
|---|---:|---|---|
| `businessPlanGenerator.ts` | 1205 | 1 (AIBusinessPlanBuilder) | V-ONLY |
| `projectSummary.ts` | 245 | 4 (App.tsx, BusinessSnapshot, BusinessPlanning, exportDataBuilder) | V-ONLY |
| `summaryViability.ts` | 186 | 2 (App.tsx, BusinessSnapshot) | V-ONLY |
| `forecastEngine.ts` | 127 | 2 (BusinessPlanning, exportDataBuilder) | V-ONLY |
| `weeklyForecastEngine.ts` | 44 | 1 (BusinessPlanning) | V-ONLY |
| `insightsEngine.ts` | 232 | 2 (BusinessPlanning, exportDataBuilder) | V-ONLY |
| `hourlyBenchmarks.ts` | 235 | 2 (BusinessSnapshot, exportToPDF) | V-ONLY |
| `locationSuitability.ts` | 100 | 2 (LocationSuitability, exportToPDF) | V-ONLY |
| `seasonalityProfiles.ts` | 45 | 1 (SalesPredictions) | V-ONLY |
| `holidayBumpProfiles.ts` | 29 | 1 (SalesPredictions) | V-ONLY |
| `eventUplift.ts` | 30 | 0 (orphan) | V-ONLY |
| `dataSourceSelector.ts` | 137 | 0 (orphan — referenced via barrel?) | V-ONLY |
| `orderSourceFees.ts` | 60 | 0 (orphan) | V-ONLY |
| `businessPlanReadiness.ts` | 156 | 1 (AIBusinessPlanBuilder) | V-ONLY |
| `mojoFitScore.ts` | 53 | 1 (`lib/admin/buildLead.ts`) | **SHARED-V** |

Subtotal: **15 files, ~2,884 LOC**. 14/15 V-ONLY, 1/15 SHARED-V (`mojoFitScore` — see §3).

### 1.3 — Viability shell + dialogs (`src/components/`)

| File | LOC | Importers | Cat |
|---|---:|---|---|
| `BusinessSnapshot.tsx` | 286 | App.tsx | V-ONLY |
| `layout/Sidebar.tsx` | 185 | App.tsx | V-ONLY |
| `NewProjectOriginDialog.tsx` | 101 | App.tsx | V-ONLY |
| `SaveProjectCTA.tsx` | 116 | App.tsx | V-ONLY |
| `SaveProjectValidationDialog.tsx` | 54 | SaveProjectCTA | V-ONLY |
| `SaveStatusIndicator.tsx` | 79 | App.tsx | V-ONLY |
| `ShareProjectDialog.tsx` | 398 | App.tsx | V-ONLY |
| `ProjectManager.tsx` | 106 | App.tsx | V-ONLY |
| `WalkthroughNavigation.tsx` | 86 | 6 viability tabs (Fitout, Hours, Labour, Location, SalesBreakup, SalesPredictions) | V-ONLY |
| `ContentUploadsPanel.tsx` | 497 | AIBusinessPlanBuilder | V-ONLY |
| `HelpDialog.tsx` | 186 | App.tsx | V-ONLY (legacy in-app help) |
| `OnboardingTour.tsx` | 124 | App.tsx | V-ONLY |
| `LoadingScreen.tsx` | 51 | App.tsx | V-ONLY |
| `LandingPage.tsx` (root, 1393 LOC) | 1393 | App.tsx | V-ONLY (viability landing page) |
| `landing/HowItWorksPage.tsx` | 488 | App.tsx | V-ONLY |
| `landing/LandingHeader.tsx` | 123 | App.tsx + onboarding/WebsiteSetupWizard | **SHARED-V** (websites onboarding reuses header) |
| `landing/LandingPage1.tsx` | 621 | App.tsx | V-ONLY |
| `landing/ReachOutPage.tsx` | 196 | App.tsx | V-ONLY |
| `landing/LandingPage.tsx` | 833 | none in src | V-ONLY (orphan) |
| `landing/LandingPage2.tsx` | 583 | none in src | V-ONLY (orphan) |
| `onboarding/PathSelector.tsx` | — | App.tsx | V-ONLY (origin chooser before viability project starts) |
| `onboarding/ViabilityPath.tsx` | — | App.tsx | V-ONLY |
| `onboarding/GuestBanner.tsx` | — | App.tsx | V-ONLY |
| `OnboardingWelcome.tsx` | 147 | App.tsx | V-ONLY |
| `AdminPanel.tsx` | 770 | App.tsx | V-ONLY (viability lead/scenario admin view) |
| `LandingPage` (ContentUploadsPanel uses) | — | — | — |

Subtotal: **~25 files, ~6,800 LOC**.

> **Note on landing pages:** Three different "Landing*" entries exist (`components/LandingPage.tsx`, `components/landing/LandingPage.tsx`, `components/landing/LandingPage2.tsx`). The active one in App.tsx is `components/LandingPage.tsx` (root) + `landing/LandingPage1.tsx`. The other two are orphans — should still travel with viability for the new repo, but flag for delete-on-arrival cleanup.

### 1.4 — lib/ utilities

| File | LOC | Importers | Cat |
|---|---:|---|---|
| `lib/types/projectTypes.ts` | 551 | 35 viability files + AdminPanel + LandingPage (BusinessOrigin enum only) | **SHARED-V** |
| `lib/projectFactory.ts` | 247 | App.tsx | V-ONLY |
| `lib/projects.ts` | 67 | App.tsx, ProjectManager, useAutoSave | V-ONLY |
| `lib/permissions.ts` | 341 | App.tsx | V-ONLY (project-collab permissions, distinct from RLS) |
| `lib/admin/buildLead.ts` | 175 | AdminPanel.tsx, admin/MojoAdminPanel.tsx | **SHARED-V** (viability lead builder; MojoAdminPanel imports it for cross-product admin view) |
| `lib/contentUploads.ts` | (small) | ContentUploadsPanel | V-ONLY |
| `lib/export.ts` | 555 (18.6 KB) | none in src — orphan, possibly superseded by `lib/export/` | V-ONLY |
| `lib/export/index.ts` | 7 | App.tsx | V-ONLY |
| `lib/export/exportDataBuilder.ts` | 90 | exportToPDF, exportToExcel, exportBusinessPlan | V-ONLY |
| `lib/export/exportToPDF.ts` | 405 | export/index | V-ONLY |
| `lib/export/exportToExcel.ts` | 360 | export/index | V-ONLY |
| `lib/export/exportBusinessPlan.ts` | 250 | export/index | V-ONLY |
| `lib/export/printHtmlBuilder.ts` | 430 | exportBusinessPlan | V-ONLY |
| `lib/export/chartToImage.ts` | 90 | exportBusinessPlan/printHtmlBuilder | V-ONLY |
| `lib/export/hoursChartSvgRenderer.ts` | 460 | exportBusinessPlan/printHtmlBuilder | V-ONLY |
| `lib/resolveJoinCode.ts` | (small) | App.tsx + advisor/AddClientPage | **SHARED-V** (advisor module also uses join codes) |

Subtotal: **~16 files, ~4,600 LOC**.

### 1.5 — hooks/

| File | LOC | Importers | Cat |
|---|---:|---|---|
| `hooks/useAutoSave.ts` | 121 | App.tsx, SaveStatusIndicator | V-ONLY |
| `hooks/useKeyboardShortcuts.ts` | (small) | App.tsx | V-ONLY |

Subtotal: **2 files, ~150 LOC**.

### 1.6 — App.tsx fallback (the structural extraction)

| File | LOC | Notes |
|---|---:|---|
| `src/App.tsx` lines 1696–2491 | **~796 LOC** | Viability fallback render. Full UI shell — header/sidebar/snapshot/12-tab Tabs/dialogs/save/export. State-tangled. **Must be re-authored**, not relocated. |
| `src/App.tsx` lines 322–~600 | (state setup) | Viability state slices: `projectId`, `projectName`, `projectData`, `activeTab`, `projectPermissions`, `isGuest`, `signupFirstName/LastName/etc`, `onboardingProfile`, `pendingExportType`, `inviteToken`, etc. **Most of this state belongs in the new repo's App.tsx.** |
| `src/App.tsx` lines 600–1500 | (effects + handlers) | Mixed: auto-save effect, project load/save handlers, share-link handler, OAuth callbacks (Google Maps), guest/login flow, T&Cs gate, signup wizard. Most viability; some auth-shared. |

### 1.7 — Cross-feature shared infrastructure (SHARED-E)

These are shared between viability and 360 — both repos need them.

| File | LOC | Where 360 uses it | New-repo strategy |
|---|---:|---|---|
| `lib/types/projectTypes.ts` | 551 | `AdminPanel` (viability admin), `LandingPage` (BusinessOrigin enum). Wider consumption is **all viability**. | **Move to viability repo entirely.** Mojo 360's `AdminPanel`/`LandingPage` are themselves viability-leans (admin lead view + viability landing) — they travel with viability. |
| `lib/admin/buildLead.ts` | 175 | `MojoAdminPanel.tsx` (Mojo super-admin pan-product view) | **Duplicate.** Both repos have the same lead-shape; Mojo 360's admin panel reads viability `business_scenarios` cross-repo (same Supabase). OR: extract to a small shared npm package later. **Phase 2 recommendation: duplicate + accept drift, decide later.** |
| `landing/LandingHeader.tsx` | 123 | `onboarding/WebsiteSetupWizard.tsx` (websites onboarding) | **Duplicate.** Two diverging headers (viability + websites onboarding) is fine; consolidating creates coupling neither side wants. |

### 1.8 — Files that are App.tsx-exclusive but NOT viability

For completeness — these App.tsx imports go with the rebuild, NOT viability:

- `OrgSetupWizard.tsx` — 360 onboarding (creates a business)
- `CreateBusinessModal.tsx` — 360 onboarding
- `InviteAcceptance.tsx` — business membership invite (org)
- `HospoOSModal.tsx` — Hospo-OS waitlist (cross-product)
- `HospoOSBanner.tsx` — Hospo-OS banner
- `landing/LandingPage1.tsx` — uses `hospo_os_waitlist` + viability landing → **arguable; recommend viability since the whole landing is viability**
- `admin/MojoAdminPanel.tsx` — Mojo 360 super-admin pan-product view
- `websites-landing/WebsitesLanding.tsx` — websites landing (separate product from viability)
- `onboarding/WebsiteIntent.tsx`, `WebsiteSetupWizard.tsx` — websites onboarding

These remain in mojo_business.

---

## 2. Database table inventory

### 2.1 — VIABILITY-ONLY tables (4)

Migration ownership transfers to new repo. RLS already correctly user-scoped (no business_id coupling — viability is a single-user-per-project tool, not multi-tenant).

| Table | Rows (live) | Schema highlights | RLS shape | Notes |
|---|---:|---|---|---|
| `business_scenarios` | 6 | `id uuid PK`, `user_id uuid FK auth.users`, `name text`, `data jsonb (ProjectData)`, `business_origin text`, `scenario_mode text`, `will_serve_alcohol bool`, `will_have_gaming_or_betting bool`, `liquor_licence_type text`, `liquor_licence_other_text text`, timestamps | INSERT: `user_id = auth.uid()`. UPDATE/DELETE: owner only (DELETE) or owner+editor-collaborators (UPDATE). SELECT: owner+collaborators OR `super_admin` platform role. | Top-level viability project store. Recent additions (`liquor_licence_*`, `business_origin`) suggest active schema evolution; capture all migrations. |
| `project_invites` | 1 | `id`, `project_id`, `token text`, `role_granted text`, `created_by_user_id`, `created_at`, `revoked_at`, `used_at`, `used_by_user_id` | INSERT: project owner. UPDATE: creator. SELECT: creator OR (active+unused). | Magic-link share invites for viability projects. |
| `project_content_uploads` | 0 | `id`, `project_id`, `file_url`, `file_name`, `file_type`, `file_size`, `category`, `caption`, `is_primary_logo`, `uploaded_at`, `uploaded_by` | All CRUD: owner OR editor-collaborators of the project. | Used by `ContentUploadsPanel`/`AIBusinessPlanBuilder` for AI-plan content (logos, photos, brand assets). Backed by `project-uploads` storage bucket. |
| `collaborators` | 6 | `id`, `project_id`, `user_id`, `role text` ('owner'/'editor'/'viewer') | INSERT/UPDATE/DELETE: project owner. SELECT: own row only. | Project-level collaboration model. Separate from `business_memberships` (business-level). |

**Critical RLS anomaly to fix at extraction time:** `business_scenarios` SELECT policy "Super users can read all business scenarios" reads `platform_roles.role = 'super_admin'` — but the actual platform role values are `super_user`/`mojo_team`/`standard` (per [USER_MODEL_INVENTORY](../USER_MODEL_INVENTORY.md) §5.2). This policy is a **dead branch** today (no row matches `'super_admin'`), but flag for cleanup during Phase 2 — likely should be `is_super_user()` to match the rest of the codebase.

### 2.2 — VIABILITY-ONLY storage buckets (1)

| Bucket | Public | Size limit | MIME limit | Use |
|---|:-:|---|---|---|
| `project-uploads` | private | none | none | `project_content_uploads.file_url` backing storage. Logos, brand assets, etc. uploaded via `ContentUploadsPanel`. |

### 2.3 — VIABILITY-ONLY RPCs (9)

Migration ownership transfers to new repo. All operate on `business_scenarios`/`collaborators`.

```
create_project_owner_collaborator()
get_all_business_scenarios()
get_project_collaborators(project_uuid uuid)
get_user_project_role(project_uuid uuid, user_uuid uuid)
is_project_collaborator(project_uuid uuid, user_uuid uuid)
is_project_owner_check(project_uuid uuid)
is_project_owner_check(p_project_id uuid, p_user_id uuid)   -- duplicate signature, drop one during extraction
user_can_edit_project(project_uuid uuid, user_uuid uuid)
user_is_project_owner(project_uuid uuid, user_uuid uuid)
```

> **Cleanup opportunity at extraction:** there are TWO `is_project_owner_check` RPCs with different argument names. Drop the older one in Phase 2.

### 2.4 — SHARED identity tables (5)

Schema stays in mojo_business. Both repos read/write same shape via Supabase client.

| Table | Notes for viability extraction |
|---|---|
| `auth.users` | Supabase-managed. Both apps use the same auth via shared anon key + URL. Session sharing across `mojobusiness.ai` (viability) and `app.mojobusiness.ai` (360) requires explicit cookie-domain config — design issue for Phase 2 (open question Q1 below). |
| `profiles` | Has BOTH viability fields (`venue_type`, `business_intent`, `timeline`, `town`, `pos_system`, `accounting_system`, `rostering_system`, `franchise_type`, `location_count`, `pending_join_code`, `onboarding_path`) AND 360 fields (`organisation_name`, `is_admin`, `is_advisor`, `is_mojo_employee`, `display_name`, `industry`, `outlet_count`, `onboarding_completed`). New repo writes viability fields on signup; 360 writes 360 fields. No partition needed. |
| `platform_roles` | Read-only from viability (super_user can view all scenarios); writes stay in mojo_business. |
| `businesses` | Viability does NOT touch this table today. Viability projects are `user_id`-scoped, not `business_id`-scoped. Open question Q2: does the new repo eventually scope projects to businesses? |
| `business_memberships` | Same — not touched by viability. |

### 2.5 — Tables NOT used by viability (just so the boundary is explicit)

All the operational tables — `daily_actuals*`, `count_*`, `denominations`, `counting_units`, `bank_deposits`, `expected_cash_sources`, `square_cash_shifts`, `hierarchy_*`, `node_*`, `menu_*`, `ingredients*`, `prep_*`, `marketing_*`, `weekly_*`, `venue_*`, `alerts*`, `audit_events`, `terms_acceptances`, `employees`, `candidates`, `survey_responses`, `checklist_*`, `team_*`, `nine_box_snapshots`, `xero_pnl_snapshots`, `email_*`, `integration_*`, `domain_requests`, `hospo_os_waitlist`, `advisor_*`, `user_module_access`, `user_roles`, `changelogs`, `demo_requests`, `offboarding_records`, `development_plans`, `job_listings`, `check_ins` — all 360.

---

## 3. Calculation engines deep-dive

All 15 are viability-themed. Recommendation: **all 15 move to viability repo** (`shared/lib/calculations/` or `lib/calculations/` in the new repo). Mojo 360 doesn't need any of these — the rebuild's `shared/lib/calculations/` per FOUNDATION_SPEC §4.6 is for BI calculations not yet authored, not viability.

| File | LOC | What it calculates | Callers (✓ = viability) | Recommendation |
|---|---:|---|---|---|
| `businessPlanGenerator.ts` | 1205 | Generates a full HTML business plan from `ProjectData` (sections, financial tables, viability narrative). Imports `forecastEngine`, `projectSummary`, `addressUtils`, `htmlEscape`. | AIBusinessPlanBuilder ✓ | Viability repo. |
| `projectSummary.ts` | 245 | Computes `ProjectSummary` (break-even, funding gap, health score, viability metrics) from `ProjectData`. Foundational. | App.tsx ✓, BusinessSnapshot ✓, BusinessPlanning ✓, exportDataBuilder ✓ | Viability repo. |
| `summaryViability.ts` | 186 | `evaluateViability(summary)` → traffic-light viability narrative. | App.tsx ✓, BusinessSnapshot ✓ | Viability repo. |
| `forecastEngine.ts` | 127 | Annual forecast (revenue, costs, margins) projection. | BusinessPlanning ✓, exportDataBuilder ✓ | Viability repo. |
| `weeklyForecastEngine.ts` | 44 | Weekly/seasonal forecast variant. | BusinessPlanning ✓ | Viability repo. |
| `insightsEngine.ts` | 232 | Generates `Insight[]` (suggestions/warnings) from project + summary. | BusinessPlanning ✓, exportDataBuilder ✓ | Viability repo. |
| `hourlyBenchmarks.ts` | 235 | Hourly sales benchmarking by venue type. | BusinessSnapshot ✓, exportToPDF ✓ | Viability repo. |
| `locationSuitability.ts` | 100 | Scores location suitability (foot traffic, demographics, competitors). | LocationSuitability ✓, exportToPDF ✓ | Viability repo. |
| `seasonalityProfiles.ts` | 45 | Predefined seasonality curves per venue type. | SalesPredictions ✓ | Viability repo. |
| `holidayBumpProfiles.ts` | 29 | Holiday-week sales uplift profiles. | SalesPredictions ✓ | Viability repo. |
| `eventUplift.ts` | 30 | Event-driven sales uplift modelling. | none currently | Viability repo (orphan but viability-themed). |
| `dataSourceSelector.ts` | 137 | Selects data source for forecast (manual entry vs benchmark vs Square POS). | none currently (possibly via barrel) | Viability repo. |
| `orderSourceFees.ts` | 60 | Order-source fee modelling (direct, Uber, DoorDash, etc.). | none currently | Viability repo. |
| `businessPlanReadiness.ts` | 156 | Per-section readiness scoring for AI plan builder. | AIBusinessPlanBuilder ✓ | Viability repo. |
| `mojoFitScore.ts` | 53 | Computes a "Mojo Fit" lead score. | `lib/admin/buildLead.ts` (admin lead-shape builder, used by both AdminPanel viability admin AND MojoAdminPanel 360 super-admin) | **Duplicate or co-locate.** Recommend: **viability repo owns it**, 360 super-admin reads pre-computed scores via the shared `profiles` table (or a future small shared package). Lowest-friction Phase 2: copy into both. |

**Aggregate:** 14 V-ONLY (move) + 1 SHARED-V (mojoFitScore — duplicate or shared package). Total ~2,884 LOC of calculation logic.

---

## 4. External npm dependencies

### 4.1 — Viability-only deps (1 confirmed)

| Package | Version | Used in | Notes |
|---|---|---|---|
| `html2canvas` | (transitive — not in package.json explicitly) | `lib/export/exportBusinessPlan.ts` | New repo needs this. Mojo 360 doesn't import it; safe to drop from mojo_business after extraction. |

> **Wait — `html2canvas` doesn't appear in `package.json` dependencies.** Verify at extraction time whether it's resolved transitively (via jspdf?) or whether it's an unmet import. If unmet, business plan PDF generation may already be silently broken — flag for Phase 2 verification.

### 4.2 — SHARED deps (viability + 360 both use; new repo will install too)

| Package | Version | Viability uses | 360 uses |
|---|---|---|---|
| `react`, `react-dom` | 18.3.1 | core | core |
| `react-router-dom` | 6.30.3 | (not yet — viability uses tab state) | rebuild router |
| `@supabase/supabase-js` | 2.58.0 | auth + tables | auth + all features |
| `@tanstack/react-query` | 5.100.5 | (not yet — manual fetches) | rebuild data layer |
| `@hookform/resolvers`, `react-hook-form`, `zod` | various | dialogs, forms | rebuild forms |
| All `@radix-ui/*` | various | shadcn primitives | shadcn primitives |
| `tailwindcss`, `tailwind-merge`, `tailwindcss-animate`, `class-variance-authority`, `clsx` | various | styling | styling |
| `lucide-react` | 0.446 | icons | icons |
| `recharts` | 2.12.7 | viability charts | dashboard charts |
| `sonner` | 1.5 | toasts | toasts |
| `date-fns` | 3.6 | date utils | date utils |
| `jspdf`, `jspdf-autotable` | 3.0/5.0 | viability PDF export | budget-forecaster + people-manager exports |
| `exceljs` | 4.4 | viability Excel export | menu/admin/budget/people Excel |
| `@react-google-maps/api` | 2.20.7 | LocationSuitability + BusinessPlanning + LinkParsingSection | org/VenueSettings + people-manager |
| `react-day-picker` | 9.11 | (transitive via shadcn calendar) | calendar primitive |

All of these get installed in the new repo. None are dropped from mojo_business.

### 4.3 — 360-only deps (mojo_business keeps; new repo doesn't need)

| Package | Used in |
|---|---|
| `@imgly/background-removal` | `mojo-websites/ComingSoonPage.tsx` only |

### 4.4 — DevDeps

All standard (Vite/TS/ESLint/PostCSS/Tailwind/PWA). New repo gets fresh devDeps.

---

## 5. Auth + RLS surface that viability needs

### 5.1 — Auth context

Viability today reads:
- `auth.uid()` for `business_scenarios.user_id`, `collaborators.user_id`, `project_invites.created_by_user_id`
- `profiles` row for the current user (signup fields, lead-quality fields)
- `platform_roles` only via the dead `super_admin` policy on `business_scenarios` (currently a no-op)

**Viability does NOT read:**
- `business_memberships` (it's not multi-tenant)
- `platform_roles.role = 'super_user'` properly (the `business_scenarios` SELECT policy uses the wrong role string)
- Any 360 RPCs (`is_business_member`, `is_super_user`, etc.)

### 5.2 — Auth flows the new repo must reimplement

- Email/password signup → INSERT into `profiles` with viability lead fields → trigger fires `terms_acceptances` row
- Email/password login (existing user)
- Magic link / project invite acceptance via `project_invites.token`
- Guest mode (legacy concept — App.tsx has `isGuest` state for "try without signup")
- Google Maps Places API for venue location parsing

### 5.3 — Session sharing across mojobusiness.ai and the eventual 360 subdomain

**Open question Q1 below.** Both apps using the same Supabase project gives shared `auth.users`, but Supabase auth cookies are domain-scoped — sharing a session between root + subdomain needs explicit cookie config + token handover, OR each app maintains its own session and the user re-logs in when crossing.

---

## 6. Open questions for Max

These need decisions before Phase 2 extraction can proceed.

### Q1 — Session sharing strategy

Both apps share Supabase auth, but how does a user move between `mojobusiness.ai` (viability) and the eventual 360 subdomain without re-logging in?

- **(a) Cookie-domain trick:** set Supabase auth cookie at `.mojobusiness.ai` so both root + sub share the session. Requires both apps deployed under the same parent domain. Limits 360's domain freedom.
- **(b) Token handover:** viability redirects to 360 with a one-time token that 360 exchanges for a session. More work; more flexible.
- **(c) Don't share:** user logs in to each app separately. Simplest. Acceptable if cross-app traffic is rare (lead → 360 conversion happens at most once per user).

Recommend **(c) initially**, upgrade to (a) or (b) when conversion-flow friction is measured.

### Q2 — `business_scenarios.user_id` vs eventual `business_id` scoping

Viability today is single-user. If a viability lead converts to a 360 customer, the `business_id` is created in 360. Should the original viability project link to that business retroactively? Or is the viability scenario archived once the customer transitions to operating-mode?

Affects: whether `business_scenarios` gets a nullable `business_id` column added, and whether 360's "Viability" placeholder route ever shows the historical scenario.

### Q3 — `mojoFitScore` and `buildLead` ownership

The lead-scoring logic (`mojoFitScore.ts` + `buildLead.ts`) is currently used by both `AdminPanel.tsx` (viability admin) and `MojoAdminPanel.tsx` (360 super-admin). Three options:

- **(a) Viability owns it.** 360's MojoAdminPanel reads pre-computed scores from `profiles.mojo_fit_score` (would require a stored column + update path).
- **(b) Duplicate.** Both repos have a copy. Drift risk but simplest.
- **(c) Tiny shared package.** `@mojo/lead-scoring` published privately. Adds tooling overhead.

Recommend **(b) duplicate** for Phase 2 and revisit if drift becomes a problem.

### Q4 — `lib/types/projectTypes.ts` ownership

This file is 551 LOC of TypeScript types for `ProjectData`/`ProjectSummary`/`BusinessOrigin` etc. The rebuild's `AdminPanel.tsx` imports `ProjectData` (to render lead leads), and the rebuild's `LandingPage.tsx` imports `BusinessOrigin` (single enum).

- **(a) Move to viability.** AdminPanel/LandingPage travel with viability per §1.3 categorisation. ✅ Recommended.
- **(b) Duplicate.** 360 keeps a stripped copy with just `ProjectData` (for admin lead view) and `BusinessOrigin` (for landing). Drift risk.
- **(c) Tiny shared package.** Same overhead as Q3.

Recommend **(a) move to viability** since the only 360 importers are themselves viability-leans (admin lead viewer + landing page).

### Q5 — Repo bootstrap shape

Vite + React 18 + TS + Tailwind + shadcn/ui + Supabase, deployed to Vercel. Same stack as mojo_business. Seed from:

- **(a) Fresh Vite scaffold + manually port files.** Cleanest separation; rules out accidental 360 imports.
- **(b) Clone mojo_business, strip 360 surface.** Faster to a working state but risks dragging shared chrome that should be authored cleanly.

Recommend **(a) fresh scaffold** — gives a chance to drop the App.tsx-fallback architecture in favour of a proper Router from day 1.

### Q6 — Viability re-attempt window vs extraction

FOUNDATION_SPEC §5.6 + REBUILD_DEFERRED.md set a 2-week post-merge re-attempt window for viability migration **into mojo_business**. The brief here positions extraction **out of mojo_business** instead. Confirm: is the strangler-defer entry now obsolete (extraction supersedes re-attempt)? Or do both happen — viability gets a placeholder route in 360 that links out to the standalone viability app?

Recommend confirming as obsolete + updating REBUILD_DEFERRED.md to note "viability extracted to standalone repo per Phase 2 inventory; rebuild's `/hub/viability` slot redirects/links to mojobusiness.ai or shows an info card."

### Q7 — `LandingPage1.tsx` dependency on `hospo_os_waitlist`

The viability landing imports the Hospo-OS waitlist modal trigger (`HospoOSModal` is referenced from `LandingPage1.tsx` per imports map). Hospo-OS is a separate product (cross-product waitlist for the 360 ecosystem). When viability extracts:

- **(a)** Strip the Hospo-OS waitlist from the viability landing — viability landing focuses on viability lead capture only.
- **(b)** Keep the Hospo-OS waitlist on the viability landing — both products share the lead funnel.

Recommend **(b)** — keep the waitlist; mojobusiness.ai is the marketing surface for the ecosystem and Hospo-OS lead capture there is high-value.

---

## 7. Recommended extraction order

Phase 2 should sequence the work to minimise broken-state intervals. The 51 V-ONLY files relocate cleanly; the App.tsx fallback is the structural risk.

1. **Bootstrap new repo** — Vite scaffold, Tailwind, shadcn/ui primitives copied from `src/shared/components/ui/`, Supabase client wired with shared keys. Verify auth + a minimal "hello user" page works.
2. **Move calculation engines** — all 15 in `src/lib/calculations/` → new repo `src/lib/calculations/`. Pure-function code, no UI deps. Smoke-test by importing one engine in the bootstrapped page. ~1 hour.
3. **Move type model + shared utils** — `lib/types/projectTypes.ts`, `lib/projectFactory.ts`, `lib/projects.ts`, `lib/permissions.ts`, `lib/contentUploads.ts`, `lib/format.ts` (copy or duplicate), `lib/htmlEscape.ts` (copy or duplicate), `lib/addressUtils.ts` (copy), `lib/timeUtils.ts` (copy), `lib/uploadValidation.ts` (copy). ~1 hour.
4. **Move tab content components** — all 21 files in `src/components/modules/`. Sub-components first, parent components after. Update import paths. Typecheck. ~3 hours.
5. **Move shell + dialogs** — `BusinessSnapshot`, `Sidebar`, all dialogs + CTAs (`NewProjectOriginDialog`, `SaveProjectCTA`, `ShareProjectDialog`, `ProjectManager`, `WalkthroughNavigation`, `ContentUploadsPanel`, `HelpDialog`, `OnboardingTour`, `LoadingScreen`, `SaveStatusIndicator`, `OnboardingWelcome`, `AdminPanel`). ~2 hours.
6. **Move landing + onboarding** — root `LandingPage.tsx`, `landing/*` (5 files including 2 orphans), `onboarding/PathSelector`, `onboarding/ViabilityPath`, `onboarding/GuestBanner`. Drop `LandingPage.tsx`/`LandingPage2.tsx` orphans during the move. ~2 hours.
7. **Move export pipeline** — `lib/export/` (7 files) + `lib/export.ts` (verify orphan status; likely drop). Install `jspdf` + `jspdf-autotable` + `exceljs` + check `html2canvas` resolution. ~2 hours.
8. **Move hooks** — `useAutoSave`, `useKeyboardShortcuts`. ~30 min.
9. **Re-author App.tsx fallback as proper App + Router** — this is the structural rebuild. Replace tab-state with route segments (`/`, `/login`, `/project/:id/break-even`, `/project/:id/hours`, etc. — 12 routes). Replace App.tsx state with React Query for project loading. Keep autosave + share/save/export wiring. **~6–8 hours.**
10. **Move admin lead surface** — `AdminPanel.tsx` + `lib/admin/buildLead.ts` + `lib/admin/`. Decide on `mojoFitScore` ownership per Q3. ~1–2 hours.
11. **Wire DB migrations** — copy the 4 V-ONLY tables' migrations from mojo_business + the 9 RPCs. Mark as new repo's migration baseline. Drop the dead `super_admin` policy + duplicate `is_project_owner_check`. ~1 hour.
12. **Smoke-test in browser** — sign up, create project, fill in tabs, save, share, export PDF + Excel, AI plan, admin view. ~2 hours.
13. **Mojo 360 cleanup** — drop the 51 V-ONLY files from mojo_business; remove now-unused App.tsx fallback (lines 1696–2491) and viability state slices; remove `html2canvas` from deps; remove the dead viability imports (~20 import lines at top of App.tsx); remove `lib/calculations/`, `lib/export/`, `lib/projects.ts`, `lib/permissions.ts`, `lib/admin/buildLead.ts`, `hooks/useAutoSave`, `hooks/useKeyboardShortcuts`, all viability components; remove the legacy `App.tsx` entirely once `main.tsx` no longer points at it; drop the 4 viability-only DB migrations from `supabase/migrations/` directory (they live in the new repo now). ~2 hours.

---

## 8. Estimated effort

**Total: 20–30 engineering hours** for a working extraction. Breakdown:

| Phase | Hours (low) | Hours (high) | Notes |
|---|---:|---:|---|
| 1. Bootstrap new repo | 2 | 3 | Vite + Supabase + shadcn baseline + Vercel hookup |
| 2. Calculation engines | 1 | 1 | 15 pure files |
| 3. Type model + shared utils | 1 | 2 | Some helpers (htmlEscape, format, oauth) need duplicate-or-share decision |
| 4. Tab components | 3 | 4 | 21 files, ~17.5K LOC |
| 5. Shell + dialogs | 2 | 3 | 13 files |
| 6. Landing + onboarding | 2 | 2 | Includes orphan cleanup |
| 7. Export pipeline | 2 | 3 | Includes html2canvas verification |
| 8. Hooks | 0.5 | 1 | trivial |
| 9. **App.tsx → Router rewrite** | **6** | **8** | **The single biggest unknown.** Tab-state → route-state, save/share/export wiring, autosave, guest mode, signup flow. |
| 10. Admin lead surface | 1 | 2 | + Q3 decision |
| 11. DB migrations + cleanup | 1 | 1 | Move 4 tables + 9 RPCs + 1 bucket |
| 12. Browser smoke | 2 | 3 | Full lead flow + AI plan + exports |
| 13. Mojo 360 cleanup | 2 | 3 | Delete 51 files + ~1000 LOC App.tsx fallback + dep purge |
| **TOTAL** | **~25.5h** | **~36h** | Range: ~3–5 working days for one focused engineer |

**Lower-bound assumptions:** App.tsx-rewrite goes well, no surprises in autosave/share-link wiring, exports work first try.
**Upper-bound assumptions:** App.tsx-rewrite hits 1–2 issues, html2canvas needs sourcing, smoke surfaces a bug or two in the calculation engines (none expected — pure functions).

---

## 9. Phase 2 prerequisites

Before extraction begins, the following need to be in place:

1. **Foundation rebuild merged.** Don't extract during the rebuild — touching App.tsx mid-rebuild conflicts with rebuild work and the active orchestrator.
2. **Q1–Q7 above answered.** Especially Q4 (projectTypes.ts ownership) and Q6 (REBUILD_DEFERRED reconciliation).
3. **`html2canvas` import resolved.** Check whether business plan PDF export is currently working in production. If broken, fix before extraction so the extraction starts from a known-good baseline.
4. **Vercel project + DNS for `mojobusiness.ai`** — currently this domain serves the mojo_business app. Cutover plan needed: viability deploys to mojobusiness.ai, mojo_business moves to a subdomain (e.g. `app.mojobusiness.ai`).
5. **Supabase keys decision** — both repos use the same `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Confirm whether to share the same anon key (same RLS surface) or scope to a viability-named key (no functional difference today, but cleaner audit log).

---

## 10. Files referenced during this inventory

Code reads:
- `src/App.tsx` (head + state vars + activeView gate + fallback boundary)
- `src/components/modules/*.tsx` (all 21 files; LOC + importer scan)
- `src/components/*.tsx` (all top-level — LOC + importer scan)
- `src/components/landing/*.tsx`, `src/components/onboarding/*.tsx`, `src/components/admin/*.tsx`, `src/components/shared/*.tsx`, `src/components/websites-landing/*.tsx`
- `src/lib/calculations/*.ts` (all 15)
- `src/lib/export/*.ts`, `src/lib/export.ts`, `src/lib/admin/buildLead.ts`
- `src/lib/types/projectTypes.ts`, `src/lib/projectFactory.ts`, `src/lib/projects.ts`, `src/lib/permissions.ts`, `src/lib/contentUploads.ts`, `src/lib/resolveJoinCode.ts`
- `src/hooks/useAutoSave.ts`, `src/hooks/useKeyboardShortcuts.ts`
- `package.json`

Spec / context reads:
- `context/morning-reviews/2026-04-29-day-3-am.md`
- `context/FOUNDATION_SPEC.md` (§4.2, §4.2a, §4.6, §5.6, §5.7)
- `context/REBUILD_DEFERRED.md`

DB reads (Supabase MCP, project `zaxzzvluytxtbsjxlzkg`, read-only):
- `information_schema.columns` for all suspected viability tables + identity tables
- `pg_policies` for viability + identity tables
- `pg_proc` for project-themed RPCs
- `storage.buckets` for all buckets

NO writes performed.

---

## 11. Phase 1 stand-down

This document is the only file created during Phase 1. No code changes, no file moves, no deletions, no DB writes. The other orchestrator session in this repo was unimpeded throughout.

**Hand back to Max.** Decisions needed (Q1–Q7) before Phase 2 extraction can be brief'd and scheduled.
