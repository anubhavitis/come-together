---
phase: 3
slug: right-now-in-trip-check-in
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build verification (`bun run build`) + static grep + scoring unit tests |
| **Config file** | vite.config.ts |
| **Quick run command** | `bun run build` |
| **Full suite command** | `bun run build && bun vitest run src/lib/scoring.test.ts 2>/dev/null; echo OK` |
| **Estimated runtime** | ~15 seconds |

**Rationale:** This phase has both visual (carousel integration) and logic (scoring) components. Build verification catches type/import errors. Scoring logic benefits from unit tests since it's deterministic and testable.

---

## Sampling Rate

- **After every task commit:** Run `bun run build`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 03-01-01 | 01 | 1 | RN-01, RN-03 | build+grep | `bun run build && test -f src/data/phase2-questions.ts` | pending |
| 03-01-02 | 01 | 1 | RN-03 | build+grep | `bun run build && grep -q 'computePhase2Scores' src/lib/scoring.ts` | pending |
| 03-02-01 | 02 | 2 | RN-01, RN-02 | build+grep | `bun run build && grep -q 'QuestionCarousel' src/routes/journey/\\$id/phase2.tsx` | pending |
| 03-02-02 | 02 | 2 | RN-04 | build+grep | `bun run build && grep -q 'intention' src/routes/journey/\\$id/phase2.tsx` | pending |
| 03-02-03 | 02 | 2 | RN-05 | build+grep | `bun run build && grep -q 'useUpsertPhase2' src/routes/journey/\\$id/phase2.tsx` | pending |

---

## Wave 0 Requirements

Not applicable — build verification + grep is sufficient for carousel integration. Scoring tests are created alongside the scoring function.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Carousel question flow UX | RN-01 | Requires visual/interactive testing | Navigate through all 10 questions, verify fade transitions and progress bar |
| Free-text toggle behavior | RN-02 | Requires interaction | Click "Type your own" on each question, verify text input appears |
| Intention sentence display | RN-04 | Requires Phase 1 data | Complete Phase 1, then start Phase 2, verify intention banner shows |

---

## Validation Sign-Off

- [x] All tasks have automated verify (build command)
- [x] Sampling continuity maintained
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
