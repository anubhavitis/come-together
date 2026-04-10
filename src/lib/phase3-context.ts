import type { Phase1, Phase2, Meq30 } from '../types/journey'

// MEQ-30 subscale item mappings
const MEQ30_SUBSCALES: Record<string, string[]> = {
  mystical: ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item18'],
  internalUnity: ['item7', 'item8', 'item9', 'item10', 'item11', 'item12', 'item19', 'item20', 'item21', 'item22'],
  transcendence: ['item13', 'item14', 'item15', 'item23', 'item24', 'item25', 'item26', 'item27'],
  positiveMood: ['item16', 'item17', 'item28', 'item29', 'item30'],
}

const SUBSCALE_LABELS: Record<string, string> = {
  mystical: 'Mystical experience',
  internalUnity: 'Internal unity',
  transcendence: 'Transcendence',
  positiveMood: 'Positive mood',
}

function computeSubscaleMean(meq30: Meq30, items: string[]): number {
  let sum = 0
  let count = 0
  for (const key of items) {
    const val = (meq30 as Record<string, number | undefined>)[key]
    if (val !== undefined) {
      sum += val
      count++
    }
  }
  return count > 0 ? sum / count : 0
}

function classifyLevel(mean: number): string {
  if (mean < 2) return 'low'
  if (mean <= 3.5) return 'moderate'
  return 'high'
}

function formatSubscales(meq30: Meq30): string {
  const parts: string[] = []
  for (const [key, items] of Object.entries(MEQ30_SUBSCALES)) {
    const mean = computeSubscaleMean(meq30, items)
    const level = classifyLevel(mean)
    const label = SUBSCALE_LABELS[key]
    parts.push(`${label}: ${level} (${mean.toFixed(1)})`)
  }
  return parts.join(', ')
}

function computeEdiMean(edi: Record<string, number | undefined>): number {
  let sum = 0
  let count = 0
  for (let i = 1; i <= 8; i++) {
    const val = edi[`item${i}`]
    if (val !== undefined) {
      sum += val
      count++
    }
  }
  return count > 0 ? sum / count : 0
}

function computeEbiSum(ebi: Record<string, number | undefined>): number {
  let sum = 0
  for (let i = 1; i <= 6; i++) {
    const val = ebi[`item${i}`]
    if (val !== undefined) {
      sum += val
    }
  }
  return sum
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function buildPhase1Section(phase1: Phase1): string {
  const lines: string[] = ['## Phase 1 (pre-trip)']

  // Intention
  if (phase1.intentions?.primary) {
    lines.push(`Intention: "${phase1.intentions.primary}"`)
  }

  // Conversation themes from last 3 user messages
  const conversation = phase1.conversation ?? []
  const userMessages = conversation.filter(m => m.role === 'user')
  const lastThree = userMessages.slice(-3)
  if (lastThree.length > 0) {
    lines.push('Conversation themes:')
    for (const msg of lastThree) {
      lines.push(`- "${truncate(msg.content, 100)}"`)
    }
  }

  // SWEMWBS baseline
  const sw = phase1.swemwbs
  if (sw) {
    lines.push(
      `Wellbeing baseline (1-5 scale): optimism=${sw.item1 ?? '?'}, usefulness=${sw.item2 ?? '?'}, relaxation=${sw.item3 ?? '?'}, coping=${sw.item4 ?? '?'}, clarity=${sw.item5 ?? '?'}, closeness=${sw.item6 ?? '?'}, autonomy=${sw.item7 ?? '?'}`
    )
  }

  return lines.join('\n')
}

function buildPhase2Section(phase2: Phase2): string {
  const lines: string[] = ['## Phase 2 (in-trip)']

  // MEQ-30 subscale interpretation
  if (phase2.meq30) {
    lines.push(`MEQ-30 subscales: ${formatSubscales(phase2.meq30)}`)
  }

  // EDI summary
  if (phase2.edi) {
    const mean = computeEdiMean(phase2.edi)
    lines.push(`Ego dissolution: ${mean.toFixed(1)}/100`)
  }

  // EBI summary
  if (phase2.ebi) {
    const sum = computeEbiSum(phase2.ebi)
    lines.push(`Emotional breakthrough: ${sum}/600`)
  }

  // Free-text responses
  const responses = phase2.rawImpressions?.responses
  if (responses && responses.length > 0) {
    const withText = responses.filter(r => r.freeText && r.freeText.trim().length > 0)
    const abbreviated = withText.slice(0, 3)
    if (abbreviated.length > 0) {
      lines.push('Free-text reflections:')
      for (const r of abbreviated) {
        lines.push(`- "${truncate(r.freeText, 100)}"`)
      }
    }
  }

  return lines.join('\n')
}

export function buildPhase3Context(phase1: Phase1 | null, phase2: Phase2 | null): string {
  const sections: string[] = []

  if (phase1) {
    sections.push(buildPhase1Section(phase1))
  } else {
    sections.push('## Phase 1 (pre-trip): Not completed')
  }

  if (phase2) {
    sections.push(buildPhase2Section(phase2))
  } else {
    sections.push('## Phase 2 (in-trip): Not completed')
  }

  return sections.join('\n\n')
}
