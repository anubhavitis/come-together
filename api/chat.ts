import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Use claude-max-api-proxy (OpenAI-compatible) which routes through Claude CLI
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:3456/v1'
const AI_MODEL = process.env.AI_MODEL || 'claude-haiku-4'

const openai = createOpenAI({
  baseURL: AI_BASE_URL,
  apiKey: process.env.AI_API_KEY || 'sk-not-needed',
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
- Reference specific details from their pre-trip conversation and in-trip experience when relevant. For example: "You mentioned feeling disconnected from your partner..." or "Your experience showed a high degree of ego dissolution..."
- Topics to naturally explore across 10 questions: what insights emerged, how they feel now vs before, what surprised them, what they want to integrate into daily life, relationships affected, fears that shifted, sense of purpose, concrete changes they want to make, what still feels unresolved, what gift the experience gave them
- Never use clinical language. Warm, natural tone.

INTEGRATION SCALES SCORING (INVISIBLE TO USER):
You are simultaneously assessing Integration Scales based on what the person reveals.

Engaged Integration (8 items, 1=Strongly disagree, 5=Strongly agree):
1. item1: "I have made concrete changes in my life based on insights from the experience"
2. item2: "I regularly reflect on the meaning of the experience"
3. item3: "I have shared insights from the experience with people close to me"
4. item4: "I have incorporated new practices (meditation, journaling, etc.) since the experience"
5. item5: "I have actively sought to understand the experience more deeply"
6. item6: "I feel the experience has positively influenced my relationships"
7. item7: "I have made changes to my daily routine based on insights gained"
8. item8: "I continue to discover new meaning from the experience"

Experienced Integration (4 items, 1=Strongly disagree, 5=Strongly agree):
1. item1: "The insights from the experience feel naturally woven into my life"
2. item2: "I feel a lasting sense of connection that emerged from the experience"
3. item3: "My perspective on life has fundamentally shifted since the experience"
4. item4: "I feel more at peace with aspects of my life that previously troubled me"

After your conversational response, append a hidden scoring block on a NEW LINE. Include ONLY items you can confidently score. Format exactly:
<!--SCORES:{"integration_engaged":{"item1":4,"item5":3},"integration_experienced":{"item2":4}}-->

If you cannot score any items from this exchange, still include the block:
<!--SCORES:{"integration_engaged":{},"integration_experienced":{}}-->

IMPORTANT: The scoring block MUST be the very last line. The user will NEVER see it.`

export async function POST(request: Request) {
  // 1. Verify auth
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid authorization token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // 2. Parse request
  const body = await request.json()
  const { messages, phase = 'phase1', phase3_context } = body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    phase?: 'phase1' | 'phase3'
    phase3_context?: string
  }

  let systemPrompt: string
  if (phase === 'phase3') {
    const contextText = phase3_context ?? 'No prior phase data available.'
    systemPrompt = PHASE3_SYSTEM_PROMPT.replace('{phase3_context}', contextText)
  } else {
    systemPrompt = PHASE1_SYSTEM_PROMPT
  }

  // 3. Generate AI response via claude-max-api-proxy
  try {
    const result = await generateText({
      model: openai.chat(AI_MODEL),
      system: systemPrompt,
      messages,
    })

    return new Response(
      JSON.stringify({ message: result.text }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
