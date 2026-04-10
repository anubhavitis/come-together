export type SubstanceType =
  | 'psilocybin'
  | 'lsd'
  | 'dmt'
  | 'ayahuasca'
  | 'mescaline'
  | 'mdma'
  | 'ketamine'
  | 'other'

export type Swemwbs = Record<
  'item1' | 'item2' | 'item3' | 'item4' | 'item5' | 'item6' | 'item7',
  number | undefined
>

export type InnerLandscapeText = {
  relationshipWithSelf: string
  prevalentEmotions: string
  currentFear: string
  currentGratitude: string
}

export type InnerLandscapeRatings = {
  connectedness: number | undefined
  clarity: number | undefined
  innerPeace: number | undefined
}

export type Intentions = {
  primary: string
  explore: string
  letGo: string
  fears: string
  success: string
}

export type Context = {
  date: string
  substance: SubstanceType
  dose: string
  setting: string
  sitter: string
}

export type Phase2Response = {
  questionId: string
  selectedOptionId: string | null
  freeText: string
}

export type RawImpressions = {
  freeWrite: string
  metaphor: string
  responses?: Phase2Response[]
}

export type Meq30 = Record<
  | 'item1' | 'item2' | 'item3' | 'item4' | 'item5'
  | 'item6' | 'item7' | 'item8' | 'item9' | 'item10'
  | 'item11' | 'item12' | 'item13' | 'item14' | 'item15'
  | 'item16' | 'item17' | 'item18' | 'item19' | 'item20'
  | 'item21' | 'item22' | 'item23' | 'item24' | 'item25'
  | 'item26' | 'item27' | 'item28' | 'item29' | 'item30',
  number | undefined
>

export type Edi = Record<
  'item1' | 'item2' | 'item3' | 'item4' | 'item5' | 'item6' | 'item7' | 'item8',
  number | undefined
>

export type Ebi = Record<
  'item1' | 'item2' | 'item3' | 'item4' | 'item5' | 'item6',
  number | undefined
>

export type Challenging = {
  hadDifficulty: boolean
  difficultyRating: number | undefined
  challengingMoment: string
  relationToDifficulty: string
  challengeValuable: number | undefined
}

export type IntentionRevisited = {
  howRelated: string
  unexpected: string
}

export type EngagedIntegration = Record<
  'item1' | 'item2' | 'item3' | 'item4' | 'item5' | 'item6' | 'item7' | 'item8',
  number | undefined
>

export type ExperiencedIntegration = Record<
  'item1' | 'item2' | 'item3' | 'item4',
  number | undefined
>

export type IntentionIntegration = {
  carriedIntoLife: string
  concreteChanges: string
  aliveInsights: string
  fadedInsights: string
}

export type OpenReflection = {
  letterToSelf: string
  understandNow: string
}

export type Journey = {
  id: string
  userId: string
  name: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

export type Phase1 = {
  id: string
  journeyId: string
  completedAt: string | null
  swemwbs: Swemwbs
  innerLandscapeText: InnerLandscapeText
  innerLandscapeRatings: InnerLandscapeRatings
  intentions: Intentions
  context: Context
  updatedAt: string
}

export type Phase2 = {
  id: string
  journeyId: string
  completedAt: string | null
  rawImpressions: RawImpressions
  meq30: Meq30
  edi: Edi
  ebi: Ebi
  challenging: Challenging
  intentionRevisited: IntentionRevisited
  updatedAt: string
}

export type Phase3Entry = {
  id: string
  journeyId: string
  label: string
  completedAt: string | null
  swemwbs: Swemwbs
  innerLandscapeText: InnerLandscapeText
  innerLandscapeRatings: InnerLandscapeRatings
  engagedIntegration: EngagedIntegration
  experiencedIntegration: ExperiencedIntegration
  intentionIntegration: IntentionIntegration
  openReflection: OpenReflection
  createdAt: string
  updatedAt: string
}

export type FullJourney = Journey & {
  phase1: Phase1 | null
  phase2: Phase2 | null
  phase3Entries: Phase3Entry[]
}
