import { NextRequest, NextResponse } from "next/server";
import {
  deleteAllEntries,
  deleteEntry,
  insertEntry,
  listEntries,
  totalsFor,
} from "@/lib/db";
import type { LogRange } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("range") ?? "today";
  const range: LogRange =
    raw === "today" || raw === "week" || raw === "all" ? raw : "today";
  const entries = listEntries(range);
  const totals = totalsFor(range);
  return NextResponse.json({ entries, totals, range });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const required = [
      "name",
      "calories",
      "protein_g",
      "carbs_g",
      "fat_g",
    ] as const;
    for (const k of required) {
      if (body[k] === undefined || body[k] === null) {
        return NextResponse.json(
          { error: `Missing field: ${k}` },
          { status: 400 }
        );
      }
    }
    const entry = insertEntry({
      name: String(body.name),
      calories: Number(body.calories),
      protein_g: Number(body.protein_g),
      carbs_g: Number(body.carbs_g),
      fat_g: Number(body.fat_g),
      notes: body.notes ? String(body.notes) : "",
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");
  if (all === "true") {
    const removed = deleteAllEntries();
    return NextResponse.json({ ok: true, removed });
  }
  const idParam = req.nextUrl.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = deleteEntry(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
