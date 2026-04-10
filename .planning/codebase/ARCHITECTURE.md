# Architecture

**Analysis Date:** 2026-04-10

## Pattern Overview

**Overall:** Single-Page Application with client-side data fetching via Supabase direct SDK calls, mediated through TanStack Query hooks.

**Key Characteristics:**
- No backend server — all data operations use Supabase anon key + Row Level Security
- File-based routing via TanStack Router with auto-generated route tree
- Auto-save pattern throughout all phase forms (debounced mutations, flush on blur/visibility)
- Three-phase domain model: Preparation → Experience → Integration
- JSONB columns for instrument data; hooks handle camelCase↔snake_case mapping

## Layers

**Routing Layer:**
- Purpose: Defines URL structure, renders page components, handles auth redirects
- Location: `src/routes/`
- Contains: Route definitions, page-level components, inline sub-components (forms, cards)
- Depends on: Hooks layer, shared components, types
- Used by: `src/main.tsx` bootstraps the router

**Hooks Layer:**
- Purpose: All server state management — queries, mutations, cache invalidation
- Location: `src/hooks/`
- Contains: TanStack Query wrappers over Supabase SDK calls, camelCase←→snake_case mappers, `useAutoSave` utility hook, `useAuth` session management
- Depends on: `src/lib/supabase.ts`, `src/types/journey.ts`
- Used by: Route components

**Lib Layer:**
- Purpose: Singletons, schemas, and standalone utilities
- Location: `src/lib/`
- Contains:
  - `supabase.ts` — Supabase client singleton, validates env vars at module load
  - `schemas.ts` — Zod schemas for all JSONB instrument columns
  - `export.ts` — JSON export/import logic (directly calls Supabase, no hook)
- Depends on: Supabase SDK, Zod
- Used by: Hooks, routes

**Types Layer:**
- Purpose: Shared TypeScript domain types
- Location: `src/types/journey.ts`
- Contains: `Journey`, `Phase1`, `Phase2`, `Phase3Entry`, `FullJourney`, all instrument subtypes (`Swemwbs`, `Meq30`, `Edi`, `Ebi`, etc.)
- Depends on: Nothing (pure types)
- Used by: Hooks, routes, lib

**Shared Components Layer:**
- Purpose: Reusable instrument UI primitives
- Location: `src/components/shared/`
- Contains: `LikertScale`, `VASSlider`, `RatingSlider`, `FreeTextPrompt`, `CollapsibleSection`, `SaveIndicator`
- Depends on: Types (for prop typing), `use-auto-save` status type
- Used by: Phase form routes

**Data Layer:**
- Purpose: Static instrument item definitions (question text, IDs)
- Location: `src/data/`
- Contains: `swemwbs-items.ts`
- Depends on: Nothing
- Used by: Phase form routes

## Data Flow

**Read Flow (page load):**

1. Route renders, extracts `id` param via `Route.useParams()`
2. Route calls a hook (e.g., `usePhase1(id)`)
3. Hook issues TanStack Query `useQuery` with key `['phase1', journeyId]`
4. Query calls Supabase SDK `.from('phase1').select('*').eq('journey_id', id)`
5. RLS on Supabase validates `auth.uid() = journeys.user_id`
6. Row returned; `mapPhase1()` converts snake_case DB columns to camelCase TypeScript types
7. Component initializes local form state from returned data (one-time via `useEffect` + `initialized` guard)

**Write Flow (auto-save):**

1. User changes any field — local React state updated immediately (optimistic UI)
2. `useMemo` aggregates all form fields into a single `formData` object
3. `useAutoSave({ data: formData, onSave, debounceMs: 500 })` detects data change
4. After 500ms debounce (or immediately on `visibilitychange`/`beforeunload`), calls `onSave(formData)`
5. `onSave` calls `mutateAsync` from `useUpsertPhase1()` (or phase2/3 equivalent)
6. Mutation calls Supabase `.upsert(row, { onConflict: 'journey_id' })`
7. `onSuccess` invalidates relevant query keys: `['phase1', journeyId]` and `['journey', journeyId]`
8. `SaveIndicator` displays status: `idle` → `saving` → `saved` → `idle` (after 2s)

**Auth Flow:**

1. `main.tsx` wraps app in `QueryClientProvider` + `RouterProvider`
2. `__root.tsx` uses `useAuth()` hook which calls `supabase.auth.getSession()` on mount
3. Supabase `onAuthStateChange` subscription keeps `user` state in sync
4. `useEffect` in `RootLayout` redirects: unauthenticated → `/login`, authenticated on `/login` → `/`
5. Login page calls `signIn(email, password)` or `signUp(email, password)` from `src/hooks/use-auth.ts`

**State Management:**
- Server state: TanStack Query (staleTime 5 minutes, retry 2)
- Local form state: React `useState` per field group in each phase form component
- Auth state: React `useState` inside `useAuth` hook, initialized from Supabase session
- No global client store (no Zustand/Jotai/Context)

## Key Abstractions

**`useAutoSave<T>`:**
- Purpose: Generic auto-save with debounce, flush-on-blur, flush-on-unload
- File: `src/hooks/use-auto-save.ts`
- Pattern: Accepts `data: T` and `onSave: (data: T) => Promise<void>`; returns `{ status, flush }`
- Status type exported as `AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'`

**Row Mapper Functions (`mapPhase1`, `mapPhase2`, etc.):**
- Purpose: Translate Supabase `Record<string, unknown>` DB rows into typed camelCase domain objects
- Files: `src/hooks/use-journeys.ts`, `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, `src/hooks/use-phase3.ts`
- Note: `mapPhase1` and `mapPhase3Entry` are duplicated between `use-journeys.ts` (for joined queries) and their respective hook files (for individual queries). This is a known duplication.

**`toSnake()` Functions:**
- Purpose: Translate camelCase `Partial<Phase>` back to snake_case for Supabase writes
- Files: One per phase hook — `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, `src/hooks/use-phase3.ts`
- Pattern: Manual field map object, iterates entries, skips `id`

**Zod Schemas:**
- Purpose: Runtime validation of all JSONB instrument data at the app boundary
- File: `src/lib/schemas.ts`
- Pattern: Named exports per instrument (`swemwbsSchema`, `meq30Schema`, `ediSchema`, etc.) using a `recordSchema()` factory for numeric item records

**`FullJourney` type:**
- Purpose: Combined journey + all phases for the overview and compare views
- File: `src/types/journey.ts` — `type FullJourney = Journey & { phase1: Phase1 | null; phase2: Phase2 | null; phase3Entries: Phase3Entry[] }`
- Fetched via `useJourney(id)` using Supabase join: `.select('*, phase1(*), phase2(*), phase3_entries(*)')`

## Entry Points

**`src/main.tsx`:**
- Location: `src/main.tsx`
- Triggers: Vite HTML entry point (`index.html` → `src/main.tsx`)
- Responsibilities: Creates `QueryClient` (staleTime 5m, retry 2), creates router from generated `routeTree`, renders `<QueryClientProvider>` + `<RouterProvider>`

**`src/routes/__root.tsx`:**
- Location: `src/routes/__root.tsx`
- Triggers: Every route render — wraps all pages
- Responsibilities: Sticky header with nav, `<Outlet>` for child routes, auth redirect logic, `DisclaimerDialog` (localStorage-gated), footer

**`src/routeTree.gen.ts`:**
- Location: `src/routeTree.gen.ts`
- Triggers: Auto-generated by `TanStackRouterVite` plugin on `bun dev` or `bun run build`
- Responsibilities: Static route tree — never edit manually

## Error Handling

**Strategy:** Propagate Supabase errors via throw; surface in UI with conditional renders.

**Patterns:**
- Hooks throw on Supabase error: `if (error) throw error`
- Route components check `isLoading` / `error` states from `useQuery` and render inline error messages: `<p className="text-danger">Error: {error.message}</p>`
- Mutations throw and callers (e.g., `useCreateJourney`) do not catch — errors propagate to the calling component
- `useAutoSave` catches save errors and sets `status = 'error'`; `SaveIndicator` shows "Save failed" text
- Import errors use `alert()` for user notification

## Cross-Cutting Concerns

**Logging:** No logging library — errors are thrown and surfaced in UI or silently caught in `useAutoSave`.

**Validation:** Zod schemas in `src/lib/schemas.ts` define valid shapes for all JSONB instrument data. Validation is not currently called at write time in hooks — schemas exist but are not invoked in mutation paths (gap identified).

**Authentication:** `useAuth` hook in `src/hooks/use-auth.ts` manages session. Auth guard in `src/routes/__root.tsx` handles redirects. RLS on all four Supabase tables enforces server-side authorization.

**Theme:** Dark mode only. Design tokens defined as Tailwind `@theme` variables in `src/index.css`. All colors reference token names (`text-accent-warm`, `bg-background`, etc.).

---

*Architecture analysis: 2026-04-10*
