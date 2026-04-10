# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Inner Compass** — a psychedelic journey journal web app. Data stored in Supabase Postgres with RLS for user isolation. Auth via Supabase.

Three-phase journal structure per journey: Preparation (Phase 1) → Experience (Phase 2) → Integration (Phase 3, multiple entries). The core value prop is the **comparison view** showing before/after shifts.

## Tech Stack

- **Bun** — runtime and package manager
- **Vite** + React + TypeScript
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **TanStack Router** (file-based routing, Vite plugin generates route tree)
- **TanStack Query** — server state, caching, optimistic updates
- **TanStack Form** — form state management
- **Supabase** — auth + Postgres (anon key + RLS, no service_role on client)
- **Zod** — runtime validation for all JSONB structures
- **Recharts** — visualizations
- **shadcn/ui** — UI components
- Deploy target: **Vercel**

## Commands

```bash
bun dev            # Start dev server (also generates route tree)
bun run build      # Production build (tsc + vite build)
bun run lint       # ESLint
bun run preview    # Preview production build
```

## Architecture

### Data Flow
- Supabase Postgres with RLS (anon key, no service_role needed client-side)
- Auto-save on field change (debounced 500ms via TanStack Query mutations)
- Flush on blur, route leave, visibility change
- `updated_at` conflict detection for multi-tab safety
- Zod validation at app boundary before Supabase writes

### Database Tables
- `journeys` — root entity, `user_id` FK to auth.users
- `phase1` — 1:1 with journeys, JSONB columns per section
- `phase2` — 1:1 with journeys, JSONB columns per section
- `phase3_entries` — 1:many with journeys
- All tables have RLS policies scoped to `auth.uid()`
- Phase tables check ownership through parent journey's `user_id`

### Routes (TanStack Router, file-based)
```
src/routes/
├── __root.tsx                      → Root layout
├── index.tsx                       → Journey list (/)
└── journey/
    ├── $id.tsx                     → Journey layout
    └── $id/
        ├── index.tsx               → Journey overview
        ├── phase1.tsx              → Before form
        ├── phase2.tsx              → After form
        ├── phase3.new.tsx          → New integration check-in
        ├── phase3.$entryId.tsx     → View/edit check-in
        └── compare.tsx             → Comparison view
```

### Research Instruments
Validated questionnaires from psychedelic research:
- **MEQ-30** (30 items, 6-point Likert, 4 factors) — mystical experience quality
- **EDI** (8 items, 0-100 VAS) — ego dissolution
- **EBI** (6 items, 0-100 VAS) — emotional breakthrough
- **SWEMWBS** (7 items, 5-point Likert) — baseline/delta wellbeing measure
- **Integration Scales** (engaged: 8 items, experienced: 4 items, 5-point Likert)

Item text in `src/data/`, scoring in `src/lib/scoring.ts`.

### Key Scoring Rules
- MEQ-30 "Complete Mystical Experience": mean ≥ 3.0 on ALL four subscales
- SWEMWBS meaningful change: ≥3 points raw score delta
- EDI total: mean of 8 items (0-100)
- EBI total: sum of 6 items (0-600)

### Key Directories
```
src/
├── components/shared/     → LikertScale, VASSlider, RatingSlider, FreeTextPrompt, CollapsibleSection
├── components/instruments/ → SWEMWBS, MEQ30, EDI, EBI, IntegrationScales
├── components/charts/     → Comparison visualizations
├── hooks/                 → TanStack Query hooks (useJourneys, usePhase1, etc.)
├── data/                  → Instrument item definitions
├── lib/                   → supabase.ts, scoring.ts, schemas.ts
├── types/                 → TypeScript domain types
```

### Design
- Dark mode default (custom theme tokens in `src/index.css`)
- Mobile-first — large tap targets for sliders and Likert scales
- Warm tone, not clinical. Progressive disclosure (collapsible sections)
- All sections optional — no forced completion

## Key Constraints
- Privacy: data in Supabase Postgres, encrypted at rest, RLS enforced. No analytics/tracking.
- Env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`)
- No service_role key on client — anon key + RLS is the security model

## Decision Log
- Vite SPA over Next.js: no server-side logic needed, all ops use anon key + RLS
- JSONB columns over normalized columns: instruments read/written as a unit, avoids 30+ columns
- TanStack Router over React Router: better type safety, file-based routing
- Zod at app boundary, not DB constraints: flexible, TypeScript-native

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Come Together**

A psychedelic journey journal that guides users through three phases — pre-trip AI assessment, in-trip check-in, and post-trip reflection — using adaptive questionnaires and AI-generated insights. Named after the Beatles track, the three phases are "Come Together" (before), "Right Now" (during), and "Over Me" (after). Dark luxury aesthetic inspired by Pinterest's warm design language.

**Core Value:** The AI-driven adaptive questioning must feel like a thoughtful conversation, not a clinical survey — while still mapping responses to validated psychedelic research instruments (MEQ-30, EDI, EBI, SWEMWBS) behind the scenes.

### Constraints

- **Tech stack**: Existing stack (Bun, Vite, React, TypeScript, Tailwind v4, TanStack Router/Query, Supabase, Zod) — no framework changes
- **New dependency**: Vercel AI SDK (@ai-sdk/anthropic) for Claude Haiku integration
- **API key**: User will provide Anthropic API key — must be stored securely (env var, never client-side)
- **Privacy**: No analytics, no tracking, all data in Supabase with RLS
- **Deploy**: Vercel SPA — AI SDK may require a serverless function or edge route for API calls
- **Design**: DESIGN.md is the design language reference, adapted for dark mode only
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 6.0.2 - All application code in `src/`
- SQL (PostgreSQL dialect) - Database migrations in `supabase/migrations/`
- CSS - Design tokens and global styles in `src/index.css`
## Runtime
- Bun 1.2.8 — runtime and package manager
- Node.js 25.8.1 — available but Bun is the primary runtime
- Bun 1.2.8
- Lockfile: `bun.lock` (present, lockfileVersion 1)
## Frameworks
- React 19.2.4 — UI rendering, used in `src/main.tsx` as entry point
- TanStack Router 1.168.10 — file-based routing, route tree generated at `src/routeTree.gen.ts`
- TanStack Query 5.97.0 — server state, caching, mutations; configured in `src/main.tsx` with 5-minute staleTime and 2 retries
- TanStack Form 1.28.6 — form state management (installed, available for use)
- Tailwind CSS 4.2.2 — utility-first styling via `@tailwindcss/vite` plugin
- Vite 8.0.4 — dev server and production bundler; config at `vite.config.ts`
- `@vitejs/plugin-react` 6.0.1 — React Fast Refresh and JSX transform
- `@tanstack/router-vite-plugin` 1.166.27 — auto-generates `src/routeTree.gen.ts` on file change
- TypeScript compiler (`tsc -b`) — type checking as part of production build
- Not detected — no test framework configured
## Key Dependencies
- `@supabase/supabase-js` 2.103.0 — database queries, auth, real-time; client in `src/lib/supabase.ts`
- `zod` 4.3.6 — runtime validation for all JSONB payloads before Supabase writes; schemas in `src/lib/schemas.ts`
- `recharts` 3.8.1 — data visualizations on the comparison view (`src/routes/journey/$id/compare.tsx`)
- `@tanstack/react-query` 5.97.0 — all server state flows through query/mutation hooks in `src/hooks/`
- `@tanstack/router-devtools` 1.166.11 — dev-only router inspection (devDependency)
## Configuration
- Configured via `.env` (present, not committed) and `.env.example` (committed template)
- Two required vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Validated at startup in `src/lib/supabase.ts` — throws if either is missing
- `vite.config.ts` — Vite config with React, Tailwind, and TanStack Router plugins; `@` path alias resolves to `./src`
- `tsconfig.json` — composite project referencing `tsconfig.app.json` and `tsconfig.node.json`
- `tsconfig.app.json` — ES2023 target, bundler module resolution, strict unused-variable checking, `@/*` path alias
- `eslint.config.js` — flat ESLint config using `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`
## Design System
| Token | Value |
|-------|-------|
| `--color-background` | `#0f172a` (deep navy) |
| `--color-surface` | `#1e293b` |
| `--color-card` | `#334155` |
| `--color-text-primary` | `#e2e8f0` |
| `--color-text-secondary` | `#94a3b8` |
| `--color-accent-warm` | `#f59e0b` (amber) |
| `--color-accent-cool` | `#818cf8` (indigo) |
| `--color-success` | `#34d399` |
| `--color-warning` | `#fb923c` |
| `--color-danger` | `#f87171` |
## Platform Requirements
- Bun 1.2.8+
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars set
- Vercel (SPA deployment)
- Static output from `vite build` — `tsc -b && vite build`
- No server-side rendering; all data access uses anon key + RLS
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components and route files: PascalCase for component names inside the file, but the file itself uses kebab-case (`likert-scale.tsx`, `collapsible-section.tsx`, `use-auto-save.ts`)
- Hooks: kebab-case with `use-` prefix (`use-auth.ts`, `use-phase1.ts`, `use-auto-save.ts`)
- Data/lib files: kebab-case (`swemwbs-items.ts`, `schemas.ts`, `supabase.ts`)
- Route files: TanStack Router file-based convention with `$param` for dynamic segments (`$id.tsx`, `$id/phase1.tsx`, `phase3.$entryId.tsx`)
- Components: PascalCase (`LikertScale`, `CollapsibleSection`, `FreeTextPrompt`, `SaveIndicator`)
- Hooks: camelCase with `use` prefix (`useAutoSave`, `usePhase1`, `useUpsertPhase1`)
- Utility functions: camelCase (`mapJourney`, `mapPhase1`, `toSnake`, `formatDate`)
- Mutation hooks: verb+noun pattern (`useCreateJourney`, `useDeleteJourney`, `useUpsertPhase1`)
- Handler functions: `handle` prefix for event handlers (`handleSubmit`, `handleChange`, `handleComplete`)
- camelCase throughout
- Boolean state: descriptive past-tense or present-state naming (`isLoading`, `isPending`, `initialized`, `confirming`, `open`, `importing`)
- Default values: `DEFAULT_` prefix in UPPER_SNAKE_CASE for module-level constants (`DEFAULT_SWEMWBS`, `DEFAULT_LANDSCAPE_TEXT`, `DEFAULT_CONTEXT`)
- Exported domain types: PascalCase (`Journey`, `Phase1`, `Phase3Entry`, `FullJourney`)
- Sub-domain value types: PascalCase (`Swemwbs`, `Meq30`, `Edi`, `Ebi`, `InnerLandscapeText`)
- Component props interfaces: `{ComponentName}Props` pattern (`LikertScaleProps`, `VASSliderProps`, `CollapsibleSectionProps`)
- Hook options types: `Use{HookName}Options<T>` pattern (`UseAutoSaveOptions<T>`)
- String literal union types over enums (see `SubstanceType`, `AutoSaveStatus`, `'signin' | 'signup'`)
## Code Style
- No Prettier config present in the project — formatting is enforced by ESLint only
- Semicolons: inconsistent across the codebase. Route files and hook files use semicolons; lib files (`schemas.ts`, `supabase.ts`, `use-journeys.ts`, `use-phase1.ts`, `use-auth.ts`) omit them. When adding new files, match the style of adjacent files; prefer no-semicolon style in `src/lib/` and `src/hooks/`, semicolons in `src/components/` and `src/routes/`
- Single quotes in `src/lib/` and `src/hooks/`; double quotes in `src/components/` and `src/routes/`
- Trailing commas used throughout
- Config: `eslint.config.js` (flat config, ESLint 9)
- Rules: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- TypeScript strict settings: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` (enforces `import type` for type-only imports)
## Import Organization
- `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- Use `@/` for all cross-directory imports; relative paths only when unavoidable
- Use `import type { ... }` for type-only imports (enforced by `verbatimModuleSyntax` in tsconfig)
- Example from `src/hooks/use-phase1.ts`: `import type { Phase1 } from '@/types/journey'`
## Barrel Files
## Component Design
- No class components
- No `React.FC` type annotation — use plain function declarations
- Props typed with a local `interface` named `{Name}Props`
- Module-level `DEFAULT_*` constants for complex state defaults (avoids re-creating objects on render)
- `initialized` guard pattern used in form pages to prevent resetting state after data loads:
- Form data passed to `useAutoSave` is always wrapped in `useMemo` to prevent spurious saves:
- `onSave` callbacks are always wrapped in `useCallback` before being passed to `useAutoSave`
## Data Layer Conventions
- Supabase returns snake_case column names; all hooks use local `mapX(row)` functions to translate to camelCase TypeScript types
- Pattern in every hook file:
- Update hooks include a `toSnake(data)` helper that maps camelCase keys to snake_case for writes
- Arrays with entity name and ID: `['journeys']`, `['journey', id]`, `['phase1', journeyId]`
- Always invalidate the specific entity AND the parent when mutating: `queryClient.invalidateQueries({ queryKey: ['phase1', journeyId] })` AND `queryClient.invalidateQueries({ queryKey: ['journey', journeyId] })`
- Throw Supabase error objects directly: `if (error) throw error`
- Check for unauthenticated state explicitly: `if (!user) throw new Error('Not authenticated')`
## Zod Schema Convention
## CSS / Styling
- All design tokens defined in `src/index.css` using the `@theme` block
- Token reference (always use these, never raw hex):
- All styling via Tailwind utility classes inline on JSX elements
- No `className` helper libraries (no `clsx`, `cn`, or `cva`)
- Minimum tap target: `min-h-[44px] min-w-[44px]` on all Likert/rating buttons
- `fieldset` + `legend` for radio-style button groups (`LikertScale`, `RatingSlider`)
- Explicit `id` prop on all form inputs for `htmlFor` / `aria-label` association
## Error Handling
- TanStack Query error state rendered inline:
- `try/catch` with `err instanceof Error` narrowing:
- Throw errors to bubble up to TanStack Query's error handling
- No silent error swallowing
- `catch` block with no re-throw (sets status to `"error"` for UI feedback, does not crash the app)
## Environment Variables
- All accessed via `import.meta.env.VITE_*`
- Validated at module init time with an explicit throw: `if (!supabaseUrl || !supabaseAnonKey) { throw new Error('...') }`
- Located in `src/lib/supabase.ts`
## Comments
- `// Best-effort sync save...` explaining a known limitation
- `// Mark as initialized even if no existing data` explaining intent
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- No backend server — all data operations use Supabase anon key + Row Level Security
- File-based routing via TanStack Router with auto-generated route tree
- Auto-save pattern throughout all phase forms (debounced mutations, flush on blur/visibility)
- Three-phase domain model: Preparation → Experience → Integration
- JSONB columns for instrument data; hooks handle camelCase↔snake_case mapping
## Layers
- Purpose: Defines URL structure, renders page components, handles auth redirects
- Location: `src/routes/`
- Contains: Route definitions, page-level components, inline sub-components (forms, cards)
- Depends on: Hooks layer, shared components, types
- Used by: `src/main.tsx` bootstraps the router
- Purpose: All server state management — queries, mutations, cache invalidation
- Location: `src/hooks/`
- Contains: TanStack Query wrappers over Supabase SDK calls, camelCase←→snake_case mappers, `useAutoSave` utility hook, `useAuth` session management
- Depends on: `src/lib/supabase.ts`, `src/types/journey.ts`
- Used by: Route components
- Purpose: Singletons, schemas, and standalone utilities
- Location: `src/lib/`
- Contains:
- Depends on: Supabase SDK, Zod
- Used by: Hooks, routes
- Purpose: Shared TypeScript domain types
- Location: `src/types/journey.ts`
- Contains: `Journey`, `Phase1`, `Phase2`, `Phase3Entry`, `FullJourney`, all instrument subtypes (`Swemwbs`, `Meq30`, `Edi`, `Ebi`, etc.)
- Depends on: Nothing (pure types)
- Used by: Hooks, routes, lib
- Purpose: Reusable instrument UI primitives
- Location: `src/components/shared/`
- Contains: `LikertScale`, `VASSlider`, `RatingSlider`, `FreeTextPrompt`, `CollapsibleSection`, `SaveIndicator`
- Depends on: Types (for prop typing), `use-auto-save` status type
- Used by: Phase form routes
- Purpose: Static instrument item definitions (question text, IDs)
- Location: `src/data/`
- Contains: `swemwbs-items.ts`
- Depends on: Nothing
- Used by: Phase form routes
## Data Flow
- Server state: TanStack Query (staleTime 5 minutes, retry 2)
- Local form state: React `useState` per field group in each phase form component
- Auth state: React `useState` inside `useAuth` hook, initialized from Supabase session
- No global client store (no Zustand/Jotai/Context)
## Key Abstractions
- Purpose: Generic auto-save with debounce, flush-on-blur, flush-on-unload
- File: `src/hooks/use-auto-save.ts`
- Pattern: Accepts `data: T` and `onSave: (data: T) => Promise<void>`; returns `{ status, flush }`
- Status type exported as `AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'`
- Purpose: Translate Supabase `Record<string, unknown>` DB rows into typed camelCase domain objects
- Files: `src/hooks/use-journeys.ts`, `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, `src/hooks/use-phase3.ts`
- Note: `mapPhase1` and `mapPhase3Entry` are duplicated between `use-journeys.ts` (for joined queries) and their respective hook files (for individual queries). This is a known duplication.
- Purpose: Translate camelCase `Partial<Phase>` back to snake_case for Supabase writes
- Files: One per phase hook — `src/hooks/use-phase1.ts`, `src/hooks/use-phase2.ts`, `src/hooks/use-phase3.ts`
- Pattern: Manual field map object, iterates entries, skips `id`
- Purpose: Runtime validation of all JSONB instrument data at the app boundary
- File: `src/lib/schemas.ts`
- Pattern: Named exports per instrument (`swemwbsSchema`, `meq30Schema`, `ediSchema`, etc.) using a `recordSchema()` factory for numeric item records
- Purpose: Combined journey + all phases for the overview and compare views
- File: `src/types/journey.ts` — `type FullJourney = Journey & { phase1: Phase1 | null; phase2: Phase2 | null; phase3Entries: Phase3Entry[] }`
- Fetched via `useJourney(id)` using Supabase join: `.select('*, phase1(*), phase2(*), phase3_entries(*)')`
## Entry Points
- Location: `src/main.tsx`
- Triggers: Vite HTML entry point (`index.html` → `src/main.tsx`)
- Responsibilities: Creates `QueryClient` (staleTime 5m, retry 2), creates router from generated `routeTree`, renders `<QueryClientProvider>` + `<RouterProvider>`
- Location: `src/routes/__root.tsx`
- Triggers: Every route render — wraps all pages
- Responsibilities: Sticky header with nav, `<Outlet>` for child routes, auth redirect logic, `DisclaimerDialog` (localStorage-gated), footer
- Location: `src/routeTree.gen.ts`
- Triggers: Auto-generated by `TanStackRouterVite` plugin on `bun dev` or `bun run build`
- Responsibilities: Static route tree — never edit manually
## Error Handling
- Hooks throw on Supabase error: `if (error) throw error`
- Route components check `isLoading` / `error` states from `useQuery` and render inline error messages: `<p className="text-danger">Error: {error.message}</p>`
- Mutations throw and callers (e.g., `useCreateJourney`) do not catch — errors propagate to the calling component
- `useAutoSave` catches save errors and sets `status = 'error'`; `SaveIndicator` shows "Save failed" text
- Import errors use `alert()` for user notification
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
