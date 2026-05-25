"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/types";

type Status = "idle" | "saving" | "error";

export default function ManualEntry({
  onLogged,
}: {
  onLogged: (entry: LogEntry) => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length > 0 &&
    calories.trim() !== "" &&
    !Number.isNaN(Number(calories));

  async function submit() {
    if (!valid) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          calories: Number(calories) || 0,
          protein_g: Number(protein) || 0,
          carbs_g: Number(carbs) || 0,
          fat_g: Number(fat) || 0,
          notes: "manually entered",
        }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || `Save failed (${res.status})`);
      }
      const entry: LogEntry = await res.json();
      onLogged(entry);
      // Reset
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs uppercase text-slate-500">Meal</label>
        <input
          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-base"
          placeholder="e.g. Greek yogurt with honey"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Calories" value={calories} onChange={setCalories} required />
        <NumField label="Protein (g)" value={protein} onChange={setProtein} />
        <NumField label="Carbs (g)" value={carbs} onChange={setCarbs} />
        <NumField label="Fat (g)" value={fat} onChange={setFat} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!valid || status === "saving"}
        onClick={submit}
        className="w-full py-3 rounded-xl bg-accent text-white font-semibold disabled:bg-slate-200 disabled:text-slate-400 transition"
      >
        {status === "saving" ? "Saving…" : "Log it"}
      </button>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type="number"
        inputMode="decimal"
        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-base tabular-nums"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </label>
  );
}
