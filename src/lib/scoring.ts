import type { Meq30, Swemwbs, Edi, Ebi, Phase2Response } from '@/types/journey'
import type { Phase2Question } from '@/data/phase2-questions'

// MEQ-30 subscale item mappings (standard validated instrument)
const MEQ30_SUBSCALES = {
  mystical: ['item4', 'item5', 'item6', 'item14', 'item15', 'item21', 'item29'],
  positiveMood: ['item2', 'item8', 'item12', 'item18', 'item22', 'item26'],
  transcendence: ['item1', 'item7', 'item11', 'item16', 'item20', 'item25'],
  ineffability: ['item3', 'item9', 'item10', 'item13', 'item17', 'item19', 'item23', 'item24', 'item27', 'item28', 'item30'],
} as const

const MEQ30_ITEM_COUNT = 30
const EDI_ITEM_COUNT = 8
const EBI_ITEM_COUNT = 6

const MEQ30_MEDIAN = 3
const SWEMWBS_MEDIAN = 3
const EDI_MEDIAN = 50
const EBI_MEDIAN = 50

export interface Meq30Subscales {
  mystical: number
  positiveMood: number
  transcendence: number
  ineffability: number
}

function meanOfItems(
  data: Record<string, number | undefined>,
  keys: readonly string[],
  defaultValue: number,
): number {
  const values = keys.map((key) => data[key] ?? defaultValue)
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function sumOfItems(
  data: Record<string, number | undefined>,
  keys: readonly string[],
  defaultValue: number,
): number {
  return keys.map((key) => data[key] ?? defaultValue).reduce((sum, v) => sum + v, 0)
}

export function computeMeq30Subscales(meq30: Meq30): Meq30Subscales {
  return {
    mystical: meanOfItems(meq30, MEQ30_SUBSCALES.mystical, MEQ30_MEDIAN),
    positiveMood: meanOfItems(meq30, MEQ30_SUBSCALES.positiveMood, MEQ30_MEDIAN),
    transcendence: meanOfItems(meq30, MEQ30_SUBSCALES.transcendence, MEQ30_MEDIAN),
    ineffability: meanOfItems(meq30, MEQ30_SUBSCALES.ineffability, MEQ30_MEDIAN),
  }
}

const SWEMWBS_KEYS = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'] as const

export function computeSwemwbsTotal(swemwbs: Swemwbs): number {
  return sumOfItems(swemwbs, SWEMWBS_KEYS, SWEMWBS_MEDIAN)
}

const EDI_KEYS = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8'] as const

export function computeEdiMean(edi: Edi): number {
  return meanOfItems(edi, EDI_KEYS, EDI_MEDIAN)
}

const EBI_KEYS = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6'] as const

export function computeEbiSum(ebi: Ebi): number {
  return sumOfItems(ebi, EBI_KEYS, EBI_MEDIAN)
}

export function computePhase2Scores(
  answers: Record<string, Phase2Response>,
  questions: Phase2Question[],
): { meq30: Meq30; edi: Edi; ebi: Ebi } {
  const meq30 = Object.fromEntries(
    Array.from({ length: MEQ30_ITEM_COUNT }, (_, i) => [`item${i + 1}`, MEQ30_MEDIAN])
  ) as unknown as Meq30

  const edi = Object.fromEntries(
    Array.from({ length: EDI_ITEM_COUNT }, (_, i) => [`item${i + 1}`, EDI_MEDIAN])
  ) as unknown as Edi

  const ebi = Object.fromEntries(
    Array.from({ length: EBI_ITEM_COUNT }, (_, i) => [`item${i + 1}`, EBI_MEDIAN])
  ) as unknown as Ebi

  for (const q of questions) {
    const answer = answers[q.id]
    if (!answer?.selectedOptionId) continue

    const option = q.options.find(o => o.id === answer.selectedOptionId)
    if (!option) continue

    if (option.scores.meq30) {
      for (const [key, val] of Object.entries(option.scores.meq30)) {
        ;(meq30 as Record<string, number>)[key] = val!
      }
    }
    if (option.scores.edi) {
      for (const [key, val] of Object.entries(option.scores.edi)) {
        ;(edi as Record<string, number>)[key] = val!
      }
    }
    if (option.scores.ebi) {
      for (const [key, val] of Object.entries(option.scores.ebi)) {
        ;(ebi as Record<string, number>)[key] = val!
      }
    }
  }

  return { meq30, edi, ebi }
}
