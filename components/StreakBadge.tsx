"use client";

export default function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
        Start your streak today
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-100">
      <span aria-hidden>🔥</span>
      <span>
        {streak}-day streak
      </span>
    </div>
  );
}
