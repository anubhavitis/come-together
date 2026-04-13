# Codebase Concerns

**Analysis Date:** 2026-04-10

---

## Missing Implementations (Stub Routes)

**Phase 2 form — empty stub:**
- Issue: `phase2.tsx` renders only a heading and a placeholder paragraph. No instruments, no auto-save, no complete button.
- Files: `src/routes/journey/$id/phase2.tsx`
- Impact: Phase 2 (MEQ-30, EDI, EBI, Raw Impressions, Challenging) is entirely non-functional. The core data instruments are missing.
- Fix approach: Implement following the pattern in `src/routes/journey/$id/phase1.tsx`, wiring `usePhase2` / `useUpsertPhase2` from `src/hooks/use-phase2.ts`.

**Phase 3 new entry form — empty stub:**
- Issue: `phase3.new.tsx` renders a heading and placeholder only. No label prompt, no instruments, no create-then-redirect logic.
- Files: `src/routes/journey/$id/phase3.new.tsx`
- Impact: Users cannot create integration check-ins despite the UI showing a "New Check-in" button.
- Fix approach: Implement using `useCreatePhase3Entry` (creates the entry) then redirect to the edit route, following Phase 1 pattern.

**Phase 3 entry edit form — empty stub:**
- Issue: `phase3.$entryId.tsx` renders only a heading and the raw `entryId` param.
- Files: `src/routes/journey/$id/phase3.$entryId.tsx`
- Impact: Existing Phase 3 entries cannot be viewed or edited.
- Fix approach: Wire `usePhase3Entry` + `useUpsertPhase3Entry`, render SWEMWBS, inner landscape, integration scales, open reflection sections.

**Compare view — empty stub:**
- Issue: `compare.tsx` renders only a heading and subtitle. No charts, no scoring, no comparison data.
- Files: `src/routes/journey/$id/compare.tsx`
- Impact: The stated core value proposition of the app ("before/after comparison view") is entirely absent.
- Fix approach: Load `useJourney`, compute SWEMWBS deltas, inner landscape deltas, call scoring functions (currently missing — see below), render Recharts radar/bar charts. Recharts is already installed.

---

## Missing Data Files and Scoring Logic

**Instrument data files not created:**
- Issue: `plan.md` specifies `src/data/meq30Items.ts`, `src/data/ediItems.ts`, `src/data/ebiItems.ts`, `src/data/integrationItems.ts`. Only `src/data/swemwbs-items.ts` exists.
- Files: `src/data/` directory
- Impact: Phase 2 form cannot render MEQ-30 (30 items), EDI (8 items), EBI (6 items), or integration scales without item definitions. The instrument components referenced in `plan.md` do not exist either.
- Fix approach: Create item arrays with validated text from the original research instruments.

**`src/lib/scoring.ts` does not exist:**
- Issue: `plan.md` specifies `scoreMEQ30`, `scoreEDI`, `scoreEBI`, `scoreSWEMWBS` functions. The file is absent. `CLAUDE.md` references scoring logic and threshold values (MEQ-30 ≥3.0 on all subscales, EBI sum of 6 items, SWEMWBS ≥3 point delta), but no implementation exists.
- Files: `src/lib/` directory (file missing)
- Impact: Compare view cannot compute scores; Complete Mystical Experience badge cannot be shown; SWEMWBS meaningful change indicator cannot be computed.
- Fix approach: Create `src/lib/scoring.ts` implementing the four scoring functions per the rules in `CLAUDE.md`.

**Instrument components not created:**
- Issue: `src/components/instruments/` directory does not exist. MEQ30, EDI, EBI, and IntegrationScales components referenced in `CLAUDE.md` are absent.
- Files: `src/components/` directory
- Impact: Phase 2 and Phase 3 forms cannot render their primary instruments.
- Fix approach: Create `src/components/instruments/` following the shared component pattern in `src/components/shared/`.

---

## Tech Debt

**Duplicated `mapPhase*` functions across hooks and export:**
- Issue: `mapPhase1`, `mapPhase2`, `mapPhase3Entry`, and `mapJourney` are implemented independently in `src/hooks/use-journeys.ts`, `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, `src/hooks/use-phase3.ts`, and `src/lib/export.ts`. Five separate implementations of the same mapping logic.
- Files: `src/hooks/use-journeys.ts`, `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, `src/hooks/use-phase3.ts`, `src/lib/export.ts`
- Impact: Any schema change (new JSONB column, renamed field) must be updated in five places. Export maps are already missing some fields compared to hook maps (e.g., `id` and `journeyId` are omitted in `src/lib/export.ts`).
- Fix approach: Centralize mapping functions in a `src/lib/mappers.ts` module and import from hooks and export.

**`toSnake` functions duplicated across three hooks:**
- Issue: Equivalent camelCase→snake_case mapping logic exists separately in `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, and `src/hooks/use-phase3.ts`.
- Files: `src/hooks/use-phase1.ts` (lines 19–33), `src/hooks/use-phase2.ts` (lines 20–34), `src/hooks/use-phase3.ts` (lines 23–42)
- Impact: Adding new JSONB fields requires three edits. Keys can drift out of sync silently.
- Fix approach: Move to shared mapper module or use a generalized snake_case utility.

**Unsafe `as` casts on JSONB columns instead of Zod validation:**
- Issue: All hook mappers use `row.swemwbs as Phase1['swemwbs']` style casts. The Zod schemas in `src/lib/schemas.ts` exist but are never called on data read from Supabase. Data from the DB is trusted as-is.
- Files: `src/hooks/use-journeys.ts`, `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, `src/hooks/use-phase3.ts`
- Impact: Malformed JSONB data (e.g., from a Supabase migration, direct SQL edit, or buggy import) will propagate into the UI without error. `CLAUDE.md` states "Zod at app boundary" but this is not enforced on reads.
- Fix approach: Call `swemwbsSchema.parse(row.swemwbs)` (and equivalents) in each map function.

**`updated_at` sent in upsert payloads:**
- Issue: `toSnake` in `src/hooks/use-phase1.ts` and `src/hooks/use-phase2.ts` includes `updatedAt → updated_at` in the mapping. The DB trigger `trg_phase1_updated_at` sets `updated_at = now()` on every UPDATE, but if the client sends the old `updated_at` value, it is written first and then overwritten by the trigger — which is harmless but confusing. More critically, if a future update modifies the upsert to skip the trigger or the `updated_at` column is used for conflict detection, stale client values will cause issues.
- Files: `src/hooks/use-phase1.ts` (line 25), `src/hooks/use-phase2.ts` (line 26), `src/hooks/use-phase3.ts` (line 34)
- Impact: Low risk now, but could cause multi-tab data loss if conflict detection is added.
- Fix approach: Remove `updatedAt` from `toSnake` maps; let the DB trigger own `updated_at` exclusively.

**`VASSlider` initializes to `min` when value is undefined:**
- Issue: `src/components/shared/vas-slider.tsx` renders `value ?? min` in the slider. An unanswered EDI/EBI item (value `undefined`) will display as 0 (the minimum) rather than visually unanswered.
- Files: `src/components/shared/vas-slider.tsx` (line 36, 43)
- Impact: Users cannot tell if they answered 0 intentionally vs never touched the slider. EDI and EBI scores will be incorrect if computed on partially-answered items.
- Fix approach: Track a separate "touched" state or render the slider visually distinct when value is `undefined`. Consider requiring an initial explicit interaction before recording a score.

**`plan.md` describes a different architecture (IndexedDB, no auth):**
- Issue: The committed `plan.md` describes the original prototype design using IndexedDB with no backend. The actual implementation uses Supabase + auth. This document is stale and misleading.
- Files: `plan.md`
- Impact: New developers reading `plan.md` will have a fundamentally incorrect model of the data layer.
- Fix approach: Update `plan.md` to reflect the Supabase architecture, or delete it in favor of `CLAUDE.md`.

---

## Security Considerations

**Import from JSON lacks Zod validation:**
- Issue: `importJourneyFromJson` in `src/lib/export.ts` accepts a user-supplied file and inserts its contents directly into Supabase with only a loose check (`!parsed.version || !parsed.journey?.name`). No Zod validation is applied to `phase1`, `phase2`, or `phase3Entries` payloads before insert.
- Files: `src/lib/export.ts` (lines 92–167)
- Current mitigation: RLS policies prevent writing to other users' data. Supabase's JSONB columns will accept any valid JSON.
- Risk: A crafted JSON file could insert malformed JSONB data that causes scoring crashes or UI rendering errors.
- Recommendations: Validate imported phase data with the existing Zod schemas from `src/lib/schemas.ts` before writing.

**VITE_SUPABASE_ANON_KEY is a build-time public value, but `.env` is committed:**
- Issue: `.env` exists at the root (confirmed present, not read). `.env.example` is also present. If `.env` contains real keys and is committed, credentials are exposed.
- Files: `.env` (presence confirmed)
- Current mitigation: The anon key is designed to be public; RLS is the actual security boundary. However, if `.env` is committed to git it's a bad practice.
- Recommendations: Confirm `.env` is in `.gitignore`. Verify no accidental commit of real keys in git history.

**No rate limiting or abuse protection on auth:**
- Issue: `signIn` and `signUp` in `src/hooks/use-auth.ts` call Supabase auth directly. No client-side rate limiting, no CAPTCHA, no lockout feedback beyond Supabase's own limits.
- Files: `src/hooks/use-auth.ts`, `src/routes/login.tsx`
- Current mitigation: Supabase's built-in rate limiting applies.
- Risk: Low for a personal app, but worth noting if usage grows.

---

## Performance Bottlenecks

**`useJourney` fetches all phase data in a single join on every navigation:**
- Issue: `useJourney` in `src/hooks/use-journeys.ts` selects `*, phase1(*), phase2(*), phase3_entries(*)` in a single query. Phase 2 contains up to 30 MEQ-30 items + 8 EDI + 6 EBI items as JSONB. For journeys with many Phase 3 entries, this payload grows significantly.
- Files: `src/hooks/use-journeys.ts` (line 89)
- Impact: Every journey overview page load fetches the full payload. As Phase 3 entries accumulate, response size grows unboundedly.
- Improvement path: Lazy-load phase data only when navigating into a specific phase. The `usePhase1`, `usePhase2`, `usePhase3Entries` hooks already exist for per-phase loading; they should be used on phase pages instead of the join query.

**Auto-save fires on every JSONB field state object reference change:**
- Issue: `formData` in `src/routes/journey/$id/phase1.tsx` is `useMemo`-derived but the equality check in `useAutoSave` uses default React `useEffect` dependency comparison (reference equality). Any parent re-render that creates a new `formData` object reference will schedule a debounced save even if values are identical.
- Files: `src/hooks/use-auto-save.ts`, `src/routes/journey/$id/phase1.tsx`
- Impact: More Supabase upsert calls than necessary. Minor cost but could accumulate.
- Improvement path: Add deep equality check (e.g., compare JSON.stringify of previous vs current data) before scheduling the debounced save.

---

## Fragile Areas

**`beforeunload` auto-save is fire-and-forget:**
- Issue: In `src/hooks/use-auto-save.ts`, the `handleBeforeUnload` handler calls `save()` (an async function) without awaiting it. The comment in the code acknowledges this: "fire the async save and hope it completes." Supabase requests initiated during `beforeunload` are not guaranteed to complete before the page unloads.
- Files: `src/hooks/use-auto-save.ts` (lines 92–99)
- Why fragile: Any pending form data when the user closes the tab can be silently lost.
- Safe modification: Use `navigator.sendBeacon` for a best-effort fire-and-forget POST, or add a visible "unsaved changes" indicator that blocks navigation using TanStack Router's `beforeLoad`/`onLeave` guards.
- Test coverage: None.

**`isSaving` guard drops concurrent saves silently:**
- Issue: `useAutoSave.save()` checks `isSaving.current` and returns early if a save is in flight. If data changes during a save, the new data is not queued — it will be picked up only if another `data` change triggers the debounce timer after the save completes.
- Files: `src/hooks/use-auto-save.ts` (lines 29–42)
- Why fragile: A rapid burst of changes followed by tab close could leave the final state unsaved.
- Safe modification: Queue the latest data and trigger a retry save when `isSaving` clears.

**Journey creation is non-atomic (partial failure leaves orphan rows):**
- Issue: `useCreateJourney` in `src/hooks/use-journeys.ts` inserts into `journeys`, then inserts into `phase1`, then inserts into `phase2` — three separate Supabase calls. If the `phase2` insert fails, a journey and phase1 row exist without a corresponding phase2.
- Files: `src/hooks/use-journeys.ts` (lines 105–138)
- Why fragile: Network interruption or Supabase error mid-sequence creates inconsistent state. The `useJourney` query assumes `phase2` always exists for a journey.
- Safe modification: Wrap in a Supabase database function (RPC) or a Postgres transaction via a migration. Alternatively, handle null `phase2` gracefully in all consumers.

**Auth redirect guard uses `useEffect` with a race condition:**
- Issue: The auth redirect in `src/routes/__root.tsx` uses `useEffect` watching `[user, loading, location.pathname, navigate]`. Between initial render and the `useEffect` firing, an unauthenticated user briefly sees the protected route's content before being redirected.
- Files: `src/routes/__root.tsx` (lines 62–70)
- Why fragile: Route-level auth guards in TanStack Router should use `beforeLoad` to prevent the route from rendering at all. The effect-based approach causes a flash of unauthenticated content.
- Safe modification: Move auth checks to TanStack Router's `beforeLoad` context on protected routes.

---

## Test Coverage Gaps

**Zero tests exist for the entire codebase:**
- What's not tested: Scoring logic, Zod schemas, auto-save debounce behavior, mapping functions, export/import round-trip, auth flows, route rendering.
- Files: All `src/` files — no test files exist.
- Risk: Any refactor of `src/lib/scoring.ts` (once written), `src/lib/schemas.ts`, or the mapping functions can break silently. Research instrument scoring has specific threshold rules (MEQ-30 ≥3.0 per subscale, SWEMWBS ≥3 delta) that are safety-critical for correctness.
- Priority: High

**Scoring logic is a critical gap:**
- What's not tested: `scoreMEQ30`, `scoreEDI`, `scoreEBI`, `scoreSWEMWBS` do not yet exist but will be the highest-risk logic in the app (research-validated thresholds, MEQ factor groupings, subscale means).
- Risk: Silent scoring errors that present incorrect research-grade results to users.
- Priority: High — write tests before implementing scoring.

**Export/import round-trip is untested:**
- What's not tested: `exportJourneyAsJson` / `importJourneyFromJson` in `src/lib/export.ts`.
- Files: `src/lib/export.ts`
- Risk: Data corruption or silent data loss on import goes undetected. The import function has no Zod validation (see Security section).
- Priority: Medium

---

## Scaling Limits

**No pagination on journeys list:**
- Issue: `useJourneys` in `src/hooks/use-journeys.ts` fetches all journeys with `.select('*')` and no LIMIT. For a power user with many journeys, the list query is unbounded.
- Files: `src/hooks/use-journeys.ts` (lines 63–79)
- Scaling path: Add pagination or virtual scrolling if journeys grow beyond ~50.

**Phase 3 entries are unbounded per journey:**
- Issue: `usePhase3Entries` fetches all entries with no LIMIT. Journeys used over years could accumulate dozens of Phase 3 entries, all fetched at once on the compare page.
- Files: `src/hooks/use-phase3.ts` (lines 44–59)
- Scaling path: Limit to most recent N entries or paginate on the compare view.

---

## Dependencies at Risk

**`@tanstack/react-form` is installed but unused:**
- Risk: Dead dependency — adds to bundle size, needs security monitoring, creates confusion about whether forms should use it.
- Files: `package.json`
- Impact: Minimal weight cost. Confusing for contributors — Phase 1 form uses raw `useState`, not TanStack Form.
- Migration plan: Remove if forms will continue to use `useState` pattern. Adopt it consistently if the team wants form validation.

**`recharts` is installed but not yet used:**
- Risk: `recharts@^3.8.1` is a dependency but no chart components have been written yet.
- Files: `package.json`
- Impact: Adds to initial JS bundle even if charts are not rendered. Use dynamic import when implementing compare charts.
- Migration plan: Import Recharts dynamically in the compare view: `const { RadarChart } = await import('recharts')`.

---

*Concerns audit: 2026-04-10*
