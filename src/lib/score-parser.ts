import type { ConversationMessage, Swemwbs, Phase3ConversationMessage, EngagedIntegration, ExperiencedIntegration } from '../types/journey'

const SCORES_PATTERN = /<!--SCORES:(.*?)-->/
const SWEMWBS_ITEMS = new Set([
  'item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7',
])
const SWEMWBS_MIN = 1
const SWEMWBS_MAX = 5
const SWEMWBS_DEFAULT = 3

const INTEGRATION_ENGAGED_ITEMS = new Set([
  'item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8',
])
const INTEGRATION_EXPERIENCED_ITEMS = new Set([
  'item1', 'item2', 'item3', 'item4',
])
const INTEGRATION_MIN = 1
const INTEGRATION_MAX = 5
const INTEGRATION_DEFAULT = 3

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function extractValidatedRecord(
  raw: Record<string, unknown> | undefined,
  validKeys: Set<string>,
  min: number,
  max: number,
): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (validKeys.has(key) && typeof value === 'number') {
      result[key] = clamp(value, min, max)
    }
  }
  return result
}

export function parseScoresFromResponse(response: string): {
  swemwbs: Partial<Swemwbs>
  integrationEngaged: Record<string, number>
  integrationExperienced: Record<string, number>
} {
  const match = SCORES_PATTERN.exec(response)
  if (!match) {
    return { swemwbs: {}, integrationEngaged: {}, integrationExperienced: {} }
  }

  try {
    const parsed = JSON.parse(match[1]) as {
      swemwbs?: Record<string, unknown>
      integration_engaged?: Record<string, unknown>
      integration_experienced?: Record<string, unknown>
    }

    const swemwbs = extractValidatedRecord(parsed?.swemwbs, SWEMWBS_ITEMS, SWEMWBS_MIN, SWEMWBS_MAX) as Partial<Swemwbs>
    const integrationEngaged = extractValidatedRecord(parsed?.integration_engaged, INTEGRATION_ENGAGED_ITEMS, INTEGRATION_MIN, INTEGRATION_MAX)
    const integrationExperienced = extractValidatedRecord(parsed?.integration_experienced, INTEGRATION_EXPERIENCED_ITEMS, INTEGRATION_MIN, INTEGRATION_MAX)

    return { swemwbs, integrationEngaged, integrationExperienced }
  } catch {
    return { swemwbs: {}, integrationEngaged: {}, integrationExperienced: {} }
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
      if (SWEMWBS_ITEMS.has(key) && typeof value === 'number') {
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

export function aggregateIntegrationScores(
  messages: Phase3ConversationMessage[],
  scale: 'engaged' | 'experienced',
): EngagedIntegration | ExperiencedIntegration {
  const validKeys = scale === 'engaged' ? INTEGRATION_ENGAGED_ITEMS : INTEGRATION_EXPERIENCED_ITEMS
  const latest: Record<string, number> = {}

  for (const message of messages) {
    if (!message.scores) continue
    for (const [key, value] of Object.entries(message.scores)) {
      if (validKeys.has(key) && typeof value === 'number') {
        latest[key] = value
      }
    }
  }

  const result: Record<string, number | undefined> = {}
  for (const key of validKeys) {
    result[key] = latest[key] ?? INTEGRATION_DEFAULT
  }

  return result as EngagedIntegration | ExperiencedIntegration
}
