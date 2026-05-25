import Anthropic from "@anthropic-ai/sdk";

// Default if settings haven't been customized yet.
export const DEFAULT_MODEL = "claude-opus-4-5";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

