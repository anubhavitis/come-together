# Phase 3: Right Now (In-Trip Check-In) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 03-right-now-in-trip-check-in
**Areas discussed:** Question design & instrument mapping, Response-to-score mapping, Intention sentence display, Free-text UX
**Mode:** Auto (--auto flag, all recommended defaults selected)

---

## Question Design & Instrument Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Composite questions | 10 questions each targeting 1-2 constructs from MEQ-30/EDI/EBI | ✓ |
| Direct instrument items | Present actual validated instrument items verbatim | |
| AI-interpreted free-text | Let AI map free responses to scores (like Phase 1) | |

**User's choice:** [auto] Composite questions (recommended default)
**Notes:** Deterministic mapping, testable, conversational tone. 44 instrument items compressed into 10 questions via construct-level targeting.

---

## Response-to-Score Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined answer-score lookup | Each option has hidden score mappings in data file | ✓ |
| Formula-based scoring | Compute scores from answer ordinal positions | |
| AI interpretation | Use Claude to map answers to instrument scores | |

**User's choice:** [auto] Predefined answer-score lookup (recommended default)
**Notes:** Deterministic, testable, no AI dependency. Score mappings defined alongside questions.

---

## Intention Sentence Display

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle banner above carousel | Warm secondary text, non-intrusive reminder | ✓ |
| Persistent sidebar | Always-visible side panel with intention | |
| Only on first question | Show once at start, then hide | |

**User's choice:** [auto] Subtle banner above carousel (recommended default)
**Notes:** Matches RN-04 grounding anchor requirement. Present throughout but visually quiet.

---

## Free-Text "Type Your Own" UX

| Option | Description | Selected |
|--------|-------------|----------|
| Expandable toggle below options | Collapsed by default, "Type your own" reveals text input | ✓ |
| Always-visible input | Text input always shown alongside options | |
| Replace last option | Last option is always "Other (describe)" | |

**User's choice:** [auto] Expandable toggle below options (recommended default)
**Notes:** Matches RN-02. Doesn't clutter the meditative one-question-at-a-time UX.

---

## Claude's Discretion

- Exact question text and answer options
- Option button visual styling
- Completion summary after question 10
- Selection animation timing

## Deferred Ideas

None -- discussion stayed within phase scope
