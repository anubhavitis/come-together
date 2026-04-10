# Phase 4: Come Together (AI Pre-Trip) - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the "Come Together" AI-driven pre-trip conversation: 10 adaptive free-text questions about mental state, life problems, and intention-setting. The AI adapts each question based on previous responses. After 10 questions, generates a single intention sentence. Behind the scenes, the system extracts SWEMWBS baseline scores from the conversation. Data persisted to Supabase for resume capability.

This is the first phase that calls the `/api/chat` endpoint built in Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Conversation UX
- **D-01:** Chat-style interface, NOT the QuestionCarousel. Phase 4 is adaptive free-text — the user types responses, the AI generates contextual follow-up questions. This requires a conversational UI (message bubbles or similar), not the multiple-choice carousel from Phase 3.
- **D-02:** AI question appears with a loading state (subtle animation), then the full response is revealed all at once (not streamed). Matches CT-03 and PROJECT.md decision ("all-at-once AI response").
- **D-03:** User input is a single text area with generous height. Dark luxury styling. Warm, inviting placeholder text.
- **D-04:** Present in the Typeform-style vertical flow — one question visible at a time with the user's previous answer. NOT a scrolling chat log. Each Q&A pair fades in, maintaining the meditative pace from Phase 3.

### System Prompt Design
- **D-05:** The `/api/chat` system prompt must serve dual purposes: (1) guide the AI to ask warm, conversational questions about wellbeing, mental state, and intentions, and (2) instruct the AI to include a structured JSON block in each response for SWEMWBS score extraction.
- **D-06:** The structured scoring block is parsed client-side and stripped from the displayed response. The user never sees the scoring data. Format: `<!--SCORES:{"swemwbs":{"item1":3,"item2":4}}-->` embedded in the AI response.
- **D-07:** The system prompt includes the 7 SWEMWBS item descriptions so the AI can map conversation content to the correct items. The AI progressively fills in scores as the conversation reveals relevant information.
- **D-08:** Conversation tone: warm, non-clinical, like a thoughtful friend. Not a therapist, not a survey. Per CT-08.

### API Integration
- **D-09:** Client calls `/api/chat` with the full conversation history (`messages` array). The system prompt is server-side only (already in `api/chat.ts` — needs to be updated with the Phase 4 prompt).
- **D-10:** The API endpoint needs a way to differentiate Phase 4 (pre-trip) calls from future Phase 5 (post-trip) calls. Add a `phase` field to the request body: `{ messages, phase: 'phase1' | 'phase3' }`. The server selects the appropriate system prompt based on phase.
- **D-11:** Loading state while waiting for AI: subtle pulsing animation or typing indicator. Response appears all at once when complete.

### Conversation Persistence & Resume
- **D-12:** Store the conversation as an array of message objects in the phase1 JSONB data. Use a new field on `Phase1` type or extend `innerLandscapeText` to include conversation data.
- **D-13:** On page load, check if conversation data exists. If so, restore messages and continue from the next question number. The user picks up where they left off.
- **D-14:** Save after each Q&A exchange (user answer + AI response). Use existing `useUpsertPhase1` mutation, not `useAutoSave` (conversation saves are discrete events, not debounced).

### Intention Sentence Generation
- **D-15:** After 10 Q&A pairs, make one final API call with the full conversation context plus a specific instruction: "Based on our entire conversation, generate a single sentence for the user to carry as their intention into their experience."
- **D-16:** The intention sentence is displayed prominently — large text, centered, warm accent color. Stored in the existing `intentions.primary` field on `Phase1`.
- **D-17:** After the intention is shown, mark phase1 as complete (`completedAt` timestamp).

### SWEMWBS Score Extraction
- **D-18:** After all 10 questions, aggregate the SWEMWBS scores extracted from AI responses. Take the latest score for each item (later responses may revise earlier assessments). Store in the existing `swemwbs` field on `Phase1`.
- **D-19:** Items not scored by the AI default to median (3 on the 1-5 scale). This matches the Phase 3 pattern for unmapped items.

### Claude's Discretion
- Exact system prompt wording (as long as it achieves the dual purpose)
- Loading animation specifics
- Whether to show a question counter ("Question 3 of 10") or keep it implicit
- Exact conversation field name in the Phase1 JSONB
- Whether to show previous Q&A pairs above the current question or only the current exchange

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API & Infrastructure
- `api/chat.ts` -- Existing serverless function. Needs system prompt update and phase-routing logic.
- `.planning/phases/01-infrastructure-skeleton/01-CONTEXT.md` -- API contract: `{ messages, phase }` request, `{ message }` response.

### Data Layer
- `src/hooks/use-phase1.ts` -- Existing Phase1 data hooks (`usePhase1`, `useUpsertPhase1`)
- `src/types/journey.ts` -- `Phase1` type with `swemwbs`, `innerLandscapeText`, `intentions` fields
- `src/lib/schemas.ts` -- Zod schemas for Phase1 data
- `src/data/swemwbs-items.ts` -- SWEMWBS item definitions (7 items, text descriptions)

### Design & UX
- `DESIGN.md` -- Dark luxury aesthetic
- `src/components/shared/question-carousel.tsx` -- NOT used for this phase, but reference for the meditative pacing pattern
- `.planning/phases/02-design-system-typeform-carousel/02-CONTEXT.md` -- Design token decisions

### Requirements
- `.planning/REQUIREMENTS.md` -- CT-01 through CT-08

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `api/chat.ts` -- Working serverless function with auth verification and `generateText`. Needs system prompt enhancement.
- `usePhase1` / `useUpsertPhase1` -- Query/mutation hooks for Phase1 data. Already handle camelCase↔snake_case.
- `useAuth` -- Provides user session for API auth token.
- `SaveIndicator` -- Shows save status (reuse for conversation persistence feedback).

### Established Patterns
- Phase 3's route page (`phase2.tsx`) shows the carousel integration pattern — but Phase 4 uses a different UI
- `initialized` guard pattern for form state
- Supabase access token from `supabase.auth.getSession()` for API Authorization header

### Integration Points
- `src/routes/journey/$id/phase1.tsx` -- Currently a static form with LikertScale/VASSlider inputs. Must be replaced with the AI conversation UI.
- `api/chat.ts` -- System prompt needs updating; request body needs `phase` field
- `src/types/journey.ts` -- May need `ConversationMessage` type and Phase1 conversation field
- `src/lib/supabase.ts` -- Client for getting auth token to send to API

</code_context>

<specifics>
## Specific Ideas

- The conversation should feel like talking to a warm, thoughtful friend before a meaningful experience — not a clinical intake form
- The "all at once" response reveal creates a moment of anticipation. The loading state should feel calm, not anxious
- The intention sentence is the most important output. It should feel like a gift from the conversation, not a summary
- The SWEMWBS extraction is invisible to the user. If the AI can't confidently score an item, it defaults to median rather than guessing

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 04-come-together-ai-pre-trip*
*Context gathered: 2026-04-10*
