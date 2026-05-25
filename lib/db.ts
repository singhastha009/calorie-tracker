import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type {
  DailyStat,
  LogEntry,
  LogRange,
  PlanSlot,
  Settings,
  Totals,
} from "./types";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, "tracker.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      notes TEXT,
      logged_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_log_entries_logged_at
      ON log_entries(logged_at);

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      display_name TEXT DEFAULT '',
      goal_calories INTEGER DEFAULT 2000,
      goal_protein_g REAL DEFAULT 150,
      goal_carbs_g REAL DEFAULT 200,
      goal_fat_g REAL DEFAULT 65,
      profile_age INTEGER,
      profile_sex TEXT,
      profile_weight_kg REAL,
      profile_height_cm REAL,
      profile_activity TEXT,
      profile_goal TEXT,
      model TEXT DEFAULT 'claude-opus-4-5',
      updated_at TEXT
    );
    INSERT OR IGNORE INTO settings (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS diet_plan (
      day_of_week INTEGER NOT NULL,
      meal_slot TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (day_of_week, meal_slot)
    );
  `);

  return db;
}

// ---------- log entries ----------

export type NewEntry = Omit<LogEntry, "id" | "logged_at"> & {
  logged_at?: string;
};

export function insertEntry(entry: NewEntry): LogEntry {
  const conn = getDb();
  const loggedAt = entry.logged_at ?? new Date().toISOString();
  const stmt = conn.prepare(`
    INSERT INTO log_entries
      (name, calories, protein_g, carbs_g, fat_g, notes, logged_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    entry.name,
    Math.round(entry.calories),
    entry.protein_g,
    entry.carbs_g,
    entry.fat_g,
    entry.notes ?? "",
    loggedAt
  );
  return {
    id: Number(result.lastInsertRowid),
    name: entry.name,
    calories: Math.round(entry.calories),
    protein_g: entry.protein_g,
    carbs_g: entry.carbs_g,
    fat_g: entry.fat_g,
    notes: entry.notes ?? "",
    logged_at: loggedAt,
  };
}

export function deleteEntry(id: number): boolean {
  const conn = getDb();
  const result = conn.prepare("DELETE FROM log_entries WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllEntries(): number {
  const conn = getDb();
  return conn.prepare("DELETE FROM log_entries").run().changes;
}

export function getEntry(id: number): LogEntry | null {
  const conn = getDb();
  const row = conn
    .prepare("SELECT * FROM log_entries WHERE id = ?")
    .get(id) as LogEntry | undefined;
  return row ?? null;
}

function rangeStart(range: LogRange): string | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function listEntries(range: LogRange): LogEntry[] {
  const conn = getDb();
  const start = rangeStart(range);
  if (start) {
    return conn
      .prepare(
        `SELECT * FROM log_entries WHERE logged_at >= ? ORDER BY logged_at DESC`
      )
      .all(start) as LogEntry[];
  }
  return conn
    .prepare(`SELECT * FROM log_entries ORDER BY logged_at DESC`)
    .all() as LogEntry[];
}

export function totalsFor(range: LogRange): Totals {
  const entries = listEntries(range);
  return entries.reduce<Totals>(
    (acc, e) => {
      acc.calories += e.calories;
      acc.protein_g += e.protein_g;
      acc.carbs_g += e.carbs_g;
      acc.fat_g += e.fat_g;
      acc.count += 1;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, count: 0 }
  );
}

export function recentForAdvice(days: number): LogEntry[] {
  const conn = getDb();
  const d = new Date();
  d.setDate(d.getDate() - days);
  return conn
    .prepare(
      `SELECT * FROM log_entries WHERE logged_at >= ? ORDER BY logged_at ASC`
    )
    .all(d.toISOString()) as LogEntry[];
}

/**
 * Aggregated per-day calories/macros for the trailing N days,
 * always returning a row for every day (even days with zero entries).
 * Sorted oldest → newest. Days use the user's local timezone.
 */
export function dailyStats(days: number): DailyStat[] {
  const conn = getDb();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const rows = conn
    .prepare(
      `SELECT * FROM log_entries WHERE logged_at >= ? ORDER BY logged_at ASC`
    )
    .all(since.toISOString()) as LogEntry[];

  // group by local-day key
  const map = new Map<string, DailyStat>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = localDayKey(d);
    map.set(key, {
      day: key,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      count: 0,
    });
  }
  for (const r of rows) {
    const key = localDayKey(new Date(r.logged_at));
    const slot = map.get(key);
    if (!slot) continue;
    slot.calories += r.calories;
    slot.protein_g += r.protein_g;
    slot.carbs_g += r.carbs_g;
    slot.fat_g += r.fat_g;
    slot.count += 1;
  }
  return [...map.values()];
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Current logging streak — number of consecutive days, ending today,
 * with at least one entry. Returns 0 if there's no entry today.
 */
export function currentStreak(): number {
  const conn = getDb();
  const rows = conn
    .prepare(`SELECT logged_at FROM log_entries ORDER BY logged_at DESC`)
    .all() as { logged_at: string }[];
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => localDayKey(new Date(r.logged_at))));
  const today = new Date();
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(localDayKey(d))) streak += 1;
    else break;
  }
  return streak;
}

// ---------- settings ----------

export function getSettings(): Settings {
  const conn = getDb();
  const row = conn.prepare("SELECT * FROM settings WHERE id = 1").get() as
    | Settings
    | undefined;
  if (!row) {
    // shouldn't happen, INSERT OR IGNORE in bootstrap, but be safe
    return {
      display_name: "",
      goal_calories: 2000,
      goal_protein_g: 150,
      goal_carbs_g: 200,
      goal_fat_g: 65,
      profile_age: null,
      profile_sex: null,
      profile_weight_kg: null,
      profile_height_cm: null,
      profile_activity: null,
      profile_goal: null,
      model: "claude-opus-4-5",
      updated_at: null,
    };
  }
  return row;
}

const SETTABLE_KEYS = [
  "display_name",
  "goal_calories",
  "goal_protein_g",
  "goal_carbs_g",
  "goal_fat_g",
  "profile_age",
  "profile_sex",
  "profile_weight_kg",
  "profile_height_cm",
  "profile_activity",
  "profile_goal",
  "model",
] as const;

export function updateSettings(patch: Partial<Settings>): Settings {
  const conn = getDb();
  const keys = Object.keys(patch).filter((k) =>
    (SETTABLE_KEYS as readonly string[]).includes(k)
  );
  if (keys.length > 0) {
    const setSql = keys.map((k) => `${k} = @${k}`).join(", ");
    const params: Record<string, unknown> = { id: 1 };
    for (const k of keys) {
      params[k] = (patch as Record<string, unknown>)[k];
    }
    params.updated_at = new Date().toISOString();
    conn
      .prepare(
        `UPDATE settings SET ${setSql}, updated_at = @updated_at WHERE id = @id`
      )
      .run(params);
  }
  return getSettings();
}

// ---------- diet plan ----------

export function getPlan(): PlanSlot[] {
  const conn = getDb();
  const rows = conn.prepare("SELECT * FROM diet_plan").all() as PlanSlot[];
  const byKey = new Map(rows.map((r) => [`${r.day_of_week}-${r.meal_slot}`, r]));
  const slots: PlanSlot["meal_slot"][] = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
  ];
  const all: PlanSlot[] = [];
  for (let d = 0; d < 7; d++) {
    for (const s of slots) {
      const existing = byKey.get(`${d}-${s}`);
      all.push(
        existing ?? { day_of_week: d, meal_slot: s, description: "" }
      );
    }
  }
  return all;
}

export function upsertPlanSlot(slot: PlanSlot): void {
  const conn = getDb();
  conn
    .prepare(
      `INSERT INTO diet_plan (day_of_week, meal_slot, description)
       VALUES (?, ?, ?)
       ON CONFLICT(day_of_week, meal_slot) DO UPDATE SET description = excluded.description`
    )
    .run(slot.day_of_week, slot.meal_slot, slot.description);
}
