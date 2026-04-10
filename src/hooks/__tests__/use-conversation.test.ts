import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test'

// Mock modules before importing the hook
const mockUsePhase1 = mock(() => ({
  data: null as ReturnType<typeof import('@/types/journey')['Phase1']> | null,
  isLoading: false,
  error: null,
}))

const mockMutateAsync = mock(() => Promise.resolve({}))
const mockUseUpsertPhase1 = mock(() => ({
  mutateAsync: mockMutateAsync,
}))

mock.module('@/hooks/use-phase1', () => ({
  usePhase1: mockUsePhase1,
  useUpsertPhase1: mockUseUpsertPhase1,
}))

const mockGetSession = mock(() =>
  Promise.resolve({
    data: { session: { access_token: 'test-token' } },
  })
)

mock.module('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}))

mock.module('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, loading: false, signOut: mock() }),
}))

// Mock React hooks for non-component testing
let stateStore: Record<string, unknown> = {}
let effectCallbacks: Array<() => void | (() => void)> = []
let callbackStore: Record<string, Function> = {}
let refStore: Record<string, { current: unknown }> = {}
let stateCounter = 0
let effectCounter = 0
let callbackCounter = 0
let refCounter = 0

mock.module('react', () => ({
  useState: (initial: unknown) => {
    const key = `state_${stateCounter++}`
    if (!(key in stateStore)) {
      stateStore[key] = typeof initial === 'function' ? (initial as Function)() : initial
    }
    return [stateStore[key], (val: unknown) => {
      stateStore[key] = typeof val === 'function' ? (val as Function)(stateStore[key]) : val
    }]
  },
  useEffect: (cb: () => void | (() => void), _deps?: unknown[]) => {
    effectCallbacks.push(cb)
  },
  useCallback: (cb: Function, _deps?: unknown[]) => {
    const key = `cb_${callbackCounter++}`
    callbackStore[key] = cb
    return cb
  },
  useRef: (initial: unknown) => {
    const key = `ref_${refCounter++}`
    if (!(key in refStore)) {
      refStore[key] = { current: initial }
    }
    return refStore[key]
  },
  useMemo: (fn: () => unknown, _deps?: unknown[]) => fn(),
}))

mock.module('@tanstack/react-query', () => ({
  useQuery: () => ({}),
  useMutation: () => ({}),
  useQueryClient: () => ({}),
}))

// Now import the hook
import { useConversation } from '../use-conversation'
import type { Phase1, ConversationMessage } from '@/types/journey'

function resetMocks() {
  stateStore = {}
  effectCallbacks = []
  callbackStore = {}
  refStore = {}
  stateCounter = 0
  effectCounter = 0
  callbackCounter = 0
  refCounter = 0
  mockMutateAsync.mockClear()
  mockUsePhase1.mockClear()
  mockGetSession.mockClear()
}

function runEffects() {
  for (const cb of effectCallbacks) {
    cb()
  }
  effectCallbacks = []
}

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

describe('useConversation', () => {
  beforeEach(() => {
    resetMocks()
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'AI response <!--SCORES:{"swemwbs":{"item1":4}}--> ' }),
      })
    ) as unknown as typeof fetch
  })

  test('initializes with empty state when no phase1 data', () => {
    mockUsePhase1.mockReturnValue({ data: null, isLoading: false, error: null } as ReturnType<typeof mockUsePhase1>)
    const result = useConversation('j-id')

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

    mockUsePhase1.mockReturnValue({
      data: { ...DEFAULT_PHASE1, conversation: existingMessages },
      isLoading: false,
      error: null,
    } as ReturnType<typeof mockUsePhase1>)

    const result = useConversation('j-id')

    // After initialization effect runs, messages should be restored
    runEffects()
    // Re-call to pick up state changes
    stateCounter = 0
    effectCounter = 0
    callbackCounter = 0
    refCounter = 0
    const result2 = useConversation('j-id')

    expect(result2.messages).toEqual(existingMessages)
    // 2 assistant messages that have user replies + 1 awaiting = question 3
    expect(result2.currentQuestion).toBe(3)
  })

  test('sets isComplete when phase1.completedAt is set', () => {
    mockUsePhase1.mockReturnValue({
      data: {
        ...DEFAULT_PHASE1,
        completedAt: '2026-01-01T00:00:00Z',
        intentions: { ...DEFAULT_PHASE1.intentions, primary: 'My intention' },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof mockUsePhase1>)

    const result = useConversation('j-id')
    runEffects()

    stateCounter = 0
    effectCounter = 0
    callbackCounter = 0
    refCounter = 0
    const result2 = useConversation('j-id')

    expect(result2.isComplete).toBe(true)
    expect(result2.intentionSentence).toBe('My intention')
  })

  test('sendMessage calls /api/chat with correct payload', async () => {
    mockUsePhase1.mockReturnValue({
      data: DEFAULT_PHASE1,
      isLoading: false,
      error: null,
    } as ReturnType<typeof mockUsePhase1>)

    const result = useConversation('j-id')
    runEffects()

    await result.sendMessage('I feel nervous about my upcoming journey')

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      }),
    }))

    // Verify body includes phase
    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0]
    const body = JSON.parse((callArgs as unknown[])[1].body)
    expect(body.phase).toBe('phase1')
    expect(Array.isArray(body.messages)).toBe(true)
  })

  test('sendMessage sets isLoading during API call', async () => {
    let resolvePromise: (value: unknown) => void
    globalThis.fetch = mock(() =>
      new Promise((resolve) => {
        resolvePromise = resolve
      })
    ) as unknown as typeof fetch

    mockUsePhase1.mockReturnValue({
      data: DEFAULT_PHASE1,
      isLoading: false,
      error: null,
    } as ReturnType<typeof mockUsePhase1>)

    const result = useConversation('j-id')
    runEffects()

    const promise = result.sendMessage('hello')

    // isLoading should be true now (we check the state store)
    // The 'isLoading' state is the third useState (index 2)
    expect(stateStore['state_2']).toBe(true)

    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ message: 'response' }),
    })
    await promise

    // After resolve, isLoading should be false
    expect(stateStore['state_2']).toBe(false)
  })

  test('sendMessage persists conversation via useUpsertPhase1', async () => {
    mockUsePhase1.mockReturnValue({
      data: DEFAULT_PHASE1,
      isLoading: false,
      error: null,
    } as ReturnType<typeof mockUsePhase1>)

    const result = useConversation('j-id')
    runEffects()

    await result.sendMessage('My answer')

    expect(mockMutateAsync).toHaveBeenCalled()
    const mutateArgs = mockMutateAsync.mock.calls[0][0] as Record<string, unknown>
    expect(mutateArgs.journeyId).toBe('j-id')
    expect(Array.isArray(mutateArgs.conversation)).toBe(true)
  })

  test('sendMessage sets error state on fetch failure', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    ) as unknown as typeof fetch

    mockUsePhase1.mockReturnValue({
      data: DEFAULT_PHASE1,
      isLoading: false,
      error: null,
    } as ReturnType<typeof mockUsePhase1>)

    const result = useConversation('j-id')
    runEffects()

    await result.sendMessage('test')

    // error state is at index 4
    expect(stateStore['state_4']).toBe('Server error')
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

    mockUsePhase1.mockReturnValue({
      data: DEFAULT_PHASE1,
      isLoading: false,
      error: null,
    } as ReturnType<typeof mockUsePhase1>)

    const result = useConversation('j-id')
    runEffects()

    await result.sendMessage('I feel good')

    // Check persisted conversation includes scores on assistant message
    const mutateArgs = mockMutateAsync.mock.calls[0][0] as Record<string, unknown>
    const conversation = mutateArgs.conversation as ConversationMessage[]
    const assistantMsg = conversation.find(m => m.role === 'assistant')
    expect(assistantMsg?.scores).toEqual({ item1: 4, item3: 5 })
    expect(assistantMsg?.content).toBe('Great answer!')
    expect(assistantMsg?.content).not.toContain('SCORES')
  })
})
