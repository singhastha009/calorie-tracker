"use client";

import { useEffect, useState } from "react";
import {
  AVAILABLE_MODELS,
  type ActivityLevel,
  type GoalDirection,
  type GoalSuggestion,
  type Settings,
  type Sex,
} from "@/lib/types";

const ACTIVITY_OPTIONS: { v: ActivityLevel; l: string }[] = [
  { v: "sedentary", l: "Sedentary (desk job, no exercise)" },
  { v: "light", l: "Lightly active (1–3 days/wk)" },
  { v: "moderate", l: "Moderately active (3–5 days/wk)" },
  { v: "active", l: "Very active (6–7 days/wk)" },
  { v: "very_active", l: "Athlete (2x/day or physical job)" },
];

const GOAL_OPTIONS: { v: GoalDirection; l: string }[] = [
  { v: "lose", l: "Lose weight" },
  { v: "maintain", l: "Maintain" },
  { v: "gain", l: "Gain weight / muscle" },
];

const SEX_OPTIONS: { v: Sex; l: string }[] = [
  { v: "female", l: "Female" },
  { v: "male", l: "Male" },
  { v: "other", l: "Other" },
];

export default function SettingsForm() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<GoalSuggestion | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setS)
      .catch(console.error);
  }, []);

  if (!s) {
    return <div className="text-slate-500">Loading…</div>;
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveAll() {
    if (!s) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const updated = (await res.json()) as Settings;
      setS(updated);
      setSavedMsg("Saved ✓");
      setTimeout(() => setSavedMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  const profileComplete =
    !!s.profile_age &&
    !!s.profile_sex &&
    !!s.profile_weight_kg &&
    !!s.profile_height_cm &&
    !!s.profile_activity &&
    !!s.profile_goal;

  async function calculateGoals() {
    if (!s || !profileComplete) return;
    setSuggesting(true);
    setSuggestError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/suggest-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: s.profile_age,
          sex: s.profile_sex,
          weight_kg: s.profile_weight_kg,
          height_cm: s.profile_height_cm,
          activity: s.profile_activity,
          goal: s.profile_goal,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Suggestion failed");
      }
      const sug = (await res.json()) as GoalSuggestion;
      setSuggestion(sug);
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSuggesting(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    update("goal_calories", suggestion.calories);
    update("goal_protein_g", suggestion.protein_g);
    update("goal_carbs_g", suggestion.carbs_g);
    update("goal_fat_g", suggestion.fat_g);
    setSuggestion(null);
  }

  async function deleteAll() {
    await fetch("/api/log?all=true", { method: "DELETE" });
    setConfirmDelete(false);
    setSavedMsg("All logs deleted");
    setTimeout(() => setSavedMsg(null), 2500);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card title="Profile" subtitle="Used only for goal calculation.">
        <div>
          <Label>Display name</Label>
          <input
            className="input"
            value={s.display_name ?? ""}
            onChange={(e) => update("display_name", e.target.value)}
            placeholder="What should we call you?"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Age"
            value={s.profile_age}
            onChange={(v) => update("profile_age", v)}
          />
          <div>
            <Label>Sex</Label>
            <select
              className="input"
              value={s.profile_sex ?? ""}
              onChange={(e) => update("profile_sex", (e.target.value || null) as Sex | null)}
            >
              <option value="">—</option>
              {SEX_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </div>
          <NumField
            label="Weight (kg)"
            value={s.profile_weight_kg}
            onChange={(v) => update("profile_weight_kg", v)}
            step="0.1"
          />
          <NumField
            label="Height (cm)"
            value={s.profile_height_cm}
            onChange={(v) => update("profile_height_cm", v)}
            step="0.1"
          />
        </div>

        <div>
          <Label>Activity level</Label>
          <select
            className="input"
            value={s.profile_activity ?? ""}
            onChange={(e) =>
              update(
                "profile_activity",
                (e.target.value || null) as ActivityLevel | null
              )
            }
          >
            <option value="">—</option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Goal</Label>
          <div className="flex gap-2 flex-wrap">
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => update("profile_goal", o.v)}
                className={
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition " +
                  (s.profile_goal === o.v
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-slate-700 border-slate-200")
                }
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Calculate with Claude */}
      <Card
        title="Calculate goals with Claude"
        subtitle="Uses Mifflin-St Jeor + activity multipliers."
      >
        <button
          type="button"
          onClick={calculateGoals}
          disabled={!profileComplete || suggesting}
          className="px-4 py-2.5 rounded-xl bg-accent text-white font-semibold disabled:bg-slate-200 disabled:text-slate-400 transition w-full sm:w-auto"
        >
          {suggesting ? "Asking Claude…" : "✨ Calculate"}
        </button>
        {!profileComplete && (
          <p className="text-xs text-slate-500">
            Fill in your profile above to enable this.
          </p>
        )}
        {suggestError && (
          <p className="text-sm text-red-600">{suggestError}</p>
        )}
        {suggestion && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 space-y-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Pill label="kcal" value={suggestion.calories.toLocaleString()} />
              <Pill label="P (g)" value={suggestion.protein_g.toString()} />
              <Pill label="C (g)" value={suggestion.carbs_g.toString()} />
              <Pill label="F (g)" value={suggestion.fat_g.toString()} />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {suggestion.rationale}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySuggestion}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white font-semibold"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setSuggestion(null)}
                className="px-4 py-2.5 rounded-lg bg-white text-slate-600 border border-slate-200 font-medium"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Goals (editable) */}
      <Card title="Daily targets" subtitle="Fine-tune anytime.">
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Calories"
            value={s.goal_calories}
            onChange={(v) => update("goal_calories", v ?? 0)}
          />
          <NumField
            label="Protein (g)"
            value={s.goal_protein_g}
            onChange={(v) => update("goal_protein_g", v ?? 0)}
          />
          <NumField
            label="Carbs (g)"
            value={s.goal_carbs_g}
            onChange={(v) => update("goal_carbs_g", v ?? 0)}
          />
          <NumField
            label="Fat (g)"
            value={s.goal_fat_g}
            onChange={(v) => update("goal_fat_g", v ?? 0)}
          />
        </div>
      </Card>

      {/* Model */}
      <Card title="Claude model" subtitle="Applies to photo analysis and advice.">
        <select
          className="input"
          value={s.model}
          onChange={(e) => update("model", e.target.value)}
        >
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-20 md:bottom-4 z-10">
        <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-md rounded-xl p-3">
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-ink text-white font-semibold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save all changes"}
          </button>
          {savedMsg && (
            <span className="text-sm text-green-600 font-medium">
              {savedMsg}
            </span>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <Card
        title="Danger zone"
        subtitle="Irreversible. Diet plan and settings are preserved."
        danger
      >
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 rounded-lg bg-white text-red-600 border border-red-300 font-medium"
          >
            Delete all food logs
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={deleteAll}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold"
            >
              Yes, delete everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 rounded-lg bg-white text-slate-700 border border-slate-200 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </Card>

      <style jsx global>{`
        .input {
          width: 100%;
          margin-top: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
          background: white;
        }
        .input:focus {
          outline: none;
          border-color: #ea580c;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15);
        }
      `}</style>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  danger,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={
        "bg-white rounded-2xl p-5 shadow-sm border space-y-3 " +
        (danger ? "border-red-200" : "border-slate-100")
      }
    >
      <div>
        <h2
          className={
            "font-semibold " + (danger ? "text-red-700" : "text-slate-800")
          }
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs uppercase tracking-wide text-slate-500">
      {children}
    </span>
  );
}

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        className="input tabular-nums"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") onChange(null);
          else onChange(Number(raw));
        }}
      />
    </label>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}
