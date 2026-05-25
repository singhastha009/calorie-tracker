"use client";

import { useEffect, useRef, useState } from "react";

export default function AdviceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    setText("");
    setErr(null);
    setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch("/api/advice", {
          method: "POST",
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setText((t) => t + decoder.decode(value, { stream: true }));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setErr(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-lg">Personalized advice</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {err ? (
            <p className="text-red-600 text-sm">{err}</p>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-800 leading-relaxed">
              {text}
              {loading && (
                <span className="inline-block w-2 h-4 bg-slate-400 ml-1 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
