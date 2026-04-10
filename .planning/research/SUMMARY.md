# Research Summary — Inner Compass AI Layer

**Synthesized:** 2026-04-10
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

Inner Compass is adding a conversational AI assessment layer to an existing Vite/React/Supabase SPA. The core innovation is asking 10 natural-feeling questions per phase while silently mapping free-text responses to validated psychedelic research instruments (MEQ-30, EDI, EBI, SWEMWBS). No competitor does this. The technical implementation splits cleanly: a thin Vercel Serverless Functions layer handles all Anthropic API calls server-side, while the existing SPA and Supabase stack are unchanged except for a new conversation_logs table and extended phase hooks.

The highest-risk element is AI-to-instrument scoring accuracy. Published studies show LLM psychometric extraction achieves 88%+ agreement for depression instruments (BDI-FS), but psychedelic-specific instruments (MEQ-30, EDI) are untested. This is the single area requiring the most prompt engineering investment and validation time — budget 2-3x longer than expected. All other elements (serverless setup, Typeform carousel, conversation persistence) follow well-documented patterns with high confidence.

The build must begin with the API skeleton and serverless routing before any UI or AI logic, because everything downstream depends on a working /api/chat endpoint. The Typeform-style carousel is the second critical primitive — it is a shared component used by all three phases and must be built correctly once rather than iterated per phase.

---

## Key Findings

### Stack Additions

| Package | Purpose | Confidence |
|---------|---------|------------|
| `ai` v6.x (Vercel AI SDK) | `streamText`, `generateObject`, server-side AI orchestration | HIGH |
| `@ai-sdk/anthropic` v3.x | Claude Haiku provider for AI SDK | HIGH |
| `motion` v12.x | `AnimatePresence` for Typeform fade transitions | HIGH |
| `@fontsource-variable/plus-jakarta-sans` | Self-hosted variable font | HIGH |
| `vercel` CLI (dev dep) | Local dev for `/api` serverless functions | HIGH |

Do NOT add `@ai-sdk/react` or use `useChat`. The custom `useConversation` hook is the correct client-side abstraction. `useChat` is optimized for unbounded Next.js chat, not bounded 10-question structured assessments with scoring extraction.

ANTHROPIC_API_KEY must not use the VITE_ prefix. Server-only env var in Vercel project settings.

### Features

**Table stakes — must have at launch:**
- One-question-at-a-time display with fade transitions
- Keyboard navigation (Enter to advance, arrow keys for selection)
- Visible progress indicator (thin bar, not dots)
- Auto-advance after multiple-choice selection (300-500ms delay)
- Loading state while AI generates, then atomic reveal
- Conversation persistence across page refreshes
- Mobile-first touch interactions with 48px+ tap targets
- WCAG 2.1 AA accessibility throughout

**Differentiators:**
- AI-to-instrument mapping: conversational questions that silently produce SWEMWBS/MEQ-30/EDI/EBI scores (the core innovation)
- Phase-aware AI context: Phase 3 questions adapt based on Phase 1+2 data
- Single-sentence intention generation at end of Phase 1
- Before/after comparison view with validated instrument score visualizations
- AI-generated trip summary spanning all three phases
- Warm conversational tone — thoughtful friend, not clinical assessor

**Defer to v2+:**
- Voice journaling, social features, gamification, analytics dashboard, light mode, offline mode, cross-journey pattern detection

**Anti-features (explicitly avoid):**
- Real-time token-by-token streaming (project requires atomic reveal)
- Free-form open-ended chat (breaks instrument mapping)
- Multiple select or matrix questions (breaks one-at-a-time UX)
- Editable previous answers mid-flow

### Architecture

Three component boundaries to build:

1. `/api` serverless functions — All AI SDK Core calls happen here. Three endpoints: chat.ts (conversation), score.ts (instrument extraction via generateObject), summary.ts (trip narrative). Auth verified via Supabase JWT on every request. API key never touches client.

2. `useConversation` hook — Custom state machine (IDLE → USER_TYPING → SUBMITTING → AI_RESPONDING → IDLE/COMPLETE) managing message history, current index, and phase context. Conversation is ephemeral in React state during session; written to Supabase once on completion.

3. `TypeformCarousel` component — ~150 lines. Renders one question at a time using AnimatePresence from motion/react. translateY + opacity transitions. Index advances only after AI response fully received.

New database addition: conversation_logs table (JSONB messages + AI scores + model ID + token usage) with same RLS pattern as existing phase tables. Existing phase tables unchanged — AI-derived scores write to the same JSONB columns.

Local dev: Keep bun dev for the SPA. Run a separate Hono/Express dev server for /api routes. Configure Vite proxy: /api → http://localhost:3001. Do NOT rely on vercel dev as the primary dev workflow.

AI scoring approach: Post-conversation extraction. After 10 Q&A pairs, send full transcript to Claude with item-level scoring prompt using actual instrument item text and scale anchors. Use generateObject with Zod schemas. Null-handle items the conversation did not cover.

### Top Pitfalls

**Critical (architectural, must address before writing AI code):**

1. API key exposure — Never prefix with VITE_. Store as ANTHROPIC_API_KEY in Vercel env. Add CI check to scan for VITE_ANTHROPIC in source.

2. No server route for useChat — Vite SPA has no server. Build /api/chat.ts serverless function first. Configure vercel.json rewrites. Set up Vite proxy for local dev.

3. AI scoring hallucination — LLMs confidently produce plausible-but-wrong psychometric scores. Include actual instrument item text in scoring prompt, use generateObject with Zod constraints, add null/confidence fields for uncoverable items.

4. Bundle bloat — AI SDK adds ~67-186 kB if imported on the client. @ai-sdk/anthropic and AI core must only appear in /api functions. Measure with vite-bundle-visualizer after every AI-related PR.

**Moderate:**

5. Carousel accessibility trap — Use aria-live for question progress, programmatic focus on advance, aria-hidden (not DOM removal) for inactive questions, prefers-reduced-motion support.

6. Warm palette WCAG failures — Build a contrast matrix before implementing components. Pinterest Red only for large accent elements, never body text.

7. Dev environment fracture — Two-server approach: Vite + separate API server. Do not rely on vercel dev.

8. Auto-save triggering AI calls — AI requests fire only on explicit Enter/Submit. Auto-save persists conversation history but never triggers completions.

9. Conversation state lost on refresh — Persist messages + currentQuestion to Supabase after each Q&A pair.

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Infrastructure Skeleton**
Build the API layer before any AI feature work. Nothing downstream works without a verified /api/chat endpoint.
- Deliverables: vercel.json, api/chat.ts, api/_lib/auth.ts, Vite proxy config, ANTHROPIC_API_KEY env setup, working response from Claude Haiku
- Pitfalls: #1 (key exposure), #2 (missing server route), #7 (dev env fracture)
- Research flag: NO — well-documented Vercel pattern

**Phase 2: Design System + Typeform Carousel**
Build the shared UI primitive. Can run in parallel with Phase 1.
- Deliverables: Tailwind v4 design token overhaul (warm dark palette), Plus Jakarta Sans font, TypeformCarousel with AnimatePresence, progress indicator, keyboard navigation, WCAG accessibility
- Pitfalls: #5 (carousel accessibility), #6 (contrast failures)
- Research flag: NO — standard patterns

**Phase 3: Phase 2 "Right Now" — Multiple Choice Flow**
Use the carousel with pre-defined multiple-choice questions (no AI). Validates carousel UX and ships visible progress without prompt engineering risk.
- Deliverables: Phase 2 question set (curated instrument items), deterministic score mapping, conversation state persistence
- Pitfalls: #9 (state lost on refresh), #10 (item count mismatch — decide AI compression vs. curated subset upfront)
- Research flag: YES — which instrument items to include in Phase 2 needs validation before building

**Phase 4: Phase 1 "Come Together" — AI Free-Text Conversation**
First AI-powered phase.
- Deliverables: useConversation hook with state machine, api/score.ts with generateObject + Zod schemas for SWEMWBS extraction, conversation_logs table, single-sentence intention generation
- Pitfalls: #3 (hallucination), #4 (bundle bloat), #8 (auto-save triggering AI calls)
- Research flag: YES — scoring prompt design for SWEMWBS from free text needs dedicated iteration

**Phase 5: Phase 3 "Over Me" + AI Summary**
Cross-phase context injection and final narrative generation.
- Deliverables: Phase 1+2 context summarization for token budget management, Phase 3 AI-tailored questions, api/summary.ts, AI trip narrative stored to phase3_entries
- Pitfalls: #3 (MEQ-30/EDI/EBI scoring), token budget overflow on long conversations
- Research flag: YES — Phase 3 scoring (MEQ-30, EDI, EBI from free text) is more complex than Phase 1

**Phase 6: Comparison View + Polish**
Closes the loop with visualizations and dual AI-narrative + chart view.
- Deliverables: Recharts instrument score visualizations, SWEMWBS delta threshold ("meaningful change"), MEQ-30 "complete mystical experience" threshold, dual view (AI summary + charts), skeleton placeholders
- Pitfalls: #12 (chart layout shift)
- Research flag: NO

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages current and well-documented. Versions verified 2026-04-10. |
| Features | MEDIUM | Competitor analysis solid. Psychedelic app space is niche with limited public data. |
| Architecture | HIGH | Vercel serverless + Vite SPA is a well-documented production pattern. Custom useConversation over useChat is confirmed correct by SDK limitation docs. |
| AI Scoring Accuracy | LOW-MEDIUM | Architecture for structured extraction is sound. Accuracy for psychedelic instruments from free text is genuinely unknown — published studies only cover depression instruments. |
| Pitfalls | HIGH | All critical pitfalls grounded in official docs, published bundle measurements, and W3C standards. |

### Gaps to Address During Planning

1. Phase 2 instrument scope — Which MEQ-30/EDI/EBI items to include in the 10-question Phase 2 set. Psychometric decision needed before writing Phase 2 code.

2. AI scoring validation plan — How to measure whether AI-extracted scores are accurate enough to present as "research-validated." Need baseline comparison methodology before Phase 4 ships.

3. Token budget for Phase 3 — Phase 1 + Phase 2 context passed to Phase 3 could approach limits with verbose users. Summarization strategy must be defined before Phase 5.

4. Score confidence display UX — Show a disclaimer for AI-estimated scores. The exact UI for communicating score uncertainty is undefined.

---

## Sources

- Vercel AI SDK Documentation: https://ai-sdk.dev/docs/introduction
- AI SDK Anthropic Provider: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- Motion for React: https://motion.dev/
- Vite on Vercel: https://vercel.com/docs/frameworks/frontend/vite
- Vercel Serverless Functions: https://vercel.com/docs/functions
- LLM Interactive Assessment for Depression Screening (PMC12848484): https://pmc.ncbi.nlm.nih.gov/articles/PMC12848484/
- STED framework for LLM structured output consistency (arxiv 2512.23712): https://arxiv.org/abs/2512.23712
- W3C WAI Carousel Tutorial: https://www.w3.org/WAI/tutorials/carousels/
- Vercel AI SDK bundle size measurement: https://blog.hyperknot.com/p/til-vercel-ai-sdk-the-bloat-king
- Rosebud AI Journal: https://www.rosebud.app/
- Fillout one-question-at-a-time completion research: https://www.fillout.com/blog/one-question-at-a-time-form
- useChat without API route (confirmed limitation): https://community.vercel.com/t/possible-to-use-ai-sdks-usechat-hook-without-an-api-route/6891
