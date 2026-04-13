# Phase 2: Design System & Typeform Carousel - Research

**Researched:** 2026-04-10
**Domain:** CSS design tokens, typography, accessible carousel component (React + Tailwind v4)
**Confidence:** HIGH

## Summary

This phase has two distinct workstreams: (1) replacing the existing navy-based design tokens with a dark luxury palette adapted from DESIGN.md, and (2) building a reusable Typeform-style one-question-at-a-time carousel component. The token swap is low-risk because the existing codebase already uses semantic Tailwind token classes (`bg-background`, `text-text-primary`, etc.) throughout -- changing `@theme` values in `src/index.css` will cascade to ~80% of the visual update. The remaining ~20% involves individual component passes for border-radius, typography, and accent color updates (replacing `accent-warm` amber and `accent-cool` indigo with Pinterest Red and warm neutrals).

The carousel component is the critical new deliverable. It must be hand-built (not from a library) because no existing carousel library matches the specific Typeform-style single-question UX with fade transitions, progress bar, keyboard navigation, and ARIA live regions. The component is relatively simple in DOM terms (one visible question at a time, CSS fade transition, linear progress bar) but requires careful accessibility implementation. Phases 3, 4, and 5 all depend on this carousel.

**Primary recommendation:** Start with the `@theme` token overhaul (instant 80% visual update), then typography/font loading, then individual component border-radius/styling pass, then build the carousel component last so it inherits the final design system.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Adapt Pinterest's warm-white palette to dark mode: deep blacks as base, warm sand/olive neutrals (`#91918c`, `#62625b` range adapted for dark surfaces) as secondary surfaces, Pinterest Red (`#e60023`) as the singular bold accent. No cool grays -- warmth is the identity.
- **D-02:** Current navy-based tokens (`#0f172a`, `#1e293b`, `#334155`) in `src/index.css` must be replaced wholesale with the dark luxury palette. The `@theme` block is the single source of truth.
- **D-03:** Token naming stays the same (e.g., `--color-background`, `--color-surface`, `--color-card`) but values change to dark luxury palette. This means existing Tailwind classes (`bg-background`, `text-text-primary`) automatically pick up new colors.
- **D-04:** Text should use warm near-white tones (like DESIGN.md's plum black inverted for dark mode) -- not pure white. Secondary text uses warm gray tones, not cool slate.
- **D-05:** Use Inter (or DM Sans) as the closest available open-source match to Pin Sans. Pin Sans is proprietary. Inter has similar compact proportions and good weight coverage (400, 500, 600, 700).
- **D-06:** Follow DESIGN.md's compact type scale: 12px-70px with the dramatic jump. Most functional text at 12-16px. Negative tracking (-1.2px) on section headings at 28px.
- **D-07:** Load via Google Fonts or self-host. Preload only the critical weights (400, 600). `font-display: swap`.
- **D-08:** Follow DESIGN.md's generous border-radius system: 16px for buttons/inputs, 20px+ for cards, 40px for hero containers. No shadows -- depth comes from warm surface color layering.
- **D-09:** No box-shadow anywhere. Depth achieved through surface color hierarchy (background -> surface -> card) with warm tone differentiation.
- **D-10:** Single reusable `<QuestionCarousel>` component that all three phases consume. Accepts a render prop or children for each question's content.
- **D-11:** Fade transitions using CSS `opacity` + `translateY` (compositor-friendly). Duration ~300ms with ease-out. `prefers-reduced-motion` disables all animations.
- **D-12:** Thin progress bar at top showing N/total questions. Minimal -- a colored line, not a chunky bar.
- **D-13:** Keyboard navigation: Enter to advance (submit answer), arrow keys for multiple-choice option selection. Tab for focus movement. All focus states visible.
- **D-14:** ARIA: `aria-live="polite"` region for question transitions, focus management moves to new question on advance. Screen reader announces "Question N of M".
- **D-15:** Mobile: full-height centered layout, 48px minimum touch targets on all interactive elements. Carousel takes the full viewport minus header.
- **D-16:** Wholesale approach: update `@theme` tokens first (handles ~80% of visual change), then individual component pass for border-radius, typography, and specific styling that tokens don't cover.
- **D-17:** All existing shared components (LikertScale, VASSlider, RatingSlider, FreeTextPrompt, CollapsibleSection, SaveIndicator) get the dark luxury treatment.
- **D-18:** All existing route pages (login, journey list, journey detail, phase forms, compare view) restyled. No legacy light-theme remnants.

### Claude's Discretion
- Exact dark luxury hex values for the adapted palette (as long as they follow the warm principle)
- Whether to use Inter or DM Sans specifically
- Animation easing curve specifics
- Internal carousel state management pattern (useState vs useReducer)
- Whether to extract a shared `<QuestionOption>` sub-component

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-01 | Dark luxury color palette adapted from DESIGN.md | Dark palette token mapping in Architecture Patterns; warm hex values researched |
| DSGN-02 | Typography system using Pin Sans fallback with compact scale | Inter font loading via Google Fonts + Tailwind v4 @theme font config |
| DSGN-03 | Generous border-radius system (16px buttons, 20px+ cards, 40px hero) | Border-radius token system in @theme; component-level overrides documented |
| DSGN-04 | All existing pages and components restyled to dark luxury aesthetic | Complete inventory of 15 files needing updates; token-first approach cascades 80% |
| DSGN-05 | Tailwind v4 @theme tokens updated to dark luxury palette | @theme block replacement pattern documented with exact syntax |
| CRSL-01 | Shared carousel displays one question at a time, full-height centered | Carousel component architecture pattern documented |
| CRSL-02 | Fade transitions between questions (opacity + transform) | CSS transition pattern with compositor-friendly properties |
| CRSL-03 | Thin progress bar showing completion | Simple div-based progress bar pattern |
| CRSL-04 | Keyboard navigation (Enter to advance, arrows for selection) | KeyboardEvent handling pattern documented |
| CRSL-05 | Accessible -- ARIA live regions, focus management, reduced-motion | ARIA pattern with live region + useReducedMotion hook documented |
| CRSL-06 | Mobile-responsive with 48px minimum touch targets | Existing pattern in LikertScale (min-h-[44px]) upgraded to 48px |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.2 | Utility-first styling, `@theme` design tokens | Already in project; `@theme` block is the single source of truth |
| React | 19.2.4 | UI rendering | Already in project |
| TypeScript | 6.0.2 | Type safety | Already in project |

### Supporting (new additions)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Inter (Google Fonts) | Variable | Primary typeface replacing system default | Loaded via CSS `@import` in `src/index.css` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inter | DM Sans | DM Sans has slightly more geometric character but Inter has broader weight coverage (100-900) and better compact proportions matching Pin Sans |
| Hand-built carousel | react-aria-carousel | Over-engineered for single-item display; our UX is simpler than a traditional carousel (no snapping, no scroll, just fade transitions) |
| Hand-built carousel | Embla Carousel | Scroll-based carousel is wrong paradigm; we need state-based question switching with fade, not scroll-snap |

**Installation:**
No new npm packages needed. Inter font loaded via CSS `@import` from Google Fonts.

## Architecture Patterns

### Dark Luxury Palette (Recommended Values)

Adapting DESIGN.md's warm palette to dark mode. The key principle: warm undertones everywhere, no cool slate/zinc.

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@import "tailwindcss";

@theme {
  /* Dark luxury palette - warm undertones, no cool grays */
  --color-background: #111110;       /* Near-black with warm undertone (not pure black) */
  --color-surface: #1c1c1a;          /* Warm dark surface */
  --color-card: #2a2a27;             /* Warm elevated card surface */
  --color-text-primary: #ede9e3;     /* Warm near-white (plum-black inverted) */
  --color-text-secondary: #91918c;   /* Warm silver from DESIGN.md */
  --color-accent-warm: #e60023;      /* Pinterest Red - singular bold accent */
  --color-accent-cool: #e60023;      /* ALSO Pinterest Red - no secondary accent */
  --color-success: #34d399;          /* Keep existing */
  --color-warning: #fb923c;          /* Keep existing */
  --color-danger: #f87171;           /* Keep existing */

  /* NEW: Border and interactive tokens */
  --color-border: #3a3a36;           /* Warm border for cards/inputs */
  --color-border-hover: #4a4a44;     /* Hover border state */
  --color-focus: #e60023;            /* Focus ring uses accent */

  /* Typography */
  --default-font-family: "Inter", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  --font-sans: "Inter", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;

  /* Border radius scale from DESIGN.md */
  --radius-sm: 12px;
  --radius-md: 16px;    /* Buttons, inputs */
  --radius-lg: 20px;    /* Cards */
  --radius-xl: 28px;    /* Large containers */
  --radius-2xl: 40px;   /* Hero containers */
}
```

**Critical note on `--default-font-family`:** In Tailwind v4, setting `--default-font-family` in the `@theme` block makes Inter the default font for all elements without needing to add `font-sans` class to the body. This is the correct v4 approach.

### File Inventory (Files Needing Updates)

**Token swap only (automatic via @theme):** These files use semantic token classes and will update automatically when `@theme` values change:
- All 6 shared components in `src/components/shared/`
- All route files

**Manual styling updates required:**

| File | Lines | Changes Needed |
|------|-------|---------------|
| `src/index.css` | 20 | Complete `@theme` rewrite + font import |
| `src/routes/__root.tsx` | 113 | Border-radius on header/footer, remove `border-surface` borders, warm treatment |
| `src/routes/login.tsx` | 114 | Input border-radius to 16px, button radius to 16px |
| `src/routes/index.tsx` | 227 | Card border-radius to 20px, button radius to 16px |
| `src/routes/journey/$id/index.tsx` | 185 | Phase box card radius, link colors |
| `src/routes/journey/$id/phase1.tsx` | 447 | Largest file -- multiple `accent-cool` refs need changing to accent-warm |
| `src/components/shared/likert-scale.tsx` | 56 | Button radius from `rounded-lg` to `rounded-[16px]`, touch targets to 48px |
| `src/components/shared/rating-slider.tsx` | 44 | Same button radius + touch target update |
| `src/components/shared/vas-slider.tsx` | 49 | Slider track styling for warm colors |
| `src/components/shared/free-text-prompt.tsx` | 46 | Textarea border-radius to 16px, focus ring to accent-warm |
| `src/components/shared/collapsible-section.tsx` | 83 | Card radius to 20px, `accent-cool` -> `accent-warm` |
| `src/components/shared/save-indicator.tsx` | 15 | Minimal -- just uses token classes |

**New files to create:**
- `src/components/shared/question-carousel.tsx` -- The carousel component
- `src/hooks/use-reduced-motion.ts` -- Reduced motion preference hook

### Carousel Component Architecture

```typescript
// src/components/shared/question-carousel.tsx

interface CarouselQuestion {
  id: string
  content: React.ReactNode  // Render prop pattern - caller provides UI
}

interface QuestionCarouselProps {
  questions: CarouselQuestion[]
  currentIndex: number
  onAdvance: () => void      // Caller controls progression
  onAnswer?: () => void      // Optional: called when answer is submitted
  totalQuestions?: number     // For progress bar (may differ from questions.length)
  className?: string
}
```

**State management recommendation:** `useState` is sufficient. The carousel's state is simple (current index, transition direction). No need for `useReducer` -- the parent component owns the answer state and progression logic. The carousel is purely presentational with keyboard handling.

**Component structure:**
```
QuestionCarousel
  ├── ProgressBar (thin line at top)
  ├── QuestionContainer (aria-live="polite")
  │   ├── TransitionWrapper (opacity + translateY fade)
  │   │   └── {questions[currentIndex].content}  (render prop)
  │   └── ScreenReaderAnnouncement (visually hidden)
  └── KeyboardHandler (effect-based, not a visible element)
```

### Recommended Project Structure (New Files)

```
src/
├── components/
│   └── shared/
│       ├── question-carousel.tsx     # NEW: Carousel component
│       └── index.ts                  # UPDATE: export QuestionCarousel
├── hooks/
│   └── use-reduced-motion.ts         # NEW: prefers-reduced-motion hook
└── index.css                         # REWRITE: @theme dark luxury tokens
```

### Anti-Patterns to Avoid
- **Using a scroll-based carousel library:** This is NOT a scroll carousel. It is a state-based single-item display with fade transitions. Scroll-snap, touch-swipe, and momentum are wrong paradigms.
- **Adding box-shadow for depth:** Depth comes from warm surface color hierarchy only (D-09).
- **Using `accent-cool` indigo anywhere:** Both accent tokens map to Pinterest Red. The old indigo must be purged.
- **Pure white text (#ffffff):** Text must use warm near-white (`#ede9e3` or similar) per D-04.
- **Cool gray anywhere:** All grays must have warm/olive undertone. No Tailwind `slate-*`, `gray-*`, or `zinc-*`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | Custom font loader | Google Fonts CSS `@import` + `font-display: swap` | Browser-optimized, CDN-cached, handles subsetting |
| Design tokens | CSS custom properties manually | Tailwind v4 `@theme` block | Generates utility classes automatically, single source of truth |
| Reduced motion detection | Manual `matchMedia` setup | `useReducedMotion` hook (10 lines, extract once) | Reusable, handles SSR edge cases, event listener cleanup |

**Key insight:** The entire design system update is largely a token swap. Because the codebase already uses semantic Tailwind classes (`bg-background`, `text-text-primary`, etc.), changing `@theme` values propagates automatically. Do NOT rewrite component classes -- just change the token values.

## Common Pitfalls

### Pitfall 1: Cool Gray Contamination
**What goes wrong:** After updating tokens, remaining hardcoded Tailwind color classes like `slate-*`, `gray-*`, or `zinc-*` create cool-toned patches.
**Why it happens:** The existing code uses semantic tokens for most colors but may have a few hardcoded Tailwind classes buried in route files.
**How to avoid:** After token swap, grep the entire `src/` directory for `slate-`, `gray-`, `zinc-`, `#0f`, `#1e2`, `#334` to find any hardcoded cool colors.
**Warning signs:** Visually inconsistent patches when viewing the app.

### Pitfall 2: `accent-cool` References Still Using Indigo
**What goes wrong:** Setting `--color-accent-cool` to Pinterest Red in tokens changes the value, but semantically it was used for secondary/less-prominent actions (links, "View comparison", "New Check-in" buttons). These now become bright red, which may look aggressive.
**Why it happens:** The original design used two accent colors (warm amber + cool indigo) for different semantic purposes.
**How to avoid:** Audit every `accent-cool` usage. Some should become `text-text-secondary` or a warm muted tone instead of Pinterest Red. The "secondary action" pattern should use warm gray, not red.
**Warning signs:** Too much red on screen -- red should be reserved for primary CTAs only.

### Pitfall 3: Border Radius Inconsistency
**What goes wrong:** Mixing `rounded-lg` (8px default), `rounded-xl`, and custom `rounded-[16px]` creates visual inconsistency.
**Why it happens:** Tailwind's default radius scale doesn't match DESIGN.md's 16px/20px/40px system.
**How to avoid:** Define custom radius tokens in `@theme` (`--radius-md: 16px`, etc.) and use those consistently. Or use `rounded-[16px]` / `rounded-[20px]` everywhere.
**Warning signs:** Buttons with different corner radii on the same page.

### Pitfall 4: Focus States Invisible on Dark Background
**What goes wrong:** Default focus rings (often light blue or thin) become invisible on dark surfaces.
**Why it happens:** Focus ring colors designed for light backgrounds don't contrast well on dark.
**How to avoid:** Use Pinterest Red (`#e60023`) for focus rings via `focus:ring-accent-warm`. Ensure 3:1 minimum contrast ratio against the surface color.
**Warning signs:** Tab through the app -- if you can't see where focus is, it's broken.

### Pitfall 5: Carousel Focus Management on Question Advance
**What goes wrong:** When advancing to the next question, focus stays on the previous question's answer button (which is now hidden), or jumps to the document body.
**Why it happens:** DOM replacement without explicit focus management.
**How to avoid:** After advancing, programmatically focus the new question container or the first interactive element. Use a `ref` on the question container and call `.focus()` after the transition.
**Warning signs:** After pressing Enter to advance, pressing Tab goes somewhere unexpected.

### Pitfall 6: ARIA Live Region Announcing Too Much
**What goes wrong:** The `aria-live="polite"` region re-announces the entire question content every time any child element updates.
**Why it happens:** Placing `aria-live` on the question container means any DOM change triggers an announcement.
**How to avoid:** Use a separate visually-hidden `aria-live` region that only contains the "Question N of M" text. The question content itself should NOT be in an `aria-live` region -- it gets announced via focus management instead.
**Warning signs:** Screen reader announces the same content twice, or announces partial updates.

## Code Examples

### Tailwind v4 @theme Block (Complete Replacement)

```css
/* src/index.css */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@import "tailwindcss";

@theme {
  --color-background: #111110;
  --color-surface: #1c1c1a;
  --color-card: #2a2a27;
  --color-text-primary: #ede9e3;
  --color-text-secondary: #91918c;
  --color-accent-warm: #e60023;
  --color-accent-cool: #e60023;
  --color-success: #34d399;
  --color-warning: #fb923c;
  --color-danger: #f87171;
  --color-border: #3a3a36;

  --default-font-family: "Inter", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  --font-sans: "Inter", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
}
```
Source: [Tailwind CSS v4 Theme Variables docs](https://tailwindcss.com/docs/theme), [Tailwind CSS v4 font-family docs](https://tailwindcss.com/docs/font-family)

### useReducedMotion Hook

```typescript
// src/hooks/use-reduced-motion.ts
import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: no-preference)'

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    setPrefersReducedMotion(!mql.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(!event.matches)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
```
Source: [Josh W. Comeau - useReducedMotion hook](https://www.joshwcomeau.com/snippets/react-hooks/use-prefers-reduced-motion/)

### Carousel Fade Transition (CSS-only)

```css
/* Carousel transition - compositor-friendly properties only */
.carousel-enter {
  opacity: 0;
  transform: translateY(8px);
}
.carousel-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}
.carousel-exit {
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}

/* Reduced motion: instant switch, no animation */
@media (prefers-reduced-motion: reduce) {
  .carousel-enter,
  .carousel-active,
  .carousel-exit {
    transition: none;
  }
}
```

### Carousel ARIA Pattern

```tsx
// Simplified structure showing ARIA pattern
<div className="relative flex flex-col min-h-[calc(100dvh-56px)]">
  {/* Progress bar */}
  <div className="h-0.5 bg-card">
    <div
      className="h-full bg-accent-warm transition-[width] duration-300"
      style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Question ${currentIndex + 1} of ${total}`}
    />
  </div>

  {/* Question container - focus target */}
  <div
    ref={questionRef}
    tabIndex={-1}
    className="flex flex-1 items-center justify-center px-4"
  >
    {questions[currentIndex].content}
  </div>

  {/* Separate live region for screen reader announcements */}
  <div aria-live="polite" className="sr-only">
    {`Question ${currentIndex + 1} of ${total}`}
  </div>
</div>
```
Source: [Smashing Magazine - Building Accessible Carousels](https://www.smashingmagazine.com/2023/02/guide-building-accessible-carousels/)

### Keyboard Handler Pattern

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && canAdvance) {
      e.preventDefault()
      onAdvance()
    }
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [canAdvance, onAdvance])
```

Note: Arrow key handling for multiple-choice option selection should be handled WITHIN the option group component (the render prop content), not in the carousel itself. The carousel only handles Enter to advance.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `tailwind.config.js` | Tailwind v4 CSS-first `@theme` block | 2025 (v4 release) | All token config lives in CSS, no JS config file needed |
| `@apply` for font loading | `@import url()` + `--default-font-family` | Tailwind v4 | Fonts declared in CSS, applied globally via theme variable |
| `rounded-lg` (default 8px) | Custom `--radius-*` tokens or `rounded-[Npx]` | Project-specific | DESIGN.md radius system doesn't match Tailwind defaults |

## Open Questions

1. **Exact warm dark hex values**
   - What we know: Must be warm-undertoned blacks/dark browns, not cool. Background should be near-black, surface slightly lighter, card lighter still.
   - What's unclear: Exact hex values are discretionary. The recommended `#111110` / `#1c1c1a` / `#2a2a27` are warm-undertoned but may need visual tuning.
   - Recommendation: Start with recommended values, adjust by visual inspection during implementation.

2. **What happens to `accent-cool` semantic usage**
   - What we know: `accent-cool` was used for secondary/less-prominent actions (links, "New Check-in" button, "View comparison" link). Setting it to Pinterest Red makes everything red.
   - What's unclear: Should secondary actions use `text-text-secondary` (warm gray) or stay red?
   - Recommendation: Map `accent-cool` to Pinterest Red in tokens (per D-03), but during component pass, change secondary action elements from `accent-cool` to `text-text-secondary` with `hover:text-text-primary`. Reserve red for primary CTAs only.

3. **Inter vs DM Sans**
   - What we know: Both are open-source, have compact proportions. Inter has broader weight range.
   - Recommendation: Use Inter. It has better weight coverage (400-700 all needed), is the most widely deployed Google Font (excellent CDN caching), and closely matches Pin Sans's compact, neutral character.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected -- no test framework configured |
| Config file | None |
| Quick run command | N/A |
| Full suite command | `bun run build` (type check + build as smoke test) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSGN-01 | Dark luxury palette applied | visual | Manual browser inspection | N/A |
| DSGN-02 | Inter font loaded and applied | visual | Manual browser inspection | N/A |
| DSGN-03 | Border-radius 16px/20px/40px | visual | Manual browser inspection | N/A |
| DSGN-04 | All pages restyled | visual | Manual browser inspection | N/A |
| DSGN-05 | @theme tokens updated | unit-like | `bun run build` (verifies CSS compiles) | N/A |
| CRSL-01 | One question at a time, full-height | visual + manual | Manual browser inspection | N/A |
| CRSL-02 | Fade transitions | visual | Manual browser inspection | N/A |
| CRSL-03 | Progress bar | visual | Manual browser inspection | N/A |
| CRSL-04 | Keyboard nav (Enter, arrows) | manual | Manual keyboard testing | N/A |
| CRSL-05 | ARIA live, focus management, reduced-motion | a11y | Manual screen reader + keyboard testing | N/A |
| CRSL-06 | 48px touch targets, mobile responsive | visual | Manual mobile viewport testing | N/A |

### Sampling Rate
- **Per task commit:** `bun run build` (type check + production build succeeds)
- **Per wave merge:** `bun run build` + manual visual inspection at 375px and 1440px
- **Phase gate:** Full build green + visual audit of all pages + keyboard navigation audit

### Wave 0 Gaps
- No test framework installed -- all validation is build-based and manual for this visual/CSS phase
- Consider adding Playwright for visual regression in a future phase (not this one -- scope creep)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Build/dev | Yes | 1.2.8 | -- |
| Google Fonts CDN | Inter font loading | Yes (network) | -- | Self-host Inter woff2 files |
| Vite | Dev server + build | Yes | 8.0.4 | -- |

No missing dependencies.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) - @theme syntax, --default-font-family, custom token definition
- [Tailwind CSS v4 font-family](https://tailwindcss.com/docs/font-family) - Font configuration in v4
- [Tailwind CSS v4 Discussion #13890](https://github.com/tailwindlabs/tailwindcss/discussions/13890) - Custom font setup patterns
- [Tailwind CSS v4 Discussion #19535](https://github.com/tailwindlabs/tailwindcss/discussions/19535) - --default-font-family global application

### Secondary (MEDIUM confidence)
- [Josh W. Comeau - useReducedMotion](https://www.joshwcomeau.com/snippets/react-hooks/use-prefers-reduced-motion/) - Reduced motion hook pattern
- [Smashing Magazine - Building Accessible Carousels](https://www.smashingmagazine.com/2023/02/guide-building-accessible-carousels/) - ARIA carousel patterns
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) - Media query reference

### Tertiary (LOW confidence)
- Dark luxury hex values are my recommendations based on warm-undertone color theory -- visual tuning needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies needed, Tailwind v4 @theme syntax verified via official docs
- Architecture: HIGH - Token-first approach is low-risk given existing semantic class usage; carousel is straightforward state-based component
- Pitfalls: HIGH - Based on direct codebase analysis (identified accent-cool semantic conflict, border-radius mismatch, focus state concerns)

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable -- Tailwind v4 API is settled, no fast-moving dependencies)
