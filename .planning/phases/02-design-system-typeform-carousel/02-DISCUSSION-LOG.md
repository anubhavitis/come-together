# Phase 2: Design System & Typeform Carousel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 02-design-system-typeform-carousel
**Areas discussed:** Dark mode color adaptation, Typography choice, Carousel transition behavior, Existing component restyling scope
**Mode:** Auto (--auto flag, all recommended defaults selected)

---

## Dark Mode Color Adaptation

| Option | Description | Selected |
|--------|-------------|----------|
| Warm inversion | Deep blacks + warm sand/olive neutrals + Pinterest Red accent | ✓ |
| Cool dark mode | Standard cool gray/slate dark palette | |
| Mixed warm/cool | Warm accents on cool dark base | |

**User's choice:** [auto] Warm inversion (recommended default)
**Notes:** Matches PROJECT.md direction. Warmth differentiates from generic dark mode.

---

## Typography Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Inter | Open-source, closest match to Pin Sans compact proportions | ✓ |
| DM Sans | Alternative geometric sans with similar warmth | |
| System font stack only | No custom font, rely on system defaults | |

**User's choice:** [auto] Inter (recommended default)
**Notes:** Pin Sans is proprietary. Inter has similar weight coverage and compact proportions.

---

## Carousel Transition Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| CSS opacity + translateY | Compositor-friendly, simple, reduced-motion compatible | ✓ |
| Framer Motion | Full animation library, more control but heavier | |
| GSAP ScrollTrigger | Powerful but overkill for fade transitions | |

**User's choice:** [auto] CSS opacity + translateY (recommended default)
**Notes:** Matches CRSL-02 requirement (CSS transitions). No need for animation library for simple fades.

---

## Existing Component Restyling Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Wholesale token swap + component pass | Update @theme first, then individual components | ✓ |
| Incremental per-page | Restyle one page at a time | |
| New component library | Build new components from scratch | |

**User's choice:** [auto] Wholesale token swap + component pass (recommended default)
**Notes:** Token swap handles ~80% of change. Component pass covers border-radius, typography, specifics.

---

## Claude's Discretion

- Exact dark luxury hex values (warm principle enforced)
- Inter vs DM Sans final pick
- Animation easing curves
- Internal carousel state management
- Sub-component extraction decisions

## Deferred Ideas

None -- discussion stayed within phase scope
