# Roadmap: Come Together

## Overview

Transform Inner Compass from static validated questionnaires into an AI-driven adaptive journal across three Beatles-themed phases. The build order is risk-driven: infrastructure and shared UI primitives first, then the deterministic Phase 2 ("Right Now") to prove carousel UX without AI risk, then the two AI-powered phases in order of scoring complexity, and finally the comparison view and session management to close the loop.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Infrastructure Skeleton** - Vercel serverless API layer with auth verification and Vite dev proxy
- [ ] **Phase 2: Design System & Typeform Carousel** - Dark luxury aesthetic overhaul and shared one-question-at-a-time component
- [ ] **Phase 3: Right Now (In-Trip Check-In)** - Multiple-choice questionnaire with deterministic instrument scoring via carousel
- [ ] **Phase 4: Come Together (AI Pre-Trip)** - AI-driven adaptive free-text conversation with SWEMWBS scoring extraction
- [ ] **Phase 5: Over Me (Post-Trip Reflection)** - Cross-phase AI questionnaire and holistic trip summary generation
- [ ] **Phase 6: Comparison, Sessions & Navigation** - Before/after instrument visualizations, session management, and phase navigation

## Phase Details

### Phase 1: Infrastructure Skeleton
**Goal**: A working serverless API layer that accepts authenticated requests and returns Claude Haiku responses, with seamless local development
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. A request to `/api/chat` with a valid auth token returns a Claude Haiku response
  2. A request to `/api/chat` without a valid auth token is rejected with 401
  3. The Anthropic API key is not present in the client bundle or any `VITE_` prefixed variable
  4. `bun dev` with Vite proxy forwards `/api/*` requests to the local serverless function transparently
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md — Dependencies, config files, Vite dev proxy, and Vercel deployment setup
- [x] 01-02-PLAN.md — Authenticated /api/chat serverless function with Claude Haiku generation

### Phase 2: Design System & Typeform Carousel
**Goal**: The entire app wears the dark luxury aesthetic, and a reusable Typeform-style carousel component is ready for all three phases to consume
**Depends on**: Phase 1
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, CRSL-01, CRSL-02, CRSL-03, CRSL-04, CRSL-05, CRSL-06
**Success Criteria** (what must be TRUE):
  1. All existing pages render with the dark luxury palette, warm neutrals, and Pinterest Red accent -- no legacy light theme remnants
  2. Typography uses Pin Sans (or fallback) with the compact scale defined in DESIGN.md
  3. The carousel component displays one question at a time with fade transitions, a thin progress bar, and keyboard navigation (Enter to advance, arrows for selection)
  4. The carousel meets WCAG 2.1 AA: ARIA live regions announce question transitions, focus moves to new question on advance, and `prefers-reduced-motion` disables animations
  5. Carousel renders correctly on mobile with 48px minimum touch targets
**Plans:** 4 plans
Plans:
- [x] 02-01-PLAN.md — Dark luxury @theme tokens, Inter font, type scale, border-radius tokens, useReducedMotion hook
- [x] 02-02-PLAN.md — Restyle route pages (root, login, journey list, journey detail, phase1) to dark luxury aesthetic
- [ ] 02-03-PLAN.md — Build reusable QuestionCarousel component with full accessibility and arrow key navigation
- [x] 02-04-PLAN.md — Restyle shared components (LikertScale, VASSlider, etc.) and visual verification checkpoint
**UI hint**: yes

### Phase 3: Right Now (In-Trip Check-In)
**Goal**: Users can complete the "Right Now" in-trip check-in as a 10-question multiple-choice flow, and the system deterministically maps their answers to MEQ-30, EDI, and EBI scores
**Depends on**: Phase 2
**Requirements**: RN-01, RN-02, RN-03, RN-04, RN-05
**Success Criteria** (what must be TRUE):
  1. User sees 10 multiple-choice questions presented one at a time in the Typeform carousel
  2. Each question offers predefined choices plus an optional free-text "type your own" input
  3. The intention sentence from Phase 1 (if completed) is displayed as a grounding anchor during the flow
  4. On completion, responses are stored in Supabase JSONB and deterministic MEQ-30, EDI, and EBI scores are computed
**Plans:** 1/2 plans executed
Plans:
- [x] 03-01-PLAN.md — Question data definitions, types, Zod schemas, and deterministic scoring function
- [ ] 03-02-PLAN.md — Phase 2 carousel route page with intention banner, auto-save, and completion flow
**UI hint**: yes

### Phase 4: Come Together (AI Pre-Trip)
**Goal**: Users have a warm, adaptive 10-question AI conversation about their mental state and intentions, culminating in a single sentence to carry into their trip -- while the system silently extracts SWEMWBS baseline scores
**Depends on**: Phase 1, Phase 2
**Requirements**: CT-01, CT-02, CT-03, CT-04, CT-05, CT-06, CT-07, CT-08
**Success Criteria** (what must be TRUE):
  1. AI asks 10 adaptive free-text questions that feel conversational, not clinical -- each question responds to what the user just said
  2. While the AI generates, a subtle loading animation is visible; the response appears all at once (not streamed)
  3. After 10 questions, a single intention sentence is generated and displayed prominently
  4. The conversation persists to Supabase after each answer -- refreshing the page resumes at the correct question
  5. On completion, AI-extracted SWEMWBS scores are stored in the phase1 JSONB columns
**Plans**: TBD
**UI hint**: yes

### Phase 5: Over Me (Post-Trip Reflection)
**Goal**: Users complete a personalized post-trip reflection where AI tailors questions based on their Phase 1 and Phase 2 data, then receive a holistic trip summary spanning all three phases
**Depends on**: Phase 3, Phase 4
**Requirements**: OM-01, OM-02, OM-03, OM-04, OM-05
**Success Criteria** (what must be TRUE):
  1. AI generates 10 questions that reference specific details from the user's Phase 1 conversation and Phase 2 responses
  2. After 10 questions, AI produces a holistic trip summary that synthesizes insights across all three phases
  3. The trip summary is stored in Supabase and accessible from the session profile
  4. AI-extracted Integration Scales scores are stored in the phase3 JSONB columns
**Plans**: TBD
**UI hint**: yes

### Phase 6: Comparison, Sessions & Navigation
**Goal**: Users can see their before/after transformation through instrument score visualizations and AI narrative, manage their sessions from a profile section, and navigate between phases with clear completion status
**Depends on**: Phase 5
**Requirements**: COMP-01, COMP-02, COMP-03, SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. Comparison view shows validated instrument score shifts (SWEMWBS delta, MEQ-30 factors, EDI, EBI) with meaningful thresholds highlighted
  2. AI-generated trip summary appears alongside instrument score charts in a dual view
  3. Profile section in footer lists all sessions with date and phase completion status, and user can start, view summary, or delete sessions
  4. Three-phase navigation labeled "Come Together", "Right Now", "Over Me" shows completion status per phase
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure Skeleton | 0/2 | Planning complete | - |
| 2. Design System & Typeform Carousel | 0/4 | Planning complete | - |
| 3. Right Now (In-Trip Check-In) | 1/2 | In Progress|  |
| 4. Come Together (AI Pre-Trip) | 0/TBD | Not started | - |
| 5. Over Me (Post-Trip Reflection) | 0/TBD | Not started | - |
| 6. Comparison, Sessions & Navigation | 0/TBD | Not started | - |
