import { db } from "./db";
import { scheduleTemplates } from "@shared/schema";
import { isNull } from "drizzle-orm";
import { log } from "./index";

interface TemplateItem {
  title: string;
  category: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  location?: string;
  offsetDays?: number;
}

const GLOBAL_TEMPLATES: { name: string; description: string; type: string; items: TemplateItem[] }[] = [
  {
    name: "Concert Day",
    description: "Standard single-artist concert production day",
    type: "day",
    items: [
      { title: "Crew Call / Load-In",    category: "production", startHour: 8,  startMinute: 0,  endHour: 12, endMinute: 0  },
      { title: "Stage Build Complete",    category: "production", startHour: 12, startMinute: 0,  endHour: 12, endMinute: 30 },
      { title: "Catering / Lunch",        category: "catering",   startHour: 12, startMinute: 0,  endHour: 13, endMinute: 0  },
      { title: "Sound Check",             category: "production", startHour: 14, startMinute: 0,  endHour: 16, endMinute: 0  },
      { title: "Artist Meet & Greet",     category: "show",       startHour: 16, startMinute: 30, endHour: 17, endMinute: 30 },
      { title: "Doors Open",              category: "show",       startHour: 18, startMinute: 0,  endHour: 18, endMinute: 30 },
      { title: "Opening Act",             category: "show",       startHour: 19, startMinute: 0,  endHour: 19, endMinute: 45 },
      { title: "Headliner",               category: "show",       startHour: 20, startMinute: 30, endHour: 22, endMinute: 30 },
      { title: "Load-Out",                category: "production", startHour: 22, startMinute: 30, endHour: 2,  endMinute: 0  },
    ],
  },
  {
    name: "Festival Stage Day",
    description: "Multi-act festival stage with gate and setup",
    type: "day",
    items: [
      { title: "Site Open / Crew Call",    category: "production", startHour: 7,  startMinute: 0,  endHour: 8,  endMinute: 0  },
      { title: "Stage & Tent Setup",       category: "production", startHour: 8,  startMinute: 0,  endHour: 11, endMinute: 0  },
      { title: "Vendor Load-In",           category: "production", startHour: 9,  startMinute: 0,  endHour: 11, endMinute: 0  },
      { title: "Sound & Lighting Check",   category: "production", startHour: 11, startMinute: 0,  endHour: 12, endMinute: 0  },
      { title: "Gates Open",               category: "show",       startHour: 12, startMinute: 0,  endHour: 12, endMinute: 30 },
      { title: "First Act",                category: "show",       startHour: 13, startMinute: 0,  endHour: 14, endMinute: 0  },
      { title: "Second Act",               category: "show",       startHour: 15, startMinute: 0,  endHour: 16, endMinute: 0  },
      { title: "Headliner",                category: "show",       startHour: 18, startMinute: 0,  endHour: 20, endMinute: 0  },
      { title: "Gates Close / Teardown",   category: "production", startHour: 20, startMinute: 30, endHour: 23, endMinute: 0  },
    ],
  },
  {
    name: "Corporate Event",
    description: "Corporate conference or private event day",
    type: "day",
    items: [
      { title: "Vendor & A/V Arrival",       category: "production", startHour: 7,  startMinute: 0,  endHour: 9,  endMinute: 0  },
      { title: "A/V & Stage Setup",          category: "production", startHour: 9,  startMinute: 0,  endHour: 11, endMinute: 0  },
      { title: "Registration / Guest Arrival", category: "show",     startHour: 11, startMinute: 0,  endHour: 12, endMinute: 0  },
      { title: "Welcome & Keynote",          category: "show",       startHour: 12, startMinute: 0,  endHour: 13, endMinute: 30 },
      { title: "Lunch Break",                category: "catering",   startHour: 13, startMinute: 30, endHour: 14, endMinute: 30 },
      { title: "Program / Breakouts",        category: "show",       startHour: 14, startMinute: 30, endHour: 17, endMinute: 0  },
      { title: "Cocktail Hour",              category: "show",       startHour: 17, startMinute: 0,  endHour: 18, endMinute: 0  },
      { title: "Dinner & Program",           category: "catering",   startHour: 18, startMinute: 0,  endHour: 21, endMinute: 0  },
      { title: "Breakdown",                  category: "production", startHour: 21, startMinute: 0,  endHour: 23, endMinute: 0  },
    ],
  },
  {
    name: "Theater Production",
    description: "Single-performance theater or stage show",
    type: "day",
    items: [
      { title: "Crew Call",              category: "production", startHour: 14, startMinute: 0,  endHour: 15, endMinute: 0  },
      { title: "Tech / Lighting Check",  category: "production", startHour: 15, startMinute: 0,  endHour: 17, endMinute: 0  },
      { title: "Actors Call / Warm-Up",  category: "show",       startHour: 18, startMinute: 30, endHour: 19, endMinute: 0  },
      { title: "House Open",             category: "show",       startHour: 19, startMinute: 0,  endHour: 19, endMinute: 30 },
      { title: "Curtain / Show Start",   category: "show",       startHour: 19, startMinute: 30, endHour: 21, endMinute: 30 },
      { title: "Intermission",           category: "show",       startHour: 20, startMinute: 30, endHour: 20, endMinute: 45 },
      { title: "Show End / Strike",      category: "production", startHour: 21, startMinute: 30, endHour: 23, endMinute: 0  },
    ],
  },
  {
    name: "Broadcast / Livestream",
    description: "Live broadcast or streaming production day",
    type: "day",
    items: [
      { title: "Crew Call / Equipment Setup",  category: "production", startHour: 8,  startMinute: 0,  endHour: 10, endMinute: 0  },
      { title: "Camera & Line Check",          category: "production", startHour: 10, startMinute: 0,  endHour: 11, endMinute: 30 },
      { title: "Talent Briefing / Rehearsal",  category: "show",       startHour: 11, startMinute: 30, endHour: 12, endMinute: 30 },
      { title: "Lunch",                        category: "catering",   startHour: 12, startMinute: 30, endHour: 13, endMinute: 30 },
      { title: "Pre-Show / Countdown",         category: "production", startHour: 13, startMinute: 30, endHour: 14, endMinute: 0  },
      { title: "Live / On Air",                category: "show",       startHour: 14, startMinute: 0,  endHour: 16, endMinute: 0  },
      { title: "Wrap / Breakdown",             category: "production", startHour: 16, startMinute: 0,  endHour: 18, endMinute: 0  },
    ],
  },
  {
    name: "Wedding Reception",
    description: "Wedding reception production timeline",
    type: "day",
    items: [
      { title: "Vendor Load-In / Setup",       category: "production", startHour: 13, startMinute: 0,  endHour: 16, endMinute: 0  },
      { title: "Sound Check & Lighting",       category: "production", startHour: 16, startMinute: 0,  endHour: 17, endMinute: 0  },
      { title: "Cocktail Hour",                category: "show",       startHour: 17, startMinute: 0,  endHour: 18, endMinute: 0  },
      { title: "Guest Seated / Introductions", category: "show",       startHour: 18, startMinute: 0,  endHour: 18, endMinute: 30 },
      { title: "Dinner Service",               category: "catering",   startHour: 18, startMinute: 30, endHour: 20, endMinute: 0  },
      { title: "First Dance / Toasts",         category: "show",       startHour: 20, startMinute: 0,  endHour: 20, endMinute: 30 },
      { title: "Dancing / Entertainment",      category: "show",       startHour: 20, startMinute: 30, endHour: 23, endMinute: 0  },
      { title: "Last Call / Close",            category: "show",       startHour: 23, startMinute: 0,  endHour: 23, endMinute: 30 },
      { title: "Vendor Breakdown",             category: "production", startHour: 23, startMinute: 30, endHour: 1,  endMinute: 0  },
    ],
  },
  {
    name: "Club Night",
    description: "Nightclub event with opener and main act",
    type: "day",
    items: [
      { title: "Load-In / Setup", category: "production", startHour: 19, startMinute: 0,  endHour: 21, endMinute: 0  },
      { title: "Sound Check",     category: "production", startHour: 21, startMinute: 0,  endHour: 21, endMinute: 30 },
      { title: "Doors Open",      category: "show",       startHour: 21, startMinute: 30, endHour: 22, endMinute: 0  },
      { title: "Opener Set",      category: "show",       startHour: 22, startMinute: 0,  endHour: 23, endMinute: 0  },
      { title: "Main Act",        category: "show",       startHour: 0,  startMinute: 0,  endHour: 2,  endMinute: 0  },
      { title: "After-Hours / Close", category: "show",  startHour: 2,  startMinute: 0,  endHour: 4,  endMinute: 0  },
    ],
  },
  {
    name: "Multi-Day Tour Show",
    description: "3-day tour: advance day, show day, strike day",
    type: "show",
    items: [
      // Day 0 — Advance
      { title: "Advance Crew Arrival",       category: "production", startHour: 10, startMinute: 0, endHour: 12, endMinute: 0, offsetDays: 0 },
      { title: "Venue Advance & Tech Survey", category: "production", startHour: 12, startMinute: 0, endHour: 17, endMinute: 0, offsetDays: 0 },
      // Day 1 — Show Day
      { title: "Crew Call / Load-In",        category: "production", startHour: 7,  startMinute: 0, endHour: 13, endMinute: 0, offsetDays: 1 },
      { title: "Production Meeting",          category: "production", startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, offsetDays: 1 },
      { title: "Sound Check",                 category: "production", startHour: 14, startMinute: 0, endHour: 17, endMinute: 0, offsetDays: 1 },
      { title: "Dinner Break",                category: "catering",   startHour: 17, startMinute: 0, endHour: 18, endMinute: 0, offsetDays: 1 },
      { title: "Doors Open",                  category: "show",       startHour: 18, startMinute: 0, endHour: 19, endMinute: 0, offsetDays: 1 },
      { title: "Show",                        category: "show",       startHour: 20, startMinute: 0, endHour: 22, endMinute: 30, offsetDays: 1 },
      // Day 2 — Strike
      { title: "Strike / Load-Out",           category: "production", startHour: 8,  startMinute: 0, endHour: 14, endMinute: 0, offsetDays: 2 },
      { title: "Venue Walk-Through / Clear",  category: "production", startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, offsetDays: 2 },
    ],
  },
];

export async function seedGlobalTemplates() {
  // Idempotent: only seed if no global templates exist yet
  const existing = await db.select().from(scheduleTemplates).where(isNull(scheduleTemplates.workspaceId));
  if (existing.length > 0) return;

  await db.insert(scheduleTemplates).values(
    GLOBAL_TEMPLATES.map(t => ({
      name: t.name,
      description: t.description,
      type: t.type,
      items: JSON.stringify(t.items),
      workspaceId: null,
    }))
  );

  log(`Seeded ${GLOBAL_TEMPLATES.length} global schedule templates`, "seed");
}
