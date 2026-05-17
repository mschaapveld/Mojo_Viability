# Mojo Viability Handover — 2026-05-17 (Step 11c — Auth rebrand · recovery state)

## How this project runs

This project uses a **two-Claude workflow** that you (the Executor session) need to know about up front:

- **Planner** lives in a separate Claude session. The Planner reads handover docs and design materials, scopes work, and writes **dispatches** — structured prompts that tell you what to build, with explicit scope, sub-steps, acceptance criteria, smoke tests, stop conditions, and commit messages.
- **Max** sits between us. He pastes the Planner's dispatches into your session. He runs the smoke tests himself on the Vercel preview after you deploy. He reports back to the Planner.
- **You (Executor)** execute dispatches mechanically. Verify each sub-step. Halt and surface to Max when stop conditions trigger or when something the dispatch didn't anticipate comes up — Max relays your question to the Planner, who responds with adjudication or a fix dispatch.

You **do not** improvise scope beyond the dispatch. You **do not** decide UX or design questions — those go back to the Planner. You **do** make small implementation calls (e.g. which Tailwind utility to use) — but document any deviation from the dispatch in your commit message.

**Rules every dispatch enforces:**
- Australian English in all user-visible copy (modelling, labour, centre, favourite, organisation).
- Confirm before migrations — describe what you plan, surface the SQL, wait for Max's approval.
- Never modify `.env` / `.env.local`.
- Never commit auto-generated files (e.g. Supabase types).
- Ask before installing new packages.
- One thing at a time — verify each change before moving on.
- Hard stop on stop-conditions — don't improvise recovery.

---

## Where we are right now (top of your task list)

**Step 11c (Auth page rebrand + forgot-password flow) is implementation-complete in the working tree but NOT YET COMMITTED.** The previous Executor session crashed with an Anthropic API "could not process image" error during Playwright verification — full-page screenshots exceeded image size limits. The implementation itself is safe; it's just sitting uncommitted, alongside 6 debris PNG screenshots at the repo root that need deleting.

**Verified state (per Max running `git status` + `git log`):**

- 6 commits ahead of `origin/main` (all from Step 11b-A/B/C + the patches)
- Modified: `src/App.tsx`, `src/pages/AuthPage.tsx`, `src/providers/AuthProvider.tsx`
- Untracked (these are the new files from the auth dispatch — **keep them**): `src/components/viability/auth/`, `src/pages/AuthResetPage.tsx`
- Untracked debris (delete these — they are oversized Playwright screenshots): `auth-signin.png`, `auth-signup.png`, `auth-signup-final.png`, `auth-forgot.png`, `auth-reset.png`, `auth-reset-sent.png`

---

## Your first task — finish the Step 11c commit

Execute these in order. Do not improvise; do not bundle the PNGs into the commit.

```bash
cd /Users/maxschaapveld/Documents/GitHub/Mojo_Viability
rm auth-signin.png auth-signup.png auth-signup-final.png auth-forgot.png auth-reset.png auth-reset-sent.png

git status
# Expect: 3 modified files, 2 untracked new (no PNGs). If anything else appears, halt and surface to Max.

git add src/App.tsx src/pages/AuthPage.tsx src/providers/AuthProvider.tsx src/pages/AuthResetPage.tsx src/components/viability/auth/

git commit -m "$(cat <<'EOF'
feat: auth page rebrand + forgot-password flow (Step 11c)

Brings /auth onto the Viability brand and adds a password
recovery flow. Three modes on /auth (sign-in / sign-up /
forgot-password) and a new /auth/reset page for the actual
password update step after a user clicks the email link.

- AuthProvider: requestPasswordReset + updatePassword
- AuthCard: shared dark-canvas wrapper (chrome + green wash
  backdrop + brand-mark-led card)
- AuthField: viability-themed label + input pair
- AuthPage rewritten: three modes, inline reset-sent state,
  inline error messages (red mono, no toast)
- AuthResetPage: handles new-password set after email link;
  inline success state then sign-in handoff
- /auth/reset route registered
EOF
)"

git push origin main
```

After push, **stop and surface to Max** that the push is done. Do **not** attempt any Playwright verification on the auth pages. Max will run the smoke test from the Step 11c dispatch §6 himself on the Vercel preview once the deploy is live.

---

## After recovery — known pending Max-side actions

These don't block your work; Max owns them.

1. **Supabase Redirect URLs configuration.** Before the forgot-password flow works end-to-end, Max needs to add the Vercel preview URL pattern and `https://mojobusiness.ai/auth/reset` to the redirect-URL allowlist in Supabase dashboard → Authentication → URL Configuration. Without this, the reset email's link will be rejected.
2. **ABN placeholder in footer.** The `ViabilityFooter` shows `ABN ###` as a TODO. Max to fill before public launch.
3. **ABS source for the `~1 in 2` proof stat.** A TODO comment sits above the stat in `src/components/viability/landing/SectionProof.tsx`. Max to confirm citation before public launch.
4. **Rotate password for `admin@maxsenterprises.com.au`.** Plaintext was leaked in Step 1 chat — treat as compromised.

---

## What happens after Max smokes Step 11c

If smoke is green → Max will request **Dispatch D (Step 11d — Reach Out page rebuild)** from the Planner. The Planner needs Max to pick one of three backend options before authoring D:

1. Vercel serverless function that validates + stores to Supabase + emails Max
2. Direct Supabase insert from client (RLS-protected `contact_messages` table) + Supabase Edge Function for email
3. Hand-rolled email-only (no DB) via a serverless function + email provider

If smoke surfaces issues → fix in place, re-commit, re-smoke. Don't proceed to Dispatch D until Step 11c is clean.

---

## The strategic-rebuild chain — where we are

The strategic rebuild was originally scoped as **four dispatches** (Step 11b-A through 11b-D). Max's recent feedback changed the sequence: he asked to insert Auth re-brand before Reach Out, plus added a Hero photographic redesign at the end. Updated chain:

| # | Step | Status |
|---|------|--------|
| 1 | 11b-A — Tokens + shared chrome | **Shipped + smoke green** (commit landed earlier in this branch) |
| 2 | 11b-B — Landing sections | **Shipped + smoke green** |
| 3 | 11b-C — Live Dossier interactive hero | **Shipped + smoke green** (commit `7906a9a`) |
| 4 | 11b-C-patch · shopfront photo wiring | **Shipped** (commit `b10bf8d`) |
| 5 | 11b-C-patch · unsigned-lease photo + housekeeping | **Shipped** (commits `246a817` + `669b045`) |
| 6 | **11c — Auth rebrand + forgot-password** | **Implementation done, NOT YET COMMITTED — this is your first task** |
| 7 | 11d — Reach Out rebuild + submission endpoint | Pending — Planner writes after 11c smoke green + backend decision |
| 8 | 11e — Hero photographic redesign (busy-restaurant unfitted-to-fitted transition image) | Deferred — bigger brainstorm, comes after 11d |

---

## Phase 2.5 / future-cleanup follow-ups

These do NOT block you. Captured so they don't get lost.

### From Step 11b-C
- (Phase 2.5) Re-add venue-switcher (cafe / winebar / pub) and starting-state toggle (empty / mid / complete) — all three presets already ship in `samplePresets.ts`.
- (Phase 2.5) Re-add the `showAmber` "quiet stakes" toggle.
- (Phase 2.5) Wire `Export · PDF / xls →` in the verdict bar to a real export action once the unauthed-export story is decided.

### From Step 11b-B
- (Pre-launch) ABS source citation for `~1 in 2` proof stat (see above).
- (Pre-launch) Final review of founder story copy.
- (Pre-Dispatch D) Decide fate of `HowItWorksPage` route and `LandingHeader.tsx` (no nav entry; still imported by `HowItWorksPage` + `ReachOutPage`).
- (Mobile polish) README spec calls for a hamburger glyph in mobile header — currently the centre nav is hidden entirely. Defer to a mobile-polish dispatch.

### From Step 11b-A
- (Pre-launch) Confirm ABN with Max (footer placeholder `ABN ###`).

### From prior steps (unchanged)
- (10b NORMAL) `occupancyType` cross-section feature (rent ↔ mortgage swap) — never built in `mojo_business`; Phase 2.5 wishlist.
- (10b LOW) Opt into React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`).
- (10a LOW) Triple-nested EXISTS in `project_content_uploads` RLS policy.
- (10a) Unused-index advisors for `business_scenarios` indexes (resolve when Phase 2.5 archive UI ships).
- (9b) Inline rename / export / new-project dialogs are placeholders.
- (9b LOW) `@/lib/export` index re-exports invisible to TS bundler module resolution.
- (9) `InviteAcceptancePage` is a placeholder.
- (9) `ProjectsListPage` uses `useEffect` + manual fetch instead of `useQuery`.

---

## Key reference documents (read as needed for context)

### Planning + dispatches (start here)

- `context/dispatches/step-11b-strategic-rebuild-index.md` — the four-dispatch plan + locked decisions
- `context/dispatches/step-11b-A-tokens-and-shared.md` — shipped
- `context/dispatches/step-11b-A-tokens-and-shared.md` series — Dispatches B and C also live in the same folder
- (Step 11c dispatch was passed to the previous Executor session — not saved to disk; see commit history if you need to re-read the spec)

### Design source of truth

- `context/design_handoff_landing_and_reach_out/README.md` — full design spec
- `context/design_handoff_landing_and_reach_out/prototype/colors_and_type.css` — design tokens
- `context/design_handoff_landing_and_reach_out/prototype/heroes-v2.jsx` — hero, SAMPLE_VENUES, THRESHOLDS, SLIDER_CFG, VERDICT logic
- `context/design_handoff_landing_and_reach_out/prototype/sections.jsx` — section copy + structures
- `context/design_handoff_landing_and_reach_out/prototype/reach-out.jsx` — Reach Out form + SentState reference (will matter for Step 11d)
- `context/design_handoff_landing_and_reach_out/prototype/core.jsx` — chrome components reference (already implemented)

### Project plan / history

- `context/viability-extraction/phase-2-implementation-plan.md` — 12-step extraction plan; Step 11 = current smoke phase
- `context/viability-extraction/extraction-plan-2026-05-09.md` — reconciliation plan
- `context/viability-extraction/Q1-Q7-Decisions.md` — locked architectural decisions
- `context/planner-training-prompt.md` — the role spec the Planner is operating under (informative if you want to know how dispatches are shaped)

---

## Current code layout — public Viability surface

```
src/
├── App.tsx                          (router; mounts /, /start, /auth, /auth/reset, /reach-out, /how-it-works, /privacy, /terms, project routes)
├── providers/
│   └── AuthProvider.tsx             (now exposes signIn, signUp, signOut, requestPasswordReset, updatePassword)
├── pages/
│   ├── LandingPage.tsx              (~30 LOC composition — new chrome + 6 sections + interactive hero)
│   ├── StartPage.tsx                (single create-account card + Sign In link)
│   ├── AuthPage.tsx                 (REWRITTEN in Step 11c — three modes: sign-in / sign-up / forgot-password)
│   ├── AuthResetPage.tsx            (NEW in Step 11c — handles password update from email recovery link)
│   ├── WelcomePage.tsx              (untouched legacy)
│   ├── HowItWorksPage.tsx           (untouched legacy; still uses old LandingHeader)
│   ├── ReachOutPage.tsx             (untouched legacy; Step 11d replaces it)
│   ├── PrivacyPage.tsx              (untouched legacy)
│   ├── TermsPage.tsx                (untouched legacy)
│   └── NotFoundPage.tsx             (untouched legacy)
└── components/
    ├── LandingHeader.tsx            (legacy — still imported by HowItWorksPage + ReachOutPage)
    └── viability/
        ├── MGlyph.tsx
        ├── Eyebrow.tsx
        ├── VButton.tsx
        ├── HairlineLabel.tsx
        ├── ViabilityTicker.tsx
        ├── ViabilityHeader.tsx
        ├── ViabilityFooter.tsx
        ├── auth/                    (NEW in Step 11c)
        │   ├── AuthCard.tsx
        │   └── AuthField.tsx
        └── landing/
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

---

## A note on tooling: Playwright + Anthropic API image limits

The previous Executor session crashed when Playwright produced a full-page screenshot of the auth surface that exceeded Anthropic's image-attachment size limit (5MB or 8000×8000px). If you use Playwright for verification:

- **Clip screenshots to viewport only.** Don't use `fullPage: true` on tall pages.
- **Cap output dimensions** (e.g. width 1280, height 800).
- **Prefer DOM-text verification** (`expect(page.locator(...)).toContainText(...)`) over screenshot comparison wherever possible.
- **For visual smoke, defer to Max** — he runs the smoke tests in a real browser on Vercel preview, which is the authoritative check.

If you hit the same error again: stop, surface the file you were about to attach, and let Max delete it before retrying.

---

## When you wrap up this session

Update this handover file at the end of your session — keep this two-Claude workflow context at the top, push the recovery section down (or remove it once the auth commit lands), and add a new "Session Summary" near the top describing what shipped in your session.
