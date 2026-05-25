import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MODEL, getAnthropic } from "@/lib/anthropic";
import { getSettings } from "@/lib/db";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANALYZE_TOOL = {
  name: "log_nutrition",
  description:
    "Record the user's estimated nutrition for the food shown in the photo.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description:
          "Short human-friendly name of the meal, e.g. 'Grilled chicken salad with avocado'.",
      },
      calories: {
        type: "number",
        description: "Best-estimate total calories for the visible portion.",
      },
      protein_g: {
        type: "number",
        description: "Estimated grams of protein.",
      },
      carbs_g: { type: "number", description: "Estimated grams of carbs." },
      fat_g: { type: "number", description: "Estimated grams of fat." },
      notes: {
        type: "string",
        description:
          "1-2 sentences. Mention key ingredients you saw, portion-size assumptions, or 'no food detected' if applicable.",
      },
    },
    required: ["name", "calories", "protein_g", "carbs_g", "fat_g", "notes"],
  },
};

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. Look at the food in the photo and estimate calories and macros for the visible portion. Be realistic, not optimistic. If portion size is ambiguous, assume a typical single serving and mention that in notes. If the image contains no food, call the tool with zeros and notes='No food detected in image.'`;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'image' file in form data." },
        { status: 400 }
      );
    }

    const mediaType = file.type || "image/jpeg";
    if (!/^image\/(jpeg|png|webp|gif)$/.test(mediaType)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${mediaType}` },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = Buffer.from(bytes).toString("base64");

    const anthropic = getAnthropic();
    const model = getSettings().model || DEFAULT_MODEL;
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [ANALYZE_TOOL],
      tool_choice: { type: "tool", name: "log_nutrition" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/webp"
                  | "image/gif",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Please analyze the food in this photo and call the log_nutrition tool with your best estimate.",
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Model did not return a tool_use block." },
        { status: 502 }
      );
    }

    const result = toolUse.input as AnalysisResult;
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/analyze failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
