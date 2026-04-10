import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePhase2, useUpsertPhase2 } from "@/hooks/use-phase2";
import { usePhase1 } from "@/hooks/use-phase1";
import { useAutoSave } from "@/hooks/use-auto-save";
import { QuestionCarousel, SaveIndicator } from "@/components/shared";
import { phase2Questions } from "@/data/phase2-questions";
import { computePhase2Scores } from "@/lib/scoring";
import type { CarouselQuestion } from "@/components/shared";
import type { Phase2Response } from "@/types/journey";
import type { Phase2Question } from "@/data/phase2-questions";

export const Route = createFileRoute("/journey/$id/phase2")({
  component: Phase2Form,
});

// ---------------------------------------------------------------------------
// IntentionBanner — shows Phase 1 intention sentence when available
// ---------------------------------------------------------------------------

interface IntentionBannerProps {
  journeyId: string;
}

function IntentionBanner({ journeyId }: IntentionBannerProps) {
  const { data: phase1, isLoading } = usePhase1(journeyId);

  if (isLoading || !phase1?.intentions?.primary) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-3 text-center">
      <p className="text-sm italic text-text-secondary">
        Your intention: {phase1.intentions.primary}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MultipleChoiceQuestion — renders a single question with option buttons
// ---------------------------------------------------------------------------

interface MultipleChoiceQuestionProps {
  question: Phase2Question;
  selected: string | null;
  freeText: string;
  onSelect: (optionId: string) => void;
  onFreeTextChange: (text: string) => void;
}

function MultipleChoiceQuestion({
  question,
  selected,
  freeText,
  onSelect,
  onFreeTextChange,
}: MultipleChoiceQuestionProps) {
  const [showFreeText, setShowFreeText] = useState(freeText.length > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-heading font-semibold tracking-heading text-text-primary">
        {question.text}
      </h2>

      <fieldset className="space-y-3">
        <legend className="sr-only">Choose your response</legend>
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              data-option
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={`min-h-[44px] w-full rounded-2xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                isSelected
                  ? "border-accent-warm bg-accent-warm/10 text-text-primary"
                  : "border-border bg-surface text-text-secondary hover:border-border-hover"
              }`}
            >
              {option.text}
            </button>
          );
        })}
      </fieldset>

      <div>
        <button
          type="button"
          onClick={() => setShowFreeText((prev) => !prev)}
          className="text-xs text-text-secondary transition-colors hover:text-accent-warm"
        >
          {showFreeText ? "Hide free text" : "Type your own"}
        </button>

        {showFreeText && (
          <textarea
            rows={3}
            value={freeText}
            onChange={(e) => onFreeTextChange(e.target.value)}
            placeholder="Share what feels true for you..."
            className="mt-2 w-full resize-none rounded-xl border-2 border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-warm focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase2Form — main route component
// ---------------------------------------------------------------------------

function Phase2Form() {
  const { id } = Route.useParams();
  const { data: phase2Data, isLoading, error } = usePhase2(id);
  const { mutateAsync } = useUpsertPhase2();

  const [answers, setAnswers] = useState<Record<string, Phase2Response>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Resume from existing data
  useEffect(() => {
    if (phase2Data && !initialized) {
      if (phase2Data.completedAt) {
        setCompleted(true);
      }

      const existing = phase2Data.rawImpressions?.responses;
      if (existing && existing.length > 0) {
        const restored: Record<string, Phase2Response> = {};
        for (const r of existing) {
          restored[r.questionId] = r;
        }
        setAnswers(restored);
        // Resume from the next unanswered question, capped at last question
        const resumeIdx = Math.min(existing.length, phase2Questions.length - 1);
        setCurrentIndex(resumeIdx);
      }
      setInitialized(true);
    }
  }, [phase2Data, initialized]);

  // Mark initialized if no existing data
  useEffect(() => {
    if (!isLoading && !phase2Data && !initialized) {
      setInitialized(true);
    }
  }, [isLoading, phase2Data, initialized]);

  // ---- Auto-save ----
  const autoSaveData = useMemo(
    () => Object.values(answers),
    [answers],
  );

  const onSave = useCallback(
    async (responses: Phase2Response[]) => {
      await mutateAsync({
        journeyId: id,
        rawImpressions: {
          freeWrite: "",
          metaphor: "",
          responses,
        },
      });
    },
    [mutateAsync, id],
  );

  const { status, flush } = useAutoSave({
    data: autoSaveData,
    onSave,
    enabled: initialized && !completed,
  });

  // ---- canAdvance logic ----
  const currentQuestion = phase2Questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const canAdvance =
    !!currentAnswer?.selectedOptionId ||
    (currentAnswer?.freeText?.length ?? 0) > 0;

  // ---- Handlers ----
  const handleSelect = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          selectedOptionId: optionId,
          freeText: prev[questionId]?.freeText ?? "",
        },
      }));
    },
    [],
  );

  const handleFreeTextChange = useCallback(
    (questionId: string, text: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          selectedOptionId: prev[questionId]?.selectedOptionId ?? null,
          freeText: text,
        },
      }));
    },
    [],
  );

  const handleAdvance = useCallback(async () => {
    if (currentIndex < phase2Questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // Last question — compute scores and save
    const scores = computePhase2Scores(answers, phase2Questions);
    await flush();
    const now = new Date().toISOString();
    await mutateAsync({
      journeyId: id,
      rawImpressions: {
        freeWrite: "",
        metaphor: "",
        responses: Object.values(answers),
      },
      meq30: scores.meq30,
      edi: scores.edi,
      ebi: scores.ebi,
      completedAt: now,
    });
    setCompleted(true);
  }, [currentIndex, answers, flush, mutateAsync, id]);

  // ---- CarouselQuestion[] mapping ----
  const carouselQuestions: CarouselQuestion[] = useMemo(
    () =>
      phase2Questions.map((q) => ({
        id: q.id,
        content: (
          <MultipleChoiceQuestion
            question={q}
            selected={answers[q.id]?.selectedOptionId ?? null}
            freeText={answers[q.id]?.freeText ?? ""}
            onSelect={(optionId) => handleSelect(q.id, optionId)}
            onFreeTextChange={(text) => handleFreeTextChange(q.id, text)}
          />
        ),
      })),
    [answers, handleSelect, handleFreeTextChange],
  );

  // ---- Loading / Error states ----
  if (isLoading) {
    return <p className="p-8 text-text-secondary">Loading...</p>;
  }

  if (error) {
    return (
      <p className="p-8 text-danger">Error: {error.message}</p>
    );
  }

  // ---- Completion view ----
  if (completed || phase2Data?.completedAt) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center px-4">
        <div className="max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-semibold text-text-primary">
            Check-in complete
          </h2>
          <p className="text-sm text-text-secondary">
            Thank you for mapping your experience. Your responses have been
            saved.
          </p>
          <Link
            to="/journey/$id"
            params={{ id }}
            className="inline-block rounded-2xl bg-accent-warm px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-accent-warm/90"
          >
            View Journey
          </Link>
        </div>
      </div>
    );
  }

  // ---- Main carousel view ----
  return (
    <div className="relative">
      <IntentionBanner journeyId={id} />

      <div className="absolute right-4 top-3 z-10">
        <SaveIndicator status={status} />
      </div>

      <QuestionCarousel
        questions={carouselQuestions}
        currentIndex={currentIndex}
        onAdvance={handleAdvance}
        canAdvance={canAdvance}
        totalQuestions={phase2Questions.length}
      />
    </div>
  );
}
