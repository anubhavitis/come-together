import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePhase1, useUpsertPhase1 } from "@/hooks/use-phase1";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
  LikertScale,
  RatingSlider,
  FreeTextPrompt,
  CollapsibleSection,
  SaveIndicator,
} from "@/components/shared";
import { swemwbsItems } from "@/data/swemwbs-items";
import type {
  Swemwbs,
  InnerLandscapeText,
  InnerLandscapeRatings,
  Intentions,
  Context,
  SubstanceType,
} from "@/types/journey";

export const Route = createFileRoute("/journey/$id/phase1")({
  component: Phase1Form,
});

const SUBSTANCE_OPTIONS: { value: SubstanceType; label: string }[] = [
  { value: "psilocybin", label: "Psilocybin" },
  { value: "lsd", label: "LSD" },
  { value: "dmt", label: "DMT" },
  { value: "ayahuasca", label: "Ayahuasca" },
  { value: "mescaline", label: "Mescaline" },
  { value: "mdma", label: "MDMA" },
  { value: "ketamine", label: "Ketamine" },
  { value: "other", label: "Other" },
];

const DEFAULT_SWEMWBS: Swemwbs = {
  item1: undefined,
  item2: undefined,
  item3: undefined,
  item4: undefined,
  item5: undefined,
  item6: undefined,
  item7: undefined,
};

const DEFAULT_LANDSCAPE_TEXT: InnerLandscapeText = {
  relationshipWithSelf: "",
  prevalentEmotions: "",
  currentFear: "",
  currentGratitude: "",
};

const DEFAULT_LANDSCAPE_RATINGS: InnerLandscapeRatings = {
  connectedness: undefined,
  clarity: undefined,
  innerPeace: undefined,
};

const DEFAULT_INTENTIONS: Intentions = {
  primary: "",
  explore: "",
  letGo: "",
  fears: "",
  success: "",
};

const DEFAULT_CONTEXT: Context = {
  date: "",
  substance: "psilocybin",
  dose: "",
  setting: "",
  sitter: "",
};

function Phase1Form() {
  const { id } = Route.useParams();
  const { data: phase1, isLoading } = usePhase1(id);
  const { mutateAsync } = useUpsertPhase1();

  const [swemwbs, setSwemwbs] = useState<Swemwbs>(DEFAULT_SWEMWBS);
  const [landscapeText, setLandscapeText] = useState<InnerLandscapeText>(
    DEFAULT_LANDSCAPE_TEXT,
  );
  const [landscapeRatings, setLandscapeRatings] =
    useState<InnerLandscapeRatings>(DEFAULT_LANDSCAPE_RATINGS);
  const [intentions, setIntentions] = useState<Intentions>(DEFAULT_INTENTIONS);
  const [context, setContext] = useState<Context>(DEFAULT_CONTEXT);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (phase1 && !initialized) {
      setSwemwbs(phase1.swemwbs ?? DEFAULT_SWEMWBS);
      setLandscapeText(phase1.innerLandscapeText ?? DEFAULT_LANDSCAPE_TEXT);
      setLandscapeRatings(
        phase1.innerLandscapeRatings ?? DEFAULT_LANDSCAPE_RATINGS,
      );
      setIntentions(phase1.intentions ?? DEFAULT_INTENTIONS);
      setContext(phase1.context ?? DEFAULT_CONTEXT);
      setCompletedAt(phase1.completedAt);
      setInitialized(true);
    }
  }, [phase1, initialized]);

  // Mark as initialized even if no existing data (new journey)
  useEffect(() => {
    if (!isLoading && !phase1 && !initialized) {
      setInitialized(true);
    }
  }, [isLoading, phase1, initialized]);

  const formData = useMemo(
    () => ({
      swemwbs,
      innerLandscapeText: landscapeText,
      innerLandscapeRatings: landscapeRatings,
      intentions,
      context,
    }),
    [swemwbs, landscapeText, landscapeRatings, intentions, context],
  );

  const onSave = useCallback(
    async (data: typeof formData) => {
      await mutateAsync({
        journeyId: id,
        ...data,
        completedAt,
      });
    },
    [mutateAsync, id, completedAt],
  );

  const { status } = useAutoSave({
    data: formData,
    onSave,
    enabled: initialized,
  });

  const swemwbsAnswered = useMemo(
    () => Object.values(swemwbs).filter((v) => v !== undefined).length,
    [swemwbs],
  );

  const handleComplete = async () => {
    const now = new Date().toISOString();
    setCompletedAt(now);
    await mutateAsync({
      journeyId: id,
      ...formData,
      completedAt: now,
    });
  };

  const handleUncomplete = async () => {
    setCompletedAt(null);
    await mutateAsync({
      journeyId: id,
      ...formData,
      completedAt: null,
    });
  };

  if (isLoading) {
    return <p className="text-text-secondary">Loading...</p>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/journey/$id"
            params={{ id }}
            className="text-sm text-accent-cool hover:underline"
          >
            &larr; Back to journey
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Setting the Compass</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Prepare for your journey by reflecting on where you are now.
          </p>
        </div>
        <SaveIndicator status={status} />
      </div>

      {/* Section A: SWEMWBS */}
      <CollapsibleSection
        title="How have you been feeling?"
        whyText="These 7 questions are from the Short Warwick-Edinburgh Mental Wellbeing Scale, used in psychedelic research to measure baseline wellbeing. You'll answer these same questions after your experience to see what shifted."
        progress={{ answered: swemwbsAnswered, total: 7 }}
        defaultOpen
      >
        {swemwbsItems.map((item) => (
          <LikertScale
            key={item.id}
            id={`swemwbs-${item.id}`}
            label={item.text}
            value={swemwbs[item.id as keyof Swemwbs]}
            onChange={(val) =>
              setSwemwbs((prev) => ({ ...prev, [item.id]: val }))
            }
            min={1}
            max={5}
            minLabel="None of the time"
            maxLabel="All of the time"
          />
        ))}
      </CollapsibleSection>

      {/* Section B: Inner Landscape */}
      <CollapsibleSection title="Where are you right now?">
        <FreeTextPrompt
          id="landscape-self"
          label="What is your current relationship with yourself?"
          value={landscapeText.relationshipWithSelf}
          onChange={(val) =>
            setLandscapeText((prev) => ({ ...prev, relationshipWithSelf: val }))
          }
        />
        <FreeTextPrompt
          id="landscape-emotions"
          label="What emotions have been most present for you lately?"
          value={landscapeText.prevalentEmotions}
          onChange={(val) =>
            setLandscapeText((prev) => ({ ...prev, prevalentEmotions: val }))
          }
        />
        <FreeTextPrompt
          id="landscape-fear"
          label="What are you most afraid of right now?"
          value={landscapeText.currentFear}
          onChange={(val) =>
            setLandscapeText((prev) => ({ ...prev, currentFear: val }))
          }
        />
        <FreeTextPrompt
          id="landscape-gratitude"
          label="What are you most grateful for right now?"
          value={landscapeText.currentGratitude}
          onChange={(val) =>
            setLandscapeText((prev) => ({ ...prev, currentGratitude: val }))
          }
        />

        <RatingSlider
          id="rating-connectedness"
          label="How connected do you feel to the people in your life?"
          value={landscapeRatings.connectedness}
          onChange={(val) =>
            setLandscapeRatings((prev) => ({ ...prev, connectedness: val }))
          }
          min={0}
          max={10}
        />
        <RatingSlider
          id="rating-clarity"
          label="How much clarity do you feel about your life direction?"
          value={landscapeRatings.clarity}
          onChange={(val) =>
            setLandscapeRatings((prev) => ({ ...prev, clarity: val }))
          }
          min={0}
          max={10}
        />
        <RatingSlider
          id="rating-peace"
          label="How at peace do you feel with yourself?"
          value={landscapeRatings.innerPeace}
          onChange={(val) =>
            setLandscapeRatings((prev) => ({ ...prev, innerPeace: val }))
          }
          min={0}
          max={10}
        />
      </CollapsibleSection>

      {/* Section C: Intentions */}
      <CollapsibleSection
        title="What are you hoping to explore?"
        whyText="Research shows that specific, flexible intentions are one of the strongest predictors of positive outcomes. The key is to hold them loosely — let the experience unfold."
      >
        <FreeTextPrompt
          id="intention-primary"
          label="What is your primary intention for this experience?"
          value={intentions.primary}
          onChange={(val) =>
            setIntentions((prev) => ({ ...prev, primary: val }))
          }
          placeholder="Be as specific as you can, while holding it loosely..."
        />
        <FreeTextPrompt
          id="intention-explore"
          label="What would you like to explore or understand better about yourself?"
          value={intentions.explore}
          onChange={(val) =>
            setIntentions((prev) => ({ ...prev, explore: val }))
          }
        />
        <FreeTextPrompt
          id="intention-letgo"
          label="What are you willing to let go of?"
          value={intentions.letGo}
          onChange={(val) => setIntentions((prev) => ({ ...prev, letGo: val }))}
        />
        <FreeTextPrompt
          id="intention-fears"
          label="Is there anything you're afraid might come up? If so, how do you want to meet it?"
          value={intentions.fears}
          onChange={(val) => setIntentions((prev) => ({ ...prev, fears: val }))}
        />
        <FreeTextPrompt
          id="intention-success"
          label="What does a 'successful' experience look like for you — and can you hold that loosely?"
          value={intentions.success}
          onChange={(val) =>
            setIntentions((prev) => ({ ...prev, success: val }))
          }
        />
      </CollapsibleSection>

      {/* Section D: Practical Details */}
      <CollapsibleSection title="The basics">
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="context-date"
              className="text-text-primary text-sm font-medium"
            >
              Date
            </label>
            <input
              type="date"
              id="context-date"
              value={context.date}
              onChange={(e) =>
                setContext((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full rounded-lg border-2 border-card bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent-cool focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="context-substance"
              className="text-text-primary text-sm font-medium"
            >
              Substance
            </label>
            <select
              id="context-substance"
              value={context.substance}
              onChange={(e) =>
                setContext((prev) => ({
                  ...prev,
                  substance: e.target.value as SubstanceType,
                }))
              }
              className="w-full rounded-lg border-2 border-card bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent-cool focus:outline-none"
            >
              {SUBSTANCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="context-dose"
              className="text-text-primary text-sm font-medium"
            >
              Dose
            </label>
            <input
              type="text"
              id="context-dose"
              value={context.dose}
              onChange={(e) =>
                setContext((prev) => ({ ...prev, dose: e.target.value }))
              }
              placeholder="e.g., 3.5g dried mushrooms"
              className="w-full rounded-lg border-2 border-card bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-cool focus:outline-none"
            />
          </div>

          <FreeTextPrompt
            id="context-setting"
            label="Setting"
            value={context.setting}
            onChange={(val) =>
              setContext((prev) => ({ ...prev, setting: val }))
            }
            placeholder="Where will you be?"
          />

          <div className="space-y-2">
            <label
              htmlFor="context-sitter"
              className="text-text-primary text-sm font-medium"
            >
              Sitter
            </label>
            <input
              type="text"
              id="context-sitter"
              value={context.sitter}
              onChange={(e) =>
                setContext((prev) => ({ ...prev, sitter: e.target.value }))
              }
              placeholder="Who will be with you?"
              className="w-full rounded-lg border-2 border-card bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-cool focus:outline-none"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Complete / Uncomplete */}
      <div className="flex items-center justify-center pt-4">
        {completedAt ? (
          <div className="text-center space-y-2">
            <p className="text-sm text-success">
              Completed on {new Date(completedAt).toLocaleDateString()}
            </p>
            <button
              type="button"
              onClick={handleUncomplete}
              className="text-sm text-text-secondary hover:text-text-primary underline"
            >
              Mark as incomplete
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            className="rounded-lg bg-accent-warm px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-warm/90"
          >
            Mark as Complete
          </button>
        )}
      </div>
    </div>
  );
}
