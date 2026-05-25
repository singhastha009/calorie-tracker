"use client";

import type { Settings, Totals } from "@/lib/types";

function Bar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min(100, (value / Math.max(1, goal)) * 100);
  const over = value > goal;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums text-slate-500">
          <span className={over ? "text-red-600 font-medium" : "text-slate-800"}>
            {value.toFixed(0)}
          </span>
          {" / "}
          {goal.toFixed(0)} g
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: over ? "#dc2626" : color }}
        />
      </div>
    </div>
  );
}

export default function TodaySummary({
  totals,
  settings,
}: {
  totals: Totals;
  settings: Settings;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Meals" value={totals.count.toString()} />
        <Stat
          label="kcal left"
          value={Math.max(0, settings.goal_calories - totals.calories).toLocaleString()}
        />
        <Stat
          label="of"
          value={settings.goal_calories.toLocaleString()}
        />
      </div>
      <div className="space-y-3">
        <Bar
          label="Protein"
          value={totals.protein_g}
          goal={settings.goal_protein_g}
          color="#16a34a"
        />
        <Bar
          label="Carbs"
          value={totals.carbs_g}
          goal={settings.goal_carbs_g}
          color="#f59e0b"
        />
        <Bar
          label="Fat"
          value={totals.fat_g}
          goal={settings.goal_fat_g}
          color="#ea580c"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}
