export type InstrumentScores = {
  meq30?: Partial<Record<string, number>>
  edi?: Partial<Record<string, number>>
  ebi?: Partial<Record<string, number>>
}

export type Phase2Option = {
  id: string
  text: string
  scores: InstrumentScores
}

export type Phase2Question = {
  id: string
  text: string
  options: Phase2Option[]
}

/**
 * 10 conversational in-trip check-in questions.
 *
 * Q1-Q4 target MEQ-30 constructs (mystical unity, noetic quality,
 * transcendence of time/space, ineffability).
 * Q5-Q7 target EDI constructs (ego dissolution, boundary loss, unity).
 * Q8-Q10 target EBI constructs (emotional catharsis, breakthrough, resolution).
 *
 * Cross-mappings exist where constructs overlap (e.g. unity maps to both
 * MEQ-30 and EDI items).
 *
 * Scale ranges: MEQ-30 items 0-5, EDI items 0-100, EBI items 0-100.
 */
export const phase2Questions: Phase2Question[] = [
  // Q1 — Unity / Connectedness (MEQ-30 internal unity + EDI unity)
  {
    id: 'q1',
    text: 'How connected do you feel to the world around you right now?',
    options: [
      {
        id: 'q1-a',
        text: 'I feel quite separate from everything',
        scores: { meq30: { item1: 0, item4: 0 }, edi: { item1: 0, item6: 0 } },
      },
      {
        id: 'q1-b',
        text: 'I notice some subtle connection',
        scores: { meq30: { item1: 2, item4: 2 }, edi: { item1: 25, item6: 25 } },
      },
      {
        id: 'q1-c',
        text: 'I feel a warm sense of belonging to everything',
        scores: { meq30: { item1: 4, item4: 3 }, edi: { item1: 65, item6: 65 } },
      },
      {
        id: 'q1-d',
        text: 'The boundaries between me and everything else have dissolved',
        scores: { meq30: { item1: 5, item4: 5 }, edi: { item1: 100, item6: 100 } },
      },
    ],
  },

  // Q2 — Noetic Quality (MEQ-30 noetic quality subscale)
  {
    id: 'q2',
    text: 'Are you experiencing any new insights or understanding?',
    options: [
      {
        id: 'q2-a',
        text: 'Not particularly — my thinking feels ordinary',
        scores: { meq30: { item5: 0, item9: 0, item18: 0 } },
      },
      {
        id: 'q2-b',
        text: 'I have a vague sense that something is becoming clearer',
        scores: { meq30: { item5: 2, item9: 2, item18: 1 } },
      },
      {
        id: 'q2-c',
        text: 'I feel like I understand something important about life',
        scores: { meq30: { item5: 4, item9: 3, item18: 3 } },
      },
      {
        id: 'q2-d',
        text: 'I feel I have access to a deep truth beyond ordinary knowing',
        scores: { meq30: { item5: 5, item9: 5, item18: 5 } },
      },
    ],
  },

  // Q3 — Transcendence of Time and Space (MEQ-30 transcendence subscale)
  {
    id: 'q3',
    text: 'How is your sense of time and space right now?',
    options: [
      {
        id: 'q3-a',
        text: 'Completely normal — I know exactly where and when I am',
        scores: { meq30: { item10: 0, item11: 0, item22: 0 } },
      },
      {
        id: 'q3-b',
        text: 'Time feels a little stretchy or compressed',
        scores: { meq30: { item10: 2, item11: 2, item22: 1 } },
      },
      {
        id: 'q3-c',
        text: 'Time and space feel quite different from usual',
        scores: { meq30: { item10: 3, item11: 3, item22: 3 } },
      },
      {
        id: 'q3-d',
        text: 'I feel outside of time — past and future have no meaning',
        scores: { meq30: { item10: 5, item11: 5, item22: 4 } },
      },
      {
        id: 'q3-e',
        text: 'Time, space, and my sense of location have completely vanished',
        scores: { meq30: { item10: 5, item11: 5, item22: 5 } },
      },
    ],
  },

  // Q4 — Ineffability / Sacredness (MEQ-30 ineffability + positive mood)
  {
    id: 'q4',
    text: 'If you tried to describe what you are experiencing, how would it go?',
    options: [
      {
        id: 'q4-a',
        text: 'I could describe it easily — nothing unusual',
        scores: { meq30: { item14: 0, item20: 0, item6: 0 } },
      },
      {
        id: 'q4-b',
        text: 'Some of it feels hard to put into words',
        scores: { meq30: { item14: 2, item20: 2, item6: 2 } },
      },
      {
        id: 'q4-c',
        text: 'Words feel completely inadequate for this',
        scores: { meq30: { item14: 4, item20: 4, item6: 3 } },
      },
      {
        id: 'q4-d',
        text: 'Language cannot touch what is happening — it feels sacred',
        scores: { meq30: { item14: 5, item20: 5, item6: 5 } },
      },
    ],
  },

  // Q5 — Ego Dissolution / Loss of Self (EDI primary + MEQ-30 cross-map)
  {
    id: 'q5',
    text: 'How would you describe your sense of self right now?',
    options: [
      {
        id: 'q5-a',
        text: 'I feel like my normal self',
        scores: { edi: { item2: 0, item3: 0, item4: 0 }, meq30: { item2: 0 } },
      },
      {
        id: 'q5-b',
        text: 'My sense of who I am feels a bit looser than usual',
        scores: { edi: { item2: 30, item3: 25, item4: 20 }, meq30: { item2: 2 } },
      },
      {
        id: 'q5-c',
        text: 'I am losing track of where I end and everything else begins',
        scores: { edi: { item2: 70, item3: 65, item4: 60 }, meq30: { item2: 4 } },
      },
      {
        id: 'q5-d',
        text: 'My individual self has completely dissolved',
        scores: { edi: { item2: 100, item3: 100, item4: 100 }, meq30: { item2: 5 } },
      },
    ],
  },

  // Q6 — Boundary Dissolution / Merging (EDI boundaries + unity)
  {
    id: 'q6',
    text: 'Do you feel any merging or blending with your surroundings?',
    options: [
      {
        id: 'q6-a',
        text: 'No — everything has clear edges and I am distinctly me',
        scores: { edi: { item5: 0, item7: 0, item8: 0 } },
      },
      {
        id: 'q6-b',
        text: 'The edges of things seem slightly softer',
        scores: { edi: { item5: 25, item7: 20, item8: 25 } },
      },
      {
        id: 'q6-c',
        text: 'I feel myself blending into my environment',
        scores: { edi: { item5: 65, item7: 60, item8: 70 } },
      },
      {
        id: 'q6-d',
        text: 'There is no separation — I am everything and everything is me',
        scores: { edi: { item5: 100, item7: 100, item8: 100 } },
      },
    ],
  },

  // Q7 — Oceanic Boundlessness / Awe (EDI + MEQ-30 positive mood)
  {
    id: 'q7',
    text: 'What is the overall quality of your experience right now?',
    options: [
      {
        id: 'q7-a',
        text: 'Ordinary — nothing stands out',
        scores: { edi: { item6: 0 }, meq30: { item3: 0, item7: 0, item8: 0 } },
      },
      {
        id: 'q7-b',
        text: 'Pleasant and mildly interesting',
        scores: { edi: { item6: 25 }, meq30: { item3: 2, item7: 2, item8: 2 } },
      },
      {
        id: 'q7-c',
        text: 'Deeply beautiful and awe-inspiring',
        scores: { edi: { item6: 70 }, meq30: { item3: 4, item7: 4, item8: 4 } },
      },
      {
        id: 'q7-d',
        text: 'Overwhelmingly vast and magnificent beyond anything I have known',
        scores: { edi: { item6: 100 }, meq30: { item3: 5, item7: 5, item8: 5 } },
      },
    ],
  },

  // Q8 — Emotional Catharsis (EBI catharsis + release)
  {
    id: 'q8',
    text: 'Are you experiencing any emotional release right now?',
    options: [
      {
        id: 'q8-a',
        text: 'My emotions feel calm and steady',
        scores: { ebi: { item1: 0, item2: 0 } },
      },
      {
        id: 'q8-b',
        text: 'Some feelings are coming up that I do not usually notice',
        scores: { ebi: { item1: 25, item2: 20 } },
      },
      {
        id: 'q8-c',
        text: 'I am feeling a strong wave of emotion moving through me',
        scores: { ebi: { item1: 65, item2: 60 } },
      },
      {
        id: 'q8-d',
        text: 'A deep emotional dam has broken open — it feels like a total release',
        scores: { ebi: { item1: 100, item2: 100 } },
      },
    ],
  },

  // Q9 — Emotional Breakthrough / Clarity (EBI breakthrough + insight)
  {
    id: 'q9',
    text: 'Do you feel any new clarity about something that has been troubling you?',
    options: [
      {
        id: 'q9-a',
        text: 'No — nothing specific is coming up',
        scores: { ebi: { item3: 0, item4: 0 } },
      },
      {
        id: 'q9-b',
        text: 'I am beginning to see something from a different angle',
        scores: { ebi: { item3: 30, item4: 25 } },
      },
      {
        id: 'q9-c',
        text: 'Something that was stuck is shifting — I feel lighter',
        scores: { ebi: { item3: 70, item4: 65 } },
      },
      {
        id: 'q9-d',
        text: 'I have had a profound realization that changes how I see things',
        scores: { ebi: { item3: 100, item4: 100 } },
      },
      {
        id: 'q9-e',
        text: 'Multiple layers of understanding are unfolding at once',
        scores: { ebi: { item3: 100, item4: 100 }, meq30: { item9: 5 } },
      },
    ],
  },

  // Q10 — Resolution / Peace (EBI resolution + MEQ-30 positive mood)
  {
    id: 'q10',
    text: 'As you check in with yourself, how do you feel overall?',
    options: [
      {
        id: 'q10-a',
        text: 'About the same as when I started',
        scores: { ebi: { item5: 0, item6: 0 }, meq30: { item15: 0, item16: 0 } },
      },
      {
        id: 'q10-b',
        text: 'A little more at peace than before',
        scores: { ebi: { item5: 30, item6: 25 }, meq30: { item15: 2, item16: 2 } },
      },
      {
        id: 'q10-c',
        text: 'Something has resolved inside me — a quiet sense of wholeness',
        scores: { ebi: { item5: 75, item6: 70 }, meq30: { item15: 4, item16: 4 } },
      },
      {
        id: 'q10-d',
        text: 'I feel profoundly healed, as if a deep wound has been met with love',
        scores: { ebi: { item5: 100, item6: 100 }, meq30: { item15: 5, item16: 5 } },
      },
    ],
  },
]
