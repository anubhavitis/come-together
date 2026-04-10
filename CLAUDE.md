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
