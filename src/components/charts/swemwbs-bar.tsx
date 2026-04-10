import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface SwemwbsBarProps {
  before: number;
  after: number | null;
}

const MEANINGFUL_CHANGE_THRESHOLD = 3;

export function SwemwbsBar({ before, after }: SwemwbsBarProps) {
  const reducedMotion = useReducedMotion();

  const data = [
    { label: "Before", value: before },
    ...(after !== null ? [{ label: "After", value: after }] : []),
  ];

  const delta = after !== null ? after - before : 0;
  const isMeaningful = after !== null && delta >= MEANINGFUL_CHANGE_THRESHOLD;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 13 }}
          />
          <YAxis
            domain={[7, 35]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <ReferenceLine y={before} stroke="#334155" strokeDasharray="4 4" />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            isAnimationActive={!reducedMotion}
          >
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.label === "Before" ? "#818cf8" : "#f59e0b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {isMeaningful && (
        <p className="mt-2 text-center text-sm font-medium text-success">
          Meaningful Change (+{delta} points)
        </p>
      )}
    </div>
  );
}
