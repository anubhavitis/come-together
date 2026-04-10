import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

// Env var validation (follows project pattern from src/lib/supabase.ts)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}
if (!anthropicKey) {
  throw new Error('Missing ANTHROPIC_API_KEY')
}

// Server-side Supabase client (service_role bypasses RLS -- used only for auth verification)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MODEL_ID = 'claude-3-5-haiku-20241022'

const SYSTEM_PROMPT = 'You are a warm, thoughtful guide helping someone prepare for a meaningful personal experience. Respond with empathy and insight. Keep responses concise but genuine.'

async function verifyUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function POST(request: Request) {
  // 1. Verify auth
  const user = await verifyUser(request)
  if (!user) {
    return Response.json(
      { error: 'Missing or invalid authorization token' },
      { status: 401 },
    )
  }

  // 2. Parse request body
  const body = await request.json() as { messages: Array<{ role: 'user' | 'assistant', content: string }> }
  const { messages } = body

  // 3. Generate AI response
  try {
    const { text } = await generateText({
      model: anthropic(MODEL_ID),
      system: SYSTEM_PROMPT,
      messages,
    })

    return Response.json({ message: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
