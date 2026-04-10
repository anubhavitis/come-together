import { describe, expect, test } from 'bun:test'
import { parseScoresFromResponse, stripScoresFromResponse, aggregateSwemwbsScores } from './score-parser'
import type { ConversationMessage } from '@/types/journey'

describe('parseScoresFromResponse', () => {
  test('extracts SWEMWBS scores from HTML comment', () => {
    const response = 'Hello!\n<!--SCORES:{"swemwbs":{"item1":3,"item4":2}}-->'
    const result = parseScoresFromResponse(response)
    expect(result).toEqual({ swemwbs: { item1: 3, item4: 2 } })
  })

  test('returns empty swemwbs when no scores block present', () => {
    const result = parseScoresFromResponse('No scores here')
    expect(result).toEqual({ swemwbs: {} })
  })

  test('clamps values above 5 to 5', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{"item1":6}}-->'
    const result = parseScoresFromResponse(response)
    expect(result).toEqual({ swemwbs: { item1: 5 } })
  })

  test('clamps values below 1 to 1', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{"item1":0}}-->'
    const result = parseScoresFromResponse(response)
    expect(result).toEqual({ swemwbs: { item1: 1 } })
  })

  test('returns empty swemwbs on malformed JSON', () => {
    const response = 'Text\n<!--SCORES:not-json-->'
    const result = parseScoresFromResponse(response)
    expect(result).toEqual({ swemwbs: {} })
  })

  test('filters out invalid item keys', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{"item1":3,"item99":2}}-->'
    const result = parseScoresFromResponse(response)
    expect(result).toEqual({ swemwbs: { item1: 3 } })
  })

  test('handles empty swemwbs object', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{}}-->'
    const result = parseScoresFromResponse(response)
    expect(result).toEqual({ swemwbs: {} })
  })
})

describe('stripScoresFromResponse', () => {
  test('removes the scores block and trailing whitespace', () => {
    const response = 'Hello!\n<!--SCORES:{"swemwbs":{"item1":3}}-->'
    const result = stripScoresFromResponse(response)
    expect(result).toBe('Hello!')
  })

  test('returns original text when no scores block', () => {
    const result = stripScoresFromResponse('No scores here')
    expect(result).toBe('No scores here')
  })

  test('handles multiple newlines before scores block', () => {
    const response = 'Hello!\n\n<!--SCORES:{"swemwbs":{}}-->'
    const result = stripScoresFromResponse(response)
    expect(result).toBe('Hello!')
  })
})

describe('aggregateSwemwbsScores', () => {
  test('takes latest score per item across messages', () => {
    const messages: ConversationMessage[] = [
      { role: 'assistant', content: 'Hi', questionNumber: 1, scores: { item1: 2 } },
      { role: 'user', content: 'Hello', questionNumber: 1 },
      { role: 'assistant', content: 'Nice', questionNumber: 2, scores: { item1: 4, item2: 3 } },
    ]
    const result = aggregateSwemwbsScores(messages)
    expect(result.item1).toBe(4)
    expect(result.item2).toBe(3)
  })

  test('defaults unscored items to 3', () => {
    const messages: ConversationMessage[] = [
      { role: 'assistant', content: 'Hi', questionNumber: 1, scores: { item1: 2 } },
    ]
    const result = aggregateSwemwbsScores(messages)
    expect(result.item1).toBe(2)
    expect(result.item2).toBe(3)
    expect(result.item3).toBe(3)
    expect(result.item4).toBe(3)
    expect(result.item5).toBe(3)
    expect(result.item6).toBe(3)
    expect(result.item7).toBe(3)
  })

  test('returns all defaults for empty messages', () => {
    const result = aggregateSwemwbsScores([])
    expect(result).toEqual({
      item1: 3, item2: 3, item3: 3, item4: 3,
      item5: 3, item6: 3, item7: 3,
    })
  })

  test('skips messages without scores', () => {
    const messages: ConversationMessage[] = [
      { role: 'assistant', content: 'Hi', questionNumber: 1, scores: { item1: 4 } },
      { role: 'user', content: 'Hello', questionNumber: 1 },
      { role: 'assistant', content: 'Nice', questionNumber: 2 },
    ]
    const result = aggregateSwemwbsScores(messages)
    expect(result.item1).toBe(4)
  })
})
