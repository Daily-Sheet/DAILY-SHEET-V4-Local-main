import { storage } from "../storage";
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_BY_KEY } from "@shared/achievements";
import { emitDomainEvent } from "../ws/eventBus";
import { db } from "../db";
import {
  eventAssignments, events, eventDayVenues, venues, dailyCheckins,
  projectAssignments, mapPins, afterJobReports, workspaceMembers,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

type AchievementEvent =
  | "assignment:created"
  | "checkin:created"
  | "checkout:completed"
  | "schedule:completed"
  | "pin:created"
  | "report:submitted"
  | "vendor:rated"
  | "job:applied"
  | "job:approved"
  | "job:posted"
  | "wrapped:viewed";

/** Map event types to which metric keys they might affect */
const EVENT_METRIC_MAP: Record<AchievementEvent, string[]> = {
  "assignment:created": ["shows_worked", "cities_visited", "venues_worked", "unique_roles", "projects_worked", "weekend_shows", "holiday_shows", "friday_13th_shows", "new_years_shows", "max_same_venue"],
  "checkin:created": ["checkins", "early_checkins", "longest_streak"],
  "checkout:completed": ["hours_logged"],
  "schedule:completed": ["after_midnight_completions"],
  "pin:created": ["map_pins_created"],
  "report:submitted": ["reports_submitted"],
  "vendor:rated": ["vendor_reviews"],
  "job:applied": ["jobs_applied"],
  "job:approved": ["jobs_booked"],
  "job:posted": ["jobs_posted"],
  "wrapped:viewed": ["wrapped_viewed"],
};

/**
 * Check and potentially unlock achievements for a user after an event.
 * This is the main entry point called from route handlers.
 */
export async function checkAchievements(
  userId: string,
  event: AchievementEvent,
  context?: { workspaceId?: number; actorName?: string; [key: string]: any },
): Promise<string[]> {
  const affectedMetrics = EVENT_METRIC_MAP[event];
  if (!affectedMetrics?.length) return [];

  // For simple counter metrics, just increment directly
  if (event === "pin:created") {
    await incrementMetric(userId, "map_pins_created");
  } else if (event === "report:submitted") {
    await incrementMetric(userId, "reports_submitted");
  } else if (event === "vendor:rated") {
    await incrementMetric(userId, "vendor_reviews");
  } else if (event === "job:applied") {
    await incrementMetric(userId, "jobs_applied");
  } else if (event === "job:approved") {
    await incrementMetric(userId, "jobs_booked");
  } else if (event === "job:posted") {
    await incrementMetric(userId, "jobs_posted");
  } else if (event === "wrapped:viewed") {
    await incrementMetric(userId, "wrapped_viewed");
  } else if (event === "checkin:created") {
    await incrementMetric(userId, "checkins");
    if (context?.hour !== undefined && context.hour < 6) {
      await incrementMetric(userId, "early_checkins");
    }
  } else if (event === "checkout:completed") {
    if (context?.hoursWorked) {
      await addToMetric(userId, "hours_logged", Math.round(context.hoursWorked));
    }
  } else if (event === "schedule:completed") {
    if (context?.completedHour !== undefined && (context.completedHour >= 0 && context.completedHour < 6)) {
      await incrementMetric(userId, "after_midnight_completions");
    }
  } else if (event === "assignment:created") {
    // Complex metrics that need recalculation
    await recalculateAssignmentMetrics(userId);
  }

  // Check all achievements for the affected metrics
  return await checkThresholds(userId, affectedMetrics, context);
}

/**
 * Full recalculation of all progress metrics for a user.
 * Called on login (debounced) or manual trigger.
 */
export async function recalculateAllProgress(userId: string): Promise<string[]> {
  await recalculateAssignmentMetrics(userId);
  await recalculateCheckinMetrics(userId);
  await recalculateWorkspaceMetrics(userId);
  await recalculateMapPinMetrics(userId);
  await recalculateReportMetrics(userId);

  // Check ALL achievements
  const allMetrics = Array.from(new Set(ACHIEVEMENT_CATALOG.map(a => a.metricKey)));
  return await checkThresholds(userId, allMetrics);
}

// ── Metric helpers ──

async function incrementMetric(userId: string, metricKey: string): Promise<void> {
  const progress = await storage.getAchievementProgress(userId);
  const current = progress.find(p => p.metricKey === metricKey);
  await storage.upsertAchievementProgress(userId, metricKey, (current?.value ?? 0) + 1);
}

async function addToMetric(userId: string, metricKey: string, amount: number): Promise<void> {
  const progress = await storage.getAchievementProgress(userId);
  const current = progress.find(p => p.metricKey === metricKey);
  await storage.upsertAchievementProgress(userId, metricKey, (current?.value ?? 0) + amount);
}

// ── Threshold checking ──

async function checkThresholds(
  userId: string,
  metricKeys: string[],
  context?: { workspaceId?: number; actorName?: string; [key: string]: any },
): Promise<string[]> {
  const progress = await storage.getAchievementProgress(userId);
  const progressMap = new Map(progress.map(p => [p.metricKey, p.value]));
  const unlocked: string[] = [];

  for (const achievement of ACHIEVEMENT_CATALOG) {
    if (!metricKeys.includes(achievement.metricKey)) continue;
    const currentValue = progressMap.get(achievement.metricKey) ?? 0;
    if (currentValue < achievement.threshold) continue;

    const result = await storage.unlockAchievement(userId, achievement.key);
    if (result) {
      unlocked.push(achievement.key);

      // Send notification
      if (context?.workspaceId) {
        try {
          await storage.createNotification({
            userId,
            type: "achievement_unlocked",
            title: `Achievement Unlocked: ${achievement.name}`,
            message: achievement.description,
            eventName: null,
            read: false,
            workspaceId: context.workspaceId,
          });
        } catch { /* non-critical */ }
      }

      // Emit WebSocket event for real-time toast
      if (context?.workspaceId) {
        emitDomainEvent({
          type: "achievement:unlocked",
          workspaceId: context.workspaceId,
          actorId: userId,
          actorName: context.actorName || "System",
          payload: {
            achievementKey: achievement.key,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            targetUserId: userId,
          },
        });
      }
    }
  }

  return unlocked;
}

// ── Complex metric recalculation ──

async function recalculateAssignmentMetrics(userId: string): Promise<void> {
  // Get all event assignments across all workspaces
  const assignments = await db.select().from(eventAssignments)
    .where(eq(eventAssignments.userId, userId));

  // Shows worked = unique event names
  const uniqueEventNameSet = new Set(assignments.map(a => a.eventName));
  const uniqueEventNames = Array.from(uniqueEventNameSet);
  await storage.upsertAchievementProgress(userId, "shows_worked", uniqueEventNames.length);

  // Unique roles/positions
  const uniquePositionSet = new Set(assignments.filter(a => a.position).map(a => a.position!));
  await storage.upsertAchievementProgress(userId, "unique_roles", uniquePositionSet.size);

  // Get all project assignments for projects count
  const projAssignments = await db.select().from(projectAssignments)
    .where(eq(projectAssignments.userId, userId));
  const uniqueProjectSet = new Set(projAssignments.map(a => a.projectId));
  await storage.upsertAchievementProgress(userId, "projects_worked", uniqueProjectSet.size);

  // City and venue metrics - need to join through events -> eventDayVenues -> venues
  try {
    const allEvents = await db.select().from(events);
    const eventMap = new Map(allEvents.map(e => [e.name, e]));
    const allEdvs = await db.select().from(eventDayVenues);
    const allVenues = await db.select().from(venues);
    const venueMap = new Map(allVenues.map(v => [v.id, v]));

    const cities = new Set<string>();
    const venueIds = new Set<number>();
    const venueCounts = new Map<number, number>();
    let weekendShows = 0;
    let holidayShows = 0;
    let newYearsShows = 0;
    let friday13thShows = 0;

    for (const eventName of uniqueEventNames) {
      const event = eventMap.get(eventName);
      if (!event) continue;

      // Get venue IDs for this event
      const edvs = allEdvs.filter(edv => edv.eventId === event.id);
      for (const edv of edvs) {
        venueIds.add(edv.venueId);
        venueCounts.set(edv.venueId, (venueCounts.get(edv.venueId) ?? 0) + 1);
        const venue = venueMap.get(edv.venueId);
        if (venue?.address) {
          const city = extractCity(venue.address);
          if (city) cities.add(city.toLowerCase());
        }

        // Date-based achievements
        if (edv.date) {
          const d = new Date(edv.date + "T12:00:00");
          const dayOfWeek = d.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) weekendShows++;

          // New Year's Eve
          const month = d.getMonth();
          const day = d.getDate();
          if (month === 11 && day === 31) newYearsShows++;
          // Friday the 13th
          if (dayOfWeek === 5 && day === 13) friday13thShows++;
          // Major holidays (US): July 4, Thanksgiving (4th Thu Nov), Christmas, NYE
          if ((month === 6 && day === 4) || (month === 11 && day === 25) || (month === 11 && day === 31)) {
            holidayShows++;
          }
        }
      }

      // Fallback: if no EDVs, use event's venueId
      if (edvs.length === 0 && event.venueId) {
        venueIds.add(event.venueId);
        venueCounts.set(event.venueId, (venueCounts.get(event.venueId) ?? 0) + 1);
        const venue = venueMap.get(event.venueId);
        if (venue?.address) {
          const city = extractCity(venue.address);
          if (city) cities.add(city.toLowerCase());
        }
      }
    }

    await storage.upsertAchievementProgress(userId, "cities_visited", cities.size, { cities: Array.from(cities) });
    await storage.upsertAchievementProgress(userId, "venues_worked", venueIds.size);
    await storage.upsertAchievementProgress(userId, "weekend_shows", weekendShows);
    await storage.upsertAchievementProgress(userId, "holiday_shows", holidayShows);
    await storage.upsertAchievementProgress(userId, "new_years_shows", newYearsShows);
    await storage.upsertAchievementProgress(userId, "friday_13th_shows", friday13thShows);

    const maxSameVenue = Math.max(0, ...Array.from(venueCounts.values()));
    await storage.upsertAchievementProgress(userId, "max_same_venue", maxSameVenue);
  } catch (err) {
    console.error("[achievements] Error recalculating venue/city metrics:", err);
  }
}

async function recalculateCheckinMetrics(userId: string): Promise<void> {
  const checkins = await db.select().from(dailyCheckins)
    .where(eq(dailyCheckins.userId, userId));

  await storage.upsertAchievementProgress(userId, "checkins", checkins.length);

  // Early bird: check-ins before 6 AM
  let earlyCount = 0;
  for (const c of checkins) {
    if (c.checkedInAt) {
      const hour = new Date(c.checkedInAt).getHours();
      if (hour < 6) earlyCount++;
    }
  }
  await storage.upsertAchievementProgress(userId, "early_checkins", earlyCount);

  // Hours logged from check-ins
  let totalHours = 0;
  for (const c of checkins) {
    if (c.checkedInAt && c.checkedOutAt) {
      const inTime = new Date(c.checkedInAt).getTime();
      const outTime = new Date(c.checkedOutAt).getTime();
      let lunchMs = 0;
      if (c.lunchOutAt && c.lunchInAt) {
        lunchMs = new Date(c.lunchInAt).getTime() - new Date(c.lunchOutAt).getTime();
      }
      totalHours += (outTime - inTime - lunchMs) / (1000 * 60 * 60);
    }
  }
  await storage.upsertAchievementProgress(userId, "hours_logged", Math.round(totalHours));

  // Longest streak: consecutive dates with check-ins
  const dateSet = new Set(checkins.map(c => c.date));
  const dates = Array.from(dateSet).sort();
  let maxStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T12:00:00");
    const curr = new Date(dates[i] + "T12:00:00");
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);
  if (dates.length === 0) maxStreak = 0;
  await storage.upsertAchievementProgress(userId, "longest_streak", maxStreak);
}

async function recalculateWorkspaceMetrics(userId: string): Promise<void> {
  const memberships = await db.select().from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId));
  await storage.upsertAchievementProgress(userId, "workspaces_joined", memberships.length);
}

async function recalculateMapPinMetrics(userId: string): Promise<void> {
  const pins = await db.select().from(mapPins)
    .where(eq(mapPins.userId, userId));
  await storage.upsertAchievementProgress(userId, "map_pins_created", pins.length);
}

async function recalculateReportMetrics(userId: string): Promise<void> {
  const reports = await db.select().from(afterJobReports)
    .where(eq(afterJobReports.submittedBy, userId));
  await storage.upsertAchievementProgress(userId, "reports_submitted", reports.length);
}

// ── Helpers ──

function extractCity(address: string): string | null {
  // Try to extract city from address like "123 Main St, Nashville, TN 37201"
  const parts = address.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    // City is typically the second-to-last part (before state/zip)
    return parts[parts.length - 2] || null;
  }
  return null;
}

/** Debounce map: userId -> last recalculation timestamp */
const recalcDebounce = new Map<string, number>();
const RECALC_DEBOUNCE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Debounced full recalculation. Safe to call frequently (e.g., on every login).
 * Only runs if the last recalculation was more than 1 hour ago.
 */
export async function maybeRecalculate(userId: string): Promise<void> {
  const last = recalcDebounce.get(userId) ?? 0;
  if (Date.now() - last < RECALC_DEBOUNCE_MS) return;
  recalcDebounce.set(userId, Date.now());
  try {
    await recalculateAllProgress(userId);
  } catch (err) {
    console.error("[achievements] Recalculation error for user", userId, err);
  }
}
