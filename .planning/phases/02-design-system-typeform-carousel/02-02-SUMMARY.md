---
phase: 02-design-system-typeform-carousel
plan: 02
subsystem: ui
tags: [tailwind, css, dark-luxury, border-radius, warm-tones, route-restyling]

# Dependency graph
requires:
  - phase: 02-design-system-typeform-carousel
    plan: 01
    provides: Dark luxury color tokens, border/focus tokens, Inter typography
provides:
  - All route pages restyled with dark luxury aesthetic (warm tones, no cool indigo)
  - Consistent border-radius scale (16px buttons/inputs, 20px cards/containers)
  - Zero accent-cool references in route files
  - border-border and focus:ring-focus tokens used throughout
affects: [02-03, 02-04, all-route-components]

# Tech tracking
tech-stack:
  added: []
  patterns: [dark-luxury-route-restyling, accent-warm-primary-cta, text-secondary-secondary-action]

key-files:
  created: []
  modified:
    - src/routes/__root.tsx
    - src/routes/login.tsx
    - src/routes/index.tsx
    - src/routes/journey/$id/index.tsx
    - src/routes/journey/$id/phase1.tsx
    - src/index.css

key-decisions:
  - "Secondary actions use text-text-secondary hover:text-accent-warm instead of accent-cool to prevent too-much-red problem"
  - "Primary CTAs keep bg-accent-warm (Pinterest Red), secondary links use warm gray"

patterns-established:
  - "Primary CTA pattern: bg-accent-warm rounded-[16px] text-background"
  - "Secondary action pattern: text-text-secondary hover:text-accent-warm (no underline by default)"
  - "Card container pattern: rounded-[20px] border border-border bg-surface"
  - "Input pattern: rounded-[16px] border border-border bg-card focus:ring-focus"

requirements-completed: [DSGN-04, DSGN-03]

# Metrics
duration: 3min
completed: 2026-04-10
---

# Phase 02 Plan 02: Route Page Restyling Summary

**Dark luxury restyling of 6 route pages with warm border-radius scale (16px/20px), accent-cool elimination, and consistent warm border/focus tokens**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-10T12:39:46Z
- **Completed:** 2026-04-10T12:42:58Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Restyled root layout, login, and journey list pages with dark luxury border-radius (16px buttons/inputs, 20px cards) and warm border tokens
- Eliminated all accent-cool (indigo) references from route files -- secondary actions now use text-text-secondary, primary CTAs use accent-warm
- Updated phase1 form context inputs with rounded-[16px] and focus:border-focus
- Added border/border-hover/focus color tokens to index.css for parallel worktree compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle root layout, login, and journey list pages** - `9f34cce` (feat)
2. **Task 2: Restyle journey detail and phase1, eliminate accent-cool** - `b902b10` (feat)

## Files Created/Modified
- `src/index.css` - Added --color-border, --color-border-hover, --color-focus tokens (parallel worktree sync)
- `src/routes/__root.tsx` - DisclaimerDialog: rounded-[20px] card, rounded-[16px] button, border-border header/footer
- `src/routes/login.tsx` - rounded-[16px] inputs/button, border-border, focus:ring-focus
- `src/routes/index.tsx` - rounded-[20px] JourneyCard, rounded-[16px] buttons/inputs, border-border
- `src/routes/journey/$id/index.tsx` - rounded-[20px] PhaseBox/Phase3Section, bg-accent-warm CTA, text-secondary links
- `src/routes/journey/$id/phase1.tsx` - rounded-[16px] context inputs, focus:border-focus, text-secondary back link

## Decisions Made
- Secondary actions (links like "Review ->", "View comparison ->", "Back to journey") use `text-text-secondary hover:text-accent-warm` to prevent the "too much red" problem described in RESEARCH pitfall #2
- Primary CTAs ("New Check-in", "Mark as Complete", "Create") keep `bg-accent-warm` (Pinterest Red)
- Added border/focus tokens to index.css since parallel worktree doesn't have Plan 01 changes yet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added border/focus tokens to index.css for parallel worktree**
- **Found during:** Task 1 (pre-flight check)
- **Issue:** Plan references `border-border` and `focus:ring-focus` classes but Plan 01 token changes aren't in this parallel worktree
- **Fix:** Added `--color-border: #3a3a36`, `--color-border-hover: #4a4a44`, `--color-focus: #e60023` to index.css @theme block
- **Files modified:** src/index.css
- **Verification:** Build passes, classes resolve correctly
- **Committed in:** 9f34cce (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for parallel execution. Tokens match Plan 01 values exactly -- will merge cleanly.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all styling changes are final values applied to existing route components.

## Next Phase Readiness
- All route pages now wear the dark luxury aesthetic consistently
- Zero accent-cool references remain in route files
- Ready for carousel component development in Plan 03
- 4 stub route files (phase2, phase3.new, phase3.$entryId, compare) have minimal styling and will be built out in later phases

## Self-Check: PASSED

All 6 modified files verified present. Both task commits (9f34cce, b902b10) verified in git log.

---
*Phase: 02-design-system-typeform-carousel*
*Completed: 2026-04-10*
