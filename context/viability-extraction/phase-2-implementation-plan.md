# Mojo Viability Extraction — Phase 2 Implementation Plan

**Date:** 2026-05-02
**Phase:** 2 (the actual extraction)
**Trigger:** foundation rebuild merged to main (Sun 2026-05-03 cutover or shortly after).
**Repos involved:**
- **Source:** `mojo_business` (this repo — viability code lives in `src/` today)
- **Target:** `mojo_viability` (new repo — to be created at Phase 2 hour zero, deployed to `mojobusiness.ai`)

**Companion docs (read in order):**
1. [`inventory.md`](./inventory.md) — what files exist
2. [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) — architectural decisions locked
3. [`app-tsx-anatomy.md`](./app-tsx-anatomy.md) — App.tsx rewrite map (the 6–11h structural unknown)
4. [`pre-extraction-punch-list.md`](./pre-extraction-punch-list.md) — pre-Phase-2 cleanups
5. [`phase-2.5-hub-viability-spec.md`](./phase-2.5-hub-viability-spec.md) — what 360 builds after Phase 2
6. **This document** — the operational manual

---

## 0. Executive summary

12-step extraction sequence over **~25–35 engineering hours** (~3–5 focused days). The plan is structured so each step ends at a known-good state — typecheck + build pass, optionally smoke-test pass — so the work can pause and resume across days without context loss.

**The single biggest risk** is step 9 (the App.tsx rewrite — 8.5–11h per anatomy). Steps 1–8 are mechanical relocation that can be sub-agent-parallelised; step 9 is sequential focused work; steps 10–12 are cleanup.

**Decisions still needed at hour zero** (per [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) "Phase 2 prerequisites"):
- DNS plan for `mojobusiness.ai` (current vs new deploy)
- Supabase keys: same anon key both repos, or separate?
- `html2canvas` explicit-add timing (recommend: in the new repo's initial `package.json` per pre-extraction punch list §4)

**Decisions still needed during execution** (flagged inline below):
- Phase 2.5 schema additions: bundle into Phase 2 migrations or ship later?
- "Convention NOT to copy" from rebuild's cash migration: applies here too, but the new repo doesn't have cash to copy from.

---

## 1. Pre-flight checklist (Phase 2 hour zero)

Before writing any code, complete this checklist. Halt if any item fails.

### 1.1 — Source repo state

- [ ] Foundation rebuild merged to `main` in `mojo_business`. `git log main --oneline | head -1` shows a recent rebuild merge commit.
- [ ] `main` working tree clean (`git status` shows "nothing to commit").
- [ ] `npm run typecheck` passes on `main`.
- [ ] `npm run build` passes on `main` (4–8s typical).
- [ ] No active orchestrator session modifying `src/`. Confirm via chat with Max.
- [ ] Pre-extraction punch list §1 actions complete: 4 orphan files deleted in mojo_business (or to be deleted as part of Phase 2's cleanup step 12 — defer is acceptable).

### 1.2 — Decisions confirmed

- [ ] DNS plan for `mojobusiness.ai`: who serves it post-cutover? Document in chat before bootstrapping new repo.
- [ ] Supabase anon key strategy decided.
- [ ] Q11 decisions (from Phase 2.5 spec) — read but not blocking; only matters when Phase 2.5 starts.

### 1.3 — New repo prerequisites

- [ ] GitHub repo `mojo_viability` (or final-decided name) created. Empty.
- [ ] Vercel project created and linked to the GitHub repo.
- [ ] `mojobusiness.ai` DNS pointed at Vercel (per the DNS plan — may be deferred until smoke clears).
- [ ] Supabase project access verified — `npm install @supabase/supabase-js && node -e "..."` reads `business_scenarios` row count from new repo's machine.

### 1.4 — `html2canvas` resolution check

- [ ] In new repo: `npm install jspdf@^3.0.3 html2canvas@^1.4.1` resolves cleanly.
- [ ] `import html2canvas from 'html2canvas'` typechecks in a test file. (Verify the type definitions ship with the package.)

### 1.5 — Hand-off

If any pre-flight item fails, halt. Capture the failure in a follow-up doc (`context/viability-extraction/phase-2-blockers.md`) and surface to Max in chat. Don't proceed to step 1.

---

## 2. Branching strategy

### 2.1 — Source repo (`mojo_business`)

Phase 2 only **deletes** code from mojo_business — at the end (step 12). All other work happens in the new repo.

- Create branch `viability-cleanup` for the deletion commits.
- Step 12 lands as a single PR to mojo_business main with a reverting-friendly diff.
- **Don't merge** the cleanup PR until the new repo is live and serving traffic at mojobusiness.ai.

### 2.2 — Target repo (`mojo_viability`)

Single long-lived branch `extraction` off main. Land each step as a separate commit on this branch. PR to main once smoke clears (step 11).

Sub-branches not needed — the steps are sequential enough that branch isolation adds overhead without benefit.

### 2.3 — Working in parallel?

Steps 2, 3, 7 are pure file moves with no dependencies between them — could parallelise via subagents. Steps 4, 5, 6 depend on each other (shared types ship before components). Step 9 must be sequential. Recommend single-engineer focus; subagent parallelism only if Max wants to compress the timeline.

---

## 3. Step-by-step plan

### Step 1 — Bootstrap new repo

**Goal:** scaffolded Vite + React + TS + Tailwind + shadcn project with Supabase wired and a "hello user" page proving the auth chain works end-to-end.

**Estimated time:** 2–3h

**Decision per Q5:** fresh Vite scaffold (not clone-and-strip).

**Sub-steps:**
1. `npm create vite@latest . -- --template react-ts`
2. Install dependencies (copy from `mojo_business/package.json` — see §3.1.1 below for the curated list).
3. Configure Tailwind: copy `tailwind.config.js`, `postcss.config.js`, `index.css` from mojo_business. Adapt theme tokens.
4. Configure path alias `@/*` → `src/*` in `tsconfig.json` and `vite.config.ts`.
5. Initialise shadcn: `npx shadcn-ui@latest init` with the same colour scheme as mojo_business.
6. Copy `src/shared/components/ui/` from mojo_business → `src/components/ui/` in new repo. (Or set up shadcn registry — same outcome.)
7. Copy `src/lib/supabase.ts` adapted with new env var names.
8. Create `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_MAPS_API_KEY` (per Q5 stack decision).
9. Copy AuthProvider from rebuild's `src/app/providers/AuthProvider.tsx`. Strip the `is_advisor`/`isMojoEmployee` concerns — viability is owner-only.
10. Build a `<HelloUser>` page that calls `useAuth()` and displays the user's email or "Not signed in".
11. Mount `<App>` wrapping `<QueryProvider>` + `<ThemeProvider>` + `<ToastProvider>` + `<AuthProvider>` + `<HelloUser>`.

**Acceptance criteria:**
- [ ] `npm run dev` starts. http://localhost:5173 shows "Not signed in".
- [ ] Sign in via Supabase JS console (in browser dev tools) — page updates to show email.
- [ ] `npm run build` passes.
- [ ] `npm run typecheck` passes (or whatever the equivalent is in the new scaffold).

**Commit:** `chore: bootstrap mojo_viability repo with Vite + Tailwind + shadcn + Supabase auth`

#### 3.1.1 — Curated initial `package.json` dependencies

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@react-google-maps/api": "^2.20.7",
    "@supabase/supabase-js": "^2.58.0",
    "@tanstack/react-query": "^5.100.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "exceljs": "^4.4.0",
    "html2canvas": "^1.4.1",         // explicit per pre-extraction punch list §4
    "jspdf": "^3.0.3",
    "jspdf-autotable": "^5.0.2",
    "lucide-react": "^0.446.0",
    "react": "^18.3.1",
    "react-day-picker": "^9.11.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-router-dom": "^6.30.3",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  }
}
```

**Drops** (vs mojo_business): `@imgly/background-removal` (Mojo Websites only). Everything else travels.

---

### Step 2 — Move calculation engines

**Goal:** all 15 viability calculation engines copied to the new repo, importable, typecheck-clean.

**Estimated time:** 1h

**Source:** `mojo_business/src/lib/calculations/*.ts` (15 files, ~2,884 LOC)

**Target:** `mojo_viability/src/lib/calculations/*.ts`

**Sub-steps:**
1. Copy all 15 files verbatim. Paths within the folder are sibling-relative (e.g. `from "./projectSummary"`) so no rewrites needed within the folder.
2. Resolve external imports (each calc file imports from `../types/projectTypes`, `../timeUtils`, `../supabase`, `../addressUtils`, `../format`, `../htmlEscape`):
   - `../types/projectTypes` → ship with step 3
   - `../timeUtils` → ship with step 3
   - `../addressUtils` → ship with step 3
   - `../supabase` → already shipped in step 1 as `lib/supabase.ts`
   - `../format` → ship with step 3
   - `../htmlEscape` → ship with step 3
3. Step 2 will fail typecheck until step 3 lands. **Acceptable** — commit as WIP and move forward.
4. Per pre-extraction punch list: `eventUplift.ts` is a confirmed orphan. **Drop it during this copy** — don't ship orphans to the new repo.

**Acceptance criteria:**
- [ ] `src/lib/calculations/` contains 14 files in new repo (15 minus the orphan).
- [ ] Sibling imports between calc files resolve.
- [ ] Typecheck fails only on missing `../types/projectTypes`, etc. — fixed in step 3.

**Commit:** `feat: import 14 viability calculation engines (eventUplift dropped as orphan)`

---

### Step 3 — Move type model + shared utils

**Goal:** `ProjectData`/`ProjectSummary` types + supporting utility files in new repo. Step 2's typecheck now passes.

**Estimated time:** 1–2h

**Files to copy:**

| Source path | Target path | Notes |
|---|---|---|
| `src/lib/types/projectTypes.ts` | `src/lib/types/projectTypes.ts` | 551 LOC. Per Q4, move-not-share. |
| `src/lib/projectFactory.ts` | `src/lib/projectFactory.ts` | 247 LOC. `createEmptyProject(origin)`. |
| `src/lib/timeUtils.ts` | `src/lib/timeUtils.ts` | Calculation dependency. |
| `src/lib/addressUtils.ts` | `src/lib/addressUtils.ts` | `extractSuburbAndState` used by `businessPlanGenerator`. |
| `src/lib/format.ts` | `src/lib/format.ts` | `formatCurrency` used everywhere. |
| `src/lib/htmlEscape.ts` | `src/lib/htmlEscape.ts` | Per inventory §1.4 — duplicate (small file, not worth sharing). |
| `src/lib/uploadValidation.ts` | `src/lib/uploadValidation.ts` | If `ContentUploadsPanel` uses it. |
| `src/lib/projects.ts` | `src/features/project/api/projectsApi.ts` | Renamed per anatomy §6.3. |
| `src/lib/contentUploads.ts` | `src/features/project/api/contentUploadsApi.ts` | Renamed. |
| `src/lib/permissions.ts` | `src/features/project/api/permissionsApi.ts` | Renamed. |
| `src/lib/resolveJoinCode.ts` | (DROPPED) | Per inventory §1.4 SHARED-V — viability has no join-code path. |

**Sub-steps:**
1. Copy verbatim, fix import paths within the moved files (e.g. `projectFactory.ts` imports `./types/projectTypes`).
2. Step 9 will rewire App.tsx to use the new locations — for now, just landing them in the new repo.
3. Verify `src/lib/calculations/` (from step 2) now typechecks. If not, the missing import is in this batch.

**Acceptance criteria:**
- [ ] `npm run typecheck` passes (no missing imports in `src/lib/calculations/`).
- [ ] `npm run build` passes.

**Commit:** `feat: import type model + shared utils (projectTypes, projectFactory, timeUtils, addressUtils, format, htmlEscape, uploadValidation, projectsApi, contentUploadsApi, permissionsApi)`

---

### Step 4 — Move tab content components

**Goal:** all 21 viability tab components in new repo at `src/features/project/pages/` + `src/features/project/components/`.

**Estimated time:** 3–4h

**Source:** `mojo_business/src/components/modules/*.tsx` (21 files)

**Target paths:**

| Source | Target | Rename? |
|---|---|---|
| `SimpleBreakEven.tsx` | `src/features/project/pages/SimpleBreakEvenPage.tsx` | Page suffix |
| `DetailedBreakEven.tsx` | `src/features/project/pages/DetailedBreakEvenPage.tsx` | Page suffix |
| `FitoutFinancing.tsx` | `src/features/project/pages/FitoutFinancingPage.tsx` | Page suffix |
| `FitoutFinancingColumn.tsx` | `src/features/project/components/FitoutFinancingColumn.tsx` | Component (used internally by FitoutFinancing) |
| `FitoutFinancingExisting.tsx` | `src/features/project/components/FitoutFinancingExisting.tsx` | Component |
| `FitoutFinancingNew.tsx` | `src/features/project/components/FitoutFinancingNew.tsx` | Component |
| `HoursOfOperation.tsx` | `src/features/project/pages/HoursOfOperationPage.tsx` | Page suffix |
| `VenueOpeningHours.tsx` | `src/features/project/components/VenueOpeningHours.tsx` | Sub-component |
| `SalesBreakup.tsx` | `src/features/project/pages/SalesBreakupPage.tsx` | Page suffix |
| `MenuBuilder.tsx` | `src/features/project/pages/ViabilityMenuBuilderPage.tsx` | **Rename** per pre-extraction punch list §6.2 |
| `LabourCosting.tsx` | `src/features/project/pages/LabourCostingPage.tsx` | Page suffix |
| `LinkParsingSection.tsx` | `src/features/project/components/LinkParsingSection.tsx` | Sub-component |
| `LocationSuitability.tsx` | `src/features/project/pages/LocationSuitabilityPage.tsx` | Page suffix |
| `SalesPredictions.tsx` | `src/features/project/pages/SalesPredictionsPage.tsx` | Page suffix |
| `BusinessPlanning.tsx` | `src/features/project/pages/BusinessPlanningPage.tsx` | Page suffix |
| `AIBusinessPlanBuilder.tsx` | `src/features/project/pages/AIBusinessPlanPage.tsx` | Renamed (drop "Builder") |
| `BusinessPlanBuilder.tsx` | `src/features/project/pages/BusinessPlanBuilderPage.tsx` | Page suffix |
| `ScenarioColumn.tsx` | `src/features/project/components/ScenarioColumn.tsx` | Sub-component |
| `ScenarioSelectionDialog.tsx` | `src/features/project/components/ScenarioSelectionDialog.tsx` | Sub-component |
| `ChangelogView.tsx` | (DROPPED) | Confirmed orphan per pre-extraction punch list §1 |

**Sub-steps:**
1. Move 20 files (skip orphan).
2. Rewrite imports in each file:
   - `@/lib/calculations/...` → unchanged (calc engines are at the same path)
   - `@/lib/types/projectTypes` → unchanged
   - `@/components/ui/...` → unchanged (ui primitives at same path)
   - `@/components/WalkthroughNavigation` → `@/features/project/components/WalkthroughNavigation` (lands in step 5)
   - `@/components/shared/HoursScheduleChart` → `@/components/shared/HoursScheduleChart` (ship with step 5)
   - `@/lib/format` → unchanged
   - `@/lib/projects` → `@/features/project/api/projectsApi` (renamed in step 3)
   - `@/lib/permissions` → `@/features/project/api/permissionsApi`
   - `@/lib/contentUploads` → `@/features/project/api/contentUploadsApi`
3. Inside `MenuBuilder.tsx` (now `ViabilityMenuBuilderPage.tsx`): if there's an exported component name `MenuBuilder`, rename to `ViabilityMenuBuilder` for clarity. Update any internal references.

**Acceptance criteria:**
- [ ] `npm run typecheck` passes (some imports may still fail if step 5 dependencies missing — acceptable for this commit, fix in step 5).
- [ ] No file references the dropped `ChangelogView.tsx`.

**Commit:** `feat: import 20 viability tab pages and sub-components (renamed MenuBuilder→ViabilityMenuBuilder, dropped ChangelogView orphan)`

**Subagent parallelisation note:** This step is mechanical enough to delegate to a subagent. Brief: "Move these 20 files from A to B with these import rewrites. Verify typecheck is no worse than baseline."

---

### Step 5 — Move shell + dialogs

**Goal:** viability-specific shell components (BusinessSnapshot, Sidebar, dialogs) in new repo. Tab pages from step 4 now have all their dependencies.

**Estimated time:** 2–3h

**Files to move:**

| Source | Target |
|---|---|
| `src/components/BusinessSnapshot.tsx` | `src/features/project/components/BusinessSnapshot.tsx` |
| `src/components/layout/Sidebar.tsx` | `src/features/project/components/ProjectSideNav.tsx` (renamed for clarity) |
| `src/components/NewProjectOriginDialog.tsx` | `src/features/project/components/NewProjectOriginDialog.tsx` |
| `src/components/SaveProjectCTA.tsx` | `src/features/project/components/SaveProjectCTA.tsx` |
| `src/components/SaveProjectValidationDialog.tsx` | `src/features/project/components/SaveProjectValidationDialog.tsx` |
| `src/components/SaveStatusIndicator.tsx` | `src/features/project/components/SaveStatusIndicator.tsx` |
| `src/components/ShareProjectDialog.tsx` | `src/features/project/components/ShareProjectDialog.tsx` |
| `src/components/ProjectManager.tsx` | (DROPPED — replaced by `<ProjectsListPage>` route in step 9) |
| `src/components/WalkthroughNavigation.tsx` | `src/features/project/components/WalkthroughNavigation.tsx` |
| `src/components/ContentUploadsPanel.tsx` | `src/features/project/components/ContentUploadsPanel.tsx` |
| `src/components/HelpDialog.tsx` | `src/features/project/components/HelpDialog.tsx` |
| `src/components/OnboardingTour.tsx` | `src/features/project/components/OnboardingTour.tsx` |
| `src/components/LoadingScreen.tsx` | `src/components/LoadingScreen.tsx` (top-level — used by App not just project) |
| `src/components/onboarding/GuestBanner.tsx` | `src/features/project/components/GuestBanner.tsx` |
| `src/components/shared/HoursScheduleChart.tsx` | `src/components/shared/HoursScheduleChart.tsx` (top-level shared) |

**Sub-steps:**
1. Move files. Some have sibling imports (`SaveProjectCTA` imports `SaveProjectValidationDialog`) — keep sibling-relative.
2. Rewrite cross-feature imports as in step 4.
3. Verify `WalkthroughNavigation` is imported by 6 tab pages from step 4 — those imports now resolve.

**Acceptance criteria:**
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.

**Commit:** `feat: import viability shell components and dialogs (renamed Sidebar→ProjectSideNav, dropped ProjectManager — superseded by /projects route)`

---

### Step 6 — Move landing + onboarding

**Goal:** public landing pages + simplified onboarding in new repo.

**Estimated time:** 2h

**Files to move:**

| Source | Target | Notes |
|---|---|---|
| `src/components/LandingPage.tsx` (root, 1393 LOC) | (DROPPED) | Per anatomy §3.3 — `LandingPage1` supersedes; legacy LandingPage is the activeView=`landing` orphan code path. |
| `src/components/landing/LandingPage.tsx` (833 LOC) | (DROPPED) | Confirmed orphan per pre-extraction punch list §1. |
| `src/components/landing/LandingPage1.tsx` | `src/pages/LandingPage.tsx` | Active landing — rename to drop the `1` suffix. |
| `src/components/landing/LandingPage2.tsx` (583 LOC) | (DROPPED) | Confirmed orphan. |
| `src/components/landing/HowItWorksPage.tsx` | `src/pages/HowItWorksPage.tsx` |  |
| `src/components/landing/LandingHeader.tsx` | `src/components/LandingHeader.tsx` (top-level) | Used by all 3 landing pages. |
| `src/components/landing/ReachOutPage.tsx` | `src/pages/ReachOutPage.tsx` |  |
| `src/components/onboarding/PathSelector.tsx` | (DROPPED) | Per anatomy §2.4 — viability has only one path. |
| `src/components/onboarding/ViabilityPath.tsx` | `src/pages/StartPage.tsx` | Renamed; this is the "guest vs sign up" decision page. |
| `src/components/onboarding/WebsiteIntent.tsx` | (DROPPED) | Websites concern. |
| `src/components/onboarding/WebsiteSetupWizard.tsx` | (DROPPED) | Websites concern. |
| `src/components/OnboardingWelcome.tsx` | (DROPPED) | 360 onboarding (creates a business). |
| `src/components/HospoOSModal.tsx` | `src/components/HospoOSModal.tsx` (top-level) | Per Q7 — keep Hospo OS waitlist on viability landing. |
| `src/components/HospoOSBanner.tsx` | (DROPPED if unused, otherwise top-level) | Verify importer count first. |
| `src/components/AdminPanel.tsx` | (DROPPED) | Per Q3 — admin panel stays in mojo_business. |
| `src/pages/PrivacyPage.tsx` | `src/pages/PrivacyPage.tsx` |  |
| `src/pages/TermsPage.tsx` | `src/pages/TermsPage.tsx` |  |

**Sub-steps:**
1. Move active files; drop the 6 dropped files.
2. In `LandingPage.tsx` (was `LandingPage1`): rename internal references from `LandingPage1` to `LandingPage`. Update prop signatures if needed.
3. Verify `LandingHeader.tsx` is consumed by all 3 landing pages.

**Acceptance criteria:**
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] All 3 landing pages plus `<StartPage>` render in isolation (smoke-test via temporary route at this stage if convenient — or defer to step 9).

**Commit:** `feat: import landing pages (LandingPage1→LandingPage, ViabilityPath→StartPage), drop orphans + 360-only onboarding components`

---

### Step 7 — Move export pipeline

**Goal:** export functionality (PDF/Excel/JSON business plan generation) in new repo.

**Estimated time:** 2–3h

**Files to move:**

| Source | Target |
|---|---|
| `src/lib/export.ts` (555 LOC, simple-export) | `src/lib/export.ts` |
| `src/lib/export/index.ts` | `src/lib/export/index.ts` |
| `src/lib/export/exportDataBuilder.ts` | `src/lib/export/exportDataBuilder.ts` |
| `src/lib/export/exportToPDF.ts` | `src/lib/export/exportToPDF.ts` |
| `src/lib/export/exportToExcel.ts` | `src/lib/export/exportToExcel.ts` |
| `src/lib/export/exportBusinessPlan.ts` | `src/lib/export/exportBusinessPlan.ts` |
| `src/lib/export/printHtmlBuilder.ts` | `src/lib/export/printHtmlBuilder.ts` |
| `src/lib/export/chartToImage.ts` | `src/lib/export/chartToImage.ts` |
| `src/lib/export/hoursChartSvgRenderer.ts` | `src/lib/export/hoursChartSvgRenderer.ts` |

**Sub-steps:**
1. Copy verbatim. All sibling-relative imports within `lib/export/` resolve.
2. External imports: `../types/projectTypes`, `../calculations/...`, `../format` — all already moved.
3. **Verify `html2canvas` resolves** — `import html2canvas from 'html2canvas'` typechecks. Per pre-extraction punch list §4, the new repo's package.json should already declare `html2canvas` explicitly.
4. **Decision moment:** the two files (`lib/export.ts` + `lib/export/index.ts`) coexist by design (per pre-extraction punch list §1 correction). Decision: leave both as-is for Phase 2; consolidate in a follow-up. Don't try to merge during extraction.

**Acceptance criteria:**
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Bundle size sanity-check: `dist/` after build is ~comparable to mojo_business's. Significant deviation indicates a missed dep or duplicate inclusion.

**Commit:** `feat: import export pipeline (lib/export.ts + lib/export/* — 8 files)`

---

### Step 8 — Move hooks

**Goal:** custom hooks in new repo.

**Estimated time:** 30 min

**Files to move:**

| Source | Target |
|---|---|
| `src/hooks/useAutoSave.ts` | `src/features/project/hooks/useProjectAutoSave.ts` (renamed for clarity — per anatomy §6.3) |
| `src/hooks/useKeyboardShortcuts.ts` | `src/hooks/useKeyboardShortcuts.ts` |

**Sub-steps:**
1. Move + rename.
2. The autosave hook will be re-wired during step 9 to live at `<ProjectLayout>` level (per anatomy §6.2 risk mitigation).

**Acceptance criteria:**
- [ ] `npm run typecheck` passes.

**Commit:** `feat: import hooks (useAutoSave→useProjectAutoSave, useKeyboardShortcuts)`

**Step 1–8 checkpoint:** at this point, all the V-ONLY files are in the new repo, typecheck passes, build passes. **No App.tsx exists yet** — the next step authors it from scratch.

---

### Step 9 — Re-author App.tsx as Router

**Goal:** the structural rewrite. Replace the legacy App.tsx fallback with React Router. This is the 8.5–11h step per [`app-tsx-anatomy.md` §7](./app-tsx-anatomy.md).

**Estimated time:** 8.5–11h

**Reference:** anatomy doc — read it end-to-end before starting.

**Sub-steps (per anatomy §7):**

#### 9.1 — Router shell + provider tree (0.5–1h)

Author `src/App.tsx`:
```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { QueryProvider, ThemeProvider, ToastProvider, AuthProvider } from './app/providers';

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
```

Note: no `<OrgProvider>` (no businesses concept in viability standalone).

Author `src/app/router.tsx` with the route tree per anatomy §4.2 + the public landing routes from step 6.

#### 9.2 — Public layout + 4 public routes (1–1.5h)

```
/                       → <LandingPage>
/how-it-works           → <HowItWorksPage>
/reach-out              → <ReachOutPage>
/start                  → <StartPage>  (was ViabilityPath)
/welcome                → <WelcomePage>  (simplified showNamePrompt — anatomy §1.4 / pre-extraction punch list §5)
/login                  → <LoginPage>  (new — replaces AuthDialog modal)
/signup                 → <SignupPage>  (new)
/privacy                → <PrivacyPage>
/terms                  → <TermsPage>
/project/accept-invite  → <InviteAcceptancePage>  (was inviteToken branch)
```

`<PublicLayout>` wraps the landing routes (header + main + footer). Login/signup/welcome/terms/privacy can be standalone (no shared chrome).

#### 9.3 — `<ProjectLayout>` (1–1.5h)

Per anatomy §1.1–§1.4, this is what was App.tsx lines 1696–2009 minus the tab content. Component shape:

```tsx
function ProjectLayout() {
  const { id } = useParams();
  const { data: project } = useProject(id);
  const { data: permissions } = useProjectPermissions(id);

  return (
    <div className="bg-background text-foreground" style={{ height: '100vh', ... }}>
      <ViabilityHeader project={project} />
      {isGuest && <GuestBanner />}
      <div style={{ display: 'flex', flex: 1 }}>
        <ProjectSideNav projectId={id} permissions={permissions} />
        <main style={{ flex: 1, ... }}>
          <ProjectSubHeader project={project} />
          <BusinessSnapshot projectData={project.data} />
          <Outlet />
          <SaveProjectCTA projectId={id} project={project} />
        </main>
      </div>
      {/* Dialogs portal-mounted at this level: */}
      <EditProjectSettingsDialog />
      <ExportDialog />
      <ShareProjectDialog />
      <HelpDialog />
      <OnboardingTour />
      <Toaster />
    </div>
  );
}
```

Routes nested under `<ProjectLayout>`:
```
/project/:id                       → <ProjectLayout>  (redirects to break-even)
  /break-even                      → <SimpleBreakEvenPage>
  /break-even/detailed             → <DetailedBreakEvenPage>
  /financing                       → <FitoutFinancingPage>
  /hours                           → <HoursOfOperationPage>
  /sales                           → <SalesBreakupPage>
  /menu-builder                    → <ViabilityMenuBuilderPage>
  /labour                          → <LabourCostingPage>
  /location                        → <LocationSuitabilityPage>
  /predictions                     → <SalesPredictionsPage>
  /plan                            → <BusinessPlanningPage>
  /ai-plan                         → <AIBusinessPlanPage>
  /plan-builder                    → <BusinessPlanBuilderPage>
```

#### 9.4 — `useProject` query + `useProjectAutoSave` hook + cross-section sync (1.5–2h)

**Critical risk per anatomy §6.1.** Implementation:

```ts
// src/features/project/hooks/useProject.ts
export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    staleTime: Infinity,
  });
}

// src/features/project/hooks/useUpdateProjectData.ts
export function useUpdateProjectData(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ProjectData>) => {
      // Apply cross-section sync before writing
      const current = queryClient.getQueryData(['project', id]);
      const patched = applyCrossSectionSync(current.data, patch);
      return updateProject(id, current.name, patched);
    },
    onMutate: (patch) => {
      // Optimistic update
      queryClient.setQueryData(['project', id], (old) => ({
        ...old,
        data: applyCrossSectionSync(old.data, patch),
      }));
    },
  });
}

// src/features/project/lib/crossSectionSync.ts
// Lifted from App.tsx handleFitoutFinancingUpdate + handleDetailedBreakEvenUpdate
export function applyCrossSectionSync(
  current: ProjectData,
  patch: Partial<ProjectData>,
): ProjectData {
  // ... bidirectional fitoutFinancing ↔ detailedBreakEven sync
}
```

**Test:** unit test the sync function with both directions. The legacy logic was in App.tsx — port it byte-for-byte to start, refactor only after extraction is stable.

**Autosave at `<ProjectLayout>` level** per anatomy §6.2 mitigation. Hook reads the cached project from React Query, fires update mutation when data changes (debounced).

#### 9.5 — `useExportProject` + dialogs lifted (0.5–1h)

Lift `handleExport` decision tree (anatomy §3.2) into `useExportProject()`. Pages call it with current project; hook returns the right next-action (export-dialog | save-first | name-first).

#### 9.6 — Project lifecycle dialogs (0.5h)

`<EditProjectSettingsDialog>`, `<NewProjectOriginDialog>`, `<ShareProjectDialog>` — straight relocate from App.tsx render with form state via react-hook-form.

#### 9.7 — `<WelcomePage>` route (0.5–1h)

Simplified per pre-extraction punch list §5.2. New file `src/pages/WelcomePage.tsx`:
- Form fields: first_name, last_name, venue_type, town, timeline
- Submit: write to `profiles`, navigate to `/projects`
- Guard: `<RequireWelcomeComplete>` redirects to `/welcome` when name fields are missing

#### 9.8 — `<InviteAcceptancePage>` + redirect chain (0.5h)

Per anatomy §6.3 mitigation. Route loader reads `?token=...`, persists to context, calls `<InviteAcceptance>` component (existing logic). If user unauthed, redirect to `/login?from=invite&token=...`; after auth return to `/project/accept-invite?token=...`.

#### 9.9 — Guest mode (0.5–1h)

Per anatomy §6.4 mitigation:
- `<GuestModeProvider>` context with `isGuest` flag
- LocalStorage-keyed draft project: when guest creates a draft, save to `localStorage[draftKey]`
- `<SignupPage>` mount effect: read draft, capture into local state, on success call `useCreateProjectFromDraft()` mutation
- Test: guest → fills break-even values → click "Sign up" → completes signup → arrives at `/project/{newId}/break-even` with values preserved

#### 9.10 — `<ProjectsListPage>` route (replaces `ProjectManager` modal) (0.5h)

```
/projects   → <ProjectsListPage>  (lists user's saved projects)
```

Component reads `useProjects()` query for `business_scenarios` where `user_id = auth.uid()`. Click row → `navigate('/project/:id/break-even')`. New project button → `<NewProjectOriginDialog>`.

#### 9.11 — Browser smoke + bug-fixing (1h)

Smoke test plan per §5 below. Fix any surfaced issues.

**Acceptance criteria:**
- [ ] All 12 tab routes render with the right component.
- [ ] Save/load/share/export work end-to-end.
- [ ] Cross-section sync works (test fitout → detailed and detailed → fitout).
- [ ] Autosave fires on field change, status indicator shows "Saved".
- [ ] Period selector scales values across simple + detailed break-even.
- [ ] Guest flow: try-as-guest → fill → sign-up → values preserved.
- [ ] Invite-token URL: unauthed → login redirect → return → project loads.
- [ ] Logout → land on `/`.
- [ ] `npm run build` passes.

**Commit:** `feat: re-author App.tsx as Router (12 project routes + public landings + welcome + signup/login + invite acceptance + guest mode)`

(Or split into multiple commits per sub-step 9.1–9.10 for cleaner history. Recommend split.)

---

### Step 10 — DB migrations + cleanup

**Goal:** new repo's migration baseline established. Mojo 360 stops touching viability tables.

**Estimated time:** 1h

**Sub-steps:**

1. **Establish baseline** in new repo: `supabase/migrations/00000000000000_baseline.sql` containing the current schema for the 4 V-ONLY tables (`business_scenarios`, `project_invites`, `project_content_uploads`, `collaborators`) + 9 V-ONLY RPCs + `project-uploads` storage bucket + RLS policies.
2. **Drop dead super_admin policy** per pre-extraction punch list §2:
   ```sql
   DROP POLICY "Super users can read all business scenarios" ON business_scenarios;
   ```
3. **Drop duplicate `is_project_owner_check` RPCs** per pre-extraction punch list §3:
   ```sql
   DROP FUNCTION IF EXISTS is_project_owner_check(uuid);
   DROP FUNCTION IF EXISTS is_project_owner_check(uuid, uuid);
   ```
4. **Add `business_id` column** per Q2:
   ```sql
   ALTER TABLE business_scenarios
     ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE SET NULL;
   CREATE INDEX idx_business_scenarios_business_id
     ON business_scenarios(business_id) WHERE business_id IS NOT NULL;
   ```
5. **Decision moment:** include Phase 2.5 schema (`archived_at` column + RLS policies) in this migration, or defer to Phase 2.5 dedicated migration?
   - **Bundle (recommended):** ship the Phase 2.5 schema now. Reduces migration count, keeps related changes together.
   - **Defer:** ship pure Phase 2 schema, leave Phase 2.5 schema for that session.
   - Recommendation: **bundle.** The schema additions are cheap and Phase 2.5's UI work shouldn't block on a schema migration.
6. **Confirm cost** with Max before applying any of these to live Supabase (the changes are non-destructive: ADD COLUMN, DROP unused functions/policies — but confirm anyway).
7. **Apply migration to live Supabase** via `mcp__claude_ai_Supabase__apply_migration`.
8. **Verify advisor pass** — run Supabase advisor; should show no new warnings.

**Acceptance criteria:**
- [ ] Migration files committed to new repo.
- [ ] Migration applied to live Supabase.
- [ ] `pg_policies` query confirms dead super_admin policy gone.
- [ ] `pg_proc` query confirms `is_project_owner_check` functions gone.
- [ ] `business_scenarios` has `business_id` column.
- [ ] (If bundled) `business_scenarios` has `archived_at` column + new RLS policies.
- [ ] `npm run build` in new repo passes.

**Commit (in new repo):** `feat: establish viability schema baseline + drop dead super_admin policy + add business_id column + Phase 2.5 schema additions`

---

### Step 11 — Browser smoke (live)

**Goal:** end-to-end verification on the new repo serving from a Vercel preview URL (or temporary mojobusiness.ai cutover, depending on DNS plan).

**Estimated time:** 2–3h

**Pre-conditions:**
- Step 10 migrations applied to live Supabase.
- Vercel preview URL (or staging DNS) reachable.
- A test user account in `auth.users` (existing test accounts work — they're in the same Supabase project per Q1).

**Smoke test plan:** see §5 below.

**Acceptance criteria:**
- [ ] All §5 smoke tests pass.
- [ ] No console errors in the browser during normal usage.
- [ ] Network panel shows expected requests (no 401s on legitimate calls, no CORS errors).

**No commit** — verification only. If issues surface, fix and commit; loop.

---

### Step 12 — Mojo 360 cleanup

**Goal:** delete all viability code from mojo_business. After this lands, viability lives entirely in the new repo.

**Estimated time:** 2–3h

**This step happens IN `mojo_business`, not the new repo.** Branch from main: `viability-cleanup`.

**Files to delete:**

```bash
# Tab content components (21 files — minus orphans already deleted in pre-extraction)
git rm src/components/modules/SimpleBreakEven.tsx
git rm src/components/modules/DetailedBreakEven.tsx
git rm src/components/modules/FitoutFinancing.tsx
git rm src/components/modules/FitoutFinancingColumn.tsx
git rm src/components/modules/FitoutFinancingExisting.tsx
git rm src/components/modules/FitoutFinancingNew.tsx
git rm src/components/modules/HoursOfOperation.tsx
git rm src/components/modules/VenueOpeningHours.tsx
git rm src/components/modules/SalesBreakup.tsx
git rm src/components/modules/MenuBuilder.tsx
git rm src/components/modules/LabourCosting.tsx
git rm src/components/modules/LinkParsingSection.tsx
git rm src/components/modules/LocationSuitability.tsx
git rm src/components/modules/SalesPredictions.tsx
git rm src/components/modules/BusinessPlanning.tsx
git rm src/components/modules/AIBusinessPlanBuilder.tsx
git rm src/components/modules/BusinessPlanBuilder.tsx
git rm src/components/modules/ScenarioColumn.tsx
git rm src/components/modules/ScenarioSelectionDialog.tsx

# Calculation engines (15 — but mojoFitScore stays per Q3)
git rm src/lib/calculations/businessPlanGenerator.ts
git rm src/lib/calculations/businessPlanReadiness.ts
git rm src/lib/calculations/dataSourceSelector.ts
git rm src/lib/calculations/forecastEngine.ts
git rm src/lib/calculations/holidayBumpProfiles.ts
git rm src/lib/calculations/hourlyBenchmarks.ts
git rm src/lib/calculations/insightsEngine.ts
git rm src/lib/calculations/locationSuitability.ts
git rm src/lib/calculations/orderSourceFees.ts
git rm src/lib/calculations/projectSummary.ts
git rm src/lib/calculations/seasonalityProfiles.ts
git rm src/lib/calculations/summaryViability.ts
git rm src/lib/calculations/weeklyForecastEngine.ts
# Note: mojoFitScore.ts STAYS per Q3 — used by buildLead for admin lead scoring

# Shell + dialogs
git rm src/components/BusinessSnapshot.tsx
git rm src/components/layout/Sidebar.tsx
git rm src/components/NewProjectOriginDialog.tsx
git rm src/components/SaveProjectCTA.tsx
git rm src/components/SaveProjectValidationDialog.tsx
git rm src/components/SaveStatusIndicator.tsx
git rm src/components/ShareProjectDialog.tsx
git rm src/components/ProjectManager.tsx
git rm src/components/WalkthroughNavigation.tsx
git rm src/components/ContentUploadsPanel.tsx
git rm src/components/HelpDialog.tsx
git rm src/components/OnboardingTour.tsx
git rm src/components/LoadingScreen.tsx  # CHECK FIRST — does mojo_business use this or shared/components/ui/LoadingScreen.tsx?
git rm src/components/onboarding/GuestBanner.tsx
git rm src/components/onboarding/PathSelector.tsx
git rm src/components/onboarding/ViabilityPath.tsx

# Landing
git rm src/components/LandingPage.tsx  # the root one used by App.tsx fallback
git rm src/components/landing/LandingPage.tsx  # already deleted in pre-extraction
git rm src/components/landing/LandingPage1.tsx
git rm src/components/landing/LandingPage2.tsx  # already deleted in pre-extraction
git rm src/components/landing/HowItWorksPage.tsx
git rm src/components/landing/ReachOutPage.tsx
# LandingHeader stays IF Mojo Websites onboarding still uses it (per inventory §1.3)

# Lib
git rm src/lib/projects.ts
git rm src/lib/permissions.ts
git rm src/lib/contentUploads.ts
# projectFactory.ts stays IF anywhere uses it post-extraction (likely no; verify)
git rm src/lib/projectFactory.ts  # if grep confirms 0 importers post-deletion
# projectTypes.ts: per Q4, mojo_business keeps a stripped read-only copy for MojoAdminPanel
# Verify: grep -rn "projectTypes" src/ — if any non-AdminPanel/MojoAdminPanel imports remain, audit
# Recommended: replace src/lib/types/projectTypes.ts (551 LOC) with a stripped ~80 LOC version containing
# only ProjectData + BusinessOrigin types

# Hooks
git rm src/hooks/useAutoSave.ts
git rm src/hooks/useKeyboardShortcuts.ts

# Export pipeline
git rm src/lib/export.ts
git rm -r src/lib/export/

# AdminPanel STAYS in mojo_business per Q3 — DO NOT delete

# App.tsx — major surgery
# Delete lines 1696–2469 (the viability fallback ~774 LOC)
# Delete state slices for projectId, projectName, projectData, activeTab, projectPermissions,
#   isGuest, all signup* fields, onboardingProfile, pendingOnboardingProfile, etc.
# Delete handlers handleSaveProject, handleLoadProject, handleNewProject, handleProjectLoaded,
#   handleFitoutFinancingUpdate, handleDetailedBreakEvenUpdate, handleRenameProject, confirmRename,
#   handleExport, exportExcel/PDF/JSON/SimplePDF/SimpleExcel, confirmBusinessNameAndExport, confirmExit,
#   resetSignupForm, handleSaveName, handlePathSelection
# Delete useAutoSave hook call
# Delete useKeyboardShortcuts hook call
# Delete useLoadScript Google Maps hook call
# Delete `if (activeView === 'viability')` branch — collapsed since fallback is gone
# Delete imports for: SimpleBreakEven, DetailedBreakEven, etc. (~20 viability imports)
# Delete the ActiveView 'viability' enum value
# Once foundation rebuild is fully cutover via main.tsx → routes.tsx, App.tsx itself may be deletable.
# Verify: is App.tsx still the entry point or is main.tsx routing through src/app/routes.tsx now?
# If the latter: delete App.tsx entirely.
```

**Sub-steps:**
1. Branch `viability-cleanup` from `main`.
2. Delete files per the list above. Be cautious about LoadingScreen + LandingHeader — verify importer count after each batch.
3. Update `package.json` — remove `html2canvas` (transitive will go via `npm prune`). Verify other deps still needed:
   - `@react-google-maps/api` — still needed (used by org/VenueSettings, people-manager)
   - `jspdf`, `jspdf-autotable` — still needed (used by budget-forecaster, people-manager)
   - `exceljs` — still needed (used by menu, admin, budget, people)
4. Update [`projectTypes.ts`](../../src/lib/types/projectTypes.ts) — replace with stripped ~80 LOC version per Q4.
5. **Wire up `/hub/viability` to a "see your assessments at mojobusiness.ai" placeholder** — quick interim card. The Phase 2.5 list view replaces this later. Don't leave the route 404'ing.
6. Update [`MOJO_360_PLAN.md`](../MOJO_360_PLAN.md) — note viability extracted; remove from the "still to migrate" list if it's there.
7. Update [`REBUILD_DEFERRED.md`](../REBUILD_DEFERRED.md) — mark the entry as resolved by extraction (already did via [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) — verify the cross-link is current).
8. `npm run typecheck` — must pass cleanly. If it fails, the dependency map was incomplete somewhere. Fix incrementally.
9. `npm run build` — must pass.
10. Manual smoke: open mojo_business locally, sign in, navigate the hub — verify all 360 features still work.

**Acceptance criteria:**
- [ ] All 51 V-ONLY files deleted (or comparable count after the V-ONLY-vs-SHARED-V audit).
- [ ] `mojoFitScore.ts` + `lib/admin/buildLead.ts` + `AdminPanel.tsx` STILL EXIST (per Q3).
- [ ] Stripped `projectTypes.ts` exists with ~80 LOC.
- [ ] `/hub/viability` shows interim placeholder ("See your assessments at mojobusiness.ai" + Phase 2.5 stub).
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Manual smoke of all 12 360 features (cash, org, menu, marketing, ops, dashboard, finance, people, websites, integrations, advisor, settings) — all green.

**PR:** `chore: remove viability — extracted to mojo_viability`

**DO NOT MERGE** until the new repo is live at mojobusiness.ai. The cleanup PR is destructive — if rolled back, viability code is gone from mojo_business and the new repo is the only source of truth.

---

## 4. Per-step verification commands

Run these at the end of each step:

```bash
# In new repo
npm run typecheck      # must pass
npm run build          # must pass
npm run dev            # spot-check the affected routes manually

# In mojo_business (only step 12)
npm run typecheck
npm run build
npm run dev            # smoke all 12 360 features
```

After step 10 (DB migrations):
```sql
-- Verify dead super_admin policy gone
SELECT COUNT(*) FROM pg_policies
  WHERE tablename = 'business_scenarios'
    AND policyname = 'Super users can read all business scenarios';
-- Expected: 0

-- Verify duplicate is_project_owner_check RPCs gone
SELECT COUNT(*) FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname = 'is_project_owner_check';
-- Expected: 0

-- Verify business_id column added
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'business_scenarios' AND column_name = 'business_id';
-- Expected: 1 row

-- Phase 2.5 schema (if bundled)
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'business_scenarios' AND column_name = 'archived_at';
-- Expected: 1 row
```

---

## 5. Browser smoke test plan

Run after step 9 in dev (`npm run dev`) and after step 11 in Vercel preview.

### 5.1 — Public flows

| # | Flow | Expected |
|---|---|---|
| P1 | Visit `/` | Landing page renders with hero + CTAs. |
| P2 | Click "How it works" | `/how-it-works` route renders. |
| P3 | Click "Reach out" | `/reach-out` route renders. |
| P4 | Click "Get Started" (unauthed) | Lands on `/start` (the simplified ViabilityPath). |
| P5 | Click "Try as guest" | Lands at `/project/{guestId}/break-even` with default values. |
| P6 | Click "Create account" from `/start` | Lands at `/signup`. |
| P7 | Visit `/privacy` | Privacy page renders. |
| P8 | Visit `/terms` | Terms page renders. |

### 5.2 — Auth flows

| # | Flow | Expected |
|---|---|---|
| A1 | Sign up new user | Lands on `/welcome` with name/venue/town/timeline form. |
| A2 | Submit welcome form | Lands on `/projects` (empty state — "no projects yet"). |
| A3 | Existing user signs in | Bypasses `/welcome` (profile already populated), lands on `/projects`. |
| A4 | Sign out from header | Lands on `/`. |
| A5 | Visit `/login?from=invite&token=abc123` after auth | Returns to `/project/accept-invite?token=abc123`. |

### 5.3 — Project lifecycle

| # | Flow | Expected |
|---|---|---|
| L1 | Click "New project" from `/projects` | `<NewProjectOriginDialog>` opens. |
| L2 | Choose origin "New venue" | Lands on `/project/{newId}/break-even` with empty data. |
| L3 | Fill simple break-even fields | Save status indicator shows "Saving..." then "Saved". |
| L4 | Refresh page | Values persist. |
| L5 | Open project from `/projects` list | Lands on `/project/{id}/break-even` with saved values. |
| L6 | Click pencil icon to edit project name | Edit dialog opens. Save updates name + locality + venue type. |
| L7 | Click sidebar "New project" while editing | If unsaved changes, prompt? (Per anatomy §6.6, default to no prompt — trust autosave.) |
| L8 | Delete project (if implemented this phase) | Returns to `/projects`. Project gone. |

### 5.4 — Tab navigation

| # | Flow | Expected |
|---|---|---|
| T1 | Click "Detailed Break-Even" sidebar | URL → `/project/:id/break-even/detailed`. Component renders. |
| T2 | Click "Hours of Operation" | URL → `/project/:id/hours`. Component renders. |
| T3 | Cycle through all 12 tabs | Each route renders correct component without console errors. |
| T4 | Browser back from `/labour` | Returns to previous tab (whatever was visited before). |
| T5 | Hard refresh on `/project/:id/predictions` | Lands on the same tab — URL is source of truth. |

### 5.5 — Cross-section sync (high-risk, per anatomy §6.1)

| # | Flow | Expected |
|---|---|---|
| C1 | On `/financing`, change scenario1 occupancyType from 'renting' to 'purchasing' | Save fires. |
| C2 | Navigate to `/break-even/detailed` | scenario1 occupancyType shows 'purchasing'. |
| C3 | On `/break-even/detailed`, change scenario1 propertyDeposit | Save fires. |
| C4 | Navigate to `/financing` | scenario1 propertyDeposit shows the updated value. |
| C5 | Verify no infinite update loop in console | No "Maximum update depth exceeded" errors. |

### 5.6 — Period scaling

| # | Flow | Expected |
|---|---|---|
| Pe1 | On `/break-even`, with period=Monthly, simpleBreakEven.enteredSales=50000 | Field shows 50000. |
| Pe2 | Change period to Yearly | enteredSales scales to 50000 × 12 = 600000. |
| Pe3 | Change period to Weekly | enteredSales scales to 600000 / 52 ≈ 11538. |
| Pe4 | Verify variableCogs (a percent) does NOT scale | Stays at 30.0. |

### 5.7 — Save / Share / Export

| # | Flow | Expected |
|---|---|---|
| S1 | New project unsaved → click Export | "Save before exporting" dialog. |
| S2 | Saved project → click Export | Export choice dialog (Excel/PDF/JSON). |
| S3 | Click Excel | Downloads `.xlsx` file. Open it — has data. |
| S4 | Click PDF | Downloads `.pdf` file. Open it — has data + viability narrative. |
| S5 | Click Share | Share dialog opens with token + invite UI. |
| S6 | Generate share link | URL `/project/accept-invite?token=...` works in incognito (after login). |
| S7 | Guest mode → click Export | "Save Simple Break-Even" subset dialog (PDF/Excel). |

### 5.8 — Guest flow (high-risk, per anatomy §6.4)

| # | Flow | Expected |
|---|---|---|
| G1 | Visit `/start` → "Try as guest" | Lands at `/project/{guestId}/break-even`. |
| G2 | Fill simple break-even fields | localStorage gets a draft entry. |
| G3 | Click "Create account" CTA in GuestBanner | Lands at `/signup`. |
| G4 | Complete signup | Lands at `/welcome` → fill profile → `/project/{newRealId}/break-even`. |
| G5 | Verify break-even values from G2 are still present | Values match. |
| G6 | Refresh page | Values persist (now in DB, no longer in localStorage). |

### 5.9 — Invite flow (high-risk, per anatomy §6.3)

| # | Flow | Expected |
|---|---|---|
| I1 | Authed user generates share link from `/project/:id` | Link includes `?token=abc`. |
| I2 | Different user (incognito) opens link | Auth gate → login → returns to `/project/accept-invite?token=abc` → invite resolves → lands on `/project/:id/break-even`. |
| I3 | Same as I1 but recipient already authed | Goes straight to invite-acceptance → lands on `/project/:id/break-even`. |

---

## 6. Rollback strategy

### 6.1 — During Phase 2 execution

If a step fails badly:
- Steps 1–8: just `git reset --hard <previous-commit>` and retry. Pure file moves.
- Step 9: largest risk. Commit per sub-step (9.1, 9.2, ...) so rollback is granular.
- Step 10: Supabase migrations. Each migration must be reversible — write a `down.sql` for each. If applied to live and broken: apply the down.sql immediately.
- Step 11: just smoke; no state to roll back.
- Step 12: branch is unmerged; just delete the branch.

### 6.2 — After Phase 2 ships

Mojo 360 cleanup PR is the most destructive single change. Don't merge until:
- New repo live at mojobusiness.ai (or staging URL with full smoke green).
- 1-week soak: monitor errors, customer feedback, support tickets.
- Phase 2.5 not started yet — keeps blast radius small.

If a critical bug surfaces in viability after the cleanup PR merges:
- The new repo has the code; mojo_business doesn't. Bug fix lives in the new repo.
- If the bug is severe enough to need a temporary mojo_business hosting fallback: revert the cleanup PR. The viability code returns to mojo_business as a temporary fallback. Fix the bug in the new repo. Re-merge the cleanup PR when stable.

### 6.3 — Long-term

After 30 days post-Phase-2, the cleanup PR's reverting risk drops to near-zero. Treat as permanent.

---

## 7. Stop conditions

If any of these surface during execution, halt and surface to Max:

1. **Step 1: bootstrap fails** — Vite scaffold, Supabase auth, or Tailwind setup blocks. Likely environment / Node version issue. Fix locally before proceeding.
2. **Step 4 or 5: typecheck cascade** — moving a single file surfaces 50+ typecheck errors across unrelated files. Indicates a missed shared dependency. Stop, audit, fix root.
3. **Step 9.4: cross-section sync infinite loop** — `applyCrossSectionSync` triggers React Query update which triggers another sync which... If "Maximum update depth exceeded" surfaces, halt and rewrite the sync to be idempotent.
4. **Step 9.9: guest draft loss after signup** — values from G2 not present at G5. Halt; re-architect the localStorage hand-off until values preserve reliably.
5. **Step 10: migration applies but breaks RLS** — Supabase advisor surfaces new warnings, or smoke test fails on a permission error. Halt; revert migration; investigate.
6. **Step 11: smoke fails on a flow that worked in legacy** — record the flow + reproduction steps. Don't proceed to step 12 with unresolved smoke failures.
7. **Step 12: typecheck fails after a deletion** — a "viability" file turned out to have a non-viability importer we missed. Restore the file; audit the importer; recategorise.
8. **DNS issue** — `mojobusiness.ai` doesn't resolve to the new Vercel project, or HTTPS fails. Halt step 11; fix DNS before further verification.

For all stop conditions: capture the issue in `context/viability-extraction/phase-2-blockers.md` (or similar) and surface to Max in chat.

---

## 8. Hand-off to Phase 2.5

After Phase 2 step 12 PR merges, the path opens for Phase 2.5 (the `/hub/viability` list view per [`phase-2.5-hub-viability-spec.md`](./phase-2.5-hub-viability-spec.md)).

**Preconditions for Phase 2.5 start:**
- [ ] mojo_business cleanup PR merged.
- [ ] mojobusiness.ai serves the new repo.
- [ ] At least one test viability scenario has `business_id` set to a 360 business (manually if needed for smoke).
- [ ] Q11 decisions made (especially Q11.1 archive duration).

**Then:**
- Phase 2.5 main scope (~5–7h) — `<ViabilityListPage>` + RLS + smoke.
- Phase 2.5 follow-ups (~4–6h, separate sessions) — auto-purge edge function, account dormancy.

---

## 9. Estimated total time (Phase 2)

| Step | Hours (low) | Hours (high) |
|---|---:|---:|
| 1. Bootstrap | 2 | 3 |
| 2. Calculation engines | 1 | 1 |
| 3. Type model + utils | 1 | 2 |
| 4. Tab components | 3 | 4 |
| 5. Shell + dialogs | 2 | 3 |
| 6. Landing + onboarding | 2 | 2 |
| 7. Export pipeline | 2 | 3 |
| 8. Hooks | 0.5 | 1 |
| 9. App.tsx → Router | 8.5 | 11 |
| 10. DB migrations + cleanup | 1 | 1 |
| 11. Browser smoke | 2 | 3 |
| 12. Mojo 360 cleanup | 2 | 3 |
| **TOTAL** | **~27h** | **~37h** |

**~3.5–5 focused-engineer days.** Spread across calendar ~1–2 weeks if shared with other work.

---

## 10. Stand-down

Phase 2 implementation plan complete. Five docs now sit in [`context/viability-extraction/`](.):

1. [`inventory.md`](./inventory.md) — what exists
2. [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) — locked architectural decisions
3. [`app-tsx-anatomy.md`](./app-tsx-anatomy.md) — the App.tsx rewrite map
4. [`pre-extraction-punch-list.md`](./pre-extraction-punch-list.md) — pre-Phase-2 cleanups
5. [`phase-2.5-hub-viability-spec.md`](./phase-2.5-hub-viability-spec.md) — what 360 builds after
6. **`phase-2-implementation-plan.md`** (this doc) — how Phase 2 actually executes

Remaining doc work this session could do (in priority order, but the user has not requested):
- Q2 conversion data mapping (`ProjectData.data` jsonb → 360 table seed flow)
- Phase 2 retrospective template (for post-execution learnings)

Phase 2 execution can begin once the foundation rebuild merges. Estimated calendar: ~mid-May.
