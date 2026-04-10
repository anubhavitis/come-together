interface LikertScaleProps {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  id: string;
}

export function LikertScale({
  label,
  value,
  onChange,
  min = 0,
  max = 5,
  minLabel,
  maxLabel,
  id,
}: LikertScaleProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <fieldset className="space-y-2">
      <legend className="text-text-primary text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {options.map((num) => (
          <div key={num} className="flex flex-col items-center">
            <button
              type="button"
              role="radio"
              aria-checked={value === num}
              aria-label={`${num}`}
              id={`${id}-${num}`}
              onClick={() => onChange(num)}
              className={`min-h-[44px] min-w-[44px] rounded-lg border-2 text-sm font-medium transition-colors ${
                value === num
                  ? "border-accent-warm bg-accent-warm/20 text-accent-warm"
                  : "border-card bg-surface text-text-secondary hover:border-text-secondary"
              }`}
            >
              {num}
            </button>
            {num === min && minLabel && (
              <span className="mt-1 text-xs text-text-secondary">{minLabel}</span>
            )}
            {num === max && maxLabel && (
              <span className="mt-1 text-xs text-text-secondary">{maxLabel}</span>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
}
