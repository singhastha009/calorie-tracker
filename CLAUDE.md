# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server on :3000 with hot reload
npm run build    # production build (also runs full type check + lint)
npm start        # serve the production build
npm run lint     # next lint only
```

There is no test suite. Verification happens through `npm run build` (catches type and bundler errors) and manually hitting routes via the dev server.

`ANTHROPIC_API_KEY` must be set in `.env` before any Claude-backed route works. The dev server reads `.env` only at startup — restart after editing.

## Architecture

Single-user calorie tracker. Next.js 14 (App Router) + TypeScript + Tailwind + SQLite, with Claude as the vision/advice engine. No auth.

### Server / client boundary (important, easy to break)

`lib/anthropic.ts` imports the `@anthropic-ai/sdk`, which transitively pulls `node:fs` / `node:path`. **Never import it from a client component** — webpack will fail to bundle with `UnhandledSchemeError`. Pattern:

- `lib/types.ts` — pure types and constants (e.g. `AVAILABLE_MODELS`). Safe to import anywhere.
- `lib/anthropic.ts` — server-only. Used by route handlers under `app/api/`.
- `lib/db.ts` — server-only (better-sqlite3 native module). Also gated by `next.config.js → serverComponentsExternalPackages`.

If you add a UI control that needs a server-side constant, put the constant in `lib/types.ts` and let both sides import it.

### Structured outputs from Claude

The analyze and suggest-goals endpoints don't parse free text. They define a JSON-Schema-shaped tool, then force its use:

```ts
tools: [TOOL],
tool_choice: { type: "tool", name: "log_nutrition" },
```

Then read `response.content.find(c => c.type === "tool_use").input` directly. When changing the shape of structured output (calories, macros, goal suggestion), update the `input_schema` *and* the matching type in `lib/types.ts` — they're not auto-synced.

### Streaming responses

`/api/advice` returns a `ReadableStream` driven by `anthropic.messages.stream(...)`. The client reads with `response.body.getReader()` (see `components/AdviceModal.tsx`). Use the same pattern if adding any other token-streamed endpoint — don't switch to SSE or chunked-JSON.

### Model selection

Every Claude-calling route reads the active model from `getSettings().model` on each request, falling back to `DEFAULT_MODEL` in `lib/anthropic.ts`. The user can change the model live from `/settings` and the next request uses it — no restart needed. When adding a new route that calls Claude, follow this same pattern; don't hardcode the model.

### SQLite

`lib/db.ts` opens `data/tracker.db` lazily on first call and runs all `CREATE TABLE IF NOT EXISTS` statements in one `db.exec(...)` block — this is the migration story. Add new tables / columns there; the bootstrap is idempotent. The connection is a module-level singleton.

Schema:
- `log_entries` — every meal logged
- `settings` — single row enforced by `CHECK (id = 1)`, `INSERT OR IGNORE` on bootstrap
- `diet_plan` — sparse table of 0–28 rows keyed by `(day_of_week, meal_slot)`; `getPlan()` fills missing slots with empty strings before returning

### Food photo flow

1. Client (`CameraCapture.tsx`) resizes the image to max 1024px / JPEG 0.85 via canvas **before** upload — keeps requests under Anthropic's vision limits.
2. POST to `/api/analyze` as multipart, base64-encoded into the Claude request server-side.
3. Response is **not** persisted. The UI shows an editable card; only when the user taps "Log it" does the client POST to `/api/log`.
4. Image bytes are discarded after analysis. The DB stores parsed nutrition only.

If you change the upload format or storage policy, update both the client resize and the `multipart/form-data` handling in `app/api/analyze/route.ts`.

### Navigation

`components/AppShell.tsx` wraps every page (mounted in `app/layout.tsx`). Mobile gets a fixed bottom tab bar; desktop ≥ md gets a sticky side rail. To add a page, add a route under `app/<name>/page.tsx` and add an entry to the `NAV` array in `AppShell.tsx`.

## Conventions

- Tailwind only, no CSS modules. Theme colors `accent` / `accentSoft` / `ink` / `bg` are defined in `tailwind.config.ts` — use them rather than raw hex when possible.
- Charts and icons are **inline SVG**. No chart library, no icon library — keep it that way unless a feature genuinely justifies the bundle cost.
- Mobile-first; the `safe-pt` / `safe-pb` utilities in `globals.css` handle iOS safe areas. Pages reserve `pb-24` for the mobile bottom nav.
- The `data/` directory (SQLite file + WAL) and `.env` are gitignored. `data/tracker.db` is the source of truth for everything user-generated.

## Known compatibility note

`better-sqlite3` must be ≥ 12.x on Node 24+ (older versions fail node-gyp build with v8 deprecation errors). If you bump Node and the install breaks, bumping `better-sqlite3` is the fix.
