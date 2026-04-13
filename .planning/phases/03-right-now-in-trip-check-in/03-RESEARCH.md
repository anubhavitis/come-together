# Phase 3: Right Now (In-Trip Check-In) - Research

**Researched:** 2026-04-10
**Domain:** Psychedelic instrument scoring, carousel UX integration, deterministic question-to-score mapping
**Confidence:** HIGH

## Summary

Phase 3 is the first real consumer of the QuestionCarousel component built in Phase 2. It presents 10 conversational multiple-choice questions, each mapping deterministically to MEQ-30, EDI, and EBI instrument scores via a predefined lookup table. The core technical challenge is designing the question-to-score mapping data structure and the scoring aggregation function. The UX challenge is making clinical instruments feel like a warm check-in.

All infrastructure exists: the `QuestionCarousel` component, `usePhase2`/`useUpsertPhase2` hooks, `useAutoSave`, the `phase2` Supabase table with `meq30`, `edi`, `ebi`, and `raw_impressions` JSONB columns. No new dependencies, no schema migrations, no new Supabase tables are needed.

**Primary recommendation:** Build the question data file (`src/data/phase2-questions.ts`) first as the single source of truth, then the scoring function, then the route page. Everything flows from the data file.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 10 composite questions, each targeting 1-2 key constructs from MEQ-30, EDI, and EBI. Conversational text, not clinical.
- **D-02:** Each question has 4-5 predefined multiple-choice options. Each option maps deterministically to instrument item scores via lookup table. No AI interpretation.
- **D-03:** Create `src/data/phase2-questions.ts` with question definitions including text, options, and instrument score mappings. Single source of truth.
- **D-04:** Scoring function in `src/lib/scoring.ts` (extend existing) takes 10 responses and produces complete MEQ-30, EDI, and EBI score objects. Unmapped items default to median of instrument's scale.
- **D-05:** Each answer option carries a hidden `scores` object mapping to instrument item IDs and values. Example: `{ meq30: { item1: 5, item14: 4 }, edi: { item3: 80 } }`.
- **D-06:** Existing `Phase2` type already has `meq30`, `edi`, `ebi` fields. These are populated from deterministic scoring after all 10 questions.
- **D-07:** Use `QuestionCarousel` from `src/components/shared/question-carousel.tsx`. Route page manages state (current index, selected answers) and passes questions as `CarouselQuestion[]`.
- **D-08:** `canAdvance` is true only when user has selected an option for the current question.
- **D-09:** Arrow keys cycle through option buttons (using `data-option` attribute matching carousel's `OPTION_SELECTORS`).
- **D-10:** If Phase 1 completed, display intention sentence as subtle banner above carousel. Fetch via existing hooks. If not completed, omit banner.
- **D-11:** Each question has optional "Type your own" toggle, collapsed by default. Free text does NOT affect instrument scoring.
- **D-12:** Entering free text also enables `canAdvance`.
- **D-13:** Use existing `useUpsertPhase2` mutation. Auto-save after each answer. On completion, compute scores and set `completedAt`.
- **D-14:** Store raw responses in `rawImpressions` field on Phase2 type.

### Claude's Discretion
- Exact question text and answer options (as long as they map to valid instrument constructs)
- Visual styling of multiple-choice option buttons within the carousel
- Whether to show a completion summary after question 10
- Animation timing for option selection feedback

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RN-01 | 10-question multiple-choice questionnaire in Typeform carousel | QuestionCarousel component exists. Route page manages state and passes `CarouselQuestion[]`. Data file defines 10 questions. |
| RN-02 | Each question has predefined choices plus optional free-text "type your own" | D-11/D-12: collapsible text input below options, does not affect scoring |
| RN-03 | Responses map to validated instrument scores (MEQ-30, EDI, EBI) via deterministic scoring | Scoring function in `scoring.ts` uses lookup table from question data. MEQ-30 0-5 scale, EDI 0-100, EBI 0-100. Unmapped items get median. |
| RN-04 | Intention sentence from Phase 1 displayed as grounding anchor | `usePhase1(journeyId)` fetches phase1 data; `phase1.intentions.primary` is the intention sentence |
| RN-05 | Responses stored in Supabase JSONB | `useUpsertPhase2` already handles upsert. `raw_impressions` JSONB column stores structured responses. `meq30`, `edi`, `ebi` columns store computed scores. |
</phase_requirements>

## Standard Stack

No new dependencies. Everything uses the existing stack.

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React | 19.2.4 | UI rendering | Installed |
| TanStack Router | 1.168.10 | File-based routing | Installed |
| TanStack Query | 5.97.0 | Server state, mutations | Installed |
| @supabase/supabase-js | 2.103.0 | Database operations | Installed |
| Zod | 4.3.6 | Runtime validation | Installed |
| Tailwind CSS | 4.2.2 | Styling | Installed |

### Supporting (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| useAutoSave hook | N/A | Debounced persistence | `src/hooks/use-auto-save.ts` |
| QuestionCarousel | N/A | One-at-a-time question UX | `src/components/shared/question-carousel.tsx` |

**Installation:** None required. Zero new dependencies.

## Architecture Patterns

### File Structure for This Phase
```
src/
├── data/
│   └── phase2-questions.ts          # NEW: 10 questions with score mappings
├── lib/
│   └── scoring.ts                   # NEW: Create file with Phase 2 scoring function
├── types/
│   └── journey.ts                   # MODIFY: Extend RawImpressions type
├── lib/
│   └── schemas.ts                   # MODIFY: Add phase2 response validation schema
├── routes/journey/$id/
│   └── phase2.tsx                   # MODIFY: Replace stub with full carousel page
└── components/shared/
    └── (no changes needed)
```

### Pattern 1: Question Data Structure
**What:** Static data file defining questions with embedded score mappings
**When to use:** When questions and their scoring are predetermined and deterministic

```typescript
// src/data/phase2-questions.ts
// Follows the pattern established by src/data/swemwbs-items.ts

interface InstrumentScores {
  meq30?: Partial<Record<string, number>>   // item keys → 0-5 Likert values
  edi?: Partial<Record<string, number>>     // item keys → 0-100 VAS values
  ebi?: Partial<Record<string, number>>     // item keys → 0-100 VAS values
}

interface Phase2Option {
  id: string                    // e.g., 'q1-opt-a'
  text: string                  // Display text
  scores: InstrumentScores      // Hidden instrument mapping
}

interface Phase2Question {
  id: string                    // e.g., 'q1'
  text: string                  // Conversational question text
  options: Phase2Option[]       // 4-5 predefined choices
}

export const phase2Questions: Phase2Question[] = [
  // 10 questions here
]
```

### Pattern 2: Raw Responses Storage
**What:** Extend `RawImpressions` to hold structured question responses alongside existing free-write fields
**When to use:** Per D-14, raw responses stored in the existing `rawImpressions` JSONB column

```typescript
// Extended RawImpressions type in src/types/journey.ts
export type Phase2Response = {
  questionId: string
  selectedOptionId: string | null  // null if free-text only
  freeText: string                 // empty string if no free text entered
}

export type RawImpressions = {
  freeWrite: string
  metaphor: string
  responses?: Phase2Response[]     // NEW: structured carousel responses
}
```

### Pattern 3: Route Page State Management
**What:** Route page owns carousel state and delegates to QuestionCarousel
**When to use:** Following the existing Phase 1 form pattern with `initialized` guard

```typescript
// src/routes/journey/$id/phase2.tsx
// State shape:
const [currentIndex, setCurrentIndex] = useState(0)
const [answers, setAnswers] = useState<Record<string, Phase2Response>>({})
const [initialized, setInitialized] = useState(false)

// canAdvance derived from answers:
const canAdvance = !!answers[phase2Questions[currentIndex].id]?.selectedOptionId
  || !!answers[phase2Questions[currentIndex].id]?.freeText

// Map questions to CarouselQuestion[] with content rendering option buttons
const carouselQuestions: CarouselQuestion[] = phase2Questions.map((q) => ({
  id: q.id,
  content: (
    <MultipleChoiceQuestion
      question={q}
      selected={answers[q.id]?.selectedOptionId ?? null}
      freeText={answers[q.id]?.freeText ?? ''}
      onSelect={(optionId) => setAnswers(prev => ({
        ...prev,
        [q.id]: { ...prev[q.id], questionId: q.id, selectedOptionId: optionId, freeText: prev[q.id]?.freeText ?? '' }
      }))}
      onFreeTextChange={(text) => setAnswers(prev => ({
        ...prev,
        [q.id]: { ...prev[q.id], questionId: q.id, freeText: text, selectedOptionId: prev[q.id]?.selectedOptionId ?? null }
      }))}
    />
  ),
}))
```

### Pattern 4: Deterministic Scoring Function
**What:** Pure function that takes 10 responses and produces MEQ-30, EDI, EBI objects
**When to use:** On completion (all 10 answered) before final save

```typescript
// src/lib/scoring.ts
export function computePhase2Scores(
  answers: Record<string, Phase2Response>,
  questions: Phase2Question[],
): { meq30: Meq30; edi: Edi; ebi: Ebi } {
  // 1. Initialize all items to median values
  const meq30: Meq30 = { item1: 3, item2: 3, ... } // median of 0-5 scale = 2.5, round to 3
  const edi: Edi = { item1: 50, ... }               // median of 0-100 = 50
  const ebi: Ebi = { item1: 50, ... }               // median of 0-100 = 50

  // 2. Overlay scores from selected options
  for (const q of questions) {
    const answer = answers[q.id]
    if (!answer?.selectedOptionId) continue
    const option = q.options.find(o => o.id === answer.selectedOptionId)
    if (!option) continue

    // Apply each mapped score
    if (option.scores.meq30) {
      for (const [key, val] of Object.entries(option.scores.meq30)) {
        meq30[key as keyof Meq30] = val
      }
    }
    // Same for edi, ebi
  }

  return { meq30, edi, ebi }
}
```

### Anti-Patterns to Avoid
- **Mixing scoring with UI:** Keep scoring function pure in `src/lib/scoring.ts`. Never compute scores inside React components.
- **Storing computed scores in React state:** Derive scores on completion, not on every answer change. Only persist to Supabase on final completion.
- **Mutating answer state directly:** Always use immutable spread pattern for `setAnswers`.
- **Forgetting the `initialized` guard:** Must prevent overwriting user's in-progress answers when TanStack Query refetches data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Question carousel UX | Custom carousel | `QuestionCarousel` component | Already built in Phase 2, handles transitions, progress, keyboard nav, ARIA |
| Auto-save persistence | Manual debounce + save | `useAutoSave` hook | Handles debounce, flush on blur/unload, status tracking |
| Phase 2 CRUD | Raw Supabase calls | `useUpsertPhase2` hook | Already handles snake_case mapping, cache invalidation |
| Phase 1 data fetching | Raw Supabase calls | `usePhase1(journeyId)` | Already handles mapping, caching |
| Validation | Manual type checking | Zod schemas in `schemas.ts` | Existing `recordSchema()` factory for instrument data |

## Common Pitfalls

### Pitfall 1: Instrument Scale Mismatch
**What goes wrong:** Mapping MEQ-30 values outside 0-5 range, or EDI/EBI values outside 0-100 range
**Why it happens:** MEQ-30 uses 0-5 Likert, EDI uses 0-100 VAS, EBI uses 0-100 VAS. Easy to confuse.
**How to avoid:** Zod validation on the score mappings. Define range constants per instrument.
**Warning signs:** Scores that seem impossibly high or low on the comparison view.

### Pitfall 2: RawImpressions Type Backward Compatibility
**What goes wrong:** Extending `RawImpressions` type breaks existing phase2 rows that only have `freeWrite` and `metaphor`.
**Why it happens:** Existing rows in Supabase have `raw_impressions: { freeWrite: "", metaphor: "" }` without the `responses` array.
**How to avoid:** Make `responses` optional (`responses?: Phase2Response[]`). Always null-check before accessing. The Zod schema should use `.optional()`.
**Warning signs:** TypeError when loading existing Phase 2 data.

### Pitfall 3: Auto-Save Firing on Every Option Click
**What goes wrong:** Every option click triggers a Supabase write (10 saves per question if user changes mind).
**Why it happens:** `useAutoSave` reacts to data changes. Each `setAnswers` triggers the debounce.
**How to avoid:** The existing 500ms debounce in `useAutoSave` handles this naturally. Only the latest state is saved after the debounce window. This is acceptable behavior.
**Warning signs:** Excessive Supabase writes in network tab.

### Pitfall 4: Intention Sentence Fetch Race Condition
**What goes wrong:** Phase 2 page renders before Phase 1 data loads, causing layout shift when intention banner appears.
**Why it happens:** `usePhase1` is async. The carousel may render first.
**How to avoid:** Show a loading skeleton or reserve space for the intention banner. Use `isLoading` state from `usePhase1` to conditionally render.
**Warning signs:** Layout shift when intention banner appears after carousel is already visible.

### Pitfall 5: Missing `data-option` Attribute on Option Buttons
**What goes wrong:** Arrow key navigation doesn't work in the carousel.
**Why it happens:** The carousel's `OPTION_SELECTORS` constant is `'[role="radio"], [role="option"], button[data-option]'`. Option buttons must have one of these attributes.
**How to avoid:** Add `data-option` attribute to every multiple-choice button. This is explicitly called out in D-09.
**Warning signs:** ArrowUp/ArrowDown keys don't cycle through options.

### Pitfall 6: Scores Not Computed Before Save
**What goes wrong:** Phase 2 marked complete but `meq30`, `edi`, `ebi` JSONB columns are empty.
**Why it happens:** Auto-save saves raw responses but doesn't trigger score computation. Scores only computed on explicit completion.
**How to avoid:** In the completion handler (after question 10), compute scores FIRST, then save both raw responses AND computed scores in a single `useUpsertPhase2` call with `completedAt` set.
**Warning signs:** Comparison view shows no data for Phase 2 instruments.

## Instrument Reference

### MEQ-30 (Mystical Experience Questionnaire)
- **30 items**, 0-5 Likert scale (0=none, 5=extreme)
- **4 subscales:**
  - Mystical (15 items): items 1-15 (unity, noetic quality, sacredness)
  - Positive Mood (6 items): items 16-21 (peace, joy, ecstasy, reverence)
  - Transcendence of Time/Space (6 items): items 22-27
  - Ineffability (3 items): items 28-30
- **Complete Mystical Experience threshold:** mean >= 3.0 on ALL four subscales
- **Median default for unmapped items:** 3 (middle of 0-5 scale, round up from 2.5)
- **Source:** Barrett et al. 2015, validated revision of MEQ43

### EDI (Ego Dissolution Inventory)
- **8 items**, 0-100 VAS scale
- **Single factor** (all 8 items load onto one factor)
- **Total score:** mean of 8 items (0-100 range)
- **Items measure:** dissolution of self/ego, unity with universe, union with others, decreased self-importance, disintegration of self, less absorbed by own issues, loss of ego, dissolution of identity
- **Median default for unmapped items:** 50 (middle of 0-100)
- **Source:** Nour et al. 2016, Cronbach's alpha = 0.93

### EBI (Emotional Breakthrough Inventory)
- **6 items**, 0-100 VAS scale
- **Single factor** (all 6 items load onto one factor)
- **Total score:** sum of 6 items (0-600 range)
- **Items measure:** facing difficult feelings, resolving trauma/conflict, exploring challenging emotions, having emotional breakthrough, getting closure, achieving emotional release
- **Median default for unmapped items:** 50 (middle of 0-100)
- **Source:** Roseman et al. 2019, Cronbach's alpha = 0.932

### Question-to-Instrument Mapping Strategy
With 10 questions covering 3 instruments (30 + 8 + 6 = 44 total items), each question should target 4-5 items on average. Recommended coverage strategy:
- **Questions 1-4:** Focus on MEQ-30 constructs (mystical unity, noetic quality, transcendence, ineffability)
- **Questions 5-7:** Focus on EDI constructs (ego dissolution, boundary loss, unity)
- **Questions 8-10:** Focus on EBI constructs (emotional catharsis, breakthrough, resolution)
- **Cross-mapping:** Several questions can map to both MEQ-30 and EDI (ego dissolution overlaps with mystical unity constructs)

Each option within a question assigns scores to the targeted items. Higher-intensity options map to higher scores. Example for a question about unity:
- "I felt completely separate from everything" -> meq30.item1: 0, edi.item2: 0
- "I had brief moments of feeling connected" -> meq30.item1: 2, edi.item2: 30
- "I felt deeply connected to everything around me" -> meq30.item1: 4, edi.item2: 80
- "I completely merged with everything -- there was no boundary" -> meq30.item1: 5, edi.item2: 100

## Code Examples

### MultipleChoiceQuestion Component
```typescript
// Inline component within phase2.tsx (or extracted to components/shared/)
interface MultipleChoiceQuestionProps {
  question: Phase2Question;
  selected: string | null;
  freeText: string;
  onSelect: (optionId: string) => void;
  onFreeTextChange: (text: string) => void;
}

function MultipleChoiceQuestion({
  question,
  selected,
  freeText,
  onSelect,
  onFreeTextChange,
}: MultipleChoiceQuestionProps) {
  const [showFreeText, setShowFreeText] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-heading font-semibold tracking-heading text-text-primary">
        {question.text}
      </h2>

      <fieldset className="space-y-3">
        <legend className="sr-only">{question.text}</legend>
        {question.options.map((option) => (
          <button
            key={option.id}
            data-option
            role="radio"
            aria-checked={selected === option.id}
            onClick={() => onSelect(option.id)}
            className={`w-full min-h-[44px] rounded-md border-2 px-4 py-3 text-left text-sm transition-colors
              ${selected === option.id
                ? 'border-accent-warm bg-accent-warm/10 text-text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-border-hover'
              }`}
          >
            {option.text}
          </button>
        ))}
      </fieldset>

      {/* Free text toggle per D-11 */}
      <div>
        <button
          type="button"
          onClick={() => setShowFreeText(!showFreeText)}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          {showFreeText ? 'Hide' : 'Type your own response'}
        </button>
        {showFreeText && (
          <textarea
            value={freeText}
            onChange={(e) => onFreeTextChange(e.target.value)}
            placeholder="Describe your experience in your own words..."
            className="mt-2 w-full rounded-md border-2 border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-focus focus:outline-none"
            rows={3}
          />
        )}
      </div>
    </div>
  );
}
```

### Intention Banner Component
```typescript
// Subtle banner above carousel per D-10
function IntentionBanner({ journeyId }: { journeyId: string }) {
  const { data: phase1, isLoading } = usePhase1(journeyId);

  if (isLoading || !phase1?.intentions?.primary) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-3 text-center">
      <p className="text-sm text-text-secondary italic">
        Your intention: {phase1.intentions.primary}
      </p>
    </div>
  );
}
```

### Completion Handler
```typescript
// After question 10, compute scores and save
const handleComplete = useCallback(async () => {
  const scores = computePhase2Scores(answers, phase2Questions);
  const responses = Object.values(answers);

  await mutateAsync({
    journeyId: id,
    rawImpressions: { freeWrite: '', metaphor: '', responses },
    meq30: scores.meq30,
    edi: scores.edi,
    ebi: scores.ebi,
    completedAt: new Date().toISOString(),
  });
}, [answers, mutateAsync, id]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual Likert items | Composite conversational questions | This phase design | Users answer warm questions, not 44 clinical items |
| Direct instrument scoring | Deterministic lookup mapping | This phase design | Same psychometric data, better UX |
| Phase 2 as manual form | Phase 2 as carousel flow | This phase design | Uses QuestionCarousel from Phase 2 |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not configured (noted in CLAUDE.md: "Not detected -- no test framework configured") |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RN-01 | 10 MC questions in carousel | e2e (Playwright) | `bunx playwright test tests/e2e/phase2-carousel.spec.ts` | No - Wave 0 |
| RN-02 | Free-text toggle on each question | e2e | same file | No - Wave 0 |
| RN-03 | Deterministic scoring produces valid MEQ-30/EDI/EBI | unit | `bunx vitest run tests/unit/scoring.test.ts` | No - Wave 0 |
| RN-04 | Intention sentence displayed when Phase 1 complete | e2e | `bunx playwright test tests/e2e/phase2-intention.spec.ts` | No - Wave 0 |
| RN-05 | Responses persisted to Supabase JSONB | integration | Manual verification via Supabase dashboard | manual-only |

### Sampling Rate
- **Per task commit:** `bun run build` (type-check + bundle)
- **Per wave merge:** `bun run build && bun run lint`
- **Phase gate:** Full build green + manual smoke test of carousel flow

### Wave 0 Gaps
- [ ] No test framework configured at all -- would need Vitest for unit tests and Playwright for e2e
- [ ] `tests/unit/scoring.test.ts` -- covers RN-03 (most critical: scoring correctness)
- [ ] `tests/e2e/phase2-carousel.spec.ts` -- covers RN-01, RN-02
- [ ] Framework install: `bun add -d vitest @testing-library/react playwright @playwright/test`

**Note:** Given no test framework exists, the planner should prioritize the scoring function unit test (RN-03) as the highest-value test. The scoring function is a pure function with deterministic inputs/outputs -- ideal for unit testing. E2E tests are lower priority for this phase given the infrastructure gap.

## Open Questions

1. **Phase2Response storage location within RawImpressions**
   - What we know: D-14 says store in `rawImpressions` field. Current `RawImpressions` type has `freeWrite` and `metaphor` fields.
   - What's unclear: Whether to add a `responses` array to the existing type or replace it entirely for carousel mode.
   - Recommendation: Add `responses?: Phase2Response[]` as optional field. Keep `freeWrite` and `metaphor` for backward compatibility. Old Phase 2 stub data (if any) won't break.

2. **Completion UX after question 10**
   - What we know: Claude's discretion per CONTEXT.md.
   - What's unclear: Whether to show a summary screen, redirect to journey overview, or show a brief confirmation.
   - Recommendation: Show a brief completion message with scores summary, then a "View Journey" button linking back to `/journey/$id`. Keeps the meditative pace without adding complexity.

3. **Resume behavior for partially completed check-ins**
   - What we know: Auto-save persists after each answer. User may close browser mid-flow.
   - What's unclear: How to restore carousel position on return.
   - Recommendation: On load, count how many responses exist in `rawImpressions.responses`. Set `currentIndex` to the count of completed responses (resume from where they left off). This is natural given the auto-save pattern.

## Project Constraints (from CLAUDE.md)

- **Bun** is the runtime and package manager (not npm/yarn)
- **File naming:** kebab-case for files (`phase2-questions.ts`), PascalCase for components
- **Semicolons:** No semicolons in `src/lib/` and `src/hooks/`; semicolons in `src/components/` and `src/routes/`
- **Quotes:** Single quotes in `src/lib/` and `src/hooks/`; double quotes in `src/components/` and `src/routes/`
- **Imports:** Use `@/` for cross-directory imports, `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- **No `React.FC`:** Plain function declarations for components
- **No `clsx`/`cn`:** Inline Tailwind classes only
- **Immutability:** Always spread to create new objects, never mutate
- **Props pattern:** Local `interface {Name}Props`
- **Constants:** `DEFAULT_*` prefix for module-level defaults
- **`initialized` guard:** Prevent resetting state after data loads
- **`useMemo` for form data, `useCallback` for onSave** before passing to `useAutoSave`
- **Error handling:** Throw Supabase errors, inline error display in components
- **Design tokens:** Use Tailwind token classes (`bg-background`, `text-text-primary`), never raw hex
- **Touch targets:** `min-h-[44px] min-w-[44px]` on all interactive elements
- **`fieldset` + `legend`** for radio-style button groups
- **GSD workflow enforcement:** All changes through GSD commands

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/components/shared/question-carousel.tsx` -- CarouselQuestion interface, OPTION_SELECTORS constant, keyboard handling
- Project codebase: `src/hooks/use-phase2.ts` -- mapPhase2, toSnake, useUpsertPhase2 patterns
- Project codebase: `src/hooks/use-auto-save.ts` -- AutoSaveStatus type, debounce behavior
- Project codebase: `src/types/journey.ts` -- Phase2 type with meq30, edi, ebi, rawImpressions fields
- Project codebase: `src/lib/schemas.ts` -- recordSchema factory, meq30Schema (0-5), ediSchema (0-100), ebiSchema (0-100)
- Project codebase: `supabase/migrations/001_initial_schema.sql` -- phase2 table with raw_impressions, meq30, edi, ebi JSONB columns

### Secondary (MEDIUM confidence)
- [Barrett et al. 2015 - MEQ-30 validation](https://pmc.ncbi.nlm.nih.gov/articles/PMC5203697/) -- 4-factor structure, item-subscale mapping
- [Nour et al. 2016 - EDI validation](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2016.00269/full) -- 8 items, VAS 0-100, single factor
- [Roseman et al. 2019 - EBI validation](https://pubmed.ncbi.nlm.nih.gov/31294673/) -- 6 items, VAS 0-100, single factor

### Tertiary (LOW confidence)
- MEQ-30 specific item-to-subscale mapping from psychology-tools.com -- item numbers reference MEQ43 source items, need to confirm 1-30 renumbering for implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already installed and verified in codebase
- Architecture: HIGH - all patterns follow established codebase conventions, all integration points verified
- Pitfalls: HIGH - identified from direct code reading of existing hooks and components
- Instrument scoring: MEDIUM - validated research instruments well-documented, but the 10-question composite mapping is a novel design decision that needs careful testing

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable -- no moving dependencies, instrument definitions are fixed)
