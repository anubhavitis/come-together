# Feature Landscape

**Domain:** AI-driven psychedelic journey journal with adaptive questionnaires
**Researched:** 2026-04-10
**Confidence:** MEDIUM (based on competitor analysis of Rosebud, Reflection.app, Mindsera, Field Trip, Vivid + domain research; psychedelic app space is niche with limited public data)

## Table Stakes

Features users expect from a conversational questionnaire / AI journal experience. Missing any of these and the product feels broken or amateurish.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-question-at-a-time display | Typeform pioneered this; users now expect focused single-question views in any "conversational" form. Research shows forms with >6 visible questions drop completion below 50%. | Medium | Vertical layout with active question centered, adjacent questions faded. Must work as the shared UX primitive for all three phases. |
| Smooth fade transitions between questions | Without transitions, stepping through questions feels like page reloads. Every Typeform competitor implements this. | Low | CSS transitions on opacity + transform. Must respect `prefers-reduced-motion`. |
| Keyboard navigation (Enter to advance, arrow keys for choices) | Typeform's keyboard-first design is a core part of the UX. Mouse-only breaks the meditative flow. | Medium | Enter = next question, Up/Down = select choice. Must be discoverable via hint text. |
| Progress indicator | Users need to know where they are in a 10-question flow. Without it, abandonment spikes. Fillout research confirms this. | Low | Thin progress bar (not step dots) fits dark luxury aesthetic. Percentage or N/M count. |
| Auto-advance after selection (for multiple choice) | Standard Typeform behavior. After selecting a choice, auto-advance to next question with brief delay (300-500ms). | Low | Only for single-select multiple choice in Phase 2. Free-text (Phase 1/3) requires explicit Enter. |
| AI response with loading state | PROJECT.md says "all at once" (loading then reveal). There MUST be a visible loading indicator while AI generates. Dead silence = broken. | Low | Skeleton/typing indicator during generation, then fade-in the AI message. |
| Conversation persistence (resume interrupted sessions) | Users will close tabs mid-conversation. Losing 5 answers is unacceptable. Rosebud and every journal app preserve state. | Medium | Save conversation state to Supabase after each answer. Restore on return. Extends existing auto-save pattern. |
| Mobile-responsive touch interactions | PROJECT.md specifies mobile-first. Most personal journaling happens on phones. Typeform was redesigned for touch-first. | Medium | Large tap targets (min 48px), swipe-optional but tap/button must work perfectly. Test 320-768px. |
| Accessible to screen readers | WCAG 2.1 AA minimum. Any form tool must be accessible. | Medium | Live regions for question transitions, proper focus management, ARIA labels on all interactive elements. |
| Trip/session list with phase status | Users need to see all journeys with completion status per phase. Field Trip and Vivid both show journey timelines. | Low | Existing journey list. Enhance with phase completion indicators (dots, icons, or subtle progress). |
| Data privacy and no tracking | Table stakes per every wellness app review (APA, user feedback). Users journaling about psychedelic experiences are especially privacy-conscious. | Low | Already covered: Supabase RLS, anon key, no analytics. API key server-side only. |
| Validated instrument scoring | The core differentiator depends on this working. MEQ-30, EDI, EBI, SWEMWBS scoring already exists in `src/lib/scoring.ts`. | Low | Existing. Must be preserved through the AI layer. |

## Differentiators

Features that set Inner Compass apart from generic AI journals (Rosebud, Reflection, Mindsera) and existing psychedelic apps (Field Trip, Vivid). Not expected, but create the "aha" moment.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI-to-instrument mapping (hidden scoring) | **The core innovation.** No competitor does this. The AI asks conversational questions that feel natural, but responses are silently mapped to validated psychedelic research instruments (MEQ-30, EDI, EBI, SWEMWBS). Bridges clinical rigor with conversational UX. Rosebud tracks mood; this tracks validated research scores. | Very High | The central technical challenge. Requires prompt engineering so the LLM: (1) asks questions that naturally elicit scorable information per instrument dimension, (2) extracts/estimates numeric scores from free-text, (3) maintains conversational tone. May need a separate scoring prompt distinct from the conversation prompt. Research shows 98% accuracy for LLM-based instrument scoring from conversations (BDI-FS study), but that used depression instruments -- psychedelic instruments are untested. |
| Phase-aware AI context (Phase 3 adapts to Phase 1+2) | The AI remembers pre-trip state and experience, then asks tailored integration questions. Field Trip has 4 stages but no cross-stage AI continuity. Rosebud tracks weekly patterns but not multi-session context. | High | Pass Phase 1+2 conversation history + computed scores as context to Phase 3 system prompt. Token budget management critical -- may need summarization between phases. |
| Three-phase Beatles-named journey structure | "Come Together" / "Right Now" / "Over Me" gives personality and narrative arc. Field Trip has generic Preparation/Exploration/Reflection/Integration. No competitor has brand personality in their phase naming. | Low | Naming and navigation only. Already designed in PROJECT.md. |
| Before/after comparison view with validated scores | Field Trip aggregates across trips but without validated instruments. Rosebud shows weekly mood patterns. Neither maps to MEQ-30 factor scores or SWEMWBS deltas. The "complete mystical experience" threshold (mean >= 3.0 on all MEQ-30 subscales) is a compelling, specific visualization. | Medium | Existing comparison route + Recharts. Needs chart components for instrument scores. SWEMWBS delta >= 3 points = "meaningful change" is another powerful threshold to visualize. |
| Single-sentence intention generation | "Come Together" distills the pre-trip conversation into one sentence to carry into the experience. Personal, memorable, actionable. Neither Rosebud nor Field Trip generates a single-sentence takeaway. | Low | Single LLM call at end of Phase 1. Store prominently. Display during Phase 2 as a grounding anchor. |
| AI-generated trip summary after Phase 3 | Rosebud does per-entry summaries and weekly round-ups. But a holistic journey summary spanning preparation, experience, and integration -- referencing validated scores -- is unique. | Medium | Full journey context needed. Prompt must avoid clinical language while being insightful. Not streaming per spec. |
| Dual view: AI narrative + instrument charts | Users get both the human-readable AI summary AND the research-grade before/after comparison. Satisfies both emotional and analytical needs. No competitor offers both. | Medium | Combine AI summary panel alongside Recharts instrument visualizations. |
| Conversational tone calibration (warm, not clinical) | Psychedelic context demands warmth and safety. The AI must feel like a thoughtful friend, not a psychiatrist with a clipboard. Rosebud achieves this for general journaling. | Medium | System prompt engineering. Tone examples in prompt. Explicit instruction to avoid clinical jargon. |

## Anti-Features

Features to explicitly NOT build. Each has a clear reason for exclusion.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time streaming text (token by token) | PROJECT.md explicitly says "all at once." Streaming creates anxiety in a meditative context -- watching words appear letter-by-letter is the opposite of calm. | Loading state with subtle animation, then reveal complete response with fade-in. |
| Chatbot-style free-form conversation | Unconstrained chat makes instrument mapping nearly impossible. The AI must lead the conversation to elicit scorable responses. | AI asks specific questions (10 per phase), user responds. The AI leads, the user follows. Not a back-and-forth chat. |
| Light mode / theme toggle | Design decision per PROJECT.md. Dark luxury is the brand. A toggle dilutes the intentional aesthetic and doubles design/testing surface. | Dark mode only. Revisit as a separate milestone if users request it. |
| Voice input / audio recording | Adds STT dependency, audio storage, permissions. Marginal value for 10-question typed flows. Text input gives better instrument mapping accuracy. Rosebud added voice but it's optional. | Text input only for v1. Voice could be a future milestone. |
| Social features / community | Field Trip has chat groups. But psychedelic journaling is deeply personal. Social features create privacy risks and moderation burden. | Private personal journal. No sharing, no community, no public profiles. |
| Edit/go-back to previous answers mid-flow | Going back creates decision paralysis and breaks forward momentum in a reflective flow. | Allow reviewing answers in a summary at the end of each phase, but not editing mid-flow. The journey is forward-only. |
| Gamification (points, badges, streaks) | Trivializes a deeply personal experience. This is a journal, not Duolingo. | Quiet encouragement through AI tone. No scores shown during the conversation itself. |
| Multi-select or matrix questions | Survey patterns, not conversation patterns. Break the one-at-a-time meditative flow. | One question, one answer. Multiple choice is single-select. Free-text is single field. |
| Skip/branch logic visible to user | Showing "you skipped 3 questions" or conditional paths breaks the conversational illusion. | Adaptive questioning happens invisibly. AI decides next question based on prior answers, but user always sees "next question." Always 10 questions. |
| AI personality customization | "Choose your guide: therapist, friend, shaman" -- sounds cool, is a maintenance nightmare. Each personality needs separate prompt testing and instrument mapping validation. | One carefully crafted warm-but-insightful personality. Get it right once. |
| Push notifications / reminders | Out of scope per PROJECT.md. Adds native app dependency or service worker complexity. | Users self-manage their journaling rhythm. |
| Offline mode | SPA requires Supabase for auth and data. Full offline support is enormous complexity. | Graceful error handling when offline. Queue writes if briefly disconnected. |
| Rich dashboard with analytics | Premature. Comparison view covers the "insight" use case. Dashboard implies ongoing data patterns that need multiple completed journeys. | Simple session list with phase completion status. Dashboard in a future milestone. |

## Feature Dependencies

```
Typeform Carousel Component (shared primitive)
  ├── Phase 1 "Come Together" (AI free-text questions)
  ├── Phase 2 "Right Now" (multiple-choice questions)
  └── Phase 3 "Over Me" (AI-tailored questions)

AI Conversation Engine (Vercel AI SDK + Claude Haiku)
  ├── Phase 1 AI adaptive questioning
  │   ├── AI-to-instrument mapping (SWEMWBS)
  │   └── Single-sentence intention generation
  ├── Phase 3 AI-tailored questioning
  │   └── Phase-aware context (requires Phase 1 + Phase 2 data)
  └── AI-generated trip summary (requires all three phases)

Conversation State Persistence (extends existing auto-save)
  ├── Resume interrupted Phase 1/3 conversations
  └── Cross-phase context passing

Validated Instrument Scoring (existing)
  ├── AI-to-instrument mapping feeds scores
  ├── Before/after comparison view consumes scores
  └── AI trip summary references scores

Comparison View (existing route)
  └── Dual view: AI narrative + instrument charts
       ├── Requires AI trip summary
       └── Requires computed instrument scores
```

### Critical Path

1. **Typeform-style carousel component** -- shared by all three phases. Build first.
2. **AI conversation engine (Vercel AI SDK)** -- required for Phase 1, Phase 3, and summary.
3. **AI-to-instrument mapping** -- the technical crux. Without this, the "conversational but scored" value prop collapses.
4. **Conversation state persistence** -- without this, users lose progress and multi-phase structure breaks.

## MVP Recommendation

**Prioritize (build first -- validates the UX):**

1. Typeform-style carousel component with fade transitions, progress indicator, keyboard/touch support
2. Phase 2 "Right Now" as multiple-choice Typeform flow (simpler than AI -- validates carousel UX with existing instrument items)
3. Dark luxury redesign applied to existing pages + new carousel

**Prioritize next (core AI value prop):**

4. AI conversation engine for Phase 1 "Come Together" with Vercel AI SDK + Claude Haiku
5. Conversation state persistence in Supabase (JSONB conversation array)
6. AI-to-instrument mapping (prompt engineering + score extraction for SWEMWBS)
7. Single-sentence intention generation (low effort, high emotional impact)

**Prioritize last (complete the loop):**

8. Phase 3 "Over Me" AI-tailored questionnaire using Phase 1+2 context
9. AI-generated trip summary
10. Before/after comparison view with instrument score visualizations (Recharts)
11. Session management in profile/footer section

**Defer (validate need first):**
- Per-question score mapping transparency -- power user feature
- Instrument score confidence indicators -- research credibility, not v1 UX
- Cross-journey pattern detection (Rosebud-style) -- requires multiple completed journeys
- Voice journaling -- adds STT complexity, marginal benefit for scored text

## Complexity Assessment

| Feature Area | Complexity | Rationale |
|-------------|------------|-----------|
| Typeform-style carousel UX | Medium | CSS transitions + keyboard handling + focus management. Well-documented patterns. Custom React implementation -- no library needed. |
| AI conversation flow (single phase) | High | Prompt engineering for instrument mapping is the hard part. Vercel AI SDK handles infrastructure. Risk: prompts that reliably elicit scorable responses across diverse users. |
| Cross-phase AI context | High | Token budget management. Phase 1 (10 Q&A pairs) + Phase 2 responses could exceed context if not summarized. Need a summarization step between phases. |
| Instrument score extraction from free text | Very High | Core technical challenge. BDI-FS study shows 98% accuracy but used depression instruments. Psychedelic-specific instruments (MEQ-30, EDI) are untested with LLM extraction. Expect lower accuracy initially. Needs extensive prompt iteration. |
| Conversation persistence | Low-Medium | Extends existing auto-save. Store conversation array in JSONB. Restore on page load. Edge case: concurrent tabs (existing `updated_at` conflict detection helps). |
| Session management UI | Low | Simple list with status indicators. Existing journey CRUD covers most of this. |
| Dark luxury redesign | Medium | Design execution, not technical challenge. Theme tokens exist. Requires disciplined application of DESIGN.md across all surfaces. |

## Sources

- [Reflection vs Rosebud vs Mindsera comparison](https://www.reflection.app/blog/ai-journaling-apps-compared) -- AI journal feature landscape, feature parity analysis
- [Rosebud AI Journal](https://www.rosebud.app/) -- conversational prompts, weekly summaries, mood pattern detection
- [Fillout: One-question-at-a-time vs single-page forms](https://www.fillout.com/blog/one-question-at-a-time-form) -- completion rate research, form UX best practices
- [Typeform blog: conversational UI](https://www.typeform.com/blog/interactive-form-boost-conversions) -- conversion optimization, design philosophy
- [Field Trip: Psychedelic guide](https://apps.apple.com/us/app/field-trip-psychedelic-guide/id1520623904) -- psychedelic app feature set (4-stage journey, mood tracking, journaling)
- [Vivid: Psychedelic Trip Guide](https://play.google.com/store/apps/details?id=com.vividmind.vivid) -- intention setting, analytics, searchable journals
- [Healthline Field Trip review](https://www.healthline.com/health/substance-use/field-trip-app-review) -- real user experience with psychedelic app
- [MAPS: Psychedelic Revolution App-ified](https://maps.org/news/bulletin/the-psychedelic-revolution-will-be-app-ified/) -- domain landscape, Mydelica by Dr. Carhart-Harris
- [Vercel AI SDK docs](https://ai-sdk.dev/docs/introduction) -- streaming, useChat, React integration
- [AI Hero: Streaming next question suggestions](https://www.aihero.dev/streaming-in-next-question-suggestions-with-the-ai-sdk) -- adaptive question implementation pattern
- [AI sentiment analysis of survey responses (Illinois State)](https://about.illinoisstate.edu/uasprojects/2024/09/10/ai-sentiment-analysis-of-survey-text-responses-not-too-shabby/) -- mapping free-text to quantified scores
- [Smashing Magazine: Typeform story](https://www.smashingmagazine.com/2014/09/sci-fi-frustrations-flash-and-forms-the-typeform-story/) -- original keyboard-first UX philosophy
- [How to build AI wellness app with journaling (IdeaUsher)](https://ideausher.com/blog/build-an-ai-wellness-app-with-journaling-features/) -- feature landscape for AI wellness apps
- [Fast Company: Rosebud AI journaling](https://www.fastcompany.com/91167593/rosebud-ai-journaling-app-writing-partner) -- conversational journaling UX patterns
