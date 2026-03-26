import type { Express } from "express";
import type multer from "multer";
import { db } from "../db";
import { afterJobReports, events } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, storePdf, pdfCache, logActivity } from "./utils";
import { Resend } from "resend";
import { generateAfterJobReportPdf } from "../afterJobReportPdf";
import { saveFile } from "../fileStorage";
import { storage } from "../storage";

const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Daily Sheet <noreply@daily-sheet.app>";

export function registerAfterJobReportRoutes(app: Express, upload: multer.Multer) {
  // Check if report exists for an event
  app.get("/api/after-job-reports/event/:eventId", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const eventId = Number(req.params.eventId);
      if (!eventId || isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });

      const [report] = await db
        .select()
        .from(afterJobReports)
        .where(and(eq(afterJobReports.eventId, eventId), eq(afterJobReports.workspaceId, workspaceId)));

      res.json({ exists: !!report, report: report || null });
    } catch (error: any) {
      console.error("Get after job report error:", error);
      res.status(500).json({ message: error.message || "Failed to get report" });
    }
  });

  // Create report
  app.post("/api/after-job-reports", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const { eventId, ...data } = req.body;
      if (!eventId) return res.status(400).json({ message: "eventId is required" });

      // Check if report already exists
      const [existing] = await db
        .select()
        .from(afterJobReports)
        .where(and(eq(afterJobReports.eventId, eventId), eq(afterJobReports.workspaceId, workspaceId)));
      if (existing) return res.status(409).json({ message: "Report already exists for this event" });

      // Get event info for project_id
      const [event] = await db.select().from(events).where(eq(events.id, eventId));
      if (!event) return res.status(404).json({ message: "Event not found" });

      const submitterName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";

      const [report] = await db.insert(afterJobReports).values({
        eventId,
        projectId: event.projectId,
        workspaceId,
        submittedBy: user.id,
        submittedByName: submitterName,
        rating: data.rating ?? null,
        wentAsPlanned: data.wentAsPlanned ?? null,
        summary: data.summary || null,
        issueCategory: data.issueCategory || null,
        issueDescription: data.issueDescription || null,
        hadInjuries: data.hadInjuries || false,
        injuryDescription: data.injuryDescription || null,
        hadEquipmentIssues: data.hadEquipmentIssues || false,
        equipmentDescription: data.equipmentDescription || null,
        hadUnplannedExpenses: data.hadUnplannedExpenses || false,
        expenseAmount: data.expenseAmount || null,
        expenseDescription: data.expenseDescription || null,
        expenseReceiptUrl: data.expenseReceiptUrl || null,
        attendanceEstimate: data.attendanceEstimate ?? null,
        clientNotes: data.clientNotes || null,
        venueNotes: data.venueNotes || null,
      }).returning();

      // Log activity
      logActivity(
        user.id, submitterName, "after_job_report", "created",
        "After Job Report", `Filed after job report for ${event.name}`,
        workspaceId, event.name,
      ).catch(err => console.error("Activity log error:", err));

      res.status(201).json(report);
    } catch (error: any) {
      console.error("Create after job report error:", error);
      res.status(500).json({ message: error.message || "Failed to create report" });
    }
  });

  // Preview report PDF
  app.post("/api/after-job-reports/preview", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const { eventId, formData } = req.body;
      if (!eventId) return res.status(400).json({ message: "eventId is required" });

      const [event] = await db.select().from(events).where(eq(events.id, eventId));
      if (!event) return res.status(404).json({ message: "Event not found" });

      const allVenues = await storage.getAllVenues();
      const venue = event.venueId ? allVenues.find(v => v.id === event.venueId) : null;

      const allProjects = await storage.getProjects(workspaceId);
      const project = event.projectId ? allProjects.find(p => p.id === event.projectId) : null;

      const submitterName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";

      const pdfData = {
        eventName: event.name,
        eventDate: event.startDate || "",
        venueName: venue?.name || "",
        venueAddress: venue?.address || "",
        projectName: project?.name || "",
        submittedBy: submitterName,
        ...formData,
      };

      const pdfBuffer = await generateAfterJobReportPdf(pdfData);
      const pdfToken = storePdf(pdfBuffer);

      // Get suggested recipients (crew assigned to this event + project manager)
      const allContacts = await storage.getContacts(workspaceId);
      const assignments = await storage.getAllAssignments(workspaceId);
      const eventAssignedUserIds = new Set(
        assignments.filter(a => a.eventName === event.name).map(a => a.userId)
      );
      const recipients = allContacts
        .filter(c => c.email && c.email.includes("@") && c.userId && eventAssignedUserIds.has(c.userId))
        .map(c => ({ id: c.id, name: [c.firstName, c.lastName].filter(Boolean).join(" "), email: c.email!, role: c.role }));

      res.json({ pdfToken, recipients });
    } catch (error: any) {
      console.error("Preview after job report error:", error);
      res.status(500).json({ message: error.message || "Failed to generate preview" });
    }
  });

  // Send report via email
  app.post("/api/after-job-reports/:id/send", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const reportId = Number(req.params.id);
      if (!reportId || isNaN(reportId)) return res.status(400).json({ message: "Invalid report ID" });

      const [report] = await db.select().from(afterJobReports).where(eq(afterJobReports.id, reportId));
      if (!report) return res.status(404).json({ message: "Report not found" });

      const [event] = await db.select().from(events).where(eq(events.id, report.eventId));
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ message: "Email service not configured" });
      }

      const { selectedEmails } = req.body;
      const allEmails: string[] = Array.isArray(selectedEmails)
        ? Array.from(new Set(selectedEmails.filter((e: any) => typeof e === "string" && e.includes("@"))))
        : [];

      if (allEmails.length === 0) {
        return res.status(400).json({ message: "No recipients selected" });
      }

      // Generate PDF
      const allVenues = await storage.getAllVenues();
      const venue = event.venueId ? allVenues.find(v => v.id === event.venueId) : null;
      const allProjects = await storage.getProjects(workspaceId);
      const project = event.projectId ? allProjects.find(p => p.id === event.projectId) : null;

      const pdfData = {
        eventName: event.name,
        eventDate: event.startDate || "",
        venueName: venue?.name || "",
        venueAddress: venue?.address || "",
        projectName: project?.name || "",
        submittedBy: report.submittedByName || "Unknown",
        rating: report.rating,
        wentAsPlanned: report.wentAsPlanned,
        summary: report.summary,
        issueCategory: report.issueCategory,
        issueDescription: report.issueDescription,
        hadInjuries: report.hadInjuries,
        injuryDescription: report.injuryDescription,
        hadEquipmentIssues: report.hadEquipmentIssues,
        equipmentDescription: report.equipmentDescription,
        hadUnplannedExpenses: report.hadUnplannedExpenses,
        expenseAmount: report.expenseAmount,
        expenseDescription: report.expenseDescription,
        attendanceEstimate: report.attendanceEstimate,
        clientNotes: report.clientNotes,
        venueNotes: report.venueNotes,
      };

      const pdfBuffer = await generateAfterJobReportPdf(pdfData);

      // Save PDF to file storage
      const safeEventName = event.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `after-job-reports/${safeEventName}_${event.startDate || "unknown"}_${Date.now()}.pdf`;
      const pdfUrl = await saveFile(fileName, pdfBuffer);

      // Update report with PDF URL
      await db.update(afterJobReports).set({ pdfUrl }).where(eq(afterJobReports.id, reportId));

      // Send emails
      const pdfFilename = `After_Job_Report_${safeEventName}_${event.startDate || ""}.pdf`;
      const subject = `After Job Report - ${event.name}${event.startDate ? ` (${event.startDate})` : ""}`;

      const resend = new Resend(process.env.RESEND_API_KEY);
      const results: Array<{ email: string; success: boolean; error?: string }> = [];

      for (let i = 0; i < allEmails.length; i++) {
        const email = allEmails[i];
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 600));
        try {
          const r = await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: email,
            subject,
            html: buildReportEmailHtml(pdfData, event.name),
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
      res.json({ message: `Sent to ${successCount} of ${allEmails.length} recipients`, results, pdfUrl });

      const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";
      logActivity(
        user.id, actorName, "after_job_report", "sent",
        "After Job Report", `Sent after job report for ${event.name} to ${allEmails.length} recipients`,
        workspaceId, event.name,
      ).catch(err => console.error("Activity log error:", err));
    } catch (error: any) {
      console.error("Send after job report error:", error);
      res.status(500).json({ message: error.message || "Failed to send report" });
    }
  });

  // Get PDF by token (reuses pdfCache from utils)
  app.get("/api/after-job-reports/pdf/:token", (req, res) => {
    const entry = pdfCache.get(req.params.token);
    if (!entry || entry.expiresAt < Date.now()) {
      pdfCache.delete(req.params.token);
      return res.status(404).json({ message: "PDF expired or not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=\"after-job-report.pdf\"");
    res.setHeader("Content-Length", entry.buffer.length.toString());
    res.send(entry.buffer);
  });
}

function buildReportEmailHtml(data: any, eventName: string): string {
  const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ratingStars = data.rating ? "★".repeat(data.rating) + "☆".repeat(5 - data.rating) : "N/A";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:680px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="margin:0;font-size:24px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#1e293b;">After Job Report</h1>
    <p style="margin:4px 0 0;font-size:16px;color:#334155;">${escHtml(eventName)}</p>
    ${data.eventDate ? `<p style="margin:4px 0 0;font-size:14px;color:#64748b;">${escHtml(data.eventDate)}</p>` : ""}
    <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Submitted by ${escHtml(data.submittedBy)}</p>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Overview</h3>
      ${data.projectName ? `<p style="margin:4px 0;font-size:13px;"><strong>Project:</strong> ${escHtml(data.projectName)}</p>` : ""}
      ${data.venueName ? `<p style="margin:4px 0;font-size:13px;"><strong>Venue:</strong> ${escHtml(data.venueName)}${data.venueAddress ? ` — ${escHtml(data.venueAddress)}` : ""}</p>` : ""}
      <p style="margin:4px 0;font-size:13px;"><strong>Rating:</strong> ${ratingStars}</p>
      <p style="margin:4px 0;font-size:13px;"><strong>Went as planned:</strong> ${data.wentAsPlanned === true ? "Yes" : data.wentAsPlanned === false ? "No" : "N/A"}</p>
      ${data.attendanceEstimate ? `<p style="margin:4px 0;font-size:13px;"><strong>Attendance:</strong> ~${data.attendanceEstimate}</p>` : ""}
    </td></tr>
  </table>

  ${data.summary ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Summary</h3>
      <p style="margin:0;font-size:13px;white-space:pre-wrap;">${escHtml(data.summary)}</p>
    </td></tr>
  </table>` : ""}

  ${data.wentAsPlanned === false ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:8px;border:1px solid #fecaca;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Issues</h3>
      ${data.issueCategory ? `<p style="margin:4px 0;font-size:13px;"><strong>Category:</strong> ${escHtml(data.issueCategory)}</p>` : ""}
      ${data.issueDescription ? `<p style="margin:4px 0;font-size:13px;white-space:pre-wrap;">${escHtml(data.issueDescription)}</p>` : ""}
    </td></tr>
  </table>` : ""}

  ${data.hadInjuries ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:8px;border:1px solid #fecaca;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Injuries Reported</h3>
      ${data.injuryDescription ? `<p style="margin:0;font-size:13px;white-space:pre-wrap;">${escHtml(data.injuryDescription)}</p>` : ""}
    </td></tr>
  </table>` : ""}

  ${data.hadEquipmentIssues ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:8px;border:1px solid #fde68a;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Equipment Issues</h3>
      ${data.equipmentDescription ? `<p style="margin:0;font-size:13px;white-space:pre-wrap;">${escHtml(data.equipmentDescription)}</p>` : ""}
    </td></tr>
  </table>` : ""}

  ${data.hadUnplannedExpenses ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:8px;border:1px solid #fde68a;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Unplanned Expenses</h3>
      ${data.expenseAmount ? `<p style="margin:4px 0;font-size:13px;"><strong>Amount:</strong> $${escHtml(data.expenseAmount)}</p>` : ""}
      ${data.expenseDescription ? `<p style="margin:4px 0;font-size:13px;white-space:pre-wrap;">${escHtml(data.expenseDescription)}</p>` : ""}
    </td></tr>
  </table>` : ""}

  ${data.clientNotes ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Client / Venue Contact Notes</h3>
      <p style="margin:0;font-size:13px;white-space:pre-wrap;">${escHtml(data.clientNotes)}</p>
    </td></tr>
  </table>` : ""}

  ${data.venueNotes ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;">
    <tr><td style="padding:16px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Venue Notes for Next Time</h3>
      <p style="margin:0;font-size:13px;white-space:pre-wrap;">${escHtml(data.venueNotes)}</p>
    </td></tr>
  </table>` : ""}

  <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;">
    <p style="font-size:11px;color:#94a3b8;">Generated by Daily Sheet</p>
  </div>
</div>
</body></html>`;
}
