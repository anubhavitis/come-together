import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
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

const PHASE3_SYSTEM_PROMPT = `You are a warm, thoughtful companion helping someone reflect on a meaningful personal experience. Respond with empathy and insight. Keep responses concise but genuine.`

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
  const { messages, phase = 'phase1' } = body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    phase?: 'phase1' | 'phase3'
  }

  const systemPrompt = phase === 'phase3' ? PHASE3_SYSTEM_PROMPT : PHASE1_SYSTEM_PROMPT

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // 3. Generate AI response
  const result = await generateText({
    model: anthropic('claude-3-5-haiku-20241022'),
    system: systemPrompt,
    messages,
  })

  return new Response(
    JSON.stringify({ message: result.text }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
