# Mojo Viability Handover — 2026-05-16 (Step 11b-A)

## Session Summary

Step 11 smoke (planned for this session) surfaced public-surface defects that snowballed into a strategic rebuild dispatched as four sub-dispatches (A–D). **Dispatch A — design tokens, shared chrome, and the two surviving 11a tactical items — shipped.** Foundation in place: CSS-var tokens, Tailwind namespace, fonts, M-glyph assets, seven shared chrome components, a temporary `/_design-preview` route, the `vercel.json` SPA fallback, and the StartPage guest-card hide. The existing public pages (`/`, `/how-it-works`, `/reach-out`) are untouched and render exactly as before — Dispatch B will swap LandingPage to use the new chrome.

## Completed

**Planning docs commit** (`e9275b5` — separated from implementation per dispatch §2):
- `context/dispatches/` — strategic-rebuild index + A/B/C/D dispatches + 11a tactical-patch + planner-training prompt
- `context/design_handoff_landing_and_reach_out/` — README + prototype reference files + M-glyph SVGs

**Implementation commit** (`10e8481`):
- [vercel.json](vercel.json) — SPA fallback rewrites; `/privacy` and `/terms` now resolve on direct navigation (replaces the 11a tactical-patch item)
- [src/index.css](src/index.css) — Viability brand tokens (`--vbr-*`, `--m360-*`) added alongside the existing shadcn HSL system. `::selection` rule (green bg, ink fg).
- [tailwind.config.js](tailwind.config.js) — `viability` + `m360` colour namespaces, `display` (Fraunces) / `display-alt` (Syne) / `mono` font families, `pill` / `tight` / `chip` radii, `viability-ticker` + `viability-fade-up` keyframes + animations (desktop 38s, mobile 28s). The existing `sans` already pointed to DM Sans — extending it was a no-op (no visual regression on existing pages).
- [index.html](index.html) — Google Fonts `<link>` preconnect + stylesheet for Fraunces / Syne / DM Sans.
- [public/icons/](public/icons/) — `m-viability.svg` and `m-mojo360.svg` (reference copies; MGlyph inlines the path).
- Seven new components in [src/components/viability/](src/components/viability/):
  - **MGlyph** — recolourable inline SVG, props for `size`, `color`, `ink`.
  - **Eyebrow** — overline label, `tone='green'|'amber'`, optional leading dot.
  - **VButton** — standalone `<button>` (NOT shadcn `<Button>` — see deviation below) with `solid`/`ghost` variants and `sm`/`md`/`lg` sizes.
  - **HairlineLabel** — vertical hairline + mono caption.
  - **ViabilityTicker** — full-width green marquee with `motion-safe:` gate; mobile (28s) and desktop (38s) tempo via responsive variant.
  - **ViabilityHeader** — sticky, blur-on-scroll, auth-aware right CTA (unauthed: "Sign in" + "Try free →"; authed: "Open Viability →"). Active nav underline.
  - **ViabilityFooter** — 4-column lockup (1.4fr 1fr 1fr 1fr) + orange Mojo 360 cross-link card + bottom strip with copyright + "Built in Port Macquarie · NSW."
- [src/pages/_DesignPreview.tsx](src/pages/_DesignPreview.tsx) — internal-only sanity-check page mounted at `/_design-preview` (no auth gate). To be removed in Dispatch B.
- [src/App.tsx](src/App.tsx) — `/_design-preview` route registered. StartPageRoute updated to pass `onSignIn` and drop `onGuest`.
- [src/pages/StartPage.tsx](src/pages/StartPage.tsx) — guest card removed, grid collapsed to single column, "Already have an account? Sign in" link added below the create-account card (replaces the 11a tactical-patch item).

**Verification**
- `npm run typecheck`: GREEN
- `npm run build`: GREEN (2,557 → 2,565 modules — +8 from new components + design preview; CSS 59.41 KB → 65.60 KB from new tokens/keyframes)
- Local Playwright smoke on `/_design-preview`: 0 console errors; only the two known React Router future-flag warnings (already on Phase 2.5 list). Screenshot confirmed: header chrome correct, MGlyph renders green + orange, VButton sm/md/lg/ghost variants all rendered as pills, marquee scrolls, footer 4-column lockup with orange Mojo 360 card visible.
- `/` (legacy LandingPage): renders unchanged — no regression.
- `/start`: shows only the create-account card + "Already have an account? Sign in" link + Back. Guest card gone.

**Architectural deviation (documented in commit message)**
- **VButton built as standalone `<button>` rather than composing shadcn `<Button>`** (stop-condition 2 triggered). The shadcn cva had baked-in heights (`h-9`, `h-8`, `h-10`) and `rounded-md` that fought the pill radii + custom paddings. A standalone button is cleaner than overriding via className specificity wars. `asChild` support kept via `@radix-ui/react-slot` so the API stays consumer-compatible.

## In Progress

None — Dispatch A is a closed unit.

## Blockers

None blocking Dispatch B.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase. Plaintext leaked in Step 1 chat; treat as compromised.

## Phase 2.5 / future-cleanup follow-ups

### Reclassified this session
- **"StartPage's 'Try as guest' deferred"** — moved off the carry-forward list. Now intentionally hidden, not broken. Build out as part of Phase 2.5 guest-mode plumbing.

### New from Step 11b-A
- **(11b-A) Phase 2.5 — confirm ABN with Max.** Footer copyright currently shows `ABN ###` as a placeholder with a `// TODO` comment. Replace before public launch.
- **(11b-A) Phase 2.5 — Mojo 360 footer card uses bg gradient + inline style** (Tailwind doesn't support `background-image: linear-gradient(...)` over a solid in arbitrary-value form cleanly). Acceptable; could move to a custom utility if it spreads beyond one site.

### From prior steps (still outstanding)
- **(10b reclassified at NORMAL)** Phase 2.5 wishlist — `occupancyType` cross-section feature (rent ↔ mortgage swap). Forward feature work, not a port-fidelity bug.
- **(10b LOW)** Opt into React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`). Cosmetic dev-console warnings.
- **(10a LOW)** Triple-nested EXISTS in `project_content_uploads`'s "Business members can view uploads of linked assessments" policy.
- **(10a)** Both new indexes (`idx_business_scenarios_business_id`, `idx_business_scenarios_business_active`) currently appear in `unused_index` advisor.
- **Phase 2.5 (Step 9b):** Inline rename dialog placeholder (~30 LOC); full `<EditProjectSettingsDialog>` per anatomy §1.4.
- **Phase 2.5 (Step 9b):** Inline export dialog is PDF+Excel only; full 3-button export per anatomy §1.4.
- **Phase 2.5 (Step 9b):** "New project" creation flow is a stub.
- **Future-cleanup (LOW, Step 9b):** `@/lib/export` index re-exports invisible to TS bundler module resolution.
- **Phase 2.5 (Step 9):** `StartPage`'s "Try as guest" — see reclassification above.
- **Phase 2.5 (Step 9):** `InviteAcceptancePage` is a placeholder.
- **Future-cleanup (Step 9):** `ProjectsListPage` uses `useEffect` + manual fetch instead of `useQuery`.

## Next Session

**Smoke Dispatch A on Vercel preview.** Max runs the §6 smoke script (S1–S16) on the deployed preview URL — focuses on:
- S1, S2: Direct navigation to `/privacy` and `/terms` (validates `vercel.json` rewrites). **Cannot be validated locally with `vite preview` alone** — this is the production-only validation step.
- S3–S10: `/_design-preview` chrome behaviours.
- S11: Reduce Motion freezes the ticker.
- S12, S13: `/start` shows only create-account + Sign in link.
- S14: `/` legacy LandingPage still renders.
- S15, S16: Network shows Fraunces/Syne/DM Sans woff2 loads; console clean.

**If smoke is green → request Dispatch B from the Planner.** Dispatch B will:
- Replace the `/` `LandingPage` with the new chrome
- Build out the hero, the live dossier interactive widget, and the seven landing sections
- Delete the unused `LandingHeader.tsx` once nothing imports it
- Remove the temporary `/_design-preview` route

**If smoke surfaces issues:** fix in place, re-commit, re-smoke. Don't proceed to Dispatch B until A is clean.

## Key References

**Commits this session:**
- Planning docs: `e9275b5 docs: Step 11b planning + design handoff materials`
- **Implementation: `10e8481 feat: viability design tokens + shared chrome (Step 11b-A)`**
- Branch: `main` (1 commit ahead of `origin/main` after docs commit; 2 ahead after implementation commit)

**Files added/modified:**

New files (11):
- `vercel.json`
- `public/icons/m-viability.svg`, `public/icons/m-mojo360.svg`
- `src/components/viability/MGlyph.tsx`
- `src/components/viability/Eyebrow.tsx`
- `src/components/viability/VButton.tsx`
- `src/components/viability/HairlineLabel.tsx`
- `src/components/viability/ViabilityTicker.tsx`
- `src/components/viability/ViabilityHeader.tsx`
- `src/components/viability/ViabilityFooter.tsx`
- `src/pages/_DesignPreview.tsx`

Modified files (5):
- `index.html` — font preconnects + Google Fonts stylesheet
- `src/index.css` — `--vbr-*` and `--m360-*` tokens + `::selection`
- `tailwind.config.js` — viability/m360 namespaces, display/display-alt fonts, pill/tight/chip radii, ticker/fade-up keyframes
- `src/App.tsx` — `/_design-preview` route + StartPageRoute prop swap
- `src/pages/StartPage.tsx` — guest card removed, Sign In link added

**Step 11b-A metrics:**
- New files: 11
- Modified files: 5
- Net module count: +8 (2,557 → 2,565)
- CSS bundle: +6.2 KB (59.41 → 65.60 KB) — Tailwind picked up the new tokens/keyframes
- Sub-agent fan-outs: 0 (sequential file ops; subagents add overhead for this kind of work)
- Stop conditions triggered: 1 (VButton built standalone — see deviation above)
- Smoke iterations: 1 (Playwright local sanity check; full smoke is for Max on Vercel preview)

**Cumulative inventory misses (still 8 — Step 11b-A added zero):**
Unchanged from Step 10b handover.

**Architectural strip log (no new strips in 11b-A — this was new authoring of greenfield surfaces):**
- (no additions this session)

**Planning docs (read in order at session start):**
- `context/dispatches/step-11b-strategic-rebuild-index.md` — index of A–D dispatches
- `context/dispatches/step-11b-A-tokens-and-shared.md` — THIS dispatch (now complete)
- `context/design_handoff_landing_and_reach_out/README.md` — full design spec (read end-to-end before B/C/D)
- `context/design_handoff_landing_and_reach_out/prototype/colors_and_type.css` — token source-of-truth
- `context/design_handoff_landing_and_reach_out/prototype/core.jsx` — reference implementation for the seven chrome components (do NOT copy verbatim — translated to Tailwind)
- `context/viability-extraction/extraction-plan-2026-05-09.md`
- `context/viability-extraction/phase-2-implementation-plan.md`

**Auth surface (unchanged):**
- `<AuthProvider>` exposes `{ user, isLoading, signIn, signUp, signOut }`
- `ViabilityHeader` now reads `useAuth().user` to flip CTAs

**Hooks at `src/features/project/hooks/` (still 7 — no change in 11b-A):**
- `useProject.ts`, `useProjectAutoSave.ts`, `useKeyboardShortcuts.ts`, `useProjectPermissions.ts`, `useRenameProject.ts`, `useSaveProject.ts`, `useUpdateProjectData.ts`
