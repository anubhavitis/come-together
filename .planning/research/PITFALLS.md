# Domain Pitfalls

**Domain:** AI-driven psychedelic journey journal with adaptive questioning and design system overhaul
**Researched:** 2026-04-10

---

## Critical Pitfalls

Mistakes that cause rewrites, data integrity failures, or fundamental architecture problems.

### Pitfall 1: Anthropic API Key Exposed in Client Bundle

**What goes wrong:** Vite environment variables prefixed with `VITE_` are embedded in the client JS bundle at build time. If the Anthropic API key is stored as `VITE_ANTHROPIC_API_KEY`, it ships to every browser. Anyone can extract it from the bundle and run up the bill or abuse the key.

**Why it happens:** The existing codebase uses `VITE_SUPABASE_ANON_KEY` (which is designed to be public). Developers follow the same pattern for the Anthropic key without realizing the security model is fundamentally different — Supabase anon keys are scoped by RLS, but Anthropic API keys grant unrestricted access.

**Consequences:** Financial exposure (unlimited API usage on the key owner's account), potential key revocation, and a security incident requiring key rotation.

**Prevention:**
- Never prefix the Anthropic key with `VITE_`. Store it as `ANTHROPIC_API_KEY` in Vercel environment variables (server-only).
- Create a Vercel serverless function in `/api/chat.ts` that reads the key from `process.env.ANTHROPIC_API_KEY` and proxies requests to Anthropic.
- The Vite SPA calls `/api/chat` — the key never touches the client.
- Add a `.env.example` entry documenting this: `# ANTHROPIC_API_KEY — server-only, do NOT prefix with VITE_`.

**Detection:** Search the built JS bundle for any string matching an Anthropic key pattern (`sk-ant-*`). Add a build-time check or CI step that fails if `VITE_ANTHROPIC` appears in any source file.

**Phase:** Must be addressed in the first phase that adds AI integration. This is a day-one architectural decision.

**Confidence:** HIGH — Vercel docs explicitly document this behavior for Vite SPAs.

---

### Pitfall 2: Vercel AI SDK useChat Requires Server Route — Vite SPA Has None

**What goes wrong:** The Vercel AI SDK's `useChat` and `useCompletion` hooks expect a server-side API route (e.g., `/api/chat`) that returns a streaming `DataStreamResponse`. A Vite SPA has no built-in server layer. Developers install `ai` and `@ai-sdk/anthropic`, write the hook call, and get a 404 or CORS error in development because there is no server to handle the request.

**Why it happens:** Every Vercel AI SDK tutorial and example uses Next.js `app/api/chat/route.ts`. The SDK documentation buries the non-Next.js setup. Developers assume the SDK "just works" with any React app.

**Consequences:** Blocked development. The team either wastes days debugging or makes a panic decision to migrate to Next.js (which PROJECT.md explicitly ruled out).

**Prevention:**
- Create an `/api` directory at the project root for Vercel serverless functions. These deploy automatically alongside the Vite SPA on Vercel.
- Write `/api/chat.ts` as a standard Vercel serverless function using `@ai-sdk/anthropic` server-side.
- Configure `vercel.json` with rewrites so the SPA's `/api/*` requests route to serverless functions.
- For local development, use `vercel dev` instead of `vite dev` to get both the SPA and serverless functions running. Alternatively, run a lightweight Express/Hono dev server that mimics the `/api` routes.
- Document the local dev setup clearly — `bun dev` will NOT serve the API routes.

**Detection:** If `useChat` returns connection errors or 404s in local dev, the server route is missing.

**Phase:** Must be the first task in the AI integration phase. All AI features depend on this plumbing.

**Confidence:** HIGH — confirmed via Vercel docs and community discussions. Vite SPAs require explicit `/api` directory for serverless functions.

---

### Pitfall 3: AI Scoring Hallucination — LLM Maps Free Text to Wrong Instrument Scores

**What goes wrong:** The core value proposition is that conversational AI questions map to validated psychometric instruments (SWEMWBS, MEQ-30, EDI, EBI) behind the scenes. The LLM is asked to extract structured scores from free-text responses. The LLM confidently produces plausible-looking but incorrect scores — mapping a user's description of "feeling connected to nature" to high ego dissolution when the EDI specifically measures loss of self-boundary, not nature connection.

**Why it happens:** LLMs are text pattern matchers, not psychometric assessors. The instruments have precise clinical definitions for each item and anchoring points. A conversational response about "feeling one with everything" could score high on multiple overlapping constructs (mystical experience, ego dissolution, emotional breakthrough) and the LLM lacks the psychometric training to disambiguate. Research on LLM psychometric evaluation shows structured output consistency varies significantly across repeated generations (STED framework, arxiv 2512.23712).

**Consequences:** Users receive scientifically invalid scores presented as research-grade instrument results. The comparison view shows meaningless deltas. If users make mental health decisions based on these scores, there is a duty-of-care risk. The entire "validated instruments behind the scenes" premise collapses.

**Prevention:**
- Do NOT ask the LLM to directly output instrument scores from free text. Instead, design the AI's 10 questions to systematically cover the item content of each target instrument. For Phase 1 (SWEMWBS, 7 items), craft questions that naturally elicit responses mappable to each of the 7 SWEMWBS domains.
- Use structured output (JSON mode) with Zod schema validation on the LLM response. Define the exact output shape: `{ swemwbs: { item1: number, item2: number, ... } }` with value constraints matching the instrument's scale.
- Include the actual instrument item text and scale anchors in the system prompt so the LLM scores against the real items, not its interpretation.
- Add a confidence field to each score. If the LLM's confidence is below threshold, flag that item as "unable to assess from conversation" rather than guessing.
- Run validation: compare AI-scored results against the same user completing the traditional Likert instruments. Track divergence.
- Display scores with a clear disclaimer: "Estimated from your conversation — complete the full questionnaire for validated scores."

**Detection:** If AI-generated SWEMWBS scores cluster suspiciously (all items get the same score, or scores are always extreme), the mapping prompt is broken. Log AI scoring distributions and compare against known population distributions for these instruments.

**Phase:** Requires deep prompt engineering work in the AI integration phase. Should be the most time-intensive task. Budget 2-3x the time you think it needs.

**Confidence:** MEDIUM — the approach is novel and research on LLM-to-psychometric mapping is still emerging. Expect iteration.

---

### Pitfall 4: Vercel AI SDK Bundle Bloat Breaks Performance Budget

**What goes wrong:** The Vercel AI SDK core package adds approximately 67-186 kB gzipped to the client bundle (measurements vary by version and tree-shaking effectiveness). The existing app targets a 150 kB JS budget for landing pages. Adding `ai` + `@ai-sdk/anthropic` to the client pushes the bundle well past budget, degrading LCP and TBT.

**Why it happens:** Developers `import { useChat } from 'ai/react'` and the bundler pulls in the full SDK including provider abstractions, streaming parsers, and protocol handlers that should only run server-side.

**Consequences:** Core Web Vitals regression. Slow initial load on mobile. The "dark luxury" experience feels sluggish instead of premium.

**Prevention:**
- Only import the thin client hooks (`ai/react`) on the client. The heavy provider packages (`@ai-sdk/anthropic`, `ai` core) must only be imported in `/api` serverless functions — they should never appear in client-side imports.
- Dynamic import the chat component: `const ChatUI = lazy(() => import('./components/ChatUI'))` so AI-related client code is code-split from the main bundle.
- Measure before and after: run `npx vite-bundle-visualizer` after adding AI SDK imports. If client bundle exceeds 150 kB gzipped, the import boundary is wrong.
- Consider whether `useChat` is even necessary. For the "all-at-once" (non-streaming) response pattern described in PROJECT.md, a simple `fetch('/api/chat')` with `useState` may be lighter than the full `useChat` hook.

**Detection:** Bundle size increase >50 kB after adding AI SDK. Check `dist/assets/*.js` sizes after build.

**Phase:** AI integration phase. Validate bundle impact in the first PR that adds AI SDK.

**Confidence:** HIGH — bundle size criticism is well-documented. The "all-at-once" requirement (no streaming UI) means the streaming infrastructure in `useChat` is unnecessary overhead.

---

## Moderate Pitfalls

### Pitfall 5: Typeform Carousel Traps Keyboard and Screen Reader Users

**What goes wrong:** The one-question-at-a-time vertical carousel with fade transitions creates an accessibility trap. Keyboard users cannot navigate back to previous questions. Screen readers cannot announce progress or question count. Focus is lost during fade transitions between questions.

**Why it happens:** Carousel patterns are inherently problematic for accessibility (W3C WAI documents this extensively). Developers build the visual transition first and add keyboard support as an afterthought. The fade animation uses CSS that removes elements from the DOM, destroying focus context.

**Consequences:** Users relying on keyboard navigation or assistive technology cannot complete the questionnaire. WCAG 2.1.1 (Keyboard) and 2.4.3 (Focus Order) violations.

**Prevention:**
- Use `aria-live="polite"` region to announce the current question number and total: "Question 3 of 10."
- Maintain focus management: after transition, programmatically focus the new question's input element.
- Support both Enter (advance) and Shift+Tab or Up Arrow (go back). Display visible "Previous" and "Next" controls.
- Do NOT remove previous questions from the DOM — hide them with `aria-hidden="true"` and `visibility: hidden` instead. This preserves the ability to navigate back.
- Use `prefers-reduced-motion` media query to disable fade animations. Show instant transitions for users who have requested reduced motion.
- Test with VoiceOver (macOS) and keyboard-only navigation before considering the carousel complete.

**Detection:** Tab through the entire questionnaire without using a mouse. If you get stuck or lose your place, the implementation is broken.

**Phase:** UI redesign phase, specifically when building the Typeform-style carousel component.

**Confidence:** HIGH — W3C WAI carousel tutorial documents these exact issues.

---

### Pitfall 6: Dark Mode Warm Palette Fails WCAG Contrast on Key Elements

**What goes wrong:** The design direction calls for "warm olive/sand-toned neutrals on dark surfaces" with Pinterest Red (#e60023) as the accent. Warm mid-tone colors on dark backgrounds frequently fail WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text). Olive text on dark charcoal looks sophisticated in a mockup but is unreadable for users with low vision or in bright ambient light.

**Why it happens:** Dark mode design systems are harder than light mode because the usable color range narrows significantly. Saturated warm colors (reds, oranges, olives) on dark backgrounds create optical vibration and halation effects (where bright text bleeds into the dark background for users with astigmatism). Designers optimize for aesthetic screenshots, not for contrast compliance across all the text sizes in the app.

**Consequences:** Body text, form labels, and secondary UI text become unreadable for a significant portion of users. Pinterest Red (#e60023) on dark backgrounds may pass for large headings but will fail for small button text or form labels.

**Prevention:**
- Test every text color combination with a contrast checker before implementing. Use `oklch` color space (already in the design tokens) to systematically adjust lightness while preserving hue.
- Pinterest Red (#e60023) should only be used for large accent elements (headings, icons, CTAs). Never use it for body text or form labels on dark backgrounds.
- Warm neutrals for body text need lightness >= 70% in oklch to meet 4.5:1 on dark surfaces. Test with `oklch(75% 0.02 80)` range (warm off-white) rather than mid-tone olive.
- Avoid pure black (#000) backgrounds — use dark charcoal (oklch(15% 0.01 80)) to reduce halation and excessive contrast with white text.
- Build a contrast matrix: every foreground token against every background token, with pass/fail for AA and AAA.

**Detection:** Run automated contrast checks (axe-core, Lighthouse accessibility audit) on every page. Manual check: view the app on a phone in direct sunlight.

**Phase:** UI redesign phase. Must be addressed when establishing the design token system, before building components.

**Confidence:** HIGH — WCAG requirements are objective and measurable.

---

### Pitfall 7: Local Dev Environment Fractures — vite dev vs vercel dev

**What goes wrong:** The existing workflow uses `bun dev` (which runs `vite`). Adding Vercel serverless functions in `/api` means the API routes only work under `vercel dev`. Developers now need two terminals, or switch to `vercel dev` entirely — but `vercel dev` has known compatibility issues with Vite's HMR, TanStack Router's file-based route generation, and Tailwind v4's Vite plugin.

**Why it happens:** Vercel's local development server (`vercel dev`) wraps the framework's dev server but doesn't always faithfully reproduce it. The Vite plugin ecosystem (TanStack Router Vite plugin, Tailwind Vite plugin) expects native Vite dev server behavior. `vercel dev` introduces a proxy layer that can break WebSocket HMR connections and file watching.

**Consequences:** Developers oscillate between `bun dev` (where UI works but API 404s) and `vercel dev` (where API works but HMR is flaky). Productivity drops. "Works on my machine" bugs emerge.

**Prevention:**
- Keep `bun dev` as the primary frontend dev command. It preserves full Vite ecosystem compatibility.
- For the API layer in development, run a separate lightweight server (Hono or Express) that mounts the same handler functions from `/api`. Use a `dev:api` script in package.json.
- Configure Vite's `server.proxy` to forward `/api/*` requests to the local API server:
  ```ts
  // vite.config.ts
  server: { proxy: { '/api': 'http://localhost:3001' } }
  ```
- This keeps frontend and backend decoupled in dev but unified on Vercel in production.
- Document the two-server dev setup in CLAUDE.md and the project README.

**Detection:** If `bun dev` returns 404 on `/api/chat`, the proxy is not configured. If `vercel dev` shows stale HMR or route generation errors, the dev environment is fractured.

**Phase:** Must be solved at the start of the AI integration phase, before any AI feature development begins.

**Confidence:** MEDIUM — based on community reports of `vercel dev` + Vite friction. The proxy approach is a standard workaround.

---

### Pitfall 8: Auto-Save Fires AI Requests on Every Keystroke

**What goes wrong:** The existing auto-save pattern (debounced 500ms, fires on every field change) is designed for saving JSONB form data to Supabase. If the same pattern is naively applied to AI conversation state, every keystroke in a free-text response triggers a debounced AI API call — burning tokens and creating a terrible UX where the AI "responds" to half-typed sentences.

**Why it happens:** The existing `useAutoSave` hook is the established pattern. Developers wire AI conversation responses into the same hook because "it works for Phase 1 forms."

**Consequences:** Excessive Anthropic API costs (Claude Haiku charges per token). Incoherent AI responses to partial inputs. Race conditions where an old AI response arrives after a newer one, clobbering the conversation state.

**Prevention:**
- AI requests should trigger on explicit user action (pressing Enter or clicking "Send"), never on debounced field changes.
- Auto-save should persist the conversation history (messages array) to Supabase, but should NOT trigger new AI completions.
- Separate the concerns: `useAutoSave` for persistence, a distinct `useChatMutation` for AI requests.
- Add request deduplication: if a request is in flight, queue the next one rather than firing concurrently.

**Detection:** Check network tab during typing in the AI conversation. If you see `/api/chat` requests while typing (before pressing Enter), the trigger is wrong.

**Phase:** AI integration phase, when wiring the chat UI to the backend.

**Confidence:** HIGH — the existing auto-save pattern in the codebase is explicitly designed for this (CONCERNS.md documents the debounce behavior).

---

### Pitfall 9: Conversation State Lost on Page Refresh Mid-Questionnaire

**What goes wrong:** The user is on question 6 of 10 in the "Come Together" AI conversation. They accidentally refresh the page or their phone locks. The conversation history, AI responses, and the current question position are all lost because the state lived only in React component state or the `useChat` hook's internal state.

**Why it happens:** `useChat` manages conversation state in memory. The auto-save pattern saves form data to Supabase, but conversation messages and carousel position are not part of the form schema. Nobody thinks about persistence of ephemeral UI state until a user loses 10 minutes of journaling.

**Consequences:** User frustration. Lost therapeutic context. Users learn not to trust the app and write shorter, less revealing answers — undermining the AI's ability to map responses to instrument scores.

**Prevention:**
- Persist the full conversation array (messages + AI responses) to Supabase after each question-answer pair completes (not on every keystroke — see Pitfall 8).
- Store the current question index in the conversation record.
- On page load, check for an in-progress conversation and resume from where the user left off.
- The JSONB column on the phase table is the natural home for this: `phase1.ai_conversation: { messages: [...], currentQuestion: 6 }`.
- Add a `beforeunload` warning if there is an unsaved conversation in progress (the existing `beforeunload` handler in `useAutoSave` provides a pattern, though CONCERNS.md notes it is fire-and-forget).

**Detection:** Refresh the page mid-conversation. If you are back at question 1, persistence is missing.

**Phase:** AI integration phase. Must be designed into the conversation data model from the start, not bolted on later.

**Confidence:** HIGH — this is a standard SPA state persistence problem, amplified by the multi-step questionnaire format.

---

## Minor Pitfalls

### Pitfall 10: Phase 2 Multiple-Choice Carousel Hardcodes MEQ-30 Item Count

**What goes wrong:** The Phase 2 "Right Now" carousel is designed for 10 multiple-choice questions, but MEQ-30 alone has 30 items, EDI has 8, and EBI has 6. Developers build a 10-question carousel and then discover the instruments require 44+ items. The carousel either becomes impossibly long or the AI must aggressively compress instruments — losing psychometric validity.

**Prevention:** Decide upfront whether Phase 2 uses the AI to compress instruments (fewer questions, lower validity) or presents a curated subset. If using AI compression, accept that MEQ-30 subscale scores will be estimates, not validated scores. Document this trade-off explicitly.

**Phase:** Architecture/planning phase, before implementing Phase 2 UI.

### Pitfall 11: Streaming "All at Once" Still Shows Partial Tokens in Edge Cases

**What goes wrong:** PROJECT.md specifies "streaming AI responses appear all at once (loading state, then reveal)." Developers use `useChat` with streaming enabled and buffer the response, but edge cases (slow network, large response, timeout) can show partial text before the buffer is complete.

**Prevention:** Use a non-streaming API call (standard `fetch` + `await response.json()`) rather than buffering a stream. This is simpler, lighter, and guarantees atomic response delivery. Since the UX requirement is explicitly non-streaming, do not use streaming infrastructure at all.

**Phase:** AI integration phase.

### Pitfall 12: Recharts Dynamic Import Causes Layout Shift on Compare View

**What goes wrong:** Dynamically importing Recharts (recommended for bundle size) means charts render after a loading delay. If the comparison view layout depends on chart dimensions, a visible layout shift occurs when charts mount — violating the CLS < 0.1 target.

**Prevention:** Reserve explicit dimensions for chart containers (`min-height` on the wrapper div) before Recharts loads. Use skeleton placeholders with the same dimensions as the final charts.

**Phase:** Compare view implementation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| AI integration setup | API key in client bundle (Pitfall 1) | Server-only env var + `/api` serverless function |
| AI integration setup | No server route for useChat (Pitfall 2) | `/api/chat.ts` serverless function + Vite proxy for dev |
| AI integration setup | Dev environment fracture (Pitfall 7) | Vite proxy to separate API dev server |
| AI prompt engineering | Hallucinated instrument scores (Pitfall 3) | Structured output, item-level prompts, validation pipeline |
| AI conversation UX | Auto-save triggers AI calls (Pitfall 8) | Explicit submit trigger, separate save vs. AI-request hooks |
| AI conversation UX | State lost on refresh (Pitfall 9) | Persist conversation to Supabase after each Q&A pair |
| Typeform carousel | Keyboard/screen reader trap (Pitfall 5) | ARIA live regions, focus management, visible nav controls |
| Design system | Warm colors fail contrast (Pitfall 6) | Contrast matrix, oklch lightness thresholds, automated checks |
| Phase 2 instruments | Item count mismatch (Pitfall 10) | Decide AI compression vs. full instruments upfront |
| Compare view | Chart layout shift (Pitfall 12) | Reserved dimensions, skeleton placeholders |

---

## Sources

- [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) — serverless function setup, SPA rewrites
- [Vercel AI SDK docs](https://ai-sdk.dev/docs/introduction) — SDK architecture, useChat requirements
- [Vercel AI SDK without NextJS discussion](https://github.com/orgs/community/discussions/177224) — community workarounds
- [Vercel AI SDK bundle size criticism](https://blog.hyperknot.com/p/til-vercel-ai-sdk-the-bloat-king) — 186 kB core measurement
- [Vercel AI SDK v5 bundle size increase](https://community.vercel.com/t/increased-bundle-size-after-upgrading-ai-sdk-to-v5/23025) — community reports
- [useChat without API route](https://community.vercel.com/t/possible-to-use-ai-sdks-usechat-hook-without-an-api-route/6891) — confirms server route requirement
- [W3C WAI Carousel Tutorial](https://www.w3.org/WAI/tutorials/carousels/) — accessibility requirements
- [Typeform accessibility blog](https://www.typeform.com/blog/accessibility-and-design-how-typeform-designed-an-accessible-journey/) — Typeform's own a11y approach
- [STED framework for LLM structured output consistency](https://arxiv.org/abs/2512.23712) — scoring reliability
- [LLM Psychometrics systematic review](https://llm-psychometrics.com/) — state of LLM psychometric evaluation
- [Dark mode accessibility best practices](https://atmos.style/blog/dark-mode-ui-best-practices) — contrast, halation, warm colors
- [Scalable accessible dark theme design](https://www.fourzerothree.in/p/scalable-accessible-dark-mode) — token architecture for dark mode

---

*Pitfalls audit: 2026-04-10*
