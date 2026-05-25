"use client";

import { useState } from "react";
import type { DailyStat } from "@/lib/types";

type Props = {
  stats: DailyStat[];
  goal: number;
};

export default function HistoryChart({ stats, goal }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(goal, ...stats.map((s) => s.calories), 1) * 1.1;
  const width = 100; // viewBox %
  const height = 100;
  const padLeft = 10;
  const padBottom = 14;
  const padTop = 4;
  const padRight = 2;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const barW = (innerW / stats.length) * 0.7;
  const gap = (innerW / stats.length) * 0.3;

  if (stats.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12 text-sm">
        No data yet.
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-48 md:h-64"
      >
        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = padTop + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={0.15}
              strokeDasharray="0.5 0.8"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* goal line */}
        {goal > 0 && goal <= max && (
          <line
            x1={padLeft}
            y1={padTop + innerH * (1 - goal / max)}
            x2={width - padRight}
            y2={padTop + innerH * (1 - goal / max)}
            stroke="#16a34a"
            strokeWidth={0.4}
            strokeDasharray="1 1"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* bars */}
        {stats.map((s, i) => {
          const h = innerH * (s.calories / max);
          const x = padLeft + i * (barW + gap) + gap / 2;
          const y = padTop + innerH - h;
          const isHover = hovered === i;
          const over = s.calories > goal && goal > 0;
          return (
            <g key={s.day}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0.3, h)}
                rx={0.5}
                fill={
                  isHover ? "#9a3412" : over ? "#dc2626" : "#ea580c"
                }
                style={{ transition: "fill 0.15s" }}
              />
              {/* full-height invisible hit target for easier hover */}
              <rect
                x={padLeft + i * (barW + gap)}
                y={padTop}
                width={barW + gap}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}

        {/* x axis labels (sparse) */}
        {stats.map((s, i) => {
          const showLabel =
            stats.length <= 8 ||
            i === 0 ||
            i === stats.length - 1 ||
            i === Math.floor(stats.length / 2);
          if (!showLabel) return null;
          const x = padLeft + i * (barW + gap) + gap / 2 + barW / 2;
          return (
            <text
              key={s.day}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize="3"
              fill="#64748b"
            >
              {formatDay(s.day)}
            </text>
          );
        })}
      </svg>

      <div className="flex justify-between items-center text-xs text-slate-500 mt-2 px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-green-600" /> goal {goal} kcal
        </span>
        {hovered !== null ? (
          <span className="text-slate-700 font-medium">
            {formatFullDay(stats[hovered].day)} · {stats[hovered].calories.toLocaleString()} kcal
          </span>
        ) : (
          <span>
            avg{" "}
            {Math.round(
              stats.reduce((s, x) => s + x.calories, 0) /
                Math.max(1, stats.filter((x) => x.count > 0).length)
            ).toLocaleString()}{" "}
            kcal on logged days
          </span>
        )}
      </div>
    </div>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
}

function formatFullDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
