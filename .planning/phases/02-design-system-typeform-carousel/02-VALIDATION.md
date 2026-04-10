---
phase: 2
slug: design-system-typeform-carousel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (installed in Phase 1) |
| **Config file** | vitest.config.ts (if exists, else vite.config.ts) |
| **Quick run command** | `bun vitest run --reporter=verbose` |
| **Full suite command** | `bun vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun vitest run --reporter=verbose`
- **After every plan wave:** Run `bun vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DSGN-01, DSGN-05 | static | `grep -q 'e60023' src/index.css && grep -q 'Inter' src/index.css` | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | DSGN-02 | static | `grep -q 'default-font-family' src/index.css` | N/A | ⬜ pending |
| 02-01-03 | 01 | 1 | DSGN-03 | visual | Manual: check border-radius on components | N/A | ⬜ pending |
| 02-02-01 | 02 | 1 | DSGN-04 | visual/build | `bun run build` exits 0 | N/A | ⬜ pending |
| 02-03-01 | 03 | 2 | CRSL-01 | unit | `bun vitest run src/components/shared/question-carousel` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | CRSL-02 | unit | `bun vitest run --grep "fade transition"` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | CRSL-03 | unit | `bun vitest run --grep "progress bar"` | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 2 | CRSL-04 | unit | `bun vitest run --grep "keyboard"` | ❌ W0 | ⬜ pending |
| 02-03-05 | 03 | 2 | CRSL-05 | unit | `bun vitest run --grep "aria\|a11y"` | ❌ W0 | ⬜ pending |
| 02-03-06 | 03 | 2 | CRSL-06 | visual | Manual: check 48px touch targets on mobile viewport | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Vitest config verified (from Phase 1 or create if missing)
- [ ] `src/components/shared/__tests__/question-carousel.test.tsx` — stubs for CRSL-01 through CRSL-05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark luxury visual quality | DSGN-01, DSGN-04 | Warm tone perception is subjective | Open all pages, verify warm (not cool) dark palette |
| 48px mobile touch targets | CRSL-06 | Requires mobile viewport rendering | Open carousel on 375px viewport, verify touch targets |
| Border-radius visual consistency | DSGN-03 | Requires visual inspection across all components | Check all components use 16px+ radius |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
