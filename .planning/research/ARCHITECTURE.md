# Architecture Patterns

**Domain:** AI-driven psychedelic journey journal (conversational assessment layer on existing React SPA)
**Researched:** 2026-04-10

## Recommended Architecture

The existing SPA is a client-only Vite/React app talking directly to Supabase via anon key + RLS. Adding AI requires a server-side component because the Anthropic API key must never reach the client. The architecture adds a thin API layer via Vercel Serverless Functions (`/api` directory) alongside the existing static SPA deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Deployment                       │
│                                                             │
│  ┌──────────────────────┐    ┌───────────────────────────┐  │
│  │   Static SPA (Vite)  │    │  Serverless Functions     │  │
│  │   dist/index.html    │    │  /api/chat    (streaming)  │  │
│  │   React + TanStack   │    │  /api/score   (instrument) │  │
│  │   Supabase direct    │    │  /api/summary (generation) │  │
│  └──────────┬───────────┘    └──────────┬────────────────┘  │
│             │                           │                    │
│             │  useChat / fetch          │  AI SDK Core       │
│             └───────────────────────────┘  + @ai-sdk/anthropic│
└─────────────────────────────────────────────────────────────┘
                      │                          │
              ┌───────▼────────┐         ┌───────▼────────┐
              │   Supabase     │         │   Anthropic    │
              │   (Postgres    │         │   Claude Haiku │
              │    + Auth      │         │   API          │
              │    + RLS)      │         └────────────────┘
              └────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Typeform UI** (`src/components/typeform/`) | One-question-at-a-time vertical carousel, fade transitions, input collection | Conversation State Hook, Route components |
| **Conversation State Hook** (`src/hooks/use-conversation.ts`) | Manages AI message history, question index, loading states; wraps `useChat` or manual streaming | Typeform UI, API layer |
| **API Layer** (`/api/chat.ts`, `/api/score.ts`, `/api/summary.ts`) | Server-side AI calls via AI SDK Core, prompt construction, response streaming | Anthropic API, Supabase (for context reads) |
| **Instrument Scorer** (`src/lib/ai-scoring.ts`) | Maps AI-extracted structured data to validated instrument scores (SWEMWBS, MEQ-30, EDI, EBI) | Existing scoring logic, API layer |
| **Conversation Store** (Supabase tables) | Persists full conversation transcripts + AI-derived scores | Supabase via existing hooks pattern |
| **Existing Phase Hooks** (`src/hooks/use-phase*.ts`) | Extended to save AI-derived instrument data alongside conversation data | Supabase, Route components |

## Deployment Pattern: Vercel Serverless + Vite SPA

### Why This Pattern

The existing app is a static SPA on Vercel. Adding AI requires server-side code for one reason: protecting the Anthropic API key. Vercel natively supports serverless functions in the `/api` directory alongside static assets -- no framework migration needed.

### Directory Structure

```
/
├── api/                          # Vercel Serverless Functions (NEW)
│   ├── chat.ts                   # Streaming conversation endpoint
│   ├── score.ts                  # Instrument scoring extraction
│   ├── summary.ts                # Trip summary generation
│   └── _lib/                     # Shared server utilities
│       ├── prompts.ts            # System prompts per phase
│       ├── auth.ts               # Verify Supabase JWT from request
│       └── anthropic.ts          # AI SDK client singleton
├── src/                          # Existing React SPA
│   ├── components/
│   │   └── typeform/             # NEW: Typeform-style UI
│   │       ├── TypeformCarousel.tsx
│   │       ├── TypeformQuestion.tsx
│   │       ├── TypeformProgress.tsx
│   │       └── typeform-transitions.css
│   ├── hooks/
│   │   └── use-conversation.ts   # NEW: AI conversation state
│   └── lib/
│       └── ai-scoring.ts         # NEW: Map AI responses → instrument scores
├── vercel.json                   # NEW: SPA rewrites + function config
└── vite.config.ts                # ADD: dev proxy for /api
```

### vercel.json Configuration

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  }
}
```

### Vite Dev Proxy (for local development)

```typescript
// vite.config.ts addition
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

During development, run a small local server (Hono or plain Node) that mimics the Vercel function signatures. Alternatively, use `vercel dev` which handles this automatically.

**Confidence: HIGH** -- This is a well-documented Vercel pattern. Multiple production apps use `/api` directory with Vite SPAs.

## Data Flow

### Phase 1 ("Come Together") -- AI Conversational Assessment

```
User opens Phase 1
    │
    ▼
TypeformCarousel renders first AI question (hardcoded opener)
    │
    ▼
User types free-text response
    │
    ▼
use-conversation dispatches POST /api/chat
  Body: { messages: [...history], journeyId, phase: 'phase1' }
  Headers: { Authorization: Bearer <supabase-jwt> }
    │
    ▼
/api/chat serverless function:
  1. Verify JWT via Supabase admin client
  2. Build system prompt with SWEMWBS mapping instructions
  3. Call streamText() with @ai-sdk/anthropic (Claude Haiku)
  4. Stream response back as SSE
    │
    ▼
use-conversation receives streamed response
  → Appends to messages array
  → Advances TypeformCarousel to show AI response + next input
    │
    ▼
After 10 questions: POST /api/score
  Body: { messages: [...fullConversation], phase: 'phase1' }
    │
    ▼
/api/score serverless function:
  1. Send full transcript to Claude with scoring extraction prompt
  2. Claude returns structured JSON: { swemwbs: { item1: 3, ... }, themes: [...] }
  3. Validate with Zod schema
  4. Return scored data
    │
    ▼
Client receives scores
  → use-phase1 upserts to Supabase (same pattern as existing auto-save)
  → Conversation transcript saved to new conversation_logs table
```

### Phase 2 ("Right Now") -- Multiple Choice with AI Mapping

```
User opens Phase 2
    │
    ▼
TypeformCarousel renders 10 pre-defined questions
  (multiple choice with optional free-text, one at a time)
    │
    ▼
User selects answer + optional text, advances
  → Local state accumulates answers
    │
    ▼
After all 10: POST /api/score
  Body: { responses: [...answers], phase: 'phase2' }
    │
    ▼
/api/score maps structured responses to MEQ-30/EDI/EBI subscales
  → Multiple choice maps deterministically (no AI needed for MC)
  → Free-text supplements scored via AI extraction
    │
    ▼
Client saves to phase2 table via existing hook
```

### Phase 3 ("Over Me") -- AI-Tailored Assessment

```
User opens Phase 3
    │
    ▼
POST /api/chat with phase1 + phase2 data as context
  → AI generates personalized follow-up questions
    │
    ▼
Same TypeformCarousel flow as Phase 1
    │
    ▼
After conversation: POST /api/summary
  Body: { journeyId, phase1Scores, phase2Scores, phase3Conversation }
    │
    ▼
/api/summary generates narrative trip summary
  → Returned to client, saved to phase3_entries
```

## Typeform-Style Carousel UI

### Implementation: Custom Component (Not a Library)

Use a custom vertical carousel because:
- The interaction is specific (fade between questions, not swipe)
- Needs tight integration with AI streaming state (loading between questions)
- Existing carousel libraries add unnecessary complexity for what is fundamentally a stepped form
- Only ~150 lines of component code

### Component Structure

```tsx
// TypeformCarousel.tsx
interface TypeformCarouselProps {
  questions: ConversationMessage[]
  currentIndex: number
  isLoading: boolean
  onSubmit: (response: string) => void
  onSelect?: (value: string) => void  // for multiple choice
}

// Renders only the current question with CSS fade transition
// Uses transform: translateY + opacity for compositor-friendly animation
// Keyboard: Enter to submit, Tab for accessibility
```

### Transition Pattern

```css
.typeform-question {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms var(--ease-out-expo),
              transform 400ms var(--ease-out-expo);
}

.typeform-question[data-active="true"] {
  opacity: 1;
  transform: translateY(0);
}

.typeform-question[data-exiting="true"] {
  opacity: 0;
  transform: translateY(-20px);
}
```

### State Machine

```
IDLE → USER_TYPING → SUBMITTING → AI_RESPONDING → IDLE (next question)
                                                 → COMPLETE (after 10)
```

The carousel index advances only after the AI response is fully received (no streaming display per project requirement -- show loading state then reveal).

**Confidence: HIGH** -- Standard React pattern. No external dependencies needed.

## AI Conversation State Management

### Recommendation: Custom Hook over useChat

Do NOT use AI SDK's `useChat` hook. Reasons:

1. `useChat` expects a specific API route contract optimized for Next.js
2. It manages generic chat state; this app needs domain-specific state (question index, phase, instrument context)
3. The project requires "all at once" response display (not streaming to UI), which `useChat` doesn't support out of the box
4. Manual control over the message array is needed for scoring extraction

### use-conversation Hook Design

```typescript
interface ConversationState {
  messages: ConversationMessage[]
  currentIndex: number
  status: 'idle' | 'typing' | 'submitting' | 'loading' | 'complete'
  scores: InstrumentScores | null
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    questionType: 'free-text' | 'multiple-choice'
    instrumentMapping?: string  // which instrument this maps to
  }
}

function useConversation(journeyId: string, phase: Phase): {
  state: ConversationState
  submitResponse: (text: string) => Promise<void>
  selectOption: (value: string) => Promise<void>
  scores: InstrumentScores | null
  reset: () => void
}
```

### Relationship to TanStack Query

- TanStack Query continues to own all Supabase reads/writes (server state)
- `useConversation` owns the ephemeral conversation state (client state)
- On conversation completion, scores are written to Supabase via existing mutation hooks
- Conversation transcript is saved as a separate mutation

This follows the existing app pattern: TanStack Query for server state, React useState for local form state.

**Confidence: HIGH** -- Aligns with existing architecture. No new state management library needed.

## AI-to-Instrument Scoring

### The Core Challenge

The AI asks conversational questions but the system must produce validated instrument scores. Two approaches:

### Approach A: Post-Conversation Extraction (Recommended)

After the full 10-question conversation, send the entire transcript to Claude with a scoring prompt:

```
Given this conversation about the user's mental state, extract scores
for the SWEMWBS instrument. Each item is scored 1-5 where:
- Item 1 "I've been feeling optimistic about the future": [1-5]
- Item 2 "I've been feeling useful": [1-5]
...

Return ONLY a JSON object matching this schema: { item1: number, ... }
If you cannot determine a score for an item, return null.
```

**Why this approach:**
- Single extraction call (not per-question)
- Full conversation context improves accuracy
- Structured output via AI SDK's `generateObject()` with Zod schema
- Null handling for items the conversation didn't cover
- Deterministic scoring for multiple-choice Phase 2 (no AI needed)

### Approach B: Per-Question Mapping (Not Recommended)

Map each conversational question to a specific instrument item. Rejected because:
- Forces unnatural conversation flow
- Misses cross-cutting themes
- Harder to validate

### Validation Pipeline

```
AI Response (JSON)
    │
    ▼
Zod schema validation (reuse existing schemas from src/lib/schemas.ts)
    │
    ├── Valid → Write to phase table via existing hooks
    │
    └── Invalid → Retry with corrective prompt (max 2 retries)
         │
         └── Still invalid → Save conversation, flag for manual review
              Score fields left as null (all sections optional by design)
```

### AI SDK generateObject() for Structured Scoring

```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const { object: scores } = await generateObject({
  model: anthropic('claude-3-5-haiku-latest'),
  schema: swemwbsExtractionSchema,  // Zod schema
  prompt: buildScoringPrompt(transcript),
})
```

This uses the AI SDK's built-in structured output, which constrains the model to produce valid JSON matching the Zod schema. No regex parsing needed.

**Confidence: MEDIUM** -- The approach is architecturally sound. The accuracy of free-text-to-instrument scoring is the main research risk. Published studies show Spearman correlations of 0.45+ and 88%+ agreement with clinical instruments (see PMC12848484). Prompt engineering quality will determine real-world accuracy.

## Database Schema Extensions

### New Table: conversation_logs

```sql
CREATE TABLE conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('phase1', 'phase2', 'phase3')),
  messages jsonb NOT NULL DEFAULT '[]',
  ai_scores jsonb DEFAULT '{}',
  ai_summary text,
  model_id text NOT NULL DEFAULT 'claude-3-5-haiku-latest',
  token_usage jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Migration Strategy

- Add `conversation_logs` table with RLS (same ownership pattern as phase tables)
- Existing phase tables unchanged -- AI-derived scores write to the same JSONB columns
- `conversation_logs` stores the raw transcript + extracted scores for auditability
- `token_usage` tracks cost per conversation for the user

## Auth Flow for API Routes

The serverless functions must verify the Supabase JWT:

```typescript
// api/_lib/auth.ts
import { createClient } from '@supabase/supabase-js'

export async function verifyAuth(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) throw new Error('Missing auth token')

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid auth token')
  return user.id
}
```

The client sends its Supabase session JWT with every `/api` call. The serverless function validates it server-side. No additional auth system needed.

## Patterns to Follow

### Pattern 1: Server-Side AI, Client-Side State

**What:** All AI SDK Core calls (`streamText`, `generateObject`) happen in serverless functions. The client never imports `@ai-sdk/anthropic` or touches the API key.

**When:** Every AI interaction.

**Example:**
```typescript
// api/chat.ts (server)
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export default async function handler(req: Request) {
  const { messages, phase } = await req.json()
  const userId = await verifyAuth(req)

  const result = streamText({
    model: anthropic('claude-3-5-haiku-latest'),
    system: getSystemPrompt(phase),
    messages,
  })

  return result.toDataStreamResponse()
}
```

### Pattern 2: Conversation as Ephemeral, Scores as Persistent

**What:** Conversation messages live in React state during the session. On completion, the full transcript is persisted to `conversation_logs` and extracted scores are persisted to the existing phase tables.

**When:** Every phase completion.

**Why:** Avoids polluting TanStack Query cache with rapidly-changing conversation state. Keeps the existing query invalidation patterns intact.

### Pattern 3: Progressive Enhancement of Existing Phase Tables

**What:** AI-derived scores write to the same JSONB columns as the existing static form data. The phase tables don't know or care whether scores came from AI extraction or manual Likert scales.

**When:** Scoring extraction completes.

**Why:** The comparison view and any future analytics work identically regardless of input method. No schema migration needed for existing phase tables.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side AI Calls

**What:** Importing `@ai-sdk/anthropic` in the React app and calling Claude directly from the browser.

**Why bad:** Exposes the Anthropic API key to the client. No rate limiting. No server-side validation.

**Instead:** All AI calls go through `/api` serverless functions.

### Anti-Pattern 2: Streaming Text to UI

**What:** Showing token-by-token streaming in the Typeform carousel.

**Why bad:** Project requirement is "all at once" display. Streaming UI adds complexity (partial message rendering, scroll management) for a feature explicitly not wanted.

**Instead:** Show a loading/thinking state, then reveal the complete response with a fade transition.

### Anti-Pattern 3: Using useChat for Domain-Specific Conversations

**What:** Trying to shoehorn the AI SDK's generic `useChat` hook for a structured 10-question assessment flow.

**Why bad:** `useChat` manages an unbounded chat. This app needs a bounded conversation with progress tracking, phase-specific prompts, and scoring extraction at the end.

**Instead:** Custom `useConversation` hook with explicit state machine.

### Anti-Pattern 4: Per-Message Database Writes

**What:** Saving each conversation message to Supabase as it happens.

**Why bad:** 20+ writes per conversation (10 user + 10 AI messages). Unnecessary latency and complexity.

**Instead:** Accumulate in React state, write the full transcript once on completion.

## Suggested Build Order

Dependencies flow left to right:

```
1. API Skeleton          2. Conversation Hook      3. Typeform UI         4. Scoring + Integration
   ├─ vercel.json           ├─ useConversation        ├─ Carousel           ├─ Scoring prompts
   ├─ api/chat.ts           ├─ Message types          ├─ Question cards     ├─ generateObject()
   ├─ api/_lib/auth.ts      └─ Status machine         ├─ Fade transitions   ├─ Zod validation
   ├─ Vite dev proxy                                   └─ Loading states     ├─ Phase hook writes
   └─ Basic streaming                                                        └─ conversation_logs
```

**Phase 1 (API Skeleton)** must come first because everything else depends on being able to call the AI. Build and verify a working `/api/chat` endpoint that streams a response before touching any UI.

**Phase 2 (Conversation Hook)** and **Phase 3 (Typeform UI)** can be built in parallel by different developers, but the hook needs a working API to test against, and the UI needs the hook's state types.

**Phase 4 (Scoring + Integration)** comes last because it requires a complete conversation to extract scores from.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| AI API costs | ~$5/mo (Haiku is cheap) | ~$500/mo | Switch to batch, add caching |
| Serverless cold starts | Negligible | Negligible | Pre-warm with cron |
| Conversation storage | Trivial JSONB | Add indexes on journey_id | Archive old conversations |
| Rate limiting | Not needed | Add per-user limits in API | Redis-based rate limiter |
| Supabase connections | Default pool fine | Monitor pool exhaustion | Connection pooling via PgBouncer |

## Sources

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) -- HIGH confidence
- [Vercel AI SDK without Next.js Discussion](https://github.com/orgs/community/discussions/177224) -- MEDIUM confidence
- [useChat without API route (Vercel Community)](https://community.vercel.com/t/possible-to-use-ai-sdks-usechat-hook-without-an-api-route/6891) -- HIGH confidence (confirms useChat limitations)
- [Thin API Layer for React on Vercel](https://komelin.com/blog/thin-api-layer-react-vercel) -- HIGH confidence (exact pattern needed)
- [Vite on Vercel docs](https://vercel.com/docs/frameworks/vite) -- HIGH confidence
- [Vercel Serverless Functions docs](https://vercel.com/docs/functions) -- HIGH confidence
- [AI Interactive Assessment for Depression Screening (PMC12848484)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12848484/) -- MEDIUM confidence (validates text-to-instrument scoring approach)
- [Assessing personality using zero-shot generative AI scoring (PMC12974486)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12974486/) -- LOW confidence (different domain but same principle)
- [AI SDK useChat issue #5140](https://github.com/vercel/ai/issues/5140) -- HIGH confidence (confirms client-side limitations)

---

*Architecture research: 2026-04-10*
