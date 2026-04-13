# External Integrations

**Analysis Date:** 2026-04-10

## APIs & External Services

**Backend-as-a-Service:**
- Supabase — database, authentication, and Row Level Security
  - SDK/Client: `@supabase/supabase-js` ^2.103.0
  - Client initialized in `src/lib/supabase.ts` using `createClient`
  - Auth method: `VITE_SUPABASE_ANON_KEY` (public anon key, no service_role)
  - All data access uses RLS policies scoped to `auth.uid()`

## Data Storage

**Databases:**
- Supabase Postgres (hosted)
  - Connection: `VITE_SUPABASE_URL` env var
  - Client: `@supabase/supabase-js` JavaScript client (no ORM layer)
  - Schema defined in `supabase/migrations/001_initial_schema.sql`

**Tables:**
| Table | Relationship | Storage Pattern |
|-------|-------------|----------------|
| `journeys` | Root entity, 1:many with users | Standard columns |
| `phase1` | 1:1 with journeys | JSONB columns per instrument section |
| `phase2` | 1:1 with journeys | JSONB columns per instrument section |
| `phase3_entries` | 1:many with journeys | JSONB columns per instrument section |

All JSONB column payloads are validated with Zod schemas in `src/lib/schemas.ts` before being written to Supabase.

**File Storage:**
- Not used — no Supabase Storage or external file service

**Caching:**
- TanStack Query in-memory cache (`src/main.tsx`)
  - Default stale time: 5 minutes
  - Default retry: 2 attempts
  - Cache invalidated on mutations via `queryClient.invalidateQueries`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password)
  - Implementation: `src/hooks/use-auth.ts`
  - Sign-in: `supabase.auth.signInWithPassword({ email, password })`
  - Sign-up: `supabase.auth.signUp({ email, password })`
  - Session management: `supabase.auth.getSession()` on mount + `supabase.auth.onAuthStateChange` subscription
  - Sign-out: `supabase.auth.signOut()`
  - Auth state exposed app-wide via `useAuth()` hook, consumed in `src/routes/__root.tsx` for route guards
  - No OAuth/social providers configured

**Route Protection:**
- Implemented in `src/routes/__root.tsx` using `useEffect` — unauthenticated users are redirected to `/login`, authenticated users on `/login` are redirected to `/`

## Monitoring & Observability

**Error Tracking:**
- Not detected — no Sentry, Datadog, or similar service

**Logs:**
- None — no logging infrastructure; errors surface through TanStack Query error state and thrown exceptions

## CI/CD & Deployment

**Hosting:**
- Vercel (SPA, static output)
- No `vercel.json` detected in project root

**CI Pipeline:**
- Not detected — no GitHub Actions, CircleCI, or similar config files present

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` — Supabase project URL (e.g., `https://your-project.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

**Template:**
- `.env.example` — committed reference file showing required variable names without values

**Secrets location:**
- `.env` file at project root (present, not committed to git)
- Validated at module load time in `src/lib/supabase.ts` — hard throws if missing

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Auto-Save Behavior

The app implements a client-side auto-save loop in `src/hooks/use-auto-save.ts` that interacts with Supabase:
- Debounced 500ms on any field change
- Flushed immediately on `document.visibilitychange` (tab switch/backgrounding)
- Flushed on `beforeunload`
- `updated_at` column on all phase tables acts as conflict detection for multi-tab safety (updated by a Postgres trigger defined in the migration)

---

*Integration audit: 2026-04-10*
