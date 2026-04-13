import { describe, expect, test } from 'bun:test'
import { parseScoresFromResponse, stripScoresFromResponse, aggregateSwemwbsScores, aggregateIntegrationScores } from './score-parser'
import type { ConversationMessage } from '../types/journey'
import type { Phase3ConversationMessage } from '../types/journey'

describe('parseScoresFromResponse', () => {
  test('extracts SWEMWBS scores from HTML comment', () => {
    const response = 'Hello!\n<!--SCORES:{"swemwbs":{"item1":3,"item4":2}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.swemwbs).toEqual({ item1: 3, item4: 2 })
    expect(result.integrationEngaged).toEqual({})
    expect(result.integrationExperienced).toEqual({})
  })

  test('returns empty objects when no scores block present', () => {
    const result = parseScoresFromResponse('No scores here')
    expect(result).toEqual({ swemwbs: {}, integrationEngaged: {}, integrationExperienced: {} })
  })

  test('clamps swemwbs values above 5 to 5', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{"item1":6}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.swemwbs).toEqual({ item1: 5 })
  })

  test('clamps swemwbs values below 1 to 1', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{"item1":0}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.swemwbs).toEqual({ item1: 1 })
  })

  test('returns empty objects on malformed JSON', () => {
    const response = 'Text\n<!--SCORES:not-json-->'
    const result = parseScoresFromResponse(response)
    expect(result).toEqual({ swemwbs: {}, integrationEngaged: {}, integrationExperienced: {} })
  })

  test('filters out invalid swemwbs item keys', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{"item1":3,"item99":2}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.swemwbs).toEqual({ item1: 3 })
  })

  test('handles empty swemwbs object', () => {
    const response = 'Text\n<!--SCORES:{"swemwbs":{}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.swemwbs).toEqual({})
  })

  test('extracts integration_engaged scores', () => {
    const response = 'Great reflection!\n<!--SCORES:{"integration_engaged":{"item1":4,"item3":5}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.integrationEngaged).toEqual({ item1: 4, item3: 5 })
    expect(result.integrationExperienced).toEqual({})
    expect(result.swemwbs).toEqual({})
  })

  test('extracts integration_experienced scores', () => {
    const response = 'Insightful!\n<!--SCORES:{"integration_experienced":{"item1":3,"item4":5}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.integrationExperienced).toEqual({ item1: 3, item4: 5 })
    expect(result.integrationEngaged).toEqual({})
    expect(result.swemwbs).toEqual({})
  })

  test('extracts mixed swemwbs and integration scores', () => {
    const response = 'Response\n<!--SCORES:{"swemwbs":{"item1":3},"integration_engaged":{"item2":4},"integration_experienced":{"item1":5}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.swemwbs).toEqual({ item1: 3 })
    expect(result.integrationEngaged).toEqual({ item2: 4 })
    expect(result.integrationExperienced).toEqual({ item1: 5 })
  })

  test('clamps integration values to 1-5', () => {
    const response = 'Text\n<!--SCORES:{"integration_engaged":{"item1":0,"item2":7}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.integrationEngaged).toEqual({ item1: 1, item2: 5 })
  })

  test('filters invalid integration_engaged keys (only item1-item8)', () => {
    const response = 'Text\n<!--SCORES:{"integration_engaged":{"item1":3,"item9":4,"item99":2}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.integrationEngaged).toEqual({ item1: 3 })
  })

  test('filters invalid integration_experienced keys (only item1-item4)', () => {
    const response = 'Text\n<!--SCORES:{"integration_experienced":{"item1":3,"item5":4}}-->'
    const result = parseScoresFromResponse(response)
    expect(result.integrationExperienced).toEqual({ item1: 3 })
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

describe('aggregateIntegrationScores', () => {
  test('defaults unscored items to 3', () => {
    const messages: Phase3ConversationMessage[] = [
      { role: 'assistant', content: 'Hi', questionNumber: 1, scores: { item1: 4 } },
    ]
    const result = aggregateIntegrationScores(messages, 'engaged')
    expect(result.item1).toBe(4)
    expect(result.item2).toBe(3)
    expect(result.item3).toBe(3)
    expect(result.item4).toBe(3)
    expect(result.item5).toBe(3)
    expect(result.item6).toBe(3)
    expect(result.item7).toBe(3)
    expect(result.item8).toBe(3)
  })

  test('uses latest score when same item scored multiple times', () => {
    const messages: Phase3ConversationMessage[] = [
      { role: 'assistant', content: 'Q1', questionNumber: 1, scores: { item1: 2 } },
      { role: 'user', content: 'Answer', questionNumber: 1 },
      { role: 'assistant', content: 'Q2', questionNumber: 2, scores: { item1: 5, item3: 4 } },
    ]
    const result = aggregateIntegrationScores(messages, 'engaged')
    expect(result.item1).toBe(5)
    expect(result.item3).toBe(4)
  })

  test('returns all defaults for empty messages', () => {
    const engaged = aggregateIntegrationScores([], 'engaged')
    expect(engaged).toEqual({
      item1: 3, item2: 3, item3: 3, item4: 3,
      item5: 3, item6: 3, item7: 3, item8: 3,
    })

    const experienced = aggregateIntegrationScores([], 'experienced')
    expect(experienced).toEqual({
      item1: 3, item2: 3, item3: 3, item4: 3,
    })
  })

  test('aggregates experienced integration with 4 items', () => {
    const messages: Phase3ConversationMessage[] = [
      { role: 'assistant', content: 'Q1', questionNumber: 1, scores: { item1: 5, item2: 4 } },
    ]
    const result = aggregateIntegrationScores(messages, 'experienced')
    expect(result.item1).toBe(5)
    expect(result.item2).toBe(4)
    expect(result.item3).toBe(3)
    expect(result.item4).toBe(3)
  })

  test('skips messages without scores', () => {
    const messages: Phase3ConversationMessage[] = [
      { role: 'assistant', content: 'Q1', questionNumber: 1, scores: { item1: 4 } },
      { role: 'user', content: 'Answer', questionNumber: 1 },
      { role: 'assistant', content: 'Q2', questionNumber: 2 },
    ]
    const result = aggregateIntegrationScores(messages, 'engaged')
    expect(result.item1).toBe(4)
    expect(result.item2).toBe(3)
  })
})
