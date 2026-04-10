# Come Together

## What This Is

A psychedelic journey journal that guides users through three phases — pre-trip AI assessment, in-trip check-in, and post-trip reflection — using adaptive questionnaires and AI-generated insights. Named after the Beatles track, the three phases are "Come Together" (before), "Right Now" (during), and "Over Me" (after). Dark luxury aesthetic inspired by Pinterest's warm design language.

## Core Value

The AI-driven adaptive questioning must feel like a thoughtful conversation, not a clinical survey — while still mapping responses to validated psychedelic research instruments (MEQ-30, EDI, EBI, SWEMWBS) behind the scenes.

## Requirements

### Validated

- [x] Supabase auth with email/password login — existing
- [x] Journey CRUD (create, list, delete sessions) — existing
- [x] Phase data model with JSONB columns per section — existing
- [x] RLS policies scoped to auth.uid() on all tables — existing
- [x] Auto-save with debounce (500ms), flush on blur/visibility — existing
- [x] Zod schemas for all JSONB instrument data — existing
- [x] TanStack Router file-based routing — existing
- [x] TanStack Query hooks for all data operations — existing
- [x] Dark mode design token system in Tailwind v4 — existing
- [x] Validated instrument scoring logic (MEQ-30, EDI, EBI, SWEMWBS) — existing

### Active

- [ ] Redesign UI to dark luxury Pinterest-inspired aesthetic (DESIGN.md adapted for dark mode)
- [ ] "Come Together" (Phase 1): AI agent asks 10 adaptive free-text questions about mental state, life problems, and intention-setting, using Vercel AI SDK + Claude Haiku
- [ ] "Come Together" generates one sentence for the user to remember during the trip
- [ ] AI questions map responses to validated instrument scores (SWEMWBS baseline) behind the scenes
- [ ] "Right Now" (Phase 2): 10-question multiple-choice questionnaire with optional free-text, Typeform-style vertical carousel with fade transitions
- [ ] "Right Now" maps responses to validated instrument scores (MEQ-30, EDI, EBI) behind the scenes
- [ ] "Over Me" (Phase 3): AI-tailored questionnaire based on Phase 1 + Phase 2 responses, followed by AI-generated trip summary
- [ ] Typeform-style one-question-at-a-time UX with fade transitions for all questionnaire phases
- [ ] Comparison view showing before/after shifts using validated instrument scores
- [ ] Session management via profile section in footer (start, view, delete sessions, review summaries)
- [ ] Streaming AI responses appear all at once (loading state, then reveal)
- [ ] Store all AI conversation data and questionnaire responses in Supabase

### Out of Scope

- Light mode / theme toggle — dark mode only, by design
- Real-time collaboration or multi-user features — personal journal
- Mobile native app — web-first SPA on Vercel
- OAuth social login — email/password is sufficient
- Push notifications — not needed for a journal app
- Export to PDF/CSV — existing JSON export covers this
- Analytics or usage tracking — privacy-first, no tracking

## Context

**Existing codebase:** Brownfield React SPA with Supabase backend. Auth, routing, data hooks, and instrument scoring already work. The pivot is from static validated questionnaires to AI-driven adaptive questioning while preserving the scoring logic underneath.

**Design direction:** Dark luxury — deep blacks, Pinterest Red (#e60023) as singular bold accent, warm olive/sand-toned neutrals adapted for dark surfaces. Pin Sans-inspired typography. Generous border-radius (16px buttons, 20px+ cards). No shadows — depth from warm surface colors. See DESIGN.md for full reference.

**AI integration:** Vercel AI SDK (ai-sdk.dev) with Claude Haiku model. API key provided by user. Server-side API route needed for AI calls (or edge function).

**Instrument mapping:** The AI asks conversational questions but the system maps free-text responses to validated psychedelic research instruments behind the scenes. This is a key technical challenge — the AI prompt engineering must elicit responses that can be scored against MEQ-30, EDI, EBI, SWEMWBS, and Integration Scales.

**Beatles naming:** The three phases reference "Come Together" — the song's progression mirrors the journey structure.

## Constraints

- **Tech stack**: Existing stack (Bun, Vite, React, TypeScript, Tailwind v4, TanStack Router/Query, Supabase, Zod) — no framework changes
- **New dependency**: Vercel AI SDK (@ai-sdk/anthropic) for Claude Haiku integration
- **API key**: User will provide Anthropic API key — must be stored securely (env var, never client-side)
- **Privacy**: No analytics, no tracking, all data in Supabase with RLS
- **Deploy**: Vercel SPA — AI SDK may require a serverless function or edge route for API calls
- **Design**: DESIGN.md is the design language reference, adapted for dark mode only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-driven adaptive questions over static instruments | More engaging, conversational UX while preserving research validity | -- Pending |
| Vercel AI SDK + Claude Haiku | User specified; cost-effective for 10-question conversations | -- Pending |
| Dark luxury over warm Pinterest white | User preference; fits psychedelic/meditative atmosphere | -- Pending |
| Typeform-style vertical carousel with fade transitions | Focused, meditative one-question-at-a-time UX | -- Pending |
| Keep comparison view alongside AI summary | User wants both visual instrument comparison AND AI narrative | -- Pending |
| All-at-once AI response (no streaming) | User preference; simpler UX with loading state | -- Pending |
| Simple session list over rich dashboard | v1 simplicity; dashboard can come later | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after Phase 4 completion — Come Together AI Pre-Trip (10-question adaptive AI conversation, SWEMWBS extraction, intention generation)*
