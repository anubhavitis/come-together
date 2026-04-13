import { useState, useEffect, useCallback, useRef } from 'react'
import { usePhase1 } from './use-phase1'
import { usePhase2 } from './use-phase2'
import { usePhase3Entry, useUpsertPhase3Entry } from './use-phase3'
import { supabase } from '../lib/supabase'
import { parseScoresFromResponse, stripScoresFromResponse, aggregateIntegrationScores } from '../lib/score-parser'
import { buildPhase3Context } from '../lib/phase3-context'
import type { Phase3ConversationMessage, EngagedIntegration, ExperiencedIntegration } from '../types/journey'

const MAX_QUESTIONS = 10

// Scores are stored with prefixed keys (engaged_item1, experienced_item2) to
// avoid overlap between the two integration scales. This helper strips the
// prefix so aggregateIntegrationScores can match plain item keys.
function adaptMessagesForScale(
  messages: Phase3ConversationMessage[],
  prefix: 'engaged' | 'experienced',
): Phase3ConversationMessage[] {
  return messages.map(msg => {
    if (!msg.scores) return msg
    const adapted: Record<string, number> = {}
    const pfx = `${prefix}_`
    for (const [key, value] of Object.entries(msg.scores)) {
      if (key.startsWith(pfx)) {
        adapted[key.slice(pfx.length)] = value
      }
    }
    return Object.keys(adapted).length > 0
      ? { ...msg, scores: adapted }
      : { ...msg, scores: undefined }
  })
}

function aggregateScores(messages: Phase3ConversationMessage[]): {
  engaged: EngagedIntegration
  experienced: ExperiencedIntegration
} {
  const engagedMsgs = adaptMessagesForScale(messages, 'engaged')
  const experiencedMsgs = adaptMessagesForScale(messages, 'experienced')
  return {
    engaged: aggregateIntegrationScores(engagedMsgs, 'engaged') as EngagedIntegration,
    experienced: aggregateIntegrationScores(experiencedMsgs, 'experienced') as ExperiencedIntegration,
  }
}

const TRIP_SUMMARY_PROMPT =
  'Based on our entire conversation and everything you know about this person\'s journey -- their preparation (Phase 1), their experience (Phase 2), and this reflection (Phase 3) -- write a holistic trip summary. Write 3-5 paragraphs in warm second-person: what they came in with, what they experienced, and what has shifted or is integrating. This is a gift to them -- personal, insightful, compassionate. Include your final Integration Scales scoring.'

export function usePhase3Conversation(journeyId: string, entryId: string) {
  const { data: phase1, isLoading: phase1Loading } = usePhase1(journeyId)
  const { data: phase2, isLoading: phase2Loading } = usePhase2(journeyId)
  const { data: phase3Entry, isLoading: entryLoading } = usePhase3Entry(entryId)
  const upsertPhase3Entry = useUpsertPhase3Entry()

  const [messages, setMessages] = useState<Phase3ConversationMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [tripSummary, setTripSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialized = useRef(false)
  const firstQuestionSent = useRef(false)

  const isReady = !phase1Loading && !phase2Loading && !entryLoading

  // Initialization: restore conversation from phase3Entry data
  useEffect(() => {
    if (initialized.current || !isReady) return
    if (!phase3Entry) return

    initialized.current = true

    // If completed, set final state
    if (phase3Entry.completedAt) {
      setMessages(phase3Entry.conversation ?? [])
      setIsComplete(true)
      setTripSummary(phase3Entry.tripSummary ?? null)
      return
    }

    const existing = phase3Entry.conversation ?? []
    if (existing.length > 0) {
      setMessages(existing)
      const assistantCount = existing.filter(m => m.role === 'assistant').length
      const userCount = existing.filter(m => m.role === 'user').length
      const lastMsg = existing[existing.length - 1]
      if (lastMsg.role === 'assistant') {
        setCurrentQuestion(assistantCount)
      } else {
        setCurrentQuestion(Math.min(userCount + 1, MAX_QUESTIONS))
      }
    }
  }, [phase3Entry, isReady])

  // First question trigger
  useEffect(() => {
    if (firstQuestionSent.current) return
    if (!initialized.current) return
    if (messages.length > 0 || isComplete) return

    firstQuestionSent.current = true
    triggerFirstQuestion()
  }, [messages.length, isComplete])

  async function getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return session.access_token
  }

  async function callChatApi(
    chatMessages: Array<{ role: string; content: string }>,
    token: string,
  ): Promise<string> {
    const phase3Context = buildPhase3Context(phase1 ?? null, phase2 ?? null)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: chatMessages,
        phase: 'phase3',
        phase3_context: phase3Context,
      }),
    })

    const json = await response.json()

    if (!response.ok || json.error) {
      throw new Error(json.error ?? 'Failed to get AI response')
    }

    return json.message as string
  }

  function messagesForApi(msgs: Phase3ConversationMessage[]): Array<{ role: string; content: string }> {
    return msgs.map(({ role, content }) => ({ role, content }))
  }

  async function persistConversation(
    conversation: Phase3ConversationMessage[],
    extra?: Record<string, unknown>,
  ) {
    await upsertPhase3Entry.mutateAsync({
      id: entryId,
      journeyId,
      conversation,
      ...extra,
    })
  }

  async function triggerFirstQuestion() {
    setIsLoading(true)
    setError(null)

    try {
      const token = await getAuthToken()
      const rawMessage = await callChatApi(
        [{ role: 'user', content: 'Hello, I am here to reflect on my experience. Please ask me your first question.' }],
        token,
      )
      const { integrationEngaged, integrationExperienced } = parseScoresFromResponse(rawMessage)
      const cleanContent = stripScoresFromResponse(rawMessage)

      const scores: Record<string, number> = {
        ...Object.fromEntries(
          Object.entries(integrationEngaged).map(([k, v]) => [`engaged_${k}`, v])
        ),
        ...Object.fromEntries(
          Object.entries(integrationExperienced).map(([k, v]) => [`experienced_${k}`, v])
        ),
      }

      const assistantMsg: Phase3ConversationMessage = {
        role: 'assistant',
        content: cleanContent,
        questionNumber: 1,
        ...(Object.keys(scores).length > 0 ? { scores } : {}),
      }

      const newMessages = [assistantMsg]
      setMessages(newMessages)
      setCurrentQuestion(1)
      setIsLoading(false)

      await persistConversation(newMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
      setIsLoading(false)
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    setError(null)
    setIsLoading(true)

    try {
      const token = await getAuthToken()

      const userMsg: Phase3ConversationMessage = {
        role: 'user',
        content: text,
        questionNumber: currentQuestion,
      }

      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)

      const userCount = updatedMessages.filter(m => m.role === 'user').length

      if (userCount >= MAX_QUESTIONS) {
        // Final API call for trip summary generation
        const apiMessages = [
          ...messagesForApi(updatedMessages),
          { role: 'user', content: TRIP_SUMMARY_PROMPT },
        ]

        const rawMessage = await callChatApi(apiMessages, token)
        const { integrationEngaged: finalEngaged, integrationExperienced: finalExperienced } = parseScoresFromResponse(rawMessage)
        const summaryText = stripScoresFromResponse(rawMessage)

        const finalScores: Record<string, number> = {
          ...Object.fromEntries(
            Object.entries(finalEngaged).map(([k, v]) => [`engaged_${k}`, v])
          ),
          ...Object.fromEntries(
            Object.entries(finalExperienced).map(([k, v]) => [`experienced_${k}`, v])
          ),
        }

        const summaryMsg: Phase3ConversationMessage = {
          role: 'assistant',
          content: summaryText,
          questionNumber: currentQuestion + 1,
          ...(Object.keys(finalScores).length > 0 ? { scores: finalScores } : {}),
        }

        const finalMessages = [...updatedMessages, summaryMsg]
        const { engaged: aggregatedEngaged, experienced: aggregatedExperienced } = aggregateScores(finalMessages)

        setMessages(finalMessages)
        setTripSummary(summaryText)
        setIsComplete(true)
        setIsLoading(false)

        await persistConversation(finalMessages, {
          tripSummary: summaryText,
          engagedIntegration: aggregatedEngaged,
          experiencedIntegration: aggregatedExperienced,
          completedAt: new Date().toISOString(),
        })

        return
      }

      // Normal flow: get next question from AI
      const rawMessage = await callChatApi(messagesForApi(updatedMessages), token)
      const { integrationEngaged, integrationExperienced } = parseScoresFromResponse(rawMessage)
      const cleanContent = stripScoresFromResponse(rawMessage)

      const scores: Record<string, number> = {
        ...Object.fromEntries(
          Object.entries(integrationEngaged).map(([k, v]) => [`engaged_${k}`, v])
        ),
        ...Object.fromEntries(
          Object.entries(integrationExperienced).map(([k, v]) => [`experienced_${k}`, v])
        ),
      }

      const assistantMsg: Phase3ConversationMessage = {
        role: 'assistant',
        content: cleanContent,
        questionNumber: currentQuestion + 1,
        ...(Object.keys(scores).length > 0 ? { scores } : {}),
      }

      const allMessages = [...updatedMessages, assistantMsg]
      setMessages(allMessages)
      setCurrentQuestion(currentQuestion + 1)
      setIsLoading(false)

      await persistConversation(allMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }, [messages, currentQuestion, journeyId, entryId, phase1, phase2])

  return {
    messages,
    currentQuestion,
    isLoading,
    isComplete,
    tripSummary,
    error,
    sendMessage,
    isReady,
  }
}
