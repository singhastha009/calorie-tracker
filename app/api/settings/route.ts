import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateSettings(body);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
