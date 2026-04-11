# Phase 8: End-to-End Validation - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that the AI conversation flows (Phase 1 "Come Together" and Phase 3 "Over Me") work correctly through the proxy. Verify that SWEMWBS and Integration Scales score extraction (`<!--SCORES:...-->` pattern) works reliably with the target model. This is a testing/validation phase — no new features, only verification scripts and test results.

</domain>

<decisions>
## Implementation Decisions

### Validation Approach
- **D-01:** Create automated test scripts (using Vitest or standalone Node/Bun scripts) that call the `/api/chat` endpoint with sample conversation payloads and verify response structure.
- **D-02:** Tests run against the local dev server (`bun dev` + `vercel dev` or proxy). They test the real API endpoint, not mocked responses.
- **D-03:** Each test sends a multi-turn conversation simulating a real user session and checks: (a) response has `message` field, (b) AI response contains `<!--SCORES:...-->` block, (c) scores are valid JSON with expected keys.

### Score Extraction Validation
- **D-04:** For Phase 1 validation (VAL-01): send 2-3 user messages about wellbeing topics, check that SWEMWBS items appear in the score blocks. Don't require all 7 items — the AI scores progressively.
- **D-05:** For Phase 3 validation (VAL-02): send messages with `phase: 'phase3'` and `phase3_context` containing sample Phase 1/2 data. Check that `integration_engaged` and `integration_experienced` keys appear in scores.
- **D-06:** For reliability (VAL-03): run the test 3 times consecutively. All 3 must produce parseable score blocks without failures.

### Test Infrastructure
- **D-07:** Create test files in `tests/` or `src/__tests__/` directory. Use `fetch` to call the local API endpoint. These are integration tests, not unit tests.
- **D-08:** Tests require `ANTHROPIC_API_KEY` (or proxy) to be configured — they call real AI. Skip gracefully if no API key is available.
- **D-09:** Test results are logged to console. A test script exit code of 0 = pass, non-zero = fail.

### Claude's Discretion
- Exact test conversation messages (as long as they elicit scoreable responses)
- Whether to use Vitest or standalone Bun scripts
- Whether to add a `bun test:e2e` script to package.json
- How to handle API rate limits during consecutive test runs

</decisions>

<canonical_refs>
## Canonical References

### Existing Code
- `api/chat.ts` — The endpoint being tested (with configurable proxy)
- `src/lib/score-parser.ts` — Score extraction utilities to use in tests
- `.env.example` — Required env vars for tests

### Prior Phase
- `.planning/phases/07-proxy-server-app-integration/07-CONTEXT.md` — Proxy integration decisions

### Requirements
- `.planning/REQUIREMENTS.md` — VAL-01, VAL-02, VAL-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable
- `parseScoresFromResponse` — can be used in tests to validate score extraction
- `stripScoresFromResponse` — verify clean text output
- `aggregateSwemwbsScores` / `aggregateIntegrationScores` — verify aggregation logic

### Integration Points
- New test files in `tests/` directory
- Optional `package.json` script addition

</code_context>

<specifics>
## Specific Ideas

- Tests should be practical, not exhaustive. 2-3 conversation turns per test is enough to verify the pipeline works.
- The goal is confidence that the proxy doesn't break existing behavior, not comprehensive coverage of every question.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 08-end-to-end-validation*
*Context gathered: 2026-04-11*
