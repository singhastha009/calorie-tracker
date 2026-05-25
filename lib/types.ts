export type AnalysisResult = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
};

export type LogEntry = AnalysisResult & {
  id: number;
  logged_at: string; // ISO 8601
};

export type LogRange = "today" | "week" | "all";

export type Totals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  count: number;
};

export type Sex = "female" | "male" | "other";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalDirection = "lose" | "maintain" | "gain";

export type Settings = {
  display_name: string;
  goal_calories: number;
  goal_protein_g: number;
  goal_carbs_g: number;
  goal_fat_g: number;
  profile_age: number | null;
  profile_sex: Sex | null;
  profile_weight_kg: number | null;
  profile_height_cm: number | null;
  profile_activity: ActivityLevel | null;
  profile_goal: GoalDirection | null;
  model: string;
  updated_at: string | null;
};

export type GoalSuggestion = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  rationale: string;
};

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_SLOTS: MealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];
// 0 = Monday, 6 = Sunday
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type PlanSlot = {
  day_of_week: number;
  meal_slot: MealSlot;
  description: string;
};

export const AVAILABLE_MODELS = [
  { id: "claude-opus-4-5", label: "Opus 4.5 — most accurate, slower, pricier" },
  { id: "claude-sonnet-4-5", label: "Sonnet 4.5 — balanced (recommended)" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — fastest, cheapest" },
];

export type DailyStat = {
  day: string; // 'YYYY-MM-DD'
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  count: number;
};
