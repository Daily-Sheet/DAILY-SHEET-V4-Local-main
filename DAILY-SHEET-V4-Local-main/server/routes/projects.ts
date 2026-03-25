import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { db } from "../db";
import { travelDays, crewTravel } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, getWorkspaceRole } from "./utils";

export function registerProjectRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let projectList = await storage.getProjects(workspaceId);
    const workspaceRole = await getWorkspaceRole(req.user.id, workspaceId);
    if (workspaceRole === "manager") {
      projectList = projectList.filter((p: any) => p.managerId === req.user.id || !p.managerId);
    } else if (workspaceRole === "commenter" || workspaceRole === "client") {
      const allowed = await (async () => {
        const allAssignments = await storage.getAllAssignments(workspaceId);
        const directNames = allAssignments
          .filter((a: any) => a.userId === req.user.id)
          .map((a: any) => a.eventName);
        const nameSet = new Set(directNames);
        const projAssignments = await storage.getProjectAssignmentsByUser(req.user.id, workspaceId);
        if (projAssignments.length > 0) {
          const projIds = new Set(projAssignments.map((pa: any) => pa.projectId));
          const allEvents = await storage.getEvents(workspaceId);
          for (const ev of allEvents) {
            if (ev.projectId && projIds.has(ev.projectId)) {
              nameSet.add(ev.name);
            }
          }
        }
        return Array.from(nameSet);
      })();
      if (allowed !== null) {
        if (allowed.length === 0) return res.json([]);
        const allEvents = await storage.getEvents(workspaceId);
        const allowedProjectIds = new Set(
          allEvents
            .filter((e: any) => allowed.includes(e.name) && e.projectId)
            .map((e: any) => e.projectId)
        );
        projectList = projectList.filter((p: any) => allowedProjectIds.has(p.id));
      }
    }
    res.json(projectList);
  });

  app.post("/api/projects", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const { name, description, startDate, endDate, driveUrl, projectNumber, isFestival, isTour } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    const project = await storage.createProject({ name: name.trim(), description: description || null, startDate: startDate || null, endDate: endDate || null, driveUrl: driveUrl || null, projectNumber: projectNumber || null, isFestival: isFestival ?? false, isTour: isTour ?? false, workspaceId, managerId: req.user.id });
    res.status(201).json(project);
  });

  app.post("/api/projects/:id/generate-shows", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
      if (project.archived) return res.status(400).json({ message: "Cannot generate shows for an archived project" });

      const { count, startDate } = req.body;
      if (!count || count < 1 || count > 100) return res.status(400).json({ message: "Count must be between 1 and 100" });
      if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return res.status(400).json({ message: "Valid start date required (YYYY-MM-DD)" });

      const isFestival = project.isFestival ?? false;
      const entityLabel = isFestival ? "Stage" : "Show";

      const existingEvents = await storage.getEvents(workspaceId);
      const existingForProject = existingEvents.filter((e: any) => e.projectId === projectId);
      const prefix = `${project.name} - ${entityLabel}`;
      let highestNum = 0;
      for (const ev of existingForProject) {
        const match = ev.name.match(new RegExp(`${entityLabel}\\s+(\\d+)$`));
        if (match) highestNum = Math.max(highestNum, parseInt(match[1]));
      }

      const projAssignments = await storage.getProjectAssignments(projectId, workspaceId);

      const created = [];
      const start = new Date(startDate + "T00:00:00");
      for (let i = 0; i < count; i++) {
        // Festivals: all stages share the same date; tours/regular: consecutive dates
        const showDate = new Date(start);
        if (!isFestival) showDate.setDate(start.getDate() + i);
        const dateStr = showDate.toISOString().split("T")[0];
        const showNum = highestNum + i + 1;
        const showName = `${prefix} ${showNum}`;

        const existingShow = await storage.getEventByName(showName, workspaceId);
        if (existingShow) continue;

        const event = await storage.createEvent({
          name: showName,
          startDate: dateStr,
          endDate: dateStr,
          projectId,
          workspaceId,
        });

        for (const pa of projAssignments) {
          await storage.createAssignment({
            userId: pa.userId,
            eventName: event.name,
            workspaceId,
            position: pa.position || null,
          });
        }

        created.push(event);
      }

      res.status(201).json({ created: created.length, events: created });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to generate shows" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updated = await storage.updateProject(id, data);
    if (typeof data.archived === "boolean") {
      await storage.archiveEventsByProject(id, data.archived);
    }
    res.json(updated);
  });

  app.delete("/api/projects/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteProject(id);
    res.sendStatus(204);
  });

  // Travel Days
  app.get("/api/projects/:id/travel-days", isAuthenticated, async (req: any, res) => {
    const projectId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const project = await storage.getProject(projectId);
    if (!project || project.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    if (project.archived) return res.json([]);
    const days = await storage.getTravelDays(projectId);
    res.json(days);
  });

  app.post("/api/projects/:id/travel-days", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const projectId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const { date, notes, flightNumber, airline, departureAirport, arrivalAirport, departureTime, arrivalTime, legId } = req.body;
    if (!date) return res.status(400).json({ message: "Date is required" });
    const project = await storage.getProject(projectId);
    if (!project || project.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    if (project.archived) return res.status(400).json({ message: "Cannot add travel days to an archived project" });
    const day = await storage.createTravelDay({
      projectId, date, workspaceId,
      notes: notes || null,
      flightNumber: flightNumber || null,
      airline: airline || null,
      departureAirport: departureAirport || null,
      arrivalAirport: arrivalAirport || null,
      departureTime: departureTime || null,
      arrivalTime: arrivalTime || null,
      legId: legId ?? null,
    });
    res.status(201).json(day);
  });

  app.delete("/api/travel-days/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const [td] = await db.select().from(travelDays).where(eq(travelDays.id, id));
    if (!td) return res.status(404).json({ message: "Not found" });
    if (td.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteTravelDay(id);
    res.sendStatus(204);
  });

  // Crew Travel
  app.get("/api/travel-days/:id/crew", isAuthenticated, async (req: any, res) => {
    const travelDayId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const [td] = await db.select().from(travelDays).where(eq(travelDays.id, travelDayId));
    if (!td) return res.status(404).json({ message: "Not found" });
    if (td.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    const crew = await storage.getCrewTravel(travelDayId);
    res.json(crew);
  });

  app.post("/api/travel-days/:id/crew", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const travelDayId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const [td] = await db.select().from(travelDays).where(eq(travelDays.id, travelDayId));
    if (!td) return res.status(404).json({ message: "Not found" });
    if (td.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    const { userId, flightNumber, airline, departureAirport, arrivalAirport, departureTime, arrivalTime, hotelName, hotelAddress, hotelCheckIn, hotelCheckOut, groundTransport, notes } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const record = await storage.createCrewTravel({
      travelDayId, userId, workspaceId,
      flightNumber: flightNumber || null, airline: airline || null,
      departureAirport: departureAirport || null, arrivalAirport: arrivalAirport || null,
      departureTime: departureTime || null, arrivalTime: arrivalTime || null,
      hotelName: hotelName || null, hotelAddress: hotelAddress || null,
      hotelCheckIn: hotelCheckIn || null, hotelCheckOut: hotelCheckOut || null,
      groundTransport: groundTransport || null, notes: notes || null,
    });
    res.status(201).json(record);
  });

  app.post("/api/travel-days/:id/crew/bulk", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const travelDayId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const [td] = await db.select().from(travelDays).where(eq(travelDays.id, travelDayId));
    if (!td) return res.status(404).json({ message: "Not found" });
    if (td.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ message: "userIds array is required" });
    const existing = await storage.getCrewTravel(travelDayId);
    const existingUserIds = new Set(existing.map(ct => ct.userId));
    const newUserIds = userIds.filter((uid: string) => !existingUserIds.has(uid));
    if (newUserIds.length === 0) return res.json({ message: "All crew already added", created: [] });
    const records = newUserIds.map((uid: string) => ({
      travelDayId, userId: uid, workspaceId,
      flightNumber: null, airline: null,
      departureAirport: null, arrivalAirport: null,
      departureTime: null, arrivalTime: null,
      hotelName: null, hotelAddress: null,
      hotelCheckIn: null, hotelCheckOut: null,
      groundTransport: null, notes: null,
    }));
    const created = await storage.bulkCreateCrewTravel(records);
    res.status(201).json({ created });
  });

  app.patch("/api/crew-travel/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const [existing] = await db.select().from(crewTravel).where(eq(crewTravel.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    const updated = await storage.updateCrewTravel(id, req.body);
    res.json(updated);
  });

  app.delete("/api/crew-travel/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const [existing] = await db.select().from(crewTravel).where(eq(crewTravel.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteCrewTravel(id);
    res.sendStatus(204);
  });
}
