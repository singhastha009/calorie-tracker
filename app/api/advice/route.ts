import { NextRequest } from "next/server";
import { DEFAULT_MODEL, getAnthropic } from "@/lib/anthropic";
import { getSettings, recentForAdvice } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const ADVICE_SYSTEM = `You are a thoughtful, evidence-based nutrition coach. You speak to the user warmly and directly, never preachy. You ground every observation in the actual meals they logged — quote dish names. Avoid generic platitudes. Prefer concrete, low-friction suggestions ("try swapping X for Y") over abstract goals ("eat healthier"). Keep the whole response under ~250 words, with 3–5 short bulleted observations or suggestions.`;

function summarizeLog(entries: ReturnType<typeof recentForAdvice>): string {
  if (entries.length === 0) return "No logged meals yet.";
  const byDay = new Map<string, typeof entries>();
  for (const e of entries) {
    const day = e.logged_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }
  const lines: string[] = [];
  for (const [day, items] of byDay) {
    const totalCal = items.reduce((s, x) => s + x.calories, 0);
    const totalP = items.reduce((s, x) => s + x.protein_g, 0);
    const totalC = items.reduce((s, x) => s + x.carbs_g, 0);
    const totalF = items.reduce((s, x) => s + x.fat_g, 0);
    lines.push(
      `## ${day}  —  ${totalCal} kcal | P ${totalP.toFixed(0)}g · C ${totalC.toFixed(0)}g · F ${totalF.toFixed(0)}g`
    );
    for (const it of items) {
      const t = it.logged_at.slice(11, 16);
      lines.push(
        `- ${t} · ${it.name} — ${it.calories} kcal (P ${it.protein_g.toFixed(0)} / C ${it.carbs_g.toFixed(0)} / F ${it.fat_g.toFixed(0)})`
      );
    }
  }
  return lines.join("\n");
}

export async function POST(_req: NextRequest) {
  const entries = recentForAdvice(14);
  const settings = getSettings();
  const model = settings.model || DEFAULT_MODEL;

  const goalLine =
    `My daily targets are: ${settings.goal_calories} kcal, ` +
    `${settings.goal_protein_g}g protein, ${settings.goal_carbs_g}g carbs, ${settings.goal_fat_g}g fat.`;

  const userPrompt = `${goalLine}

Here is my food log from the past 14 days. Give me 3–5 specific, kind, actionable observations. Reference my actual meals by name. Note when I'm consistently over or under my targets.

${summarizeLog(entries)}`;

  const anthropic = getAnthropic();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sdkStream = anthropic.messages.stream({
          model,
          max_tokens: 800,
          system: ADVICE_SYSTEM,
          messages: [{ role: "user", content: userPrompt }],
        });

        sdkStream.on("text", (textDelta: string) => {
          controller.enqueue(encoder.encode(textDelta));
        });

        await sdkStream.finalMessage();
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[error] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
