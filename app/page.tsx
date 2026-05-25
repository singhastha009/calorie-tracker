"use client";

import { useCallback, useEffect, useState } from "react";
import CaptureTabs from "@/components/CaptureTabs";
import TodaySummary from "@/components/TodaySummary";
import GoalRing from "@/components/GoalRing";
import StreakBadge from "@/components/StreakBadge";
import AdviceModal from "@/components/AdviceModal";
import LogList from "@/components/LogList";
import type { LogEntry, Settings, Totals } from "@/lib/types";

const EMPTY_TOTALS: Totals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  count: 0,
};

const DEFAULT_SETTINGS: Settings = {
  display_name: "",
  goal_calories: 2000,
  goal_protein_g: 150,
  goal_carbs_g: 200,
  goal_fat_g: 65,
  profile_age: null,
  profile_sex: null,
  profile_weight_kg: null,
  profile_height_cm: null,
  profile_activity: null,
  profile_goal: null,
  model: "claude-opus-4-5",
  updated_at: null,
};

function greeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${time}, ${name}` : time;
}

export default function Dashboard() {
  const [today, setToday] = useState<Totals>(EMPTY_TOTALS);
  const [recent, setRecent] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [streak, setStreak] = useState(0);
  const [adviceOpen, setAdviceOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [todayRes, settingsRes, statsRes] = await Promise.all([
      fetch("/api/log?range=today").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/log/stats?days=1").then((r) => r.json()),
    ]);
    setToday(todayRes.totals as Totals);
    setRecent((todayRes.entries as LogEntry[]).slice(0, 5));
    setSettings(settingsRes as Settings);
    setStreak(statsRes.streak as number);
  }, []);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  const handleLogged = (entry: LogEntry) => {
    setRecent((prev) => [entry, ...prev].slice(0, 5));
    refresh().catch(console.error);
  };

  const handleDelete = async (id: number) => {
    setRecent((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/log?id=${id}`, { method: "DELETE" });
    refresh().catch(console.error);
  };

  const today_date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting(settings.display_name)}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{today_date}</p>
          <div className="mt-3">
            <StreakBadge streak={streak} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAdviceOpen(true)}
          className="px-4 py-2 rounded-full bg-accent text-white font-semibold text-sm shadow-sm active:scale-95 transition flex items-center gap-1.5"
        >
          ✨ Get advice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
          <GoalRing
            value={today.calories}
            goal={settings.goal_calories}
            label="kcal"
          />
          <div className="w-full mt-6">
            <TodaySummary totals={today} settings={settings} />
          </div>
        </div>

        <div className="space-y-5">
          <CaptureTabs onLogged={handleLogged} />

          <div>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <h2 className="font-semibold text-slate-700">Today's meals</h2>
              <a
                href="/history"
                className="text-xs text-accent font-medium hover:underline"
              >
                View all →
              </a>
            </div>
            <LogList entries={recent} onDelete={handleDelete} />
          </div>
        </div>
      </div>

      <AdviceModal open={adviceOpen} onClose={() => setAdviceOpen(false)} />
    </div>
  );
}
