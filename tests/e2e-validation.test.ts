import { describe, test, expect, beforeAll } from 'vitest'
import { callChatApi, skipIfNoApi, parseScoresFromResponse, stripScoresFromResponse, delay } from './helpers'

describe('Phase 1 - Come Together (VAL-01)', () => {
  beforeAll(async () => {
    await skipIfNoApi()
  })

  test('AI returns adaptive response with SWEMWBS score block', async () => {
    const result = await callChatApi({
      phase: 'phase1',
      messages: [
        {
          role: 'user',
          content:
            "I've been feeling a bit disconnected from people around me lately. Work has been overwhelming and I haven't had much time for the things that matter.",
        },
      ],
    })

    expect(result.status).toBe(200)
    expect(result.body.message).toBeTruthy()
    expect(result.body.message).toContain('<!--SCORES:')

    const scores = parseScoresFromResponse(result.body.message!)
    expect(scores.swemwbs).toBeDefined()
    expect(Object.keys(scores.swemwbs).length).toBeGreaterThanOrEqual(1)
  }, 30_000)

  test('AI adapts follow-up question based on prior context', async () => {
    const result = await callChatApi({
      phase: 'phase1',
      messages: [
        {
          role: 'user',
          content:
            "I've been feeling really anxious about a career change I'm considering. Part of me wants to take the leap but I'm scared of failing.",
        },
        {
          role: 'assistant',
          content:
            'That tension between wanting growth and fearing failure sounds really meaningful. What would "failing" actually look like to you?\n<!--SCORES:{"swemwbs":{"item1":2,"item4":2}}-->',
        },
        {
          role: 'user',
          content:
            "I guess failing would mean proving to myself that I'm not good enough. That I made the wrong choice and everyone was right to doubt me.",
        },
      ],
    })

    expect(result.status).toBe(200)
    expect(result.body.message).toContain('<!--SCORES:')

    const strippedText = stripScoresFromResponse(result.body.message!)
    expect(strippedText.length).toBeGreaterThan(0)
    expect(strippedText).not.toContain(
      'What would "failing" actually look like to you?',
    )
  }, 30_000)
})

describe('Phase 3 - Over Me (VAL-02)', () => {
  beforeAll(async () => {
    await skipIfNoApi()
  })

  test('AI returns response with integration score block when given phase3 context', async () => {
    const phase3Context = `PRE-TRIP CONVERSATION SUMMARY:
The user expressed anxiety about a career change and fear of failure. They felt disconnected from people around them. SWEMWBS baseline scores: item1=2, item4=2, item6=2.

IN-TRIP EXPERIENCE:
MEQ-30 scores indicated moderate mystical experience (mean 3.2). High ego dissolution (EDI mean 72). Emotional breakthrough score: 380/600.`

    const result = await callChatApi({
      phase: 'phase3',
      messages: [
        {
          role: 'user',
          content:
            'Looking back, I feel like something shifted during the experience. The fear I had about my career feels much smaller now.',
        },
      ],
      phase3_context: phase3Context,
    })

    expect(result.status).toBe(200)
    expect(result.body.message).toContain('<!--SCORES:')

    const scores = parseScoresFromResponse(result.body.message!)
    const hasEngaged = Object.keys(scores.integrationEngaged).length > 0
    const hasExperienced = Object.keys(scores.integrationExperienced).length > 0
    expect(hasEngaged || hasExperienced).toBe(true)
  }, 30_000)
})

describe('Score extraction reliability (VAL-03)', () => {
  beforeAll(async () => {
    await skipIfNoApi()
  })

  test('score extraction succeeds on 3 consecutive calls', async () => {
    const userMessages = [
      "I've been sleeping poorly and feeling foggy most days.",
      'My relationship with my partner has been really strong lately, we\'ve been communicating better than ever.',
      "I feel like I'm at a crossroads -- unsure about what direction to take with my life.",
    ]

    let successCount = 0

    for (const content of userMessages) {
      const result = await callChatApi({
        phase: 'phase1',
        messages: [{ role: 'user', content }],
      })

      expect(result.status).toBe(200)
      expect(result.body.message).toContain('<!--SCORES:')

      const scores = parseScoresFromResponse(result.body.message!)
      expect(scores.swemwbs).toBeDefined()
      expect(scores.swemwbs).not.toBeNull()

      // Verify the raw JSON parse works without throwing
      const match = result.body.message!.match(/<!--SCORES:(.*?)-->/)
      expect(match).toBeTruthy()
      expect(() => JSON.parse(match![1])).not.toThrow()

      successCount++

      // Rate limiting delay between calls
      if (successCount < userMessages.length) {
        await delay(1500)
      }
    }

    expect(successCount).toBe(3)
  }, 120_000)
})
