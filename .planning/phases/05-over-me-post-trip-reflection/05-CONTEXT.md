# Phase 5: Over Me (Post-Trip Reflection) - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the "Over Me" post-trip reflection: AI generates 10 tailored questions based on Phase 1 (conversation) and Phase 2 (scores) data, followed by a holistic trip summary spanning all three phases. Behind the scenes, the system extracts Integration Scales scores. Data stored as a Phase3Entry in Supabase.

This phase reuses the conversation infrastructure from Phase 4 (useConversation hook, score-parser, API phase routing) with Phase 5-specific system prompt and scoring targets.

</domain>

<decisions>
## Implementation Decisions

### Cross-Phase Context Feeding
- **D-01:** The Phase 5 system prompt includes a condensed summary of Phase 1 and Phase 2 data so the AI can reference the user's specific journey details. This context is assembled client-side before sending to the API.
- **D-02:** Phase 1 context includes: the intention sentence, key themes from the conversation (extracted from stored messages), and SWEMWBS scores.
- **D-03:** Phase 2 context includes: MEQ-30 subscale scores with interpretation (e.g., "high mystical experience"), EDI/EBI summary scores, and any free-text responses.
- **D-04:** The cross-phase context is injected into the system prompt as a structured block, not as user messages. The API `phase` field routes to `PHASE3_SYSTEM_PROMPT` (already prepared in `api/chat.ts`).

### Conversation UX
- **D-05:** Reuse the same chat-style vertical flow from Phase 4. One Q&A pair at a time, fade transitions, loading animation, dark luxury styling. The `useConversation` hook is the foundation — adapted for Phase 5's different storage target (Phase3Entry instead of Phase1).
- **D-06:** The AI should reference specific details from earlier phases: "You mentioned feeling disconnected from your partner..." or "Your experience showed a high degree of ego dissolution..." — this is what makes Phase 5 personalized.

### Trip Summary Generation
- **D-07:** After 10 Q&A pairs, make a final API call with full cross-phase context (Phase 1 + Phase 2 + Phase 3 conversation) and instruction to generate a holistic trip summary.
- **D-08:** The trip summary should be 3-5 paragraphs: what the user came in with (Phase 1), what they experienced (Phase 2), and what shifted/integrated (Phase 3). Written in warm second-person ("You came into this experience feeling...").
- **D-09:** The trip summary is displayed as a full-page view with rich typography. Stored in the Phase3Entry and accessible from session management (Phase 6).

### Integration Scales Extraction
- **D-10:** Use the same `<!--SCORES:...-->` HTML comment pattern from Phase 4. The system prompt includes Integration Scales items (Engaged: 8 items, Experienced: 4 items) instead of SWEMWBS.
- **D-11:** Extend `score-parser.ts` to handle `integration_engaged` and `integration_experienced` score keys alongside `swemwbs`.
- **D-12:** Unscored items default to median (3 on the 1-5 scale). Same pattern as Phases 3 and 4.

### Data Storage
- **D-13:** Create a new Phase3Entry for this reflection. The existing `useCreatePhase3Entry` and `useUpsertPhase3Entry` hooks handle creation and updates.
- **D-14:** Add `conversation` and `tripSummary` fields to the Phase3Entry type. Requires a Supabase migration to add these JSONB columns to `phase3_entries`.
- **D-15:** Conversation persisted after each exchange (same discrete-save pattern as Phase 4). Trip summary saved on completion along with Integration Scales scores.

### Reuse Strategy
- **D-16:** The `useConversation` hook from Phase 4 should be generalized or a parallel `usePhase3Conversation` hook created that follows the same pattern but targets Phase3Entry storage. Prefer generalization if the hook can be parameterized cleanly.
- **D-17:** The `score-parser.ts` utilities (`parseScoresFromResponse`, `stripScoresFromResponse`) already work for any score key structure. Only `aggregateSwemwbsScores` needs a parallel `aggregateIntegrationScores` function.

### Claude's Discretion
- Exact system prompt wording for Phase 5 (must reference Phase 1/2 data and target Integration Scales)
- Whether to generalize `useConversation` or create a parallel hook
- Trip summary exact format and paragraph structure
- Whether to show a "loading summary" state differently from regular question loading

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Infrastructure to Reuse
- `src/hooks/use-conversation.ts` -- Phase 4 conversation hook. Core pattern to reuse/adapt.
- `src/lib/score-parser.ts` -- Score extraction/stripping/aggregation. Extend for Integration Scales.
- `api/chat.ts` -- Already has `PHASE3_SYSTEM_PROMPT` placeholder and phase routing.
- `src/routes/journey/$id/phase1.tsx` -- Phase 4 conversation UI pattern to replicate.

### Data Layer
- `src/hooks/use-phase3.ts` -- Phase3Entry CRUD hooks (`useCreatePhase3Entry`, `useUpsertPhase3Entry`)
- `src/types/journey.ts` -- `Phase3Entry` type with `engagedIntegration`, `experiencedIntegration`, `intentionIntegration`, `openReflection` fields
- `src/lib/schemas.ts` -- Zod schemas

### Requirements
- `.planning/REQUIREMENTS.md` -- OM-01 through OM-05

### Prior Phase Context
- `.planning/phases/04-come-together-ai-pre-trip/04-CONTEXT.md` -- Phase 4 conversation decisions (patterns to follow)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useConversation` hook — manages entire AI chat lifecycle. Can be parameterized for Phase 5.
- `parseScoresFromResponse` / `stripScoresFromResponse` — score-key agnostic, works for any instrument.
- `aggregateSwemwbsScores` — pattern to replicate for Integration Scales.
- Phase 1 conversation UI (`phase1.tsx`) — the exact visual pattern to replicate for Phase 5.

### Established Patterns
- `<!--SCORES:{"key":{"item1":3}}-->` — hidden scoring in AI responses
- Discrete saves after each Q&A exchange via mutation hooks
- `initialized` guard + resume from stored conversation
- Final generation call (intention/summary) after 10 Q&A pairs

### Integration Points
- `api/chat.ts` — `PHASE3_SYSTEM_PROMPT` needs real content with Integration Scales scoring instructions
- `src/routes/journey/$id/phase3.new.tsx` — stub route for new Phase 3 entry, needs full implementation
- `src/types/journey.ts` — Phase3Entry needs `conversation` and `tripSummary` fields
- `supabase/migrations/` — new migration for phase3_entries columns
- `src/lib/score-parser.ts` — add `aggregateIntegrationScores`

</code_context>

<specifics>
## Specific Ideas

- The trip summary is the crown jewel of the entire app. It should feel like receiving a letter about your experience — warm, personal, insightful.
- The AI's ability to reference Phase 1 and Phase 2 specifics is what makes this phase magical. "When you told me you wanted to let go of your fear of failure, and then your experience showed a high degree of ego dissolution — that alignment suggests..." 
- This phase should feel like coming home. The visual pace is gentle, the questions are reflective, the summary is a gift.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 05-over-me-post-trip-reflection*
*Context gathered: 2026-04-10*
