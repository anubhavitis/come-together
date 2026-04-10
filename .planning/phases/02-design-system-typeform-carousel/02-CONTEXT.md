# Phase 2: Design System & Typeform Carousel - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Overhaul the entire app's visual identity to a dark luxury aesthetic adapted from DESIGN.md, and build a reusable Typeform-style one-question-at-a-time carousel component that Phases 3, 4, and 5 will consume. This phase touches every existing page/component (restyling) and creates one major new component (carousel).

</domain>

<decisions>
## Implementation Decisions

### Dark Mode Color Adaptation
- **D-01:** Adapt Pinterest's warm-white palette to dark mode: deep blacks as base, warm sand/olive neutrals (`#91918c`, `#62625b` range adapted for dark surfaces) as secondary surfaces, Pinterest Red (`#e60023`) as the singular bold accent. No cool grays — warmth is the identity.
- **D-02:** Current navy-based tokens (`#0f172a`, `#1e293b`, `#334155`) in `src/index.css` must be replaced wholesale with the dark luxury palette. The `@theme` block is the single source of truth.
- **D-03:** Token naming stays the same (e.g., `--color-background`, `--color-surface`, `--color-card`) but values change to dark luxury palette. This means existing Tailwind classes (`bg-background`, `text-text-primary`) automatically pick up new colors.
- **D-04:** Text should use warm near-white tones (like DESIGN.md's plum black inverted for dark mode) — not pure white. Secondary text uses warm gray tones, not cool slate.

### Typography
- **D-05:** Use Inter (or DM Sans) as the closest available open-source match to Pin Sans. Pin Sans is proprietary. Inter has similar compact proportions and good weight coverage (400, 500, 600, 700).
- **D-06:** Follow DESIGN.md's compact type scale: 12px-70px with the dramatic jump. Most functional text at 12-16px. Negative tracking (-1.2px) on section headings at 28px.
- **D-07:** Load via Google Fonts or self-host. Preload only the critical weights (400, 600). `font-display: swap`.

### Border Radius & Depth
- **D-08:** Follow DESIGN.md's generous border-radius system: 16px for buttons/inputs, 20px+ for cards, 40px for hero containers. No shadows — depth comes from warm surface color layering.
- **D-09:** No box-shadow anywhere. Depth achieved through surface color hierarchy (background → surface → card) with warm tone differentiation.

### Carousel Component
- **D-10:** Single reusable `<QuestionCarousel>` component that all three phases consume. Accepts a render prop or children for each question's content — Phase 2 uses it for multiple-choice, Phase 4 for free-text AI conversation, Phase 5 for mixed.
- **D-11:** Fade transitions using CSS `opacity` + `translateY` (compositor-friendly). Duration ~300ms with ease-out. `prefers-reduced-motion` disables all animations.
- **D-12:** Thin progress bar at top showing N/total questions. Minimal — a colored line, not a chunky bar.
- **D-13:** Keyboard navigation: Enter to advance (submit answer), arrow keys for multiple-choice option selection. Tab for focus movement. All focus states visible.
- **D-14:** ARIA: `aria-live="polite"` region for question transitions, focus management moves to new question on advance. Screen reader announces "Question N of M".
- **D-15:** Mobile: full-height centered layout, 48px minimum touch targets on all interactive elements. Carousel takes the full viewport minus header.

### Existing Component Restyling
- **D-16:** Wholesale approach: update `@theme` tokens first (handles ~80% of visual change), then individual component pass for border-radius, typography, and specific styling that tokens don't cover.
- **D-17:** All existing shared components (LikertScale, VASSlider, RatingSlider, FreeTextPrompt, CollapsibleSection, SaveIndicator) get the dark luxury treatment. These are used by future phases.
- **D-18:** All existing route pages (login, journey list, journey detail, phase forms, compare view) restyled. No legacy light-theme remnants.

### Claude's Discretion
- Exact dark luxury hex values for the adapted palette (as long as they follow the warm principle)
- Whether to use Inter or DM Sans specifically
- Animation easing curve specifics
- Internal carousel state management pattern (useState vs useReducer)
- Whether to extract a shared `<QuestionOption>` sub-component

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Language
- `DESIGN.md` -- Full Pinterest design system reference. The dark luxury adaptation must respect the warmth, border-radius, typography, and depth principles described here. This is the PRIMARY design reference.

### Requirements
- `.planning/REQUIREMENTS.md` -- DSGN-01 through DSGN-05 (design system) and CRSL-01 through CRSL-06 (carousel) are this phase's requirements.

### Existing Code (must read before modifying)
- `src/index.css` -- Current `@theme` token block. Will be completely rewritten with dark luxury palette.
- `src/routes/__root.tsx` -- Root layout with header, nav, footer. Needs restyling.
- `src/components/shared/` -- All shared instrument components that need dark luxury treatment.
- `src/routes/login.tsx` -- Auth page to restyle.
- `src/routes/index.tsx` -- Journey list page to restyle.
- `src/routes/journey/$id.tsx` -- Journey layout to restyle.

### Project Context
- `.planning/PROJECT.md` -- Dark luxury aesthetic direction, warm tone requirement, mobile-first constraint.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/shared/likert-scale.tsx` -- Uses `fieldset` + `legend`, min-h-[44px] touch targets. Pattern to follow for carousel option buttons.
- `src/components/shared/vas-slider.tsx` -- VAS slider with 0-100 range. Needs dark luxury colors.
- `src/components/shared/collapsible-section.tsx` -- Progressive disclosure pattern used across phase forms.
- `src/components/shared/save-indicator.tsx` -- Auto-save status display. Needs color update.

### Established Patterns
- All styling via Tailwind utility classes inline. No `clsx` or `cn` helpers.
- Design tokens consumed as `bg-background`, `text-text-primary`, etc. Token swap will cascade automatically.
- No CSS modules, no styled-components. Pure Tailwind.
- `@tailwindcss/vite` plugin handles Tailwind v4.

### Integration Points
- New `src/components/shared/question-carousel.tsx` -- The carousel component.
- `src/index.css` `@theme` block -- Token values change, names stay.
- Every route file in `src/routes/` -- Needs visual pass.
- Every component in `src/components/shared/` -- Needs visual pass.

</code_context>

<specifics>
## Specific Ideas

- DESIGN.md's warm sand/olive neutrals are the differentiator — the palette must NOT look like generic dark mode (cool slate/zinc). Warmth is non-negotiable.
- Pinterest Red (`#e60023`) is the only bold accent. No secondary bright colors.
- Border-radius must be generous (16px+). No sharp corners anywhere.
- Carousel should feel meditative — slow fade, centered question, generous whitespace. Not a rapid-fire quiz.
- The carousel is the most critical new component. Phases 3, 4, and 5 all depend on it.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 02-design-system-typeform-carousel*
*Context gathered: 2026-04-10*
