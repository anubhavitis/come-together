# Requirements: Come Together

**Defined:** 2026-04-10
**Core Value:** AI-driven adaptive questioning that feels conversational while silently mapping to validated psychedelic research instruments

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Vercel serverless function at `/api/chat` accepts conversation context and returns Claude Haiku AI response
- [x] **INFRA-02**: Anthropic API key stored as server-side env var only (never `VITE_` prefixed, never in client bundle)
- [x] **INFRA-03**: Vite dev proxy forwards `/api/*` requests to local serverless function for development
- [x] **INFRA-04**: Auth token forwarded from client to serverless function and verified via Supabase before AI calls

### Design System

- [x] **DSGN-01**: Dark luxury color palette adapted from DESIGN.md — deep blacks, Pinterest Red (#e60023) as singular accent, warm olive/sand neutrals for dark surfaces
- [x] **DSGN-02**: Typography system using Pin Sans (or closest available fallback) with compact scale (12px-70px)
- [x] **DSGN-03**: Generous border-radius system (16px buttons/inputs, 20px+ cards, 40px hero containers)
- [x] **DSGN-04**: All existing pages and components restyled to dark luxury aesthetic
- [x] **DSGN-05**: Tailwind v4 `@theme` tokens updated to dark luxury palette

### Typeform Carousel

- [ ] **CRSL-01**: Shared carousel component displays one question at a time with full-height centered layout
- [ ] **CRSL-02**: Fade transitions between questions (opacity + transform, CSS transitions)
- [ ] **CRSL-03**: Thin progress bar showing completion (N/10 questions)
- [ ] **CRSL-04**: Keyboard navigation — Enter to advance, arrow keys for multiple-choice selection
- [ ] **CRSL-05**: Accessible — ARIA live regions for question transitions, focus management on advance, `prefers-reduced-motion` support
- [ ] **CRSL-06**: Mobile-responsive with 48px minimum touch targets

### Phase 1: Come Together (AI Pre-Trip)

- [ ] **CT-01**: AI agent asks 10 adaptive free-text questions about user's mental state, life problems, and intention-setting
- [ ] **CT-02**: Questions adapt based on previous responses (AI decides next question from conversation context)
- [ ] **CT-03**: AI loading state with subtle animation, then full response revealed (not streamed)
- [ ] **CT-04**: After 10 questions, AI generates one sentence for the user to remember during the trip
- [ ] **CT-05**: Intention sentence displayed prominently and stored in Supabase
- [ ] **CT-06**: AI responses map to SWEMWBS baseline scoring behind the scenes
- [ ] **CT-07**: Conversation persisted to Supabase after each answer (resume on return)
- [ ] **CT-08**: Warm, non-clinical conversational tone (system prompt calibration)

### Phase 2: Right Now (In-Trip Check-In)

- [ ] **RN-01**: 10-question multiple-choice questionnaire presented in Typeform carousel
- [ ] **RN-02**: Each question has predefined choices plus an optional free-text "type your own" option
- [ ] **RN-03**: Responses map to validated instrument scores (MEQ-30, EDI, EBI) via deterministic scoring
- [ ] **RN-04**: Intention sentence from Phase 1 displayed as grounding anchor during Phase 2
- [ ] **RN-05**: Responses stored in Supabase JSONB

### Phase 3: Over Me (Post-Trip Reflection)

- [ ] **OM-01**: AI generates tailored questions based on Phase 1 conversation + Phase 2 responses
- [ ] **OM-02**: 10 adaptive questions exploring integration, insights, and changes noticed
- [ ] **OM-03**: After 10 questions, AI generates a holistic trip summary referencing all three phases
- [ ] **OM-04**: Trip summary stored in Supabase and accessible from session profile
- [ ] **OM-05**: AI responses map to Integration Scales scoring behind the scenes

### Comparison View

- [ ] **COMP-01**: Before/after comparison showing validated instrument score shifts (SWEMWBS delta, MEQ-30 factors, EDI, EBI)
- [ ] **COMP-02**: AI-generated narrative summary alongside instrument score charts (dual view)
- [ ] **COMP-03**: Recharts visualizations for instrument scores with meaningful thresholds highlighted (e.g., MEQ-30 complete mystical experience >= 3.0, SWEMWBS meaningful change >= 3 points)

### Session Management

- [ ] **SESS-01**: Profile section accessible from footer navigation
- [ ] **SESS-02**: List of all sessions with date, phase completion status indicators
- [ ] **SESS-03**: User can start a new session from profile
- [ ] **SESS-04**: User can view session summary (AI trip summary from Phase 3)
- [ ] **SESS-05**: User can delete a session

### Navigation & Layout

- [ ] **NAV-01**: Three-phase navigation labeled "Come Together", "Right Now", "Over Me"
- [ ] **NAV-02**: Footer contains profile/session management link
- [ ] **NAV-03**: Phase navigation shows completion status per phase

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Analytics

- **ANLT-01**: Cross-journey pattern detection (trends across multiple completed trips)
- **ANLT-02**: Rich dashboard with instrument score trends over time
- **ANLT-03**: Per-question score mapping transparency (power user feature)

### AI Enhancements

- **AIE-01**: Instrument score confidence indicators displayed to user
- **AIE-02**: Voice input option for AI conversation phases
- **AIE-03**: Cross-phase summarization optimization (token budget management)

### UX Polish

- **UXP-01**: Auto-advance on multiple-choice selection (300-500ms delay)
- **UXP-02**: Swipe gestures for mobile carousel navigation
- **UXP-03**: Animated progress celebrations on phase completion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Light mode / theme toggle | Dark luxury is the brand identity — not a preference |
| Real-time streaming AI text | Creates anxiety in meditative context; user chose "all at once" |
| Go-back/edit previous answers | Breaks forward-only reflective flow |
| Social features / sharing | Privacy-critical personal journal about psychedelic experiences |
| Gamification (badges, streaks) | Trivializes deeply personal experience |
| Multi-select or matrix questions | Breaks one-at-a-time meditative UX |
| AI personality customization | Maintenance nightmare; get one warm tone right |
| Push notifications | No native app dependency; users self-manage rhythm |
| Offline mode | Requires Supabase for auth/data; enormous complexity |
| OAuth social login | Email/password sufficient for v1 |
| Mobile native app | Web-first SPA on Vercel |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| DSGN-01 | Phase 2 | Complete |
| DSGN-02 | Phase 2 | Complete |
| DSGN-03 | Phase 2 | Complete |
| DSGN-04 | Phase 2 | Complete |
| DSGN-05 | Phase 2 | Complete |
| CRSL-01 | Phase 2 | Pending |
| CRSL-02 | Phase 2 | Pending |
| CRSL-03 | Phase 2 | Pending |
| CRSL-04 | Phase 2 | Pending |
| CRSL-05 | Phase 2 | Pending |
| CRSL-06 | Phase 2 | Pending |
| CT-01 | Phase 4 | Pending |
| CT-02 | Phase 4 | Pending |
| CT-03 | Phase 4 | Pending |
| CT-04 | Phase 4 | Pending |
| CT-05 | Phase 4 | Pending |
| CT-06 | Phase 4 | Pending |
| CT-07 | Phase 4 | Pending |
| CT-08 | Phase 4 | Pending |
| RN-01 | Phase 3 | Pending |
| RN-02 | Phase 3 | Pending |
| RN-03 | Phase 3 | Pending |
| RN-04 | Phase 3 | Pending |
| RN-05 | Phase 3 | Pending |
| OM-01 | Phase 5 | Pending |
| OM-02 | Phase 5 | Pending |
| OM-03 | Phase 5 | Pending |
| OM-04 | Phase 5 | Pending |
| OM-05 | Phase 5 | Pending |
| COMP-01 | Phase 6 | Pending |
| COMP-02 | Phase 6 | Pending |
| COMP-03 | Phase 6 | Pending |
| SESS-01 | Phase 6 | Pending |
| SESS-02 | Phase 6 | Pending |
| SESS-03 | Phase 6 | Pending |
| SESS-04 | Phase 6 | Pending |
| SESS-05 | Phase 6 | Pending |
| NAV-01 | Phase 6 | Pending |
| NAV-02 | Phase 6 | Pending |
| NAV-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after roadmap creation*
