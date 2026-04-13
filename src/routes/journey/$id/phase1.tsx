import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useConversation } from "@/hooks/use-conversation";
import type { ConversationMessage } from "@/types/journey";

export const Route = createFileRoute("/journey/$id/phase1")({
  component: Phase1Page,
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

function LoadingIndicator() {
  return (
    <div aria-live="polite" className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 motion-safe:animate-pulse">
        <span className="inline-block h-2 w-2 rounded-full bg-accent-warm opacity-60 motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]" />
        <span className="inline-block h-2 w-2 rounded-full bg-accent-warm opacity-60 motion-safe:animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
        <span className="inline-block h-2 w-2 rounded-full bg-accent-warm opacity-60 motion-safe:animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
      </div>
      <p className="text-sm text-text-secondary">
        <span className="motion-safe:hidden">Thinking...</span>
        <span className="hidden motion-safe:inline">Reflecting...</span>
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
// IntentionDisplay -- prominent intention sentence on completion
// ---------------------------------------------------------------------------

interface IntentionDisplayProps {
  intention: string;
  journeyId: string;
}

function IntentionDisplay({ intention, journeyId }: IntentionDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-8 px-4 text-center">
      <p className="text-sm uppercase tracking-widest text-text-secondary">
        Your intention
      </p>
      <p className="max-w-xl text-3xl font-light italic leading-relaxed text-accent-warm md:text-4xl">
        {intention}
      </p>
      <p className="max-w-sm text-xs text-text-secondary">
        This sentence was distilled from your conversation. Carry it with you.
      </p>
      <Link
        to="/journey/$id"
        params={{ id: journeyId }}
        className="mt-4 rounded-[16px] bg-accent-warm px-8 py-3 text-sm font-medium text-background transition-colors hover:bg-accent-warm/90"
      >
        Back to journey
      </Link>
    </div>
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

function ExchangeView({ question, previousAnswer, questionNumber }: ExchangeViewProps) {
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
// CompletedConversation -- shows all Q&A pairs (expandable)
// ---------------------------------------------------------------------------

interface CompletedConversationProps {
  messages: ConversationMessage[];
}

function CompletedConversation({ messages }: CompletedConversationProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-xs text-text-secondary transition-colors hover:text-accent-warm"
      >
        View conversation
      </button>
    );
  }

  return (
    <div className="mt-8 w-full max-w-2xl space-y-4">
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="text-xs text-text-secondary transition-colors hover:text-accent-warm"
      >
        Hide conversation
      </button>
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
// Phase1Page -- main route component
// ---------------------------------------------------------------------------

function Phase1Page() {
  const { id } = Route.useParams();
  const {
    messages,
    currentQuestion,
    isLoading,
    isComplete,
    intentionSentence,
    error,
    sendMessage,
  } = useConversation(id);

  // Derive the latest assistant message (current question text)
  const latestAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  // Derive the previous user answer (to show above current question)
  const userMessages = messages.filter((m) => m.role === "user");
  const previousAnswer =
    userMessages.length > 0 ? userMessages[userMessages.length - 1].content : null;

  // -- Loading state (initial — waiting for first AI question) --
  if (!isComplete && messages.length === 0 && isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8">
        <p className="mb-4 text-sm text-text-secondary">Preparing your conversation...</p>
        <LoadingIndicator />
      </div>
    );
  }

  // -- Error state (no messages loaded, API failed) --
  if (!isComplete && messages.length === 0 && error) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-semibold text-text-primary">Could not start conversation</p>
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

  // -- Completed state --
  if (isComplete && intentionSentence) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center p-8">
        <IntentionDisplay intention={intentionSentence} journeyId={id} />
        <CompletedConversation messages={messages} />
      </div>
    );
  }

  // -- Active conversation --
  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col px-4 py-6 md:p-12">
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Come Together
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          A conversation before your journey
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
