interface VASSliderProps {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  id: string;
}

export function VASSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  minLabel,
  maxLabel,
  id,
}: VASSliderProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-text-primary text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {minLabel && (
          <span className="text-xs text-text-secondary shrink-0">{minLabel}</span>
        )}
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-card accent-accent-warm"
        />
        {maxLabel && (
          <span className="text-xs text-text-secondary shrink-0">{maxLabel}</span>
        )}
        <span className="min-w-[2.5rem] text-right text-sm font-medium text-accent-warm">
          {value ?? min}
        </span>
      </div>
    </div>
  );
}
