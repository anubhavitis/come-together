interface RatingSliderProps {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  id: string;
}

export function RatingSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  id,
}: RatingSliderProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <fieldset className="space-y-2">
      <legend className="text-text-primary text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((num) => (
          <button
            key={num}
            type="button"
            role="radio"
            aria-checked={value === num}
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
        ))}
      </div>
    </fieldset>
  );
}
