# Phase 6: Comparison, Sessions & Navigation - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the comparison view (before/after instrument score visualizations + AI trip summary), session management (profile section with session list, create, view summary, delete), and three-phase navigation with completion status. This phase closes the user experience loop — after completing all three journey phases, users can see their transformation visualized and manage their sessions.

</domain>

<decisions>
## Implementation Decisions

### Comparison View — Charts
- **D-01:** Recharts (already installed) for all visualizations. No new chart libraries.
- **D-02:** MEQ-30: Radar chart showing the 4 subscale scores (Mystical, Positive Mood, Transcendence of Time/Space, Ineffability). Each axis 0-5. Threshold line at 3.0 for "Complete Mystical Experience" indicator.
- **D-03:** SWEMWBS: Bar chart showing before (Phase 1) and after (Phase 3 if available) scores. Highlight meaningful change threshold (>= 3 points delta). Total score range 7-35.
- **D-04:** EDI: Single bar or gauge showing the mean score (0-100). Higher = more ego dissolution.
- **D-05:** EBI: Single bar or gauge showing the sum score (0-600). Higher = more emotional breakthrough.
- **D-06:** All charts use dark luxury styling — warm background, Pinterest Red accent for primary data, warm gray for secondary. No default Recharts blue/green.

### Comparison View — Dual Layout
- **D-07:** Desktop: side-by-side layout — charts on the left, AI trip summary on the right. Two-column grid.
- **D-08:** Mobile: stacked layout — charts first, then AI trip summary below.
- **D-09:** The AI trip summary section renders the text from Phase3Entry.tripSummary. If no Phase 3 is complete, show a placeholder encouraging the user to complete the reflection.
- **D-10:** Meaningful thresholds highlighted visually on charts: MEQ-30 complete mystical experience (mean >= 3.0 on all subscales), SWEMWBS meaningful change (>= 3 points raw delta).

### Session Management
- **D-11:** New route `/profile` accessible from a "Profile" link in the footer. This replaces the current footer disclaimer text with a footer nav containing both the disclaimer and the profile link.
- **D-12:** Profile page lists all sessions (journeys) with: date, name/label, phase completion status indicators (dots or checkmarks for each of the 3 phases).
- **D-13:** User can start a new session from the profile page (reuses existing `useCreateJourney` hook).
- **D-14:** User can view a session's trip summary (navigates to the journey's compare view).
- **D-15:** User can delete a session with confirmation dialog (reuses existing `useDeleteJourney` hook).
- **D-16:** The existing journey list at `/` (index.tsx) can be simplified or redirected to `/profile` since session management moves there. Or keep both — the index as a quick-start and profile as the full management view.

### Phase Navigation
- **D-17:** Horizontal step indicator inside the journey layout (`$id.tsx`). Three labeled steps: "Come Together", "Right Now", "Over Me". Each shows a completion indicator (filled dot, checkmark, or progress state).
- **D-18:** Steps are clickable — navigate to the corresponding phase route. Disabled/dimmed if the phase hasn't been started yet.
- **D-19:** Current phase highlighted with Pinterest Red accent. Completed phases show a warm success color. Incomplete phases show muted secondary text.
- **D-20:** The journey overview page (`$id/index.tsx`) can be updated or the phase nav replaces it as the primary navigation within a journey.

### Claude's Discretion
- Exact chart dimensions and responsive breakpoints
- Whether to use Recharts ResponsiveContainer or fixed dimensions
- Animation on chart render (or disable per reduced-motion)
- Whether to keep the index route as-is or redirect to profile
- Exact footer nav layout (inline links vs icon buttons)
- Whether the profile page needs its own route file or is embedded in the root layout

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Code
- `src/routes/journey/$id/compare.tsx` -- 16-line stub to replace with full comparison view
- `src/routes/index.tsx` -- Current journey list with create/delete (potential overlap with profile)
- `src/routes/__root.tsx` -- Root layout with header/footer to modify for nav
- `src/routes/journey/$id.tsx` -- Journey layout to add phase navigation
- `src/routes/journey/$id/index.tsx` -- Journey overview
- `src/hooks/use-journeys.ts` -- useJourneys, useCreateJourney, useDeleteJourney, useJourney (FullJourney with phase data)
- `src/lib/scoring.ts` -- computePhase2Scores and any existing scoring utilities
- `src/lib/score-parser.ts` -- aggregateSwemwbsScores, aggregateIntegrationScores

### Requirements
- `.planning/REQUIREMENTS.md` -- COMP-01 through COMP-03, SESS-01 through SESS-05, NAV-01 through NAV-03

### Design
- `DESIGN.md` -- Dark luxury aesthetic, Pinterest Red accent, border-radius system
- `src/index.css` -- Current dark luxury @theme tokens

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useJourney(id)` -- Fetches FullJourney with `.select('*, phase1(*), phase2(*), phase3_entries(*)')`. Already has all phase data needed for comparison.
- `useJourneys()` -- Lists all journeys. Already used by index.tsx.
- `useCreateJourney`, `useDeleteJourney` -- CRUD hooks ready for session management.
- `recharts` -- Already installed as a dependency. Provides RadarChart, BarChart, ResponsiveContainer, etc.
- Existing scoring functions for MEQ-30 subscale calculation in `src/lib/scoring.ts`.

### Established Patterns
- Dark luxury tokens: `bg-background`, `bg-surface`, `bg-card`, `text-accent-warm`, `border-border`
- `rounded-[16px]` buttons, `rounded-[20px]` cards
- TanStack Router file-based routing with `$param` segments
- Query invalidation on mutations

### Integration Points
- `src/routes/journey/$id/compare.tsx` -- Stub to replace
- `src/routes/__root.tsx` -- Footer needs profile link
- `src/routes/journey/$id.tsx` -- Layout needs phase nav
- New route: `src/routes/profile.tsx` -- Session management page
- New components: chart components in `src/components/charts/`

</code_context>

<specifics>
## Specific Ideas

- Charts should feel like warm data visualization, not corporate dashboards. Use the dark luxury palette throughout — no default chart colors.
- The comparison view is the payoff of the entire app. It should feel revelatory — "look how you've transformed."
- Phase navigation should feel like a Beatles album track listing — three songs, each with its own character.
- Session management should be simple and clean. This isn't a power-user admin panel.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 06-comparison-sessions-navigation*
*Context gathered: 2026-04-11*
