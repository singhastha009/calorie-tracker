"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DAY_NAMES, MEAL_SLOTS, type MealSlot, type PlanSlot } from "@/lib/types";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const SLOT_EMOJI: Record<MealSlot, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
};

function key(d: number, s: MealSlot) {
  return `${d}-${s}`;
}

export default function PlanGrid() {
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [savedRecently, setSavedRecently] = useState<Set<string>>(new Set());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Load
  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((data: { slots: PlanSlot[] }) => {
        const map: Record<string, string> = {};
        for (const s of data.slots) {
          map[key(s.day_of_week, s.meal_slot)] = s.description;
        }
        setSlots(map);
      })
      .catch(console.error);
  }, []);

  const queueSave = useCallback(
    (day: number, slot: MealSlot, value: string) => {
      const k = key(day, slot);
      const timers = debounceTimers.current;
      if (timers.has(k)) clearTimeout(timers.get(k)!);
      timers.set(
        k,
        setTimeout(async () => {
          setSaving((prev) => new Set(prev).add(k));
          try {
            await fetch("/api/plan", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                day_of_week: day,
                meal_slot: slot,
                description: value,
              }),
            });
            setSavedRecently((prev) => new Set(prev).add(k));
            setTimeout(() => {
              setSavedRecently((prev) => {
                const next = new Set(prev);
                next.delete(k);
                return next;
              });
            }, 1500);
          } finally {
            setSaving((prev) => {
              const next = new Set(prev);
              next.delete(k);
              return next;
            });
          }
        }, 700)
      );
    },
    []
  );

  const update = (day: number, slot: MealSlot, value: string) => {
    const k = key(day, slot);
    setSlots((prev) => ({ ...prev, [k]: value }));
    queueSave(day, slot, value);
  };

  async function copyYesterday(day: number) {
    if (day === 0) return; // no day before Monday in this view
    const prev = day - 1;
    for (const slot of MEAL_SLOTS) {
      const value = slots[key(prev, slot)] ?? "";
      const k = key(day, slot);
      setSlots((p) => ({ ...p, [k]: value }));
      await fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: day,
          meal_slot: slot,
          description: value,
        }),
      });
    }
  }

  return (
    <div className="space-y-4">
      {DAY_NAMES.map((dayName, d) => (
        <details
          key={d}
          open={d === todayDow()}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group"
        >
          <summary className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-slate-50 list-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{dayName}</span>
              {d === todayDow() && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-accentSoft text-accent">
                  Today
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {d > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    copyYesterday(d);
                  }}
                  className="text-xs text-slate-500 hover:text-accent font-medium"
                >
                  Copy {DAY_NAMES[d - 1]}
                </button>
              )}
              <span className="text-slate-400 group-open:rotate-180 transition">
                ▾
              </span>
            </div>
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-slate-100">
            {MEAL_SLOTS.map((slot) => {
              const k = key(d, slot);
              return (
                <label key={k} className="block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                      <span>{SLOT_EMOJI[slot]}</span>
                      {SLOT_LABEL[slot]}
                    </span>
                    {saving.has(k) && (
                      <span className="text-[10px] text-slate-400">saving…</span>
                    )}
                    {!saving.has(k) && savedRecently.has(k) && (
                      <span className="text-[10px] text-green-600">saved</span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="—"
                    value={slots[k] ?? ""}
                    onChange={(e) => update(d, slot, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y"
                  />
                </label>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}

// 0 = Monday … 6 = Sunday
function todayDow(): number {
  const js = new Date().getDay(); // 0 = Sun
  return (js + 6) % 7;
}
