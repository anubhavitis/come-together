# Phase 7: Proxy Server & App Integration - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the claude-code-proxy server (clone, configure, run) and modify the app's API layer to route AI requests through it. The proxy sits between the app and the LLM backend, providing a configurable routing layer. The app change is minimal — a single import swap and env var addition in `api/chat.ts`.

</domain>

<decisions>
## Implementation Decisions

### Proxy Server Setup
- **D-01:** Clone `https://github.com/fuergaosi233/claude-code-proxy` into the project or as a sibling directory. Document the setup steps clearly.
- **D-02:** Configure the proxy with the correct API key and model routing. Set `SMALL_MODEL` to target Claude Haiku (or the user's preferred backend model).
- **D-03:** For development: run the proxy locally (`python -m uvicorn` or Docker). For production: document Railway/Fly.io deployment but don't require it for this phase to pass.
- **D-04:** The proxy must expose an endpoint compatible with the Anthropic Messages API format at a known URL (e.g., `http://localhost:8000`).

### App Integration
- **D-05:** In `api/chat.ts`, swap `import { anthropic } from '@ai-sdk/anthropic'` for `import { createAnthropic } from '@ai-sdk/anthropic'`. Create a provider instance: `const anthropicProvider = createAnthropic({ baseURL: process.env.ANTHROPIC_BASE_URL })` when the env var is set, or use the default provider when it's not.
- **D-06:** The model ID stays the same (`claude-3-5-haiku-20241022`). The proxy handles model routing on its end.
- **D-07:** All existing system prompts, message formats, and response parsing remain unchanged. The only change is the transport layer (where the request goes).

### Fallback Behavior
- **D-08:** When `ANTHROPIC_BASE_URL` is not set, the app falls back to direct Anthropic API calls (current behavior). This preserves backward compatibility and lets the app work without the proxy.
- **D-09:** When `ANTHROPIC_BASE_URL` is set but the proxy is unreachable, the 500 error handling in `api/chat.ts` already covers this — the error propagates to the client as `{ error: "AI generation failed" }`.

### Environment Variables
- **D-10:** Add one new server-side env var: `ANTHROPIC_BASE_URL`. Never `VITE_` prefixed.
- **D-11:** Update `.env.example` to document `ANTHROPIC_BASE_URL` with usage instructions and example value.
- **D-12:** The `ANTHROPIC_API_KEY` env var remains — it's still needed whether routing through the proxy or directly to Anthropic.

### Claude's Discretion
- Whether to include a Docker Compose file for local proxy setup
- Whether to add a health check endpoint call on app startup
- Exact proxy configuration file structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Code
- `api/chat.ts` -- Current serverless function. The ONLY file that needs code changes.
- `.env.example` -- Current env var documentation. Needs `ANTHROPIC_BASE_URL` added.

### Research
- `.planning/research/PROXY-RESEARCH.md` -- Proxy architecture, API format translation, deployment options

### Requirements
- `.planning/REQUIREMENTS.md` -- PROXY-01 through PROXY-03, APINT-01 through APINT-03

### External
- https://github.com/fuergaosi233/claude-code-proxy -- Proxy source repository
- AI SDK Anthropic Provider docs -- `createAnthropic({ baseURL })` API

</canonical_refs>

<code_context>
## Existing Code Insights

### What Changes
- `api/chat.ts` — One import swap + conditional provider creation. ~5 lines of code change.
- `.env.example` — Add one line.

### What Stays the Same
- All system prompts (PHASE1_SYSTEM_PROMPT, PHASE3_SYSTEM_PROMPT)
- All message formats and response parsing
- All client-side code (hooks, routes, components)
- Auth verification flow
- Score extraction (`<!--SCORES:...-->` pattern)

### Integration Points
- `api/chat.ts` line 3: `import { anthropic } from '@ai-sdk/anthropic'` → needs to become configurable
- `api/chat.ts` model call: `anthropic('claude-3-5-haiku-20241022')` → needs to use the configurable provider

</code_context>

<specifics>
## Specific Ideas

- This is intentionally a minimal change. The proxy is a deployment/infrastructure concern, not a code architecture change.
- The app should work identically with or without the proxy — the only difference is where requests go.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 07-proxy-server-app-integration*
*Context gathered: 2026-04-11*
