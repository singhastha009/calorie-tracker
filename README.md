# Snap & Track

Mobile-friendly calorie & macro tracker. Take a photo of your meal, Claude estimates calories + protein/carbs/fat, you confirm and log it. Tap **Get advice** for personalized observations based on your recent meals.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and paste your Anthropic API key
npm run dev
```

Open <http://localhost:3000> on desktop, or visit your machine's LAN IP from your phone (same Wi-Fi) for the mobile experience with camera capture.

## How it works

- **`/api/analyze`** — sends the image to Claude with a forced tool-use schema (`log_nutrition`), so the response is always structured JSON.
- **`/api/log`** — CRUD over a local SQLite file at `data/tracker.db`.
- **`/api/advice`** — pulls the last 14 days from SQLite, streams Claude's response token-by-token.

Single user, no auth. Images are sent to Claude and discarded — only the parsed nutrition is stored.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · better-sqlite3 · `@anthropic-ai/sdk`.
