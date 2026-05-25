"use client";

import type { LogEntry } from "@/lib/types";

function groupByDay(entries: LogEntry[]): Array<[string, LogEntry[]]> {
  const map = new Map<string, LogEntry[]>();
  for (const e of entries) {
    const day = e.logged_at.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(e);
  }
  return [...map.entries()];
}

function prettyDay(iso: string): string {
  const today = new Date();
  const d = new Date(iso + "T00:00:00");
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function LogList({
  entries,
  onDelete,
  onRepeat,
}: {
  entries: LogEntry[];
  onDelete: (id: number) => void;
  onRepeat?: (entry: LogEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-100">
        <p>No meals logged yet.</p>
        <p className="text-sm mt-1">Snap or type your first meal above.</p>
      </div>
    );
  }

  const groups = groupByDay(entries);

  return (
    <div className="space-y-5">
      {groups.map(([day, items]) => {
        const dayCal = items.reduce((s, x) => s + x.calories, 0);
        return (
          <div key={day}>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <h3 className="text-sm font-semibold text-slate-700">
                {prettyDay(day)}
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {dayCal.toLocaleString()} kcal
              </span>
            </div>
            <ul className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
              {items.map((e) => (
                <li key={e.id} className="p-3 flex items-start gap-2 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium truncate">{e.name}</p>
                      <span className="text-sm tabular-nums shrink-0">
                        {e.calories} kcal
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 tabular-nums">
                      P {e.protein_g.toFixed(0)} · C {e.carbs_g.toFixed(0)} · F{" "}
                      {e.fat_g.toFixed(0)} ·{" "}
                      {new Date(e.logged_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {onRepeat && (
                      <button
                        type="button"
                        onClick={() => onRepeat(e)}
                        className="text-slate-400 hover:text-accent text-base px-2 py-1 rounded"
                        title="Log again now"
                        aria-label="Re-log this meal"
                      >
                        ↻
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(e.id)}
                      className="text-slate-400 hover:text-red-500 text-sm px-2 py-1 rounded"
                      aria-label="Delete entry"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
