"use client";

import { useCallback, useEffect, useState } from "react";
import HistoryChart from "@/components/HistoryChart";
import LogList from "@/components/LogList";
import type { DailyStat, LogEntry, Settings, Totals } from "@/lib/types";

type Range = 7 | 30 | 365;

const DEFAULT_GOAL = 2000;

export default function HistoryPage() {
  const [range, setRange] = useState<Range>(7);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL);

  const refresh = useCallback(async () => {
    const [statsRes, logRes, settingsRes] = await Promise.all([
      fetch(`/api/log/stats?days=${range}`).then((r) => r.json()),
      fetch(
        range === 365
          ? "/api/log?range=all"
          : range === 7
            ? "/api/log?range=week"
            : "/api/log?range=all"
      ).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json() as Promise<Settings>),
    ]);
    setStats(statsRes.stats as DailyStat[]);
    setEntries((logRes.entries as LogEntry[]).slice(0, range === 7 ? 50 : 200));
    setTotals(logRes.totals as Totals);
    setGoal(settingsRes.goal_calories);
  }, [range]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  const handleDelete = async (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/log?id=${id}`, { method: "DELETE" });
    refresh().catch(console.error);
  };

  const handleRepeat = async (entry: LogEntry) => {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: entry.name,
        calories: entry.calories,
        protein_g: entry.protein_g,
        carbs_g: entry.carbs_g,
        fat_g: entry.fat_g,
        notes: "re-logged",
      }),
    });
    refresh().catch(console.error);
  };

  const loggedDays = stats.filter((s) => s.count > 0).length;
  const avgKcal =
    loggedDays > 0
      ? Math.round(stats.reduce((s, x) => s + x.calories, 0) / loggedDays)
      : 0;
  const goalDays = stats.filter(
    (s) => s.count > 0 && Math.abs(s.calories - goal) <= goal * 0.1
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:py-8 space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">History</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Your trends and full log.
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { v: 7, l: "7 days" },
          { v: 30, l: "30 days" },
          { v: 365, l: "1 year" },
        ].map(({ v, l }) => (
          <button
            key={v}
            type="button"
            onClick={() => setRange(v as Range)}
            className={
              "px-4 py-1.5 rounded-full text-sm font-medium border transition " +
              (range === v
                ? "bg-ink text-white border-ink"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
            }
          >
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <HistoryChart stats={stats} goal={goal} />
        <div className="grid grid-cols-3 gap-2 mt-5">
          <Stat label="logged days" value={loggedDays.toString()} />
          <Stat
            label="avg kcal / day"
            value={avgKcal > 0 ? avgKcal.toLocaleString() : "—"}
          />
          <Stat label="within 10% of goal" value={`${goalDays}`} />
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-slate-700 mb-2 px-1">All entries</h2>
        <LogList
          entries={entries}
          onDelete={handleDelete}
          onRepeat={handleRepeat}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}
