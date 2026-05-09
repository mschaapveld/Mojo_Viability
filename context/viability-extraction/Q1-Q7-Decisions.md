# Mojo Viability Extraction — Q1–Q7 Decisions

**Date:** 2026-04-29
**Status:** Decisions locked. Phase 2 extraction scheduled post-merge (after Sun 2026-05-03 cutover).
**Companion doc:** [`inventory.md`](./inventory.md) — read first for context.

---

## Q1 — Session sharing strategy

**Decision:** Separate sessions, same Supabase auth credentials.

Both apps point at the same Supabase `auth.users` table. A user with email `x@y.com` logs into either app with the same password. Cookies are not shared — the user re-enters credentials when crossing apps.

**Implementation note:** When a viability lead converts to a 360 business, the 360 side shows a "Welcome to Mojo 360 (from Viability)" page after first login. Page can pre-populate the 360 business creation form with viability data (see Q2).

---

## Q2 — Viability project ↔ 360 business linkage

**Decision:** Linked. Viability project survives conversion as the historical record; 360 business becomes the live operating record.

Schema change for Phase 2: add nullable `business_id uuid references businesses(id)` to `business_scenarios`. Populated when the viability lead converts to a 360 business.

**Conversion data pull:** On conversion, 360 reads from `business_scenarios.data` jsonb and seeds the corresponding 360 tables — menu items, hours of operation, budget assumptions, venue/address details. One-time pull. Viability scenario is not modified after conversion (it's the historical record).

---

## Q3 — `mojoFitScore` and `buildLead` ownership

**Decision:** Single Mojo Suite admin backend, owned in 360.

Overrides the inventory's recommendation to duplicate. Rationale: Mojo employees should have one admin surface across all products; 360 is that surface. Viability writes raw `business_scenarios` rows; 360's `MojoAdminPanel` reads them and computes lead scores.

**Implication for extraction:** `lib/admin/buildLead.ts` and `lib/calculations/mojoFitScore.ts` do **not** ship to the viability repo. They stay in mojo_business and read viability's tables directly (same Supabase project).

**Phase 2 confirmation needed:** verify `business_scenarios.data` jsonb captures everything `buildLead` currently reads. Likely yes, but confirm before extraction so 360's admin surface stays functional.

---

## Q4 — `lib/types/projectTypes.ts` ownership

**Decision:** Move to viability repo.

Mirror image of Q3: types travel with the data producer.

**Implication:** 360's `MojoAdminPanel` (per Q3) needs `ProjectData` to read `business_scenarios.data` jsonb. Solution: 360 maintains a stripped read-only types file (~50–80 LOC, just `ProjectData` + `BusinessOrigin`) for admin consumption only. Drift risk acceptable — 360 only consumes a stable subset.

---

## Q5 — Repo bootstrap shape

**Decision:** Fresh Vite scaffold. No clone-and-strip.

Gives a clean shot at proper React Router from day 1. The current App.tsx tab-state architecture is the single biggest pain point in the legacy code; fresh scaffold avoids reproducing it.

Stack: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Supabase. Same as mojo_business. Deployed to Vercel at `mojobusiness.ai`.

---

## Q6 — Project lifecycle and account dormancy

**Decision:** Two separate lifecycles — project-level archive/delete, and account-level dormancy.

### Project lifecycle (user-initiated)
- **Active** — default state, visible in user's project list.
- **Archived** — user-archived. Hidden from default list, visible under "Archived" filter. Accessible from both viability standalone and (if linked to 360 business) from 360's `/hub/viability` slot.
- **Soft-deleted** — automatic after archive duration. Hidden everywhere. Recoverable by support.
- **Hard-deleted** — automatic after soft-delete duration. Permanent.

**Durations to confirm in Phase 2.5 scoping:** archive → soft-delete = 6 or 12 months (TBD); soft-delete → hard-delete = 3 months.

### Account dormancy (auto-managed)
- 12 months no login → warning email sent
- +60 days no login → account deactivated (login disabled, data retained)
- Reactivation: contact support

**"Deactivated" means login disabled, data retained.** Hard-delete of dormant account data is deferred until storage costs justify it.

### `/hub/viability` slot in 360
Repurposed: not a placeholder, not a redirect — it's a "Your Viability Assessments" list view showing all `business_scenarios` rows linked to the current `business_id`. Each row shows name, created date, status (active/archived), and open/archive/delete actions. "Open" launches viability in a new tab at `mojobusiness.ai/project/{id}`.

**Build: Phase 2.5 (~half day post-extraction).** Not in Phase 2 scope.

### REBUILD_DEFERRED.md
The viability strangler-defer entry is **obsolete**. Extraction supersedes re-attempt. See FILE 2 update.

---

## Q7 — Hospo OS waitlist on viability landing

**Decision:** Keep.

mojobusiness.ai becomes the cross-product marketing surface for the Mojo ecosystem. Stripping Hospo OS lead capture from a high-traffic landing page costs more than the brand-clarity benefit.

---

## Phase 2 prerequisites (recap from inventory §9)

1. Foundation rebuild merged (post Sun 2026-05-03 cutover) ✅ blocking
2. Q1–Q7 answered ✅ this document
3. `html2canvas` import resolution verified in current production
4. Vercel project + DNS plan for `mojobusiness.ai` (currently serves mojo_business app — cutover plan needed)
5. Supabase keys decision — both repos share `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, or separate viability-named anon key for cleaner audit logs

Items 3–5 to be settled at Phase 2 kickoff, not now.

---

## Decisions captured by

Max Schaapveld, in chat with Claude (strategic advisor session), 2026-04-29 evening. Phase 1 inventory orchestrator: separate Claude Code session, same evening. Phase 2 extraction: scheduled post-merge.
