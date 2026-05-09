# Mojo Viability Extraction — `src/App.tsx` Anatomy

**Date:** 2026-04-29
**Purpose:** De-risk the App.tsx → Router rewrite (inventory §7 step 9, the single 6–8h unknown). Maps the legacy fallback render block + supporting state/effects/handlers to their Phase 2 destinations so the rewrite stops being an unknown.
**Companion docs:** [`inventory.md`](./inventory.md) (what exists), [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) (decisions that shape the destination shape).
**Out of scope this session:** Phase 2 implementation plan, Phase 2.5 spec, pre-extraction punch list, Q2 conversion mapping. Anatomy only.
**Read-only:** no `src/` modifications, no DB writes.

---

## 0. Executive summary

`src/App.tsx` is **2,491 LOC**. It plays four overlapping roles:

| Role | Lines | LOC | Phase 2 verdict |
|---|---|---:|---|
| Imports + types | 1–90 | 90 | re-author cleanly in new repo |
| Default `ProjectData` shape | 99–319 | 221 | move to `lib/projectFactory.ts` (already there in part — App.tsx duplicates the factory output as a constant) |
| State + auth init + handlers | 321–1084 | 764 | replace ~70% with React Query + Router, keep ~30% as page-local handlers |
| Branching `if (activeView === ...)` returns | 1086–1694 | 609 | **most of this does NOT ship to the new repo** — only viability-relevant branches travel |
| **Viability fallback render** | 1696–2469 | **774** | the structural rewrite — becomes `<ViabilityLayout>` + 12 routes |
| Provider shell | 2472–2491 | 20 | re-author identically in new repo |

**Key finding:** the viability fallback is reachable via **15 different branches above it** (auth-init redirect, post-signin redirect, hub→viability click, finance-manager→viability link, landing-home/how-it-works/reach-out → viability button, invite-token route, onboarding-completed-with-viability-path, ViabilityPath guest mode, etc.). The new repo collapses this fan-in into **`/`** as the project-list landing for authed users + **`/project/:id`** for the editor. Public landing + onboarding routes are vastly simpler in viability-only context.

**Risk concentration:** the ~150 LOC `showNamePrompt` signup-completion dialog (lines 2230–2379) is **not** part of viability per the "viability-only" scope but is currently fired from inside the viability fallback. It must be unwoven from viability and either dropped (handled by the new repo's signup flow inline) or moved to its own onboarding page.

**Estimate revision:** previous inventory said **6–8h** for the App.tsx rewrite. After this anatomy, revised to **8–11h** with the signup wizard split out (see §7). The increase is driven by: (1) the 15-fan-in-redirect paths needing per-path test cases on the new shape; (2) the `showNamePrompt` dialog being more substantial than first appearance suggested; (3) cross-tab data sync handlers (`handleFitoutFinancingUpdate`, `handleDetailedBreakEvenUpdate`) need careful re-implementation as they currently mutate two slices of `projectData` simultaneously.

---

## 1. Render block dissection (lines 1696–2469, ~774 LOC)

The fallback render is everything that returns when `activeView === 'viability'` — i.e. when none of the 15 earlier `if` branches match. It owns:

### 1.1 — Top chrome (lines 1696–1725)

| Block | Lines | What it renders | State read | Handlers fired | Phase 2 destination |
|---|---|---|---|---|---|
| `<UniversalHeader>` | 1700–1717 | Top-of-page brand bar with module name "Business Viability", role badge, back button, admin shortcut | `user`, `isSuperUser`, `isGuest` | `setActiveView('hub')`, `setActiveView('landing-home')`, `setIsGuest(false)`, `setShowAuthDialog`, `setShowMojoAdmin` | New repo's `<ViabilityHeader>` in `shared/components/layout/`. Drops admin shortcut (per Q3, MojoAdminPanel stays in mojo_business). Drops "Back to hub" — the new repo's only "back" is the project list. |
| `<GuestBanner>` | 1718–1725 | "You're using viability as a guest — create an account to save" CTA | `isGuest` | `setIsGuest(false)`, `setShowViabilityPath(true)` | Move to `features/project/components/GuestBanner.tsx`. Renders inside `<ViabilityLayout>` when guest mode active. The "create account" CTA opens `/signup?from=guest` and persists draft project to localStorage for hydration after signup. |

### 1.2 — Sidebar + sub-header (lines 1728–1794)

| Block | Lines | What it renders | State read | Handlers fired | Phase 2 destination |
|---|---|---|---|---|---|
| `<Sidebar>` | 1729–1747 | Tab navigation rail (12 tabs), project actions (New/Save/Load/Export/Share), return-to-hub | `activeTab`, `user`, `projectId`, `projectPermissions`, `isGuest` | `setActiveTab`, `handleNewProject`, `handleSaveProject`, `handleLoadProject`, `handleExport`, `setShowShareDialog`, `setShowAuthDialog`, `setShowNewProjectOriginDialog`, `setActiveView('hub')` | Becomes `<ProjectSideNav>` in `features/project/components/`. Tab change → `useNavigate()` to `/project/:id/{slug}`. Save/Load/Export buttons fire mutations + open dialogs as today. Share button gated on `projectPermissions.canShare`. **Drops `onReturnToHub`** — no hub in this repo. |
| Sub-header | 1751–1794 | Project name + locality/town under it; pencil-icon edit button; period selector (Weekly/Monthly/Yearly); save-status indicator | `projectName`, `projectData.location`, `projectData.storeTown`, `projectData.period`, `saveStatus`, `autoSaveError` | `handleRenameProject`, `handlePeriodChange`, `triggerSave` | Lives inside `<ProjectLayout>` directly above `<Outlet />`. Project name + location read from `useProject()` query. Period selector fires a `useUpdateProjectPeriod()` mutation that runs the same scaling logic. SaveStatusIndicator wraps the new `useProjectAutoSave()` hook. |

### 1.3 — BusinessSnapshot + 12 tabs (lines 1796–1980)

| Block | Lines | What it renders | State read | Handlers fired | Phase 2 destination |
|---|---|---|---|---|---|
| `<BusinessSnapshot>` | 1798–1801 | Persistent traffic-light + headline metrics card above the tab content | `projectData` | `setActiveTab('plan-builder')` | Stays as `<BusinessSnapshot>` in `features/project/components/`. Renders inside `<ProjectLayout>` between sub-header and `<Outlet />`. Click → `navigate('/project/:id/plan-builder')`. |
| `<Tabs>` wrapper | 1803 | Radix Tabs container with `value={activeTab}` and `onValueChange={setActiveTab}` | `activeTab`, `isGuest` | `setActiveTab` | **Removed entirely.** Tab state becomes the URL segment. The 12 `<TabsContent>` blocks become 12 routes. Guest-mode lock-to-`simple` becomes a route guard or conditional render in `<SimpleBreakEvenPage>`. |
| 12 `<TabsContent>` | 1804–1979 | One content block per tab. Each renders a tab component with `projectData`, `period`, `onUpdate`, `onNavigate`, etc. | `projectData`, `projectId`, `projectPermissions`, `isGoogleMapsLoaded` | `setProjectData`, `setActiveTab` (via tab-component's `onNavigate`), tab-component's own onUpdate handlers | Each becomes a route + page component. See §4 for the full tab → route mapping. |

### 1.4 — Below-tabs CTA + dialogs (lines 1982–2467)

| Block | Lines | What it renders | State read | Handlers fired | Phase 2 destination |
|---|---|---|---|---|---|
| `<SaveProjectCTA>` | 1982–2005 | Below-tab callout: "Save this project" if not-yet-saved, with inline save action and shortcut to setup tab | `projectId`, `projectName`, `projectData`, `user` | `setShowAuthDialog`, `saveProject`, `setActiveTab('simple')`, `setShowRenameDialog` | Renders inside `<ProjectLayout>` below `<Outlet />`. Save handler wired to `useSaveProject()` mutation. |
| `<Toaster>` | 2011 | Sonner toast portal | — | — | Mounted at root `<App>` once. |
| `<AuthDialog>` | 2013–2019 | Login/signup modal | `showAuthDialog`, `projectName`, `projectData` | `setShowAuthDialog` | Becomes a route at `/login` + `/signup` rather than a dialog. Project draft passes via localStorage or a "convert guest to authed" mutation. |
| `<ProjectManager>` | 2021–2025 | "Open project" picker dialog showing user's saved projects | `showProjectManager` | `handleProjectLoaded` | Becomes the `/projects` index route (a list page) rather than a dialog. Click row → `navigate('/project/:id')`. |
| `<HelpDialog>` | 2027–2030 | Static help content | `showHelpDialog` | `setShowHelpDialog` | Stays as a dialog, opened from a help button in `<ViabilityHeader>`. |
| Rename `<Dialog>` | 2032–2124 | "Edit project settings" — name + locality + business type + Single/Multi mode toggle | `showRenameDialog`, `newProjectName`, `newProjectLocality`, `newProjectVenueType`, `newProjectScenarioMode`, `projectName`, `projectData` | `setNewProjectName/Locality/VenueType/ScenarioMode`, `confirmRename`, `setShowRenameDialog` | Move to `features/project/components/EditProjectSettingsDialog.tsx`. Form state stays component-local (react-hook-form). Submit fires `useUpdateProject()` mutation. |
| Export `<Dialog>` (3 buttons) | 2126–2149 | Excel / PDF / JSON export choices | `showExportDialog` | `exportExcel`, `exportPDF`, `exportJSON` | `features/project/components/ExportDialog.tsx`. |
| Simple-export `<Dialog>` | 2151–2171 | "Download Simple Break-Even" — PDF or Excel for guest/unsaved-project flow | `showSimpleExport` | `exportSimplePDF`, `exportSimpleExcel` | Same component file, conditional rendering on `mode='full' \| 'simple'`. |
| Shortcuts `<Dialog>` | 2173–2204 | Static keyboard shortcut reference | `showShortcutsDialog` | `setShowShortcutsDialog` | Stays as a dialog. |
| Exit-confirm `<Dialog>` | 2206–2223 | "Are you sure? Your work will be lost" — used by sidebar's exit action | `showExitConfirm` | `confirmExit` | Replaced by `react-router`'s `useBlocker()` or a "have unsaved changes" hook tied to autosave status. |
| `<OnboardingTour>` | 2225–2228 | First-time guided walkthrough | `showOnboarding` | `setShowOnboarding` | Stays. Triggered from a localStorage flag in `<ViabilityLayout>` mount effect. |
| **Name-prompt `<Dialog>`** | **2230–2379** | **Signup completion: first/last name + role + conditional fields per role (Owner/Advisor/Team Member)** | `showNamePrompt`, `signupFirstName`, `signupLastName`, `userType`, `signupOrgName`, `signupPhone`, `signupTown`, `signupVenueType`, `signupIntent`, `signupTimeline`, `signupJoinCode` | `setSignup*` (10 setters), `handleSaveName`, `setShowNamePrompt` | **Critical structural call.** This dialog is **not viability-specific** — it gates first-time-after-signup users for the whole 360 ecosystem. In the viability repo this collapses dramatically: only the `Business Owner` role is relevant (no team members or business advisors in viability standalone). The dialog becomes a `/welcome` route shown after first signup, with simplified fields (name + venue type + town + timeline). The `Team Member` join-code path goes away entirely; the `Business Advisor` `is_advisor` flag goes away (per Q3, advisor model is post-merge Tier 3 work that doesn't ship in viability standalone). **~150 LOC → ~50 LOC after simplification.** |
| Business-name-for-export `<Dialog>` | 2381–2412 | "Name your business before export" guard | `showBusinessNameDialog`, `businessNameForExport` | `confirmBusinessNameAndExport` | Stays as dialog component. |
| Save-before-export `<Dialog>` | 2414–2446 | "Save your project before exporting" | `showSaveBeforeExportDialog` | `saveProject` chain | Stays as dialog component. |
| `<NewProjectOriginDialog>` | 2448–2455 | "New venue / Existing venue / Just exploring" origin picker | `showNewProjectOriginDialog` | `handleNewProject(origin)` | Becomes a `/projects/new` route or modal opened from `<ProjectSideNav>`. Submit creates a row + navigates to `/project/:id/simple`. |
| `<ShareProjectDialog>` | 2457–2465 | Share-link generator (token + collaborator invite) | `showShareDialog`, `user`, `projectId`, `projectName` | `setShowShareDialog` | Stays as dialog. |
| `<MojoAdminPanel>` | 2467 | 360 super-admin pan-product view | `showMojoAdmin` | `setShowMojoAdmin` | **Removed from viability repo entirely** per Q3. MojoAdminPanel stays in mojo_business. |

---

## 2. State slice ownership map (lines 322–410)

50 useState/useRef hooks. Categorised below.

### 2.1 — Project state (moves to React Query / `useProject` hook)

| Var | Type | Owner today | Phase 2 destination |
|---|---|---|---|
| `projectId` | `string \| null` | App.tsx | URL segment `/project/:id`. `useProject(id)` returns full row. |
| `projectName` | `string` | App.tsx | `useProject(id).data.name`. Mutation: `useRenameProject()`. |
| `projectData` | `ProjectData` | App.tsx | `useProject(id).data.data` (the jsonb column). Mutation: `useUpdateProjectData()` debounced via autosave hook. |
| `projectPermissions` | `ProjectPermissions \| null` | App.tsx | `useProjectPermissions(id)` query, runs in parallel with `useProject(id)`. |

### 2.2 — UI state (stays component-local)

| Var | Type | Owner today | Phase 2 destination |
|---|---|---|---|
| `activeTab` | `string` | App.tsx | **Removed** — becomes URL segment. |
| `showAuthDialog` | `boolean` | App.tsx | Dropped — auth becomes routes (`/login`, `/signup`). |
| `showProjectManager` | `boolean` | App.tsx | Dropped — becomes route `/projects`. |
| `showRenameDialog` | `boolean` | App.tsx | Local state in `<ProjectLayout>`. |
| `showHelpDialog` | `boolean` | App.tsx | Local state in `<ViabilityHeader>`. |
| `showShortcutsDialog` | `boolean` | App.tsx | Local state, opened by `?` keyboard shortcut. |
| `showExportDialog` | `boolean` | App.tsx (declared L851) | Local state in `<ProjectLayout>`. |
| `showSimpleExport` | `boolean` | App.tsx (declared L852) | Local state in `<ProjectLayout>`. |
| `showNewProjectOriginDialog` | `boolean` | App.tsx (declared L853) | Dropped — route `/projects/new`. |
| `showSaveBeforeExportDialog` | `boolean` | App.tsx (declared L854) | Local state in export flow. |
| `showShareDialog` | `boolean` | App.tsx | Local state in `<ProjectLayout>`. |
| `showExitConfirm` | `boolean` | App.tsx | Replaced by `useBlocker()` from react-router on dirty-save state. |
| `showBusinessNameDialog` | `boolean` | App.tsx | Local state in export flow. |
| `businessNameForExport` | `string` | App.tsx | Local state in export flow (form state). |
| `pendingExportType` | `'simple-pdf' \| 'simple-excel' \| null` | App.tsx | Local state in export flow. |
| `newProjectName/Locality/VenueType/ScenarioMode` | various | App.tsx | Form state inside `<EditProjectSettingsDialog>` via react-hook-form. |
| `mainScrollRef` | `useRef<HTMLDivElement>` | App.tsx | Stays in `<ProjectLayout>`. |
| `showOnboarding` | `boolean` | App.tsx | Local state in `<ViabilityLayout>`, triggered by localStorage flag. |

### 2.3 — Auth/session state (moves to AuthProvider, mostly already there)

| Var | Type | Owner today | Phase 2 destination |
|---|---|---|---|
| `user` | from `useAuth()` | provider | unchanged — viability repo gets a copy of AuthProvider. |
| `isAdmin` | from `useAuth().isSuperUser` | provider | **dropped** — no super-admin surface in viability repo (per Q3). |
| `authLoading` | from `useAuth()` | provider | unchanged. |
| `isSuperUser` | from `usePlatformRole()` | provider | **dropped** — no super-user surface in viability repo. |
| `isLoading` | `boolean` | App.tsx | Replaced by react-router's data-router pending state. |
| `hasSignedInRef` | `useRef<boolean>` | App.tsx | Replaced by once-only effect + `sessionStorage` flag in AuthProvider. |
| `showNamePrompt` | `boolean` | App.tsx | Becomes the `/welcome` route's gate (route-level, not state-level). |
| `signupFirstName/LastName/...` (10 vars) | string | App.tsx | Form state inside `<WelcomeForm>` via react-hook-form. |

### 2.4 — Onboarding/signup state (mostly drops)

| Var | Type | Owner today | Phase 2 destination |
|---|---|---|---|
| `showPathSelector` | `boolean` | App.tsx | **Dropped.** Viability repo has only one path: viability. |
| `showWebsiteIntent` | `boolean` | App.tsx | **Dropped.** Websites lives in mojo_business. |
| `showWebsiteSetupWizard` | `boolean` | App.tsx | **Dropped.** |
| `showViabilityPath` | `boolean` | App.tsx | **Simplified** — becomes the `/onboarding` or `/start` route showing two CTAs: "Try as guest" / "Create account". |
| `pendingOnboardingPath` | `string \| null` | App.tsx | **Dropped** — only one path. |
| `pendingOnboardingProfile` | object | App.tsx | **Dropped** — viability uses a simpler signup form. |
| `onboardingProfile` | object | App.tsx | **Dropped** — `<OnboardingWelcome>` is 360 onboarding (creates a business) — doesn't ship to viability. |
| `orgWizardState` | object | App.tsx | **Dropped.** |
| `onboardingNodeId` | `string \| null` | App.tsx | **Dropped.** |
| `userType` | `string` | App.tsx | **Dropped** — viability is owner-only. |
| `pendingAccess` | `{ businessName?: string } \| null` | App.tsx | **Dropped** — no team-member-pending-access flow in viability. |
| `isGuest` | `boolean` | App.tsx | **Kept.** Stored in URL or context (e.g. `<GuestModeProvider>` wrapping the project routes). |
| `inviteToken` | `string \| null` | App.tsx | Becomes URL search param on `/project/accept-invite?token=...`. |
| `showInviteAcceptance` | `boolean` | App.tsx | **Dropped** — becomes route `/project/accept-invite`. |
| `isAdvisor` | `boolean` | App.tsx | **Dropped** — advisor portal stays orphaned in mojo_business per Q3 advisor-model deferral. |
| `advisorPreview` | `boolean` | App.tsx | **Dropped.** |

### 2.5 — Cross-cutting / non-viability state (drops entirely)

These are 360 module navigation hints that don't apply in viability:

| Var | Verdict |
|---|---|
| `dashboardInitialPage` | drops |
| `orgSetupInitialPage` | drops |
| `marketingManagerInitialPage` | drops |
| `financeManagerInitialPage` | drops |
| `peopleManagerInitialPage` | drops |
| `showMojoAdmin` | drops (per Q3) |
| `showWaitlistModal` | drops (Hospo OS waitlist stays on viability landing per Q7, but hook to it from public landing not from inside the project shell) |
| `activeView` | drops — replaced by URL routing |

### 2.6 — State count summary

| Category | Today | New repo | Net change |
|---|---:|---:|---:|
| Project state | 4 vars | 1 query + 2 mutations | replaced |
| UI state (kept) | 17 vars | ~12 (component-local) | reduced |
| Auth state (kept) | 4 vars (provider) | 4 (provider) | unchanged |
| Auth state (signup form) | 10 vars | react-hook-form (1 form object) | reduced |
| Onboarding/signup | 14 vars | ~3 vars | **dropped 11** |
| Cross-cutting non-viability | 7 vars | 0 | **dropped 7** |
| **Total** | **~56 vars** | **~22 vars + 1 query + 2 mutations** | **−61% local state, +Router as the routing source of truth** |

---

## 3. Effects + handlers map

### 3.1 — Effects (lines 426–679)

| Lines | Block | Responsibility | Phase 2 destination |
|---|---|---|---|
| 426–430 | Tab-change scroll-to-top | When `activeTab` changes, scroll `mainScrollRef` to top | Replaced by react-router's `<ScrollRestoration />` or a small `useScrollToTop` hook in `<ProjectLayout>`. |
| 432–651 | **Init+auth effect (~220 LOC, the heaviest block)** | Reads URL params (invite token, signup hash), calls `supabase.auth.getSession()`, fetches profile, decides activeView based on membership/onboarding_completed/onboarding_path, subscribes to `auth.onAuthStateChange` for SIGNED_IN/SIGNED_OUT/USER_UPDATED, fires post-signin advisor-status fetch, post-signin path resolution, pending-join-code resolution, name-prompt gate | **Splits into 3 pieces.** (1) AuthProvider already handles session + auth state subscription — copy from rebuild. (2) Invite-token URL handler becomes a route loader for `/project/accept-invite`. (3) Post-signin "where do I go?" decision becomes a single rule in the AuthProvider's onSignIn callback: "if profile incomplete → /welcome; else → /projects". The 360 routing concerns (membership check, onboarding_path branching) drop entirely. **~220 LOC → ~40 LOC in new repo.** |
| 653–663 | Full-bleed body class toggle | Adds/removes `full-bleed` class on `#root` based on activeView | Replaced by per-route layout: `<PublicLayout>` is full-bleed, `<ProjectLayout>` is constrained. No global CSS class needed. |
| 666–670 | projectName ↔ projectData.projectName sync | Mirrors `projectData.projectName` into `projectName` state | Dropped — name is read directly from `useProject(id).data.name`. |
| 672–679 | First-time onboarding tour | Fires `setShowOnboarding(true)` if `localStorage` flag absent | Stays. Mounted in `<ProjectLayout>` `useEffect`. |

### 3.2 — Handlers (lines 681–1084)

| Lines | Handler | Responsibility | Tangled with non-viability? | Phase 2 destination |
|---|---|---|---|---|
| 681–716 | `handlePeriodChange` | Scales numeric fields in `projectData.simpleBreakEven` + `projectData.detailedBreakEven` when period changes (Weekly/Monthly/Yearly) | No | Becomes `useUpdateProjectPeriod()` mutation. The scaling logic is pure — extract to `lib/scaleProjectByPeriod.ts`. |
| 718–738 | `handleSaveProject` | If projectId → updateProject; else → saveProject. Toasts. | No | `useSaveProject()` + `useUpdateProject()` mutations. The "are you logged in" gate becomes a route guard. |
| 740–746 | `handleLoadProject` | Open ProjectManager dialog (if logged in) | No | Becomes `<Link to="/projects">`. Dropped as a function. |
| 748–758 | `handleProjectLoaded` | Sets projectId/Name/Data + fetches projectPermissions | No | Becomes `<Link to="/project/:id">` + the route loader handles fetching. Dropped as a function. |
| 760–765 | `handleNewProject` | Resets to defaults + new origin | No | Becomes `useCreateProject(origin)` mutation. The reset case is the route's initial state. |
| 767–795 | **`handleFitoutFinancingUpdate`** | **Cross-tab data sync:** when fitout financing changes, mirror `occupancyType`/`propertyPurchasePrice`/etc. into `detailedBreakEven` to keep them aligned | No | **Stays as a pure transform function.** Lives in `features/project/lib/syncCrossSection.ts`. Called inside `<FitoutFinancingPage>`'s `onUpdate` handler. **Test priority:** this is one of two cross-section sync paths; both must continue working post-extraction. |
| 797–824 | **`handleDetailedBreakEvenUpdate`** | Mirror image: when detailedBreakEven changes, mirror property fields back into fitoutFinancing | No | Same destination. **Test priority:** check the bidirectional sync doesn't infinite-loop after the refactor. |
| 826–849 | `handleRenameProject` + `confirmRename` | Open dialog, edit name+locality+venueType+scenarioMode, write back to projectData | No | Inside `<EditProjectSettingsDialog>`. react-hook-form. |
| 856–878 | `handleExport` | Decision tree: guest → simple export, no projectId → save-first, no name → name dialog, else → full export dialog | No | `useExportProject()` hook in `features/project/hooks/`. Returns the right next-action based on state. |
| 880–931 | `exportExcel/PDF/JSON/SimplePDF/SimpleExcel` | 5 export functions, dynamic-import the export module | No | Stays. Move dynamic import to top-level after Phase 2; performance-tune later. |
| 933–957 | `confirmBusinessNameAndExport` | Persist business name into projectName, then fire pending export | No | Inside the export flow component. |
| 960–967 | `confirmExit` | Reset all state, navigate to landing-home | Yes (lands on `landing-home` view that doesn't exist in viability repo) | Becomes `navigate('/projects')` after reset. |
| 969–980 | `resetSignupForm` | Clears signup form fields | Yes (signup is shared concern, not viability) | Dropped — react-hook-form's `reset()` handles this. |
| 982–1024 | `handleSaveName` | Updates profile with name+role+conditional fields, sets `is_advisor` if Business Advisor | **Yes — heavily.** Sets `is_advisor`, handles Team Member join code (uses `resolveJoinCode`). | **Major rewrite.** In viability repo: only saves name + venue_type + town + timeline (the owner-flavoured fields). No advisor flag, no join code, no organisation_name. Simplified mutation. |
| 1026–1032 | `useKeyboardShortcuts` | Registers Save/Load/New/Export/Help shortcuts | No | Stays. Probably a `useHotkeys()` library call in the new repo. |
| 1034–1084 | **`handlePathSelection`** | Routes user post-PathSelector based on path choice (operator/viability/website_only/advisor) | **Yes — entirely.** Three of four paths (operator/website/advisor) are not viability. | **Dropped entirely.** Viability repo has no PathSelector — there's only one path. |

### 3.3 — The 15 fan-in branches above the viability fallback (lines 1086–1694)

These `if`-branches gate access to `activeView === 'viability'`. Most don't ship to the new repo. Audit:

| Lines | Branch | Ships to viability repo? | Notes |
|---|---|---|---|
| 1086–1089 | `/privacy`, `/terms` static | **Yes** | Becomes routes `/privacy` + `/terms`. |
| 1091–1094 | `isLoading \|\| authLoading` | **Yes** | AuthProvider's loading state, gates render. |
| 1096–1131 | `showInviteAcceptance` + `inviteToken` | **Yes** | Becomes route `/project/accept-invite?token=...`. |
| 1133–1151 | `orgWizardState` (OrgSetupWizard) | **No** | 360 onboarding; doesn't ship. |
| 1153–1180 | `onboardingProfile` (OnboardingWelcome) | **No** | Same. |
| 1182–1217 | `showPathSelector` | **No** | Replaced by viability-only landing. |
| 1219–1256 | `showWebsiteIntent` | **No** | Websites lives in mojo_business. |
| 1258–1280 | `showWebsiteSetupWizard` | **No** | Same. |
| 1282–1306 | `showViabilityPath` | **Yes — simplified** | Becomes `/start` route with "guest/sign up" CTAs. |
| 1308–1333 | `landing-home` (LandingPage1) | **Yes** | Becomes route `/`. The viability landing. |
| 1335–1360 | `landing-how-it-works` | **Yes** | Becomes route `/how-it-works`. |
| 1362–1387 | `landing-reach-out` | **Yes** | Becomes route `/reach-out`. |
| 1389–1402 | `landing-websites` (WebsitesLanding) | **No** | Websites doesn't ship. |
| 1404–1420 | `landing` (legacy LandingPage.tsx) | **Yes — orphan flag** | The `components/LandingPage.tsx` (root) is the legacy landing; arguably orphaned by `LandingPage1`. Phase 2 should pick one; recommend keeping `LandingPage1` only and dropping the legacy. |
| 1422–1450 | `pendingAccess` | **No** | Team Member pending-access flow; doesn't ship. |
| 1452–1671 | All `activeView === '<360-feature>'` (10 modules) | **No** | All 10 lazy-imported feature modules don't ship to viability. |
| 1673–1680 | `activeView === 'admin'` (AdminPanel) | **No (per Q3)** | Stays in mojo_business. |
| 1682–1694 | `activeView === 'settings'` (SettingsPage) | **No** | 360 settings; doesn't ship. |

**Summary:** of the 15 distinct render branches, **6 ship to viability repo** (privacy, terms, loading, invite, simplified viability-path, the 4 landing pages — minus websites). The remaining 9 are all 360 concerns and drop. The "viability fallback" itself becomes the project editor route tree (§4 below).

---

## 4. Tab → route mapping

### 4.1 — Current 12 tabs

Each `<TabsContent value="..." />` block at lines 1804–1979 renders one tab component:

| Tab `value` | Component | Lines | Cross-tab navigations (legacy `onNavigate` map) |
|---|---|---|---|
| `simple` | `<SimpleBreakEven>` | 1804–1813 | → plan-builder |
| `detailed` | `<DetailedBreakEven>` | 1815–1840 | ↔ simple, plan-builder, financing, hours, labour, sales |
| `financing` | `<FitoutFinancing>` | 1842–1859 | ↔ simple, plan-builder, detailed, hours |
| `hours` | `<HoursOfOperation>` | 1861–1875 | ↔ detailed, labour, financing |
| `sales` | `<SalesBreakup>` | 1877–1893 | ↔ labour, menu-builder, location |
| `menu-builder` | `<MenuBuilder>` (viability's, NOT features/menu) | 1895–1900 | (none) |
| `labour` | `<LabourCosting>` | 1902–1914 | ↔ hours, sales |
| `location` | `<LocationSuitability>` | 1916–1929 | ↔ sales, predictions |
| `predictions` | `<SalesPredictions>` | 1931–1944 | ↔ simple, location, ai-business-plan |
| `plan` | `<BusinessPlanning>` | 1946–1952 | (none) |
| `ai-business-plan` | `<AIBusinessPlanBuilder>` | 1954–1962 | (any tab via passthrough) |
| `plan-builder` | `<BusinessPlanBuilder>` | 1964–1978 | → financing, detailed |

### 4.2 — Proposed routes (new repo)

```
/project/:id                       → <ProjectLayout> (header + sidebar + sub-header + snapshot + Outlet)
  /                                → redirect to /project/:id/break-even
  /break-even                      → <SimpleBreakEvenPage>
  /break-even/detailed             → <DetailedBreakEvenPage>
  /financing                       → <FitoutFinancingPage>
  /hours                           → <HoursOfOperationPage>
  /sales                           → <SalesBreakupPage>
  /menu-builder                    → <ViabilityMenuBuilderPage>  (renamed to avoid clash with 360's features/menu)
  /labour                          → <LabourCostingPage>
  /location                        → <LocationSuitabilityPage>
  /predictions                     → <SalesPredictionsPage>
  /plan                            → <BusinessPlanningPage>
  /ai-plan                         → <AIBusinessPlanPage>
  /plan-builder                    → <BusinessPlanBuilderPage>
```

### 4.3 — Per-tab notes for the rewrite

| Route | Notes |
|---|---|
| `/break-even` (simple) | Default tab. Renders even in guest mode (the only one that does). Click "Build full plan" → `/project/:id/plan-builder`. |
| `/break-even/detailed` | The biggest cross-section page (1230 LOC component). Has its own sub-routes today via `onNavigate` callbacks. Keep navigation as `useNavigate()` calls. |
| `/financing` | Bidirectional sync with `/break-even/detailed` (occupancyType + property fields). The sync hook fires on update. |
| `/hours` | 1500 LOC, no cross-section sync. Self-contained. |
| `/sales` | Reads `detailedBreakEven.scenario1` for sales targets. Read-only dependency. |
| `/menu-builder` | Viability's menu builder, NOT to be confused with features/menu. **Rename component to `ViabilityMenuBuilder`** during extraction. |
| `/labour` | Self-contained. |
| `/location` | Requires Google Maps loaded (`isLoaded` prop). Lazy-load the loader to avoid blocking initial render. |
| `/predictions` | Reads location + sales data. Cross-section read-only. |
| `/plan` | Self-contained business plan editor, `BusinessPlanning` component. Confusingly named — distinct from `/plan-builder`. |
| `/ai-plan` | Reads `projectId` for content uploads. Writes to `project_content_uploads`. |
| `/plan-builder` | Final wrap-up page. Calls `onSaveProject` directly (bypasses autosave). |

### 4.4 — Guest mode constraint

In legacy, `<Tabs value={isGuest ? 'simple' : activeTab}>` locks guest users to the simple tab regardless of `activeTab` state. In the new repo:

- Guest mode is a context flag (`<GuestModeProvider>`) wrapping the project routes.
- `<ProjectSideNav>` reads guest flag and disables 11 of 12 tab links visually (greyed + tooltip "Sign up to unlock").
- The 11 routes themselves render a `<GuestUpsellPage>` placeholder if the route guard catches a guest visit.
- Route guard implementation: a small `<RequireAuth>` wrapper on the 11 advanced-tab routes.

---

## 5. External coupling audit

### 5.1 — Google Maps `useLoadScript`

| Detail | Today | New repo |
|---|---|---|
| Hook call site | `App.tsx:414–417` (top-level) | Move to a `<GoogleMapsLoader>` component that wraps only the routes that need it. |
| Routes needing Maps | `/location`, `/plan`, `/plan-builder`, `/ai-plan` (the latter via `LinkParsingSection` indirectly) | Lazy-load: don't fire `useLoadScript` until user navigates to a Maps-using route. Saves ~80KB on initial bundle. |
| API key env var | `VITE_GOOGLE_MAPS_API_KEY` | Same. New repo's `.env.example` documents it as optional. |
| libraries | `['places']` | Same. |

### 5.2 — Supabase realtime subscriptions

**None.** Confirmed by inspection — App.tsx contains no `supabase.channel(...)` or `.on('postgres_changes', ...)` calls. The autosave hook polls via mutation rather than realtime. No coordination concern in the rewrite.

### 5.3 — Window/document direct access

| Lines | Access | Purpose | Phase 2 handling |
|---|---|---|---|
| 324–331 | `sessionStorage.getItem/setItem('mojo_activeView')` | Persist activeView across reload | **Replaced.** URL is the source of truth in the new repo. |
| 436–442 | `URLSearchParams(window.location.search).get('invite')` + `window.history.replaceState` | Strip invite token from URL after capture | Becomes a route loader that reads + redirects with token in component state. |
| 444–451 | `URLSearchParams(window.location.hash.substring(1)).get('access_token')` + `window.history.replaceState` | Capture Supabase email-confirm hash and clean URL | AuthProvider-side concern in the new repo (rebuild-side AuthProvider already does this). |
| 484, 639 | `sessionStorage.getItem/removeItem('mojo_activeView')` | activeView restore + signout cleanup | Dropped. |
| 654–662 | `document.getElementById('root').classList.add/remove('full-bleed')` | Full-bleed CSS toggle | Replaced by per-route layout. |
| 674 | `localStorage.getItem('mojobusiness_onboarding_completed')` | Onboarding tour seen-flag | Stays as `localStorage` flag, key prefix changes to `mojo_viability_*`. |
| 1087–1089 | `window.location.pathname` | Public route shortcut for `/privacy`, `/terms` | Replaced by react-router routes. |
| 519 | `localStorage.clear()` | Nuclear option on session exception | **Drop.** Too aggressive — wipes unrelated state. AuthProvider handles signout cleanly. |
| 457 | `localStorage.removeItem('supabase.auth.token')` | Manual clear of stale Supabase token | AuthProvider handles. |

### 5.4 — Browser history coupling

| Lines | API | Purpose | Phase 2 handling |
|---|---|---|---|
| 441, 450 | `window.history.replaceState({}, document.title, window.location.pathname)` | Strip query/hash from URL after capturing token | Becomes `navigate(..., { replace: true })` from react-router. |
| (none) | No `pushState`/`popstate` listeners | App.tsx doesn't drive its own history; browser back goes to landing-home not previous tab. | New repo: react-router handles back/forward correctly out of the box. Confirm: back on `/project/:id/labour` should go to `/project/:id/sales` (or wherever user came from), not exit the project entirely. Implement: `<NavLink>` for tab nav fires `navigate()` with default push behaviour. |

### 5.5 — Dynamic imports

`exportSimpleBreakEvenToPDF` and `exportSimpleBreakEvenToExcel` are dynamically imported (`await import('@/lib/export')`) at lines 914, 927, 942, 946 — likely a code-splitting attempt. New repo can keep this pattern or drop it depending on bundle-size measurements.

---

## 6. Risk register

Ranked by likelihood × impact. Each row: what, why risky, mitigation.

### 6.1 — Cross-section bidirectional sync (`fitoutFinancing` ↔ `detailedBreakEven`) — **HIGH**

**What:** `handleFitoutFinancingUpdate` (L767–795) and `handleDetailedBreakEvenUpdate` (L797–824) mutate two `projectData` slices simultaneously. They prevent the slices from diverging on `occupancyType`, `propertyPurchasePrice`, `propertyDeposit`, and 5 other property fields.

**Why risky:** in the new repo, `<FitoutFinancingPage>` and `<DetailedBreakEvenPage>` are separate routes. Each calls `useUpdateProjectData()` independently. The sync logic must move into the mutation handler (or a Zustand-style derived store) so that updating one section automatically syncs the other. If the sync moves into the page component, the user can navigate away mid-edit and the sync is lost. If it moves too far up (top-level mutation interceptor), it's hard to debug.

**Mitigation:** put the sync logic in `useUpdateProjectData()` itself: receives a patch, runs the cross-section sync once, writes the merged patch to the cache. Unit test with both directions.

### 6.2 — Autosave race conditions on route change — **HIGH**

**What:** `useAutoSave` debounces writes to `business_scenarios.data`. When a user changes a field then immediately navigates to another tab, the debounce timer might still be pending.

**Why risky:** today, route changes happen via `setActiveTab` which doesn't unmount components — autosave timer continues. In the new repo, navigating between routes unmounts the previous page component. If autosave is owned by the page, the timer is killed and the in-flight edit lost.

**Mitigation:** `useAutoSave` lives at `<ProjectLayout>` level (above the route outlet), not inside individual page components. Pages call `useUpdateProjectData()` which writes to a single source-of-truth that the layout-level autosave watches. Bonus: route changes can `await` the in-flight save before unmounting via a `useBlocker()` guard.

### 6.3 — Share-link / invite-token resolution timing — **MEDIUM-HIGH**

**What:** Today, `?invite=<token>` URL param is captured by the auth-init effect at L437–442. The token is stored in state, then the `<InviteAcceptance>` page renders. Order: URL → state → component render → token resolution → project load.

**Why risky:** in the new repo with route loaders, the order changes. The token is captured by the route loader before the page renders. If the user is unauthed, the loader needs to redirect to `/login?from=invite&token=...`, then come back to `/project/accept-invite?token=...` after auth. This redirect chain is easy to break.

**Mitigation:** explicit test for the unauthed-invite-recipient flow. Documented in Phase 2 acceptance criteria.

### 6.4 — Guest-to-authed transition state preservation — **MEDIUM-HIGH**

**What:** A guest user fills in `<SimpleBreakEvenPage>` data, clicks "Sign up". Today, the guest state is `isGuest=true` and `projectData` lives in App.tsx state. After signup, App.tsx sets `isGuest=false`, but `projectData` survives in state — so the user sees their values preserved, then can save.

**Why risky:** in the new repo, signup happens at `/signup` (a different route). The guest's `projectData` lives somewhere outside the project route's component lifecycle. If signup causes a route remount, `projectData` is lost.

**Mitigation:** persist guest project to `localStorage` keyed by a session-scoped UUID. `<SignupPage>` reads the UUID on mount, captures the data, and after successful signup creates a real project from it via `useCreateProject()`. Test case: guest → fills data → sign up → arrives at `/project/{newId}/break-even` with all values preserved.

### 6.5 — OAuth callback URL handling for email confirmation — **MEDIUM**

**What:** Supabase sends users back to the app with `#access_token=...&type=signup` in the URL hash after email confirmation (L444–451). Today, App.tsx detects this in the auth-init effect and shows a toast.

**Why risky:** the new repo's AuthProvider needs to handle this same flow. If misconfigured, users clicking the confirmation link land on a page that doesn't recognise the hash, the access_token isn't picked up, and they appear to be logged out.

**Mitigation:** copy the AuthProvider's auth-state-change handler verbatim from the rebuild — it already handles this. Test: sign up with a fresh email, click the link, confirm landing on `/projects` (or `/welcome` if profile incomplete).

### 6.6 — Project unsaved-changes prompt on navigation — **MEDIUM**

**What:** Today, exit-confirm (L2206–2223) shows "Are you sure?" when user clicks the sidebar back button. It does NOT trigger on browser-back, route changes within the editor, or tab close.

**Why risky:** the new repo's Router-based navigation makes "leaving the editor" more frequent (any tab change is a route change). If the unsaved-changes guard fires on every tab change, it's annoying. If it doesn't fire on route-out (e.g. user navigates to `/projects` from sidebar), the user can lose edits.

**Mitigation:** decision required — does autosave cover this? If autosave runs reliably on every change, the guard is unnecessary. Only show "are you sure" when autosave is in `error` state. Phase 2 should default to "no guard, trust autosave"; add the guard back only if smoke surfaces a regression.

### 6.7 — `showNamePrompt` welcome dialog scope creep — **MEDIUM**

**What:** The 150-LOC name-prompt dialog (L2230–2379) handles 3 user types with 3 different conditional field sets. In the viability repo, only Owner is relevant.

**Why risky:** if Phase 2 ports the dialog as-is, the viability repo carries dead code paths (advisor branching, team-member join code) that confuse future maintenance. If Phase 2 strips them, the strip needs to be careful — the dialog is fired post-signup, before the user lands anywhere, and the gate logic is in the auth-init effect.

**Mitigation:** strip during extraction. Replace with a `<WelcomePage>` route that asks for `first_name`, `last_name`, `venue_type`, `town`, `timeline` only. Submission writes to `profiles` and navigates to `/projects`. Document the simplification in the Phase 2 plan so the future session doesn't blindly port the legacy version.

### 6.8 — `is_advisor` and `pending_join_code` profile flags — **MEDIUM**

**What:** App.tsx writes to `profiles.is_advisor` and `profiles.pending_join_code` based on signup form choices (L1001, L1003). The viability repo doesn't have advisor or team-member roles per Q3.

**Why risky:** if the viability signup form omits these fields entirely, the resulting `profiles` row leaves them at default (false/null) — fine. But if the user is a real-world advisor who was using the legacy mojo_business app before extraction, their existing `is_advisor=true` row is unaffected (no overwrite). The risk is only if Phase 2 erroneously writes `is_advisor=false` on signup, regressing existing advisor users.

**Mitigation:** viability signup mutation does NOT write `is_advisor` or `pending_join_code` at all. Only sets fields the form actually collected.

### 6.9 — `sessionStorage.mojo_activeView` is gone but legacy users have it — **LOW**

**What:** Existing users' browsers have `sessionStorage.mojo_activeView` from the legacy app. The new repo doesn't read it.

**Why risky:** harmless — sessionStorage is per-tab, expires when tab closes. The first visit to mojobusiness.ai (the new repo) starts fresh.

**Mitigation:** none needed.

### 6.10 — Period-change scaling edge cases — **LOW**

**What:** `handlePeriodChange` (L681–716) uses string-substring heuristics (`!key.includes('variable')`, `!key.includes('percent')`, etc.) to decide which numeric fields to scale. This is fragile — adding a new field with the wrong name breaks scaling.

**Why risky:** not new — exists in legacy. But Phase 2 is a chance to make it explicit. If left as heuristic, future field additions still risk breakage.

**Mitigation:** during extraction, replace heuristic with an explicit `scalableFields: string[]` list. Lower priority — could be deferred to a follow-up cleanup task.

---

## 7. Net effort revision

### 7.1 — Inventory's original estimate

[`inventory.md` §8](./inventory.md) estimated **6–8h** for the App.tsx → Router rewrite.

### 7.2 — Anatomy-revised estimate

**8–11h**, broken down:

| Sub-step | Hours (low) | Hours (high) | Notes |
|---|---:|---:|---|
| Set up `<App>` shell + Router config + 5 providers + `<RequireAuth>` guard | 0.5 | 1 | Standard react-router-v6 data routes. |
| `<PublicLayout>` + 4 public landing routes (`/`, `/how-it-works`, `/reach-out`, `/start`) | 1 | 1.5 | Mostly relocation; landing components don't change shape. |
| `<ProjectLayout>` (header + sidebar + sub-header + snapshot + outlet) | 1 | 1.5 | Lifts ~200 LOC out of the legacy fallback. Scroll restoration. |
| 12 tab routes (one route + page each) | 1 | 1 | Boilerplate per route ~30 LOC. |
| `useProject()` query + `useProjectAutoSave()` hook + cross-section sync (§6.1) | 1.5 | 2 | The most subtle piece. Test bidirectional sync. |
| `useExportProject()` + 3 export dialogs lifted | 0.5 | 1 | Mostly mechanical. |
| Project lifecycle dialogs (`Edit settings`, `New project origin`, `Share`) lifted | 0.5 | 0.5 | Component relocation. |
| `<WelcomePage>` route (simplified `showNamePrompt`) | 0.5 | 1 | New component, ~50 LOC. |
| `<InviteAcceptancePage>` route + redirect chain (§6.3) | 0.5 | 0.5 | Loader + auth-aware redirect. |
| Guest mode (`<GuestModeProvider>` + sign-up draft preservation) | 0.5 | 1 | localStorage-based draft hand-off. |
| Browser smoke + bug-fixing | 1 | 1 | Test the 6 fan-in flows, autosave, exports, share, period-change. |
| **TOTAL** | **8.5h** | **11h** | Single focused engineer, no interruptions. |

### 7.3 — Sub-step splits

The anatomy reveals that **two pieces should be split out of the main rewrite step** in the Phase 2 plan:

1. **`<WelcomePage>` route (signup completion)** — separate sub-step. 0.5–1h. Decoupled from the project editor. Could even ship in Phase 2.5 if Phase 2 is time-pressured.
2. **Cross-section sync hook** — separate sub-step inside the main rewrite. The current pattern can't move with a copy-paste; it needs the `useUpdateProjectData()` mutation to wrap the sync logic. Worth flagging in the Phase 2 plan as its own bullet with explicit unit tests.

### 7.4 — Items NOT in the rewrite

These were inventory items but aren't part of the App.tsx rewrite — they're separate Phase 2 sub-steps:

- 21 tab content components (move + import-path rewrite — separate sub-step, 3–4h)
- 15 calculation engines (separate sub-step, 1h)
- Export pipeline (`lib/export/`) (separate sub-step, 2–3h)
- DB migration ownership transfer (separate sub-step, 1h)

The 8–11h estimate above is for App.tsx-rewrite only — the routing/state/effects piece. Total Phase 2 estimate from inventory §8 (~25.5–36h) remains the ceiling.

---

## 8. Phase 2 hand-off

The future Phase 2 session reads, in order:

1. [`inventory.md`](./inventory.md) — what files exist
2. [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) — what decisions are locked
3. **This document** — how App.tsx becomes the new repo's routing tree
4. The Phase 2 implementation plan (yet to be written — see `step 3` candidate from prior chat)

Anatomy stand-down. No code changes, no DB writes. Doc-only output.
