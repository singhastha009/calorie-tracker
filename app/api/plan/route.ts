import { NextRequest, NextResponse } from "next/server";
import { getPlan, upsertPlanSlot } from "@/lib/db";
import type { MealSlot } from "@/lib/types";

export const runtime = "nodejs";

const VALID_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export async function GET() {
  return NextResponse.json({ slots: getPlan() });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const day = Number(body.day_of_week);
    const slot = body.meal_slot as MealSlot;
    const description = String(body.description ?? "");
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return NextResponse.json(
        { error: "day_of_week must be 0–6" },
        { status: 400 }
      );
    }
    if (!VALID_SLOTS.includes(slot)) {
      return NextResponse.json(
        { error: `meal_slot must be one of ${VALID_SLOTS.join(", ")}` },
        { status: 400 }
      );
    }
    upsertPlanSlot({ day_of_week: day, meal_slot: slot, description });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
