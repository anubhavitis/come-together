interface EdiGaugeProps {
  score: number;
}

const HIGH_DISSOLUTION_THRESHOLD = 70;

export function EdiGauge({ score }: EdiGaugeProps) {
  const isHigh = score >= HIGH_DISSOLUTION_THRESHOLD;
  const barColor = isHigh ? "bg-success" : "bg-accent-warm";
  const glowClass = isHigh ? "shadow-[0_0_12px_rgba(52,211,153,0.3)]" : "";

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-text-primary">
        Ego Dissolution
      </p>
      <div className={`relative h-8 rounded-[16px] bg-card ${glowClass}`}>
        <div
          className={`h-full rounded-[16px] ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-text-primary">
          {Math.round(score)}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-text-secondary">0 — 100</p>
    </div>
  );
}
