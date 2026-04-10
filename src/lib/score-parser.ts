import type { ConversationMessage, Swemwbs } from '@/types/journey'

const SCORES_PATTERN = /<!--SCORES:(.*?)-->/
const VALID_ITEMS = new Set([
  'item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7',
])
const SWEMWBS_MIN = 1
const SWEMWBS_MAX = 5
const SWEMWBS_DEFAULT = 3

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function parseScoresFromResponse(response: string): { swemwbs: Partial<Swemwbs> } {
  const match = SCORES_PATTERN.exec(response)
  if (!match) {
    return { swemwbs: {} }
  }

  try {
    const parsed = JSON.parse(match[1]) as { swemwbs?: Record<string, unknown> }
    const raw = parsed?.swemwbs
    if (!raw || typeof raw !== 'object') {
      return { swemwbs: {} }
    }

    const swemwbs: Partial<Swemwbs> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (VALID_ITEMS.has(key) && typeof value === 'number') {
        (swemwbs as Record<string, number>)[key] = clamp(value, SWEMWBS_MIN, SWEMWBS_MAX)
      }
    }
    return { swemwbs }
  } catch {
    return { swemwbs: {} }
  }
}

export function stripScoresFromResponse(response: string): string {
  return response.replace(/\s*<!--SCORES:.*?-->/, '').trimEnd()
}

export function aggregateSwemwbsScores(messages: ConversationMessage[]): Swemwbs {
  const latest: Partial<Swemwbs> = {}

  for (const message of messages) {
    if (!message.scores) continue
    for (const [key, value] of Object.entries(message.scores)) {
      if (VALID_ITEMS.has(key) && typeof value === 'number') {
        (latest as Record<string, number>)[key] = value
      }
    }
  }

  return {
    item1: latest.item1 ?? SWEMWBS_DEFAULT,
    item2: latest.item2 ?? SWEMWBS_DEFAULT,
    item3: latest.item3 ?? SWEMWBS_DEFAULT,
    item4: latest.item4 ?? SWEMWBS_DEFAULT,
    item5: latest.item5 ?? SWEMWBS_DEFAULT,
    item6: latest.item6 ?? SWEMWBS_DEFAULT,
    item7: latest.item7 ?? SWEMWBS_DEFAULT,
  }
}
