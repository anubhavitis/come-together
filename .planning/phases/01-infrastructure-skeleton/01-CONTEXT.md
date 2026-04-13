# Phase 1: Infrastructure Skeleton - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a working Vercel serverless API layer at `/api/chat` that accepts authenticated requests and returns Claude Haiku responses, with a seamless local development experience via Vite dev proxy. This phase produces the server-side skeleton that Phases 4 and 5 (AI conversations) will build on.

</domain>

<decisions>
## Implementation Decisions

### Serverless Function Approach
- **D-01:** Use Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) with Node.js runtime for the `/api/chat` serverless function. The `generateText` helper fits the "all at once" response requirement — no streaming needed in Phase 1.
- **D-02:** Single serverless function file at `api/chat.ts` (Vercel's file-based routing convention). No framework overhead (no Express, no Hono).

### Auth Verification
- **D-03:** Create a Supabase client with `service_role` key server-side to verify the user's access token via `auth.getUser(token)`. The service_role key is stored as a Vercel env var (never `VITE_` prefixed, never in client bundle).
- **D-04:** Client sends the Supabase access token in the `Authorization: Bearer <token>` header. Serverless function extracts and verifies before making any AI call.

### API Response Contract
- **D-05:** `/api/chat` returns simple JSON: `{ message: string }` on success, `{ error: string }` on failure. No streaming. Status codes: 200 (success), 401 (unauthorized), 500 (AI error).
- **D-06:** Request body shape: `{ messages: Array<{ role: 'user' | 'assistant', content: string }> }` — conversation history for context. System prompt is server-side only.

### Local Development
- **D-07:** Vite `server.proxy` forwards `/api/*` to `vercel dev` running on a separate port (e.g., 3001). This keeps the dev experience transparent — the React app hits `/api/chat` the same way in dev and production.
- **D-08:** Add `vercel` as a dev dependency for local serverless function emulation.

### Claude's Discretion
- Error response shape details (beyond the basic `{ error: string }`)
- Exact system prompt content (placeholder is fine for Phase 1 skeleton)
- Whether to add rate limiting at this stage (likely skip for v1 skeleton)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & Requirements
- `DESIGN.md` -- Full design language reference (dark luxury aesthetic context)
- `.planning/PROJECT.md` -- Project vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` -- INFRA-01 through INFRA-04 are this phase's requirements

### Existing Code
- `src/lib/supabase.ts` -- Existing Supabase client (anon key pattern to reference)
- `vite.config.ts` -- Current Vite config that needs proxy addition
- `package.json` -- Current dependencies (no AI SDK yet)

### External Docs (for researcher)
- Vercel AI SDK documentation (ai-sdk.dev) -- `generateText` API, Anthropic provider setup
- Vercel serverless functions documentation -- file-based routing in `api/` directory
- Supabase auth documentation -- `auth.getUser()` server-side verification pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase.ts` -- Pattern for creating Supabase clients with env var validation. Server-side function will follow same pattern but with `service_role` key.
- `src/hooks/use-auth.ts` -- Client-side auth hook that provides the access token to forward to the API.

### Established Patterns
- Environment variables validated at module init with explicit throw (see `supabase.ts` lines 6-8)
- All client-side data fetching uses TanStack Query hooks in `src/hooks/`
- Zod schemas validate data at app boundary (`src/lib/schemas.ts`)

### Integration Points
- New `api/chat.ts` serverless function (does not exist yet -- new directory)
- `vite.config.ts` needs `server.proxy` configuration for `/api/*`
- Future phases will create a TanStack Query hook (e.g., `use-chat.ts`) that calls `/api/chat`
- `package.json` needs new dependencies: `ai`, `@ai-sdk/anthropic`, `vercel` (dev)
- `.env` / `.env.example` need new server-side vars: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

</code_context>

<specifics>
## Specific Ideas

- The API should use `generateText` (not `streamText`) from Vercel AI SDK to match the "all at once" response requirement
- Anthropic API key must never be `VITE_` prefixed -- this is a hard security constraint
- The skeleton should be minimal but functional: a real AI response, not a mock

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-infrastructure-skeleton*
*Context gathered: 2026-04-10*
