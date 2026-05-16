# Mojo Viability Handover — 2026-05-16 (Step 11b-B)

## Session Summary

Dispatch 11b-B shipped. The legacy 619-LOC `LandingPage.tsx` is replaced by a ~30-LOC composition of nine new components built on Dispatch A's chrome + tokens. The Live Dossier hero is a static placeholder (`<HeroPlaceholder>`) until Dispatch C wires the interactive widget. `/_design-preview` is gone (route removed + file deleted). Stop-condition 3 fired during smoke (mobile horizontal overflow at 390px) — root cause was Dispatch A's `ViabilityFooter` and `ViabilityHeader` not collapsing on small screens, both patched in this dispatch.

## Completed

**Implementation commit** (`cf6712a`):

New section components under [src/components/viability/landing/](src/components/viability/landing/):
- [SectionShell.tsx](src/components/viability/landing/SectionShell.tsx) — 1180px content wrapper. `py-9 md:py-[110px]`, `px-6 md:px-14`.
- [SectionWhat.tsx](src/components/viability/landing/SectionWhat.tsx) — "The deal-breakers fall into three places." 3 cards: The money / The location / The operations. Copy lifted verbatim from prototype.
- [SectionBuiltFor.tsx](src/components/viability/landing/SectionBuiltFor.tsx) — "Three people land here, with the same question." 3 persona cards (First venue / Venue #2 / Investor · partner). **First card carries amber "highest stakes" pill** in the top-right.
- [SectionHow.tsx](src/components/viability/landing/SectionHow.tsx) — "Three moves from concept to case." 3-step rail with dotted green horizontal line and 56×56 numbered circles (8px ink ring punches through the rail). Below: 2-up `ShopfrontPlaceholder` boxes.
- [ShopfrontPlaceholder.tsx](src/components/viability/landing/ShopfrontPlaceholder.tsx) — CSS-drawn placeholder with diagonal hatch background + four corner brackets + centred mono caption. Used by `SectionHow`.
- [SectionProof.tsx](src/components/viability/landing/SectionProof.tsx) — "~1 in 2" giant Fraunces stat with the **TODO: confirm precise ABS source + URL with Max before public launch** code comment + 3 mono badges + ABS source footnote. Right column: founder story card with green-italic-prefixed pull quote, paragraph, and `MS` avatar/name/Port Macquarie NSW.
- [SectionMojo360.tsx](src/components/viability/landing/SectionMojo360.tsx) — Orange + Syne sibling strip. **Only place orange tokens and `font-display-alt` (Syne) appear on the Viability surface.** Decorative orange dotted side rail; orange pill CTA opens `https://mojo360.com.au` in a new tab. CTA is a custom orange `<a>` (NOT `<VButton>`, which is green-only).
- [SectionFinalCTA.tsx](src/components/viability/landing/SectionFinalCTA.tsx) — Centred 920px block on ink bg with a 900×900 green radial wash behind. "Run the numbers before *you sign anything.*" Primary `<VButton size="lg">` → `/start` + Sign in text link → `/auth`.
- [HeroPlaceholder.tsx](src/components/viability/landing/HeroPlaceholder.tsx) — Left rail matches eventual hero (eyebrow + h1 + subline + CTA row + stat triple). Right rail is an empty dark card with mono caption "LIVE DOSSIER · ARRIVING IN DISPATCH C".

Modified:
- [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx) — fully rewritten from 619 LOC → 27 LOC. Composition only: `<ViabilityHeader> → <HeroPlaceholder> → <ViabilityTicker> → 6 sections → <ViabilityTicker> → <ViabilityFooter>`.
- [src/App.tsx](src/App.tsx) — `/` now mounts `<LandingPage />` directly. `LandingPageRoute` wrapper removed. `_DesignPreview` import + route removed. `useLandingNav` retained for `HowItWorksPageRoute` and `ReachOutPageRoute`.
- [src/components/viability/ViabilityHeader.tsx](src/components/viability/ViabilityHeader.tsx) — `px-6 md:px-14`, centre nav `hidden md:flex` (hidden on mobile per README — mobile gets a hamburger later, not in this dispatch).
- [src/components/viability/ViabilityFooter.tsx](src/components/viability/ViabilityFooter.tsx) — inline `padding: '72px 56px 36px'` replaced with `pt-12 md:pt-[72px] pb-9 px-6 md:px-14`. Grid `grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 md:gap-x-14`. Bottom strip stacks `flex-col md:flex-row`.

Deleted:
- `src/pages/_DesignPreview.tsx`

**Verification**
- `npm run typecheck`: GREEN
- `npm run build`: GREEN (2,565 → 2,573 modules — +8 from new section components; CSS 65.60 KB → 70.01 KB)
- Playwright smoke at 1280×900 desktop: page renders top-to-bottom in correct order. Header / hero placeholder / ticker / SectionWhat / SectionBuiltFor / SectionHow / SectionProof / SectionMojo360 / SectionFinalCTA / ticker / footer. 0 console errors; only the two known React Router future-flag warnings. No horizontal scroll (docWidth 1265, viewport 1280).
- Playwright smoke at 390×844 mobile: **initial smoke failed with 141px overflow (stop-condition 3 triggered)**. Root cause traced via `getBoundingClientRect()` audit — Dispatch A's `ViabilityFooter` was forcing a 4-col grid + 56px inline padding even at 390px viewport. `ViabilityHeader` had the same hardcoded `px-14`. Patched both as described above. Re-smoke confirmed no horizontal scroll (docWidth 375, viewport 390). Mobile full-page screenshot shows header collapse, sections stack to single column, footer 4 cols → 1 col, Mojo 360 CTA wraps below copy.
- `/_design-preview` → 404 (catch-all `NotFoundPage`) ✓.
- `/`, `/how-it-works`, `/reach-out`, `/start` direct-nav check pending — left for Max's Vercel smoke.

## In Progress

None — Dispatch B is a closed unit.

## Blockers

None blocking Dispatch C.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase (Step 1 leak).

## Notes on copy interpretation

Per dispatch acceptance criterion: "All copy strings reviewed against `prototype/sections.jsx` — flag in handover any line where the prototype copy was unclear and the Executor had to interpret."

- **Hero subline says "Move the three sliders"** (lifted verbatim from `prototype/heroes-v2.jsx:161`). However the README's actual `LiveDossierCard` spec lists **four** sliders (Annual rent, Cost of goods, Labour, Other costs). The prototype subline appears out of date relative to the live dossier spec. Kept the prototype's "three" for now since this is a placeholder; **Dispatch C should update the subline to "Move the four sliders" when the real hero ships** OR Max should decide whether to keep "three" by hiding/folding one slider in Dispatch C.
- **SectionBuiltFor kickers** are the persona names ("First venue", "Venue #2", "Investor · partner") per `prototype/sections.jsx`. The dispatch §4.4 said "Cards 2 and 3 use the same 02 / 03 mono kickers as 4.3" — this contradicts the prototype. Went with the prototype since the dispatch elsewhere said "lift exact titles, blurbs, and any module lists from prototype/sections.jsx". Flag for Max if numeric kickers were intended.
- **SectionBuiltFor card BODY** dropped the "Start with this →" footer link from the prototype — the dispatch didn't reference it and there's no destination to wire it to (cards aren't currently clickable / routable). Easy to re-add in a later dispatch if needed.
- **Founder card border-top before the avatar** uses `border-viability-border`; prototype uses `VBR.hairline` which is the same RGBA value just expressed differently.
- **SectionProof tagline size**: prototype uses `clamp(22px, 2.2vw, 30px)`; dispatch specified `clamp(28px, 2.4vw, 36px)`. Went with the dispatch's larger size since the dispatch was explicit and more recent.
- **SectionProof font-weight** on the giant `~1 in 2` is `font-bold` (700) per both sources.

All copy reviewed; nothing else surprising.

## Phase 2.5 / future-cleanup follow-ups

### New from Step 11b-B
- **(11b-B) Required before public launch:** Confirm the precise ABS source for the "~1 in 2" proof stat. Flagged in code with a `TODO` comment above the stat in `SectionProof.tsx`. The prototype's wording ("ABS-aligned analyses put five-year survival around 45–50%") + the source line ("Source · Commentaries back-checking ABS small-business counts (8165.0). Figures are approximations.") may need refinement with a precise URL or report citation before going live.
- **(11b-B) Pre-launch review:** Founder story copy in `SectionProof.tsx` is lifted verbatim from the prototype. Max may want refinement before launch.
- **(11b-B) Pre-Dispatch D decision:** **Retire `HowItWorksPage` route?** The new chrome has no "How It Works" entry in the nav (deliberately removed per README — the on-page section does the work). `/how-it-works` still exists and still renders the legacy `LandingHeader`. Three options: (a) delete the route + page entirely; (b) keep the route as a 301 redirect to `/#how`; (c) leave as-is until Dispatch D. Recommend deciding before D so D can clean it up.
- **(11b-B) Pre-Dispatch D:** Same decision for `LandingHeader.tsx` — still imported by `ReachOutPage` (rewrite due in Dispatch D) and `HowItWorksPage` (decision above). Delete `LandingHeader.tsx` when both consumers are gone.
- **(11b-B) Mobile chrome:** Mobile header currently hides the centre nav entirely (acceptable per dispatch). README spec calls for a hamburger glyph (two 18×1.5 cream bars, gap 4) — defer to a Phase 2.5 / mobile-polish dispatch.
- **(11b-B) Hero subline:** "Move the three sliders" vs the four-slider live dossier — see Notes above. Dispatch C should resolve.

### Reclassified from prior steps
- "StartPage's 'Try as guest' deferred" — moved off the carry-forward list in Dispatch A.

### From Step 11b-A (still outstanding)
- Confirm ABN with Max (footer placeholder `ABN ###`).
- Mojo 360 footer card uses inline-style gradient — acceptable.

### From prior steps (unchanged)
- (10b NORMAL) Phase 2.5 wishlist: `occupancyType` cross-section feature (rent ↔ mortgage swap).
- (10b LOW) Opt into React Router v7 future flags.
- (10a LOW) Triple-nested EXISTS in `project_content_uploads` RLS policy.
- (10a) Unused-index advisors for `business_scenarios` indexes.
- (9b) Inline rename dialog placeholder; full `<EditProjectSettingsDialog>` per anatomy §1.4.
- (9b) Inline export dialog (PDF+Excel only); full 3-button export per anatomy §1.4.
- (9b) "New project" creation flow is a stub.
- (9b LOW) `@/lib/export` index re-exports invisible to TS bundler module resolution.
- (9) `InviteAcceptancePage` is a placeholder.
- (9) `ProjectsListPage` uses `useEffect` + manual fetch instead of `useQuery`.

## Next Session

**Smoke Dispatch B on Vercel preview.** Max runs the §6 smoke (S1–S16) on the deployed preview URL — full landing top-to-bottom + Mojo 360 link opens new tab + auth-aware header CTA flip + mobile collapse without horizontal scroll + `/_design-preview` 404 + no regressions on legacy pages.

**If smoke is green → request Dispatch C from the Planner.** Dispatch C will replace `<HeroPlaceholder>` with the interactive Live Dossier (4 sliders, threshold-driven traffic-light verdict, sample-venue presets, derived margin calculations). The dossier itself is the page's centrepiece — it's the differentiator that justifies the new landing.

**If smoke surfaces issues:** fix in place, re-commit, re-smoke. Don't proceed to Dispatch C until B is clean.

## Key References

**Commits this session:**
- **Implementation: `cf6712a feat: viability landing page rewrite + six sections (Step 11b-B)`** — 14 files, +620 / −690 LOC (net -70).
- Branch: `main` (now 3 commits ahead of `origin/main` after the docs + Dispatch A + Dispatch B commits — push when ready).

**Files added (9):**
- `src/components/viability/landing/SectionShell.tsx`
- `src/components/viability/landing/SectionWhat.tsx`
- `src/components/viability/landing/SectionBuiltFor.tsx`
- `src/components/viability/landing/ShopfrontPlaceholder.tsx`
- `src/components/viability/landing/SectionHow.tsx`
- `src/components/viability/landing/SectionProof.tsx`
- `src/components/viability/landing/SectionMojo360.tsx`
- `src/components/viability/landing/SectionFinalCTA.tsx`
- `src/components/viability/landing/HeroPlaceholder.tsx`

**Files modified (4):**
- `src/pages/LandingPage.tsx` — 619 → 27 LOC
- `src/App.tsx` — drop `LandingPageRoute` + `_DesignPreview` import/route
- `src/components/viability/ViabilityHeader.tsx` — mobile responsiveness fix
- `src/components/viability/ViabilityFooter.tsx` — mobile responsiveness fix

**Files deleted (1):**
- `src/pages/_DesignPreview.tsx`

**Step 11b-B metrics:**
- Module count: 2,565 → 2,573 (+8 net)
- CSS bundle: 65.60 KB → 70.01 KB (+4.4 KB — Tailwind picked up section utilities)
- LandingPage: 619 LOC → 27 LOC (~96% reduction)
- Sub-agent fan-outs: 0
- Stop conditions triggered: 1 (mobile horizontal overflow at 390px — patched in same commit)
- Smoke iterations: 2 (initial desktop smoke green; mobile smoke failed → patched chrome → re-smoke green)

**Architectural strip log (no Mojo 360 concepts stripped in 11b-B):**
- (no additions this session)

**Cumulative inventory misses (still 8 — Step 11b-B added zero):**
- Unchanged from prior handovers.

**Planning docs (read in order at session start):**
- `context/dispatches/step-11b-strategic-rebuild-index.md`
- `context/dispatches/step-11b-A-tokens-and-shared.md` (complete)
- `context/dispatches/step-11b-B-landing-and-sections.md` (THIS dispatch, now complete) — actual filename TBD; search `context/dispatches/` for the most recent landing dispatch
- `context/design_handoff_landing_and_reach_out/README.md` — full design spec
- `context/design_handoff_landing_and_reach_out/prototype/sections.jsx` — source of truth for section copy
- `context/design_handoff_landing_and_reach_out/prototype/heroes-v2.jsx` — source of truth for hero copy + the Live Dossier spec (for Dispatch C)
- `context/viability-extraction/extraction-plan-2026-05-09.md`
- `context/viability-extraction/phase-2-implementation-plan.md`

**Auth surface (unchanged):**
- `<AuthProvider>` exposes `{ user, isLoading, signIn, signUp, signOut }`
- `<ViabilityHeader>` reads `useAuth().user` to flip CTAs

**Hooks at `src/features/project/hooks/` (still 7 — no change in 11b-B):**
- `useProject.ts`, `useProjectAutoSave.ts`, `useKeyboardShortcuts.ts`, `useProjectPermissions.ts`, `useRenameProject.ts`, `useSaveProject.ts`, `useUpdateProjectData.ts`
