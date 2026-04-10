# Phase 3: Right Now (In-Trip Check-In) - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the "Right Now" in-trip check-in: 10 multiple-choice questions presented in the QuestionCarousel, with deterministic mapping of responses to MEQ-30, EDI, and EBI instrument scores. The first real consumer of the carousel component built in Phase 2. Data stored in Supabase JSONB via existing `usePhase2` hook.

</domain>

<decisions>
## Implementation Decisions

### Question Design & Instrument Mapping
- **D-01:** 10 composite questions, each targeting 1-2 key constructs from MEQ-30 (mystical experience), EDI (ego dissolution), and EBI (emotional breakthrough). Question text is conversational and warm — not clinical instrument language.
- **D-02:** Each question has 4-5 predefined multiple-choice options. Each option maps deterministically to specific instrument item scores via a predefined lookup table. No AI interpretation — pure lookup.
- **D-03:** Create `src/data/phase2-questions.ts` with question definitions including text, options, and instrument score mappings. This is the single source of truth for the check-in content.
- **D-04:** Scoring function in `src/lib/scoring.ts` (extend existing) takes the 10 responses and produces complete MEQ-30, EDI, and EBI score objects. Items not directly mapped default to the median of the instrument's scale.

### Response-to-Score Mapping
- **D-05:** Each answer option carries a hidden `scores` object mapping to instrument item IDs and values. Example: `{ meq30: { item1: 5, item14: 4 }, edi: { item3: 80 } }`. The mapping is defined at the question level, not computed.
- **D-06:** The existing `Phase2` type in `src/types/journey.ts` already has `meq30: Meq30`, `edi: Edi`, `ebi: Ebi` fields. These are populated from the deterministic scoring after all 10 questions are answered.

### Carousel Integration
- **D-07:** Use `QuestionCarousel` from `src/components/shared/question-carousel.tsx`. The route page manages state (current question index, selected answers) and passes questions as `CarouselQuestion[]` where each question's `content` renders the multiple-choice options.
- **D-08:** `canAdvance` is true only when the user has selected an option for the current question. Selecting an option enables the Enter key to advance.
- **D-09:** Arrow keys cycle through the multiple-choice option buttons (using `data-option` attribute to match the carousel's `OPTION_SELECTORS`).

### Intention Sentence Display
- **D-10:** If Phase 1 (Come Together) has been completed for this journey, display the intention sentence as a subtle banner above the carousel. Fetch from the journey's phase1 data via existing hooks. If Phase 1 is not completed, omit the banner (Phase 1 is optional for Phase 2).

### Free-Text "Type Your Own"
- **D-11:** Each question has an optional "Type your own" toggle below the predefined options. Collapsed by default. When expanded, shows a text input. Free-text responses are stored in the phase2 JSONB alongside the selected option but do NOT affect instrument scoring.
- **D-12:** Entering free text also enables `canAdvance` (user doesn't have to select a predefined option if they type their own).

### Data Persistence
- **D-13:** Use existing `useUpsertPhase2` mutation hook. Auto-save after each question answer (debounced via `useAutoSave`). On completion (all 10 answered), compute scores and set `completedAt` timestamp.
- **D-14:** Store raw responses as a new JSONB column or within existing columns. The `rawImpressions` field on Phase2 type can store the structured question/answer/freetext data.

### Claude's Discretion
- Exact question text and answer options (as long as they map to valid instrument constructs)
- Visual styling of the multiple-choice option buttons within the carousel
- Whether to show a completion summary after question 10
- Animation timing for option selection feedback

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & Requirements
- `DESIGN.md` -- Dark luxury aesthetic reference
- `.planning/REQUIREMENTS.md` -- RN-01 through RN-05 are this phase's requirements

### Existing Code (must read before implementing)
- `src/components/shared/question-carousel.tsx` -- The carousel component this phase consumes. Read the `CarouselQuestion` and `QuestionCarouselProps` interfaces.
- `src/hooks/use-phase2.ts` -- Existing Phase2 data hook with `mapPhase2`, `toSnake`, `usePhase2`, `useUpsertPhase2`
- `src/hooks/use-auto-save.ts` -- Auto-save hook pattern
- `src/types/journey.ts` -- `Phase2` type with `meq30`, `edi`, `ebi`, `rawImpressions` fields
- `src/lib/schemas.ts` -- Zod schemas for instrument data validation
- `src/lib/scoring.ts` -- Existing scoring logic (if exists) to extend
- `src/data/swemwbs-items.ts` -- Pattern for instrument item data files

### Prior Phase Context
- `.planning/phases/01-infrastructure-skeleton/01-CONTEXT.md` -- API contract decisions
- `.planning/phases/02-design-system-typeform-carousel/02-CONTEXT.md` -- Carousel component decisions, dark luxury tokens

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `QuestionCarousel` component — accepts `CarouselQuestion[]`, handles transitions, progress bar, keyboard nav, ARIA. Phase 3 is its first real consumer.
- `usePhase2` hook — query + mutation for Phase2 data. Already maps camelCase↔snake_case.
- `useAutoSave` hook — debounced auto-save pattern used across all phase forms.
- `LikertScale`, `RatingSlider`, `VASSlider` — existing instrument input components, though Phase 3 uses custom multiple-choice options instead.
- Existing scoring logic in `src/lib/scoring.ts` (or `src/lib/export.ts`) for MEQ-30 subscale calculations.

### Established Patterns
- Route files in `src/routes/journey/$id/` handle phase-specific forms
- `initialized` guard pattern prevents resetting state after data loads
- Form data wrapped in `useMemo`, `onSave` in `useCallback` before passing to `useAutoSave`
- `SaveIndicator` component shows auto-save status

### Integration Points
- New route: `src/routes/journey/$id/phase2.tsx` — currently a stub, needs full implementation
- New data file: `src/data/phase2-questions.ts` — question definitions with score mappings
- Extend: `src/lib/scoring.ts` — add Phase 2 scoring function
- Existing: `src/hooks/use-phase2.ts` — may need response storage additions
- Existing: `src/types/journey.ts` — may need `Phase2Responses` type for structured answers

</code_context>

<specifics>
## Specific Ideas

- Questions should feel like a check-in, not a test. Warm, conversational tone matching the "Right Now" phase name — you're in the middle of an experience, not taking an exam.
- The carousel's meditative pace (300ms fade, centered question) is a feature, not a constraint. Don't rush the UX.
- Option buttons should use `data-option` attribute so the carousel's ArrowUp/ArrowDown handling works automatically.
- The intention sentence banner should be visually subtle — warm secondary text color, not a loud callout.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 03-right-now-in-trip-check-in*
*Context gathered: 2026-04-10*
