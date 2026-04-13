/**
 * Lightweight dev API server — replaces `vercel dev` for local development.
 * Runs on port 3001 so Vite's proxy can forward /api/* requests here.
 *
 * Usage: bun run api/dev-server.ts
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:3456/v1'
const AI_MODEL = process.env.AI_MODEL || 'claude-haiku-4'
const AI_API_KEY = process.env.AI_API_KEY || 'sk-OPENAI-TEST-KEY-EMP-466725'

const openai = createOpenAI({
  baseURL: AI_BASE_URL,
  apiKey: AI_API_KEY,
})

const PHASE1_SYSTEM_PROMPT = `You are a warm, thoughtful companion helping someone prepare for a meaningful personal experience. You are NOT a therapist or a clinical interviewer. Think of yourself as a close friend who asks caring questions.

CONVERSATION RULES:
- Ask ONE question at a time
- Each question should respond directly to what the person just shared
- Keep your response to 2-3 sentences: a brief, genuine reflection on what they said, then your question
- Topics to naturally explore across 10 questions: current emotional state, relationships, recent challenges, sources of joy, fears, hopes, sense of purpose, self-perception, what they want to let go of, what they want to carry forward
- Never use clinical language. No "How would you rate..." or "On a scale of..."
- Speak in a warm, natural tone as if sitting together over tea

SWEMWBS SCORING (INVISIBLE TO USER):
You are simultaneously assessing the Short Warwick-Edinburgh Mental Wellbeing Scale based on what the person reveals. The 7 items are:
1. item1: "Feeling optimistic about the future" (1=None of the time, 5=All of the time)
2. item2: "Feeling useful" (1-5)
3. item3: "Feeling relaxed" (1-5)
4. item4: "Dealing with problems well" (1-5)
5. item5: "Thinking clearly" (1-5)
6. item6: "Feeling close to other people" (1-5)
7. item7: "Able to make up my own mind about things" (1-5)

After your conversational response, append a hidden scoring block on a NEW LINE. Include ONLY items you can confidently score from what has been revealed so far. Format exactly:
<!--SCORES:{"swemwbs":{"item1":3,"item4":2}}-->

If you cannot score any items from this exchange, still include the block with an empty object:
<!--SCORES:{"swemwbs":{}}-->

IMPORTANT: The scoring block MUST be the very last line of your response. The user will NEVER see it.`

const PHASE3_SYSTEM_PROMPT = `You are a warm, thoughtful companion helping someone reflect on a meaningful personal experience they recently had. You are NOT a therapist. Think of yourself as a wise friend who helps them make sense of what happened.

CROSS-PHASE CONTEXT:
{phase3_context}

CONVERSATION RULES:
- Ask ONE question at a time
- Each question should respond directly to what the person just shared
- Keep your response to 2-3 sentences: a brief reflection, then your question
- Reference specific details from their pre-trip conversation and in-trip experience when relevant.
- Topics to naturally explore across 10 questions: what insights emerged, how they feel now vs before, what surprised them, what they want to integrate into daily life, relationships affected, fears that shifted, sense of purpose, concrete changes they want to make, what still feels unresolved, what gift the experience gave them
- Never use clinical language. Warm, natural tone.

INTEGRATION SCALES SCORING (INVISIBLE TO USER):
After your conversational response, append a hidden scoring block. Format:
<!--SCORES:{"integration_engaged":{"item1":4},"integration_experienced":{"item2":4}}-->

If no items scoreable:
<!--SCORES:{"integration_engaged":{},"integration_experienced":{}}-->

IMPORTANT: The scoring block MUST be the very last line. The user will NEVER see it.`

const server = Bun.serve({
  port: 3001,
  async fetch(request) {
    const url = new URL(request.url)

    // CORS headers for dev
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = await request.json() as {
          messages: Array<{ role: 'user' | 'assistant'; content: string }>
          phase?: 'phase1' | 'phase3'
          phase3_context?: string
        }

        const { messages, phase = 'phase1', phase3_context } = body

        let systemPrompt: string
        if (phase === 'phase3') {
          const contextText = phase3_context ?? 'No prior phase data available.'
          systemPrompt = PHASE3_SYSTEM_PROMPT.replace('{phase3_context}', contextText)
        } else {
          systemPrompt = PHASE1_SYSTEM_PROMPT
        }

        console.log(`[API] ${phase} request with ${messages.length} messages`)

        const result = await generateText({
          model: openai.chat(AI_MODEL),
          system: systemPrompt,
          messages,
        })

        console.log(`[API] Response: ${result.text.slice(0, 80)}...`)

        return new Response(
          JSON.stringify({ message: result.text }),
          { headers: corsHeaders },
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI generation failed'
        console.error(`[API] Error: ${message}`)
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: corsHeaders },
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: corsHeaders },
    )
  },
})

console.log(`[API] Dev server running at http://localhost:${server.port}`)
console.log(`[API] AI backend: ${AI_BASE_URL} (model: ${AI_MODEL})`)
