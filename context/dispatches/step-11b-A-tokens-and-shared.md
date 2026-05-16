# Dispatch — Step 11b-A: Design tokens + shared chrome + tactical leftovers

**Index:** [`step-11b-strategic-rebuild-index.md`](./step-11b-strategic-rebuild-index.md)
**Design source:** [`context/design_handoff_landing_and_reach_out/README.md`](../design_handoff_landing_and_reach_out/README.md)

---

## 1. Header

- **Step:** Step 11b-A — first of four strategic-rebuild dispatches
- **Goal:** ship the design-token foundation (CSS vars + Tailwind extension), font loading, two M-glyph SVG assets, and seven shared chrome / utility components. Plus the two surviving Step-11a items: `vercel.json` SPA fallback and `StartPage` guest-card hide. A temporary `/_design-preview` route lets Max visually verify the chrome before Dispatch B wires it into the real `LandingPage`.
- **Reference:** [`phase-2-implementation-plan.md` §3 Step 11](../viability-extraction/phase-2-implementation-plan.md)
- **Estimated time:** 3–4h Executor work.

## 2. Pre-conditions

Halt if any fails.

- [ ] Branch `main`, working tree has the two committed planning docs from the prior planner session (`context/dispatches/*.md`, `context/design_handoff_landing_and_reach_out/`, `context/planner-training-prompt.md`). Make sure these are committed before starting code work, OR commit them as part of this dispatch's first commit if not yet — but don't bundle them with the implementation commit. **Recommendation: commit planning docs first as a separate `docs: …` commit, then start implementation.**
- [ ] `git status` shows nothing else stray.
- [ ] `npm run typecheck` GREEN on starting commit.
- [ ] `npm run build` GREEN on starting commit.
- [ ] [`context/design_handoff_landing_and_reach_out/README.md`](../design_handoff_landing_and_reach_out/README.md) read end-to-end.
- [ ] [`context/design_handoff_landing_and_reach_out/prototype/colors_and_type.css`](../design_handoff_landing_and_reach_out/prototype/colors_and_type.css) skimmed for token values.
- [ ] [`context/design_handoff_landing_and_reach_out/prototype/core.jsx`](../design_handoff_landing_and_reach_out/prototype/core.jsx) opened in a tab as reference for `MGlyph`, `Eyebrow`, `VButton`, `ViabilityTicker`, `ViabilityHeader`, `ViabilityFooter`, `HairlineLabel`. **Do NOT copy the inline-style JSX verbatim** — translate to Tailwind classes per the README's guidance.

## 3. Scope

**IN:**
- `vercel.json` at repo root with SPA fallback rewrites.
- CSS-var tokens added to [`src/index.css`](../../src/index.css) under `:root` matching the values in `colors_and_type.css`.
- Tailwind theme extension in [`tailwind.config.js`](../../tailwind.config.js) — new `viability` colour namespace, `m360` orange namespace, font families, custom radii.
- Fraunces + Syne `<link>` tags added to [`index.html`](../../index.html); DM Sans link added if not already present.
- Two M-glyph SVG files copied to `public/icons/`.
- Seven new components under `src/components/viability/`:
  - `MGlyph` (recolourable inline SVG, props for size + color + ink)
  - `Eyebrow` (overline label)
  - `VButton` (composes shadcn `<Button>` with viability variants)
  - `HairlineLabel` (vertical rule + caption)
  - `ViabilityTicker` (marquee with reduced-motion support)
  - `ViabilityHeader` (auth-aware CTAs, blur on scroll)
  - `ViabilityFooter` (4-column lockup + Mojo 360 cross-link card + bottom strip)
- Temporary `src/pages/_DesignPreview.tsx` mounted at `/_design-preview` — renders the chrome stack for visual smoke.
- `StartPage` guest-card hide + Sign In link (the surviving 11a item).
- `App.tsx` wires the new route and updates `StartPageRoute` props.

**OUT (explicit non-goals):**
- No changes to `LandingPage.tsx`, `LandingHeader.tsx`, `HowItWorksPage.tsx`, `ReachOutPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`, `AuthPage.tsx`, `WelcomePage.tsx`. They keep rendering as today. The current `LandingHeader` stays in place; the new `ViabilityHeader` lives alongside it, only mounted by the temporary preview route.
- No live dossier / interactive widget — Dispatch C.
- No landing sections (What / BuiltFor / How / Proof / Mojo360 / FinalCTA) — Dispatch B.
- No Reach Out work — Dispatch D.
- No theme system changes (shadcn dark/light toggle stays). The viability surface is always dark; it doesn't use the existing `[data-theme="dark"]` variables — it uses the new `viability` namespace directly.
- No deletion of `LandingHeader.tsx` (still imported by the current `LandingPage`). Deletion happens in Dispatch B once nothing imports it.

## 4. Sub-steps

Execute in order. Verify each before moving on.

### 4.1 — `vercel.json` SPA fallback

Create [`vercel.json`](../../vercel.json) at repo root:

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

The negative-lookahead excludes asset paths (anything containing a dot — `.js`, `.css`, `.svg`) and reserved prefixes from the SPA fallback. Without this, direct navigation to `/privacy` and `/terms` returns a platform 404.

**Verify locally:** `npm run build && npm run preview`, then in a fresh browser tab paste `http://localhost:4173/privacy` and hit enter. Should render the privacy page, not a 404.

### 4.2 — Font loading

Add to [`index.html`](../../index.html) inside `<head>`, after the existing `<meta>` tags and before the closing `</head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500;1,9..144,600&family=Syne:wght@500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap"
/>
```

This is the same family + weight set from `colors_and_type.css` lifted into HTML for early prioritised loading.

### 4.3 — CSS-var tokens in `src/index.css`

Open [`src/index.css`](../../src/index.css). Inside the existing `:root { ... }` block (do NOT remove or modify the existing shadcn HSL variables — append after them), add a comment marker and the full Viability token set lifted from [`context/design_handoff_landing_and_reach_out/prototype/colors_and_type.css`](../design_handoff_landing_and_reach_out/prototype/colors_and_type.css) lines ~10–60:

```css
/* ═══ Mojo Viability brand tokens ═══
   Lifted from context/design_handoff_landing_and_reach_out/prototype/colors_and_type.css
   These tokens are independent of the shadcn light/dark theme system.
   The Viability public surface is always dark and addresses these directly via the
   `viability` Tailwind namespace (see tailwind.config.js). */

--vbr-ink:          #080808;
--vbr-ink-2:        #0e0e0e;
--vbr-ink-3:        #141414;
--vbr-cream:        #f5f2ed;
--vbr-fg-muted:     rgba(245, 242, 237, 0.62);
--vbr-fg-subtle:    rgba(245, 242, 237, 0.38);
--vbr-fg-faint:     rgba(245, 242, 237, 0.18);

--vbr-green:        #34d399;
--vbr-green-hover:  #2ec07f;
--vbr-green-soft:   rgba(52, 211, 153, 0.12);
--vbr-green-softer: rgba(52, 211, 153, 0.06);
--vbr-green-line:   rgba(52, 211, 153, 0.28);
--vbr-green-on:     #062b1d;

--vbr-amber:        rgba(232, 180, 90, 0.92);
--vbr-amber-soft:   rgba(232, 180, 90, 0.12);
--vbr-amber-line:   rgba(232, 180, 90, 0.32);

--vbr-red:          #ef6a5e;
--vbr-red-soft:     rgba(239, 106, 94, 0.10);
--vbr-red-line:     rgba(239, 106, 94, 0.28);

--m360-orange:      #e8622a;
--m360-orange-hover: #d4571f;
--m360-orange-soft: rgba(232, 98, 42, 0.10);
--m360-orange-line: rgba(232, 98, 42, 0.28);

--vbr-border:        rgba(255, 255, 255, 0.07);
--vbr-border-strong: rgba(255, 255, 255, 0.14);
```

Also add a global `::selection` rule somewhere appropriate in the file (after the `:root` block is fine):

```css
::selection {
  background: #34d399;
  color: #062b1d;
}
```

### 4.4 — Tailwind theme extension

Open [`tailwind.config.js`](../../tailwind.config.js). Inside `theme.extend`, add the following:

```js
theme: {
  extend: {
    // ... preserve any existing entries ...

    colors: {
      // ... preserve any existing entries (shadcn) ...
      viability: {
        ink: 'var(--vbr-ink)',
        'ink-2': 'var(--vbr-ink-2)',
        'ink-3': 'var(--vbr-ink-3)',
        cream: 'var(--vbr-cream)',
        'fg-muted': 'var(--vbr-fg-muted)',
        'fg-subtle': 'var(--vbr-fg-subtle)',
        'fg-faint': 'var(--vbr-fg-faint)',
        green: 'var(--vbr-green)',
        'green-hover': 'var(--vbr-green-hover)',
        'green-soft': 'var(--vbr-green-soft)',
        'green-softer': 'var(--vbr-green-softer)',
        'green-line': 'var(--vbr-green-line)',
        'green-on': 'var(--vbr-green-on)',
        amber: 'var(--vbr-amber)',
        'amber-soft': 'var(--vbr-amber-soft)',
        'amber-line': 'var(--vbr-amber-line)',
        red: 'var(--vbr-red)',
        'red-soft': 'var(--vbr-red-soft)',
        'red-line': 'var(--vbr-red-line)',
        border: 'var(--vbr-border)',
        'border-strong': 'var(--vbr-border-strong)',
      },
      m360: {
        orange: 'var(--m360-orange)',
        'orange-hover': 'var(--m360-orange-hover)',
        'orange-soft': 'var(--m360-orange-soft)',
        'orange-line': 'var(--m360-orange-line)',
      },
    },

    fontFamily: {
      // ... preserve any existing entries ...
      display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      'display-alt': ['Syne', 'Helvetica Neue', 'Helvetica', 'system-ui', 'sans-serif'],
      sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      mono: ['ui-monospace', 'JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
    },

    borderRadius: {
      // ... preserve any existing entries ...
      pill: '9999px',
      tight: '6px',
      chip: '8px',
    },

    keyframes: {
      // ... preserve any existing entries ...
      'viability-ticker': {
        '0%': { transform: 'translateX(0)' },
        '100%': { transform: 'translateX(-33.333%)' },
      },
      'viability-fade-up': {
        '0%': { opacity: '0', transform: 'translateY(10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
    },

    animation: {
      // ... preserve any existing entries ...
      'viability-ticker': 'viability-ticker 38s linear infinite',
      'viability-ticker-mobile': 'viability-ticker 28s linear infinite',
      'viability-fade-up': 'viability-fade-up 640ms ease-out both',
    },
  },
},
```

**Important:** the `fontFamily.sans` override changes the default sans-serif for the WHOLE app to DM Sans. Check whether the existing app relies on a different default sans (`grep -rn "font-sans" src/ | head -20`). If the existing app already uses DM Sans as default, this is a no-op. If a different default is in use, change the key from `sans` to `viability` or leave `sans` alone and use `font-display` / `font-display-alt` for the new components only. **Verify before proceeding.**

### 4.5 — M-glyph asset placement

Create `public/icons/` directory if not present.

Copy:
- [`context/design_handoff_landing_and_reach_out/prototype/assets/Icon_M_Viability.svg`](../design_handoff_landing_and_reach_out/prototype/assets/Icon_M_Viability.svg) → `public/icons/m-viability.svg`
- [`context/design_handoff_landing_and_reach_out/prototype/assets/Icon_M_Mojo360.svg`](../design_handoff_landing_and_reach_out/prototype/assets/Icon_M_Mojo360.svg) → `public/icons/m-mojo360.svg`

Use `cp` via Bash; don't re-author them.

These files are reference-only. The actual rendering is via inline SVG inside the `MGlyph` component (next step) so the SVG content can be recoloured via props. The public copies are useful for:
- `<link rel="icon">` if we later add an `.svg` favicon swap.
- Quick visual reference during dev.

### 4.6 — `MGlyph` component

Create `src/components/viability/MGlyph.tsx`.

Open `prototype/assets/Icon_M_Viability.svg` with the Read tool. Inline its SVG `<path>` content into the TSX component, parameterising the fill colours via props. Component spec per README §"Components / `MGlyph`":

```ts
interface MGlyphProps {
  /** Pixel size (sets both width and height). Defaults to 26 (header). */
  size?: 20 | 22 | 24 | 26 | 28 | 32;
  /** Outer rounded square fill. Use 'var(--vbr-green)' for Viability, 'var(--m360-orange)' for the Mojo 360 strip. */
  color?: string;
  /** Cut-out 'M' counter colour — almost always 'var(--vbr-ink)'. */
  ink?: string;
  /** Optional className for layout context. */
  className?: string;
}
```

Defaults: `size = 26`, `color = 'var(--vbr-green)'`, `ink = 'var(--vbr-ink)'`.

The component returns a styled `<svg>` element with the lifted `<path>` content. Use `aria-hidden="true"` if it's decorative; consumers can pass a `<title>` via children if needed for a11y, but for now keep it decorative.

### 4.7 — `Eyebrow` component

Create `src/components/viability/Eyebrow.tsx`. Spec per README §"Eyebrow":

```ts
interface EyebrowProps {
  children: React.ReactNode;
  /** Default 'green' uses --vbr-green. 'amber' uses --vbr-amber. */
  tone?: 'green' | 'amber';
  /** Show the leading 6×6 dot. Default true. */
  showDot?: boolean;
  className?: string;
}
```

Styling:
- `font-sans` (DM Sans), `font-medium` (500), `text-[11px]`, `uppercase`, `tracking-[0.18em]`
- Default `text-viability-green`; when `tone === 'amber'`, `text-viability-amber`
- Leading dot: 6×6 rounded-full in same colour, inline-block, margin-right 8

### 4.8 — `VButton` component

Create `src/components/viability/VButton.tsx`. Composes the shadcn `<Button>` from [`src/components/ui/button.tsx`](../../src/components/ui/button.tsx) — don't reinvent focus/disabled handling. Add viability variants via a small wrapper:

```ts
interface VButtonProps extends React.ComponentProps<'button'> {
  /** 'solid' = green-filled primary. 'ghost' = transparent + hairline border. Default 'solid'. */
  variant?: 'solid' | 'ghost';
  /** 'sm' | 'md' | 'lg'. Default 'md'. */
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}
```

Map sizes per README §"VButton":
- `sm`: `text-[13px]`, `py-[9px] px-4`
- `md`: `text-[14.5px]`, `py-[13px] px-[22px]`
- `lg`: `text-[15.5px]`, `py-4 px-7`

Map variants:
- `solid`: `bg-viability-green text-viability-green-on font-semibold rounded-pill shadow-[0_4px_14px_rgba(52,211,153,0.18)] hover:bg-viability-green-hover hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(52,211,153,0.30)] transition-all duration-200`
- `ghost`: `bg-transparent text-viability-cream border border-viability-border-strong rounded-pill hover:bg-[rgba(245,242,237,0.06)] transition-all duration-200`

Common: `font-sans font-medium` (DM Sans 500), `inline-flex items-center gap-2`, `cursor-pointer`, focus ring uses `focus-visible:ring-2 focus-visible:ring-viability-green-line`.

### 4.9 — `HairlineLabel` component

Create `src/components/viability/HairlineLabel.tsx`. Spec per README §"ReachOutHero / HairlineLabel" — used in the Reach Out hero's "Port Macquarie · NSW" top strip:

```ts
interface HairlineLabelProps {
  children: React.ReactNode;
  className?: string;
}
```

Layout: flex row with a 28px-tall, 1px-wide vertical hairline rule (`bg-viability-border`) on the left, then the children rendered in mono 10.5px uppercase `text-viability-fg-subtle` with `tracking-[0.14em]`.

### 4.10 — `ViabilityTicker` component

Create `src/components/viability/ViabilityTicker.tsx`. Spec per README §"ViabilityTicker":

```ts
interface ViabilityTickerProps {
  className?: string;
}
```

Static content — hard-code the eight items from the README inside the component:

```ts
const TICKER_ITEMS = [
  '100% FREE FOREVER',
  'NO PAID TIER',
  'NO IN-APP PURCHASES',
  'NO HIDDEN CHARGES',
  'NO CREDIT CARD',
  'USE IT AS LONG AS YOU NEED',
  'NO TRIAL THAT ENDS',
  'BUILT TO PREVENT CLOSURE — NOT PROFIT FROM IT',
] as const;
```

Render: full-width `bg-viability-green` band, `py-3` (≈12px), text `font-sans font-bold text-[12.5px] uppercase tracking-[0.18em] text-viability-green-on`. Separator between items is a `✦` glyph at 14px with `opacity-45`, gap 44px.

To create the marquee:
1. Render the full sequence **three times** in a row inside a flex container so the loop is seamless when `translateX(-33.333%)` lands.
2. Apply `animate-viability-ticker` (defined in tailwind config) — desktop default; on mobile (≤640px) apply `sm:animate-viability-ticker md:animate-viability-ticker` and have a media query OR a JS-driven flag flip to `animate-viability-ticker-mobile`. Simplest: use a CSS media query in a small `<style>` block inside the component, OR add Tailwind responsive variants in the config. Either is fine; pick the cleaner one and document the choice in the commit message.
3. Respect `prefers-reduced-motion`: wrap the animation in `motion-safe:animate-viability-ticker` so reduced-motion freezes the marquee in place. Test in macOS System Settings → Accessibility → Display → Reduce motion.

### 4.11 — `ViabilityHeader` component

Create `src/components/viability/ViabilityHeader.tsx`. Spec per README §"ViabilityHeader":

```ts
interface ViabilityHeaderProps {
  /** Which nav item is active. 'home' | 'reach-out'. */
  activePage?: 'home' | 'reach-out';
}
```

Internal:
- Use `useAuth()` from [`@/providers/AuthProvider`](../../src/providers/AuthProvider.tsx).
- Use `useNavigate()` from `react-router-dom`.
- Sticky position; full-width; height ≈ 64px (padding 20px 56px); blurred backdrop on scroll (`useEffect` listening for `window.scrollY > 20`, sets a boolean state; flip a class to add `bg-black/45 border-b-viability-border` once scrolled).

Layout (flex row, justify-between, items-center):
- **Left:** clickable lockup. `<MGlyph size={26} color="var(--vbr-green)" />` + the wordmark — `<span style={{ fontFamily: 'Fraunces', fontWeight: 700, fontSize: 22 }}>` containing `<span class="text-viability-green">Mojo</span>` and `<span class="text-viability-cream"> Viability</span>`. Click navigates to `/`.
- **Centre nav:** absolute-positioned `left-1/2 -translate-x-1/2`, two links (Home → `/`, Reach Out → `/reach-out`), each in DM Sans 13.5px. Active item: text full cream; inactive: `text-viability-fg-muted`. Active item has a 1.5px green underline (`bg-viability-green`) revealed via `::after` pseudo or a span. `activePage` prop decides which is active.
- **Right CTAs (auth-aware):**
  - When `user` is null (unauthed): a subtle text "Sign in" button (`text-viability-fg-muted hover:text-viability-cream`) routing to `/auth`, gap-3 from a `<VButton size="sm" variant="solid">` reading `Try free →` that navigates to `/start`.
  - When `user` is non-null (authed): a single `<VButton size="sm" variant="solid">` reading `Open Viability →` that navigates to `/projects`.

**Important:** this component is NOT yet mounted into the existing `LandingPage` / `HowItWorksPage` / `ReachOutPage`. Those still use the legacy `LandingHeader`. The only thing that imports `ViabilityHeader` in Dispatch A is the temporary `_DesignPreview` page (step 4.13). Dispatch B switches the real pages over.

### 4.12 — `ViabilityFooter` component

Create `src/components/viability/ViabilityFooter.tsx`. Spec per README §"ViabilityFooter":

```ts
interface ViabilityFooterProps {
  /** When true, render the Mojo 360 cross-link card inside the lockup column. Default true. */
  showMojo360?: boolean;
}
```

Layout: `bg-[#050505]`, border-top hairline (`border-viability-border`), padding `pt-[72px] pb-9 px-14`.

A 4-column grid with `gridTemplateColumns: '1.4fr 1fr 1fr 1fr'` and `gap-x-14`:

- **Column 1 — Lockup + positioning:** `<MGlyph size={24} />` + wordmark (same Fraunces 700 22px as the header, scaled to 20px is fine). Below: one-sentence positioning line in DM Sans 13.5px `text-viability-fg-muted`. Suggested copy (lock in commit if no alternative comes from Max): *"Test whether your hospitality idea stacks up — before you sign anything."* (Australian English. Match the page's voice.) Then if `showMojo360`, render the small "When you're trading, Mojo 360 takes over →" card — orange tinted card (`bg-[linear-gradient(180deg,rgba(232,98,42,0.04),rgba(232,98,42,0))]` over `bg-viability-ink-2`), `border border-m360-orange-line`, padding 14×16, rounded-tight, text DM Sans 12.5px `text-m360-orange`. Click navigates to `https://mojo360.com.au` in a new tab (`target="_blank" rel="noopener noreferrer"`).
- **Column 2 — Product:** `<Eyebrow showDot={false}>Product</Eyebrow>` then a vertical list of links — "Reach Out" → `/reach-out`. (Only one entry for now; "How It Works" is intentionally off the nav.)
- **Column 3 — Legal:** `<Eyebrow showDot={false}>Legal</Eyebrow>` then "Privacy" → `/privacy`, "Terms" → `/terms`.
- **Column 4 — Ecosystem:** `<Eyebrow showDot={false}>Ecosystem</Eyebrow>` then "Mojo 360 →" linking to `https://mojo360.com.au` (new tab).

Link styling: DM Sans 13.5px, `text-viability-fg-muted` default, `hover:text-viability-cream`, transitions colour 200ms.

**Bottom strip** (margin-top 36, padding-top 24, border-top hairline, flex justify-between, items-center, mono 11px `text-viability-fg-subtle`):
- Left: `© 2026 Mojo Pty Ltd · ABN <TODO Max — fill in or leave as ABN ###>` — leave the ABN as the literal string `ABN ###` with a `{/* TODO: ABN — confirm with Max */}` comment.
- Right: `<HairlineLabel>Built in Port Macquarie · NSW</HairlineLabel>` with a small 6×6 `bg-viability-green` dot before "Port Macquarie."

### 4.13 — Temporary `/_design-preview` page

Create `src/pages/_DesignPreview.tsx`. Internal-only page; no auth gate.

Renders a stack of the chrome and primitives so Max can visually verify everything in Dispatch A without it touching the real public surface:

```tsx
export default function DesignPreview() {
  return (
    <div className="bg-viability-ink text-viability-cream min-h-screen font-sans">
      <ViabilityHeader />
      <main className="pt-24 pb-24 max-w-[1180px] mx-auto px-14 space-y-16">
        <section>
          <Eyebrow>Design preview · internal</Eyebrow>
          <h1 className="font-display font-semibold text-5xl mt-4">Token + chrome sanity check.</h1>
          <p className="text-viability-fg-muted max-w-[620px] mt-6">
            This page exists only to verify Dispatch A. Remove in Dispatch B once the real
            LandingPage replaces it.
          </p>
        </section>

        <section className="space-y-4">
          <Eyebrow tone="amber">Buttons</Eyebrow>
          <div className="flex flex-wrap items-center gap-4">
            <VButton size="sm">Try free →</VButton>
            <VButton size="md">Try free →</VButton>
            <VButton size="lg">Let's do this properly →</VButton>
            <VButton variant="ghost">Ghost variant</VButton>
          </div>
        </section>

        <section className="space-y-4">
          <Eyebrow>Glyphs</Eyebrow>
          <div className="flex items-center gap-8">
            <MGlyph size={22} />
            <MGlyph size={26} />
            <MGlyph size={32} />
            <MGlyph size={32} color="var(--m360-orange)" />
          </div>
        </section>

        <section className="space-y-4">
          <Eyebrow>HairlineLabel</Eyebrow>
          <HairlineLabel>Port Macquarie · NSW</HairlineLabel>
        </section>
      </main>

      <ViabilityTicker />
      <ViabilityFooter />
    </div>
  );
}
```

**This page must not be discoverable from any production link.** It's a back-channel for Max only.

### 4.14 — Register `/_design-preview` route in `App.tsx`

Open [`src/App.tsx`](../../src/App.tsx). Add the import + route:

```tsx
import DesignPreview from '@/pages/_DesignPreview';
// ...
<Route path="/_design-preview" element={<DesignPreview />} />
```

Place the route inside the `Routes` block alongside the other public routes (next to `/terms` or `/privacy`). No `<RequireAuth>` wrap.

### 4.15 — StartPage guest-card hide (11a survivor)

In [`src/pages/StartPage.tsx`](../../src/pages/StartPage.tsx):

**4.15a — Drop the guest card.** Remove the entire `{/* Guest */}` button block (L31–L49 — verify the line range first by reading the file).

**4.15b — Update props:**

```ts
interface StartPageProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onBack?: () => void;
}

export function StartPage({ onCreateAccount, onSignIn, onBack }: StartPageProps) {
```

Drop `onGuest` prop. Collapse the grid (currently `grid grid-cols-1 sm:grid-cols-2`) to a single column: `flex flex-col items-center max-w-[420px] w-full`. Centre the create-account card.

**4.15c — Add Sign In link below the card,** before the `{onBack && ...}` block:

```tsx
<button
  onClick={onSignIn}
  className="mt-6 font-sans text-caption text-muted-foreground hover:text-foreground transition-colors"
>
  Already have an account? <span className="text-brand font-semibold">Sign in</span>
</button>
```

**4.15d — Update `StartPageRoute` in [`src/App.tsx`](../../src/App.tsx)** (currently L79–86):

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

### 4.16 — Verify

In order:

```bash
npm run typecheck        # MUST pass
npm run build            # MUST pass
grep -rn "font-sans" src/ | head -20    # sanity-check: did the tailwind sans override break anything?
```

Then `npm run dev` and manually:

- Visit `http://localhost:5173/_design-preview` → page renders with the new fonts (Fraunces in the heading, DM Sans body), the brand-green accent, the marquee ticker scrolling, the footer at the bottom.
- Sign in via the existing flow → visit `/_design-preview` again → header CTA flips from "Sign in / Try free →" to "Open Viability →".
- Visit `/start` → only the "Create a free account" card is visible + a "Sign in" link below.
- Visit `/` → the OLD `LandingPage` still renders as before (this dispatch did NOT touch it).

## 5. Acceptance criteria

- [ ] `npm run typecheck` GREEN
- [ ] `npm run build` GREEN
- [ ] `vercel.json` exists with the rewrites rule
- [ ] CSS vars `--vbr-*` and `--m360-*` defined in `src/index.css`
- [ ] Tailwind `viability` and `m360` colour namespaces resolve in any source file (test: a temp `<div className="bg-viability-green">x</div>` actually paints green)
- [ ] Fraunces, Syne, DM Sans all load (Network tab shows woff2 fetches from `fonts.gstatic.com`)
- [ ] `public/icons/m-viability.svg` and `m-mojo360.svg` exist
- [ ] All seven new components exist under `src/components/viability/` and render without runtime errors when mounted into `_DesignPreview`
- [ ] `/_design-preview` route renders with chrome + Demo sections visible
- [ ] Header auth-aware (sign in / sign out flips correct CTAs)
- [ ] Ticker scrolls; reduced-motion freezes it
- [ ] `/start` shows only the create-account card + a "Sign in" link
- [ ] Existing `/` (legacy LandingPage), `/how-it-works`, `/reach-out` still render as before this dispatch — no regressions
- [ ] Smoke script (§6) delivered to Max

## 6. Smoke test (Max runs on Vercel preview after deploy)

Auto-deploy on push to main. Then:

| # | Flow | Expected |
|---|---|---|
| 1 | Visit `/privacy` directly (paste URL into a new tab) | Privacy page renders. No platform 404. |
| 2 | Visit `/terms` directly | Terms page renders. No platform 404. |
| 3 | Visit `/_design-preview` while unauthed | Page renders. Header shows MGlyph + "**Mojo** Viability" wordmark (green Mojo, cream Viability). Right side: "Sign in" text + green "Try free →" button. |
| 4 | Click "Sign in" in the preview header | Lands on `/auth`. |
| 5 | Click "Try free →" | Lands on `/start`. |
| 6 | Go back; sign in via `/auth`; revisit `/_design-preview` | Header right side now shows a single green "Open Viability →" button. |
| 7 | Click "Open Viability →" | Lands on `/projects`. |
| 8 | Revisit `/_design-preview`; scroll | Green marquee ticker scrolling near the top. "100% FREE FOREVER" and the other items visible. |
| 9 | Scroll to bottom of `/_design-preview` | Green ticker reappears just above the footer. Footer shows lockup + Mojo 360 card (orange) + Product / Legal / Ecosystem columns + bottom strip with copyright + "Built in Port Macquarie · NSW." |
| 10 | Click "Mojo 360 →" in the footer | Opens `https://mojo360.com.au` in a NEW tab. |
| 11 | Enable Reduce Motion (macOS System Settings → Accessibility → Display) | Reload `/_design-preview`. Ticker is **frozen** in place. No fade-up animations. |
| 12 | Visit `/start` | Single "Create a free account" card. Below it: "Already have an account? Sign in" link. Guest card is gone. |
| 13 | Click "Already have an account? Sign in" | Lands on `/auth`. |
| 14 | Visit `/` (the old legacy LandingPage) | Renders **as before this dispatch** — old burnt-orange header, old hero copy, old content. This is expected — Dispatch B replaces it. |
| 15 | Browser DevTools → Network → reload `/_design-preview` | Fraunces, Syne, DM Sans woff2 files load successfully (200 status, no 404s). |
| 16 | Browser DevTools → Console on `/_design-preview` | No errors, no warnings beyond known React-Router future-flag warnings. |

## 7. Stop conditions

Halt and surface to Max if:

- The `fontFamily.sans` override in `tailwind.config.js` breaks the visual rendering of any existing page (check `/`, `/how-it-works`, `/reach-out`, `/projects`, `/project/<some-id>/break-even`). If so, revert the `sans` override and use `font-display`, `font-display-alt`, and a new `font-body` key (instead of `sans`) for the new components — and document the deviation in the commit message.
- The shadcn `<Button>` doesn't accept the variant overrides cleanly inside `VButton` (e.g. its `cva` definition conflicts with the custom Tailwind classes). If so, build `VButton` as a standalone `<button>` element rather than composing shadcn — document the deviation in the commit message.
- `MGlyph` doesn't recolour correctly via the `color` prop because the source SVG uses hard-coded fills. If so, edit the inlined SVG `<path>` `fill` attribute to use `currentColor` and recolour via CSS instead. Document.
- The Vercel preview deploy fails after pushing. Likely culprit: the `vercel.json` rewrite regex breaks asset loading. Roll back vercel.json and audit the regex against the deployed build's asset paths.
- More than 12 typecheck errors surface from any single sub-step — indicates a deeper coupling than expected. Halt, audit root.
- The handoff README claims `mojo_business/` is the target — this is wrong; the actual repo is `mojo_viability`. If the Executor finds path / dependency references that depend on `mojo_business/`, ignore them and use the local `mojo_viability` paths.

## 8. Commit message

Use verbatim (or close to). One implementation commit:

```
feat: viability design tokens + shared chrome (Step 11b-A)

- vercel.json SPA fallback rewrites — /privacy and /terms now resolve
  on direct navigation (replaces the 11a tactical-patch item)
- CSS-var tokens for the Viability brand (vbr-*, m360-*) added to
  src/index.css alongside the existing shadcn HSL system
- Tailwind theme extended with `viability` and `m360` colour
  namespaces, display / display-alt / mono font families, pill /
  tight / chip radii, ticker + fade-up keyframes
- Fraunces, Syne, DM Sans loaded via <link> tags in index.html
- M-glyph SVG assets in public/icons/
- New components under src/components/viability/: MGlyph, Eyebrow,
  VButton, HairlineLabel, ViabilityTicker, ViabilityHeader,
  ViabilityFooter
- Temporary /_design-preview route mounts the chrome stack for
  visual smoke — removed in Dispatch B
- StartPage guest-card hidden (deferred to Phase 2.5); Sign In
  link added (replaces the 11a tactical-patch item)
```

If pre-commit work on planning docs is uncommitted, land them in a separate `docs:` commit first (don't bundle).

## 9. Handover

At session end, append/update [`handover/HANDOVER.md`](../../handover/HANDOVER.md) using the template in [`CLAUDE.md`](../../CLAUDE.md).

- **Session Summary:** "Step 11 smoke surfaced public-surface defects. Strategic rebuild dispatched as four sub-dispatches (A–D). Dispatch A — design tokens, fonts, shared chrome, `_design-preview` route, StartPage hide — shipped."
- **Completed:** the commit-message bullets.
- **In Progress:** none (A is a closed unit).
- **Next Session:** "Author Dispatch B (`step-11b-B-landing-sections.md`) — new `LandingPage.tsx` with the six sections (What / BuiltFor / How / Proof / Mojo360 / FinalCTA). Hero remains a static placeholder until Dispatch C."
- **Key References:** the index doc + this dispatch + the design handoff folder + the temporary `/_design-preview` route.

Update the Phase 2.5 carry-forward list:
- Move "StartPage's 'Try as guest' deferred" off the carry-forward list — now intentionally hidden, not broken. Note as "Guest mode card hidden in Dispatch 11b-A; build out as part of Phase 2.5 guest-mode plumbing."

---

## Planner notes (not for Executor)

- The `sans` font override in Tailwind is the riskiest single line in this dispatch. Stop condition #1 covers it. Keep the option to back out cleanly.
- The temporary `_DesignPreview` route is a deliberate scaffolding choice — it lets Max verify Dispatch A without coupling it to the real public surface. Dispatch B's first action is to remove the route. If Max prefers to skip the preview route and just trust typecheck + build for A's verification, that's a valid 30-min scope reduction.
- `VButton` composes shadcn `<Button>` rather than reinventing it for accessibility (focus rings, disabled states) — but if cva's variants fight the custom Tailwind classes, the stop condition allows the Executor to fall back to a standalone button. The dispatch prefers composition where it works.
- The ABN placeholder in the footer is intentional. Max needs to confirm the registered ABN before the rebuild goes live to mojobusiness.ai. Bake this into Step 11b-final smoke.
- Dispatch B's scope assumes A's `ViabilityHeader` and `ViabilityFooter` are correct. If A's smoke surfaces a problem with either, fix in A's tail rather than letting it propagate.
