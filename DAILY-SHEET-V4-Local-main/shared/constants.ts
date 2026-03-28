export const DEPARTMENTS = ["AUDIO", "LIGHTING", "VIDEO", "PRODUCTION", "BACKLINE", "DRIVER", "WAREHOUSE"] as const;
export type Department = typeof DEPARTMENTS[number];

/** Day types for quick-add on project pages */
export const DAY_TYPES = [
  { value: "show", label: "Show" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "load-in", label: "Load In" },
  { value: "day-off", label: "Day Off" },
  { value: "travel", label: "Travel" },
] as const;
export type DayType = typeof DAY_TYPES[number]["value"];

/** Centralized event type color scheme (Tailwind classes) */
export const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; activeBg: string; activeText: string; activeBorder: string }> = {
  show:      { bg: "bg-green-500/15", text: "text-green-700 dark:text-green-400", border: "border-green-500/30", dot: "bg-green-500", activeBg: "bg-green-500", activeText: "text-white", activeBorder: "border-green-600" },
  rehearsal: { bg: "bg-purple-500/15", text: "text-purple-700 dark:text-purple-400", border: "border-purple-500/30", dot: "bg-purple-500", activeBg: "bg-purple-500", activeText: "text-white", activeBorder: "border-purple-600" },
  "load-in": { bg: "bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500", activeBg: "bg-orange-500", activeText: "text-white", activeBorder: "border-orange-600" },
  "day-off": { bg: "bg-zinc-500/15", text: "text-zinc-600 dark:text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-500", activeBg: "bg-zinc-500", activeText: "text-white", activeBorder: "border-zinc-600" },
  travel:    { bg: "bg-sky-500/15", text: "text-sky-700 dark:text-sky-400", border: "border-sky-500/30", dot: "bg-sky-500", activeBg: "bg-sky-500", activeText: "text-white", activeBorder: "border-sky-600" },
};

export const CONTACT_ROLES = ["Band", "Crew", "Client", "Venue", "Management", "Audio", "Lighting", "Video", "Backline", "Catering", "Security", "Production", "FOH", "Monitor", "Stagehand", "Rigging", "Transport"] as const;
export type ContactRole = typeof CONTACT_ROLES[number];

export const DEFAULT_CREW_POSITIONS = [
  "FOH",
  "MONS",
  "A1",
  "A2",
  "LD",
  "SPOT",
  "V1",
  "V2",
  "PATCH",
  "STAGE",
  "BACKLINE",
  "TM",
  "PM",
  "SM",
  "TD",
  "RIGGER",
  "CARP",
  "WARDROBE",
  "PROPS",
  "SFX",
] as const;

export const DEFAULT_TASK_TYPES = [
  "Show",
  "Sound Check",
  "Load In",
  "Load Out",
  "Meal",
  "Coffee Break",
  "Travel",
  "Press",
  "Paper Tech",
  "Client Walkthrough",
  "Equipment Dropoff",
  "Equipment Pickup",
  "Rehearsal",
  "Tech Rehearsal",
  "Doors Open",
  "VIP Reception",
  "Meet & Greet",
  "Changeover",
  "Curfew",
  "Strike",
] as const;
