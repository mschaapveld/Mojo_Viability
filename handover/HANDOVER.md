# Mojo Viability Handover — 2026-05-09

## Session Summary

Step 1 of the 12-step viability extraction plan. Bootstrapped a fresh Vite + React 18 + TS + Tailwind + shadcn + Supabase repo with all 4 providers ported (auth-stripped to viability owner-only), planning docs imported, and a "Hello user" smoke page proving the auth chain end-to-end. First commit pushed; Vercel auto-deployed; mojobusiness.ai is already live serving the new repo (DNS was cut over before this session — bonus discovery).

## Completed

**Scaffolding**
- Vite + React 18 + TS scaffold (downgraded from create-vite v9's React 19 / TS 6 default to React 18.3.1 / TS 5.6.2 / Vite 5.4 to align with mojo_business)
- Tailwind + PostCSS + index.css copied from mojo_business; content paths trimmed to `./index.html` + `./src/**/*.{ts,tsx}`
- Path alias `@/* → src/*` wired in tsconfig.app.json (`paths` only — `baseUrl` dropped, deprecated in TS 7+) and vite.config.ts (`path.resolve(__dirname, './src')`)
- TS-5.8-only flags (`erasableSyntaxOnly`, `verbatimModuleSyntax`) trimmed from the Vite scaffold's tsconfigs to work with pinned TS 5.6.2
- `src/vite-env.d.ts` added (create-vite v9 omits it)

**Primitives + providers**
- 28 shadcn primitives copied to `src/components/ui/` (3 inter-primitive imports rewritten from `@/shared/components/ui/*` → `@/components/ui/*`)
- `src/lib/utils.ts` (`cn` helper) + `src/hooks/use-toast.ts` shipped
- All 4 providers ported to `src/providers/`:
  - `AuthProvider.tsx` — viability-flavoured, exposes only `{ user, isLoading, signIn, signUp, signOut }`. Stripped `isSuperUser`, `signInWithProvider`, `@/shared/lib/auth` dependency (inlined), `is_super_user` RPC, `OrgProvider` integration — per [`app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) §2.3.
  - `QueryProvider.tsx`, `ThemeProvider.tsx`, `ToastProvider.tsx` — verbatim from mojo_business.
- `src/lib/supabase.ts` viability-flavoured: `storageKey: 'mojo-viability-auth'`, dropped `mark_business_memberships_accepted` RPC, `w360()` helper, `BusinessProject`/`UserProfile` types, `checkIsAdmin()`. Added `if (import.meta.env.DEV) window.supabase = supabase` as a dev-only smoke aid.

**App + smoke page**
- `src/App.tsx` rewritten as `Query → Theme → Toast → Auth → HelloUser` provider tree (mirroring mojo_business AppShell order minus Org/Onboarding)
- `<HelloUser>` renders "Mojo Viability — Not signed in" when unauthed and "Hello, {email}" + Sign Out button when authed
- Vite scaffold's unused artefacts (`App.css`, `assets/`) deleted

**Docs**
- 7 viability-extraction planning docs copied to `context/viability-extraction/`
- `PROJECT_BRIEF.md` authored at repo root
- `CLAUDE.md` authored at repo root, then patched mid-session-end with three load-bearing sections (Session Start Checklist, End of Session — Handover with full template + proactive trigger, Session Trigger) per a follow-up dispatch — this handover is the first entry in the chain that protocol seeds.

**Env**
- `.env.example` committed with placeholder keys + comment about the shared mojo_business Supabase project
- `.env.local` placeholder file created; Max populated locally during Task 13 smoke
- `.gitignore` updated to ignore `*.tsbuildinfo` and `.playwright-mcp/`

**Smoke verification**
- `npm run typecheck`: clean
- `npm run build`: clean — 141 modules, 440 KB JS / 39 KB CSS, ~796ms
- `npm run dev`: localhost:5173 renders "Mojo Viability — Not signed in"
- Browser console sign-in (`await supabase.auth.signInWithPassword({...})`) succeeded; page rendered "Hello, admin@maxsenterprises.com.au"
- Sign-out: returned to "Not signed in"
- Production smoke at https://www.mojobusiness.ai/: page renders cleanly, zero console errors. Vercel project env vars confirmed working (Supabase client instantiated correctly).

**Decisions baked in**
- DNS: mojobusiness.ai serves viability (already cut over before this session began — bonus discovery via Vercel project domains)
- Supabase: same project + same anon key as mojo_business (project ID `zaxzzvluytxtbsjxlzkg`) per Q1
- html2canvas: explicit dependency in `package.json` from day 1 per pre-extraction-punch-list §4

**Commit + push**
- Bootstrap commit: `2950ee62c545951233a68f2e4aeab624063f9e6c` on `main`
- Pushed to `origin/main` (`ea4d527..2950ee6`)
- Vercel auto-deployment `dpl_Xnknh3T5rc1tqmyP1jiViSnBG6Hg` — state READY, target production
- (A second commit covering this CLAUDE.md patch + this handover seed lands in the wrap-up's Task 3.)

## In Progress

None — Step 1 is complete.

## Blockers

None blocking Step 2.

**Action items for Max outside this session:**
- **Rotate the password for `admin@maxsenterprises.com.au` in Supabase.** The plaintext was pasted into chat during the Task 13 smoke debug and is now in conversation logs/telemetry. Treat as compromised. Supabase Dashboard → Auth → Users → admin@maxsenterprises.com.au → reset/update password.
- (Optional) Eyeball the Vercel project env vars at https://vercel.com/mschaapvelds-projects/mojo-viability/settings/environment-variables — production smoke confirms they're set, but worth a quick visual check.

## Next Session

**Step 2 — Move calculation engines.** Per [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) §3 Step 2. Estimated 1h. Recommend Monday 2026-05-11 or later — Sunday 2026-05-10 is Mother's Day per Max's call.

Pure file copying from mojo_business's `pre-phase-c-deletion` git tag (commit `2fc45f7`) into `src/lib/calculations/`. 14 files (15 minus `eventUplift.ts` confirmed orphan per [`pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) §1).

**Caveats for the next session:**
- `npm run typecheck` is **expected to fail** at the end of Step 2 — the calc engines depend on `@/lib/types/projectTypes`, `@/lib/timeUtils`, `@/lib/addressUtils`, `@/lib/format`, `@/lib/htmlEscape` which only land in Step 3. This is acceptable WIP per the plan.
- `dataSourceSelector.ts` and `orderSourceFees.ts` are NOT orphans (per pre-extraction-punch-list §1's correction to inventory.md) — both are sibling-imported by `projectSummary.ts`. Ship them.
- `eventUplift.ts` IS the confirmed orphan — drop it during the copy.
- Source-path setup: re-clone the tag with `git clone --depth 1 -b pre-phase-c-deletion https://github.com/mschaapveld/mojo_business.git /tmp/mojo-pre-phase-c`. Re-establish if `/tmp` has been cleared.
- The `/tmp/mojo-business-current/` clone (current main) used during bootstrap is also useful for cross-reference (`git clone --depth 1 https://github.com/mschaapveld/mojo_business.git /tmp/mojo-business-current`).
- Step 2 needs its own structured dispatch from Max's Claude.ai strategic-advisor session — same shape as the Step 1 brief that opened today's session.

## Key References

**Planning docs (read in order at session start):**
- [`context/viability-extraction/extraction-plan-2026-05-09.md`](../context/viability-extraction/extraction-plan-2026-05-09.md) — reconciliation plan, read first
- [`context/viability-extraction/phase-2-implementation-plan.md`](../context/viability-extraction/phase-2-implementation-plan.md) — the 12-step plan (Step 2 spec at §3 Step 2)
- [`context/viability-extraction/Q1-Q7-Decisions.md`](../context/viability-extraction/Q1-Q7-Decisions.md) — locked architectural decisions
- [`context/viability-extraction/inventory.md`](../context/viability-extraction/inventory.md) — V-ONLY file inventory (calc engines at §1.2)
- [`context/viability-extraction/app-tsx-anatomy.md`](../context/viability-extraction/app-tsx-anatomy.md) — App.tsx → Router map (referenced from Step 9)
- [`context/viability-extraction/pre-extraction-punch-list.md`](../context/viability-extraction/pre-extraction-punch-list.md) — orphan corrections + html2canvas + RLS dead branch
- [`context/viability-extraction/phase-2.5-hub-viability-spec.md`](../context/viability-extraction/phase-2.5-hub-viability-spec.md) — what mojo_business builds after Phase 2 (informational)

**Repo state:**
- Bootstrap commit: `2950ee62c545951233a68f2e4aeab624063f9e6c` on `main`
- Vercel project ID: `prj_l2qLAIv0NYO2AhjRCOk5edndAR8s` (team `team_XyuNnBgnoA27Ap6tDVtMaASP`, slug `mschaapvelds-projects`)
- Supabase project ID (shared with mojo_business): `zaxzzvluytxtbsjxlzkg`
- mojo_business `pre-phase-c-deletion` git tag: commit `2fc45f7` on origin — recovery anchor for Steps 2–11

**Auth surface:**
- `<AuthProvider>` exposes only `{ user, isLoading, signIn, signUp, signOut }` (deliberately minimal; expand only if a future step needs more)
- Supabase client localStorage namespace: `mojo-viability-auth` (separate from mojo_business's `mojobusiness-auth`)
- Dev-only debug aid: `window.supabase` exposed in dev mode for console smoke; intentionally NOT exposed in production builds
