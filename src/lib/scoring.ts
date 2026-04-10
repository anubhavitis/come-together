import type { Meq30, Swemwbs, Edi, Ebi } from '@/types/journey'

// MEQ-30 subscale item mappings (standard validated instrument)
const MEQ30_SUBSCALES = {
  mystical: ['item4', 'item5', 'item6', 'item14', 'item15', 'item21', 'item29'],
  positiveMood: ['item2', 'item8', 'item12', 'item18', 'item22', 'item26'],
  transcendence: ['item1', 'item7', 'item11', 'item16', 'item20', 'item25'],
  ineffability: ['item3', 'item9', 'item10', 'item13', 'item17', 'item19', 'item23', 'item24', 'item27', 'item28', 'item30'],
} as const

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
