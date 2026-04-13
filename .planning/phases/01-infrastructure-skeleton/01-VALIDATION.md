---
phase: 1
slug: infrastructure-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (Wave 0 installs) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `bun vitest run --reporter=verbose` |
| **Full suite command** | `bun vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun vitest run --reporter=verbose`
- **After every plan wave:** Run `bun vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | INFRA-01 | unit | `bun vitest run api/` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | INFRA-02 | unit | `bun vitest run api/` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | INFRA-04 | integration | `bun vitest run api/` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | INFRA-03 | static | `grep -r VITE_ANTHROPIC dist/ api/` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install vitest and configure `vitest.config.ts`
- [ ] `api/__tests__/chat.test.ts` — stubs for INFRA-01, INFRA-02, INFRA-04
- [ ] Test helper for mocking Supabase auth and Anthropic responses

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vite proxy forwards to vercel dev | INFRA-03 | Requires two running servers | Start `vercel dev --listen 3001`, start `bun dev`, verify `/api/chat` responds |
| API key not in client bundle | INFRA-02 | Requires production build inspection | Run `bun run build`, grep `dist/` for API key patterns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
