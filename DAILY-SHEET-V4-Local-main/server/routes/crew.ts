import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { db } from "../db";
import { dailyCheckins } from "@shared/schema";
import { checkAchievements } from "../achievements/engine";
import { insertTaskTypeSchema, insertDepartmentSchema, insertCrewPositionSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CONTACT_ROLES, DEFAULT_TASK_TYPES, DEFAULT_CREW_POSITIONS } from "@shared/constants";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, getWorkspaceRole, logActivity } from "./utils";
import { emitDomainEvent } from "../ws/eventBus";

export function registerCrewRoutes(app: Express, upload: multer.Multer) {
  // Daily Checkins
  app.get("/api/daily-checkins", isAuthenticated, async (req: any, res) => {
    const { eventName, date } = req.query;
    const workspaceId = req.user.workspaceId;
    if (!eventName || !date) return res.status(400).json({ message: "eventName and date are required" });
    const checkins = await storage.getDailyCheckins(eventName as string, date as string, workspaceId);
    res.json(checkins);
  });

  app.post("/api/daily-checkins", isAuthenticated, async (req: any, res) => {
    const { userId, eventName, date } = req.body;
    const workspaceId = req.user.workspaceId;
    const targetUserId = userId || req.user.id;
    if (targetUserId !== req.user.id) {
      const role = await getWorkspaceRole(req.user.id, workspaceId);
      if (!["owner", "manager", "admin"].includes(role)) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }
    if (!eventName || !date) return res.status(400).json({ message: "eventName and date are required" });
    const checkin = await storage.upsertDailyCheckin({ userId: targetUserId, eventName, date, workspaceId });
    checkAchievements(targetUserId, "checkin:created", { workspaceId, actorName: req.user.firstName, hour: new Date().getHours() }).catch(() => {});

    const targetUser = await storage.getUser(targetUserId);
    const targetName = targetUser?.firstName || "Unknown";
    const actorName = req.user.firstName || "Unknown";
    const isAdmin = targetUserId !== req.user.id;
    logActivity(
      req.user.id, actorName, "assignment_change", "checked_in",
      targetName,
      isAdmin ? `${actorName} checked in ${targetName} to ${eventName} on ${date}` : `${targetName} checked in to ${eventName} on ${date}`,
      workspaceId, eventName
    ).catch(err => console.error("Activity log error:", err));

    emitDomainEvent({ type: "checkin:created", workspaceId, eventName, actorId: req.user.id, actorName, payload: { id: checkin.id, userId: targetUserId, date } });
    res.json(checkin);
  });

  app.post("/api/daily-checkins/:id/checkout", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(dailyCheckins).where(eq(dailyCheckins.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    const workspaceId = req.user.workspaceId;
    if (existing.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    if (existing.userId !== req.user.id) {
      const role = await getWorkspaceRole(req.user.id, workspaceId);
      if (!["owner", "manager", "admin"].includes(role)) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }
    const checkin = await storage.checkOutDaily(id);
    if (checkin.checkedInAt && checkin.checkedOutAt) {
      const hoursWorked = (new Date(checkin.checkedOutAt).getTime() - new Date(checkin.checkedInAt).getTime()) / (1000 * 60 * 60);
      checkAchievements(existing.userId, "checkout:completed", { workspaceId, actorName: req.user.firstName, hoursWorked }).catch(() => {});
    }

    const targetUser = await storage.getUser(existing.userId);
    const targetName = targetUser?.firstName || "Unknown";
    const actorName = req.user.firstName || "Unknown";
    const isAdmin = existing.userId !== req.user.id;
    logActivity(
      req.user.id, actorName, "assignment_change", "checked_out",
      targetName,
      isAdmin ? `${actorName} checked out ${targetName} from ${existing.eventName} on ${existing.date}` : `${targetName} checked out from ${existing.eventName} on ${existing.date}`,
      workspaceId, existing.eventName
    ).catch(err => console.error("Activity log error:", err));

    emitDomainEvent({ type: "checkin:checkout", workspaceId, eventName: existing.eventName, actorId: req.user.id, actorName, payload: { id, userId: existing.userId } });
    res.json(checkin);
  });

  app.post("/api/daily-checkins/:id/lunch-out", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(dailyCheckins).where(eq(dailyCheckins.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    const workspaceId = req.user.workspaceId;
    if (existing.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    if (existing.userId !== req.user.id) {
      const role = await getWorkspaceRole(req.user.id, workspaceId);
      if (!["owner", "manager", "admin"].includes(role)) return res.status(403).json({ message: "Not authorized" });
    }
    const checkin = await storage.lunchOutDaily(id);
    res.json(checkin);
  });

  app.post("/api/daily-checkins/:id/reset", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(dailyCheckins).where(eq(dailyCheckins.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    const workspaceId = req.user.workspaceId;
    if (existing.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    const role = await getWorkspaceRole(req.user.id, workspaceId);
    if (!["owner", "manager", "admin"].includes(role)) return res.status(403).json({ message: "Only managers and admins can reset punches" });
    const checkin = await storage.resetDailyCheckin(id);
    res.json(checkin);
  });

  app.post("/api/daily-checkins/:id/lunch-in", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(dailyCheckins).where(eq(dailyCheckins.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    const workspaceId = req.user.workspaceId;
    if (existing.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    if (existing.userId !== req.user.id) {
      const role = await getWorkspaceRole(req.user.id, workspaceId);
      if (!["owner", "manager", "admin"].includes(role)) return res.status(403).json({ message: "Not authorized" });
    }
    const checkin = await storage.lunchInDaily(id);
    res.json(checkin);
  });

  // Sections
  app.get("/api/sections", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const sectionList = await storage.getSections(workspaceId);
    res.json(sectionList);
  });

  app.get("/api/events/:eventId/sections", isAuthenticated, async (req: any, res) => {
    const eventId = parseInt(req.params.eventId);
    const sectionList = await storage.getSectionsByEvent(eventId);
    res.json(sectionList);
  });

  app.post("/api/sections", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const { name, description, eventId, sortOrder } = req.body;
    if (!name?.trim() || !eventId) return res.status(400).json({ message: "Name and show are required" });
    const section = await storage.createSection({ name: name.trim(), description: description || null, eventId, sortOrder: sortOrder || 0, workspaceId });
    res.status(201).json(section);
  });

  app.patch("/api/sections/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updated = await storage.updateSection(id, data);
    res.json(updated);
  });

  app.delete("/api/sections/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteSection(id);
    res.sendStatus(204);
  });

  // Task Types
  app.get("/api/task-types", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let types = await storage.getTaskTypes(workspaceId);
    if (types.length === 0) {
      for (const name of DEFAULT_TASK_TYPES) {
        await storage.createTaskType({ name, workspaceId, isDefault: true });
      }
      types = await storage.getTaskTypes(workspaceId);
    }
    res.json(types);
  });

  app.post("/api/task-types", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const input = insertTaskTypeSchema.parse(req.body);
      const taskType = await storage.createTaskType({ ...input, workspaceId });
      res.status(201).json(taskType);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch("/api/task-types/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const allTypes = await storage.getTaskTypes(workspaceId);
      const record = allTypes.find((t: any) => t.id === parseInt(req.params.id));
      if (!record) return res.status(404).json({ message: "Task type not found" });
      const updated = await storage.updateTaskType(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.delete("/api/task-types/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const allTypes = await storage.getTaskTypes(workspaceId);
    const record = allTypes.find((t: any) => t.id === parseInt(req.params.id));
    if (!record) return res.status(404).json({ message: "Task type not found" });
    await storage.deleteTaskType(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/task-types/seed-defaults", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const existing = await storage.getTaskTypes(workspaceId);
    const existingNames = new Set(existing.map((t: any) => t.name.toLowerCase()));
    let added = 0;
    for (const name of DEFAULT_TASK_TYPES) {
      if (!existingNames.has(name.toLowerCase())) {
        await storage.createTaskType({ name, workspaceId, isDefault: true });
        added++;
      }
    }
    const updated = await storage.getTaskTypes(workspaceId);
    res.json({ added, types: updated });
  });

  // Departments
  app.get("/api/departments", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let depts = await storage.getDepartments(workspaceId);
    if (depts.length === 0) {
      for (const name of CONTACT_ROLES) {
        await storage.createDepartment({ name, workspaceId, isDefault: true });
      }
      depts = await storage.getDepartments(workspaceId);
    }
    res.json(depts);
  });

  app.post("/api/departments", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const input = insertDepartmentSchema.parse(req.body);
      const dept = await storage.createDepartment({ ...input, workspaceId });
      res.status(201).json(dept);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch("/api/departments/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const allDepts = await storage.getDepartments(workspaceId);
      const record = allDepts.find((d: any) => d.id === parseInt(req.params.id));
      if (!record) return res.status(404).json({ message: "Department not found" });
      const updated = await storage.updateDepartment(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.delete("/api/departments/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const allDepts = await storage.getDepartments(workspaceId);
    const record = allDepts.find((d: any) => d.id === parseInt(req.params.id));
    if (!record) return res.status(404).json({ message: "Department not found" });
    await storage.deleteDepartment(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/departments/seed-defaults", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const existing = await storage.getDepartments(workspaceId);
    const existingNames = new Set(existing.map((d: any) => d.name.toLowerCase()));
    let added = 0;
    for (const name of CONTACT_ROLES) {
      if (!existingNames.has(name.toLowerCase())) {
        await storage.createDepartment({ name, workspaceId, isDefault: true });
        added++;
      }
    }
    const updated = await storage.getDepartments(workspaceId);
    res.json({ added, departments: updated });
  });

  // Crew Positions
  app.get("/api/crew-positions", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let positions = await storage.getCrewPositions(workspaceId);
    if (positions.length === 0) {
      for (const name of DEFAULT_CREW_POSITIONS) {
        await storage.createCrewPosition({ name, workspaceId, isDefault: true });
      }
      positions = await storage.getCrewPositions(workspaceId);
    }
    res.json(positions);
  });

  app.post("/api/crew-positions", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const input = insertCrewPositionSchema.parse(req.body);
      const position = await storage.createCrewPosition({ ...input, workspaceId });
      res.status(201).json(position);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch("/api/crew-positions/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const allPositions = await storage.getCrewPositions(workspaceId);
      const record = allPositions.find((p: any) => p.id === parseInt(req.params.id));
      if (!record) return res.status(404).json({ message: "Crew position not found" });
      const updated = await storage.updateCrewPosition(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.delete("/api/crew-positions/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const allPositions = await storage.getCrewPositions(workspaceId);
    const record = allPositions.find((p: any) => p.id === parseInt(req.params.id));
    if (!record) return res.status(404).json({ message: "Crew position not found" });
    await storage.deleteCrewPosition(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/crew-positions/seed-defaults", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const existing = await storage.getCrewPositions(workspaceId);
    const existingNames = new Set(existing.map((p: any) => p.name.toLowerCase()));
    let added = 0;
    for (const name of DEFAULT_CREW_POSITIONS) {
      if (!existingNames.has(name.toLowerCase())) {
        await storage.createCrewPosition({ name, workspaceId, isDefault: true });
        added++;
      }
    }
    const updated = await storage.getCrewPositions(workspaceId);
    res.json({ added, positions: updated });
  });
}
