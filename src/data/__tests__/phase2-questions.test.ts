import { describe, it, expect } from 'vitest'
import { phase2Questions } from '../phase2-questions'

describe('phase2Questions', () => {
  it('has exactly 10 questions', () => {
    expect(phase2Questions).toHaveLength(10)
  })

  it('every question has 4-5 options', () => {
    for (const q of phase2Questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(4)
      expect(q.options.length).toBeLessThanOrEqual(5)
    }
  })

  it('every option has a scores object with at least one instrument mapping', () => {
    for (const q of phase2Questions) {
      for (const opt of q.options) {
        const hasMapping =
          (opt.scores.meq30 && Object.keys(opt.scores.meq30).length > 0) ||
          (opt.scores.edi && Object.keys(opt.scores.edi).length > 0) ||
          (opt.scores.ebi && Object.keys(opt.scores.ebi).length > 0)
        expect(hasMapping).toBe(true)
      }
    }
  })

  it('all meq30 score values are 0-5', () => {
    for (const q of phase2Questions) {
      for (const opt of q.options) {
        if (opt.scores.meq30) {
          for (const val of Object.values(opt.scores.meq30)) {
            expect(val).toBeGreaterThanOrEqual(0)
            expect(val).toBeLessThanOrEqual(5)
          }
        }
      }
    }
  })

  it('all edi score values are 0-100', () => {
    for (const q of phase2Questions) {
      for (const opt of q.options) {
        if (opt.scores.edi) {
          for (const val of Object.values(opt.scores.edi)) {
            expect(val).toBeGreaterThanOrEqual(0)
            expect(val).toBeLessThanOrEqual(100)
          }
        }
      }
    }
  })

  it('all ebi score values are 0-100', () => {
    for (const q of phase2Questions) {
      for (const opt of q.options) {
        if (opt.scores.ebi) {
          for (const val of Object.values(opt.scores.ebi)) {
            expect(val).toBeGreaterThanOrEqual(0)
            expect(val).toBeLessThanOrEqual(100)
          }
        }
      }
    }
  })
})
