export const DEPARTMENTS = ["AUDIO", "LIGHTING", "VIDEO", "PRODUCTION", "BACKLINE", "DRIVER", "WAREHOUSE"] as const;
export type Department = typeof DEPARTMENTS[number];

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
