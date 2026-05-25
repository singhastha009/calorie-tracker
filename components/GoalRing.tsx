"use client";

type Props = {
  value: number;
  goal: number;
  size?: number;
  stroke?: number;
  label?: string;
  unit?: string;
  color?: string;
};

export default function GoalRing({
  value,
  goal,
  size = 180,
  stroke = 14,
  label = "kcal",
  unit = "",
  color = "#ea580c",
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safeGoal = Math.max(1, goal);
  const pct = Math.min(1, value / safeGoal);
  const dash = c * pct;
  const remaining = Math.max(0, Math.round(goal - value));
  const over = value > goal;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "#dc2626" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          className="fill-ink"
          style={{ fontSize: size * 0.22, fontWeight: 700 }}
        >
          {Math.round(value).toLocaleString()}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: size * 0.08 }}
        >
          {`of ${goal.toLocaleString()} ${label}`}
        </text>
      </svg>
      <p
        className={
          "mt-1 text-sm " + (over ? "text-red-600" : "text-slate-500")
        }
      >
        {over
          ? `${(value - goal).toLocaleString()} ${unit || label} over`
          : `${remaining.toLocaleString()} ${unit || label} left`}
      </p>
    </div>
  );
}
