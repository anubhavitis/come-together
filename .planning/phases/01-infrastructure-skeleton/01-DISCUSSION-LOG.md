# Phase 1: Infrastructure Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 01-infrastructure-skeleton
**Areas discussed:** Serverless function approach, Auth verification method, API response contract, Local dev environment
**Mode:** Auto (--auto flag, all recommended defaults selected)

---

## Serverless Function Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel AI SDK + Node.js runtime | Use `ai` + `@ai-sdk/anthropic` with `generateText` helper | ✓ |
| Plain fetch to Anthropic API | Direct HTTP calls without SDK abstraction | |
| Edge runtime | Vercel Edge Functions for lower latency | |

**User's choice:** [auto] Vercel AI SDK + Node.js runtime (recommended default)
**Notes:** Planned dependency per PROJECT.md. `generateText` fits the "all at once" (no streaming) requirement. Node.js runtime has better library compatibility than Edge.

---

## Auth Verification Method

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase service_role client | Create server-side Supabase client, call `auth.getUser(token)` | ✓ |
| Manual JWT verification | Decode and verify JWT using Supabase JWT secret | |
| Supabase Edge Functions | Move API to Supabase Edge Functions instead of Vercel | |

**User's choice:** [auto] Supabase service_role client (recommended default)
**Notes:** More reliable than manual JWT parsing. Service_role key stays server-side only. Consistent with Supabase auth patterns.

---

## API Response Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Simple JSON `{ message }` | Minimal response shape, no streaming | ✓ |
| Vercel AI SDK streaming | Use `streamText` with streaming response | |
| Envelope pattern `{ success, data, error }` | Richer response with metadata | |

**User's choice:** [auto] Simple JSON `{ message }` (recommended default)
**Notes:** Matches "all at once" requirement (CT-03). Minimal for skeleton phase. Can be enriched later if needed.

---

## Local Dev Environment

| Option | Description | Selected |
|--------|-------------|----------|
| Vite proxy to `vercel dev` | Vite `server.proxy` forwards `/api/*` to local Vercel emulator | ✓ |
| Standalone Express server | Separate dev server mimicking the API | |
| Vite middleware plugin | Custom Vite plugin to handle API routes in-process | |

**User's choice:** [auto] Vite proxy to `vercel dev` (recommended default)
**Notes:** Closest to production behavior. Transparent to React app -- same `/api/chat` URL in dev and production.

---

## Claude's Discretion

- Error response details beyond basic `{ error: string }`
- System prompt content (placeholder for skeleton)
- Rate limiting (skip for v1 skeleton)

## Deferred Ideas

None -- discussion stayed within phase scope
