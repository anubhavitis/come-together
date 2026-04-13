import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks";

export interface CarouselQuestion {
  id: string;
  content: ReactNode;
}

export interface QuestionCarouselProps {
  questions: CarouselQuestion[];
  currentIndex: number;
  onAdvance: () => void;
  canAdvance?: boolean;
  totalQuestions?: number;
  className?: string;
}

const OPTION_SELECTORS = '[role="radio"], [role="option"], button[data-option]';

export function QuestionCarousel({
  questions,
  currentIndex,
  onAdvance,
  canAdvance = false,
  totalQuestions,
  className,
}: QuestionCarouselProps) {
  const reducedMotion = useReducedMotion();
  const questionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const total = totalQuestions ?? questions.length;
  const currentQuestion = questions[currentIndex];
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  // Fade-in on question change
  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    setVisible(false);
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [currentQuestion?.id, reducedMotion]);

  // Focus management on question change
  useEffect(() => {
    questionRef.current?.focus();
  }, [currentIndex]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && canAdvance) {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        e.preventDefault();
        onAdvance();
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const container = questionRef.current;
        if (!container) return;

        const options = Array.from(
          container.querySelectorAll<HTMLElement>(OPTION_SELECTORS)
        );
        if (options.length === 0) return;

        e.preventDefault();

        const activeElement = document.activeElement as HTMLElement;
        const currentIdx = options.indexOf(activeElement);

        let nextIdx: number;
        if (e.key === "ArrowDown") {
          nextIdx = currentIdx < options.length - 1 ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : options.length - 1;
        }

        options[nextIdx].focus();
      }
    },
    [canAdvance, onAdvance]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const transitionStyle = reducedMotion
    ? undefined
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 300ms ease-out, transform 300ms ease-out",
      };

  return (
    <div className={`flex flex-col min-h-[calc(100dvh-56px)] ${className ?? ""}`}>
      {/* Progress bar */}
      <div
        className="h-0.5 w-full bg-card"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${currentIndex + 1} of ${total}`}
      >
        <div
          className="h-full bg-accent-warm transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question container */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div
          key={currentQuestion?.id}
          ref={questionRef}
          tabIndex={-1}
          className="w-full max-w-2xl outline-none"
          style={transitionStyle}
        >
          {currentQuestion?.content}
        </div>
      </div>

      {/* Screen reader announcement */}
      <div aria-live="polite" className="sr-only">
        {`Question ${currentIndex + 1} of ${total}`}
      </div>
    </div>
  );
}
