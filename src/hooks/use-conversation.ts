import { useState, useEffect, useCallback, useRef } from 'react'
import { usePhase1, useUpsertPhase1 } from './use-phase1'
import { supabase } from '../lib/supabase'
import { parseScoresFromResponse, stripScoresFromResponse, aggregateSwemwbsScores } from '../lib/score-parser'
import type { ConversationMessage } from '../types/journey'

const MAX_QUESTIONS = 10

const INTENTION_PROMPT =
  'Based on our entire conversation, distill one single sentence -- a personal intention this person can carry into their experience. Respond with ONLY that sentence, nothing else. Also include your final SWEMWBS scoring.'

export function useConversation(journeyId: string) {
  const { data: phase1, isLoading: phase1Loading } = usePhase1(journeyId)
  const upsertPhase1 = useUpsertPhase1()

  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [intentionSentence, setIntentionSentence] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialized = useRef(false)
  const firstQuestionSent = useRef(false)

  // Initialization: restore conversation from phase1 data
  useEffect(() => {
    if (initialized.current || phase1Loading) return
    if (!phase1) return

    initialized.current = true

    // If completed, set final state
    if (phase1.completedAt) {
      setMessages(phase1.conversation ?? [])
      setIsComplete(true)
      setIntentionSentence(phase1.intentions?.primary ?? null)
      return
    }

    const existing = phase1.conversation ?? []
    if (existing.length > 0) {
      setMessages(existing)
      // Count completed Q&A pairs (assistant messages with a user reply after)
      const assistantCount = existing.filter(m => m.role === 'assistant').length
      const userCount = existing.filter(m => m.role === 'user').length
      // If last message is from assistant (awaiting user reply), question = assistantCount
      // If last message is from user, question = userCount + 1 (awaiting next AI question)
      const lastMsg = existing[existing.length - 1]
      if (lastMsg.role === 'assistant') {
        setCurrentQuestion(assistantCount)
      } else {
        setCurrentQuestion(userCount + 1)
      }
    }
  }, [phase1, phase1Loading])

  // First question trigger: when initialized, empty conversation, not complete
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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: chatMessages,
        phase: 'phase1',
      }),
    })

    const json = await response.json()

    if (!response.ok || json.error) {
      throw new Error(json.error ?? 'Failed to get AI response')
    }

    return json.message as string
  }

  function messagesForApi(msgs: ConversationMessage[]): Array<{ role: string; content: string }> {
    return msgs.map(({ role, content }) => ({ role, content }))
  }

  async function persistConversation(conversation: ConversationMessage[], extra?: Record<string, unknown>) {
    await upsertPhase1.mutateAsync({
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
      const rawMessage = await callChatApi([], token)
      const { swemwbs } = parseScoresFromResponse(rawMessage)
      const cleanContent = stripScoresFromResponse(rawMessage)

      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: cleanContent,
        questionNumber: 1,
        ...(Object.keys(swemwbs).length > 0 ? { scores: swemwbs } : {}),
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

      const userMsg: ConversationMessage = {
        role: 'user',
        content: text,
        questionNumber: currentQuestion,
      }

      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)

      // Check if this is the 10th answer -- trigger intention generation
      const userCount = updatedMessages.filter(m => m.role === 'user').length

      if (userCount >= MAX_QUESTIONS) {
        // Final API call for intention generation
        const apiMessages = [
          ...messagesForApi(updatedMessages),
          { role: 'user', content: INTENTION_PROMPT },
        ]

        const rawMessage = await callChatApi(apiMessages, token)
        const { swemwbs: finalScores } = parseScoresFromResponse(rawMessage)
        const intentionText = stripScoresFromResponse(rawMessage)

        const intentionMsg: ConversationMessage = {
          role: 'assistant',
          content: intentionText,
          questionNumber: currentQuestion + 1,
          ...(Object.keys(finalScores).length > 0 ? { scores: finalScores } : {}),
        }

        const finalMessages = [...updatedMessages, intentionMsg]
        const aggregatedSwemwbs = aggregateSwemwbsScores(finalMessages)

        setMessages(finalMessages)
        setIntentionSentence(intentionText)
        setIsComplete(true)
        setIsLoading(false)

        await persistConversation(finalMessages, {
          intentions: { primary: intentionText, explore: '', letGo: '', fears: '', success: '' },
          swemwbs: aggregatedSwemwbs,
          completedAt: new Date().toISOString(),
        })

        return
      }

      // Normal flow: get next question from AI
      const rawMessage = await callChatApi(messagesForApi(updatedMessages), token)
      const { swemwbs } = parseScoresFromResponse(rawMessage)
      const cleanContent = stripScoresFromResponse(rawMessage)

      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: cleanContent,
        questionNumber: currentQuestion + 1,
        ...(Object.keys(swemwbs).length > 0 ? { scores: swemwbs } : {}),
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
  }, [messages, currentQuestion, journeyId])

  return {
    messages,
    currentQuestion,
    isLoading,
    isComplete,
    intentionSentence,
    error,
    sendMessage,
  }
}
