# Technology Stack — AI Conversational UI + Typeform-Style UX

**Project:** Inner Compass (Come Together)
**Researched:** 2026-04-10
**Scope:** New dependencies only. Existing stack (Bun, Vite 8, React 19, TanStack Router/Query/Form, Supabase, Tailwind v4, Zod) is unchanged.

## Recommended New Stack

### AI Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `ai` (Vercel AI SDK) | ^6.0.x | Core AI SDK — `generateText`, `streamText`, `generateObject`, server-side AI orchestration | Industry standard TypeScript AI toolkit. Framework-agnostic core works with any server runtime. Provides structured output generation (`generateObject`) which is critical for mapping free-text to instrument scores. v6.0.154 is current. | HIGH |
| `@ai-sdk/anthropic` | ^3.0.x | Anthropic provider for AI SDK — connects to Claude models | Official provider. Model ID `claude-haiku-4-5` for cost-effective 10-question conversations. Supports streaming, tool use, and structured output. v3.0.68 is current. | HIGH |
| `@ai-sdk/react` | ^3.0.x | React hooks — `useChat` for conversational UI state | Manages message history, loading states, error handling. `useChat` hook uses configurable transport — `DefaultChatTransport` points to any HTTP endpoint, not just Next.js API routes. Works with Vercel serverless `/api` directory. | HIGH |

**Architecture decision: Vercel Serverless Functions (not Supabase Edge Functions)**

The AI SDK runs server-side. Two options exist:

1. **Vercel `/api` directory** (RECOMMENDED) — Drop TypeScript files in `/api/` at project root. Vercel auto-deploys them as serverless functions alongside the SPA static assets. The `useChat` hook points to `/api/chat`. No framework change needed.

2. **Supabase Edge Functions** — Deno runtime. The AI SDK's npm packages require compatibility shims in Deno. 30-second timeout is tight for multi-turn AI conversations. Added complexity for no benefit since we deploy to Vercel.

**Why Vercel over Supabase Edge Functions:** Node.js runtime = zero friction with AI SDK npm packages. Same deployment target as the SPA. No timeout concerns. `ANTHROPIC_API_KEY` stays server-side as a Vercel environment variable.

### Animation & Transitions

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `motion` | ^12.38.x | Fade transitions, `AnimatePresence` for enter/exit animations, vertical carousel UX | The dominant React animation library (formerly Framer Motion, renamed in v12). `AnimatePresence` is exactly what Typeform-style question transitions need — animate components in AND out when they mount/unmount. Import from `motion/react`. v12.38.0 is current. | HIGH |

**Why `motion` over alternatives:**
- CSS transitions alone cannot handle exit animations (element must stay in DOM during fade-out before unmount)
- `react-spring` is viable but `motion` has simpler API for enter/exit patterns via `AnimatePresence`
- `@formkit/auto-animate` is too simplistic for a vertical carousel UX
- GSAP is overkill, imperative API does not compose well with React's declarative model, and has commercial licensing concerns
- View Transitions API lacks Firefox support as of early 2026 and cannot handle fine-grained component transitions

**What NOT to use:**
- `framer-motion` — Legacy package name. Same library, but actively maintained under `motion`. Import from `motion/react`.
- `react-transition-group` — Low-level, requires manual CSS management. Motion handles the entire animation lifecycle.
- Any Typeform clone library (snoopForms, etc.) — We need AI-driven adaptive questions, not a static form builder. Custom vertical carousel with `motion` + existing TanStack Form gives full control.

### Typography

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Plus Jakarta Sans (self-hosted) | Variable | Primary typeface — all UI text | Geometric sans-serif with subtle warmth. Variable font = single file for all weights. Excellent legibility on dark backgrounds. Closest freely available match to Pin Sans's character — broad, warm, substantial at 400+ weights. | MEDIUM |
| `@fontsource-variable/plus-jakarta-sans` | ^5.x | Self-hosted variable font loading | Eliminates Google Fonts CDN dependency. Better performance for SPA. Privacy-respecting (no external tracking). | HIGH |

**Why Plus Jakarta Sans over alternatives:**
- Inter is too ubiquitous and feels generic — lacks the warm character DESIGN.md calls for
- DM Sans is slightly too geometric/cold for "warm luxury"
- Playfair Display is serif — wrong category for an app UI
- Plus Jakarta Sans has the warm, substantial quality matching Pin Sans

**What NOT to use:**
- Google Fonts CDN link tag — self-host for performance and privacy (no external request, no tracking)
- Multiple font families — DESIGN.md specifies single-family system

### Dark Luxury Design System (Tailwind v4 tokens)

No new packages needed. Token remapping exercise in existing `src/index.css`.

**Dark mode adaptation of DESIGN.md palette:**

| Token | Light (Pinterest original) | Dark (our adaptation) | Role |
|-------|---------------------------|----------------------|------|
| Background | `#ffffff` | `#0a0a0a` or `#111111` | Deep true black, not navy |
| Surface | `#f6f6f3` (fog) | `#1a1a18` | Warm dark surface (olive-tinted) |
| Card | `#ffffff` | `#242422` | Warm dark card (olive-tinted) |
| Text primary | `#211922` (plum black) | `#e8e5e0` | Warm off-white (sand-tinted) |
| Text secondary | `#62625b` (olive gray) | `#91918c` | Same warm silver |
| Accent | `#e60023` (Pinterest Red) | `#e60023` | Unchanged — bold on dark |
| Border | `#91918c` | `#3a3a36` | Warm dark border (olive-tinted) |
| Interactive | `#e5e5e0` (sand gray) | `#2a2a26` | Warm dark interactive surface |

Border radius scale from DESIGN.md (add as Tailwind tokens): 12px, 16px, 20px, 28px, 32px, 40px.
Spacing base: 8px with scale matching DESIGN.md.
Shadows: minimal to none — depth from warm surface color gradation, per Pinterest philosophy.

### Development & Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `vercel` CLI | latest | Local dev for `/api` serverless functions | `vercel dev` runs both Vite dev server and serverless functions locally. Required for testing AI API routes in development. | HIGH |
| `vercel.json` | N/A | SPA routing + function config | Rewrites for SPA deep linking + API route passthrough. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| AI SDK | Vercel AI SDK (`ai`) | Direct `@anthropic-ai/sdk` | AI SDK provides `useChat` hook, streaming protocol, `generateObject` for structured output. Direct SDK requires building all chat state management manually. |
| AI Backend | Vercel `/api` functions | Supabase Edge Functions | Deno runtime friction with npm packages. 30s timeout. No benefit over Vercel functions for this project. |
| AI Backend | Vercel `/api` functions | Hono/Express server | Extra framework to maintain. Vercel functions are simpler for 2-3 API routes. |
| Animation | `motion` v12 | CSS View Transitions API | View Transitions API lacks Firefox support. Cannot animate component unmounting. Motion handles the full lifecycle. |
| Animation | `motion` v12 | `react-spring` | Both work. Motion has simpler API for enter/exit patterns and larger ecosystem for this pattern. |
| Font | Plus Jakarta Sans | Inter | Inter is ubiquitous and lacks warmth. Plus Jakarta Sans matches DESIGN.md's Pin Sans character. |
| Form UX | Custom vertical carousel | Typeform embed / snoopForms | We need AI-driven adaptive questions, not a static form builder. Custom carousel with motion + TanStack Form gives full control over the conversational flow. |

## Installation

```bash
# AI Integration (3 packages)
bun add ai @ai-sdk/anthropic @ai-sdk/react

# Animation (1 package)
bun add motion

# Typography (1 package)
bun add @fontsource-variable/plus-jakarta-sans

# Development tooling
bun add -D vercel
```

Total new dependencies: 5 runtime + 1 dev.

## Environment Variables (new)

```bash
# Server-side only — NOT prefixed with VITE_
# Add to Vercel project settings and local .env
ANTHROPIC_API_KEY=sk-ant-...
```

The `ANTHROPIC_API_KEY` is used only in `/api` serverless functions. Never exposed to the client bundle because it lacks the `VITE_` prefix.

## Key Integration Patterns

### 1. useChat with Vercel Serverless Functions

```typescript
// api/chat.ts (Vercel serverless function)
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export default async function handler(req, res) {
  const result = streamText({
    model: anthropic('claude-haiku-4-5'),
    messages: req.body.messages,
    system: '...',  // Instrument-mapping system prompt
  });
  return result.toDataStreamResponse();
}
```

```typescript
// Client component
import { useChat } from '@ai-sdk/react';

const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
});
```

### 2. Non-Streaming Pattern (Project Requirement)

PROJECT.md specifies "Streaming AI responses appear all at once (loading state, then reveal)." Two approaches:

- **Option A:** Use `generateText` instead of `streamText` — returns complete response, no streaming. Simpler but longer perceived wait.
- **Option B (recommended):** Use `streamText` server-side but buffer the complete response before sending to client. Better UX — server processes fast via streaming internally, client gets the full response in one shot with a loading spinner.

### 3. Structured Output for Instrument Mapping

Use `generateObject` with Zod schemas to extract structured instrument scores from free-text AI conversations:

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const result = await generateObject({
  model: anthropic('claude-haiku-4-5'),
  schema: z.object({
    swemwbs_scores: z.array(z.number().min(1).max(5)).length(7),
    reasoning: z.string(),
  }),
  prompt: `Analyze this conversation and estimate SWEMWBS scores...`,
});
```

### 4. Typeform-Style Vertical Carousel with Motion

```typescript
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence mode="wait">
  <motion.div
    key={currentQuestionIndex}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  >
    <QuestionCard question={questions[currentQuestionIndex]} />
  </motion.div>
</AnimatePresence>
```

### 5. Vite Dev Server Proxy for API Routes

In development, proxy `/api/*` to the Vercel dev server or a local Node process:

```typescript
// vite.config.ts addition
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

Alternatively, use `vercel dev` which runs both Vite and serverless functions together.

## File Structure (new additions)

```
api/
├── chat.ts                    # AI conversation endpoint (Vercel serverless function)
└── generate-summary.ts        # Trip summary generation endpoint

vercel.json                    # SPA rewrites + function config

src/
├── components/
│   └── questionnaire/
│       ├── VerticalCarousel.tsx    # Typeform-style one-at-a-time container
│       ├── QuestionCard.tsx        # Individual question with fade transition
│       └── ProgressIndicator.tsx   # Minimal progress bar
├── hooks/
│   └── useAdaptiveChat.ts         # Wrapper around useChat for instrument mapping
└── lib/
    └── instrument-mapping.ts      # Map AI free-text responses to instrument scores
```

## Sources

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) — Official docs, verified 2026-04-10
- [AI SDK Transport System](https://ai-sdk.dev/docs/ai-sdk-ui/transport) — Custom endpoint configuration
- [AI SDK Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) — Model IDs and setup
- [@ai-sdk/anthropic npm](https://www.npmjs.com/package/@ai-sdk/anthropic) — v3.0.68, verified 2026-04-10
- [ai npm](https://www.npmjs.com/package/ai) — v6.0.154, verified 2026-04-10
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6) — v6 features
- [Motion for React](https://motion.dev/) — v12.38.0, verified 2026-04-10
- [Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide) — framer-motion to motion migration
- [Typeform Clone with Framer Motion (GitHub)](https://github.com/r3nanp/typeform-clone) — Reference implementation
- [Vercel Serverless Functions with Vite](https://community.vercel.com/t/serverless-functions-in-react-vite/18776) — Community guidance
- [Vite on Vercel Docs](https://vercel.com/docs/frameworks/frontend/vite) — SPA deployment config
