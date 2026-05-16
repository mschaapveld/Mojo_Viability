# Dispatch — Step 11a: Tactical patch on public surface

**Trigger:** Step 11 smoke 5.1 surfaced five distinct defects on the public/marketing surface. This dispatch fixes the wiring/asset/branding bugs without touching marketing copy or design. The strategic rebuild of viability-specific marketing pages is a separate spec (Step 11b — to be brainstormed next).

---

## 1. Header

- **Step:** Step 11a — tactical patch (sub-step of [phase-2-implementation-plan.md §3 Step 11](../viability-extraction/phase-2-implementation-plan.md))
- **Goal:** unblock smoke 5.1 by fixing the deep-link 404s, broken asset references, wrong-product branding in the header, and the broken Sign In CTA. Hide guest mode (deferred to Phase 2.5).
- **Estimated time:** 1–1.5h.

## 2. Pre-conditions

Halt if any fails.

- [ ] Branch `main`, working tree clean (`git status` shows nothing to commit beyond `context/dispatches/step-11a-tactical-patch.md` and `context/planner-training-prompt.md` if those haven't been committed yet — don't include them in this dispatch's commit).
- [ ] Latest `main` pulled. Most recent commit is `fe95cd9` (Step 10b handover) or newer.
- [ ] `npm run typecheck` GREEN on starting commit.
- [ ] `npm run build` GREEN on starting commit.
- [ ] Vercel project linked (the live deploy that's serving `mojobusiness.ai` and the preview URL).

## 3. Scope

**IN:**
- Create `vercel.json` at repo root with SPA fallback rewrites (fixes `/privacy` + `/terms` 404 on direct navigation / refresh).
- Replace stale `/favicon.png` references with `/favicon.svg` in 3 files.
- Re-brand `LandingHeader` from "Mojo 360" → "Mojo Viability" (logo text, alt text, CTA copy).
- Remove "Websites" entry from `LandingHeader` nav links (wrong product).
- Add an "auth-aware" CTA to `LandingHeader`: when unauthed, primary button = "Sign In" → `/auth`; secondary button = "Get Started" → `/start`. When authed, single button = "Open Viability" → `/projects`. (Implementation: use `useAuth()` from `@/providers/AuthProvider`.)
- Fix `LandingPage.tsx:609` "Sign in" button to navigate to `/auth` (currently calls `onLaunch` → `/start`).
- Strip the "Mojo 360 — Virtual Manager OS" waitlist newsletter block from `LandingPage.tsx` (approx L184–L210 — verify exact range; the block ends at the close of the column containing "We'll let you know when Mojo 360 launches.").
- Hide the "Try it now / Continue as guest" card on `StartPage`. Leave the "Create a free account" card as the sole option. Add a small text link below: "Already have an account? Sign in" → `/auth`.

**OUT (explicit non-goals):**
- No new copywriting beyond the literal text swaps above.
- No new hero / feature / pricing content — current content stays as-is until the Step 11b strategic rebuild.
- No new image / asset creation.
- No design / theme changes.
- No guest-mode plumbing — the "Try as guest" feature is reclassified as Phase 2.5 wishlist; the StartPage card is hidden, not built out.
- No `HowItWorksPage`, `ReachOutPage`, `PrivacyPage`, `TermsPage` content changes — they ship as-is. The vercel.json fix alone resolves the 404 on `/privacy` and `/terms`.
- No `AuthPage` changes beyond verifying the route works end-to-end in smoke.

## 4. Sub-steps

Execute in order. Confirm each before moving on.

### 4.1 — SPA fallback rewrites (fixes `/privacy` + `/terms` 404)

Create [vercel.json](../../vercel.json) at repo root:

```json
{
  "rewrites": [
    {
      "source": "/((?!api/|_next/|_static/|.*\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

The negative-lookahead excludes asset paths (anything with a dot, e.g. `.js`, `.css`, `.svg`) and any reserved prefixes from the SPA fallback. Without this, Vercel serves a platform 404 for direct navigation to `/privacy`, `/terms`, or any deep route.

**Verify locally:** `npm run build && npm run preview`, then visit `http://localhost:4173/privacy` and `http://localhost:4173/terms` directly. Both should render the React pages. (Vite preview also handles SPA fallback, so this verifies the rewrite logic post-deployment; the local server is a proxy for what Vercel will do.)

### 4.2 — Asset reference fixes (`/favicon.png` → `/favicon.svg`)

Three references to update:

- [src/components/LandingHeader.tsx:91](../../src/components/LandingHeader.tsx#L91) — `<img src="/favicon.png" alt="Mojo 360" />` → `<img src="/favicon.svg" alt="Mojo Viability" />`
- [src/pages/HowItWorksPage.tsx:339](../../src/pages/HowItWorksPage.tsx#L339) — `<img src="/favicon.png" ... />` → `<img src="/favicon.svg" ... />`
- [src/pages/HowItWorksPage.tsx:471](../../src/pages/HowItWorksPage.tsx#L471) — same fix

Sanity-check: `grep -rn "favicon.png" src/` after edits → should return zero results.

### 4.3 — `LandingHeader` re-brand + nav cleanup + auth-aware CTAs

In [src/components/LandingHeader.tsx](../../src/components/LandingHeader.tsx):

**4.3a — Type changes:**
```ts
// Drop 'websites' from the LandingPage type
type LandingPage = 'home' | 'how-it-works' | 'reach-out';

// Remove the Websites entry from NAV_LINKS
const NAV_LINKS: { label: string; page: LandingPage }[] = [
  { label: 'Home',         page: 'home'         },
  { label: 'How It Works', page: 'how-it-works' },
  { label: 'Reach Out',    page: 'reach-out'    },
];
```

**4.3b — Logo text (L93–96):**

Replace:
```tsx
<span style={{ color: '#e8622a' }}>Mojo</span>
<span style={{ color: '#f5f2ed' }}>360</span>
```

With:
```tsx
<span style={{ color: '#e8622a' }}>Mojo</span>
<span style={{ color: '#f5f2ed' }}>Viability</span>
```

**4.3c — Auth-aware CTAs:**

Import `useAuth` from `@/providers/AuthProvider`. Replace the single "Launch Mojo 360 →" button (L117–119) with:

```tsx
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

// ... inside LandingHeader, after useState/useEffect ...
const { user } = useAuth();
const navigate = useNavigate();

// Replace the single .lh-cta button with:
{user ? (
  <button className="lh-cta" onClick={() => navigate('/projects')}>
    Open Viability →
  </button>
) : (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <button
      onClick={() => navigate('/auth')}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500,
        color: 'rgba(245,242,237,0.7)', padding: '9px 8px', transition: 'color 200ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#f5f2ed')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,242,237,0.7)')}
    >
      Sign In
    </button>
    <button className="lh-cta" onClick={() => navigate('/start')}>
      Get Started →
    </button>
  </div>
)}
```

The `onLaunch` prop is now unused by the header — but the parent (`App.tsx`'s `useLandingNav`) still passes it. Leave the prop in the interface for now (parent still wires it, used by `LandingPage` deeper down for the embedded "Sign in" link — actually that's getting fixed in 4.4). After 4.4 is done, audit `onLaunch` usage; if 0 callsites remain, remove the prop. If callsites remain, keep it.

**4.3d — `useLandingNav` in App.tsx:**

[src/App.tsx:39–60](../../src/App.tsx#L39-L60) — `useLandingNav` has a `case 'websites':` branch. Now that `'websites'` is removed from the `LandingPage` type, that case is unreachable. Delete the case. The function signature already takes `LandingPage` so TypeScript will enforce.

### 4.4 — Fix `LandingPage.tsx:609` "Sign in" button

In [src/pages/LandingPage.tsx](../../src/pages/LandingPage.tsx):

The component receives `onLaunch` from its parent (App.tsx's `useLandingNav`). Add a new prop `onSignIn: () => void` to the interface. Wire it in `App.tsx`'s `useLandingNav`:

```ts
const onSignIn = () => navigate('/auth');
return { onLaunch, onViability, onNavigate, onSignIn };
```

Update `LandingPageRoute` to spread the props (it already does via `{...props}`). In `LandingPage.tsx:609`, change:

```tsx
<button onClick={onLaunch} ...>Sign in</button>
```

to:

```tsx
<button onClick={onSignIn} ...>Sign in</button>
```

Also add `onSignIn` to the `LandingPageProps` interface near the top of the file.

### 4.5 — Strip the "Mojo 360" newsletter block from LandingPage

In [src/pages/LandingPage.tsx](../../src/pages/LandingPage.tsx) around L184–L210:

The block reads "Mojo 360 — Virtual Manager OS" (heading) and contains a waitlist subscription form ending with "We'll let you know when Mojo 360 launches." (L205).

Locate the JSX block — likely wrapped in a `<div>` or column container. **Read the surrounding ~40 lines first** to find the correct opening and closing boundaries. Delete the entire block including its container. Do not leave stray closing tags or commented-out code.

If the deletion leaves an empty grid cell or an awkward layout gap, collapse the parent grid/flex container so the remaining columns reflow naturally. Run `npm run dev` and visually confirm the landing page renders without a hole where the block used to be.

### 4.6 — Hide "Try as guest" on StartPage; add Sign In link

In [src/pages/StartPage.tsx](../../src/pages/StartPage.tsx):

**Option chosen:** hide the guest button entirely. The "Try as guest" feature is deferred to Phase 2.5 ([HANDOVER.md](../../handover/HANDOVER.md) carry-forward: "StartPage's 'Try as guest' routes to /projects (auth-gated). Guest-mode plumbing deferred."). Showing a button that bounces through auth is worse than not showing it.

**4.6a — Drop the guest card and the `onGuest` prop:**

Remove the entire `{/* Guest */}` button block (L31–L49). Update `StartPageProps`:

```ts
interface StartPageProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onBack?: () => void;
}

export function StartPage({ onCreateAccount, onSignIn, onBack }: StartPageProps) {
```

Drop the grid wrapper (since only one card remains) — replace `grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[600px]` with a single-column layout (e.g. `flex flex-col items-center max-w-[420px]`). Center the "Create a free account" card.

**4.6b — Add Sign In link below the card:**

Below the create-account button, before the `{onBack && ...}` block:

```tsx
<button
  onClick={onSignIn}
  className="mt-6 font-sans text-caption text-muted-foreground hover:text-foreground transition-colors"
>
  Already have an account? <span className="text-brand font-semibold">Sign in</span>
</button>
```

**4.6c — Update `StartPageRoute` in `App.tsx:79–86`:**

```tsx
function StartPageRoute() {
  const navigate = useNavigate();
  return (
    <StartPage
      onCreateAccount={() => navigate('/auth')}
      onSignIn={() => navigate('/auth')}
      onBack={() => navigate('/')}
    />
  );
}
```

Note: both `onCreateAccount` and `onSignIn` navigate to `/auth`. That's intentional — `/auth` is a combined sign-in / sign-up surface (verify by reading `AuthPage.tsx` if unsure). If the page renders only one mode by default, that's a Step 11b follow-up, not this dispatch's scope.

### 4.7 — Verify

Run in order:
```bash
npm run typecheck       # MUST pass
npm run build           # MUST pass
grep -rn "favicon.png" src/    # MUST return zero
grep -rn "Mojo 360" src/       # MUST return zero (or only inside historical comments)
grep -rn "Virtual Manager OS" src/    # MUST return zero
```

## 5. Acceptance criteria

- [ ] `npm run typecheck` GREEN
- [ ] `npm run build` GREEN
- [ ] No `favicon.png` references in `src/`
- [ ] No "Mojo 360" strings in `src/` (or only in historical/comments — confirm)
- [ ] `LandingHeader` shows "Mojo Viability" logo text
- [ ] `LandingHeader` unauthed shows "Sign In" + "Get Started →" buttons; authed shows "Open Viability →"
- [ ] `LandingHeader` nav has 3 links (Home, How It Works, Reach Out) — no Websites
- [ ] `LandingPage` does not contain the "Mojo 360 — Virtual Manager OS" waitlist block
- [ ] `LandingPage` "Sign in" embedded link routes to `/auth`
- [ ] `StartPage` shows only the "Create a free account" card + a "Sign in" link below it — no guest card
- [ ] `vercel.json` exists at repo root with the rewrites rule
- [ ] Smoke script (§6) delivered to Max

## 6. Smoke test (Max runs after Executor deploys)

Run on the Vercel **preview** URL once the patch deploys (Vercel auto-deploys on push to main).

| # | Flow | Expected |
|---|---|---|
| 1 | Visit `/privacy` directly (open in new tab, paste URL) | Privacy page renders. **No 404.** |
| 2 | Visit `/terms` directly | Terms page renders. **No 404.** |
| 3 | Visit `/` while unauthed | Landing page renders. Header shows "Mojo Viability" logo. Header CTAs: "Sign In" + "Get Started →". |
| 4 | Click "Sign In" in header | Lands on `/auth`. |
| 5 | Click "Get Started →" in header | Lands on `/start`. |
| 6 | On `/start`, see only one card — "Create a free account". Below it: "Already have an account? Sign in" link. | Yes — guest card is gone. |
| 7 | Click "Already have an account? Sign in" | Lands on `/auth`. |
| 8 | Click "Create a free account" card | Lands on `/auth`. |
| 9 | Sign in successfully | Lands on `/projects` (or `/welcome` if first-time). |
| 10 | Return to `/` while signed in | Header CTA shows "Open Viability →" (single button). |
| 11 | Click "Open Viability →" | Lands on `/projects`. |
| 12 | Visit `/` and scroll down | The "Mojo 360 — Virtual Manager OS" waitlist block is **gone**. Page layout is intact (no awkward gap). |
| 13 | Hard-refresh on `/how-it-works` | Page renders, no 404, no broken-image icons. |
| 14 | Inspect browser console on `/` and `/start` | No errors. No 404s on `/favicon.png` in the Network tab. |

## 7. Stop conditions

Halt and surface to Max if:

- `vercel.json` rewrites rule causes asset requests to be rewritten to `index.html` (manifests as broken JS / CSS / SVG loading after deploy). The negative-lookahead in the rule should prevent this — if it doesn't, the regex needs adjustment. Test locally with `npm run preview` BEFORE pushing.
- Removing the "Mojo 360 — Virtual Manager OS" block breaks the surrounding layout (e.g. orphan grid columns, broken responsive breakpoints). If a clean removal isn't possible without a layout fix, halt and surface.
- `useAuth()` import path doesn't resolve in `LandingHeader.tsx` (the provider lives at `@/providers/AuthProvider` per existing `App.tsx` import — verify). If wrong, halt and audit.
- `AuthPage` renders but doesn't support both sign-in AND sign-up modes (e.g. only signup) — the "Sign In" CTA would be misleading. Flag as Step 11b carry-forward; don't try to refactor `AuthPage` in this dispatch.
- More than 8 typecheck errors surface from a single sub-step — indicates a deeper coupling than expected. Halt, audit root.

## 8. Commit message

Use verbatim:

```
fix: tactical patch on public surface (Step 11a smoke fixes)

- Add vercel.json SPA fallback rewrites — /privacy and /terms now resolve
  on direct navigation instead of platform 404
- Swap stale /favicon.png references for /favicon.svg (3 sites)
- Re-brand LandingHeader from Mojo 360 to Mojo Viability; drop Websites
  nav entry; add auth-aware CTAs (Sign In + Get Started when unauthed,
  Open Viability when authed)
- Fix LandingPage's embedded "Sign in" button to route to /auth
- Strip the Mojo 360 newsletter waitlist block from LandingPage
- Hide StartPage's "Try as guest" card (guest mode deferred to Phase 2.5)
  and add a "Sign in" link for returning users
```

## 9. Handover

At session end, update [handover/HANDOVER.md](../../handover/HANDOVER.md) using the template in [CLAUDE.md](../../CLAUDE.md). Specifically:

- Session Summary: "Step 11 smoke surfaced public-surface defects; tactical patch (Step 11a) shipped, strategic rebuild (Step 11b) brainstormed and spec drafted."
- Completed: list the bullets from the commit message.
- In Progress: Step 11b strategic rebuild — design spec written at `docs/superpowers/specs/<date>-viability-public-surface-rebuild-design.md` (if the brainstorm completes this session) or note it as Next.
- Blockers: none expected.
- Next Session: depends on brainstorm outcome — likely Step 11b implementation plan + first Executor dispatch for the rebuild.

Move the reclassified Phase 2.5 item ("StartPage's 'Try as guest' deferred") off the carry-forward list since it's now intentionally hidden rather than broken; note it as "intentionally hidden in Step 11a — build out as part of Phase 2.5 guest-mode plumbing."

---

## Planner notes (not for Executor)

- The SPA fallback rule pattern is the standard Vercel + Vite + React Router incantation. The negative-lookahead `(?!api/|_next/|_static/|.*\..*)` is the key — Vercel's default rewrite would catch everything including assets.
- I made the call on guest mode (hide, don't build). Rationale: per the handover, guest plumbing was deferred for solid reasons (localStorage hand-off complexity, signup-mid-draft state). Building it now would expand this dispatch from 1–1.5h to multi-hour and pulls Phase 2.5 scope forward. Showing a broken button is worse than no button.
- The `LandingHeader` auth-aware CTA is the first place in the app where the public surface needs to know about auth state. This is a small precedent — the strategic rebuild may want to expand on it (e.g. account dropdown when authed). Note for Step 11b brainstorm.
- I did not include the `AuthPage` redesign in this dispatch — it's not on the smoke punch list and would balloon scope. If the smoke (step 7 in §6) surfaces that `/auth` lacks a sign-in mode, that's a separate fix.
