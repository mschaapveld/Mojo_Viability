# Mojo 360 — `/hub/viability` Phase 2.5 Spec

**Date:** 2026-04-29
**Phase:** 2.5 (post-extraction)
**Trigger:** Phase 2 (viability extraction) complete and merged.
**Owner repo:** `mojo_business` (the 360 app — viability lives at `mojobusiness.ai` in its own repo by then).
**Companion docs:** [`inventory.md`](./inventory.md), [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) (esp. Q2 + Q6), [`app-tsx-anatomy.md`](./app-tsx-anatomy.md), [`pre-extraction-punch-list.md`](./pre-extraction-punch-list.md).
**Read-only this session:** spec only, no code or DB changes.

---

## 0. Executive summary

Per [Q6](./Q1-Q7-Decisions.md#q6), `/hub/viability` in the rebuild is repurposed from "Phase A placeholder" → "Your Viability Assessments" — a list view inside 360 showing all `business_scenarios` rows linked to the current business. Click "Open" → opens `mojobusiness.ai/project/{id}` in a new tab (separate session per [Q1](./Q1-Q7-Decisions.md#q1)).

**Total Phase 2.5 main scope: ~5–6.5h.** Two follow-ups (auto-purge edge function + account dormancy) add another ~4–6h, but ship after the list view, not gating it.

**Critical dependency:** Phase 2 must add `business_scenarios.business_id` (nullable, references `businesses(id)`) before this spec can be implemented. That column is the linkage Q2 specified — populated when a viability lead converts to a 360 business; this list view reads off it.

---

## 1. Purpose and user story

### 1.1 — Who

A **360 business owner** who:
- Used Mojo Viability standalone before becoming a 360 customer (the conversion path), OR
- Wants to revisit a historical viability assessment for reference (e.g. "what numbers did I project for this venue when we were planning?"), OR
- Has multiple founders where one did the viability work and another is the 360 admin.

### 1.2 — What they see

Inside Mojo 360, navigating to `/hub/viability` shows a list of all viability assessments associated with this business. The list is read-mostly: open (jump out to viability standalone), archive, delete. No editing inside 360 — all editing happens at `mojobusiness.ai`.

### 1.3 — Why this matters

The viability assessment is the **historical "should I open this business" record**. Once a venue is operating in 360:
- It loses active-edit utility (the operating data in 360 is the live record).
- It retains reference value (the original projections, business plan, viability narrative).
- It survives as **historical evidence** — useful for the founder, advisors, lenders, exit valuations.

Hard-deleting it the day a customer signs up to 360 would be wrong. Keeping it accessible — but not co-mingled with operational data — is the right shape.

### 1.4 — User stories (prioritised)

1. **MUST** — As a 360 owner, I can see all viability assessments linked to my business, sorted by most recent.
2. **MUST** — As a 360 owner, I can open a viability assessment (jumps to `mojobusiness.ai/project/{id}` in a new tab).
3. **MUST** — As a 360 owner, I can archive an assessment (hide from default list).
4. **MUST** — As a 360 owner, I can permanently delete an assessment with two-step confirmation.
5. **SHOULD** — As a 360 owner, I can filter the list by status (active / archived / all).
6. **SHOULD** — As a 360 owner, I can sort by recency or name.
7. **COULD** — As a 360 owner viewing the empty state, I can "Try Mojo Viability" via an external CTA to mojobusiness.ai.
8. **WON'T (this phase)** — Edit assessment data inside 360 (always opens viability standalone).
9. **WON'T (this phase)** — Re-link a historical-but-unlinked assessment to this business (deferred — see §11).

---

## 2. Route and navigation

### 2.1 — Route

```
/hub/viability                  → <ViabilityListPage>
```

Replaces the Phase A placeholder route. The placeholder file `src/features/viability/pages/ViabilityHome.tsx` becomes `ViabilityListPage.tsx` (rename + reimplementation).

### 2.2 — Sidebar / nav treatment

`/hub/viability` already lives under the same L2/L3 location in `<HubSideNav>` as the placeholder per the rebuild's Phase A subagent 4 v2 hub shell port. No nav-tree changes needed — only the destination component changes.

Sidebar label stays "Viability" (or rename to "Viability Assessments" if Phase A's label was just "Viability"). Confirm at implementation time.

### 2.3 — Empty state

If `business_scenarios.business_id = currentBusiness.id` returns 0 rows:

```
[icon: 📋]
No viability assessments linked to {businessName} yet.

Started with Mojo Viability before joining Mojo 360?
[Try Mojo Viability →]   ← external link to mojobusiness.ai
[Link an existing assessment →]   ← deferred (see §11), can be greyed/hidden in v1
```

The "Link existing" CTA is deferred to v2 — design decision in §11. v1 ships with just the "Try Mojo Viability" external link.

---

## 3. Data sources

### 3.1 — Primary read

**Table:** `business_scenarios`

**Filter:** rows where `business_id = currentBusiness.id` (RLS already restricts to scenarios visible to the current authenticated user — no need to add `user_id` filter at the app layer).

**Sort:** `updated_at DESC` by default.

**Columns selected:**
```
id, name, created_at, updated_at, business_origin, scenario_mode,
archived_at, business_id, user_id
```

`data` jsonb column **not** fetched in the list query — only on demand if a row's preview details get richer.

### 3.2 — Secondary read (deferred to v2)

**"Your other assessments"** — scenarios the user created standalone, before linking to this business.

```sql
SELECT ... FROM business_scenarios
WHERE user_id = auth.uid()
  AND (business_id IS NULL OR business_id != currentBusiness.id)
ORDER BY updated_at DESC;
```

**Privacy concern (raised in Q6 and §11):** the user may have unrelated business ideas / draft scenarios they don't want surfaced in their 360 context (e.g. competitor analysis, side projects). Shipping this in v1 risks accidentally exposing their personal scenarios to other founders / advisors who can read business-scoped data.

**Recommendation:** v1 hides this section entirely. v2 (after privacy design) optionally adds it as a separate sub-list with explicit "Yours only — not visible to others in this business" labelling.

### 3.3 — No writes from list query

The list view only reads. Mutations are explicit (archive / delete actions, see §5).

---

## 4. List item shape

### 4.1 — Per-row fields rendered

| Field | Source | Display |
|---|---|---|
| Name | `name` column | Headline. Truncated to ~60 chars. |
| Created date | `created_at` | Subtitle, formatted relative ("3 months ago") with absolute on hover. |
| Last updated | `updated_at` | Right-aligned secondary text, same format. |
| Status badge | derived: `archived_at IS NULL ? 'active' : 'archived'` | Pill: green "Active" or grey "Archived". |
| Business origin | `business_origin` (text, nullable) | Pill: "New venue" / "Existing venue" / "Exploring" — only render if value non-null. |
| Scenario mode | `scenario_mode` (text, nullable) | Pill: "Single site" / "Multi-site" — only render if value non-null. |
| Action menu | — | Right-edge `<DropdownMenu>` with Open / Archive / Delete actions. |

### 4.2 — Sort + filter controls (top of list)

```
[Status: Active ▾]   [Sort: Recent ▾]                                  [refresh icon]
```

| Control | Default | Options |
|---|---|---|
| Status filter | Active | Active / Archived / All |
| Sort | Recent (updated_at DESC) | Recent / Oldest / Name (A–Z) |
| Refresh | — | Manual TanStack Query refetch |

Filter + sort state can live in URL search params (`?status=archived&sort=name`) so the user can deep-link / share / refresh. This also makes back-button behaviour intuitive.

### 4.3 — Pagination

Defer pagination until a single business has > 50 scenarios in the list. Most businesses will have 1–5. v1 fetches all rows for the business, paginates client-side if > 50 to avoid layout slowdown.

---

## 5. Actions per row

### 5.1 — Open (primary)

**Behaviour:** opens `https://mojobusiness.ai/project/{id}` in a new tab (`<a target="_blank" rel="noopener noreferrer">`).

**Why new tab:** per Q1, sessions are not shared between viability and 360. New tab keeps the 360 session intact and avoids "where am I?" confusion.

**Auth at the destination:** the user re-authenticates at mojobusiness.ai if their viability session is expired. Their `auth.users` row is the same (shared Supabase project), so credentials work.

**Visual:** primary button or row-click. Either works — recommend row-click (whole row clickable except the action menu) with the explicit Open in the menu as a fallback.

### 5.2 — Archive / Unarchive

**Behaviour:** writes `business_scenarios.archived_at = now()` (archive) or `archived_at = null` (unarchive). No confirmation dialog — toast-only feedback ("Archived. [Undo]").

**Mutation:** `useArchiveScenario(id)` and `useUnarchiveScenario(id)` from `features/viability/api/scenariosApi.ts`.

**RLS check:** the user must be able to UPDATE the row (the existing `business_scenarios` UPDATE policy allows owners + editor-collaborators; new policy in §7 also allows business_id-matching members).

**Toast:**
```
[✓] Archived "Mainstreet Cafe Plan A"
                                        [Undo]
```

`Undo` calls the inverse mutation. 5-second timeout.

### 5.3 — Delete

**Behaviour:** two-stage confirmation, hard-delete only.

**Stage 1 — Recommend archive instead:**
```
Modal: "Delete this assessment?"
Body:  "Deleting permanently removes this assessment and all its content uploads.
        Archiving keeps it for reference but hides it from your active list.
        Most users archive instead."
Buttons:
  [Archive instead]  ← recommended (primary style)
  [Permanent delete]  ← destructive (red, secondary style)
  [Cancel]
```

**Stage 2 — Confirm permanent delete:**
```
Modal: "Permanent delete confirmation"
Body:  "Type the assessment name below to confirm:
        '{name}'"
Input: <text field requiring exact match>
Buttons:
  [Permanent delete]  ← destructive, disabled until name matches
  [Cancel]
```

**Mutation:** `useDeleteScenario(id)` — `DELETE FROM business_scenarios WHERE id = $1`. RLS allows owner DELETE.

**Cascade:** `project_content_uploads`, `project_invites`, `collaborators` should cascade-delete via foreign key constraints. Verify the FK definitions during implementation; add `ON DELETE CASCADE` if missing.

**Storage cleanup:** `project-uploads` bucket files associated with the deleted scenario should be deleted server-side. Implementation options:
- (a) Edge function triggered by `DELETE` on `business_scenarios` — clean approach, requires deployment.
- (b) Client-side: list+delete files before issuing the DB DELETE — simpler but client must be online and not interrupted mid-delete.
- (c) Defer to nightly cleanup job (the auto-purge function in §8 can sweep orphan files).

**Recommendation: (c) defer.** v1 hard-deletes the DB row; storage cleanup happens in the nightly auto-purge sweep. Files orphaned for ~24h is acceptable for a low-traffic table.

**No soft-delete from this UI.** Per Q6, soft-delete is auto-managed downstream by the auto-purge job — manually selecting "soft-delete" is not exposed in the UI.

---

## 6. Schema additions required

Two columns added to `business_scenarios`. The first lands in **Phase 2** (per Q2 — needed for the conversion data pull). The second lands in **Phase 2.5** (this spec).

### 6.1 — Phase 2 schema add (already specified in Q2)

```sql
ALTER TABLE business_scenarios
ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE SET NULL;

CREATE INDEX idx_business_scenarios_business_id
  ON business_scenarios(business_id)
  WHERE business_id IS NOT NULL;
```

`ON DELETE SET NULL` so deleting a 360 business doesn't cascade-delete historical viability assessments — they remain accessible standalone via `mojobusiness.ai/project/{id}`.

### 6.2 — Phase 2.5 schema add

```sql
ALTER TABLE business_scenarios
ADD COLUMN archived_at timestamptz NULL;

CREATE INDEX idx_business_scenarios_business_active
  ON business_scenarios(business_id, updated_at DESC)
  WHERE archived_at IS NULL;
```

Partial index speeds the default "Active" filter query. Drop the index if telemetry shows the query is fast without it.

### 6.3 — Optional Phase 2.5 schema add (deferred decision)

```sql
ALTER TABLE business_scenarios
ADD COLUMN soft_deleted_at timestamptz NULL;
```

For the auto-purge intermediate state (archive → soft-delete → hard-delete per Q6). **Decision needed at implementation time:**

- **Option A (separate columns):** `archived_at`, `soft_deleted_at`, hard-delete = row gone. Two age-driven transitions track separately. Cleaner audit but adds a column.
- **Option B (single status enum):** `status text` column with values 'active' | 'archived' | 'soft_deleted'. Less flexible but cheaper.
- **Option C (no soft_deleted_at — delete = hard delete with audit trail):** Skip the soft-delete intermediate stage entirely. archived_at-aged rows go straight to hard delete with an entry in `audit_events`. Simpler — no recovery window, but reduces complexity. Probably acceptable for viability where assessments are append-only — the user can always rebuild from scratch in viability standalone.

**Recommendation: Option C** — skip soft-delete. Viability assessments are short artefacts, not large operational data. Hard-delete with `audit_events` row for traceability is sufficient. If a customer wants recovery, they have the archive grace period (6 or 12 months — see §8.3) to act.

---

## 7. RLS additions

### 7.1 — Existing policies on `business_scenarios` (recap from inventory §2.1)

| Policy | Cmd | Logic |
|---|---|---|
| "Users can insert own scenarios" | INSERT | `user_id = auth.uid()` |
| "Editors can update projects they collaborate on" | UPDATE | owner OR editor-collaborator |
| "Only owners can delete projects" | DELETE | owner |
| "Users can view projects they collaborate on" | SELECT | owner OR collaborator |
| "Super users can read all business scenarios" | SELECT | `super_admin` (DEAD — drop per pre-extraction punch list §2) |

### 7.2 — New policy: business members can read assessments linked to their business

```sql
CREATE POLICY "Business members can view linked assessments"
  ON business_scenarios
  FOR SELECT
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM business_memberships
      WHERE business_memberships.business_id = business_scenarios.business_id
        AND business_memberships.user_id = (SELECT auth.uid())
        AND business_memberships.is_active = true
    )
  );
```

This is **additive** — RLS policies OR. Existing user_id-based and collaborator-based access continue to work. New policy adds: business members of `business_id` can also read.

### 7.3 — New policy: business owners/admins can update and delete linked assessments

```sql
CREATE POLICY "Business owners can update linked assessments"
  ON business_scenarios
  FOR UPDATE
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM business_memberships
      WHERE business_memberships.business_id = business_scenarios.business_id
        AND business_memberships.user_id = (SELECT auth.uid())
        AND business_memberships.is_active = true
        AND business_memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Business owners can delete linked assessments"
  ON business_scenarios
  FOR DELETE
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM business_memberships
      WHERE business_memberships.business_id = business_scenarios.business_id
        AND business_memberships.user_id = (SELECT auth.uid())
        AND business_memberships.is_active = true
        AND business_memberships.role IN ('owner', 'admin')
    )
  );
```

Restricts archive/delete to owner+admin roles within the business — prevents a regular member or counter from deleting historical assessments.

### 7.4 — `project_content_uploads` policy parity

`project_content_uploads` references `business_scenarios.id` via `project_id`. Existing policies are owner+editor-collaborator-scoped. Add a parallel "business member can read uploads of linked assessments" policy:

```sql
CREATE POLICY "Business members can view uploads of linked assessments"
  ON project_content_uploads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_scenarios
      WHERE business_scenarios.id = project_content_uploads.project_id
        AND business_scenarios.business_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM business_memberships
          WHERE business_memberships.business_id = business_scenarios.business_id
            AND business_memberships.user_id = (SELECT auth.uid())
            AND business_memberships.is_active = true
        )
    )
  );
```

(SELECT only — uploads are not edited inside 360, only viewed if the user opens an upload preview.)

### 7.5 — Verification at implementation

After applying these policies, run live tests:

1. User A is a 360 owner with `business_memberships.business_id = X`. Scenario S has `business_id = X`, `user_id = OtherUser`. → A can SELECT S. ✓
2. User A is owner-role. → A can UPDATE S (archive). ✓
3. User A is owner-role. → A can DELETE S. ✓
4. User B is a manager-role (not owner/admin) for business X. → B can SELECT S, cannot UPDATE/DELETE. ✓
5. User C is not a member of business X. → C cannot SELECT S (unless they're the original `user_id` or a collaborator on S). ✓

Test cases captured in the migration file as comments + smoke-test script.

---

## 8. Auto-purge job (Phase 2.5 follow-up)

Implementation lands AFTER the list view ships, not gating it. Document captured here so the future implementer has the design.

### 8.1 — Per Q6 lifecycle

```
Active                                                                Hard-delete
  │                                                                          │
  │ user archive                                                             │
  ▼                                                                          │
Archived ─────────────── 6 or 12 months no activity ────────────────► Hard-delete
                                                                       (skipping soft-delete per §6.3 Option C recommendation)
```

If §6.3 picks Option A or B (with soft-delete intermediate), the lifecycle is:
```
Archived ── 6 or 12 months ──► Soft-deleted ── 3 months ──► Hard-deleted
```

### 8.2 — Implementation: Supabase Edge Function on cron schedule

**Function name:** `viability-auto-purge`

**Schedule:** nightly, 03:00 AEST (low-traffic). Use `pg_cron` to schedule a row in `cron.job`, OR Supabase Cron (preferred — managed). Recommend Supabase Cron.

**Logic (Option C — no soft-delete intermediate):**

```sql
-- Hard-delete archived scenarios older than the configured threshold
DELETE FROM business_scenarios
WHERE archived_at IS NOT NULL
  AND archived_at < now() - interval '<DURATION> months';

-- Audit-log each delete
INSERT INTO audit_events (...)
SELECT ...
FROM business_scenarios
WHERE archived_at IS NOT NULL
  AND archived_at < now() - interval '<DURATION> months';
```

(In practice, the audit row is written via a `BEFORE DELETE` trigger on `business_scenarios` — cleaner than an explicit insert in the function.)

**`<DURATION>` decision deferred** — captured as 6 OR 12 months. Recommend 12 months default. User can override per-row by manual unarchive at any time.

**Storage cleanup:** the function also sweeps orphaned `project-uploads` files:
```typescript
// List all paths under project-uploads/
// For each, check if business_scenarios row with matching id still exists
// If not, delete the file
```

Run-time: ~5 minutes for a small dataset, scales linearly with file count.

### 8.3 — Error handling

- DB transaction wraps each batch of deletes — partial failure rolls back the batch.
- If storage delete fails for an orphan, log to `audit_events` with severity 'warning' and continue. File becomes a real orphan; next night's run retries.
- If the function itself fails (e.g. Supabase outage), Cron retries on the next schedule. No manual intervention required.

### 8.4 — Edge function code skeleton

```typescript
// supabase/functions/viability-auto-purge/index.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const ARCHIVE_DURATION_MONTHS = 12; // ← decision needed at impl

Deno.serve(async () => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - ARCHIVE_DURATION_MONTHS);

  // 1. Audit-log + hard-delete aged archives
  const { data: deletedRows, error: deleteErr } = await supabaseAdmin
    .from('business_scenarios')
    .delete()
    .lt('archived_at', cutoff.toISOString())
    .not('archived_at', 'is', null)
    .select('id, name, business_id, user_id');

  if (deleteErr) throw deleteErr;

  // 2. Sweep orphan files in project-uploads bucket
  // ... (omitted for brevity — list bucket, check each path against
  //      business_scenarios.id, delete orphans)

  return new Response(JSON.stringify({
    deleted_count: deletedRows?.length ?? 0,
    cutoff: cutoff.toISOString(),
  }));
});
```

### 8.5 — Action

**Phase 2.5 follow-up.** Lands ~2 weeks after the list view, gated on telemetry showing the archived-scenarios pile-up is real (i.e. customers are actually using archive).

---

## 9. Account dormancy (Phase 2.5 follow-up — separate from viability)

Per Q6, account-level dormancy is a separate lifecycle from project-level. Out of scope for the list view; mentioned here so the future Phase 2.5 session knows it exists as a related follow-up.

### 9.1 — Per Q6

```
12 months no login → warning email
+60 days no login → account deactivated (login disabled, data retained)
```

### 9.2 — Implementation

Edge function on a different cron schedule (weekly is fine). Reads `auth.users.last_sign_in_at`, sends warning emails via SendGrid/Resend at the 12-month mark, sets `auth.users.banned_until = '9999-01-01'` at 14-month mark (effectively disabling login while retaining data).

Reactivation: contact support → support manually clears `banned_until`.

### 9.3 — Action

**Separate Phase 2.5 follow-up.** Not gated by viability extraction or list view. Could even ship before the list view if dormancy becomes an audit/compliance requirement first.

**Out of scope for this spec.** Captured for completeness only.

---

## 10. Effort estimate

| Sub-step | Hours (low) | Hours (high) | Notes |
|---|---:|---:|---|
| Schema migration: `archived_at` column + partial index | 0.25 | 0.5 | Single migration file. |
| List view UI: `<ViabilityListPage>` + `<ViabilityListItem>` + filter/sort controls | 2 | 3 | shadcn primitives — Card, Badge, DropdownMenu, Tabs (for filter), Select (for sort). |
| `useScenariosForBusiness()` query hook | 0.5 | 0.5 | TanStack Query, keyed by businessId + filter. |
| Archive / Unarchive / Delete mutations + dialogs | 1 | 2 | Two-stage delete confirmation is the most non-trivial bit. |
| RLS policy migration + tests | 0.5 | 0.5 | 3 policies (member-read, owner-update, owner-delete) + parity policy on `project_content_uploads`. |
| Smoke test (live, multi-user) | 0.5 | 0.5 | Test cases per §7.5. |
| **List view subtotal** | **~5h** | **~7h** | Phase 2.5 main scope |
| Auto-purge edge function + Supabase Cron job | 2 | 3 | Phase 2.5 follow-up #1 |
| Account dormancy edge function | 2 | 3 | Phase 2.5 follow-up #2 (separate from viability) |
| **Total Phase 2.5 ecosystem** | **~9h** | **~13h** | Across 3 sub-projects |

---

## 11. Open questions / decisions deferred to implementation

### Q11.1 — Archive duration: 6 vs 12 months?

Per Q6, decision deferred. Both are reasonable. Recommend **12 months default** (matches account dormancy timeline; gives users a full year to revisit).

### Q11.2 — Show "Your other assessments" (user_id-matching, business_id-null/different) in the list?

Per §3.2, recommend **hide in v1**, ship in v2 after privacy design. The privacy concern is real: a user might have unrelated business ideas that they don't want surfaced in the 360 context where other founders/admins can see them.

If shipped in v2, it goes under a clearly labelled separate section: "Yours only — not visible to others in this business" with explicit privacy copy.

### Q11.3 — Allow re-linking a standalone scenario to the current business from this page?

The "Link an existing assessment" empty-state CTA (§2.3) implies this. Three options:

- **(a) Don't ship it** — re-linking only happens at conversion moment (when a viability lead chooses "Yes, this is my new 360 business" during the conversion flow). The CTA is informational only ("Linking happens during signup — contact us if you need to link an old one").
- **(b) Ship it as a tiny dialog** — search the user's `business_scenarios` rows where `business_id IS NULL`, pick one, write `business_id = currentBusiness.id`. Couples the "re-link" decision to the 360 owner's intent.
- **(c) Defer** — empty state CTA is a "Coming soon" placeholder. Ship in v2.

**Recommendation: (a) "linking happens during conversion".** Cleanest UX. The conversion flow is where the linkage decision belongs — by the time the user is in 360's `/hub/viability`, the conversion already happened. If they have an old scenario that didn't get linked, customer support can write the `business_id` manually (low-volume edge case).

### Q11.4 — Soft-delete intermediate stage (Option A/B/C in §6.3)?

Recommend **Option C — skip soft-delete**. Viability assessments are append-only short artefacts; archive grace period is sufficient. Reduces schema complexity and operational surface.

### Q11.5 — `/hub/viability` accessible to non-owner business roles?

Members can SELECT (per RLS §7.2) — they see the list. Non-owners can't archive/delete (per §7.3). Question: should non-owners see the page at all?

**Recommendation: yes, members see read-only list.** Justification: viability assessments are reference material for the whole leadership team, not just the founder. Hiding the page from a CFO who joined as a manager would be wrong. Action menu just hides Archive/Delete options for non-owners.

### Q11.6 — Open in same tab vs new tab?

Per §5.1, recommend **new tab**. Q1 specifies separate sessions across the two apps; opening in same tab guarantees a logout/re-login flicker (or worse, a confusing "you're signed in but as a different user" race). New tab is the safe default.

If post-launch UX feedback says "opening in new tab is jarring," revisit — but starting from new tab is the lower-risk default.

---

## 12. Implementation outline (for the future Phase 2.5 session)

Logical sequence to deliver:

1. **Migration** — `archived_at` column + index + 3 RLS policies + content-uploads parity policy. Apply to live, verify advisor pass.
2. **`features/viability/api/scenariosApi.ts`** — `fetchScenariosForBusiness`, `archiveScenario`, `unarchiveScenario`, `deleteScenario`. Pure Supabase calls.
3. **`features/viability/hooks/useScenariosForBusiness.ts`** — TanStack Query wrapper. Keyed on `[businessId, status, sort]`.
4. **`features/viability/hooks/useArchiveScenario.ts`, `useDeleteScenario.ts`** — mutation hooks with optimistic updates + toasts.
5. **`features/viability/components/ScenarioListItem.tsx`** — single row component.
6. **`features/viability/components/DeleteScenarioDialog.tsx`** — two-stage confirmation.
7. **`features/viability/pages/ViabilityListPage.tsx`** — full page composition. Replace `ViabilityHome.tsx` placeholder.
8. **`features/viability/routes.tsx`** — single `/` route → `<ViabilityListPage>`.
9. **Smoke tests** (live):
   - Multi-membership user A: navigates to `/hub/viability` for business X, sees only X's linked scenarios.
   - Switch to business Y (via `<HubHeader>` switcher), list refetches with Y's scenarios.
   - Archive a scenario, list refreshes, scenario disappears from Active filter.
   - Switch to "Archived" filter, scenario appears.
   - Delete via two-stage confirmation, scenario disappears entirely.
   - Open opens `mojobusiness.ai/project/{id}` in a new tab, lands on viability project page (auth challenge if expired).
10. **Empty state smoke** — sign in as a brand-new business with no linked scenarios, see the empty state with "Try Mojo Viability" CTA.

---

## 13. Phase 2.5 hand-off checklist

Before the future Phase 2.5 session starts:

- [ ] Phase 2 complete and merged (viability extracted, mojobusiness.ai live).
- [ ] `business_scenarios.business_id` column populated for at least one test case (e.g. one viability lead converted to 360).
- [ ] `mojobusiness.ai/project/{id}` URL pattern confirmed live (not behind auth wall, or auth wall handles new-tab landing gracefully).
- [ ] Q11 decisions made (especially Q11.1 archive duration, Q11.4 soft-delete option).
- [ ] `audit_events` table accepts `delete` events (verify schema includes the action types we'll write).

---

## Stand-down

Spec captured. No code or DB changes performed. The future Phase 2.5 session has a 5–7h main scope (list view + RLS + smoke) plus two ~2–3h follow-ups (auto-purge, account dormancy) to schedule independently.

End of pre-Phase-2 de-risking documentation. Three docs now sit alongside `inventory.md` and `Q1-Q7-Decisions.md`:

- [`app-tsx-anatomy.md`](./app-tsx-anatomy.md) — the App.tsx rewrite map
- [`pre-extraction-punch-list.md`](./pre-extraction-punch-list.md) — pre-extraction cleanups
- [`phase-2.5-hub-viability-spec.md`](./phase-2.5-hub-viability-spec.md) — this document

Ready for: Phase 2 plan (after rebuild merges), Q2 conversion mapping (after Phase 2.5 spec settled).
