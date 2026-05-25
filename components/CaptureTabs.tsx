"use client";

import { useState } from "react";
import CameraCapture from "./CameraCapture";
import ManualEntry from "./ManualEntry";
import type { LogEntry } from "@/lib/types";

type Tab = "photo" | "manual";

export default function CaptureTabs({
  onLogged,
}: {
  onLogged: (entry: LogEntry) => void;
}) {
  const [tab, setTab] = useState<Tab>("photo");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex border-b border-slate-100">
        <TabButton active={tab === "photo"} onClick={() => setTab("photo")}>
          📸 Photo
        </TabButton>
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
          ✏️ Type it
        </TabButton>
      </div>
      <div className="p-5">
        {tab === "photo" ? (
          <CameraCapture onLogged={onLogged} />
        ) : (
          <ManualEntry onLogged={onLogged} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 py-3 text-sm font-semibold transition border-b-2 " +
        (active
          ? "border-accent text-accent bg-accentSoft"
          : "border-transparent text-slate-500 hover:text-slate-800")
      }
    >
      {children}
    </button>
  );
}
