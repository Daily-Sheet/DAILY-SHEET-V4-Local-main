import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { z } from "zod";
import { api } from "@shared/routes";
import { insertCommentSchema, insertScheduleTemplateSchema } from "@shared/schema";
import { isAuthenticated } from "../replit_integrations/auth";
import {
  requireRole,
  normalizeTimeToEventDate,
  getUserAllowedEventNames,
  getCrewUserIdsForEvent,
  notifyUsers,
  logActivity,
  buildScheduleDiff,
  buildScheduleSnapshot,
} from "./utils";
import { emitDomainEvent } from "../ws/eventBus";

export function registerScheduleRoutes(app: Express, upload: multer.Multer) {
  // Schedules
  app.get(api.schedules.list.path, isAuthenticated, async (req: any, res) => {
    const user = req.user;
    if (!user.workspaceId) {
      return res.status(400).json({ message: "No workspace associated with this account" });
    }
    const workspaceId = user.workspaceId;
    let allSchedules = await storage.getSchedules(workspaceId);
    const allowed = await getUserAllowedEventNames(user.id, workspaceId);
    if (allowed !== null) {
      if (allowed.length === 0) return res.json([]);
      const allowedSet = new Set(allowed);
      allSchedules = allSchedules.filter((s: any) =>
        s.eventName && allowedSet.has(s.eventName)
      );
    }

    // Enrich crew data: for records where crew is empty/null, derive from crewNames + contacts/assignments
    const [allContacts, allAssignments, allEvents, allProjectAssignments] = await Promise.all([
      storage.getContacts(workspaceId),
      storage.getAllAssignments(workspaceId),
      storage.getEvents(workspaceId),
      storage.getAllProjectAssignments(workspaceId),
    ]);
    const contactByName = new Map<string, any>();
    allContacts.forEach((c: any) => {
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
      if (name) contactByName.set(name.toLowerCase(), c);
    });
    const assignmentByUserEvent = new Map<string, any>();
    allAssignments.forEach((a: any) => {
      assignmentByUserEvent.set(`${a.userId}::${a.eventName}`, a);
    });
    // Map eventName → projectId for project assignment lookup
    const eventNameToProjectId = new Map<string, number>();
    allEvents.forEach((e: any) => {
      if (e.projectId) eventNameToProjectId.set(e.name, e.projectId);
    });
    const projectAssignmentByUserProject = new Map<string, any>();
    allProjectAssignments.forEach((pa: any) => {
      projectAssignmentByUserProject.set(`${pa.userId}::${pa.projectId}`, pa);
    });

    const enriched = allSchedules.map((s: any) => {
      if (s.crew && (s.crew as any[]).length > 0) return s;
      const names: string[] = s.crewNames || [];
      if (names.length === 0) return s;
      const projectId = s.eventName ? eventNameToProjectId.get(s.eventName) : null;
      const crew = names.map((name: string) => {
        const contact = contactByName.get(name.toLowerCase());
        const departments: string[] = contact?.role
          ? contact.role.split(",").map((r: string) => r.trim()).filter(Boolean)
          : [];
        const assignment = contact?.userId
          ? assignmentByUserEvent.get(`${contact.userId}::${s.eventName}`)
          : null;
        const projectAssignment = contact?.userId && projectId
          ? projectAssignmentByUserProject.get(`${contact.userId}::${projectId}`)
          : null;
        const position = projectAssignment?.position || assignment?.position || null;
        return { name, userId: contact?.userId || null, position, departments };
      });
      return { ...s, crew };
    });

    res.json(enriched);
  });

  app.post(api.schedules.create.path, isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === "string") body.startTime = new Date(body.startTime);
      if (body.endTime && typeof body.endTime === "string") body.endTime = new Date(body.endTime);
      if (body.eventDate && body.startTime) {
        body.startTime = normalizeTimeToEventDate(body.startTime, body.eventDate);
        if (body.endTime) body.endTime = normalizeTimeToEventDate(body.endTime, body.eventDate);
      }
      const input = api.schedules.create.input.parse(body);
      const schedule = await storage.createSchedule({ ...input, workspaceId });
      res.status(201).json(schedule);

      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "schedule:created", workspaceId, eventName: schedule.eventName ?? undefined, actorId: req.user.id, actorName, payload: { id: schedule.id, eventDate: schedule.eventDate } });
      if (schedule.eventName) {
        getCrewUserIdsForEvent(schedule.eventName, workspaceId)
          .then(crewIds => notifyUsers(crewIds, req.user.id, "schedule_change", "New Schedule Item", `"${schedule.title || schedule.category}" was added to ${schedule.eventName}`, workspaceId, schedule.eventName ?? undefined))
          .catch(err => console.error("Notification error:", err));
      }
      logActivity(req.user.id, actorName, "schedule_change", "created", schedule.title || schedule.category || "Schedule Item", `Added "${schedule.title || schedule.category}" to ${schedule.eventName || "schedule"}`, workspaceId, schedule.eventName ?? undefined, buildScheduleSnapshot(schedule))
        .catch(err => console.error("Activity log error:", err));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.schedules.update.path, isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const id = Number(req.params.id);
      const allSchedules = await storage.getSchedules(workspaceId);
      const record = allSchedules.find((s: any) => s.id === id);
      if (!record) return res.status(404).json({ message: "Schedule not found" });
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === "string") body.startTime = new Date(body.startTime);
      if (body.endTime && typeof body.endTime === "string") body.endTime = new Date(body.endTime);
      const eventDate = body.eventDate || record.eventDate;
      if (eventDate && body.startTime) {
        body.startTime = normalizeTimeToEventDate(body.startTime, eventDate);
        if (body.endTime) body.endTime = normalizeTimeToEventDate(body.endTime, eventDate);
      }
      const input = api.schedules.update.input.parse(body);
      const schedule = await storage.updateSchedule(id, input);
      res.json(schedule);

      const evName = schedule.eventName ?? record.eventName ?? undefined;
      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "schedule:updated", workspaceId, eventName: evName, actorId: req.user.id, actorName, payload: { id: schedule.id, eventDate: schedule.eventDate } });
      if (evName) {
        getCrewUserIdsForEvent(evName, workspaceId)
          .then(crewIds => notifyUsers(crewIds, req.user.id, "schedule_change", "Schedule Updated", `"${schedule.title || schedule.category}" was updated in ${evName}`, workspaceId, evName ?? undefined))
          .catch(err => console.error("Notification error:", err));
      }
      const diffDetails = buildScheduleDiff(record, schedule);
      logActivity(req.user.id, actorName, "schedule_change", "updated", schedule.title || schedule.category || "Schedule Item", `Updated "${schedule.title || schedule.category}" in ${evName || "schedule"}`, workspaceId, evName ?? undefined, diffDetails)
        .catch(err => console.error("Activity log error:", err));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/schedules/:id/complete", isAuthenticated, requireRole("owner", "manager", "admin", "commenter", "client"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const id = Number(req.params.id);
      const allSchedules = await storage.getSchedules(workspaceId);
      const record = allSchedules.find((s: any) => s.id === id);
      if (!record) return res.status(404).json({ message: "Schedule not found" });
      const isCompleting = !record.completed;
      const schedule = await storage.updateSchedule(id, {
        completed: isCompleting,
        completedAt: isCompleting ? new Date() : null,
        completedBy: isCompleting ? req.user.id : null,
      });
      res.json(schedule);

      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "schedule:completed", workspaceId, eventName: record.eventName ?? undefined, actorId: req.user.id, actorName, payload: { id: schedule.id, completed: isCompleting } });
    } catch (err) {
      throw err;
    }
  });

  app.delete("/api/schedules/clear-day", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const { eventDate, eventName } = z.object({
      eventDate: z.string(),
      eventName: z.string().optional(),
    }).parse(req.body);
    const count = await storage.clearDaySchedules(workspaceId, eventDate, eventName);
    res.json({ success: true, deleted: count });

    const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
    emitDomainEvent({ type: "schedule:day-cleared", workspaceId, eventName, actorId: req.user.id, actorName, payload: { eventDate, deleted: count } });
  });

  app.delete(api.schedules.delete.path, isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const id = Number(req.params.id);
    const allSchedules = await storage.getSchedules(workspaceId);
    const record = allSchedules.find((s: any) => s.id === id);
    if (!record) return res.status(404).json({ message: "Schedule not found" });
    await storage.deleteSchedule(id);
    res.status(204).send();

    const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
    emitDomainEvent({ type: "schedule:deleted", workspaceId, eventName: record.eventName ?? undefined, actorId: req.user.id, actorName, payload: { id, eventDate: record.eventDate } });
    if (record.eventName) {
      getCrewUserIdsForEvent(record.eventName, workspaceId)
        .then(crewIds => notifyUsers(crewIds, req.user.id, "schedule_change", "Schedule Item Removed", `"${record.title || record.category}" was removed from ${record.eventName}`, workspaceId, record.eventName ?? undefined))
        .catch(err => console.error("Notification error:", err));
    }
    logActivity(req.user.id, actorName, "schedule_change", "deleted", record.title || record.category || "Schedule Item", `Removed "${record.title || record.category}" from ${record.eventName || "schedule"}`, workspaceId, record.eventName ?? undefined, buildScheduleSnapshot(record))
      .catch(err => console.error("Activity log error:", err));
  });

  app.patch("/api/schedules/reorder", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const { ids, timeUpdates } = z.object({
        ids: z.array(z.number()),
        timeUpdates: z.array(z.object({
          id: z.number(),
          startTime: z.string(),
          endTime: z.string().nullable(),
        })).optional(),
      }).parse(req.body);
      const allSchedules = await storage.getSchedules(workspaceId);
      const wsIds = new Set(allSchedules.map((s: any) => s.id));
      if (!ids.every((id: number) => wsIds.has(id))) {
        return res.status(404).json({ message: "One or more schedules not found" });
      }
      let parsedTimeUpdates: { id: number; startTime: Date; endTime: Date | null }[] | undefined;
      if (timeUpdates && timeUpdates.length > 0) {
        const scheduleMap = new Map(allSchedules.map((s: any) => [s.id, s]));
        parsedTimeUpdates = timeUpdates.map(t => {
          let startTime = new Date(t.startTime);
          let endTime = t.endTime ? new Date(t.endTime) : null;
          const schedule = scheduleMap.get(t.id);
          if (schedule?.eventDate) {
            startTime = normalizeTimeToEventDate(startTime, schedule.eventDate);
            if (endTime) endTime = normalizeTimeToEventDate(endTime, schedule.eventDate);
          }
          return { id: t.id, startTime, endTime };
        });
      }
      await storage.reorderSchedules(ids, parsedTimeUpdates);
      res.json({ success: true });

      const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
      emitDomainEvent({ type: "schedule:reordered", workspaceId, actorId: req.user.id, actorName, payload: { count: ids.length } });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Comments
  app.get("/api/schedules/:id/comments", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const scheduleId = Number(req.params.id);
    const allSchedules = await storage.getSchedules(workspaceId);
    const schedule = allSchedules.find((s: any) => s.id === scheduleId);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    const result = await storage.getCommentsBySchedule(scheduleId);
    res.json(result);
  });

  app.post("/api/schedules/:id/comments", isAuthenticated, requireRole("owner", "manager", "admin", "commenter", "client"), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Anonymous";
      const workspaceId = req.user.workspaceId;
      const scheduleId = Number(req.params.id);
      const allSchedules = await storage.getSchedules(workspaceId);
      const schedule = allSchedules.find((s: any) => s.id === scheduleId);
      if (!schedule) return res.status(404).json({ message: "Schedule not found in workspace" });
      const input = insertCommentSchema.parse({
        scheduleId,
        authorId: userId,
        authorName: userName,
        body: req.body.body,
        workspaceId,
      });
      const comment = await storage.createComment(input);
      res.status(201).json(comment);

      emitDomainEvent({ type: "comment:created", workspaceId, eventName: schedule.eventName ?? undefined, actorId: userId, actorName: userName, payload: { scheduleId, commentId: comment.id } });
      if (schedule.eventName) {
        getCrewUserIdsForEvent(schedule.eventName, workspaceId)
          .then(crewIds => notifyUsers(crewIds, userId, "comment", "New Comment", `${userName} commented on "${schedule.title || schedule.category}" in ${schedule.eventName}`, workspaceId, schedule.eventName ?? undefined))
          .catch(err => console.error("Notification error:", err));
      }
      logActivity(userId, userName, "comment", "created", "Comment", `${userName} commented on "${schedule.title || schedule.category}" in ${schedule.eventName || "schedule"}`, workspaceId, schedule.eventName ?? undefined, JSON.stringify([{ field: "Comment", value: req.body.body }]))
        .catch(err => console.error("Activity log error:", err));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/comments/:id/pin", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const commentId = Number(req.params.id);
    const allSchedules = await storage.getSchedules(workspaceId);
    const scheduleIds = allSchedules.map((s: any) => s.id);
    let found = false;
    for (const sid of scheduleIds) {
      const commentsForSchedule = await storage.getCommentsBySchedule(sid);
      if (commentsForSchedule.find((c: any) => c.id === commentId)) {
        found = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ message: "Comment not found" });
    const updated = await storage.toggleCommentPin(commentId);
    res.json(updated);

    const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
    emitDomainEvent({ type: "comment:pinned", workspaceId, actorId: req.user.id, actorName, payload: { commentId, pinned: updated.pinned } });
  });

  app.delete("/api/comments/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const commentId = Number(req.params.id);
    const allSchedules = await storage.getSchedules(workspaceId);
    const scheduleIds = allSchedules.map((s: any) => s.id);
    let found = false;
    for (const sid of scheduleIds) {
      const commentsForSchedule = await storage.getCommentsBySchedule(sid);
      if (commentsForSchedule.find((c: any) => c.id === commentId)) {
        found = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ message: "Comment not found" });
    await storage.deleteComment(commentId);
    res.status(204).send();

    const actorName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Unknown";
    emitDomainEvent({ type: "comment:deleted", workspaceId, actorId: req.user.id, actorName, payload: { commentId } });
  });

  // Schedule Templates (user-saved)
  app.get("/api/schedule-templates", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const templates = await storage.getScheduleTemplates(workspaceId);
    res.json(templates);
  });

  app.post("/api/schedule-templates", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const input = insertScheduleTemplateSchema.parse(req.body);
      const template = await storage.createScheduleTemplate({ ...input, workspaceId });
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch("/api/schedule-templates/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const allTemplates = await storage.getScheduleTemplates(workspaceId);
    const record = allTemplates.find((t: any) => t.id === parseInt(req.params.id));
    if (!record) return res.status(404).json({ message: "Template not found" });
    const { name, description } = req.body;
    const updated = await storage.updateScheduleTemplate(parseInt(req.params.id), { name, description });
    res.json(updated);
  });

  app.delete("/api/schedule-templates/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const allTemplates = await storage.getScheduleTemplates(workspaceId);
    const record = allTemplates.find((t: any) => t.id === parseInt(req.params.id));
    if (!record) return res.status(404).json({ message: "Template not found" });
    await storage.deleteScheduleTemplate(parseInt(req.params.id));
    res.json({ success: true });
  });
}
