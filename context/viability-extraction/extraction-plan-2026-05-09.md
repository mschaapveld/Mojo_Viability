# Mojo Viability Extraction — Reconciled Executable Plan

**Date:** 2026-05-09 (the day after foundation rebuild cutover)
**Author:** Mojo Business Claude Code session, post-cutover
**Purpose:** Reconcile the 6 existing planning docs in this directory against post-rebuild reality. The plans were written 2026-04-29 to 2026-05-02, before Phase C-light deletion (Wed 2026-05-08) and before cutover (Thu 2026-05-09). This doc captures the structural change (V-ONLY surface deleted, recoverable via `pre-phase-c-deletion` git tag) and the adjusted execution sequence.
**Read this doc AFTER reading the 6 prior docs in [`context/viability-extraction/`](.).** This is a delta + sequencing doc, not a replacement.

---

## 0. Context-setting

The 6 planning docs in this directory are comprehensive and mostly current:

1. [`Q1-Q7-Decisions.md`](./Q1-Q7-Decisions.md) — architectural decisions, locked
2. [`inventory.md`](./inventory.md) — file-by-file V-ONLY surface (~30 files)
3. [`app-tsx-anatomy.md`](./app-tsx-anatomy.md) — App.tsx → Router rewrite map
4. [`pre-extraction-punch-list.md`](./pre-extraction-punch-list.md) — pre-Phase-2 cleanups
5. [`phase-2-implementation-plan.md`](./phase-2-implementation-plan.md) — 12-step extraction plan
6. [`phase-2.5-hub-viability-spec.md`](./phase-2.5-hub-viability-spec.md) — what 360 builds after Phase 2

They were written assuming the V-ONLY surface would still be in `mojo_business/src/` at extraction time. **It isn't.** Phase C-light (commits `1e1f3d2` and `ab349ed`, 2026-05-08) deleted the entire V-ONLY UI surface plus `App.tsx`. The math layer (`src/lib/calculations/`) and the Q3 keepers (`mojoFitScore.ts`, `buildLead.ts`, `projectTypes.ts`) survived. The `pre-phase-c-deletion` git tag at commit `2fc45f7` (pushed to origin 2026-05-08) is the recovery anchor for everything else.

That's the only structural change. Everything else in the prior plans still holds.

---

## 1. What's still valid (use as-is)

| Doc | Verdict | Notes |
|---|---|---|
| `Q1-Q7-Decisions.md` | **Fully valid** | All 7 decisions still apply. Q3 keepers (`mojoFitScore.ts`, `buildLead.ts`, `projectTypes.ts`) all survived Phase C-light — verified post-cutover. |
| `inventory.md` | **Valid file inventory** | The ~30-file V-ONLY list is correct. LOC counts still good. Note its "5 LandingPages" entry: the 2 truly orphaned ones (`landing/LandingPage.tsx`, `landing/LandingPage2.tsx`) are deleted; the active `LandingPage.tsx` (root, 1393 LOC viability landing) and `LandingPage1.tsx` (621 LOC, currently in working tree as it's used by Step 15D's `MarketingHome` wrapper) are the ones that ship to viability. |
| `app-tsx-anatomy.md` | **Reference doc, still valid** | App.tsx itself is gone, but the anatomy captures the *shapes* — state slices, handlers, fan-in branches, cross-section sync logic, risk register. Use as the "what to author" reference when re-implementing in the new repo. Recoverable as text from `pre-phase-c-deletion` if needed for byte-level reference. |
| `phase-2-implementation-plan.md` | **Step structure valid; source paths need swap** | All 12 steps still apply. Only changes: source paths point at `pre-phase-c-deletion` tag, not working tree. Step 12 (mojo_business cleanup) is now ~80% already done by Phase C-light. |
| `phase-2.5-hub-viability-spec.md` | **Fully valid** | Phase 2.5 builds the `/hub/viability` list view in mojo_business after Phase 2 ships. Unaffected by Phase C-light. |
| `pre-extraction-punch-list.md` | **All 4 orphan deletes already done** | Phase C-light deleted `landing/LandingPage.tsx`, `landing/LandingPage2.tsx`, `eventUplift.ts`, and `ChangelogView.tsx` — by accident, but the net effect is the pre-extraction cleanup is complete. The `html2canvas` explicit-add advice for the new repo's `package.json` still applies. |

---

## 2. What changed — reconciliation summary

### 2.1 — File source path: working tree → git tag

Before Phase C-light, Step 4 of Phase 2 read "move 21 files from `mojo_business/src/components/modules/`." Now it reads "recover 19 files from the `pre-phase-c-deletion` tag" (2 orphans were dropped, 19 V-ONLY remain — `SimpleBreakEven`, `DetailedBreakEven`, the 4 FitoutFinancing files, `HoursOfOperation`, `VenueOpeningHours`, `SalesBreakup`, `MenuBuilder`, `LabourCosting`, `LinkParsingSection`, `LocationSuitability`, `SalesPredictions`, `BusinessPlanning`, `AIBusinessPlanBuilder`, `BusinessPlanBuilder`, `ScenarioColumn`, `ScenarioSelectionDialog`).

Same source-swap for the shell + dialogs (Step 5), the landing pages (Step 6), and most of `lib/` (Step 3). The math layer is exempt — it's still in mojo_business working tree.

### 2.2 — Step 12 (mojo_business cleanup) is mostly already done

Phase C-light did the bulk of the cleanup work as a side effect. What's left to do at the end of Phase 2:

- **Strip `projectTypes.ts`** from 551 LOC → ~80 LOC. Keep only `ProjectData` + `BusinessOrigin` types for any remaining admin reads (per Q4).
- **Decide `mojoFitScore.ts` + `buildLead.ts` fate.** Q3 said keep them in mojo_business so the (eventual rebuilt) admin lead surface can read viability scenarios. Phase 1 commercial sprint will rebuild admin proper and consume these files. Recommend **keep until Phase 1 admin rebuild starts; revisit then**.
- **Drop `html2canvas`** — transitive dep, will go via `npm prune` after the export pipeline ports out.
- **Wire `/hub/viability` placeholder** to a "see your assessments at mojobusiness.ai" interim card. Phase 2.5 replaces this with the real list view.

This is ~30 minutes of work, not the 2–3h the original plan estimated.

### 2.3 — The "MojoAdminPanel admin lead surface" referenced in Q3 doesn't currently exist

Phase C-light deleted `MojoAdminPanel.tsx`. Wednesday's `/admin` waitlist bridge ([`src/features/admin/pages/AdminWaitlistPage.tsx`](../../src/features/admin/pages/AdminWaitlistPage.tsx)) is the only fragment surviving. The proper admin rebuild is scheduled for Phase 1 commercial sprint per [`REBUILD_DEFERRED.md`](../REBUILD_DEFERRED.md) Wednesday entry §E. When that rebuild happens, the lead viewer becomes part of it and reads from viability's tables (same Supabase project, per Q1). This doesn't block extraction — viability extracts → mojobusiness.ai serves it → 360's admin surface gets rebuilt later including the lead viewer.

### 2.4 — The rebuild's architecture is the new target shape, not the legacy

Anatomy's `<ProjectLayout>` + 12 nested routes + React Query + AuthProvider is exactly the rebuild's pattern. New repo gets:
- The rebuild's `src/shared/components/ui/` shadcn primitives (still in working tree, copy from there)
- The rebuild's AuthProvider shape (`src/app/providers/AuthProvider.tsx` — still in working tree, copy from there with `is_advisor`/`isMojoEmployee` stripped per anatomy §2.3)
- The rebuild's feature-folder convention (`src/features/{feature}/{api,components,hooks,pages,routes.tsx}`)
- The rebuild's Tailwind theme tokens
- The rebuild's `src/lib/supabase.ts` shape

---

## 3. Cross-repo file recovery — recommended pattern

Don't `git show` files one-by-one. Clone mojo_business at the tag into a temp directory once, then `cp` from there into the new repo as each step needs files. One-time setup, atomic, no per-file git gymnastics.

```bash
# In ~/Documents/GitHub/Mojo_Viability (the new repo, after bootstrap):
git clone -b pre-phase-c-deletion --depth 1 \
  https://github.com/mschaapveld/mojo_business.git /tmp/mojo-pre-phase-c
# Now /tmp/mojo-pre-phase-c has the full mojo_business state at the tag.
# cp <files> from there into the new repo's structure during each step.
```

The `--depth 1` is fine because we only need the snapshot at the tag, not history.

For files that survived Phase C-light and live in the rebuild's current working tree (math layer, AuthProvider, shadcn primitives, supabase client, theme): copy from the live mojo_business repo, NOT from the tag. The tag captures pre-rebuild state; the live repo captures the rebuild's improved architecture.

---

## 4. Adjusted Phase 2 step sequence

The 12-step plan in [`phase-2-implementation-plan.md`](./phase-2-implementation-plan.md) stands. Three step-level adjustments:

| Step | Original | Adjusted |
|---|---|---|
| 0. **Pre-flight** | Delete 4 orphans in mojo_business. | **Skip** — already done by Phase C-light. Verify Q3 keepers in mojo_business: `mojoFitScore.ts`, `buildLead.ts`, `projectTypes.ts` — all confirmed present. |
| 1. **Bootstrap** | Copy primitives + AuthProvider from mojo_business `src/`. | Copy from current mojo_business `src/shared/`/`src/app/`, **NOT** from the tag. The rebuild's architecture is the target shape. |
| 2–8. **File ports** | Source path: mojo_business working tree. | Source path: `/tmp/mojo-pre-phase-c/<old-path>` (the cloned tag). Target paths in the plan are correct. |
| 9. **App.tsx → Router** | Reference: anatomy doc. | Reference: anatomy doc + the rebuild's `src/app/routes.tsx` shape. Anatomy says "what state to handle"; rebuild says "how to structure providers + router". |
| 10. **DB migrations** | Unchanged. | Unchanged. |
| 11. **Smoke** | Unchanged. | Unchanged. |
| 12. **mojo_business cleanup** | Delete 51 V-ONLY files. | **Mostly already done.** Remaining: strip `projectTypes.ts`, keep `mojoFitScore.ts`/`buildLead.ts` for admin rebuild, wire `/hub/viability` placeholder, drop `html2canvas` if it lingers. ~30 min. |

Total estimated time after these adjustments: **~25–32h** (down from 27–37h, mostly because Step 12 is largely done).

---

## 5. Two-session dispatch sequence

### Session 1 — `mojo_business` (this one)

Stays open. Used for:
- Producing the bootstrap dispatch for Session 2 (next thing to draft)
- Cleaning up `mojo_business` post-extraction (Step 12 residual)
- Phase 2.5 implementation later (the `/hub/viability` list view in 360)
- Any post-cutover housekeeping

### Session 2 — `Mojo_Viability` (new)

Starts after the new repo is cloned locally and a Claude Code session is opened rooted there:

```bash
git clone https://github.com/mschaapveld/Mojo_Viability.git ~/Documents/GitHub/Mojo_Viability
cd ~/Documents/GitHub/Mojo_Viability
# open new Claude Code session rooted here
```

**Important:** Claude Code sandboxes by working directory. Session 1 cannot access `~/Documents/GitHub/Mojo_Viability/` and Session 2 cannot access `~/Documents/GitHub/mojo_business/`. Cross-session communication is via Max copying dispatches between sessions.

First dispatch in Session 2 is the **bootstrap**, drafted from Session 1 and copied across by Max. After bootstrap, Session 2 owns Steps 2–11. Session 1 picks up Step 12 in a much smaller form.

---

## 6. Bootstrap dispatch shape (what Session 1 will draft for Session 2)

The bootstrap brief should:

1. **Scaffold:** `npm create vite@latest . -- --template react-ts`
2. **Install curated deps** from [`phase-2-implementation-plan.md` §3.1.1](./phase-2-implementation-plan.md) — explicit `html2canvas` from day 1.
3. **Copy from mojo_business working tree** (NOT the tag) via the `/tmp/mojo-pre-phase-c` clone or directly from the live repo:
   - `src/shared/components/ui/` → `src/components/ui/`
   - `tailwind.config.js`, `postcss.config.js`, `src/index.css` (adapted)
   - `src/lib/supabase.ts` → `src/lib/supabase.ts` (env var unchanged)
   - `src/app/providers/AuthProvider.tsx` → `src/providers/AuthProvider.tsx` (strip `is_advisor`/`isMojoEmployee` per anatomy §2.3)
   - `src/app/providers/QueryProvider.tsx`, `ThemeProvider.tsx`, `ToastProvider.tsx`
   - `src/lib/theme.tsx` (if separate from ThemeProvider)
4. **Copy planning docs:**
   - `context/viability-extraction/` (all 6 docs + this reconciliation plan) → new repo's `context/viability-extraction/`
5. **Author `PROJECT_BRIEF.md`** for the new repo (~1 page — what is Mojo Viability, the docs index, dispatch entry rule "read the 6 viability-extraction docs in order").
6. **Author `CLAUDE.md`** for the new repo (~1 page — same shape as mojo_business's, viability-flavoured).
7. **Wire `.env.local`** with the same `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` as mojo_business (Q1 confirmed: same Supabase project).
8. **Build a "Hello user" page**, prove auth chain works.
9. **Vercel project linkage** is already done. Verify a deploy from `main` reaches the Vercel project at https://vercel.com/mschaapvelds-projects/mojo-viability; defer DNS to mojobusiness.ai until smoke passes locally.
10. **Acceptance:** `npm run typecheck` clean, `npm run build` clean, `npm run dev` shows "Hello, {email}" or "Not signed in".

Estimated bootstrap time: 2–3h.

---

## 7. Open items at hour zero

These need confirmation before Phase 2 execution begins (per `phase-2-implementation-plan.md` §1.2):

- [ ] **DNS plan for mojobusiness.ai.** Currently serves the mojo_business app. Cutover plan: viability deploys to mojobusiness.ai, mojo_business moves to a subdomain (e.g. `app.mojobusiness.ai`), OR the new repo deploys to a different domain (e.g. `viability.mojobusiness.ai`). Decision affects Vercel project domain config.
- [ ] **Supabase keys decision.** Same anon key for both repos (functional default), or separate viability-named anon key (cleaner audit log). Recommend same — no functional difference for v1.
- [ ] **`html2canvas` explicit add** — handled by the new repo's initial `package.json` per pre-extraction punch list §4.

---

## 8. Recommended next action

After this plan is committed and pushed:

1. **Stop here in Session 1.** Cutover happened today, this is a long stretch.
2. **Pick up tomorrow** with a fresh Session 1 chat referencing this plan.
3. **Tomorrow's first action in Session 1:** draft the bootstrap dispatch for Session 2 (per §6 above).
4. **Tomorrow's first action in Session 2** (after Max copies the bootstrap dispatch in): execute Step 1 bootstrap.
5. **Session 2 then owns Steps 2–11.** Session 1 stays open for Step 12 cleanup, Phase 2.5 work, and post-cutover housekeeping.

---

## 9. Stand-down

Reconciliation plan complete. Six prior docs + this one = comprehensive reference for the extraction. Phase 2 execution can begin once Max greenlights and the bootstrap dispatch is drafted.

Cross-references:
- Recovery anchor: `pre-phase-c-deletion` tag at commit `2fc45f7` on origin
- Mojo 360 audit findings (post-cutover housekeeping items relevant to Step 12): [`handover/wednesday-pm-stop.md`](../../handover/wednesday-pm-stop.md) audit recon scope + [`REBUILD_DEFERRED.md`](../REBUILD_DEFERRED.md) Wednesday entry
