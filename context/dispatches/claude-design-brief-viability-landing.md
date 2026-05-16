# Brief for Claude Design — Mojo Viability landing page mockup

Copy everything below the line into Claude Design (or any external design tool / Claude.ai session with mockup capability). Self-contained — no prior context needed.

---

## What you're designing

Mockups for the **public landing page** (and ideally the matching nav header + footer) of **Mojo Viability** — a free hospitality business viability tool. The page lives at `mojobusiness.ai` and is the front door for prospective venue owners deciding whether to bet money on an idea.

I'd like 2–3 visual options for the **hero section** plus a single end-to-end mockup of one full landing page following the structure described below. Mobile + desktop comp for the chosen direction would be ideal.

Tech context (so designs are realistically implementable): Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui components. Components and patterns I already have in the codebase should be reused; the design shouldn't depend on anything exotic.

---

## The product in one paragraph

Mojo Viability lets a prospective venue owner model whether their hospitality business idea actually stacks up before they sign the lease, take on debt, or sink savings into fitout. The tool runs a venue concept through ~12 modules: simple break-even, detailed break-even, fitout financing (rent or buy), hours of operation, sales modelling, menu building, labour costing, location suitability, sales predictions, business planning, AI-assisted business plan generation, and a final business plan builder. Output is a structured viability case that can be exported as PDF or Excel — suitable for taking to a bank, a partner, or a co-investor.

It's free. There's no paid tier. Strategically, Viability is the lead-generation front door for **Mojo 360** — a separate, paid Virtual Manager OS that takes over once the venue is actually operating. The relationship is sibling products, but the landing page is for Viability alone.

## Who it's for

Three personas hit this page in roughly equal volume. The hero needs to land for all three:

1. **First-time venue owner (pre-trading).** Highest emotional stakes — about to bet their savings. Needs reassurance, structure, "what am I missing?" confidence.
2. **Existing operator opening venue #2 (or relocating).** Already runs one venue. Knows the operational pain. Wants speed and validation, not education.
3. **Investor or partner evaluating a deal.** Money person looking at someone else's concept. Wants a structured, exportable analysis they can show a bank or co-investor.

The page should triage explicitly with a "Built for…" section near the bottom, but the hero / thesis copy speaks to a shared truth across all three: **the cost of getting this wrong is huge, and there's a structured way to find out before you commit.**

## The emotional centre — the one truth the page lands on

**Don't make the wrong bet — catch the deal-breakers before you sign.**

Loss-aversion framing. The product exists because around half of Australian small businesses close within five years — and behind every closure is a family, a relationship, financial trauma, sometimes worse. The tool exists to prevent at least some of those closures by making the structural deal-breakers visible *before* the founder is committed.

Tone implications: serious, protective, peer-with-experience. NOT cheerful SaaS marketing. NOT "empower your business." Direct, honest, occasionally heavy. The page should feel like the friend with hospitality experience who sits across the table from you and says: "Let's actually run the numbers before you do this."

## Visual identity

**Dark theme but visually distinct from Mojo 360.** Mojo 360's signature is a burnt-orange (`#e8622a`) on deep black. Viability needs to read as a sibling, not a clone.

- **Base background:** `#080808` (deep black) — keep
- **Foreground:** `#f5f2ed` (cream) — keep
- **Primary accent:** `rgba(52, 211, 153, 1)` — a brand-green. Financial-trajectory connotation (green = upward, viable, healthy). Used for primary CTAs, key links, focal accents, hover states.
- **Reserved secondary accent (use sparingly — maybe 2–3 places on the whole page):** a muted warning amber `rgba(232, 180, 90, 0.9)` for "deal-breaker" emphasis moments. Optional — leave it out if it complicates the composition.

**Typography:**
- **Headline:** Fraunces (variable serif, Google Fonts). Heavy in display sizes for hero and section titles. Gives gravitas without being precious. Editorial.
- **Body:** DM Sans (Google Fonts). Strong neutral that pairs with Fraunces.
- **Numbers / data:** system monospace where you show a calculated figure (e.g. a sample break-even number in the hero).

**General feel:** premium-but-pragmatic, serious decision-tool, no marketing bombast. Generous whitespace. Numbers and specificity over adjectives. Hover/focus states should feel considered but not flashy.

## Page structure — Approach A (linear narrative)

Top-to-bottom sections:

1. **Hero.** Single thesis line — something in the territory of *"Before you sign the lease, model the venue."* — supported by one tight sub-line and one primary CTA ("Get Started →" routing to `/start`) and one secondary text link ("Already have an account? Sign in" routing to `/auth`). Keep it spare. The hero earns its keep through copy weight, not chrome.

2. **"What you're checking for"** — three-card row. Each card names a category of deal-breaker the tool helps catch:
   - **The money** (break-even, fitout finance, labour cost)
   - **The location** (location suitability, sales modelling)
   - **The operations** (hours, menu, labour rostering)
   Each card is short. The point is to show the page *covers the surface area*, not to explain each module.

3. **"How it works"** — three-step preview. Something like: *Sketch your concept* → *Run the modules* → *Export the case*. Optionally illustrated with a sketched flow / product preview, but text-only is fine for v1.

4. **"Built for…"** — three-card persona row. One card each for:
   - *Opening your first venue* — "Catch what you don't know you don't know."
   - *Opening another venue* — "Pressure-test the site, the format, the numbers."
   - *Evaluating a deal* — "Get a structured viability case you can take to a bank."
   Explicit triage. Visitors should recognise themselves in one of these cards.

5. **Proof block** — two sub-parts stacked or side-by-side:
   - **The market stat.** Around half of Australian small businesses close within five years. Frame as a real, sourced data point (e.g. citing ABS or IBISWorld). Pair the stat with a tight follow-on: *"The ones who model first don't always succeed — but they're far less likely to fail blind."* (Words can be tightened.)
   - **The founder story.** Short personal block (~3–4 sentences). Voice: first person, plain, no chest-beating. The substance: I built this tool because behind every business failure is a family — financial trauma, relationships, sometimes worse. If it helps even one founder make a better call, it's done its job. The page is not the place to spell that out heavy-handedly; one tight paragraph that earns the reader's attention.

6. **Final CTA + footer.** Single primary CTA repeated. Footer with links to How It Works, Reach Out, Privacy, Terms, plus a small "When you're trading, Mojo 360 takes over →" cross-link to the sibling product (subtle, not loud — viability prospects aren't ready for an ops platform yet).

## Voice and copy notes

- **Australian English everywhere.** "Modelling" not "modeling", "favourite" not "favorite", "labour" not "labor", "centre" not "center", etc.
- **No exclamation marks.** No "Empower your business." No "Unlock your potential." No "Game-changing."
- **Address the reader as "you." Avoid "we"** except in the founder story.
- **Numbers and specificity over adjectives.** *"Model 14 scenarios across rent, fitout finance, and labour cost in 30 minutes"* beats *"Powerful, flexible modelling."*
- **No testimonials yet** — the product doesn't have real ones, and fake / placeholder testimonials are a fast way to lose trust. The market stat + founder story carries the proof block.

## Header and footer

- **Header (sticky, blurred backdrop on scroll).** Logo on left: "**Mojo** Viability" — `Mojo` in the brand-green, `Viability` in cream. Centre nav: Home, How It Works, Reach Out. Right-side CTAs (auth-aware): when unauthed, "Sign In" (subtle text button) + "Get Started →" (primary green CTA). When authed, single "Open Viability →" CTA.
- **Footer (clean, restrained).** Logo and a short positioning line (one sentence). Three columns: Product (How It Works, Reach Out), Legal (Privacy, Terms), Ecosystem ("Mojo 360" cross-link). Bottom row: copyright + small "Built in Australia" or similar grounding line. Optional.

## What I'd love from you

1. **2–3 hero options** showing different ways to land the thesis line + the primary CTA composition. Different copy, different visual treatments, different ways of holding the deep-black canvas.
2. **One full landing page mockup** (the strongest of the three hero directions, extended through all six sections above). Desktop comp essential; mobile comp ideal.
3. **Notes on any decisions you made** — copy choices, layout choices, anything you'd recommend differently. I want pushback if something I've asked for is wrong.

## Constraints / things to avoid

- Don't invent product features beyond the 12 modules listed above.
- Don't write testimonial copy (no real ones exist; placeholder ones are off the table).
- Don't lean on stock hero photography of generic "happy entrepreneur shaking hands" — if photography is used at all, it should feel real and grounded (e.g. an empty café shopfront pre-fitout, an unsigned lease on a table). Illustrations are fine but should not feel like SaaS stock.
- Don't make the page longer than it needs to be. Better four tight sections than seven loose ones.
- Don't soften the loss-aversion thesis into generic optimism. The page's edge is its honesty.
