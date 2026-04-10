import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  whyText?: string;
  progress?: { answered: number; total: number };
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  description,
  whyText,
  progress,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div className="rounded-lg border-2 border-card bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{title}</span>
            {progress && (
              <span className="rounded-full bg-card px-2 py-0.5 text-xs text-text-secondary">
                {progress.answered}/{progress.total}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
          )}
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 space-y-4">
            {whyText && (
              <div>
                <button
                  type="button"
                  onClick={() => setWhyOpen((v) => !v)}
                  className="text-xs text-accent-cool hover:underline"
                >
                  {whyOpen ? "Hide" : "Why this question?"}
                </button>
                {whyOpen && (
                  <p className="mt-1 text-xs text-text-secondary">{whyText}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
