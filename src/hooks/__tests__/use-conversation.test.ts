import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test'
import type { Phase1, ConversationMessage } from '../../types/journey'

// Mock modules before importing the hook -- use paths relative to the hook file
const mockMutateAsync = mock(() => Promise.resolve({}))

mock.module('../use-phase1', () => ({
  usePhase1: mockUsePhase1,
  useUpsertPhase1: () => ({
    mutateAsync: mockMutateAsync,
  }),
}))

mock.module('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: { access_token: 'test-token' } },
        }),
    },
  },
}))

// State tracking for React mock
let stateSlots: unknown[] = []
let stateSetters: Array<(val: unknown) => void> = []
let effectCallbacks: Array<() => void | (() => void)> = []
let refSlots: Array<{ current: unknown }> = []
let stateIdx = 0
let effectIdx = 0
let refIdx = 0

function resetReactState() {
  stateSlots = []
  stateSetters = []
  effectCallbacks = []
  refSlots = []
  stateIdx = 0
  effectIdx = 0
  refIdx = 0
}

mock.module('react', () => ({
  useState: (initial: unknown) => {
    const i = stateIdx++
    if (stateSlots.length <= i) {
      const val = typeof initial === 'function' ? (initial as () => unknown)() : initial
      stateSlots.push(val)
      stateSetters.push((v: unknown) => {
        stateSlots[i] = typeof v === 'function' ? (v as (prev: unknown) => unknown)(stateSlots[i]) : v
      })
    }
    return [stateSlots[i], stateSetters[i]]
  },
  useEffect: (cb: () => void | (() => void), _deps?: unknown[]) => {
    effectCallbacks.push(cb)
  },
  useCallback: (cb: Function, _deps?: unknown[]) => cb,
  useRef: (initial: unknown) => {
    const i = refIdx++
    if (refSlots.length <= i) {
      refSlots.push({ current: initial })
    }
    return refSlots[i]
  },
  useMemo: (fn: () => unknown, _deps?: unknown[]) => fn(),
}))

// Phase1 data getter -- tests can change this
let phase1Data: Phase1 | null = null
let phase1Loading = false

function mockUsePhase1() {
  return { data: phase1Data, isLoading: phase1Loading, error: null }
}

// Must import AFTER mocks are set up
const { useConversation } = await import('../use-conversation')

const DEFAULT_PHASE1: Phase1 = {
  id: 'p1-id',
  journeyId: 'j-id',
  completedAt: null,
  swemwbs: { item1: undefined, item2: undefined, item3: undefined, item4: undefined, item5: undefined, item6: undefined, item7: undefined },
  innerLandscapeText: { relationshipWithSelf: '', prevalentEmotions: '', currentFear: '', currentGratitude: '' },
  innerLandscapeRatings: { connectedness: undefined, clarity: undefined, innerPeace: undefined },
  intentions: { primary: '', explore: '', letGo: '', fears: '', success: '' },
  context: { date: '', substance: 'psilocybin', dose: '', setting: '', sitter: '' },
  conversation: [],
  updatedAt: '',
}

function callHook(journeyId = 'j-id') {
  stateIdx = 0
  effectIdx = 0
  refIdx = 0
  return useConversation(journeyId)
}

function runEffects() {
  const cbs = [...effectCallbacks]
  effectCallbacks = []
  for (const cb of cbs) {
    cb()
  }
}

describe('useConversation', () => {
  beforeEach(() => {
    resetReactState()
    phase1Data = null
    phase1Loading = false
    mockMutateAsync.mockClear()

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'AI response <!--SCORES:{"swemwbs":{"item1":4}}--> ' }),
      })
    ) as unknown as typeof fetch
  })

  test('initializes with empty state when no phase1 data', () => {
    phase1Data = null
    const result = callHook()

    expect(result.messages).toEqual([])
    expect(result.currentQuestion).toBe(1)
    expect(result.isLoading).toBe(false)
    expect(result.isComplete).toBe(false)
    expect(result.intentionSentence).toBeNull()
    expect(result.error).toBeNull()
    expect(typeof result.sendMessage).toBe('function')
  })

  test('restores messages from existing conversation and calculates correct question number', () => {
    const existingMessages: ConversationMessage[] = [
      { role: 'assistant', content: 'How are you?', questionNumber: 1 },
      { role: 'user', content: 'Good', questionNumber: 1 },
      { role: 'assistant', content: 'Tell me more', questionNumber: 2 },
      { role: 'user', content: 'I feel great', questionNumber: 2 },
      { role: 'assistant', content: 'What brings you?', questionNumber: 3 },
    ]

    phase1Data = { ...DEFAULT_PHASE1, conversation: existingMessages }

    // First call sets up the state
    callHook()
    // Run initialization effect
    runEffects()
    // Re-call to read updated state
    const result = callHook()

    expect(result.messages).toEqual(existingMessages)
    // 3 assistant messages, last is assistant, so currentQuestion = 3
    expect(result.currentQuestion).toBe(3)
  })

  test('sets isComplete when phase1.completedAt is set', () => {
    phase1Data = {
      ...DEFAULT_PHASE1,
      completedAt: '2026-01-01T00:00:00Z',
      intentions: { ...DEFAULT_PHASE1.intentions, primary: 'My intention' },
      conversation: [
        { role: 'assistant', content: 'Q1', questionNumber: 1 },
        { role: 'user', content: 'A1', questionNumber: 1 },
      ],
    }

    callHook()
    runEffects()
    const result = callHook()

    expect(result.isComplete).toBe(true)
    expect(result.intentionSentence).toBe('My intention')
  })

  test('sendMessage calls /api/chat with correct payload', async () => {
    phase1Data = DEFAULT_PHASE1

    callHook()
    runEffects()
    const result = callHook()

    await result.sendMessage('I feel nervous about my upcoming journey')

    expect(globalThis.fetch).toHaveBeenCalled()
    const calls = (globalThis.fetch as ReturnType<typeof mock>).mock.calls
    const [url, options] = calls[0] as [string, RequestInit]
    expect(url).toBe('/api/chat')
    expect(options.method).toBe('POST')
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token')
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body as string)
    expect(body.phase).toBe('phase1')
    expect(Array.isArray(body.messages)).toBe(true)
  })

  test('sendMessage sets isLoading false after API call completes', async () => {
    phase1Data = DEFAULT_PHASE1

    callHook()
    runEffects()
    const result = callHook()

    await result.sendMessage('hello')

    // After sendMessage completes, isLoading (slot 2) should be false
    expect(stateSlots[2]).toBe(false)
  })

  test('sendMessage persists conversation via useUpsertPhase1', async () => {
    phase1Data = DEFAULT_PHASE1

    callHook()
    runEffects()
    const result = callHook()

    await result.sendMessage('My answer')

    expect(mockMutateAsync).toHaveBeenCalled()
    const args = mockMutateAsync.mock.calls[0][0] as Record<string, unknown>
    expect(args.journeyId).toBe('j-id')
    expect(Array.isArray(args.conversation)).toBe(true)
  })

  test('sendMessage sets error state on fetch failure', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    ) as unknown as typeof fetch

    phase1Data = DEFAULT_PHASE1

    callHook()
    runEffects()
    const result = callHook()

    await result.sendMessage('test')

    // error is state slot 5 (messages=0, currentQuestion=1, isLoading=2, isComplete=3, intentionSentence=4, error=5)
    expect(stateSlots[5]).toBe('Server error')
  })

  test('sendMessage extracts and strips scores from AI response', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'Great answer! <!--SCORES:{"swemwbs":{"item1":4,"item3":5}}-->',
        }),
      })
    ) as unknown as typeof fetch

    phase1Data = DEFAULT_PHASE1

    callHook()
    runEffects()
    const result = callHook()

    await result.sendMessage('I feel good')

    expect(mockMutateAsync).toHaveBeenCalled()
    const args = mockMutateAsync.mock.calls[0][0] as Record<string, unknown>
    const conversation = args.conversation as ConversationMessage[]
    const assistantMsg = conversation.find(m => m.role === 'assistant')
    expect(assistantMsg?.scores).toEqual({ item1: 4, item3: 5 })
    expect(assistantMsg?.content).toBe('Great answer!')
    expect(assistantMsg?.content).not.toContain('SCORES')
  })
})
