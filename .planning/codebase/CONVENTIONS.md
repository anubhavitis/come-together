# Coding Conventions

**Analysis Date:** 2026-04-10

## Naming Patterns

**Files:**
- React components and route files: PascalCase for component names inside the file, but the file itself uses kebab-case (`likert-scale.tsx`, `collapsible-section.tsx`, `use-auto-save.ts`)
- Hooks: kebab-case with `use-` prefix (`use-auth.ts`, `use-phase1.ts`, `use-auto-save.ts`)
- Data/lib files: kebab-case (`swemwbs-items.ts`, `schemas.ts`, `supabase.ts`)
- Route files: TanStack Router file-based convention with `$param` for dynamic segments (`$id.tsx`, `$id/phase1.tsx`, `phase3.$entryId.tsx`)

**Functions and Components:**
- Components: PascalCase (`LikertScale`, `CollapsibleSection`, `FreeTextPrompt`, `SaveIndicator`)
- Hooks: camelCase with `use` prefix (`useAutoSave`, `usePhase1`, `useUpsertPhase1`)
- Utility functions: camelCase (`mapJourney`, `mapPhase1`, `toSnake`, `formatDate`)
- Mutation hooks: verb+noun pattern (`useCreateJourney`, `useDeleteJourney`, `useUpsertPhase1`)
- Handler functions: `handle` prefix for event handlers (`handleSubmit`, `handleChange`, `handleComplete`)

**Variables:**
- camelCase throughout
- Boolean state: descriptive past-tense or present-state naming (`isLoading`, `isPending`, `initialized`, `confirming`, `open`, `importing`)
- Default values: `DEFAULT_` prefix in UPPER_SNAKE_CASE for module-level constants (`DEFAULT_SWEMWBS`, `DEFAULT_LANDSCAPE_TEXT`, `DEFAULT_CONTEXT`)

**Types:**
- Exported domain types: PascalCase (`Journey`, `Phase1`, `Phase3Entry`, `FullJourney`)
- Sub-domain value types: PascalCase (`Swemwbs`, `Meq30`, `Edi`, `Ebi`, `InnerLandscapeText`)
- Component props interfaces: `{ComponentName}Props` pattern (`LikertScaleProps`, `VASSliderProps`, `CollapsibleSectionProps`)
- Hook options types: `Use{HookName}Options<T>` pattern (`UseAutoSaveOptions<T>`)
- String literal union types over enums (see `SubstanceType`, `AutoSaveStatus`, `'signin' | 'signup'`)

## Code Style

**Formatting:**
- No Prettier config present in the project — formatting is enforced by ESLint only
- Semicolons: inconsistent across the codebase. Route files and hook files use semicolons; lib files (`schemas.ts`, `supabase.ts`, `use-journeys.ts`, `use-phase1.ts`, `use-auth.ts`) omit them. When adding new files, match the style of adjacent files; prefer no-semicolon style in `src/lib/` and `src/hooks/`, semicolons in `src/components/` and `src/routes/`
- Single quotes in `src/lib/` and `src/hooks/`; double quotes in `src/components/` and `src/routes/`
- Trailing commas used throughout

**Linting:**
- Config: `eslint.config.js` (flat config, ESLint 9)
- Rules: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- TypeScript strict settings: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` (enforces `import type` for type-only imports)

## Import Organization

**Pattern:**
1. External library imports (`react`, `@tanstack/*`, `zod`)
2. Internal path alias imports (`@/lib/...`, `@/hooks/...`, `@/types/...`, `@/components/...`, `@/data/...`)
3. Relative imports (used sparingly — see `save-indicator.tsx` importing from `../../hooks/use-auto-save`)

**Path Aliases:**
- `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- Use `@/` for all cross-directory imports; relative paths only when unavoidable

**Type Import Syntax:**
- Use `import type { ... }` for type-only imports (enforced by `verbatimModuleSyntax` in tsconfig)
- Example from `src/hooks/use-phase1.ts`: `import type { Phase1 } from '@/types/journey'`

## Barrel Files

Both `src/hooks/index.ts` and `src/components/shared/index.ts` act as barrel files exporting all public members. Always export new hooks from `src/hooks/index.ts` and new shared components from `src/components/shared/index.ts`.

Import from barrels in routes and pages:
```typescript
import { useJourneys, useCreateJourney } from "@/hooks";
import { LikertScale, CollapsibleSection } from "@/components/shared";
```

Import directly from source in files within the same directory when cross-importing would be circular.

## Component Design

**Function Components Only:**
- No class components
- No `React.FC` type annotation — use plain function declarations
- Props typed with a local `interface` named `{Name}Props`

**Prop patterns:**
```typescript
// All shared components follow this pattern
interface VASSliderProps {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  id: string;           // required for accessibility label association
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}
```

**State initialization:**
- Module-level `DEFAULT_*` constants for complex state defaults (avoids re-creating objects on render)
- `initialized` guard pattern used in form pages to prevent resetting state after data loads:
```typescript
useEffect(() => {
  if (phase1 && !initialized) {
    setSwemwbs(phase1.swemwbs ?? DEFAULT_SWEMWBS);
    // ...
    setInitialized(true);
  }
}, [phase1, initialized]);
```

**useMemo for form data objects:**
- Form data passed to `useAutoSave` is always wrapped in `useMemo` to prevent spurious saves:
```typescript
const formData = useMemo(
  () => ({ swemwbs, innerLandscapeText: landscapeText, ... }),
  [swemwbs, landscapeText, ...]
);
```

**useCallback for save handlers:**
- `onSave` callbacks are always wrapped in `useCallback` before being passed to `useAutoSave`

## Data Layer Conventions

**Snake_case to camelCase mapping:**
- Supabase returns snake_case column names; all hooks use local `mapX(row)` functions to translate to camelCase TypeScript types
- Pattern in every hook file:
```typescript
function mapPhase1(row: Record<string, unknown>): Phase1 {
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    // ...
  }
}
```

**toSnake helpers:**
- Update hooks include a `toSnake(data)` helper that maps camelCase keys to snake_case for writes

**Query key convention:**
- Arrays with entity name and ID: `['journeys']`, `['journey', id]`, `['phase1', journeyId]`
- Always invalidate the specific entity AND the parent when mutating: `queryClient.invalidateQueries({ queryKey: ['phase1', journeyId] })` AND `queryClient.invalidateQueries({ queryKey: ['journey', journeyId] })`

**Error handling in hooks:**
- Throw Supabase error objects directly: `if (error) throw error`
- Check for unauthenticated state explicitly: `if (!user) throw new Error('Not authenticated')`

## Zod Schema Convention

Schemas live in `src/lib/schemas.ts` and are named `{domainName}Schema` (camelCase):
```typescript
export const swemwbsSchema = recordSchema(items7, 1, 5)
export const contextSchema = z.object({ ... })
```

Types are defined separately in `src/types/journey.ts` (not inferred from Zod schemas). The two are kept in sync manually.

## CSS / Styling

**Tailwind CSS v4 with `@theme`:**
- All design tokens defined in `src/index.css` using the `@theme` block
- Token reference (always use these, never raw hex):
  - Colors: `background`, `surface`, `card`, `text-primary`, `text-secondary`, `accent-warm`, `accent-cool`, `success`, `warning`, `danger`
  - Usage in Tailwind: `bg-background`, `text-accent-warm`, `border-surface`, etc.

**No CSS modules or component-level CSS files:**
- All styling via Tailwind utility classes inline on JSX elements
- No `className` helper libraries (no `clsx`, `cn`, or `cva`)

**Accessibility patterns in interactive components:**
- Minimum tap target: `min-h-[44px] min-w-[44px]` on all Likert/rating buttons
- `fieldset` + `legend` for radio-style button groups (`LikertScale`, `RatingSlider`)
- Explicit `id` prop on all form inputs for `htmlFor` / `aria-label` association

## Error Handling

**In route components:**
- TanStack Query error state rendered inline:
```typescript
if (isLoading) return <p className="text-text-secondary">Loading...</p>;
if (error) return <p className="text-danger">Error: {error.message}</p>;
```

**In event handlers:**
- `try/catch` with `err instanceof Error` narrowing:
```typescript
} catch (err) {
  setError(err instanceof Error ? err.message : 'Something went wrong')
}
```

**In hooks/lib:**
- Throw errors to bubble up to TanStack Query's error handling
- No silent error swallowing

**In auto-save:**
- `catch` block with no re-throw (sets status to `"error"` for UI feedback, does not crash the app)

## Environment Variables

- All accessed via `import.meta.env.VITE_*`
- Validated at module init time with an explicit throw: `if (!supabaseUrl || !supabaseAnonKey) { throw new Error('...') }`
- Located in `src/lib/supabase.ts`

## Comments

Inline comments are minimal. Used sparingly for non-obvious behavior:
- `// Best-effort sync save...` explaining a known limitation
- `// Mark as initialized even if no existing data` explaining intent

No JSDoc in source files.

---

*Convention analysis: 2026-04-10*
