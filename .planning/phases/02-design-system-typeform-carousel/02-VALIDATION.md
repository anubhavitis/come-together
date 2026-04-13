---
phase: 2
slug: design-system-typeform-carousel
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build verification (`bun run build`) + static grep checks |
| **Config file** | vite.config.ts (TypeScript type-check via `tsc -b`) |
| **Quick run command** | `bun run build` |
| **Full suite command** | `bun run build && grep -r "accent-cool" src/ \|\| echo OK` |
| **Estimated runtime** | ~15 seconds |

**Rationale:** This is a CSS/visual/design-token phase. No business logic, no data transformations, no algorithmic code. The appropriate verification strategy is:
1. **Build verification** — TypeScript type-check + Vite production build catches import errors, type mismatches, and syntax issues.
2. **Static grep checks** — Verify token presence/absence (e.g., no legacy navy colors, no accent-cool references).
3. **Visual checkpoint** — Human verification of the dark luxury aesthetic (Plan 02-04 Task 2).

Unit tests would test DOM structure that is better verified visually. No vitest dependency is needed for this phase.

---

## Sampling Rate

- **After every task commit:** Run `bun run build`
- **After every plan wave:** Run `bun run build` + static grep checks
- **Before `/gsd:verify-work`:** Full build must be green + visual checkpoint approved
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 1 | DSGN-01, DSGN-02, DSGN-05 | build+grep | `bun run build && grep -q '#111110' src/index.css && grep -q 'Inter' src/index.css && grep -q 'text-heading' src/index.css && grep -q 'tracking-heading' src/index.css` | pending |
| 02-01-02 | 01 | 1 | DSGN-03 | build+grep | `bun run build && grep -q 'useReducedMotion' src/hooks/index.ts` | pending |
| 02-02-01 | 02 | 2 | DSGN-04 | build+grep | `bun run build && grep -r 'accent-cool' src/routes/ && exit 1 \|\| echo OK` | pending |
| 02-02-02 | 02 | 2 | DSGN-03 | build+grep | `bun run build && grep -q 'rounded-\[20px\]' src/routes/index.tsx` | pending |
| 02-03-01 | 03 | 2 | CRSL-01, CRSL-02 | build+grep | `bun run build && grep -q 'translateY' src/components/shared/question-carousel.tsx` | pending |
| 02-03-02 | 03 | 2 | CRSL-03 | build+grep | `bun run build && grep -q 'progressbar' src/components/shared/question-carousel.tsx` | pending |
| 02-03-03 | 03 | 2 | CRSL-04 | build+grep | `bun run build && grep -q 'ArrowDown' src/components/shared/question-carousel.tsx && grep -q 'Enter' src/components/shared/question-carousel.tsx` | pending |
| 02-03-04 | 03 | 2 | CRSL-05 | build+grep | `bun run build && grep -q 'aria-live' src/components/shared/question-carousel.tsx` | pending |
| 02-03-05 | 03 | 2 | CRSL-06 | visual | Manual: check 48px touch targets on mobile viewport | pending |
| 02-04-01 | 04 | 2 | DSGN-04 | build+grep | `bun run build && grep -r 'accent-cool' src/components/shared/ && exit 1 \|\| echo OK` | pending |
| 02-04-02 | 04 | 2 | DSGN-01, DSGN-04 | visual | Human visual checkpoint (Plan 04 Task 2) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Not applicable — this phase uses build verification + visual checkpoints, not unit tests.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark luxury visual quality | DSGN-01, DSGN-04 | Warm tone perception is subjective | Open all pages, verify warm (not cool) dark palette |
| 48px mobile touch targets | CRSL-06 | Requires mobile viewport rendering | Open carousel on 375px viewport, verify touch targets |
| Border-radius visual consistency | DSGN-03 | Requires visual inspection across all components | Check all components use 16px+ radius |
| Heading letter-spacing | DSGN-02 | Visual confirmation of compact type scale | Check h2/h3 headings have visibly tighter tracking |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (build command)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
