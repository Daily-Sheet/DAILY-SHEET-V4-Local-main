import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { Resend } from "resend";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, pdfCache, storePdf } from "./utils";

const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Daily Sheet <noreply@daily-sheet.app>";

export function registerTimesheetRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/timesheet-entries", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
    const date = req.query.date as string | undefined;
    const entries = await storage.getTimesheetEntries(workspaceId, eventId, date);
    res.json(entries);
  });

  app.post("/api/timesheet-entries", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const entry = { ...req.body, workspaceId: req.user.workspaceId };
    const created = await storage.createTimesheetEntry(entry);
    res.status(201).json(created);
  });

  app.patch("/api/timesheet-entries/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateTimesheetEntry(id, req.body);
    res.json(updated);
  });

  app.delete("/api/timesheet-entries/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTimesheetEntry(id);
    res.sendStatus(204);
  });

  // Timesheet Summary
  app.get("/api/timesheet-entries/summary", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      let entries: any[] = [];
      if (projectId) {
        const allEvents = await storage.getEvents(workspaceId);
        const projectEvents = allEvents.filter(e => e.projectId === projectId);
        const eventIds = projectEvents.map(e => e.id);
        entries = await storage.getTimesheetEntriesByEventIds(eventIds, startDate, endDate);
      } else if (startDate && endDate) {
        entries = await storage.getTimesheetEntriesByDateRange(workspaceId, startDate, endDate);
      } else {
        entries = await storage.getTimesheetEntries(workspaceId);
      }

      const grouped = new Map<string, { positions: Set<string>; totalHours: number; daysWorked: Set<string> }>();
      for (const entry of entries) {
        const name = entry.employeeName || "Unknown";
        if (!grouped.has(name)) {
          grouped.set(name, { positions: new Set(), totalHours: 0, daysWorked: new Set() });
        }
        const g = grouped.get(name)!;
        if (entry.position) g.positions.add(entry.position);
        if (entry.date) g.daysWorked.add(entry.date);
        if (entry.totalHours) {
          const parts = entry.totalHours.split(":");
          const hrs = parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
          if (!isNaN(hrs)) g.totalHours += hrs;
        }
      }

      const summary = Array.from(grouped.entries()).map(([name, data]) => ({
        employeeName: name,
        positions: Array.from(data.positions).join(", "),
        totalHours: Math.round(data.totalHours * 100) / 100,
        daysWorked: data.daysWorked.size,
      })).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

      const totalAllHours = Math.round(summary.reduce((s, r) => s + r.totalHours, 0) * 100) / 100;
      res.json({ summary, totalAllHours });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Timesheet PDF
  app.post("/api/timesheet/preview", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const { generateTimesheetPdf } = await import("../timesheetPdfGenerator");
      const workspaceId = req.user.workspaceId;
      const { eventId, date } = req.body;

      const entries = await storage.getTimesheetEntries(workspaceId, eventId ? parseInt(eventId) : undefined, date || undefined);
      const event = eventId ? (await storage.getEvents(workspaceId)).find(e => e.id === parseInt(eventId)) : null;

      const allProjects = await storage.getProjects(workspaceId);
      const project = event?.projectId ? allProjects.find(p => p.id === event.projectId) : null;

      const ws = await storage.getWorkspace(workspaceId);

      const pdfBuffer = await generateTimesheetPdf({
        orgName: ws?.name || "Organization",
        showName: event?.name || "All Shows",
        projectName: project?.name,
        projectNumber: project?.projectNumber || undefined,
        rows: entries.map(e => ({
          date: e.date,
          employeeName: e.employeeName,
          position: e.position || "",
          timeIn: e.timeIn || "",
          mealBreakOut: e.mealBreakOut || "",
          mealBreakIn: e.mealBreakIn || "",
          timeOut: e.timeOut || "",
          paidMealBreak: e.paidMealBreak !== false,
          totalHours: e.totalHours || "",
          initials: e.initials || "",
        })),
      });

      const pdfToken = storePdf(pdfBuffer);
      res.json({ pdfToken });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate timesheet PDF" });
    }
  });

  app.get("/api/timesheet/pdf/:token", (req, res) => {
    const entry = pdfCache.get(req.params.token);
    if (!entry || entry.expiresAt < Date.now()) {
      pdfCache.delete(req.params.token);
      return res.status(404).json({ message: "PDF expired or not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=\"timesheet.pdf\"");
    res.setHeader("Content-Length", entry.buffer.length.toString());
    res.send(entry.buffer);
  });

  app.post("/api/timesheet/send", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const { generateTimesheetPdf } = await import("../timesheetPdfGenerator");
      const workspaceId = req.user.workspaceId;
      const { eventId, date, emails } = req.body;

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: "At least one email address is required" });
      }

      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ message: "Email service not configured" });
      }

      const entries = await storage.getTimesheetEntries(workspaceId, eventId ? parseInt(eventId) : undefined, date || undefined);
      const event = eventId ? (await storage.getEvents(workspaceId)).find(e => e.id === parseInt(eventId)) : null;

      const allProjects = await storage.getProjects(workspaceId);
      const project = event?.projectId ? allProjects.find(p => p.id === event.projectId) : null;

      const ws = await storage.getWorkspace(workspaceId);
      const orgName = ws?.name || "Organization";

      const pdfBuffer = await generateTimesheetPdf({
        orgName,
        showName: event?.name || "All Shows",
        projectName: project?.name,
        projectNumber: project?.projectNumber || undefined,
        rows: entries.map(e => ({
          date: e.date,
          employeeName: e.employeeName,
          position: e.position || "",
          timeIn: e.timeIn || "",
          mealBreakOut: e.mealBreakOut || "",
          mealBreakIn: e.mealBreakIn || "",
          timeOut: e.timeOut || "",
          paidMealBreak: e.paidMealBreak !== false,
          totalHours: e.totalHours || "",
          initials: e.initials || "",
        })),
      });

      const showLabel = event?.name || "Time Sheet";
      const pdfFilename = `timesheet-${(event?.name || "all").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      const resend = new Resend(process.env.RESEND_API_KEY);
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 600));
        try {
          const r = await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: email,
            subject: `${orgName} – Time Sheet: ${showLabel}`,
            text: `Please find attached the time sheet for ${showLabel}.`,
            attachments: [{
              filename: pdfFilename,
              content: pdfBuffer,
              contentType: "application/pdf",
            }],
          });
          if (r.error) {
            results.push({ email, success: false, error: r.error.message });
          } else {
            results.push({ email, success: true });
          }
        } catch (err: any) {
          results.push({ email, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      res.json({ message: `Time sheet sent to ${successCount}/${emails.length} recipient(s)`, recipientCount: successCount, results });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to send timesheet" });
    }
  });
}
