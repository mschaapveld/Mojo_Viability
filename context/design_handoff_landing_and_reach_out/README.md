# Handoff: Mojo Viability — Landing & Reach Out

## Overview

Two production screens for **mojobusiness.ai**:

1. **Landing page** — single-page marketing site with an interactive mini-calculator hero (the "Live Dossier"). Four sliders (annual rent + three percentage sliders) compute a live traffic-light viability case in real time. Followed by `What you're checking for`, `Built for`, `How it works`, `Proof`, the `Mojo 360` sibling strip, final CTA, and a green free-forever ticker that scrolls top + bottom.
2. **Reach Out page** — single-purpose contact form with founder card. Form submit transitions inline to a "Received" state (no page reload).

Both share a global `ViabilityHeader` (nav: Home · Reach Out · Sign in · primary CTA) and `ViabilityFooter`.

The voice is **serious, protective, peer-with-experience** — loss-aversion framed, never "empower your business" SaaS marketing. See `prototype/colors_and_type.css` for tokens and the existing **Mojo Viability Design System** README for the full content / voice rules.

---

## About the Design Files

The files in `prototype/` are **design references created in HTML/JSX** — they show the intended look and behaviour, not production code to ship. They use plain inline-style JSX inside `<script type="text/babel">` tags with React 18 from a CDN. Babel-in-browser is for design preview only.

**The task is to recreate these designs in `mojo_business/` (Vite + React 18 + TypeScript + Tailwind + shadcn/ui).** Lift exact token values from `prototype/colors_and_type.css` (or use the existing equivalents in the codebase if they already exist), then build new components using your established Tailwind classes / shadcn primitives / project conventions.

Do **not** copy the inline-style JSX directly — translate it to Tailwind classes (or the codebase's preferred styling system) and shadcn components.

---

## Fidelity

**High-fidelity.** Final colours, typography, spacing, copy, interactions, and motion are all locked in. Recreate pixel-perfect.

---

## Tech Target

- **Codebase:** `mojo_business/` — Vite + React 18 + TypeScript + Tailwind + shadcn/ui
- **Routes:** `/` (Landing) and `/reach-out` (Reach Out)
- **Fonts:** Fraunces, DM Sans, Syne — load from Google Fonts (preconnect + `display=swap`). See `prototype/colors_and_type.css` for the exact `@import` line and weight set.

---

## Design Tokens

All values come from `prototype/colors_and_type.css`. Match these exactly.

### Colours

| Token | Hex / RGBA | Use |
|---|---|---|
| `--vbr-ink` | `#080808` | Page canvas |
| `--vbr-ink-2` | `#0e0e0e` | Card surface |
| `--vbr-ink-3` | `#141414` | Elevated surface |
| `--vbr-cream` | `#f5f2ed` | Foreground |
| `--vbr-fg-muted` | `rgba(245,242,237,0.62)` | Secondary text |
| `--vbr-fg-subtle` | `rgba(245,242,237,0.38)` | Tertiary text / monospace meta |
| `--vbr-fg-faint` | `rgba(245,242,237,0.18)` | Faint outline / pending |
| `--vbr-green` | `#34d399` | Primary action — emerald |
| `--vbr-green-hover` | `#2ec07f` | Hover darken |
| `--vbr-green-soft` | `rgba(52,211,153,0.12)` | Tinted backgrounds |
| `--vbr-green-softer` | `rgba(52,211,153,0.06)` | Faint tinted backgrounds |
| `--vbr-green-line` | `rgba(52,211,153,0.28)` | Borders on green-tinted elements |
| `--vbr-green-on` | `#062b1d` | Text colour on green fills |
| `--vbr-amber` | `rgba(232,180,90,0.92)` | Reserved second accent — deal-breaker emphasis only |
| `--vbr-amber-soft` | `rgba(232,180,90,0.12)` | Amber tinted background |
| `--vbr-amber-line` | `rgba(232,180,90,0.32)` | Amber border |
| Red (deal-breaker) | `#ef6a5e` | Used in live dossier "red" lights only |
| Red soft | `rgba(239,106,94,0.10)` | Red tint background |
| Red line | `rgba(239,106,94,0.28)` | Red border |
| `--m360-orange` | `#e8622a` | Mojo 360 cross-link card ONLY |
| `--m360-orange-hover` | `#d4571f` | |
| `--m360-orange-soft` | `rgba(232,98,42,0.10)` | |
| `--m360-orange-line` | `rgba(232,98,42,0.28)` | |
| `--vbr-border` | `rgba(255,255,255,0.07)` | Hairline border (default) |
| `--vbr-border-strong` | `rgba(255,255,255,0.14)` | Hairline strong (hover / emphasis) |

**Selection colour:** `::selection { background: #34d399; color: #062b1d; }`.

### Typography

| Role | Font | Weight | Size | Line-height | Tracking |
|---|---|---|---|---|---|
| Display XL (Editorial hero) | Fraunces | 600 | `clamp(56px, 7.4vw, 108px)` | 0.96 | -0.035em |
| Display L (Hero / Final CTA) | Fraunces | 600 | `clamp(50px, 5.8vw, 82px)` | 0.96–0.98 | -0.035em |
| Display M (Section h2) | Fraunces | 600 | `clamp(38px, 4.2vw, 60px)` | 1.02 | -0.025em |
| Display S (Card h3) | Fraunces | 600 | 22–28px | 1.1–1.15 | -0.015 to -0.02em |
| Stat mega (proof number) | Fraunces | 700 | `clamp(72px, 9vw, 132px)` | 0.92 | -0.04em |
| Body lg | DM Sans | 300 | 17px | 1.55 | — |
| Body | DM Sans | 300 | 14.5px | 1.6 | 0.01em |
| Body sm | DM Sans | 300 | 13.5px | 1.55 | — |
| Eyebrow | DM Sans | 500 | 11px | — | 0.18em, uppercase |
| Mono meta / kicker | system monospace | 400 | 10.5–12px | — | 0.06–0.16em, often uppercase |
| Display alt (Mojo 360 strip only) | Syne | 600–800 | matches local context | — | -0.02em |

Italics on Fraunces are used for **emphasis on key words only** — *model*, *honest read*, *the venue*, *Pick the door*, *Thanks for writing*. Never for body copy.

**Tabular numerals** (`font-variant-numeric: tabular-nums`) on every number in the live dossier rows and the verdict bar.

### Spacing

`4 · 8 · 12 · 16 · 22 · 28 · 36 · 48 · 56 · 72 · 110` (px). Section vertical padding `110–120px` on desktop, `36–46px` on mobile.

### Layout widths

- Landing section max-width: **1180px** (`maxWidth: 1180; margin: 0 auto; padding: 0 56px`)
- Final CTA centred block: **920px**
- Body paragraph: **620px**

### Corner radii

- Pills, ticker text, primary buttons: **9999px** (fully rounded — distinct from Mojo 360's 10px)
- Cards / artboards / surfaces: **6px** (deliberately tighter than Mojo 360's 12px — reads more editorial)
- Icon containers / small chips: **8–12px**

### Shadows

- Dossier card: `0 30px 80px rgba(0,0,0,0.55)`
- Primary CTA hover: `0 6px 24px rgba(52,211,153,0.30)`
- Pill (filled): `0 4px 14px rgba(52,211,153,0.18)`
- Cards in dark mode otherwise: **none** — hairline border does the work.

### Borders

- Hairline default: `0.5px solid rgba(255,255,255,0.07)`
- Strong: `1px solid rgba(255,255,255,0.14)` for hover / emphasis
- Tinted variants for green / amber / orange / red use their respective `*-line` token

### Animation

- **Soft fade-up** for hero text: `opacity 0 → 1` + `translateY(8–12px) → 0`, 480–800ms ease-out. Never bouncy.
- **Green marquee ticker:** `translateX(0 → -33.333%)`, **38s linear infinite**, full-width. 28s on mobile.
- **Hover lift** on primary CTA: `translateY(-1px)` + green shadow.
- **Slider thumb:** transitions `left`, `border-color`, `box-shadow` at 140–220ms ease.
- Respect `prefers-reduced-motion` — freeze the ticker animation.

---

## Components (shared)

### `MGlyph` — brand mark

SVG, recolourable. Two-path rounded square + cut-out M counter. Source: `prototype/assets/Icon_M_Viability.svg` (emerald) and `Icon_M_Mojo360.svg` (orange — Mojo 360 cross-link only).

```
size: 20 | 22 | 24 | 26 | 28 | 32  (header 26, footer 24, mobile 22, M360 strip 32)
color: emerald #34d399 (Viability) or orange #e8622a (Mojo 360 strip only)
ink:   #080808 (the cut-out colour)
```

### `Eyebrow` — small overline label

```
DM Sans 500 · 11px · uppercase · letterSpacing 0.18em
Default colour: --vbr-green (#34d399)
Stakes/warning colour: --vbr-amber
Optional leading dot: 6×6 circle in same colour
```

### `VButton` — primary CTA

```
font: DM Sans 500, 14.5 (md) / 15.5 (lg) / 13 (sm)
padding: 13×22 (md) / 16×28 (lg) / 9×16 (sm)
radius: 9999px (fully rounded)
bg: #34d399 (hover: #2ec07f, lift 1px, shadow 0 6px 24px rgba(52,211,153,0.30))
fg: #062b1d
font-weight: 600
```

Ghost variant: `border: 1px solid rgba(255,255,255,0.14)` + transparent bg. Hover bg `rgba(245,242,237,0.06)`.

### `ViabilityTicker` — green marquee band

```
bg: #34d399
padding: 12px 0
text: DM Sans 700 · 12.5px · uppercase · letterSpacing 0.18em · color #062b1d
animation: ticker translateX 0→-33.333%, 38s linear infinite (28s on mobile)
items: ['100% FREE FOREVER', 'NO PAID TIER', 'NO IN-APP PURCHASES', 'NO HIDDEN CHARGES', 'NO CREDIT CARD', 'USE IT AS LONG AS YOU NEED', 'NO TRIAL THAT ENDS', 'BUILT TO PREVENT CLOSURE — NOT PROFIT FROM IT']
separator between items: ✦ glyph at 14px, opacity 0.45, gap 44px
```

Rendered top (right after hero) and bottom (right before footer).

### `ViabilityHeader`

```
padding: 20px 56px
nav links: 'Home' (cream/active) · 'Reach Out' (muted)
left lockup: <MGlyph size=26> + "Mojo Viability" (Fraunces 700 22px, "Mojo" emerald, "Viability" cream)
right: "Sign in" text link + <VButton size=sm> "Try free →"
```

### `ViabilityFooter`

```
bg: #050505 · borderTop hairline · padding: 72px 56px 36px
columns: 1.4fr 1fr 1fr 1fr — lockup+blurb, Product (Reach Out), Legal (Privacy, Terms), Ecosystem (Mojo 360 →)
the lockup column includes a small "When you're trading, Mojo 360 takes over →" card (orange #e8622a accent)
bottom strip: © 2026 Mojo Pty Ltd · ABN ... · "Built in Port Macquarie, Australia" with a tiny green dot
```

---

## Screens

# 1. Landing Page (`/`)

Order from top to bottom (one continuous scroll):

```
ViabilityHeader
HeroLiveDossier
ViabilityTicker
SectionWhat
SectionBuiltFor
SectionHow
SectionProof
SectionMojo360
SectionFinalCTA
ViabilityTicker
ViabilityFooter
```

## Hero — Live Dossier (THE centrepiece)

**Layout:** two-column grid, `gridTemplateColumns: '1fr 1.05fr'`, gap 76px, vertically centred, inside the 1180px container. Padding `108px 56px 88px`.

### Left rail

- Eyebrow: `Mojo Viability · A free tool` (green dot + green text)
- H1 (Fraunces 600, clamp 50–82px, line-height 0.96, tracking -0.035em, max-width 600):
  > Before you sign the lease,
  > *model* the venue.
  >
  > (the word "model" is italic Fraunces)
- Subline (DM Sans 300, 17px, muted, max-width 480, margin-top 28):
  > Move the three sliders → watch your viability case write itself. Then come back and run the full **twelve-module** version.
  >
  > "twelve-module" picks up amber colour when `showAmber` is true.
- CTA row: primary `<VButton size=lg>` reading **"Let's do this properly →"** + text link "Already have an account? Sign in" with underline-on-hover.
- Stat triple (paddingTop 22, borderTop hairline, gridTemplateColumns 3-col): **12** modules · **~30** min · **$0** no paid tier. Numbers Fraunces 600 32px green; labels DM Sans 300 12px muted.

### Right rail — the live dossier card

Background `#0c0c0c`, hairline border, 6px radius, shadow `0 30px 80px rgba(0,0,0,0.55)`.

**Header strip** (padding 18×22, borderBottom hairline, subtle green gradient bg):
- Left: 8×8 status dot (faint when untouched, emerald with `0 0 0 4px green-soft` glow once any slider moved) + mono uppercase "Try it — live viability case"
- Right: mono "v1 · sample"

**Concept block** (padding 22×22 8): mono kicker "Concept" + Fraunces 600 22px title "**40-seat café · Brunswick East · Melbourne**" + mono "7-day trade · breakfast + lunch · $24 avg check"

**Slider block** (padding 14×22 8, flex column, gap 14). FOUR sliders in this order:

| # | Label | Help text | Range | Step | Format |
|---|---|---|---|---|---|
| 1 | Annual rent | base rent on the lease (ex outgoings) | 0 – 300,000 | 1,000 | `$56,000` |
| 2 | Cost of goods · % of sales | food + drink inputs | 0 – 60 | 0.5 | `32.0%` |
| 3 | Labour · % of sales | wages + super + on-costs | 0 – 60 | 0.5 | `30.0%` |
| 4 | Other costs · % of sales | utilities · insurance · marketing · everything else | 0 – 60 | 0.5 | `22.0%` |

**Slider visual spec:**
- Label row: DM Sans 12.5px muted label + mono 10px subtle help text (block, marginTop 2px) on the left; right side mono 13px tabular-nums showing current value when touched OR `$— · set this` / `—% · set this` when untouched.
- Track: 2px tall, full-width, bg `rgba(245,242,237,0.08)`. Fill from left to current value: 2px tall, bg emerald (or `rgba(245,242,237,0.15)` when untouched).
- Thumb: 16×16 circle, ink bg, 1.5px border emerald (or subtle when untouched), `box-shadow: 0 0 0 5px var(--vbr-green-softer)` when touched.
- The actual `<input type="range">` is absolutely positioned, full-width, opacity 0 — the visual is a separate div positioned by the % of (value - min) / (max - min). On `change`, set the value AND flip `touched[k] = true` (touched is a per-key boolean, used everywhere to gate UI).

**Output block — "The verdict, line by line"** (padding 14×22 6, borderTop hairline, marginTop 6):
- Mono uppercase green title "THE VERDICT, LINE BY LINE", marginBottom 4
- Five rows, each `gridTemplateColumns: 1fr auto`, padding 11×0, borderTop hairline between rows:

| Row | Threshold logic |
|---|---|
| Annual rent (formatted `$X,XXX`) | green if < $80k, amber if < $150k, else red |
| Cost of goods (formatted `XX.X%`) | green if < 32%, amber if < 36%, else red |
| Labour (formatted `XX.X%`) | green if < 30%, amber if < 36%, else red |
| Other costs (formatted `XX.X%`) | green if < 20%, amber if < 25%, else red |
| **Net margin** (formatted `XX.X%`, derived = `100 - cogs - labour - other`) | green if > 10%, amber if > 5%, else red. **Emphasised row** — bg `rgba(52,211,153,0.025)`, fullbleed via negative margin-inline, value 18px font-weight 500 instead of 15.5/400, dot 11×11 instead of 9×9 |

Left half of each row: DM Sans 13px row label (muted, cream if emphasised) + mono 11px delta hint (e.g., "healthy · under $80k", "tight · over 8%", "red flag · over 36%", "awaiting slider"). Right half: mono tabular-nums value + 9×9 (or 11×11) status dot with `box-shadow: 0 0 0 4px [glow]`. Each row transitions `color` and `background`/`box-shadow` over 200–220ms ease.

Light colours: green `#34d399` / amber `rgba(232,180,90,0.92)` (falls back to muted cream `rgba(245,242,237,0.45)` when "quiet" stakes setting) / red `#ef6a5e` / pending `rgba(245,242,237,0.18)`. Each has a soft glow variant (`*-softer` for green).

**Verdict bar** (padding 16×22, borderTop tone-coloured 1px, tone-tinted bg, transitions 240ms):

| Reds | Ambers | Margin | Tone | Label | Sub |
|---|---|---|---|---|---|
| — | — | — | pending | "Move the four sliders to see the verdict" | "— · —" |
| any | any | ≤0 | red | "Walk away" | "costs exceed sales" |
| ≥2 | any | >0 | red | "Walk away" | "{N} structural deal-breakers" |
| 1 | any | >0 | red | "One deal-breaker · re-cut it" | "fix this before signing" |
| 0 | ≥2 | >0 | amber | "Viable — but tight" | "{N} margins running thin" |
| 0 | 1 | >0 | amber | "Viable with one tight margin" | "watch this line" |
| 0 | 0 | >0 | green | "Viable" | "on these ratios, the numbers stack" |

Layout: 10×10 status dot in tone colour (with `0 0 0 4px [bg]`) + label (Fraunces 16/600, tracking -0.01em) + sub (mono 10.5px subtle, marginTop 4, lowercase). On the right: mono uppercase muted "Export · PDF / xls →".

**State management:**

```ts
type VenueKey = 'cafe' | 'winebar' | 'pub';
type DossierState = 'empty' | 'mid' | 'complete';

interface DossierValues { rent: number; cogs: number; labour: number; other: number; }
interface DossierTouched { rent: boolean; cogs: boolean; labour: boolean; other: boolean; }
```

- `vals` and `touched` reset to preset whenever `venueKey` or `initialState` changes (use `useEffect` keyed on both).
- "empty" state: all values 0, all touched false. Sliders sit at left; rows show `—`.
- "mid" / "complete" state: values come from `venue.preset.mid` / `venue.preset.complete` (see `prototype/heroes-v2.jsx` for the per-venue presets).
- Touching any slider flips `touched[k] = true` and never back.

**Top-right hero corner:** small mono uppercase muted "Live dossier" label, absolutely positioned `top: 28, right: 56`.

## SectionWhat — "What you're checking for"

Eyebrow "What you're checking for" → Display M h2 "The deal-breakers fall into three places." → 620px intro paragraph → grid 3 cards. Each card: ink-2 bg, hairline, 6px radius, padding 28×26, minHeight 320. Top-right kicker "01" / "02" / "03" (mono 11px subtle). Fraunces h3 28px → DM Sans 300 14.5px blurb → modules list (mono 12px muted with leading "·").

Exact copy in `prototype/sections.jsx`. Three cards: **The money** (simple/detailed break-even, fitout finance, labour costing) · **The location** (location suitability, sales modelling, sales predictions) · **The operations** (hours, menu, business planning, AI plan draft + builder).

## SectionBuiltFor — "Built for"

Eyebrow "Built for" → h2 "Three people land here, with the same question." → 3 cards (First venue / Venue #2 / Investor · partner). **First card carries the amber stakes treatment** when `showAmber=true` — its top-right tag pill "highest stakes" is amber instead of green (bg `--vbr-amber-soft`, border `--vbr-amber-line`, text `--vbr-amber`).

## SectionHow — "How it works"

Eyebrow → h2 "Three moves from concept to case." → 3-step rail with a horizontal dotted green line behind 56×56 numbered circles (border `--vbr-green-line`, mono number, `boxShadow: 0 0 0 8px ink` so it punches through the rail). Below: two `ShopfrontPlaceholder` boxes (pre-fitout placeholder — corner brackets + diagonal hatch + monospace caption).

## SectionProof — proof stat + founder story

Two-column. Left: amber eyebrow "The cost of getting it wrong" → giant Fraunces 700 stat **~1 in 2** → Fraunces 500 line "Australian small businesses don't make it to five years." → muted DM Sans paragraph + three small mono badges ("~25% close in year 1", etc.) + ABS source footnote.

Right: founder story card (`#0c0c0c`, hairline, 6px radius, padding 32×30). Floating mono label "FROM THE MAKER" at top-left (translateY -50% with ink-2 bg padding). Large pull quote *"Behind every closed venue there's a family."* (Fraunces 600 28px with a green Fraunces italic large quotation mark prefix). Then the story paragraph. Bottom strip: 38×38 round avatar with "MS" initials (greenSoft bg, greenLine border, Fraunces 700 16px green) + "Max Schaapveld" / "Built Mojo Viability · Port Macquarie NSW".

## SectionMojo360 — sibling cross-link strip

Inside-the-1180 contained card. Padding 32×36, 8px radius, ORANGE accent (`#e8622a`):

```
bg: linear-gradient(180deg, rgba(232,98,42,0.04), rgba(232,98,42,0)), #0e0e0e
border: 1px solid rgba(232,98,42,0.28)
gridTemplateColumns: auto 1fr auto
```

Left: 56×56 rounded-12 tile with `MGlyph color=#e8622a` inside. Middle: **Syne** kicker "ONCE YOU'RE OPEN · MOJO 360" (orange) + Syne 700 28px headline "When you're trading, our **sibling** takes over." (sibling = orange) + DM Sans paragraph. Right: orange pill button (#fff text, hover darken to #d4571f + 1px lift + orange shadow) "Visit Mojo 360 →".

The vertical dotted rail on the right edge (`repeating-linear-gradient` orange-line dots) is intentional editorial chrome.

**This is the ONLY place orange / Syne should appear on the Viability surface.**

## SectionFinalCTA

Centred 920px block on ink bg. Soft green radial wash behind (`radial-gradient(closest-side, rgba(52,211,153,0.10), rgba(52,211,153,0))`, 900×900, top -40%, centred). Eyebrow centred "Free forever — that's the whole deal" → Fraunces 600 clamp 44–72 "Run the numbers before / *you sign anything.*" → muted paragraph → centred CTA row: `<VButton size=lg>` **"Let's do this properly →"** + "Already have an account? Sign in" link.

---

# 2. Reach Out Page (`/reach-out`)

```
ViabilityHeader
ReachOutHero
ViabilityTicker
SectionMojo360
ViabilityFooter
```

## ReachOutHero

Padding 96×56 112 on the 1180px container.

**Top strip** (flex space-between, marginBottom 38): green eyebrow "Mojo Viability · Reach out" + HairlineLabel "Port Macquarie · NSW" (28px hair rule + mono caption).

**H1** (Fraunces 600, clamp 56–96px, line-height 0.96, tracking -0.035em, max 820):
> Tell me about
> *the venue* you're modelling.

**Subline** (DM Sans 300, 17px, muted, max 620, marginTop 28):
> The tool is free and stays free. This page is for everything around it — bugs you've hit, modules you'd like added, an investor case you'd like a second pair of eyes on, or you just want to test the thinking out loud.

**Two-column grid** marginTop 64, `gridTemplateColumns: '1.4fr 1fr'`, gap 56, items-start.

### Left — Form card

`#0e0e0e` bg, hairline border, 6px radius, padding 32×32 28. A small floating mono label "THE FORM" at top-left (translateY -50%, ink-2 bg padding 2×10).

Form layout: flex column, gap 22.

- **Row 1** (flex, gap 22): Field "Your name" (text input, placeholder "e.g. Sam Nguyen") + Field "Email" (email input, placeholder "your@email.com")
- **Row 2**: Field "Where you're at" — **Role pills** (see below)
- **Row 3**: Field "What's on your mind" (textarea, rows=6, placeholder shows a realistic example about a Brunswick café), with help text below in mono "The detail helps. Numbers help even more."
- **Footer row** (flex space-between, paddingTop 8):
  - Left: mono 11px subtle "replies within 2 business days" (becomes "sending…" while submitting)
  - Right: green submit button (same VButton styling, label "Send →" / "Sending…")

**Field component spec:**
- Label: mono 10.5px uppercase green, letterSpacing 0.14em
- Input/textarea: DM Sans 300 15px cream, bg `rgba(245,242,237,0.02)`, border `--vbr-border` (focus: `--vbr-green-line`), 6px radius, padding 13×14. Border-colour transition 160ms.
- Help text below: mono 10.5px subtle

**RolePills** (5 options): horizontal pills (flex-wrap, gap 8). Each pill: padding 9×14, 9999 radius, DM Sans 13 (active 500/inactive 400), 1px border, 6×6 leading dot.

| Value | Label |
|---|---|
| `first` | First venue |
| `second` | Venue #2 |
| `investor` | Investor · partner |
| `curious` | Just curious |
| `press` | Press · partnership |

Inactive: border `--vbr-border`, transparent bg, fg muted, dot faint.
Active: border green-line, bg green-soft (16%), fg green, dot green.
**Active + `first` + `showAmber=true`**: border amber-line, bg amber-soft (16%), fg amber, dot amber. Same swap pattern as `SectionBuiltFor`'s "highest stakes" tag.

### Right — FounderCard (aside)

`#0c0c0c` bg, hairline, 6px radius, padding 28×28 26. Floating "WHO YOU'LL HEAR FROM" mono label at top-left.

Layout:
1. **Avatar row** (flex, gap 14, marginTop 6, marginBottom 18): 48×48 round avatar with "MS" initials (greenSoft bg, greenLine border, Fraunces 700 18px green) + name "Max Schaapveld" (DM Sans 500 15px cream) + "Built Mojo Viability · Port Macquarie NSW" (DM Sans 12.5 subtle, marginTop 2).
2. **Quote** (Fraunces 500 italic, 17px, line-height 1.4, tracking -0.01em): *"If the numbers don't stack on the page, they won't stack on opening day. I'd rather have an uncomfortable conversation with you now than read about your closure on Broadsheet next year."*
3. **Stat tiles** (2×2 grid, paddingTop 16, borderTop hairline). Each tile padding 10×0, internal column has borderRight hairline:
   - Reply window → `< 2 business days`
   - Cost of reply → `$0 · still free`
   - Best for → `modelling pain`
   - Not for → `sales pitches`

   Tile labels: mono 10px uppercase subtle 0.14em. Values: DM Sans 13px cream.
4. **Channel row** (marginTop 18, paddingTop 16, borderTop hairline, flex column gap 10): mono 12px cream links — `✉ max@mojobusiness.ai` (mailto) and `◯ @maxschaapveld · IG`. The leading glyph is green; the rest is cream.

### Submission flow

```ts
type Status = 'idle' | 'sending' | 'sent';
```

- On submit (when `idle`): `setStatus('sending')`, simulate or POST, then after the request `setStatus('sent')`. In the prototype this is a fake 900ms timeout — replace with the real submission endpoint.
- While `sending`: submit button reads "Sending…", `cursor: wait`, `opacity: 0.85`, shadow removed. Footer caption reads "sending…".
- On `sent`: the entire form card content swaps to the **SentState** (480ms fade-up keyframe `reachOutReveal`).

### SentState

Inside the same card (no card resize/no page navigation):

- Green eyebrow "Received" with leading dot
- Fraunces 600 38px line-height 1.05 heading: "Got it. *Thanks for writing.*" (italics on the second phrase)
- Muted paragraph: `Reply within two business days, usually faster. Going to {email}. If it's urgent, the founder DM on Instagram is faster — @maxschaapveld.` (the email is rendered in cream; the @-handle is a green link with green-line underline)
- BorderTop strip (paddingTop 20, borderTop hairline): green "Open Viability and start modelling →" link on the left + tertiary "Send another note" text button on the right that calls `reset()` (clears the form and sets status back to `idle`).

### Submission semantics (production)

The prototype's submit is a stubbed timeout. Wire it to the real intake — most likely a serverless endpoint that:
- Validates fields server-side (name + email + message non-empty; valid email)
- Stores the lead (Supabase / similar)
- Sends an email notification to `max@mojobusiness.ai`
- Returns 200 on success → `setStatus('sent')`
- Surfaces errors inline above the submit row (we don't have an explicit error UI in the prototype — use a small mono red caption above the submit row in `#ef6a5e`)

---

## Interactions & Behaviour — full list

- **Slider drag** (Live Dossier): real-time. Each `onChange` updates the slider value AND sets `touched[k] = true`. Lights, hint text, verdict label, and verdict bar tone all recompute synchronously.
- **Verdict bar transitions**: `background` and `border-color` 240ms ease. The status dot inside the bar matches the bar tone.
- **Hover (primary CTA)**: bg → hover, `translateY(-1px)`, shadow `0 6px 24px rgba(52,211,153,0.30)`. 180–220ms ease.
- **Hover (text link)**: underline appears, colour cream → green.
- **Hover (form input)**: no hover behaviour. Focus only.
- **Focus (form input)**: border-colour to `--vbr-green-line`, 160ms.
- **Role pills**: click toggles the active role (single-select, never empty).
- **Form submit**: blocks repeat submits while sending. Reset clears all fields back to defaults (role defaults to `'first'`).
- **Ticker**: continuous translate. Honour `prefers-reduced-motion: reduce` → freeze.
- **Reduced motion globally**: kill all fade-up/door-reveal animations, keep state transitions instant.
- **Selection**: highlight in `#34d399` with foreground `#062b1d`.

---

## Responsive behaviour

The prototype has explicit desktop (1180w) and mobile (390w) compositions in two separate component trees. In production, treat **390px** as the mobile breakpoint reference and **1180px** as the desktop max-width. The hero, sections, and form should collapse cleanly between them.

Specific mobile differences:
- Header: compact, no nav (hamburger glyph only — two 18×1.5 cream bars, gap 4). No "Sign in" / "Try free →".
- Hero h1: Fraunces 600 42px (landing) or 38px (reach out). Same italic word treatment.
- Live dossier card: same component, the sliders just sit closer together (gap 12 instead of 14, padding 16 instead of 22).
- Verdict row delta text shortened to single-word hints ("healthy", "tight", "red flag", "awaiting") — they don't fit at full length.
- Form: stacks vertically; name and email fields go to one column each; founder card appears below the form, not beside.
- Mojo 360 card on mobile: a compact link tile (36×36 glyph + small kicker + arrow) instead of the full strip.
- Mojo 360 strip (desktop) is wholly replaced by the compact mobile card on mobile.

---

## State Management

Each interactive area is local-state, no global store needed:

- **Live Dossier**: `vals`, `touched`, derived `light` per row, derived `verdict`. `useEffect` keyed on `[venueKey, initialState]` to re-seed from presets when venue or starting state changes.
- **Reach Out form**: `form` (name, email, role, message), `status`, callbacks `onField(k)`, `onRole(v)`, `submit`, `reset`.

No data fetching beyond the Reach Out submit.

The prototype exposes a "Tweaks" panel (host-side) with: `showAmber` (loud/quiet stakes), `dossierState` (empty/mid/complete starting state), `venueKey` (cafe/winebar/pub), `showMojo360` (toggle the strip + footer cross-link). In production these are **not** end-user controls — pick the final values and remove the panel. Suggested production defaults: `showAmber=true`, `dossierState='empty'` (always start the live dossier empty for first-time visitors), `venueKey='cafe'`, `showMojo360=true`.

---

## Voice & copy rules (carry forward verbatim)

- **Australian English** everywhere: modelling, labour, favourite, centre, organisation.
- **No exclamation marks. No emoji. No SaaS clichés.**
- **You / your** in product copy. **We** only inside the founder story (the quote is first-person).
- **Loss-aversion framing.** Don't soften the headline copy into "empower your business." The page's edge is its honesty.
- **Numbers and specificity over adjectives.**
- Arrow convention: `→` (not `>` or `»`).
- Bullet separator: `·` (middle dot), never `|` or `—`.
- Ticker copy: ALL CAPS on green; the rest of the page does NOT shout.

---

## Assets

In `prototype/`:

| File | Use |
|---|---|
| `assets/Icon_M_Viability.svg` | The M-glyph in emerald — primary Viability mark |
| `assets/Icon_M_Mojo360.svg` | The M-glyph in orange — Mojo 360 cross-link strip only |
| `colors_and_type.css` | All design tokens as CSS variables. Lift values into your Tailwind config / `theme.ts`. |

No raster imagery is used. The "shopfront placeholder" in SectionHow is drawn in CSS — `repeating-linear-gradient` diagonal hatch on `#0c0c0c → #0a0a0a`, four absolutely-positioned 14×14 corner brackets (1px subtle), centred mono caption.

---

## Files in this handoff

```
design_handoff_landing_and_reach_out/
├── README.md                              ← this file
└── prototype/
    ├── Mojo Viability Landing.html        ← entry point — design-canvas + tweaks panel wrapping the components
    ├── core.jsx                           ← VBR tokens (JS), MGlyph, Eyebrow, VButton, ShopfrontPlaceholder,
    │                                        ViabilityTicker, FreePromise, FreeForeverStamp, ViabilityHeader,
    │                                        ViabilityFooter, HairlineLabel
    ├── sections.jsx                       ← SectionShell, SectionWhat, SectionBuiltFor, SectionHow,
    │                                        SectionProof, SectionMojo360, SectionFinalCTA
    ├── heroes-v2.jsx                      ← SAMPLE_VENUES, THRESHOLDS, SLIDER_CFG, HeroLiveDossier,
    │                                        LiveDossierCard, DossierSlider, DossierRow, VerdictBar
    ├── shells-v2.jsx                      ← FullLandingV2 composition
    ├── mobile-v2.jsx                      ← MobileLandingV2, MobileLiveDossier, MobileMojo360Card, MobileFooterV2
    ├── reach-out.jsx                      ← ROLE_OPTIONS, useReachOutForm, ReachOutDesktop, ReachOutHero,
    │                                        ContactForm, SentState, Field, Input, Textarea, RolePills,
    │                                        FounderCard, ReachOutMobile
    ├── colors_and_type.css                ← design tokens, font imports, semantic text classes
    └── assets/
        ├── Icon_M_Viability.svg
        └── Icon_M_Mojo360.svg
```

To preview the prototype: open `prototype/Mojo Viability Landing.html` in a browser.

---

## Implementation tips for the developer

- **Start by porting the tokens.** Add a `theme.ts` (or equivalent) with the colour, font, spacing, and radius values from `colors_and_type.css`. Wire them into `tailwind.config.ts` as `colors.viability.*`, `fontFamily.display`, etc. Then nothing in the rest of the build is allowed to reference a raw hex.
- **Use `font-feature-settings: "tnum"` on the live dossier numbers.** Without tabular numerals, the slider value text jiggles as it changes width.
- **Slider component**: the prototype rolls a custom slider with a hidden `<input type="range">` overlaid on a styled track. Use a shadcn `<Slider>` if it covers the styling needs; otherwise port the same approach (a11y-keep the native input underneath, opacity 0, full-width, so keyboard / screen reader still work).
- **Form**: use shadcn `<Input>`, `<Textarea>`, `<Button>` primitives — restyle them to match the spec via Tailwind. The "where you're at" pills are a `<ToggleGroup>` analogue (single-select).
- **No portal needed for the SentState** — it's the same card with conditional content. The fade-up keyframe is named `reachOutReveal` in the prototype, ~480ms ease-out.
- **Header active state** for nav: the home item is full-cream cream, all others are `--vbr-fg-muted`. Use the current route to decide which is active.
- **The Mojo 360 strip uses Syne**, which is loaded by `colors_and_type.css`. Keep it loaded — it's the only place Syne appears, and it's intentional that the sibling brand reads in its own voice inside its own card.
- **Don't add testimonials.** The README of the Mojo Viability design system explicitly warns against fake testimonial copy — the proof section's founder story does that work.
- **Don't add "How It Works" as a separate page** — we deliberately removed it from the nav; the on-page section does the work.
