import type { Meq30, Edi, Ebi, Phase2Response } from '@/types/journey'
import type { Phase2Question } from '@/data/phase2-questions'

const MEQ30_MEDIAN = 3
const EDI_MEDIAN = 50
const EBI_MEDIAN = 50

const MEQ30_ITEM_COUNT = 30
const EDI_ITEM_COUNT = 8
const EBI_ITEM_COUNT = 6

/**
 * Compute complete MEQ-30, EDI, and EBI instrument scores from Phase 2
 * carousel responses.
 *
 * Unmapped items default to the median of each instrument's scale:
 * - MEQ-30: 3 (scale 0-5)
 * - EDI: 50 (scale 0-100)
 * - EBI: 50 (scale 0-100)
 *
 * Selected option scores override the defaults for their mapped items.
 */
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
