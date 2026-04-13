# Technology Stack

**Analysis Date:** 2026-04-10

## Languages

**Primary:**
- TypeScript 6.0.2 - All application code in `src/`

**Secondary:**
- SQL (PostgreSQL dialect) - Database migrations in `supabase/migrations/`
- CSS - Design tokens and global styles in `src/index.css`

## Runtime

**Environment:**
- Bun 1.2.8 — runtime and package manager
- Node.js 25.8.1 — available but Bun is the primary runtime

**Package Manager:**
- Bun 1.2.8
- Lockfile: `bun.lock` (present, lockfileVersion 1)

## Frameworks

**Core:**
- React 19.2.4 — UI rendering, used in `src/main.tsx` as entry point
- TanStack Router 1.168.10 — file-based routing, route tree generated at `src/routeTree.gen.ts`
- TanStack Query 5.97.0 — server state, caching, mutations; configured in `src/main.tsx` with 5-minute staleTime and 2 retries
- TanStack Form 1.28.6 — form state management (installed, available for use)
- Tailwind CSS 4.2.2 — utility-first styling via `@tailwindcss/vite` plugin

**Build/Dev:**
- Vite 8.0.4 — dev server and production bundler; config at `vite.config.ts`
- `@vitejs/plugin-react` 6.0.1 — React Fast Refresh and JSX transform
- `@tanstack/router-vite-plugin` 1.166.27 — auto-generates `src/routeTree.gen.ts` on file change
- TypeScript compiler (`tsc -b`) — type checking as part of production build

**Testing:**
- Not detected — no test framework configured

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.103.0 — database queries, auth, real-time; client in `src/lib/supabase.ts`
- `zod` 4.3.6 — runtime validation for all JSONB payloads before Supabase writes; schemas in `src/lib/schemas.ts`
- `recharts` 3.8.1 — data visualizations on the comparison view (`src/routes/journey/$id/compare.tsx`)

**Infrastructure:**
- `@tanstack/react-query` 5.97.0 — all server state flows through query/mutation hooks in `src/hooks/`
- `@tanstack/router-devtools` 1.166.11 — dev-only router inspection (devDependency)

## Configuration

**Environment:**
- Configured via `.env` (present, not committed) and `.env.example` (committed template)
- Two required vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Validated at startup in `src/lib/supabase.ts` — throws if either is missing

**Build:**
- `vite.config.ts` — Vite config with React, Tailwind, and TanStack Router plugins; `@` path alias resolves to `./src`
- `tsconfig.json` — composite project referencing `tsconfig.app.json` and `tsconfig.node.json`
- `tsconfig.app.json` — ES2023 target, bundler module resolution, strict unused-variable checking, `@/*` path alias
- `eslint.config.js` — flat ESLint config using `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`

## Design System

**CSS Tokens:**
Defined as `@theme` block in `src/index.css` using Tailwind v4 syntax:

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

Dark mode is the default and only theme. Tokens are consumed as Tailwind utility classes throughout components (e.g., `bg-background`, `text-accent-warm`).

## Platform Requirements

**Development:**
- Bun 1.2.8+
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars set

**Production:**
- Vercel (SPA deployment)
- Static output from `vite build` — `tsc -b && vite build`
- No server-side rendering; all data access uses anon key + RLS

---

*Stack analysis: 2026-04-10*
