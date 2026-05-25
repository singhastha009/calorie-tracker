"use client";

import { useRef, useState } from "react";
import type { AnalysisResult, LogEntry } from "@/lib/types";

async function resizeImage(file: File, maxEdge = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.85
    );
  });
}

type Status = "idle" | "analyzing" | "review" | "saving" | "error";

export default function CameraCapture({
  onLogged,
}: {
  onLogged: (entry: LogEntry) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setStatus("analyzing");
    try {
      const resized = await resizeImage(file);
      setPreview(URL.createObjectURL(resized));

      const form = new FormData();
      form.append("image", resized, "food.jpg");
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || `Analyze failed (${res.status})`);
      }
      const result: AnalysisResult = await res.json();
      setDraft(result);
      setStatus("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || `Save failed (${res.status})`);
      }
      const entry: LogEntry = await res.json();
      onLogged(entry);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setPreview(null);
    setDraft(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateDraft<K extends keyof AnalysisResult>(
    key: K,
    value: AnalysisResult[K]
  ) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden-file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-5 rounded-xl bg-accent text-white font-semibold text-lg active:scale-[0.99] transition"
        >
          📸 Snap food
        </button>
      )}

      {status === "analyzing" && (
        <div className="flex flex-col items-center gap-3 py-6">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 rounded-lg object-cover"
            />
          )}
          <p className="text-sm text-slate-600 animate-pulse">
            Claude is analyzing your meal…
          </p>
        </div>
      )}

      {status === "review" && draft && (
        <div className="space-y-4">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-56 object-cover rounded-lg"
            />
          )}
          <div>
            <label className="text-xs uppercase text-slate-500">Meal</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-base"
              value={draft.name}
              onChange={(e) => updateDraft("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Calories"
              value={draft.calories}
              onChange={(v) => updateDraft("calories", v)}
            />
            <NumField
              label="Protein (g)"
              value={draft.protein_g}
              onChange={(v) => updateDraft("protein_g", v)}
            />
            <NumField
              label="Carbs (g)"
              value={draft.carbs_g}
              onChange={(v) => updateDraft("carbs_g", v)}
            />
            <NumField
              label="Fat (g)"
              value={draft.fat_g}
              onChange={(v) => updateDraft("fat_g", v)}
            />
          </div>
          {draft.notes && (
            <p className="text-xs text-slate-500 italic">{draft.notes}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold"
            >
              Log it
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "saving" && (
        <p className="text-sm text-slate-600 text-center py-4">Saving…</p>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase text-slate-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-base tabular-nums"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
