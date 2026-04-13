# Phase 1: Infrastructure Skeleton - Research

**Researched:** 2026-04-10
**Domain:** Vercel serverless functions, Vercel AI SDK, Supabase server-side auth, Vite dev proxy
**Confidence:** HIGH

## Summary

This phase creates a serverless API endpoint at `/api/chat` that receives authenticated requests from the React SPA and returns Claude Haiku responses using the Vercel AI SDK. The stack is well-documented and straightforward: a single TypeScript file in the `api/` directory using Vercel's Web API handler pattern, the `ai` + `@ai-sdk/anthropic` packages for AI generation, and a Supabase service_role client for server-side auth verification.

The main technical nuance is local development: Vite's `server.proxy` must forward `/api/*` requests to `vercel dev` running on a separate port. In production on Vercel, the `api/` directory is deployed as serverless functions automatically -- no rewrites needed since the SPA and functions share the same origin.

The `api/` directory needs its own `tsconfig.json` because `tsconfig.app.json` includes only `src/` and uses `vite/client` types (which provide `import.meta.env`). The serverless function runs in Node.js and needs `process.env` instead.

**Primary recommendation:** Use `ai@6.x` + `@ai-sdk/anthropic@3.x` with `generateText()`, Vercel Web API handler pattern (`export function POST`), and Vite `server.proxy` pointing to `vercel dev --listen 3001`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) with Node.js runtime for the `/api/chat` serverless function. The `generateText` helper fits the "all at once" response requirement -- no streaming needed in Phase 1.
- **D-02:** Single serverless function file at `api/chat.ts` (Vercel's file-based routing convention). No framework overhead (no Express, no Hono).
- **D-03:** Create a Supabase client with `service_role` key server-side to verify the user's access token via `auth.getUser(token)`. The service_role key is stored as a Vercel env var (never `VITE_` prefixed, never in client bundle).
- **D-04:** Client sends the Supabase access token in the `Authorization: Bearer <token>` header. Serverless function extracts and verifies before making any AI call.
- **D-05:** `/api/chat` returns simple JSON: `{ message: string }` on success, `{ error: string }` on failure. No streaming. Status codes: 200 (success), 401 (unauthorized), 500 (AI error).
- **D-06:** Request body shape: `{ messages: Array<{ role: 'user' | 'assistant', content: string }> }` -- conversation history for context. System prompt is server-side only.
- **D-07:** Vite `server.proxy` forwards `/api/*` to `vercel dev` running on a separate port (e.g., 3001). This keeps the dev experience transparent -- the React app hits `/api/chat` the same way in dev and production.
- **D-08:** Add `vercel` as a dev dependency for local serverless function emulation.

### Claude's Discretion
- Error response shape details (beyond the basic `{ error: string }`)
- Exact system prompt content (placeholder is fine for Phase 1 skeleton)
- Whether to add rate limiting at this stage (likely skip for v1 skeleton)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Vercel serverless function at `/api/chat` accepts conversation context and returns Claude Haiku AI response | Vercel Web API handler pattern (`export function POST`) + `generateText()` from `ai` package with `@ai-sdk/anthropic` provider |
| INFRA-02 | Anthropic API key stored as server-side env var only (never `VITE_` prefixed, never in client bundle) | `ANTHROPIC_API_KEY` read via `process.env` in `api/chat.ts`; Vercel auto-compiles `api/` files separate from Vite bundle; separate tsconfig confirms no `import.meta.env` access |
| INFRA-03 | Vite dev proxy forwards `/api/*` requests to local serverless function for development | Vite `server.proxy` config targeting `vercel dev --listen 3001`; no path rewrite needed since Vercel functions already live at `/api/*` |
| INFRA-04 | Auth token forwarded from client to serverless function and verified via Supabase before AI calls | Server-side Supabase client with `service_role` key calls `auth.getUser(jwt)` to verify the Bearer token; returns 401 on failure |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Runtime:** Bun is the package manager (`bun add`, not `npm install`)
- **No service_role on client:** The service_role key is server-side only (env var in Vercel, never `VITE_` prefixed)
- **File naming:** kebab-case for lib/hook files, PascalCase for components
- **Code style in api/:** Since `api/chat.ts` is a new directory outside `src/`, follow the `src/lib/` style: no semicolons, single quotes
- **Import type:** Use `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- **Error handling:** Explicit error handling, no silent swallowing, throw to bubble up
- **Env var validation:** Validate required env vars at module init with explicit throw (follows `supabase.ts` pattern)
- **Deploy target:** Vercel SPA
- **No test framework configured yet** -- nyquist validation must account for Wave 0 setup

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | 6.0.156 | Vercel AI SDK core -- `generateText()` | Official Vercel SDK, framework-agnostic, works in any Node.js environment |
| `@ai-sdk/anthropic` | 3.0.68 | Anthropic provider for AI SDK | Official provider, reads `ANTHROPIC_API_KEY` automatically |
| `@supabase/supabase-js` | 2.103.0 (already installed) | Server-side Supabase client for auth verification | Already in use client-side; same package creates the service_role client |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vercel` | 50.43.0 | Local serverless function emulation via `vercel dev` | Dev dependency only -- provides local `/api/*` function runtime |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | Direct Anthropic SDK (`@anthropic-ai/sdk`) | AI SDK provides unified interface; if project later adds OpenAI or other models, no rewrite needed. AI SDK is the locked decision. |
| `auth.getUser(jwt)` | `auth.getClaims()` | `getClaims()` is faster (cached JWKS verification vs network call), but `getUser()` is more trustworthy for authorization decisions. For a skeleton, `getUser()` is simpler and safer. Can optimize later. |

**Installation:**
```bash
bun add ai @ai-sdk/anthropic
bun add -d vercel
```

**Version verification:** Versions confirmed against npm registry on 2026-04-10:
- `ai`: 6.0.156
- `@ai-sdk/anthropic`: 3.0.68
- `vercel`: 50.43.0

## Architecture Patterns

### Recommended Project Structure
```
api/
└── chat.ts              # Vercel serverless function (POST /api/chat)
api/
└── tsconfig.json        # Separate tsconfig for Node.js runtime (no DOM, no vite/client)
src/
├── lib/
│   └── supabase.ts      # Existing client-side Supabase client (unchanged)
├── hooks/
│   └── use-auth.ts      # Existing auth hook (provides access token)
└── ...
.env                     # Add ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY
.env.example             # Add placeholder entries for new vars
vercel.json              # SPA rewrite rule for client-side routing
```

### Pattern 1: Vercel Web API Handler (for non-framework projects)
**What:** Vercel serverless functions for projects without Next.js use Web Standard Request/Response APIs with named HTTP method exports.
**When to use:** Any file in `api/` directory.
**Example:**
```typescript
// Source: https://vercel.com/docs/functions/functions-api-reference
// api/chat.ts -- named export for POST method
export async function POST(request: Request) {
  const body = await request.json()
  // ... process request
  return Response.json({ message: 'response' })
}
```

**Important:** For non-framework Vercel projects, there are two patterns:
1. **Named HTTP method exports** (`export function POST`, `export function GET`) -- handles specific methods
2. **Default fetch export** (`export default { fetch(request) {} }`) -- handles all methods in one function

Use pattern 1 (named POST export) since `/api/chat` only needs POST.

### Pattern 2: Server-Side Supabase Client
**What:** Create a Supabase client with `service_role` key for server-side auth verification.
**When to use:** In any serverless function that needs to verify user tokens.
**Example:**
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-getuser
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Verify user from Bearer token
async function verifyUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}
```

### Pattern 3: Vite Dev Proxy
**What:** Configure Vite's dev server to forward `/api/*` requests to `vercel dev`.
**When to use:** Local development only (proxy has no effect in production).
**Example:**
```typescript
// vite.config.ts
export default defineConfig({
  // ... existing plugins
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

No `rewrite` needed -- `/api/chat` on Vite proxies to `/api/chat` on Vercel dev, which maps directly to `api/chat.ts`.

### Anti-Patterns to Avoid
- **Using `import.meta.env` in `api/` files:** Serverless functions run in Node.js, not Vite. Use `process.env`.
- **Putting the service_role key in a `VITE_` variable:** Anything prefixed `VITE_` is embedded in the client bundle. Service role key must be `SUPABASE_SERVICE_ROLE_KEY` (no prefix).
- **Sharing tsconfig between `src/` and `api/`:** The app tsconfig includes `vite/client` types and DOM lib; serverless functions need Node.js types. A shared config causes type conflicts.
- **Using `export default function handler(req, res)`:** This is the legacy Vercel function pattern (Express-style). Use the Web API pattern with named HTTP exports or `export default { fetch }`.
- **Creating the Supabase admin client per-request:** Module-level initialization reuses the client across warm invocations. Only create it once at the top of the file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI text generation | Custom Anthropic HTTP client | `generateText()` from `ai` | Handles retries, token counting, response parsing, model switching |
| Auth token extraction | Manual JWT parsing/verification | `supabase.auth.getUser(jwt)` | Handles token format changes, expiry, revocation |
| Local serverless emulation | Custom Express server mimicking Vercel | `vercel dev` | Exact production parity, handles function compilation |
| API key management | Custom env loading | `process.env` (Vercel injects at runtime) | Vercel handles env var injection, encryption at rest |

**Key insight:** This phase is glue code between well-tested services (Vercel, Anthropic, Supabase). Every component has an official SDK. Hand-rolling any of these introduces bugs that the SDKs have already solved.

## Common Pitfalls

### Pitfall 1: VITE_ Prefix Leaks Server Secrets
**What goes wrong:** Developer adds `VITE_ANTHROPIC_API_KEY` thinking it needs the prefix for Vite to see it. The key is now embedded in the client JavaScript bundle, publicly visible.
**Why it happens:** Existing env vars in this project all use `VITE_` prefix because they were client-side only.
**How to avoid:** Server-side env vars MUST NOT have `VITE_` prefix. Name them `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Document in `.env.example`.
**Warning signs:** `grep -r "VITE_ANTHROPIC\|VITE_SERVICE_ROLE" src/` returns matches.

### Pitfall 2: TypeScript Config Conflict
**What goes wrong:** Adding `api/` to `tsconfig.app.json` include list causes type errors because `vite/client` types conflict with Node.js types, or `import.meta.env` doesn't exist in the serverless runtime.
**Why it happens:** `tsconfig.app.json` is configured for browser code (DOM lib, vite/client types).
**How to avoid:** Create a separate `api/tsconfig.json` with Node.js types and no DOM lib. Add it as a reference in the root `tsconfig.json`.
**Warning signs:** Type errors about `import.meta.env` or missing DOM types in api files.

### Pitfall 3: Vercel Dev Port Collision
**What goes wrong:** Both `vite` and `vercel dev` default to port 3000 or 5173, causing one to fail.
**Why it happens:** Neither tool coordinates ports with the other.
**How to avoid:** Run `vercel dev --listen 3001` on an explicit port. Configure Vite proxy to target `http://localhost:3001`. Document the two-terminal dev workflow.
**Warning signs:** "Port already in use" errors, or API requests returning HTML (hitting Vite instead of Vercel).

### Pitfall 4: Missing CORS Headers in Vercel Dev
**What goes wrong:** Browser blocks requests from `localhost:5173` (Vite) to `localhost:3001` (Vercel dev) due to CORS.
**Why it happens:** Cross-origin requests between different ports.
**How to avoid:** Vite's proxy handles this automatically -- the browser sees requests going to the same origin (`localhost:5173`). Do NOT call `localhost:3001` directly from client code. Always use relative `/api/chat` URLs.
**Warning signs:** CORS errors in browser console during development.

### Pitfall 5: Vercel Ignoring api/ Directory
**What goes wrong:** Vercel does not detect or deploy the serverless functions because the project is configured as a Vite SPA without the Vercel framework adapter.
**Why it happens:** Vercel may auto-detect the project as a static site and skip function compilation.
**How to avoid:** Add a `vercel.json` with the SPA rewrite rule. Vercel will then detect and compile files in `api/` alongside the static output.
**Warning signs:** 404 on `/api/chat` in production despite working locally.

## Code Examples

### Complete api/chat.ts Skeleton
```typescript
// Source: Vercel Functions API + AI SDK Anthropic provider docs
import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

// Env var validation (follows project pattern from src/lib/supabase.ts)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}
if (!anthropicKey) {
  throw new Error('Missing ANTHROPIC_API_KEY')
}

// Server-side Supabase client (service_role bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SYSTEM_PROMPT = 'You are a warm, thoughtful guide...' // Placeholder

export async function POST(request: Request) {
  // 1. Verify auth
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // 2. Parse request body
  const { messages } = await request.json()

  // 3. Generate AI response
  try {
    const { text } = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      system: SYSTEM_PROMPT,
      messages,
    })

    return Response.json({ message: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
```

### Vite Config Proxy Addition
```typescript
// vite.config.ts -- add server.proxy to existing config
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss(), TanStackRouterVite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### api/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["."]
}
```

### vercel.json (SPA + Functions)
```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### .env.example Additions
```
# Server-side only (Vercel env vars, NOT VITE_ prefixed)
ANTHROPIC_API_KEY=sk-ant-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Note: `SUPABASE_URL` is the same URL as `VITE_SUPABASE_URL` but without the `VITE_` prefix for server-side access via `process.env`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI SDK v4/v5 with `generateText` | AI SDK v6 -- same `generateText` API, minor type changes | AI SDK 6.0 (early 2026) | Migration is minimal; `generateText` signature unchanged for basic use |
| `export default function(req, res)` (Express-style Vercel handler) | `export function POST(request: Request)` (Web API standard) | Vercel 2024-2025 | Use Web API pattern; legacy pattern still works but is not recommended |
| `supabase.auth.getUser()` only | `supabase.auth.getClaims()` added as faster alternative | Supabase JS 2.x (2025) | `getUser()` is still correct for server-side; `getClaims()` is optional optimization |

**Deprecated/outdated:**
- Express-style Vercel handlers (`req, res` pattern): Still works but Web API pattern is the current standard
- AI SDK v4 import paths: v6 is current; v4/v5 patterns may not work

## Open Questions

1. **Claude 3.5 Haiku vs Claude 3 Haiku model ID**
   - What we know: `claude-3-haiku-20240307` is the documented model ID on the AI SDK Anthropic provider page. Claude 3.5 Haiku (`claude-3-5-haiku-20241022`) exists and is newer.
   - What's unclear: Whether to use 3.0 or 3.5 Haiku for cost/quality tradeoff.
   - Recommendation: Use `claude-3-5-haiku-20241022` for better quality at still-low cost. The model ID is a string constant, trivially changeable. Make it a named constant at the top of the file.

2. **`vercel dev` with Bun runtime**
   - What we know: `vercel` CLI 48.12.0 is installed globally. The project uses Bun as primary runtime.
   - What's unclear: Whether `vercel dev` properly handles the `api/` directory with Bun, or if it falls back to Node.js for function compilation.
   - Recommendation: Vercel functions run in Node.js runtime regardless of local package manager. This is fine -- `api/chat.ts` uses no Bun-specific APIs.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Package manager, dev server | Yes | 1.2.8 | -- |
| Node.js | Vercel serverless runtime | Yes | 25.8.1 | -- |
| Vercel CLI | Local serverless function emulation | Yes (global) | 48.12.0 | Install as dev dep |
| Anthropic API key | AI generation | Not verified | -- | Must be provided by user in `.env` |
| Supabase service_role key | Server-side auth verification | Not verified | -- | Must be obtained from Supabase dashboard |

**Missing dependencies with no fallback:**
- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must be provided by the user. The skeleton should validate their presence and throw clear errors.

**Missing dependencies with fallback:**
- `vercel` CLI is globally installed (48.12.0) but CONTEXT.md decision D-08 says to add as dev dependency. Install it as both for reliability: `bun add -d vercel`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected -- Wave 0 must install one |
| Config file | None -- see Wave 0 |
| Quick run command | TBD after framework selection |
| Full suite command | TBD after framework selection |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | POST /api/chat returns AI response given valid auth + messages | integration | TBD | No -- Wave 0 |
| INFRA-02 | ANTHROPIC_API_KEY not in client bundle, not VITE_ prefixed | smoke (grep) | `grep -r "VITE_ANTHROPIC\|VITE_SERVICE_ROLE" src/ && exit 1 \|\| exit 0` | No -- Wave 0 |
| INFRA-03 | Vite proxy forwards /api/* to vercel dev | manual | Start both servers, hit /api/chat from browser | N/A (manual) |
| INFRA-04 | Request without valid auth token returns 401 | integration | TBD | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** Manual curl test against running servers
- **Per wave merge:** Full test suite (once framework is set up)
- **Phase gate:** All four success criteria from phase description verified

### Wave 0 Gaps
- [ ] Select and install test framework (Vitest recommended -- same Vite ecosystem, zero extra config)
- [ ] Create `tests/api/chat.test.ts` -- covers INFRA-01, INFRA-04
- [ ] Create smoke test script for INFRA-02 (grep for leaked env var names)
- [ ] INFRA-03 is manual verification (proxy config is static, not unit-testable)

**Note on test framework:** The project has no test framework. Vitest is the natural choice given the Vite ecosystem. However, serverless function tests may need a different runner since `api/chat.ts` runs in Node.js, not Vite. Vitest can handle both with proper config. Alternatively, a simple integration test using `fetch` against a running `vercel dev` instance works for this skeleton phase.

## Sources

### Primary (HIGH confidence)
- [Vercel Functions API Reference](https://vercel.com/docs/functions/functions-api-reference) -- Web API handler pattern, named exports, TypeScript support
- [Vercel Functions Quickstart](https://vercel.com/docs/functions/quickstart) -- `export default { fetch }` pattern for non-framework projects
- [AI SDK Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) -- `generateText()`, model IDs, env var configuration
- [Supabase auth.getUser docs](https://supabase.com/docs/reference/javascript/auth-getuser) -- JWT parameter for server-side verification
- [Vite Server Options](https://vite.dev/config/server-options) -- `server.proxy` configuration

### Secondary (MEDIUM confidence)
- [AI SDK 6 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) -- Breaking changes from v5 to v6 (minimal for `generateText`)
- [Vercel + Vite + vercel dev discussion](https://github.com/vercel/vercel/discussions/6538) -- Two-server local dev approach with port separation
- [npm registry](https://www.npmjs.com/package/ai) -- Version verification for `ai@6.0.156`, `@ai-sdk/anthropic@3.0.68`

### Tertiary (LOW confidence)
- Claude 3.5 Haiku model ID (`claude-3-5-haiku-20241022`) -- from training data, not verified against current Anthropic docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- packages verified on npm, official docs reviewed
- Architecture: HIGH -- Vercel function pattern well-documented, existing codebase patterns clear
- Pitfalls: HIGH -- common issues documented in multiple community discussions
- Test framework: MEDIUM -- Vitest is the obvious choice but no prior art in this project

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (30 days -- stable ecosystem, unlikely to change)
