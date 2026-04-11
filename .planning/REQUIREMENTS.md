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

- [x] **CT-01**: AI agent asks 10 adaptive free-text questions about user's mental state, life problems, and intention-setting
- [x] **CT-02**: Questions adapt based on previous responses (AI decides next question from conversation context)
- [x] **CT-03**: AI loading state with subtle animation, then full response revealed (not streamed)
- [x] **CT-04**: After 10 questions, AI generates one sentence for the user to remember during the trip
- [x] **CT-05**: Intention sentence displayed prominently and stored in Supabase
- [x] **CT-06**: AI responses map to SWEMWBS baseline scoring behind the scenes
- [x] **CT-07**: Conversation persisted to Supabase after each answer (resume on return)
- [x] **CT-08**: Warm, non-clinical conversational tone (system prompt calibration)

### Phase 2: Right Now (In-Trip Check-In)

- [x] **RN-01**: 10-question multiple-choice questionnaire presented in Typeform carousel
- [x] **RN-02**: Each question has predefined choices plus an optional free-text "type your own" option
- [x] **RN-03**: Responses map to validated instrument scores (MEQ-30, EDI, EBI) via deterministic scoring
- [x] **RN-04**: Intention sentence from Phase 1 displayed as grounding anchor during Phase 2
- [x] **RN-05**: Responses stored in Supabase JSONB

### Phase 3: Over Me (Post-Trip Reflection)

- [x] **OM-01**: AI generates tailored questions based on Phase 1 conversation + Phase 2 responses
- [x] **OM-02**: 10 adaptive questions exploring integration, insights, and changes noticed
- [x] **OM-03**: After 10 questions, AI generates a holistic trip summary referencing all three phases
- [x] **OM-04**: Trip summary stored in Supabase and accessible from session profile
- [x] **OM-05**: AI responses map to Integration Scales scoring behind the scenes

### Comparison View

- [x] **COMP-01**: Before/after comparison showing validated instrument score shifts (SWEMWBS delta, MEQ-30 factors, EDI, EBI)
- [x] **COMP-02**: AI-generated narrative summary alongside instrument score charts (dual view)
- [x] **COMP-03**: Recharts visualizations for instrument scores with meaningful thresholds highlighted (e.g., MEQ-30 complete mystical experience >= 3.0, SWEMWBS meaningful change >= 3 points)

### Session Management

- [x] **SESS-01**: Profile section accessible from footer navigation
- [x] **SESS-02**: List of all sessions with date, phase completion status indicators
- [x] **SESS-03**: User can start a new session from profile
- [x] **SESS-04**: User can view session summary (AI trip summary from Phase 3)
- [x] **SESS-05**: User can delete a session

### Navigation & Layout

- [x] **NAV-01**: Three-phase navigation labeled "Come Together", "Right Now", "Over Me"
- [x] **NAV-02**: Footer contains profile/session management link
- [x] **NAV-03**: Phase navigation shows completion status per phase

## v1.1 Requirements

Requirements for Claude Code Proxy Integration milestone.

### Proxy Server

- [x] **PROXY-01**: Claude-code-proxy server cloned, configured, and running (locally or on a hosted platform like Railway/Fly.io)
- [x] **PROXY-02**: Proxy configured with correct API keys and model routing (SMALL_MODEL targets Claude Haiku)
- [x] **PROXY-03**: Proxy exposes an endpoint compatible with the Anthropic Messages API format

### App Integration

- [x] **APINT-01**: `api/chat.ts` updated to use configurable base URL (`ANTHROPIC_BASE_URL` env var) instead of hardcoded Anthropic API endpoint
- [x] **APINT-02**: When `ANTHROPIC_BASE_URL` is set, all AI requests route through the proxy; when unset, direct Anthropic calls work as fallback
- [x] **APINT-03**: `.env.example` updated to document the new `ANTHROPIC_BASE_URL` variable

### Validation

- [x] **VAL-01**: Phase 1 (Come Together) AI conversation works through the proxy — questions are adaptive, SWEMWBS scoring extracts correctly
- [x] **VAL-02**: Phase 3 (Over Me) AI conversation works through the proxy — cross-phase context feeds correctly, trip summary generates
- [x] **VAL-03**: Score extraction (`<!--SCORES:{...}-->` pattern) works reliably through the proxy with the target model

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
| CT-01 | Phase 4 | Complete |
| CT-02 | Phase 4 | Complete |
| CT-03 | Phase 4 | Complete |
| CT-04 | Phase 4 | Complete |
| CT-05 | Phase 4 | Complete |
| CT-06 | Phase 4 | Complete |
| CT-07 | Phase 4 | Complete |
| CT-08 | Phase 4 | Complete |
| RN-01 | Phase 3 | Complete |
| RN-02 | Phase 3 | Complete |
| RN-03 | Phase 3 | Complete |
| RN-04 | Phase 3 | Complete |
| RN-05 | Phase 3 | Complete |
| OM-01 | Phase 5 | Complete |
| OM-02 | Phase 5 | Complete |
| OM-03 | Phase 5 | Complete |
| OM-04 | Phase 5 | Complete |
| OM-05 | Phase 5 | Complete |
| COMP-01 | Phase 6 | Complete |
| COMP-02 | Phase 6 | Complete |
| COMP-03 | Phase 6 | Complete |
| SESS-01 | Phase 6 | Complete |
| SESS-02 | Phase 6 | Complete |
| SESS-03 | Phase 6 | Complete |
| SESS-04 | Phase 6 | Complete |
| SESS-05 | Phase 6 | Complete |
| NAV-01 | Phase 6 | Complete |
| NAV-02 | Phase 6 | Complete |
| NAV-03 | Phase 6 | Complete |
| PROXY-01 | Phase 7 | Complete |
| PROXY-02 | Phase 7 | Complete |
| PROXY-03 | Phase 7 | Complete |
| APINT-01 | Phase 7 | Complete |
| APINT-02 | Phase 7 | Complete |
| APINT-03 | Phase 7 | Complete |
| VAL-01 | Phase 8 | Complete |
| VAL-02 | Phase 8 | Complete |
| VAL-03 | Phase 8 | Complete |

**Coverage:**
- v1 requirements: 43 total (all complete)
- v1.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-11 after v1.1 roadmap creation*
