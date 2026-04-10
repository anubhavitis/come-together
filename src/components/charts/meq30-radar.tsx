import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Meq30Subscales } from "@/lib/scoring";

interface Meq30RadarProps {
  subscales: Meq30Subscales;
}

const THRESHOLD_VALUE = 3.0;

export function Meq30Radar({ subscales }: Meq30RadarProps) {
  const reducedMotion = useReducedMotion();

  const data = [
    { axis: "Mystical", value: subscales.mystical, threshold: THRESHOLD_VALUE },
    { axis: "Positive Mood", value: subscales.positiveMood, threshold: THRESHOLD_VALUE },
    { axis: "Transcendence", value: subscales.transcendence, threshold: THRESHOLD_VALUE },
    { axis: "Ineffability", value: subscales.ineffability, threshold: THRESHOLD_VALUE },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#94a3b8", fontSize: 13 }}
        />
        <Radar
          name="Threshold"
          dataKey="threshold"
          stroke="#64748b"
          strokeDasharray="6 4"
          fill="transparent"
          strokeWidth={1.5}
          isAnimationActive={!reducedMotion}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
          isAnimationActive={!reducedMotion}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
