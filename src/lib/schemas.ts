import { z } from 'zod'

const substanceType = z.enum([
  'psilocybin', 'lsd', 'dmt', 'ayahuasca', 'mescaline', 'mdma', 'ketamine', 'other',
])

function recordSchema(keys: string[], min: number, max: number) {
  const shape: Record<string, z.ZodOptional<z.ZodNumber>> = {}
  for (const key of keys) {
    shape[key] = z.number().min(min).max(max).optional()
  }
  return z.object(shape)
}

const items7 = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7']
const items8 = [...items7, 'item8']
const items6 = items7.slice(0, 6)
const items4 = items7.slice(0, 4)
const items30 = Array.from({ length: 30 }, (_, i) => `item${i + 1}`)

export const swemwbsSchema = recordSchema(items7, 1, 5)

export const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  questionNumber: z.number().int().min(1).max(11),
  scores: swemwbsSchema.optional(),
})

export const conversationSchema = z.array(conversationMessageSchema)

export const innerLandscapeTextSchema = z.object({
  relationshipWithSelf: z.string().optional().default(''),
  prevalentEmotions: z.string().optional().default(''),
  currentFear: z.string().optional().default(''),
  currentGratitude: z.string().optional().default(''),
})

export const innerLandscapeRatingsSchema = z.object({
  connectedness: z.number().min(0).max(10).optional(),
  clarity: z.number().min(0).max(10).optional(),
  innerPeace: z.number().min(0).max(10).optional(),
})

export const intentionsSchema = z.object({
  primary: z.string().optional().default(''),
  explore: z.string().optional().default(''),
  letGo: z.string().optional().default(''),
  fears: z.string().optional().default(''),
  success: z.string().optional().default(''),
})

export const contextSchema = z.object({
  date: z.string().optional().default(''),
  substance: substanceType.optional().default('psilocybin'),
  dose: z.string().optional().default(''),
  setting: z.string().optional().default(''),
  sitter: z.string().optional().default(''),
})

export const phase2ResponseSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string().nullable(),
  freeText: z.string().default(''),
})

export const rawImpressionsSchema = z.object({
  freeWrite: z.string().optional().default(''),
  metaphor: z.string().optional().default(''),
  responses: z.array(phase2ResponseSchema).optional(),
})

export const meq30Schema = recordSchema(items30, 0, 5)

export const ediSchema = recordSchema(items8, 0, 100)

export const ebiSchema = recordSchema(items6, 0, 100)

export const challengingSchema = z.object({
  hadDifficulty: z.boolean().optional().default(false),
  difficultyRating: z.number().min(0).max(10).optional(),
  challengingMoment: z.string().optional().default(''),
  relationToDifficulty: z.string().optional().default(''),
  challengeValuable: z.number().min(1).max(5).optional(),
})

export const intentionRevisitedSchema = z.object({
  howRelated: z.string().optional().default(''),
  unexpected: z.string().optional().default(''),
})

export const engagedIntegrationSchema = recordSchema(items8, 1, 5)

export const experiencedIntegrationSchema = recordSchema(items4, 1, 5)

export const intentionIntegrationSchema = z.object({
  carriedIntoLife: z.string().optional().default(''),
  concreteChanges: z.string().optional().default(''),
  aliveInsights: z.string().optional().default(''),
  fadedInsights: z.string().optional().default(''),
})

export const openReflectionSchema = z.object({
  letterToSelf: z.string().optional().default(''),
  understandNow: z.string().optional().default(''),
})
