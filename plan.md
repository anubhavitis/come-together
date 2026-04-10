# PLAN.md — Implementation Plan

## Overview

Build "Inner Compass" as a React SPA (single-page app). All data stays local (IndexedDB via a thin wrapper). No backend. No auth. No cloud. Privacy is the entire point.

---

## Milestone 1: Foundation + Data Layer

**Goal**: Core data model, storage, and navigation shell.

### Tasks
- [ ] Initialize React project (Vite + TypeScript + Tailwind)
- [ ] Set up IndexedDB storage layer (use `idb` library or raw IndexedDB)
  - CRUD for Journey objects
  - Each journey has phase1, phase2, and phase3Entries[] as described in README
  - Auto-save on every field change (debounced, ~500ms)
- [ ] Set up React Router with routes:
  - `/` — Journey list (home)
  - `/journey/:id` — Journey overview (shows phase completion status)
  - `/journey/:id/phase1` — Before form
  - `/journey/:id/phase2` — After form
  - `/journey/:id/phase3/new` — New integration check-in
  - `/journey/:id/phase3/:entryId` — View/edit specific check-in
  - `/journey/:id/compare` — Comparison view
- [ ] Create base layout: sidebar/nav, dark mode default, mobile responsive
- [ ] Create "New Journey" flow: name it, creates the object, navigates to phase1
- [ ] JSON export/import functionality

### Technical Decisions
- **IndexedDB over localStorage**: The data model is nested and journeys can accumulate. IndexedDB handles this better and has no 5MB cap.
- **Auto-save**: No "submit" buttons. Every field change persists. This is a journal, not a form submission. Use debounced writes.
- **No framework for state management**: React context + useReducer is sufficient. This is a single-user local app.

---

## Milestone 2: Instrument Components

**Goal**: Build the reusable questionnaire components that render each research instrument.

### Shared Components
- [ ] `LikertScale` — Renders a single item with N radio buttons (configurable 5-point or 6-point). Shows labels at endpoints. Mobile-friendly tap targets.
- [ ] `VASSlider` — Renders a 0–100 visual analogue scale as a slider. Shows numeric value. Smooth, thumb-friendly on mobile.
- [ ] `FreeTextPrompt` — Styled textarea with a prompt/question above it. Auto-expands. Optional character count.
- [ ] `RatingSlider` — 0–10 discrete slider for the custom inner landscape questions.
- [ ] `InstrumentSection` — Wrapper component that groups items under a heading, with:
  - Collapsible/expandable
  - "Why this question?" expandable explainer
  - Progress indicator (X of Y answered)
  - Factor/subscale label

### Instrument-Specific Components
- [ ] `SWEMWBS` — 7 items, 5-point Likert. Used in Phase 1 and Phase 3.
- [ ] `MEQ30` — 30 items grouped by 4 factors, 6-point scale (0–5). Render factor by factor with headers explaining each dimension in plain language:
  - Mystical (15 items): "These questions explore whether you felt a sense of unity, sacredness, or encounter with something beyond your usual self."
  - Positive Mood (6 items): "These capture the emotional quality of the experience — peace, joy, awe, tenderness."
  - Transcendence of Time/Space (6 items): "Did your usual sense of time and space dissolve?"
  - Ineffability (3 items): "Could you put the experience into words?"
- [ ] `EDI` — 8 items, 0–100 VAS slider each. Explain: "These questions measure the degree to which your usual sense of 'self' dissolved during the experience."
- [ ] `EBI` — 6 items, 0–100 VAS slider each. Explain: "These capture whether you had an emotional breakthrough — facing and working through difficult feelings."
- [ ] `IntegrationEngaged` — 8 items, 5-point Likert.
- [ ] `IntegrationExperienced` — 4 items, 5-point Likert.

### Data Files
- [ ] `src/data/meq30Items.ts` — Array of { id, text, factor: 'mystical'|'positiveMood'|'timeSpace'|'ineffability' }
- [ ] `src/data/ediItems.ts` — Array of { id, text }
- [ ] `src/data/ebiItems.ts` — Array of { id, text }
- [ ] `src/data/swemwbsItems.ts` — Array of { id, text }
- [ ] `src/data/integrationItems.ts` — Engaged + Experienced items
- [ ] `src/data/scoring.ts` — Functions:
  - `scoreMEQ30(responses) → { total, mystical, positiveMood, timeSpace, ineffability, isCompleteMystical }`
  - `scoreEDI(responses) → { mean }`
  - `scoreEBI(responses) → { total, mean }`
  - `scoreSWEMWBS(responses) → { rawTotal, items }`

---

## Milestone 3: Phase Forms

**Goal**: Build the three phase forms using the instrument components.

### Phase 1 Form — "Setting the Compass"
- [ ] Section A: SWEMWBS component
- [ ] Section B: Inner Landscape
  - 4 free-text prompts (relationship with self, emotions, fear, gratitude)
  - 3 rating sliders (connectedness, clarity, inner peace)
- [ ] Section C: Intention Setting
  - 5 free-text prompts
  - The primary intention prompt should be visually prominent — larger, centered
- [ ] Section D: Practical Context
  - Date picker
  - Substance dropdown
  - Dose text input
  - Setting text area
  - Sitter text input
- [ ] All sections auto-save
- [ ] "Mark as Complete" button at bottom (sets completedAt timestamp)
- [ ] Sections can be filled in any order

### Phase 2 Form — "Mapping the Territory"
- [ ] Gating: Show a gentle reminder that this should be filled within 24–72 hours. Show time elapsed since Phase 1 completion.
- [ ] Section A: Raw Impressions (free write + metaphor) — **show this first, before any structured questions**, so the user captures their experience in their own words before being shaped by the questionnaire items
- [ ] Section B: MEQ-30 (grouped by factor, collapsible)
- [ ] Section C: EDI
- [ ] Section D: EBI
- [ ] Section E: Challenging Aspects (optional, expandable)
- [ ] Section F: Intention Revisited — display Phase 1 intentions as read-only, then free-text reflection
- [ ] "Mark as Complete" button

### Phase 3 Form — "Walking the Path"
- [ ] Label prompt: "What time point is this?" with suggestions (2 weeks, 1 month, 3 months, 6 months, 1 year) or custom
- [ ] Section A: SWEMWBS (same as Phase 1)
- [ ] Section B: Inner Landscape (same sliders + prompts as Phase 1)
- [ ] Section C: Engaged Integration Scale (8 items)
- [ ] Section D: Experienced Integration Scale (4 items)
- [ ] Section E: Intention Integration — display Phase 1 intentions, then 4 free-text prompts
- [ ] Section F: Open Reflection (2 free-text prompts)
- [ ] Show Phase 1 values as faded/ghost text or in a sidebar while filling, so the user can see what they said before
- [ ] Multiple Phase 3 entries allowed per journey

---

## Milestone 4: Comparison View + Visualizations

**Goal**: The core value — making the before/after shift visible.

### Comparison View (`/journey/:id/compare`)
- [ ] **SWEMWBS Comparison**: Grouped bar chart or paired dot plot showing each of the 7 items, Phase 1 vs latest Phase 3. Show raw delta with color coding (green = improvement, red = decline, gray = no change). Show total score delta prominently.
- [ ] **Inner Landscape Comparison**: Three horizontal bar comparisons for connectedness, clarity, inner peace. Phase 1 value vs Phase 3 value.
- [ ] **Intention Arc**: A narrative card that shows:
  1. The original intention (Phase 1)
  2. How it related to the experience (Phase 2)
  3. How it's been integrated (latest Phase 3)
  Side by side or as a vertical timeline.
- [ ] **Experience Profile**: Radar/spider chart with 6 axes:
  - MEQ Mystical (normalized 0–100)
  - MEQ Positive Mood (normalized 0–100)
  - MEQ Time-Space (normalized 0–100)
  - MEQ Ineffability (normalized 0–100)
  - EDI mean (already 0–100)
  - EBI mean (already 0–100)
- [ ] **Complete Mystical Experience Badge**: If they met the ≥60% threshold on all 4 MEQ subscales, show a gentle indicator (not gamified — something like "Your experience met the research criteria for a complete mystical experience, as defined by Johns Hopkins studies.")
- [ ] **Integration Timeline** (if multiple Phase 3 entries): Line chart of SWEMWBS total over time, with Phase 1 baseline as a horizontal reference line.

### Chart Library
- Use **Recharts** (React-native, works well with Tailwind) or **Chart.js** for the visualizations
- Keep charts simple and readable. No 3D. No animation overload. The data should speak.

---

## Milestone 5: Polish + Export

**Goal**: Make it feel finished, exportable, and safe.

### UX Polish
- [ ] Dark mode with warm, muted colors (deep indigo/slate background, soft gold/amber accents)
- [ ] Smooth transitions between phases
- [ ] Journey overview page shows a timeline: Phase 1 ✓ → Phase 2 ✓ → Phase 3 (2w) ✓ → Phase 3 (1m) ...
- [ ] Empty states with gentle encouragement (not clinical instructions)
- [ ] Mobile-optimized: large tap targets for sliders and Likert, swipe between sections
- [ ] Progress persistence: if the user closes mid-form, everything is saved, they pick up where they left off

### Export
- [ ] **JSON Export**: Full journey data as JSON file download. Can be re-imported.
- [ ] **PDF Export**: A formatted PDF of a complete journey:
  - Phase 1 responses
  - Phase 2 scores + free text
  - Phase 3 entries
  - Comparison charts rendered as static images (use html2canvas or similar)
- [ ] **Data Reset**: Ability to delete individual journeys or all data. Confirm with friction (type "delete" to confirm).

### Safety
- [ ] Disclaimer shown on first launch (as specified in README)
- [ ] If someone hasn't completed Phase 3 and it's been >2 weeks since Phase 2, show a gentle nudge: "It's been [X days] since your experience. Integration journaling within the first few weeks can be especially valuable."
- [ ] No data ever leaves the device. No analytics. No tracking. Explicitly state this in the app.

---

## Design Tokens (suggested)

```
Background:       #0f172a (slate-900) or #1e1b4b (indigo-950)
Surface:          #1e293b (slate-800) or #312e81 (indigo-900)
Card:             #334155 (slate-700)
Text primary:     #e2e8f0 (slate-200)
Text secondary:   #94a3b8 (slate-400)
Accent warm:      #f59e0b (amber-500)
Accent cool:      #818cf8 (indigo-400)
Success:          #34d399 (emerald-400)
Warning:          #fb923c (orange-400)
Danger:           #f87171 (red-400)
```

---

## Stretch Goals (post-MVP)

- [ ] **Audio journal**: Record a voice note instead of (or in addition to) free text
- [ ] **Group view**: If friends want to compare anonymized experience profiles (opt-in only)
- [ ] **Guided breathing/meditation timer**: Built into the Phase 1 "setting the compass" as a pre-experience grounding exercise
- [ ] **Tagging system**: Tag journeys with themes that emerged (e.g., "grief", "self-acceptance", "connection")
- [ ] **PWA support**: Install as a home screen app on mobile
- [ ] **Encryption**: Optional password/PIN to open the app (since this is deeply personal data on a shared device)
