import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { z } from "zod";
import { insertEventSchema, eventAssignments } from "@shared/schema";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, getWorkspaceRole, getUserAllowedEventNames, notifyUsers, logActivity } from "./utils";
import { emitDomainEvent } from "../ws/eventBus";

export function registerEventRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let allEvents = await storage.getEvents(workspaceId);
    const allowed = await getUserAllowedEventNames(req.user.id, workspaceId);
    if (allowed !== null) {
      if (allowed.length === 0) return res.json([]);
      const allowedSet = new Set(allowed);
      allEvents = allEvents.filter((e: any) => e.name && allowedSet.has(e.name));
    }
    res.json(allEvents);
  });

  app.post("/api/events", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const { venueForAllDays, ...rest } = req.body;
      const input = insertEventSchema.parse(rest);
      if (!input.projectId) {
        return res.status(400).json({ message: "A project is required to create a show" });
      }
      // Prevent creation of events with duplicate names within the same workspace
      if (input.name) {
        const existingEvents = await storage.getEvents(workspaceId);
        const hasDuplicateName = existingEvents.some((e: any) => e.name === input.name);
        if (hasDuplicateName) {
          return res.status(400).json({ message: "An event with this name already exists in this workspace" });
        }
      }
      const event = await storage.createEvent({ ...input, workspaceId });

      // Always populate eventDayVenues for all dates when a venue is provided
      if (input.venueId && input.startDate && input.endDate) {
        const start = new Date(input.startDate + "T00:00:00");
        const end = new Date(input.endDate + "T00:00:00");
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          await storage.setEventDayVenue({ eventId: event.id, date: dateStr, venueId: input.venueId, workspaceId });
        }
      }

      if (input.projectId) {
        const project = await storage.getProject(input.projectId);
        if (project && project.isTour) {
          const projAssignments = await storage.getProjectAssignments(input.projectId, workspaceId);
          for (const pa of projAssignments) {
            await storage.createAssignment({
              userId: pa.userId,
              eventName: event.name,
              workspaceId,
              position: pa.position || null,
            });
          }
        }
      }

      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/events/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const id = Number(req.params.id);
      const allEvents = await storage.getEvents(workspaceId);
      const existing = allEvents.find((e: any) => e.id === id);
      if (!existing) return res.status(404).json({ message: "Event not found" });

      const { venueForAllDays, ...data } = req.body as Partial<{ name: string; color: string; notes: string; startDate: string; endDate: string; venueId: number | null; projectId: number | null; venueForAllDays: boolean; legId: number | null; eventType: string; tag: string | null }>;

      if (data.name && data.name !== existing.name) {
        // No need to cascade rename since relationships use eventId now
      }

      const updated = await storage.updateEvent(id, { ...data, projectId: "projectId" in data ? data.projectId : undefined });

      const effectiveStartDate = data.startDate ?? existing.startDate;
      const effectiveEndDate = data.endDate ?? existing.endDate;
      const effectiveVenueId = data.venueId !== undefined ? data.venueId : existing.venueId;

      // Populate eventDayVenues — default to all dates unless venueForAllDays is explicitly false
      if (effectiveVenueId && effectiveStartDate && effectiveEndDate) {
        if (venueForAllDays === false) {
          await storage.setEventDayVenue({ eventId: id, date: effectiveStartDate, venueId: effectiveVenueId, workspaceId });
        } else {
          const start = new Date(effectiveStartDate + "T00:00:00");
          const end = new Date(effectiveEndDate + "T00:00:00");
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];
            await storage.setEventDayVenue({ eventId: id, date: dateStr, venueId: effectiveVenueId, workspaceId });
          }
        }
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const id = Number(req.params.id);
    const allEvents = await storage.getEvents(workspaceId);
    const record = allEvents.find((e: any) => e.id === id);
    if (!record) return res.status(404).json({ message: "Event not found" });
    await storage.deleteEventDayVenues(id);
    await storage.deleteEvent(id, workspaceId);
    res.status(204).send();
  });

  // Event Day Venues
  app.get("/api/event-day-venues", isAuthenticated, async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.json([]);
      let dayVenues = await storage.getAllEventDayVenues(workspaceId);
      const allowed = await getUserAllowedEventNames(req.user.id, workspaceId);
      if (allowed !== null) {
        if (allowed.length === 0) return res.json([]);
        const allEvents = await storage.getEvents(workspaceId);
        const allowedEventIds = new Set(
          allEvents.filter((e: any) => allowed.includes(e.name)).map((e: any) => e.id)
        );
        dayVenues = dayVenues.filter((dv: any) => allowedEventIds.has(dv.eventId));
      }
      res.json(dayVenues);
    } catch (err) {
      res.status(500).json({ message: "Failed to get day venues" });
    }
  });

  app.get("/api/events/:id/day-venues", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = Number(req.params.id);
      const dayVenues = await storage.getEventDayVenues(eventId);
      res.json(dayVenues);
    } catch (err) {
      res.status(500).json({ message: "Failed to get day venues" });
    }
  });

  app.put("/api/events/:id/day-venues/:date", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const eventId = Number(req.params.id);
      const date = req.params.date;
      const { venueId } = req.body;
      if (!venueId) return res.status(400).json({ message: "venueId is required" });
      const dayVenue = await storage.setEventDayVenue({ eventId, date, venueId, workspaceId });
      res.json(dayVenue);
    } catch (err) {
      res.status(500).json({ message: "Failed to set day venue" });
    }
  });

  app.delete("/api/events/:id/day-venues/:date", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const eventId = Number(req.params.id);
      const date = req.params.date;
      await storage.deleteEventDayVenue(eventId, date);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete day venue" });
    }
  });

  // Event Assignments
  app.get("/api/event-assignments", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const assignments = await storage.getAllAssignments(workspaceId);
    const role = await getWorkspaceRole(req.user.id, workspaceId);
    if (["owner", "manager", "admin"].includes(role)) {
      res.json(assignments);
    } else {
      res.json(assignments.filter((a: any) => a.userId === req.user.id));
    }
  });

  app.get("/api/users/:id/event-assignments", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const members = await storage.getWorkspaceMembers(workspaceId);
    if (!members.find((m: any) => m.userId === req.params.id)) {
      return res.status(404).json({ message: "User not found in workspace" });
    }
    const allAssignments = await storage.getAllAssignments(workspaceId);
    const userAssignments = allAssignments.filter((a: any) => a.userId === req.params.id);
    res.json(userAssignments);
  });

  app.post("/api/users/:id/event-assignments", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const members = await storage.getWorkspaceMembers(workspaceId);
      if (!members.find((m: any) => m.userId === req.params.id)) {
        return res.status(404).json({ message: "User not found in workspace" });
      }
      const { eventName, date } = req.body;
      if (!eventName || typeof eventName !== "string" || eventName.trim().length === 0) {
        return res.status(400).json({ message: "Event name is required" });
      }
      // Look up event to get eventId
      const event = await storage.getEventByName(eventName.trim(), workspaceId);
      const eventId = (req.body.eventId as number) || event?.id || null;
      const assignment = await storage.createAssignment({
        userId: req.params.id,
        eventName: eventName.trim(),
        eventId,
        workspaceId,
        date: date && typeof date === "string" ? date : null,
      });
      res.status(201).json(assignment);

      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "crew:assigned", workspaceId, eventName: eventName.trim(), actorId: req.user.id, actorName, payload: { userId: req.params.id } });
      notifyUsers([req.params.id], req.user.id, "assignment_change", "Show Assignment", `You were assigned to "${eventName.trim()}"`, workspaceId, eventName.trim())
        .catch(err => console.error("Notification error:", err));
      const targetMember = members.find((m: any) => m.userId === req.params.id) as any;
      const assignedUserName = targetMember ? ([targetMember.firstName, targetMember.lastName].filter(Boolean).join(" ") || targetMember.email || "crew member") : "crew member";
      logActivity(req.user.id, actorName, "assignment_change", "created", "Show Assignment", `Assigned ${assignedUserName} to "${eventName.trim()}"`, workspaceId, eventName.trim(), JSON.stringify([{ field: "Crew Member", value: assignedUserName }, { field: "Show", value: eventName.trim() }]))
        .catch(err => console.error("Activity log error:", err));
    } catch (err) {
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.post("/api/event-assignments/:id/checkin", isAuthenticated, async (req: any, res) => {
    try {
      const assignment = await storage.getAssignment(Number(req.params.id));
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      if (assignment.userId !== req.user.id) {
        const workspaceId = req.user.workspaceId;
        const members = await storage.getWorkspaceMembers(workspaceId);
        const member = members.find((m: any) => m.userId === req.user.id);
        if (!member || (!["owner", "manager", "admin"].includes(member.role))) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      const updated = await storage.checkInAssignment(Number(req.params.id));
      res.json(updated);
      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "crew:checkin", workspaceId: req.user.workspaceId, eventName: assignment.eventName, actorId: req.user.id, actorName, payload: { assignmentId: assignment.id } });
    } catch (err) {
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post("/api/event-assignments/:id/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const assignment = await storage.getAssignment(Number(req.params.id));
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      if (assignment.userId !== req.user.id) {
        const workspaceId = req.user.workspaceId;
        const members = await storage.getWorkspaceMembers(workspaceId);
        const member = members.find((m: any) => m.userId === req.user.id);
        if (!member || (!["owner", "manager", "admin"].includes(member.role))) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      const updated = await storage.checkOutAssignment(Number(req.params.id));
      res.json(updated);
      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "crew:checkout", workspaceId: req.user.workspaceId, eventName: assignment.eventName, actorId: req.user.id, actorName, payload: { assignmentId: assignment.id } });
    } catch (err) {
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  async function removeCrewFromSchedules(userId: string, eventName: string, workspaceId: number) {
    try {
      const userContacts = await storage.getContactsByUserId(userId);
      if (userContacts.length === 0) return;
      const contactNames = userContacts.map(c =>
        `${c.firstName || ""} ${c.lastName || ""}`.trim().toLowerCase()
      ).filter(n => n.length > 0);
      if (contactNames.length === 0) return;
      const allSchedules = await storage.getSchedules(workspaceId);
      const matchingSchedules = allSchedules.filter(s => s.eventName === eventName && s.crewNames && s.crewNames.length > 0);
      for (const sched of matchingSchedules) {
        const filtered = (sched.crewNames as string[]).filter(
          name => !contactNames.includes(name.trim().toLowerCase())
        );
        if (filtered.length !== (sched.crewNames as string[]).length) {
          await storage.updateSchedule(sched.id, { crewNames: filtered });
        }
      }
    } catch (err) {
      console.error("Error removing crew from schedules:", err);
    }
  }

  app.patch("/api/event-assignments/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const { position } = req.body;
      const updated = await storage.updateAssignment(Number(req.params.id), { position: position || null });
      res.json(updated);
      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "crew:updated", workspaceId: req.user.workspaceId, actorId: req.user.id, actorName, payload: { assignmentId: Number(req.params.id) } });
    } catch (err) {
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/event-assignments/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const allAssignments = workspaceId ? await storage.getAllAssignments(workspaceId) : [];
      const assignment = allAssignments.find((a: any) => a.id === Number(req.params.id));
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      await removeCrewFromSchedules(assignment.userId, assignment.eventName, workspaceId);
      await storage.deleteAssignment(Number(req.params.id));
      res.status(204).send();
      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "crew:unassigned", workspaceId, eventName: assignment.eventName, actorId: req.user.id, actorName, payload: { userId: assignment.userId } });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  app.put("/api/users/:id/event-assignments", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const members = await storage.getWorkspaceMembers(workspaceId);
      if (!members.find((m: any) => m.userId === req.params.id)) {
        return res.status(404).json({ message: "User not found in workspace" });
      }
      const { eventNames } = req.body;
      if (!Array.isArray(eventNames)) {
        return res.status(400).json({ message: "eventNames must be an array" });
      }
      const oldAssignments = await storage.getAllAssignments(workspaceId);
      const userOldAssignments = oldAssignments.filter((a: any) => a.userId === req.params.id);
      const newEventSet = new Set(eventNames.map((n: string) => n.trim()));
      const removedEvents = userOldAssignments.filter((a: any) => !newEventSet.has(a.eventName));
      for (const removed of removedEvents) {
        await removeCrewFromSchedules(req.params.id, removed.eventName, workspaceId);
      }
      await storage.deleteAssignmentsByUserInWorkspace(req.params.id, workspaceId);
      const assignments = [];
      for (const name of eventNames) {
        if (typeof name === "string" && name.trim().length > 0) {
          const ev = await storage.getEventByName(name.trim(), workspaceId);
          const a = await storage.createAssignment({ userId: req.params.id, eventName: name.trim(), eventId: ev?.id ?? null, workspaceId });
          assignments.push(a);
        }
      }
      res.json(assignments);
      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "crew:assigned", workspaceId, actorId: req.user.id, actorName, payload: { userId: req.params.id, bulk: true } });
    } catch (err) {
      res.status(500).json({ message: "Failed to update assignments" });
    }
  });
}
