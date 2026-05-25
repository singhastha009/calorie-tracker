import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MODEL, getAnthropic } from "@/lib/anthropic";
import { getSettings } from "@/lib/db";
import type { GoalSuggestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const TOOL = {
  name: "set_goals",
  description:
    "Set the user's daily calorie and macro targets based on their profile.",
  input_schema: {
    type: "object" as const,
    properties: {
      calories: {
        type: "integer",
        description: "Recommended daily kcal intake.",
      },
      protein_g: { type: "number", description: "Recommended grams of protein per day." },
      carbs_g: { type: "number", description: "Recommended grams of carbs per day." },
      fat_g: { type: "number", description: "Recommended grams of fat per day." },
      rationale: {
        type: "string",
        description:
          "2-3 short sentences explaining the math and reasoning, addressed to the user.",
      },
    },
    required: ["calories", "protein_g", "carbs_g", "fat_g", "rationale"],
  },
};

const SYSTEM = `You are a registered-dietitian-style nutrition coach. Given a user's profile, calculate daily calorie and macro targets.

Method:
- Estimate BMR using Mifflin-St Jeor.
- Apply activity multiplier: sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very_active 1.9.
- Adjust for goal: lose = TDEE - 15%, maintain = TDEE, gain = TDEE + 15%.
- Protein target: 1.6-2.2 g/kg of bodyweight (pick higher end for lose/gain, mid for maintain).
- Fat target: 25-30% of calories (9 kcal/g).
- Carbs = remaining calories / 4.

Be conservative and round to sensible numbers (e.g. 2150 kcal, 165g protein). Always call the set_goals tool — never reply in prose.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { age, sex, weight_kg, height_cm, activity, goal } = body;
    if (
      !age ||
      !sex ||
      !weight_kg ||
      !height_cm ||
      !activity ||
      !goal
    ) {
      return NextResponse.json(
        { error: "All profile fields are required." },
        { status: 400 }
      );
    }

    const settings = getSettings();
    const model = settings.model || DEFAULT_MODEL;
    const anthropic = getAnthropic();

    const userMsg = `Profile:
- Age: ${age}
- Sex: ${sex}
- Weight: ${weight_kg} kg
- Height: ${height_cm} cm
- Activity level: ${activity}
- Goal: ${goal}

Calculate daily targets.`;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 600,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "set_goals" },
      messages: [{ role: "user", content: userMsg }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Model did not return a tool_use block." },
        { status: 502 }
      );
    }
    const suggestion = toolUse.input as GoalSuggestion;
    return NextResponse.json(suggestion);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/suggest-goals failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
