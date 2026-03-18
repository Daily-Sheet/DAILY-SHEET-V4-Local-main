import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { db } from "../db";
import { eventAssignments } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getWorkspaceRole } from "./utils";

export function registerCalendarRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/calendar/export.ics", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const eventNamesParam = req.query.events as string | undefined;
      const allWorkspaceEvents = await storage.getEvents(workspaceId);
      const allSchedules = await storage.getSchedules(workspaceId);
      const allVenuesList = await storage.getAllVenues();

      let filteredEvents = allWorkspaceEvents;
      if (eventNamesParam) {
        const selectedNames = new Set(eventNamesParam.split(",").map(s => s.trim()));
        filteredEvents = allWorkspaceEvents.filter(e => selectedNames.has(e.name));
      }

      const calRole = await getWorkspaceRole(user.id, workspaceId);
      if (!["owner", "manager", "admin"].includes(calRole)) {
        const assignments = await db.select().from(eventAssignments).where(
          and(eq(eventAssignments.userId, user.id), eq(eventAssignments.workspaceId, workspaceId))
        );
        const assignedNames = new Set(assignments.map(a => a.eventName));
        filteredEvents = filteredEvents.filter(e => assignedNames.has(e.name));
      }

      const venueMap = new Map(allVenuesList.map(v => [v.id, v]));

      const escapeICS = (text: string): string => {
        return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
      };

      const formatICSDate = (dateStr: string): string => {
        return dateStr.replace(/-/g, "");
      };

      const formatICSDateTime = (date: Date): string => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
      };

      const now = formatICSDateTime(new Date());
      const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//DailySheet//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:Daily Sheet`,
      ];

      for (const ev of filteredEvents) {
        if (!ev.startDate || !ev.endDate) continue;
        const venue = ev.venueId ? venueMap.get(ev.venueId) : null;

        const endDateObj = new Date(ev.endDate + "T00:00:00");
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = `${endDateObj.getFullYear()}${(endDateObj.getMonth()+1).toString().padStart(2,"0")}${endDateObj.getDate().toString().padStart(2,"0")}`;

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:show-${ev.id}@dailysheet`);
        lines.push(`DTSTAMP:${now}`);
        lines.push(`DTSTART;VALUE=DATE:${formatICSDate(ev.startDate)}`);
        lines.push(`DTEND;VALUE=DATE:${endDateStr}`);
        lines.push(`SUMMARY:${escapeICS(ev.name)}`);
        if (venue?.name) lines.push(`LOCATION:${escapeICS(venue.name)}`);
        if (ev.notes) lines.push(`DESCRIPTION:${escapeICS(ev.notes)}`);
        lines.push("END:VEVENT");
      }

      for (const sched of allSchedules) {
        const matchingEvent = filteredEvents.find(e => e.name === sched.eventName);
        if (!matchingEvent) continue;

        const start = new Date(sched.startTime);
        const end = sched.endTime ? new Date(sched.endTime) : new Date(start.getTime() + 30 * 60000);

        const descParts: string[] = [];
        if (sched.description) descParts.push(sched.description);
        if (sched.category) descParts.push(`Category: ${sched.category}`);
        if (sched.crewNames && (sched.crewNames as string[]).length > 0) {
          descParts.push(`Crew: ${(sched.crewNames as string[]).join(", ")}`);
        }

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:schedule-${sched.id}@dailysheet`);
        lines.push(`DTSTAMP:${now}`);
        lines.push(`DTSTART:${formatICSDateTime(start)}`);
        lines.push(`DTEND:${formatICSDateTime(end)}`);
        lines.push(`SUMMARY:${escapeICS(`[${sched.eventName}] ${sched.title}`)}`);
        if (sched.location) lines.push(`LOCATION:${escapeICS(sched.location)}`);
        if (descParts.length > 0) lines.push(`DESCRIPTION:${escapeICS(descParts.join("\\n"))}`);
        lines.push("END:VEVENT");
      }

      lines.push("END:VCALENDAR");

      const icsContent = lines.join("\r\n");
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="daily-sheet.ics"');
      res.send(icsContent);
    } catch (error: any) {
      console.error("ICS export error:", error);
      res.status(500).json({ message: error.message || "Failed to export calendar" });
    }
  });
}
