# Phase 4: Come Together (AI Pre-Trip) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-10
**Phase:** 04-come-together-ai-pre-trip
**Areas discussed:** Conversation UX, System prompt design, Persistence & resume, Intention generation
**Mode:** Auto (--auto flag)

---

## Conversation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Chat-style with vertical flow | One Q&A at a time, fade transitions, free-text input | ✓ |
| QuestionCarousel reuse | Adapt carousel for free-text | |
| Scrolling chat log | Traditional chat interface | |

**User's choice:** [auto] Chat-style with vertical flow (recommended default)

---

## System Prompt for SWEMWBS Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Dual-purpose prompt with hidden JSON scoring | AI includes <!--SCORES:{...}--> in response, stripped client-side | ✓ |
| Separate scoring API call | Second API call per response for scoring only | |
| Client-side NLP scoring | Parse user text client-side for keywords | |

**User's choice:** [auto] Dual-purpose prompt with hidden JSON scoring (recommended default)

---

## Conversation Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Store in phase1 JSONB, save per exchange | Discrete saves after each Q&A pair | ✓ |
| Debounced auto-save | useAutoSave pattern from other phases | |
| Save only on completion | No resume capability | |

**User's choice:** [auto] Store in phase1 JSONB, save per exchange (recommended default)

---

## Intention Sentence Generation

| Option | Description | Selected |
|--------|-------------|----------|
| Final API call with full context | One more generateText call with synthesis instruction | ✓ |
| Last question generates intention | 10th question prompt includes intention generation | |
| Client-side extraction | Pull key phrases from conversation | |

**User's choice:** [auto] Final API call with full context (recommended default)

---

## Claude's Discretion

- Exact system prompt wording
- Loading animation specifics
- Question counter visibility
- Conversation field naming
- Previous Q&A visibility pattern

## Deferred Ideas

None
