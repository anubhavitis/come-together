# Testing Patterns

**Analysis Date:** 2026-04-10

## Current State

**No tests exist in this codebase.**

There are no test files (`*.test.*`, `*.spec.*`), no test runner config (no `vitest.config.*`, `jest.config.*`, `playwright.config.*`), and no testing libraries in `package.json`. The project has zero test coverage.

This is a significant gap. The sections below document the recommended testing approach for this codebase, based on its stack (Vite + React + TypeScript + TanStack Query + Supabase), consistent with how the existing code is structured.

---

## Recommended Test Framework

**Runner:** Vitest (natural fit with Vite; no separate bundler config needed)

**Install:**
```bash
bun add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event
```

**Config file to create:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/routeTree.gen.ts', 'src/main.tsx'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**Run Commands:**
```bash
bun run test              # Run all tests
bun run test --watch      # Watch mode
bun run test --coverage   # Coverage report
```

**Add to `package.json` scripts:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## Test File Organization

**Convention:** Co-located with source files

```
src/
├── lib/
│   ├── schemas.ts
│   ├── schemas.test.ts       # Zod schema validation tests
│   └── scoring.ts
│       scoring.test.ts       # Scoring logic tests
├── hooks/
│   ├── use-auto-save.ts
│   └── use-auto-save.test.ts # Hook behavior tests
├── components/
│   └── shared/
│       ├── likert-scale.tsx
│       └── likert-scale.test.tsx
└── test/
    ├── setup.ts              # Global test setup (jsdom, mocks)
    └── msw/
        └── handlers.ts       # MSW Supabase API mock handlers
```

**Naming:** `{source-file}.test.ts` or `{source-file}.test.tsx`

---

## Test Structure

**Suite Organization (AAA pattern):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('schemaName or functionName', () => {
  describe('when <condition>', () => {
    it('<does what>', () => {
      // Arrange
      const input = { item1: 3, item2: undefined }

      // Act
      const result = swemwbsSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
```

**Test naming:** Describe behavior, not implementation.
- `'accepts values 1-5 for each item'`
- `'rejects values outside the allowed range'`
- `'sets status to "saving" while save is in progress'`
- `'flushes pending save on visibility change'`

---

## What to Test (Priority Order)

### 1. Zod Schemas — `src/lib/schemas.ts`

Highest priority. These guard all data written to Supabase. Test:
- Valid inputs parse successfully
- Out-of-range numbers are rejected
- Optional fields default correctly
- The `recordSchema` helper produces the right shape

```typescript
import { describe, it, expect } from 'vitest'
import { swemwbsSchema, contextSchema, meq30Schema } from '@/lib/schemas'

describe('swemwbsSchema', () => {
  it('accepts values 1–5 for all 7 items', () => {
    const valid = { item1: 1, item2: 2, item3: 3, item4: 4, item5: 5, item6: 1, item7: 5 }
    expect(swemwbsSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a value of 6', () => {
    const invalid = { item1: 6 }
    expect(swemwbsSchema.safeParse(invalid).success).toBe(false)
  })

  it('allows undefined items (all fields optional)', () => {
    expect(swemwbsSchema.safeParse({}).success).toBe(true)
  })
})
```

### 2. Scoring Logic — `src/lib/scoring.ts`

Pure functions with known expected outputs from validated research instruments. Test all scoring rules documented in `CLAUDE.md`:
- MEQ-30 "Complete Mystical Experience" threshold (mean ≥ 3.0 on all four subscales)
- SWEMWBS meaningful change detection (≥3 points delta)
- EDI total (mean of 8 items)
- EBI total (sum of 6 items)

### 3. `useAutoSave` Hook — `src/hooks/use-auto-save.ts`

Most complex hook. Test with `renderHook` from `@testing-library/react`:
- Debounces save calls (fires after `debounceMs`, not before)
- Does not fire on initial render
- Calls `onSave` with latest data
- Sets status: `idle` → `saving` → `saved` → `idle` (after 2000ms)
- Sets status to `'error'` when `onSave` throws
- `flush()` cancels debounce timer and saves immediately
- Registers and cleans up `visibilitychange` and `beforeunload` listeners
- Does nothing when `enabled: false`

```typescript
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAutoSave } from '@/hooks/use-auto-save'

describe('useAutoSave', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not call onSave on initial render', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useAutoSave({ data: { x: 1 }, onSave }))
    await act(async () => { vi.runAllTimers() })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave after debounce when data changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave }),
      { initialProps: { data: { x: 1 } } }
    )
    rerender({ data: { x: 2 } })
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(onSave).toHaveBeenCalledWith({ x: 2 })
  })
})
```

### 4. Shared UI Components

Focus on interaction and accessibility, not visual appearance:
- `LikertScale`: clicking a button calls `onChange` with the right value; selected state reflected via `aria-checked`
- `VASSlider`: moving the range input calls `onChange` with the numeric value
- `CollapsibleSection`: clicking header toggles children visibility
- `FreeTextPrompt`: typing calls `onChange`; textarea auto-resizes

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LikertScale } from '@/components/shared/likert-scale'

describe('LikertScale', () => {
  it('calls onChange with the clicked value', async () => {
    const onChange = vi.fn()
    render(<LikertScale label="Test" value={undefined} onChange={onChange} id="test" />)
    await userEvent.click(screen.getByRole('radio', { name: '3' }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('marks the selected value as checked', () => {
    render(<LikertScale label="Test" value={2} onChange={vi.fn()} id="test" />)
    expect(screen.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'true')
  })
})
```

---

## Mocking

**Supabase Client:**
Mock at the module level in `src/test/setup.ts` or per-test file:
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }),
  },
}))
```

**Timers:**
Use Vitest fake timers for `useAutoSave` tests: `vi.useFakeTimers()` / `vi.useRealTimers()`

**What to Mock:**
- `@/lib/supabase` for all hook tests
- Timer APIs for `useAutoSave`
- `URL.createObjectURL` / `URL.revokeObjectURL` for export tests

**What NOT to Mock:**
- Zod schemas (test real validation logic)
- Scoring functions (pure functions, test directly)
- React state and lifecycle (use `renderHook` + real React)

---

## TanStack Query Wrapper

All hook tests that use TanStack Query hooks require a `QueryClient` wrapper:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Usage:
const { result } = renderHook(() => usePhase1('journey-1'), {
  wrapper: createWrapper(),
})
```

---

## Coverage

**Current coverage:** 0%

**Target:** 80% (per project standards)

**Priority areas for first coverage pass:**
1. `src/lib/schemas.ts` — all Zod schemas
2. `src/lib/scoring.ts` — all scoring functions
3. `src/hooks/use-auto-save.ts` — core auto-save behavior
4. `src/components/shared/` — all shared UI components

**View Coverage:**
```bash
bun run test:coverage
# Opens coverage/index.html for HTML report
```

---

## Test Types

**Unit Tests (primary):**
- Scope: pure functions (schemas, scoring), hooks in isolation, individual components
- Location: co-located with source
- Framework: Vitest + React Testing Library

**Integration Tests:**
- Scope: full route components with mocked Supabase, testing data load → render → interaction flows
- Framework: Vitest + React Testing Library + mocked Supabase client

**E2E Tests:**
- Framework: Playwright (not yet configured)
- Priority flows when added:
  - Sign up → confirm email → sign in
  - Create journey → fill Phase 1 → auto-save triggers
  - Navigate Phase 1 → Phase 2 → Phase 3 → Compare view

---

*Testing analysis: 2026-04-10*
