# Mojo Viability Handover — 2026-05-10 (Step 9b)

## Session Summary

Step 9b — project shell composition. `ProjectLayout` filled out from bare-bones `<Outlet />` host into a full chrome shell: top header, fixed sidebar, sub-header (name + edit button + period text + save status), BusinessSnapshot above Outlet, SaveProjectCTA, and 5 dialogs. 3 new chrome-rendering hooks added (`useProjectPermissions`, `useRenameProject`, `useSaveProject`); 2 hooks (`useUpdateProjectData`, `useUpdateProjectPeriod`) and the cross-section sync deferred to Step 10. Sub-agent fan-out #2 caught 5/5 listed mutation hooks missing — surfaced as HARD STOP, strategic-advisor adjudicated hybrid scope split. Typecheck + build GREEN. Smoke run by Max locally — top bar + sidebar confirmed in place. Vercel will redeploy. Next: Step 10 — DB migrations + the deferred mutation hooks + cross-section sync.

## Completed

**3 new chrome-rendering hooks**
- [src/features/project/hooks/useProjectPermissions.ts](src/features/project/hooks/useProjectPermissions.ts) — TanStack `useQuery` wrapping `permissionsApi.getProjectPermissions(projectId, userId)`. Same `enabled: !!projectId && !!userId` guard pattern as `useProject`. Returns `{ role, canView, canEdit, canDelete, canShare, canManageCollaborators }`.
- [src/features/project/hooks/useRenameProject.ts](src/features/project/hooks/useRenameProject.ts) — `useMutation` wrapping `projectsApi.updateProject(id, name, data)`. On success invalidates `['project', id]` so the chrome's name + locality update immediately. Throws on Supabase error.
- [src/features/project/hooks/useSaveProject.ts](src/features/project/hooks/useSaveProject.ts) — `useMutation` wrapping `projectsApi.saveProject(name, data)`. On success invalidates `['project', newId]`. Throws on Supabase error.

**ProjectLayout chrome composition** ([src/features/project/components/ProjectLayout.tsx](src/features/project/components/ProjectLayout.tsx))
- Top header (48px tall): "Mojo Viability" link to `/projects`, Help button, Sign out button (uses `useAuth().signOut`).
- `<ProjectSideNav>` (fixed left, 16rem wide, top: 48px): wired with all 12 tab handlers, `onSaveProject` → `handleManualSave` (fires `useProjectAutoSave.triggerSave()` for existing rows, `useSaveProject` mutation for new), `onShare` gated on `permissions.canShare`, `onLoadProject` → navigate to `/projects`, `onShowAuth` → `/auth`, `onShowNewProjectDialog` → opens NewProjectOriginDialog, `onReturnToHub` → no-op (Q3 strip — kept as no-op for prop compatibility).
- Sub-header (px-6 py-3, border-b): project name + pencil-icon edit button (opens rename dialog) + town subtitle + **static period text** (`Period: {project.period}`) + `<SaveStatusIndicator>` driven by `useProjectAutoSave`.
- `<BusinessSnapshot>` between sub-header and `<Outlet />`; `onNavigateToDetailed` → `navigateTab('detailed')`.
- `<SaveProjectCTA>` mounted at root (renders only when `projectId === null` — effectively never under current `<RequireAuth>` gating; Phase-2.5 guest flow will exercise it).
- 5 dialogs mounted at root: `<HelpDialog>`, `<NewProjectOriginDialog>`, `<ShareProjectDialog>` (gated on userId), inline Rename Dialog (lightweight; full edit-settings dialog deferred), inline Export Dialog (PDF + Excel, calls into `src/lib/export/`).
- `activeTab` derived from `useLocation().pathname` via inverse of `PROJECT_TAB_ROUTES` map.

**Mechanical fix: deep export imports**
- `@/lib/export` index re-exports were not visible to TypeScript's bundler module resolution (root cause undiagnosed; likely related to `exportBusinessPlan.ts` re-export type quirk noted in Step 7 handover). Switched to deep imports: `@/lib/export/exportDataBuilder`, `@/lib/export/exportToPDF`, `@/lib/export/exportToExcel`. **This is a workaround, not a fix** — log as low-priority cleanup for Step 10 or later.

**Sub-agent fan-out execution log — 2 this step**
- **Fan-out #1 (render block map):** Anatomy §1 used as authoritative substitute since `/tmp/mojo-business-current/src/App.tsx` was deleted by Phase C-light (only confirmed during this fan-out). Returned full element-by-element table — 29 ship, 2 drop (`MojoAdminPanel`, `AuthDialog`), 1 ⚠️ (NamePrompt → already a `/welcome` route from Step 9). No new consumer-strip needs surfaced.
- **Fan-out #2 (chrome prop & hook inventory):** Returned full prop signatures + flagged **5 of 5 listed mutation hooks as missing**: `useUpdateProjectData`, `useUpdateProjectPeriod`, `useSaveProject`, `useRenameProject`, `useProjectPermissions`. Triggered HARD STOP per dispatch's explicit hook-existence rule.

**HARD STOP adjudication (strategic-advisor)**
- Hybrid scope split: build 3 chrome-rendering hooks (`useProjectPermissions`, `useRenameProject`, `useSaveProject`) in 9b; defer 2 (`useUpdateProjectData`, `useUpdateProjectPeriod`) plus cross-section sync to Step 10.
- Period selector replaced with static text + comment marker pointing at Step 10 + anatomy §3.2/§6.1.
- Cross-section sync (anatomy §6.1) deliberately not addressed — logged below as HIGH severity.

**Verification**
- `npm run typecheck`: **GREEN** (exit 0, zero errors)
- `npm run build`: **GREEN** (2,555 modules, 4.18s — +21 from 2,534 baseline; export pipeline now eagerly bundled)
- Browser smoke: confirmed by Max locally — top bar + sidebar render in place.

**Commits + push**
- Step 9b commit: `13bb476 feat: compose project shell chrome (Step 9b)` — 4 files changed, 364 insertions, 6 deletions.
- Handover commit: pending push (this commit).

## In Progress

None — Step 9b complete.

## Phase 2.5 / future-cleanup follow-ups

Step 10 / future-cleanup carry-overs (severity-tagged so Step 10 dispatch can prioritise):

### From Step 9b

- **Step 10 / HIGH (anatomy §6.1):** Cross-section sync between `fitoutFinancing` ↔ `detailedBreakEven` is missing in the viability repo. Step 9 route wrappers call `patchProjectData(updates)` directly without running the sync. When users edit financing values, derived break-even numbers go stale. Fix lands with `useUpdateProjectData` + `useUpdateProjectPeriod` + the scaling-logic port in Step 10. **Real product bug, not just tech debt.**
- **Step 10 (mutation hook batch):** `useUpdateProjectData` + `useUpdateProjectPeriod` deferred from 9b. Tied to the cross-section sync work — three concerns, one piece of work.
- **Step 10 / Phase 2.5:** Period selector currently renders as static text (`Period: Weekly|Monthly|Yearly`). Becomes interactive once `useUpdateProjectPeriod` lands.
- **Phase 2.5:** Inline rename dialog is a 30-LOC placeholder (name + town only). Anatomy §1.4 spec calls for full `<EditProjectSettingsDialog>` (name + locality + business type + Single/Multi mode toggle, react-hook-form). Upgrade when convenient.
- **Phase 2.5:** Inline export dialog is PDF+Excel only (calls `exportComprehensivePDF` / `exportComprehensiveExcel`). Anatomy §1.4 spec calls for 3-button full export + simple-export variants for guests + Save-before-export gate + Business-name-for-export gate. Upgrade with the guest flow.
- **Phase 2.5:** "New project" creation flow is a stub — opens `NewProjectOriginDialog`, on confirm just toasts "New project creation lands in Step 10." Wire to `useCreateProject` mutation + redirect.
- **Future-cleanup (low):** `@/lib/export` index re-exports invisible to TS bundler module resolution. Worked around with deep imports in `ProjectLayout.tsx`. Investigate when touching the export pipeline next.

### Carried over from Step 9 (still outstanding)

- Phase 2.5 (anatomy §6.4): `StartPage`'s "Try as guest" routes to `/projects` (auth-gated) → redirects to `/auth`. Guest-mode plumbing (localStorage draft hand-off) deferred to Phase 2.5.
- Phase 2.5 (anatomy §6.3): `InviteAcceptancePage` is a placeholder. Token acceptance logic is genuine TODO.
- Future-cleanup: `ProjectsListPage` uses `useEffect` + manual fetch instead of `useQuery`. Active-flag mitigates the obvious race; refactor when convenient.
- Documented pattern: `InviteAcceptancePage`'s auth gate is internal (asymmetric vs other protected routes). Intentional per anatomy.

## Audit-pattern improvement (Step 9b learning)

**Bake into future fan-out templates:** Sub-agent fan-out #2 (component prop & hook inventory) should additionally verify that anatomy-listed mutation hooks (and other infra hooks like `usePermissions`) exist in the destination repo BEFORE chrome composition assumes them. The 5-of-5-missing finding here was caught only because the dispatch explicitly listed hooks to verify. Future dispatches that touch chrome composition or component wiring should bake "list mutation hooks the consumers will need; verify each exists" as a standard fan-out task — alongside the existing "feature completeness against anatomy §1" check.

## Blockers

None blocking Step 10.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Next Session

**Step 10 — DB migrations + deferred mutation hooks + cross-section sync.** The Step-10 dispatch should fold three pieces of work together (per the strategic-advisor's 9b adjudication):

1. **DB migrations:** move ownership of the 4 V-ONLY tables (`business_scenarios`, `project_invites`, `project_content_uploads`, `collaborators`) from `mojo_business`'s migrations folder into this repo's. Shared Supabase project — coordinate carefully. **Migrations affect production data — confirm with Max before running anything against the remote project.**
2. **Mutation hooks:** `useUpdateProjectData` + `useUpdateProjectPeriod`. Period hook needs to wrap the cross-section scaling logic (anatomy §3.2 L681–716) — port that pure transform first into `lib/scaleProjectByPeriod.ts`.
3. **Cross-section sync (HIGH bug):** `useUpdateProjectData` mutation handler runs the bidirectional sync for `fitoutFinancing` ↔ `detailedBreakEven` (anatomy §6.1). Test bidirectional sync explicitly to confirm no infinite-loop after the refactor.

After Step 10:
- **Step 11 — Browser smoke** (per plan §3 Step 11): full end-to-end UX verification.
- **Step 12 — Mojo 360 cleanup** (per plan §3 Step 12): in the *other* repo.

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
- **Step 9b commit: `13bb476`**
- Branch: `main`

**Step 9b metrics:**
- New files: 3 hooks (`useProjectPermissions`, `useRenameProject`, `useSaveProject`)
- Modified files: `ProjectLayout.tsx` (full chrome composition; 6 → 306 LOC)
- Module count: **2,534 → 2,555** (+21; export pipeline now eagerly bundled — Phase-2.5 candidate to switch back to dynamic if bundle pressure justifies)
- Sub-agent fan-outs: 2 (render block map, prop & hook inventory)
- Cascade theory: not exercised in 9b (no TS2307 churn)
- New audit-pattern category baked into future dispatches: "infra/mutation hook existence" (see "Audit-pattern improvement" section above)

**Cumulative inventory misses (still 8 — Step 9b added zero):**

| # | File | Step surfaced | LOC |
|---:|---|---|---:|
| 1 | `src/lib/hoursVisualization/` (4-file directory) | 2 | ~600 |
| 2 | `src/lib/contentUploads.ts` | 2 | 6.4KB |
| 3 | `src/lib/walkthrough.ts` | 4 | 354 |
| 4 | `src/lib/menuUtils.ts` | 4 | 486 |
| 5 | `src/lib/liquorLicences.ts` | 4 | 116 |
| 6 | `src/lib/naturalLanguageParser.ts` | 4 | 432 |
| 7 | `src/lib/calculations.ts` | 4 (second-pass) | 24 |
| 8 | `src/hooks/useAutoSave.ts` (consolidated to `src/features/project/hooks/useProjectAutoSave.ts` in Step 8) | 5 | 121 |

**Cumulative standard mechanical rewrites (still 7, still active):**
1. `@/shared/components/ui/X` → `@/components/ui/X`
2. `../../lib/X` and `../lib/X` → `@/lib/X`
3. `@/components/<NAME>` → `@/features/project/components/<NAME>` for the cumulative 12-component forward-pointer list
4. `@/app/providers/X` → `@/providers/X`
5. `../hooks/X` and `../../hooks/X` → `@/hooks/X`
6. `@/lib/projects` / `@/lib/permissions` → `@/features/project/api/<projectsApi|permissionsApi>`
7. `@/features/<feature>/components/<NAME>` → `@/components/<NAME>` when destination is top-level

**Architectural strip log (deliberate adaptations away from Mojo 360 concepts):**
- Step 1: `<AuthProvider>` stripped of `is_super_user`, `is_advisor`, `signInWithProvider`, `OrgProvider`
- Step 6: `HospoOSModal` stripped of `useBusinessContext` dependency
- **Step 9b: `ProjectLayout`'s `onReturnToHub` is a no-op (kept for `ProjectSideNav` prop compatibility).** The sidebar's "return to hub" sentiment is dropped per Q3 — viability standalone has no hub.

**Cleanup tracker:**
- ✓ Step 7: 2 `@ts-expect-error` directives in AIBusinessPlanPage.tsx — REMOVED.
- (No new cleanup tracker entries from Step 9b.)

**Step 9b architectural decisions:**
- 3 chrome-rendering hooks added now; 2 mutation hooks (`useUpdateProjectData`, `useUpdateProjectPeriod`) intentionally deferred to Step 10 alongside cross-section sync — they share their fate (one piece of work, three concerns).
- Period selector shipped as static text (not stub interactive UI) so the gap is visible to users + Step 10 has an obvious docking point.
- Rename + Export dialogs shipped inline (lightweight) rather than as new component files — full `<EditProjectSettingsDialog>` + 3-mode `<ExportDialog>` are Phase-2.5 work per anatomy §1.4.
- `handleManualSave` decision tree: existing project → `useProjectAutoSave.triggerSave()` (forces an immediate save through autosave's debounce); new project → `useSaveProject` mutation. Single button, two paths.
- Static export imports (deep paths) used as workaround for `@/lib/export` index re-export TS bundler quirk.

**Source clones in /tmp:**
- `/tmp/mojo-business-current/` — current main, used Steps 2–3, 7, 8. **`src/App.tsx` deleted in Phase C-light** — no longer recoverable from this clone.
- `/tmp/mojo-pre-phase-c/` — `pre-phase-c-deletion` tag at commit `2fc45f7`, used Steps 4–6. Original `App.tsx` recoverable here as text reference.

**Auth surface (unchanged):**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }`
- Supabase client localStorage namespace: `mojo-viability-auth`

**Hooks at `src/features/project/hooks/` (now 6):**
- `useProject.ts` — query
- `useProjectAutoSave.ts` — autosave (debounced writes)
- `useKeyboardShortcuts.ts` — keyboard shortcut registry (no consumer yet)
- **`useProjectPermissions.ts` (Step 9b)** — query
- **`useRenameProject.ts` (Step 9b)** — mutation
- **`useSaveProject.ts` (Step 9b)** — mutation

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan (**Step 10 = next**)
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY inventory (treat as under-catalogued; 8 misses surfaced so far)
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map (**§3.2 + §6.1 critical for Step 10 cross-section sync work**)
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) — orphan corrections
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md) — informational, post-Phase-2
