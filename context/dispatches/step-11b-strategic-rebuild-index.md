# Step 11b — Strategic Rebuild Index

Front door for the strategic rebuild of the Mojo Viability public surface. Replaces the inherited Mojo 360 landing chrome with the high-fidelity design handed off in [`context/design_handoff_landing_and_reach_out/`](../design_handoff_landing_and_reach_out/).

**This is an index, not an Executor dispatch.** The four dispatches below each have their own document. Run them sequentially — each one ships and smokes before the next is written.

---

## Why four dispatches

The handoff specifies two pages (Landing + Reach Out), ~14 components, an interactive 4-slider live calculator, new fonts, a token system, and a submission backend. Doing this in one Executor session means a multi-hour commit with late smoke surfacing — exactly the failure mode we hit on Step 9. Splitting gives each surface its own typecheck, build, and visual smoke.

Sequencing also lets each dispatch absorb learning from the previous. If the token wiring in A surfaces a Tailwind quirk, B and C inherit the fix rather than rediscovering it.

---

## Decisions locked

From the planning conversation that authored this index:

- **11a tactical patch is absorbed.** Only two items survive into Dispatch A: `vercel.json` SPA fallback (fixes `/privacy` + `/terms` 404 on the live deploy) and `StartPage` guest-card hide. Everything else in the 11a draft is moot — the strategic rebuild replaces those surfaces wholesale.
- **Scope is both Landing AND Reach Out.** Reach Out gets its own dispatch (D) because of the submission endpoint.
- **CTA destinations: `Try free →` and `Let's do this properly →` both route to `/start`.** Keep the existing onboarding funnel. Guest mode remains deferred to Phase 2.5 (the StartPage card is hidden, not built out).
- **Visual identity is locked by the handoff.** Dark canvas (`#080808`) + cream foreground (`#f5f2ed`) + emerald accent (`#34d399`) + Fraunces headline / DM Sans body / Syne (only inside the Mojo 360 cross-link). Amber `rgba(232,180,90,0.92)` reserved for deal-breaker emphasis. Burnt-orange `#e8622a` reserved for the Mojo 360 sibling card only.
- **Voice is locked.** Australian English. No exclamation marks. No emoji. No SaaS clichés. Reader is "you," "we" only in the founder story. Numbers and specificity over adjectives.

---

## Out of scope (not addressed in any of A–D)

- `AuthPage`, `WelcomePage` redesign — they remain on the current visual system. Visual seam between the new landing surface and these pages is accepted as a known follow-up.
- `HowItWorksPage` — the on-page "How it works" section on the new landing supersedes it. Route stays alive (SEO / bookmarks) but it's de-listed from nav and not re-themed.
- `PrivacyPage`, `TermsPage` — content stays as-is. They become reachable via the new footer once the rebuild ships (and via direct URL once `vercel.json` lands in A).
- Existing inner project surfaces (`/project/:id/*`) — unaffected.
- Guest-mode plumbing — Phase 2.5 wishlist, still deferred.
- Reach Out submission endpoint server-side — Dispatch D includes the client form + a thin endpoint, but reliability hardening (retries, queueing, monitoring) is out of scope and gets a follow-up.

---

## Dispatch summary

### Dispatch A — Tokens + shared chrome + tactical leftovers

**File:** [`step-11b-A-tokens-and-shared.md`](./step-11b-A-tokens-and-shared.md)

**Goal:** establish the design-token foundation and ship the shared chrome (header, footer, ticker) plus utility components used everywhere else. Does NOT touch `LandingPage.tsx` or any of the six landing sections yet — those land in B.

**Builds:** `vercel.json` · CSS-var tokens in `src/index.css` · Tailwind theme extension · two M-glyph SVG assets · `MGlyph` · `Eyebrow` · `VButton` (wraps shadcn `Button`) · `HairlineLabel` · `ViabilityTicker` · `ViabilityHeader` · `ViabilityFooter` · temporary `/_design-preview` route to visually smoke the chrome in isolation · `StartPage` guest-card hide (the 11a survivor).

**Does NOT build:** `LandingPage` content · any landing sections · the Live Dossier · Reach Out · `ReachOutHero` · `ContactForm` · submission endpoint.

**Smoke focus:** typecheck + build green; `/privacy` and `/terms` resolve on Vercel preview; `/_design-preview` shows the header / ticker / footer rendered correctly with the new fonts and tokens; ticker scrolls and respects `prefers-reduced-motion`; header CTAs swap correctly on auth state.

**Est. time:** 3–4h Executor work.

### Dispatch B — Landing page + sections (no live dossier yet)

**File (to be authored after A ships green):** `step-11b-B-landing-sections.md`

**Goal:** replace `LandingPage.tsx` with the new structure. The six sections below the hero are built in full. The Hero is a static placeholder ("Live Dossier coming in C") so the page composes end-to-end without the calc widget — meaning Max can smoke section copy + layout + responsive behaviour in isolation from the most complex piece.

**Builds:** new `LandingPage.tsx` · `SectionShell` (the 1180-wide content-area wrapper) · `SectionWhat` · `SectionBuiltFor` · `SectionHow` (with `ShopfrontPlaceholder` — the CSS-drawn placeholder boxes) · `SectionProof` · `SectionMojo360` (Syne typography, orange tokens, only place they appear) · `SectionFinalCTA` · static hero placeholder · wires `/` route to render the new LandingPage with `ViabilityHeader` + tickers + `ViabilityFooter`.

**Does NOT build:** the Live Dossier (placeholder only) · Reach Out.

**Smoke focus:** the page composes top to bottom, copy reads correctly in Australian English, the Mojo 360 strip uses orange + Syne (and is the ONLY place they appear), proof block displays the stat + founder story, responsive collapse to mobile is sane.

**Est. time:** 4–6h.

### Dispatch C — Live Dossier hero

**File (to be authored after B ships green):** `step-11b-C-live-dossier.md`

**Goal:** replace the placeholder hero from B with the interactive 4-slider Live Dossier. This is the centrepiece of the page and the highest-risk dispatch — bespoke slider component, threshold logic for each row, verdict-bar state machine, animations, reduced-motion handling, tabular-nums formatting.

**Builds:** `HeroLiveDossier` (left rail with H1, sub, CTAs, stat triple) · `LiveDossierCard` · `DossierSlider` (custom — hidden `<input type="range">` with styled track + thumb; or shadcn `<Slider>` if it can be styled to spec) · `DossierRow` (with threshold-driven dot colours) · `VerdictBar` (state machine driven by red/amber counts + margin sign) · sample-venue presets · slider-touched state ladder.

**Does NOT build:** anything not in the hero.

**Smoke focus:** sliders move smoothly with no value jitter (tabular-nums working) · row lights flip at the documented thresholds · verdict bar transitions through all seven states (pending → walk-away × 2 → one-deal-breaker → viable-but-tight × 2 → viable) · reduced-motion freezes animations · keyboard a11y on the native input still works.

**Est. time:** 5–7h.

### Dispatch D — Reach Out page

**File (to be authored after C ships green):** `step-11b-D-reach-out.md`

**Goal:** build the Reach Out surface — landing page for prospects who want to contact you. Wires `/reach-out` route.

**Builds:** `ReachOutHero` · `ContactForm` (Field, Input, Textarea, `RolePills`) · `FounderCard` (aside with avatar, quote, stat tiles, channel row) · `SentState` (post-submit card swap, no page reload) · submission endpoint (Supabase row + email notification to `max@mojobusiness.ai`).

**Smoke focus:** form validates (name/email/message required, email format), submits successfully, `SentState` renders with correct copy, Supabase row lands, email notification arrives, role pills toggle correctly, mobile layout collapses cleanly.

**Est. time:** 4–5h (Executor) + 30 min (Max wiring the Supabase row / email if he wants to handle the backend himself).

---

## Cross-dispatch concerns

These apply to every dispatch — capture once here rather than repeating.

### Australian English

Every piece of copy. `modelling` not `modeling`, `labour` not `labor`, `centre` not `center`, `favourite` not `favorite`, `organisation` not `organization`.

### Voice and copy rules

- No exclamation marks. No emoji. No SaaS clichés.
- Address the reader as "you." `we` only inside the founder story.
- Loss-aversion framing in headlines.
- Numbers and specificity over adjectives.
- Arrow convention: `→`. Bullet separator: `·`.
- Don't soften the headline copy into "empower your business" — the page's edge is its honesty.

### Token discipline

Once Dispatch A lands, no component in the Viability surface is allowed to use a raw hex code. Everything goes through the `viability` Tailwind namespace OR a CSS var. Exception: the Mojo 360 strip and its footer cross-link card use the orange `--m360-*` tokens — these are explicitly scoped to that one surface.

### Asset rules

No raster imagery. The only assets are the two M-glyph SVGs (Viability emerald + Mojo 360 orange). No stock hero photos. No illustrations. The CSS-drawn `ShopfrontPlaceholder` boxes in `SectionHow` are intentional — corner brackets, diagonal hatch, mono caption.

### No testimonials

Don't write any. The handoff explicitly warns. Real ones will land when they exist.

### Reduced motion

Every animation must respect `prefers-reduced-motion: reduce`. Most prominently: the ticker (freeze position), the hero fade-up (no fade), the verdict-bar transitions (instant). Test in macOS System Settings → Accessibility → Display → Reduce motion.

### Australian-English implementation note

When TypeScript / ESLint suggests an autocomplete spelling correction in American English, accept the linter's spelling for identifiers and TypeScript symbols (`color`, `behavior`, `customize`), but use Australian spelling in every string the user sees. Identifier `color` is fine; copy that says "favorite colour" is not.

---

## Order of execution

```
Dispatch A  →  Max smokes A  →  Author Dispatch B  →
Dispatch B  →  Max smokes B  →  Author Dispatch C  →
Dispatch C  →  Max smokes C  →  Author Dispatch D  →
Dispatch D  →  Max smokes D  →  Strategic rebuild complete  →
                                Step 12 (mojo_business cleanup) opens
```

Each "Max smokes X" step is the actual Step 11 smoke for that surface. If smoke fails on any dispatch, fix in a follow-up commit on the same dispatch, don't proceed.

---

## Known unknowns surfaced to Max

Items the Planner couldn't lock without additional input. None block Dispatch A.

1. **Reach Out submission backend (Dispatch D).** Three options for the endpoint: (a) a serverless function under `api/reach-out` using the existing Supabase service-role key, (b) a direct Supabase insert from the client (RLS-policy-gated), (c) hand-rolled SendGrid/Postmark email via an existing notification path. Decide before D is authored.
2. **Live Dossier "Try another venue" toggle (Dispatch C).** The handoff exposes `venueKey` ('cafe' / 'winebar' / 'pub') with per-venue presets, but says the production default is `cafe` and the tweaks panel is removed. Question: do we expose a small "Try a wine bar instead" inline toggle for users, or strictly lock to café? Defaults to "strictly café" unless told otherwise.
3. **HowItWorksPage retirement.** Currently it's a 487-LOC inherited page. The new landing has an on-page "How it works" section that supersedes it. Question: keep the route alive indefinitely, or schedule deletion in a future cleanup pass? Defaults to "keep alive, de-list from nav," but if SEO doesn't matter, deletion is cleaner.

---

## Files touched across all four dispatches (forward look)

A working map for future cleanup / git-blame archeology — not authoritative until the dispatches actually ship.

**New files:**
- `vercel.json` (A)
- `src/components/viability/MGlyph.tsx` (A)
- `src/components/viability/Eyebrow.tsx` (A)
- `src/components/viability/VButton.tsx` (A)
- `src/components/viability/HairlineLabel.tsx` (A)
- `src/components/viability/ViabilityTicker.tsx` (A)
- `src/components/viability/ViabilityHeader.tsx` (A)
- `src/components/viability/ViabilityFooter.tsx` (A)
- `src/pages/_DesignPreview.tsx` (A — temporary, removed after C ships)
- `public/icons/m-viability.svg` (A — copied from prototype)
- `public/icons/m-mojo360.svg` (A — copied from prototype)
- `src/components/viability/landing/SectionShell.tsx` (B)
- `src/components/viability/landing/SectionWhat.tsx` (B)
- `src/components/viability/landing/SectionBuiltFor.tsx` (B)
- `src/components/viability/landing/SectionHow.tsx` (B)
- `src/components/viability/landing/ShopfrontPlaceholder.tsx` (B)
- `src/components/viability/landing/SectionProof.tsx` (B)
- `src/components/viability/landing/SectionMojo360.tsx` (B)
- `src/components/viability/landing/SectionFinalCTA.tsx` (B)
- `src/components/viability/landing/hero/HeroLiveDossier.tsx` (C)
- `src/components/viability/landing/hero/LiveDossierCard.tsx` (C)
- `src/components/viability/landing/hero/DossierSlider.tsx` (C)
- `src/components/viability/landing/hero/DossierRow.tsx` (C)
- `src/components/viability/landing/hero/VerdictBar.tsx` (C)
- `src/components/viability/landing/hero/thresholds.ts` (C)
- `src/components/viability/landing/hero/samplePresets.ts` (C)
- `src/components/viability/reach-out/ReachOutHero.tsx` (D)
- `src/components/viability/reach-out/ContactForm.tsx` (D)
- `src/components/viability/reach-out/RolePills.tsx` (D)
- `src/components/viability/reach-out/FounderCard.tsx` (D)
- `src/components/viability/reach-out/SentState.tsx` (D)
- `src/pages/ReachOutPage.tsx` — replaces existing 196-LOC file (D)
- `api/reach-out.ts` or equivalent (D — depending on KU#1 answer)

**Modified files:**
- `src/index.css` (A — token additions to `:root`)
- `tailwind.config.js` (A — `viability` namespace, fonts, radii)
- `index.html` (A — Fraunces + Syne font links)
- `src/App.tsx` (A — register `/_design-preview` route)
- `src/pages/StartPage.tsx` (A — guest-card hide)
- `src/pages/LandingPage.tsx` — fully rewritten (B)
- `src/App.tsx` (B — remove `_design-preview` route, wire new LandingPage)

**Removed files:**
- `src/components/LandingHeader.tsx` — replaced by `ViabilityHeader` (B, once nothing imports it)

---

## Handover note

The Executor of each dispatch updates [`handover/HANDOVER.md`](../../handover/HANDOVER.md) at session end per the template in [`CLAUDE.md`](../../CLAUDE.md). Reference this index from the handover so the next Executor finds the chain.
