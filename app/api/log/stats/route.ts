import { NextRequest, NextResponse } from "next/server";
import { currentStreak, dailyStats } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(365, Math.max(1, Number(daysParam) || 14));
  return NextResponse.json({
    days,
    stats: dailyStats(days),
    streak: currentStreak(),
  });
}
