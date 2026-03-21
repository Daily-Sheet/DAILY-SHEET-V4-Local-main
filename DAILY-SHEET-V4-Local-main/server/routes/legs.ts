import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole } from "./utils";

export function registerLegRoutes(app: Express, upload: multer.Multer) {
  // List legs for a project
  app.get("/api/projects/:id/legs", isAuthenticated, async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.json([]);
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project || project.workspaceId !== workspaceId) return res.status(404).json({ message: "Project not found" });
      const result = await storage.getLegs(projectId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Create a leg (with optional show generation)
  app.post("/api/projects/:id/legs", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.workspaceId !== workspaceId) return res.status(403).json({ message: "Forbidden" });
      if (!project.isTour && !project.isFestival) return res.status(400).json({ message: "Legs are only available for tour or festival projects" });

      const { name, notes, sortOrder, showCount, startDate, endDate, stageCount, eventType } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });

      // Get next sortOrder if not provided
      const existingLegs = await storage.getLegs(projectId);
      const nextSort = sortOrder ?? (existingLegs.length > 0 ? Math.max(...existingLegs.map((l: any) => l.sortOrder ?? 0)) + 1 : 0);

      const leg = await storage.createLeg({
        name: name.trim(),
        projectId,
        workspaceId,
        sortOrder: nextSort,
        notes: notes || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      // Optionally generate shows/stages within this leg
      const createdEvents = [];
      const isFestival = project.isFestival ?? false;
      const genCount = isFestival ? (stageCount || 0) : (showCount || 0);

      if (genCount > 0 && genCount <= 100) {
        const existingEvents = await storage.getEvents(workspaceId);
        const existingForProject = existingEvents.filter((e: any) => e.projectId === projectId);
        const entityLabel = isFestival ? "Stage" : "Show";
        const prefix = `${name.trim()} - ${entityLabel}`;
        let highestNum = 0;
        for (const ev of existingForProject) {
          const match = ev.name.match(new RegExp(`${entityLabel}\\s+(\\d+)$`));
          if (match) highestNum = Math.max(highestNum, parseInt(match[1]));
        }

        const projAssignments = await storage.getProjectAssignments(projectId, workspaceId);
        const start = startDate ? new Date(startDate + "T00:00:00") : null;
        // For festivals: compute end date from start date + festival duration
        const endDateStr = isFestival && startDate && req.body.endDate ? req.body.endDate : null;

        for (let i = 0; i < genCount; i++) {
          const num = highestNum + i + 1;
          const eventName = `${prefix} ${num}`;

          const existing = await storage.getEventByName(eventName, workspaceId);
          if (existing) continue;

          let dateStr: string | undefined;
          let endStr: string | undefined;
          if (isFestival && start) {
            // Stages span the full festival date range
            dateStr = startDate;
            endStr = endDateStr || startDate;
          } else if (start) {
            const showDate = new Date(start);
            showDate.setDate(start.getDate() + i);
            dateStr = showDate.toISOString().split("T")[0];
            endStr = dateStr;
          }

          const event = await storage.createEvent({
            name: eventName,
            startDate: dateStr || null,
            endDate: endStr || null,
            projectId,
            workspaceId,
            legId: leg.id,
            eventType: isFestival ? (eventType || "stage") : "show",
          });

          for (const pa of projAssignments) {
            await storage.createAssignment({
              userId: pa.userId,
              eventName: event.name,
              workspaceId,
              position: pa.position || null,
            });
          }

          createdEvents.push(event);
        }
      }

      res.status(201).json({ leg, createdEvents });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create leg" });
    }
  });

  // Update a leg
  app.patch("/api/legs/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const legId = parseInt(req.params.id);
      const existingLegs = await storage.getLegs(0); // we need to verify ownership differently
      // Get the leg first to check ownership
      const allProjects = await storage.getProjects(workspaceId);
      const projectIds = new Set(allProjects.map((p: any) => p.id));

      // Find the leg by checking all tour projects
      let foundLeg = null;
      for (const p of allProjects) {
        const pLegs = await storage.getLegs(p.id);
        foundLeg = pLegs.find((l: any) => l.id === legId);
        if (foundLeg) break;
      }
      if (!foundLeg) return res.status(404).json({ message: "Leg not found" });

      const { name, notes, sortOrder, startDate, endDate } = req.body;
      const updated = await storage.updateLeg(legId, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to update leg" });
    }
  });

  // Delete a leg (shows become unassigned)
  app.delete("/api/legs/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const legId = parseInt(req.params.id);

      // Verify ownership
      const allProjects = await storage.getProjects(workspaceId);
      let foundLeg = null;
      for (const p of allProjects) {
        const pLegs = await storage.getLegs(p.id);
        foundLeg = pLegs.find((l: any) => l.id === legId);
        if (foundLeg) break;
      }
      if (!foundLeg) return res.status(404).json({ message: "Leg not found" });

      await storage.deleteLeg(legId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete leg" });
    }
  });
}
