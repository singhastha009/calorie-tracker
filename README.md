# Snap & Track

Mobile-friendly calorie & macro tracker. Take a photo of your meal, Claude estimates calories + protein/carbs/fat, you confirm and log it. Tap **Get advice** for personalized observations based on your recent meals.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: paste your Anthropic API key and pick an APP_PASSWORD
npm run dev
```

Open <http://localhost:3000> on desktop, or visit your machine's LAN IP from your phone (same Wi-Fi) for the mobile experience with camera capture.

The app is protected by HTTP Basic Auth — the browser will prompt for a password on first visit. Leave the username field blank; only the password is checked, against the `APP_PASSWORD` env var.

## How it works

- **`/api/analyze`** — sends the image to Claude with a forced tool-use schema (`log_nutrition`), so the response is always structured JSON.
- **`/api/log`** — CRUD over a local SQLite file at `data/tracker.db`.
- **`/api/advice`** — pulls the last 14 days from SQLite, streams Claude's response token-by-token.

Single user, gated by HTTP Basic Auth (`middleware.ts`). Images are sent to Claude and discarded — only the parsed nutrition is stored.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · better-sqlite3 · `@anthropic-ai/sdk`.
