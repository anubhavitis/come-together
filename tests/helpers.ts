import { test } from 'vitest'

export { parseScoresFromResponse, stripScoresFromResponse } from '../src/lib/score-parser'

const DEFAULT_BASE_URL = 'http://localhost:5173'

interface CallChatApiOptions {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  phase?: 'phase1' | 'phase3'
  phase3_context?: string
  baseUrl?: string
}

interface CallChatApiResult {
  status: number
  body: { message?: string; error?: string }
}

export async function callChatApi(options: CallChatApiOptions): Promise<CallChatApiResult> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (process.env.TEST_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.TEST_AUTH_TOKEN}`
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: options.messages,
      phase: options.phase ?? 'phase1',
      ...(options.phase3_context ? { phase3_context: options.phase3_context } : {}),
    }),
  })

  const body = await response.json() as CallChatApiResult['body']
  return { status: response.status, body }
}

export async function skipIfNoApi(baseUrl?: string): Promise<void> {
  const url = baseUrl ?? DEFAULT_BASE_URL
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
  } catch {
    test.skip()
    throw new Error(`Dev server not running at ${url}`)
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
