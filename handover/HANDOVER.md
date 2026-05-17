# Mojo Viability Handover — 2026-05-17 (Step 11b-C)

## Session Summary

Dispatch 11b-C shipped. The static `HeroPlaceholder` is replaced by the full interactive **Live Dossier** — a four-slider live break-even calculator with threshold-driven traffic-light verdict rows and a 7-state verdict bar. The landing page is now interactive top-to-bottom. Only Reach Out (Dispatch D) remains in the strategic rebuild. Carry-forward copy fixes from Dispatch B's smoke also landed: hero subline corrected to "four sliders" and the founder story patched ("I built Mojo Viability" + closing typographic quote).

## Completed

**Implementation commit** (`7906a9a`):

New files under [src/components/viability/landing/hero/](src/components/viability/landing/hero/):
- [thresholds.ts](src/components/viability/landing/hero/thresholds.ts) — typed `THRESHOLDS` table for the five rows + `lightFor(value, touched, t)` returning `'pending' | 'green' | 'amber' | 'red'`. Direction-aware (`'lt'` for cost rows, `'gt'` for net margin).
- [samplePresets.ts](src/components/viability/landing/hero/samplePresets.ts) — `SAMPLE_VENUES` (cafe / winebar / pub, each with `empty` / `mid` / `complete` presets) + `fmtRent` / `fmtRentShort` / `fmtPercent` helpers. `DEFAULT_VENUE = 'cafe'`, `DEFAULT_INITIAL_STATE = 'empty'`. Winebar + pub presets are preserved for future Dispatch C+1 use; v1 only consumes cafe.
- [DossierSlider.tsx](src/components/viability/landing/hero/DossierSlider.tsx) — custom slider. Hidden native `<input type="range">` (a11y + keyboard) + styled visual track + thumb. **Thumb is `pointer-events-none`** so the input below stays the interactive surface (avoids stop-condition 1). Transitions wrapped in `motion-safe:` so reduced-motion freezes the easing but the thumb still jumps to new positions.
- [DossierRow.tsx](src/components/viability/landing/hero/DossierRow.tsx) — single verdict row. Threshold-driven dot colour (green / amber / red / pending=faint). Emphasised variant for the net margin row: bigger value/dot, tinted bg via negative-margin trick (`-mx-[22px] px-[22px]`) so the tint reaches the card hairline.
- [VerdictBar.tsx](src/components/viability/landing/hero/VerdictBar.tsx) — purely presentational. Receives `tone` / `label` / `sub` props; tone drives bg + border + dot + dot-glow + label colour. State-machine logic lives in `LiveDossierCard`.
- [LiveDossierCard.tsx](src/components/viability/landing/hero/LiveDossierCard.tsx) — composes header strip + concept block + 4 sliders + 5 rows + verdict bar. Owns `vals` and `touched` state; re-seeds from preset when `venueKey`/`initialState` change. Verdict logic computes `reds` / `ambers` / `netMargin` and selects one of 7 verdict shapes per the spec table.
- [HeroLiveDossier.tsx](src/components/viability/landing/hero/HeroLiveDossier.tsx) — full hero. Left rail (eyebrow + h1 + subline + CTAs + stat triple) + right rail (`<LiveDossierCard />`). Replaces `HeroPlaceholder`.

Modified:
- [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx) — import + render swap: `HeroPlaceholder` → `HeroLiveDossier`.
- [src/components/viability/landing/SectionProof.tsx](src/components/viability/landing/SectionProof.tsx) — two copy fixes:
  - "I built Viability" → "I built **Mojo** Viability"
  - Added typographic closing double-quote (U+201D) after "family." (the opening U+201C was already typographic). No en-US spellings found on a scan.

Deleted:
- `src/components/viability/landing/HeroPlaceholder.tsx` (git tracks this as a rename of `HeroPlaceholder.tsx` → `hero/HeroLiveDossier.tsx` due to similarity threshold, but the file is fully rewritten — the diff shows `~72%` similarity which is just folder structure / boilerplate overlap).

**Verification**
- `npm run typecheck`: GREEN
- `npm run build`: GREEN (2,573 → 2,581 modules — +8 from the seven new files + reorganisation; CSS 70.01 KB → 74.40 KB)
- Playwright smoke at 1280×900 desktop:
  - Initial render: header / hero h1 / subline reading "Move the four sliders → … twelve-module version" / dossier card with header strip, concept block (40-seat café · Brunswick East · Melbourne), four sliders all showing "$— · set this" / "—% · set this", five verdict rows showing "—" with faint dots and "awaiting slider" hints, verdict bar reading "Move the four sliders to see the verdict" / "— · —".
  - **Green path (rent 50k, cogs 28, labour 25, other 18, net margin 29)** → all 5 rows green, verdict bar: "Viable · on these ratios, the numbers stack" ✓
  - **Red walk-away (rent 200k, cogs 40, labour 40, other 30, net margin −10)** → all 5 rows red, verdict bar: "Walk away · costs exceed sales" (correctly prioritising the negative-margin branch over the reds-count branch) ✓
  - **One-deal-breaker (rent 50k, cogs 28, labour 25, other 40, net margin 7)** → 3 green rows + 1 red (other) + 1 amber (margin), verdict bar: "One deal-breaker · re-cut it · fix this before signing" ✓
- 0 console errors throughout, only the two known React Router future-flag warnings.
- Mobile collapse at 390×844: docWidth 375, viewport 390, no horizontal scroll. Hero stacks correctly (left rail above dossier card).
- Founder story screenshot confirmed: opening green-italic typographic open quote + "Behind every closed venue there's a family." + closing typographic quote. Body paragraph reads "I built **Mojo** Viability because the deal-breakers…".

## Patches after Dispatch C

Two follow-up commits landed on top of `7906a9a`:

**`b10bf8d feat: wire shopfront-interior photo + match founder closing quote style`**
- `ShopfrontPlaceholder` extended with an optional `image` prop. When set: renders the photo full-bleed via `<img loading="lazy">`, drops the centred mono caption, keeps the editorial corner brackets. When unset: original diagonal-hatch + caption behaviour (still used until a tile gets its photo).
- `SectionHow` wired the left placeholder to `/images/landing-shopfront-interior.jpg` (84 KB).
- `SectionProof` founder pull-quote closing typographic double-quote now matches the opening — green-italic Fraunces at 56px with the same baseline trick. Symmetric bookends around the lead line.

**`246a817 feat: wire unsigned-lease photo into SectionHow`** (Step 11b-C-patch)
- Right placeholder in SectionHow now renders `/images/landing_unsigned_lease.jpg` (88 KB). Mirrors the left side's wiring. No caption overlay.

**Notes for follow-up:**
- **Filename inconsistency** — `landing-shopfront-interior.jpg` uses hyphens; `landing_unsigned_lease.jpg` uses underscores. Cosmetic only; rename one for consistency in a future sweep.
- **Unused PNG masters** — `landing-shopfront-interior.png` (2.4 MB) and `landing_unsigned_lease.png` (1.7 MB) both sit in `public/images/`. Vercel will serve them but the site never references them. Sweep before public launch.

## In Progress

None — Dispatch C is a closed unit.

## Blockers

None blocking Dispatch D.

**Carried over (still outstanding for Max outside the session):**
- Rotate the password for `admin@maxsenterprises.com.au` in Supabase (Step 1 leak).

## Notes on implementation choices

- **Slider input event:** uses `onChange` (which React maps to the native `input` event). Verified during smoke by dispatching `Event('input', { bubbles: true })` — state updates immediately. Stop-condition 1 ("native input doesn't fire onChange events when the visible thumb is dragged") did NOT trigger thanks to `pointer-events-none` on the visual thumb.
- **`showAmber` baked in as true** — the prototype had a toggle for "quiet stakes" mode that swapped amber for muted cream. Per dispatch §3 OUT we removed the toggle; amber tokens used directly everywhere. Future-cleanup item if Max ever wants the muted variant back.
- **Net margin row label** uses two-tone rendering: `"Net margin"` in cream + `· what's left over` in fg-subtle. Matches the prototype's `<span><span color=cream>Net margin</span> · what's left over</span>` shape.
- **Net margin hint** uses the prototype's wording verbatim: `healthy · over 10%` / `tight · 5–10%` / `red flag · under 5%` / `red flag · costs exceed sales`. The dispatch's spec said "tight · over 5%" but the prototype's "tight · 5–10%" is more precise and we went with prototype as instructed.
- **Verdict bar role/aria-live:** added `role="status" aria-live="polite"` so screen readers announce verdict changes when sliders move. Not specified in dispatch but a small a11y win.
- **Threshold values:** README, dispatch, and prototype agree. No divergence to flag.

## Phase 2.5 / future-cleanup follow-ups

### New from Step 11b-C
- **(11b-C) Pre-Dispatch D:** Hero subline now correctly says "four sliders" — Dispatch B carry-forward resolved.
- **(11b-C) Pre-launch:** Founder story copy is now "I built Mojo Viability …" with proper closing quote. Still lifted verbatim from the prototype except those two fixes; Max may still want further refinement.
- **(11b-C) Phase 2.5 wishlist:** Re-add the venue-switcher (cafe / winebar / pub) and starting-state toggle (empty / mid / complete) once Dispatch C+1 is appropriate. All three venue presets already ship in `samplePresets.ts`.
- **(11b-C) Phase 2.5 wishlist:** Re-add the `showAmber` "quiet stakes" toggle if Max wants the muted-cream amber variant available.
- **(11b-C) Phase 2.5:** "Export · PDF / xls →" in the verdict bar is non-interactive copy in v1. Wire to a real export action once the unauthed-export story is decided.

### Carried from Dispatch B
- **Pre-launch:** Confirm precise ABS source for the "~1 in 2" proof stat (TODO comment in `SectionProof.tsx`).
- **Pre-launch:** Final review of founder story copy.
- **Pre-Dispatch D:** Decide fate of `HowItWorksPage` route and `LandingHeader.tsx` (no nav entry; still imported by `HowItWorksPage` + `ReachOutPage`).
- **Mobile chrome:** Mobile header still hides the centre nav entirely. README spec calls for a hamburger glyph — defer to mobile-polish dispatch.

### Carried from Dispatch A
- Confirm ABN with Max (footer placeholder `ABN ###`).

### From prior steps (unchanged)
- (10b NORMAL) `occupancyType` cross-section feature (rent ↔ mortgage swap).
- (10b LOW) React Router v7 future flags.
- (10a LOW) Triple-nested EXISTS in `project_content_uploads` RLS policy.
- (10a) Unused-index advisors for `business_scenarios` indexes.
- (9b) Inline rename / export / new-project placeholders.
- (9b LOW) `@/lib/export` index re-exports bundler issue.
- (9) `InviteAcceptancePage` is a placeholder.
- (9) `ProjectsListPage` uses `useEffect` + manual fetch instead of `useQuery`.

## Next Session

**Smoke Dispatch C on Vercel preview.** Max runs the §6 smoke (S1–S16) on the deployed preview URL — full slider interaction, all 7 verdict states reached, keyboard accessibility (tab into sliders, arrow keys), reduced-motion gates, mobile collapse, founder copy. The biggest visual smoke target this dispatch.

**Pre-Dispatch D decision required:** the strategic-rebuild index flagged a Known Unknown #1 — the submission backend for the Reach Out form. Three options:
1. **Vercel serverless function** that validates + stores to Supabase + emails Max via SendGrid/Postmark/Resend.
2. **Direct Supabase insert** from the client (with an RLS-protected `contact_messages` table) + a Supabase Edge Function trigger for the email.
3. **Hand-rolled email-only** (no DB) via a serverless function + an email provider.

Max should pick one before Dispatch D is requested so the dispatch can author the destination.

**If smoke is green → request Dispatch D from the Planner** with the backend decision attached.

**If smoke surfaces issues:** fix in place, re-commit, re-smoke. Don't proceed to Dispatch D until C is clean.

## Key References

**Commits this session:**
- **Implementation: `7906a9a feat: live dossier interactive hero (Step 11b-C)`** — 9 files, +651 / −21 LOC (net +630).
- Branch: `main` (now 4 commits ahead of `origin/main` after Dispatch B + handover + 11b-C + this handover — push when ready).

**Files added (7):**
- `src/components/viability/landing/hero/thresholds.ts`
- `src/components/viability/landing/hero/samplePresets.ts`
- `src/components/viability/landing/hero/DossierSlider.tsx`
- `src/components/viability/landing/hero/DossierRow.tsx`
- `src/components/viability/landing/hero/VerdictBar.tsx`
- `src/components/viability/landing/hero/LiveDossierCard.tsx`
- `src/components/viability/landing/hero/HeroLiveDossier.tsx`

**Files modified (2):**
- `src/pages/LandingPage.tsx` (import + render swap)
- `src/components/viability/landing/SectionProof.tsx` (founder copy)

**Files deleted (1):**
- `src/components/viability/landing/HeroPlaceholder.tsx`

**Step 11b-C metrics:**
- Module count: 2,573 → 2,581 (+8 net)
- CSS bundle: 70.01 KB → 74.40 KB (+4.4 KB — Tailwind picked up the new dossier utilities)
- Sub-agent fan-outs: 0
- Stop conditions triggered: 0 (initial design avoided all of them)
- Smoke iterations: 1 (all paths green first pass — pending/green/red/one-deal-breaker states all verified via Playwright + mobile collapse)

**Architectural strip log (no new strips in 11b-C — this was new authoring):**
- (no additions this session)

**Cumulative inventory misses (still 8 — Step 11b-C added zero):**
- Unchanged from prior handovers.

**Planning docs (read in order at session start):**
- `context/dispatches/step-11b-strategic-rebuild-index.md`
- `context/dispatches/step-11b-A-tokens-and-shared.md` (complete)
- Dispatch B + C dispatches (filenames TBD in `context/dispatches/`)
- `context/design_handoff_landing_and_reach_out/README.md` — full design spec
- `context/design_handoff_landing_and_reach_out/prototype/heroes-v2.jsx` — source of truth for hero copy, SAMPLE_VENUES, THRESHOLDS, SLIDER_CFG, VERDICT logic — was the primary reference for this dispatch
- `context/design_handoff_landing_and_reach_out/prototype/sections.jsx`
- `context/viability-extraction/extraction-plan-2026-05-09.md`
- `context/viability-extraction/phase-2-implementation-plan.md`

**Auth surface (unchanged):**
- `<AuthProvider>` exposes `{ user, isLoading, signIn, signUp, signOut }`
- `<ViabilityHeader>` reads `useAuth().user` to flip CTAs

**Hooks at `src/features/project/hooks/` (still 7 — no change in 11b-C):**
- `useProject.ts`, `useProjectAutoSave.ts`, `useKeyboardShortcuts.ts`, `useProjectPermissions.ts`, `useRenameProject.ts`, `useSaveProject.ts`, `useUpdateProjectData.ts`

**Folder layout under `src/components/viability/landing/` after 11b-C:**
```
landing/
├── SectionShell.tsx
├── SectionWhat.tsx
├── SectionBuiltFor.tsx
├── SectionHow.tsx
├── ShopfrontPlaceholder.tsx
├── SectionProof.tsx
├── SectionMojo360.tsx
├── SectionFinalCTA.tsx
└── hero/
    ├── HeroLiveDossier.tsx
    ├── LiveDossierCard.tsx
    ├── DossierSlider.tsx
    ├── DossierRow.tsx
    ├── VerdictBar.tsx
    ├── thresholds.ts
    └── samplePresets.ts
```
