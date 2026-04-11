import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePhase3Conversation } from "@/hooks/use-phase3-conversation";
import { usePhase3Entries, useCreatePhase3Entry } from "@/hooks/use-phase3";
import type { Phase3ConversationMessage } from "@/types/journey";

export const Route = createFileRoute("/journey/$id/phase3/new")({
  component: Phase3NewPage,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_QUESTIONS = 10;

// ---------------------------------------------------------------------------
// ProgressBar -- thin accent-warm bar showing question progress
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  current: number;
  total: number;
}

function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.min((current / total) * 100, 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Question ${current} of ${total}`}
      className="h-[3px] w-full overflow-hidden rounded-full bg-card"
    >
      <div
        className="h-full rounded-full bg-accent-warm transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoadingIndicator -- three pulsing dots, reduced-motion safe
// ---------------------------------------------------------------------------

interface LoadingIndicatorProps {
  label?: string;
}

function LoadingIndicator({ label }: LoadingIndicatorProps) {
  return (
    <div aria-live="polite" className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 motion-safe:animate-pulse">
        <span className="inline-block h-2 w-2 rounded-full bg-accent-warm opacity-60 motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]" />
        <span className="inline-block h-2 w-2 rounded-full bg-accent-warm opacity-60 motion-safe:animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
        <span className="inline-block h-2 w-2 rounded-full bg-accent-warm opacity-60 motion-safe:animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
      </div>
      <p className="text-sm text-text-secondary">
        {label ?? (
          <>
            <span className="motion-safe:hidden">Thinking...</span>
            <span className="hidden motion-safe:inline">Reflecting...</span>
          </>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UserInput -- textarea + send button inside a form
// ---------------------------------------------------------------------------

interface UserInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

function UserInput({ onSend, disabled }: UserInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when it mounts or becomes enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setText("");
    },
    [text, disabled, onSend],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText("");
      }
    },
    [text, disabled, onSend],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Your response"
        placeholder="Take your time..."
        rows={4}
        className="w-full resize-none rounded-[16px] border-2 border-card bg-surface px-5 py-4 text-base text-text-primary placeholder-text-secondary transition-colors focus:border-accent-warm focus:outline-none disabled:opacity-50"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || text.trim().length === 0}
          className="rounded-[16px] bg-accent-warm px-8 py-3 text-sm font-medium text-background transition-colors hover:bg-accent-warm/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ExchangeView -- single Q&A exchange with fade transition
// ---------------------------------------------------------------------------

interface ExchangeViewProps {
  question: string;
  previousAnswer: string | null;
  questionNumber: number;
}

function ExchangeView({
  question,
  previousAnswer,
  questionNumber,
}: ExchangeViewProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div
      key={questionNumber}
      className={`flex max-w-2xl flex-col items-center gap-8 px-4 text-center transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      }`}
    >
      {previousAnswer && (
        <p className="max-w-lg text-sm italic text-text-secondary">
          &ldquo;{previousAnswer}&rdquo;
        </p>
      )}
      <p className="text-xl font-light leading-relaxed text-text-primary md:text-2xl">
        {question}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TripSummaryDisplay -- holistic trip summary on completion (D-09)
// ---------------------------------------------------------------------------

interface TripSummaryDisplayProps {
  summary: string;
  journeyId: string;
  messages: Phase3ConversationMessage[];
}

function TripSummaryDisplay({
  summary,
  journeyId,
  messages,
}: TripSummaryDisplayProps) {
  const paragraphs = summary.split("\n\n").filter((p) => p.trim().length > 0);

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-accent-warm">
            Your Journey
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            A reflection across all three phases
          </p>
        </div>

        <div className="space-y-4">
          {paragraphs.map((paragraph, idx) => (
            <p
              key={idx}
              className="text-base leading-relaxed text-text-primary"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <CompletedConversation messages={messages} />

        <div className="flex justify-center pt-4">
          <Link
            to="/journey/$id"
            params={{ id: journeyId }}
            className="rounded-[16px] bg-accent-warm px-8 py-3 text-sm font-medium text-background transition-colors hover:bg-accent-warm/90"
          >
            Back to journey
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompletedConversation -- shows all Q&A pairs (expandable)
// ---------------------------------------------------------------------------

interface CompletedConversationProps {
  messages: Phase3ConversationMessage[];
}

function CompletedConversation({ messages }: CompletedConversationProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-text-secondary transition-colors hover:text-accent-warm"
        >
          View conversation
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-text-secondary transition-colors hover:text-accent-warm"
        >
          Hide conversation
        </button>
      </div>
      <div className="space-y-3 rounded-[20px] bg-surface p-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "text-text-primary"
                : "italic text-text-secondary"
            }`}
          >
            <span className="mr-2 text-xs uppercase tracking-wider text-text-secondary opacity-60">
              {msg.role === "assistant" ? "Q" : "A"}
            </span>
            {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase3NewPage -- main route component
// ---------------------------------------------------------------------------

function Phase3NewPage() {
  const { id } = Route.useParams();
  const [entryId, setEntryId] = useState<string | null>(null);

  // Fetch existing entries to find an incomplete one
  const { data: entries, isLoading: entriesLoading } = usePhase3Entries(id);
  const createEntry = useCreatePhase3Entry();
  const entryCreating = useRef(false);

  // Resolve or create a Phase3Entry on mount
  useEffect(() => {
    if (entriesLoading || entryId || entryCreating.current) return;

    const incomplete = entries?.find((e) => !e.completedAt);
    if (incomplete) {
      setEntryId(incomplete.id);
      return;
    }

    // No incomplete entry -- create one
    entryCreating.current = true;
    createEntry
      .mutateAsync({ journeyId: id, label: "Over Me Reflection" })
      .then((created) => {
        setEntryId(created.id);
      })
      .catch(() => {
        entryCreating.current = false;
      });
  }, [entriesLoading, entries, entryId, id, createEntry]);

  // Guard: while we wait for an entry
  if (!entryId) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8">
        <LoadingIndicator />
      </div>
    );
  }

  return <Phase3Conversation journeyId={id} entryId={entryId} />;
}

// ---------------------------------------------------------------------------
// Phase3Conversation -- handles the active conversation once entryId exists
// ---------------------------------------------------------------------------

interface Phase3ConversationProps {
  journeyId: string;
  entryId: string;
}

function Phase3Conversation({ journeyId, entryId }: Phase3ConversationProps) {
  const {
    messages,
    currentQuestion,
    isLoading,
    isComplete,
    tripSummary,
    error,
    sendMessage,
    isReady,
  } = usePhase3Conversation(journeyId, entryId);

  // Derive the latest assistant message (current question text)
  const latestAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  // Derive the previous user answer (to show above current question)
  const userMessages = messages.filter((m) => m.role === "user");
  const previousAnswer =
    userMessages.length > 0
      ? userMessages[userMessages.length - 1].content
      : null;

  // Detect summary-generation phase: user answered 10 questions but summary not yet available
  const userCount = userMessages.length;
  const generatingSummary = userCount >= MAX_QUESTIONS && !isComplete;

  // -- Waiting for phase data readiness --
  if (!isReady) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8">
        <LoadingIndicator label="Gathering your journey..." />
      </div>
    );
  }

  // -- Loading state (initial, no messages yet) --
  if (!isComplete && messages.length === 0 && isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8">
        <p className="mb-4 text-sm text-text-secondary">Preparing your reflection...</p>
        <LoadingIndicator />
      </div>
    );
  }

  // -- Error state (no messages loaded, API failed) --
  if (!isComplete && messages.length === 0 && error) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-semibold text-text-primary">Could not start reflection</p>
        <p className="mt-2 max-w-sm text-sm text-danger">{error}</p>
        <p className="mt-2 max-w-sm text-xs text-text-secondary">
          This usually means the AI service is unavailable. Check that your API key is configured and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-[16px] bg-accent-warm px-6 py-2 text-sm font-medium text-background"
        >
          Retry
        </button>
      </div>
    );
  }

  // -- Generating summary state --
  if (generatingSummary && isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8">
        <LoadingIndicator label="Composing your journey summary..." />
      </div>
    );
  }

  // -- Completed state with trip summary --
  if (isComplete && tripSummary) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8">
        <TripSummaryDisplay
          summary={tripSummary}
          journeyId={journeyId}
          messages={messages}
        />
      </div>
    );
  }

  // -- Active conversation --
  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col px-4 py-6 md:p-12">
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Over Me
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          A reflection after your journey
        </p>
      </div>

      {/* Progress bar */}
      <div className="mx-auto mb-8 w-full max-w-2xl">
        <ProgressBar current={currentQuestion} total={MAX_QUESTIONS} />
        <p className="mt-2 text-center text-xs text-text-secondary">
          {currentQuestion} of {MAX_QUESTIONS}
        </p>
      </div>

      {/* Main exchange area */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {isLoading ? (
          <LoadingIndicator />
        ) : latestAssistant ? (
          <ExchangeView
            question={latestAssistant.content}
            previousAnswer={previousAnswer}
            questionNumber={currentQuestion}
          />
        ) : null}
      </div>

      {/* Input area */}
      {!isLoading && !isComplete && (
        <div className="mt-8 flex justify-center">
          <UserInput onSend={sendMessage} disabled={isLoading} />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 text-center">
          <p className="text-sm text-danger">{error}</p>
          <p className="mt-1 text-xs text-text-secondary">
            You can try sending your response again.
          </p>
        </div>
      )}
    </div>
  );
}
