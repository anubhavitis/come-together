import { describe, it, expect } from 'vitest'
import { computePhase2Scores } from '../scoring'
import { phase2Questions } from '@/data/phase2-questions'
import type { Phase2Response } from '@/types/journey'

describe('computePhase2Scores', () => {
  it('returns complete Meq30 (30 items), Edi (8 items), Ebi (6 items)', () => {
    const answers: Record<string, Phase2Response> = {}
    const result = computePhase2Scores(answers, phase2Questions)

    expect(Object.keys(result.meq30)).toHaveLength(30)
    expect(Object.keys(result.edi)).toHaveLength(8)
    expect(Object.keys(result.ebi)).toHaveLength(6)
  })

  it('unmapped items default to median (3 for meq30, 50 for edi/ebi)', () => {
    const answers: Record<string, Phase2Response> = {}
    const result = computePhase2Scores(answers, phase2Questions)

    for (let i = 1; i <= 30; i++) {
      expect(result.meq30[`item${i}` as keyof typeof result.meq30]).toBe(3)
    }
    for (let i = 1; i <= 8; i++) {
      expect(result.edi[`item${i}` as keyof typeof result.edi]).toBe(50)
    }
    for (let i = 1; i <= 6; i++) {
      expect(result.ebi[`item${i}` as keyof typeof result.ebi]).toBe(50)
    }
  })

  it('selected option scores override defaults', () => {
    const q = phase2Questions[0]
    const lastOption = q.options[q.options.length - 1]

    const answers: Record<string, Phase2Response> = {
      [q.id]: {
        questionId: q.id,
        selectedOptionId: lastOption.id,
        freeText: '',
      },
    }

    const result = computePhase2Scores(answers, phase2Questions)

    if (lastOption.scores.meq30) {
      for (const [key, val] of Object.entries(lastOption.scores.meq30)) {
        expect(result.meq30[key as keyof typeof result.meq30]).toBe(val)
      }
    }
    if (lastOption.scores.edi) {
      for (const [key, val] of Object.entries(lastOption.scores.edi)) {
        expect(result.edi[key as keyof typeof result.edi]).toBe(val)
      }
    }
    if (lastOption.scores.ebi) {
      for (const [key, val] of Object.entries(lastOption.scores.ebi)) {
        expect(result.ebi[key as keyof typeof result.ebi]).toBe(val)
      }
    }
  })

  it('handles empty answers (all defaults)', () => {
    const result = computePhase2Scores({}, phase2Questions)

    expect(result.meq30.item1).toBe(3)
    expect(result.edi.item1).toBe(50)
    expect(result.ebi.item1).toBe(50)
  })
})
