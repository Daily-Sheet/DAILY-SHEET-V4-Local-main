import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { db } from "../db";
import { contacts, eventAssignments, dailyCheckins, gearRequests } from "@shared/schema";
import { workspaces } from "@shared/models/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";
import { generateGearRequestPdf } from "../gearRequestPdfGenerator";
import { saveFile } from "../fileStorage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole } from "./utils";
import crypto from "crypto";

const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Daily Sheet <noreply@daily-sheet.app>";

export function registerAccessRoutes(app: Express, upload: multer.Multer) {
  app.post("/api/access-links", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace" });
      const { contactId, eventName, projectId, expiresAt } = req.body;
      if (!contactId || !expiresAt) return res.status(400).json({ message: "contactId and expiresAt are required" });
      if (!eventName && !projectId) return res.status(400).json({ message: "Either eventName or projectId is required" });

      const wsContacts = await storage.getContacts(workspaceId);
      const contact = wsContacts.find(c => c.id === contactId);
      if (!contact) return res.status(404).json({ message: "Contact not found in your workspace" });

      if (eventName) {
        const wsEvents = await storage.getEvents(workspaceId);
        const event = wsEvents.find(e => e.name === eventName);
        if (!event) return res.status(404).json({ message: "Event not found in your workspace" });
      }
      if (projectId) {
        const project = await storage.getProject(projectId);
        if (!project || project.workspaceId !== workspaceId) return res.status(404).json({ message: "Project not found in your workspace" });
      }

      const token = crypto.randomBytes(24).toString("hex");
      const link = await storage.createAccessLink({
        token,
        contactId,
        workspaceId,
        eventName: eventName || null,
        projectId: projectId || null,
        expiresAt: new Date(expiresAt),
        createdBy: req.user.id,
        revoked: false,
      });
      res.json(link);
    } catch (err) {
      console.error("Failed to create access link:", err);
      res.status(500).json({ message: "Failed to create access link" });
    }
  });

  app.get("/api/access-links/contact/:contactId", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace" });
      const contactId = parseInt(req.params.contactId);
      if (isNaN(contactId)) return res.status(400).json({ message: "Invalid contact ID" });
      const links = await storage.getAccessLinksByContact(contactId, workspaceId);
      res.json(links);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch access links" });
    }
  });

  app.delete("/api/access-links/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace" });
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const result = await storage.revokeAccessLink(id, workspaceId);
      if (!result) return res.status(404).json({ message: "Link not found" });
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Failed to revoke access link" });
    }
  });

  app.get("/api/access/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      if (!token) return res.status(400).json({ message: "Token required" });
      const link = await storage.getAccessLinkByToken(token);
      if (!link) return res.status(404).json({ message: "Link not found" });
      if (link.revoked) return res.status(410).json({ message: "This link has been revoked" });
      if (new Date(link.expiresAt) < new Date()) return res.status(410).json({ message: "This link has expired" });

      const [contact] = await db.select().from(contacts).where(eq(contacts.id, link.contactId));
      const allSchedules = await storage.getSchedules(link.workspaceId);
      const allEvents = await storage.getEvents(link.workspaceId);
      const allVenues = await storage.getAllVenues();

      let scopedEvents: typeof allEvents = [];
      if (link.projectId) {
        scopedEvents = allEvents.filter(e => e.projectId === link.projectId);
      } else if (link.eventName) {
        const ev = allEvents.find(e => e.name === link.eventName);
        if (ev) scopedEvents = [ev];
      }

      const scopedEventNames = new Set(scopedEvents.map(e => e.name));
      const eventSchedules = allSchedules.filter(s => s.eventName != null && scopedEventNames.has(s.eventName));

      let venue = null;
      const primaryEvent = scopedEvents[0];
      if (primaryEvent?.venueId) {
        venue = await storage.getVenue(primaryEvent.venueId);
      }

      let allDayVenues: any[] = [];
      for (const ev of scopedEvents) {
        const dvs = await storage.getEventDayVenues(ev.id);
        allDayVenues.push(...dvs);
      }

      let assignments: any[] = [];
      let checkins: any[] = [];
      if (contact?.userId) {
        const allAssignments = await db.select().from(eventAssignments)
          .where(and(eq(eventAssignments.userId, contact.userId), eq(eventAssignments.workspaceId, link.workspaceId)));
        assignments = allAssignments.filter(a => scopedEventNames.has(a.eventName));

        for (const eName of Array.from(scopedEventNames)) {
          const dailyCheckinRecords = await db.select().from(dailyCheckins)
            .where(and(eq(dailyCheckins.userId, contact.userId), eq(dailyCheckins.eventName, eName), eq(dailyCheckins.workspaceId, link.workspaceId)));
          checkins.push(...dailyCheckinRecords);
        }
      }

      res.json({
        eventName: link.eventName || (scopedEvents.length > 0 ? scopedEvents[0].name : null),
        projectId: link.projectId || null,
        expiresAt: link.expiresAt,
        contact: contact ? { id: contact.id, firstName: contact.firstName, lastName: contact.lastName, role: contact.role, userId: contact.userId || null } : null,
        events: scopedEvents.map(e => ({ id: e.id, name: e.name, startDate: e.startDate, endDate: e.endDate, venueId: e.venueId })),
        event: primaryEvent ? { name: primaryEvent.name, startDate: primaryEvent.startDate, endDate: primaryEvent.endDate, venueId: primaryEvent.venueId } : null,
        schedules: eventSchedules,
        venue: venue || null,
        dayVenues: allDayVenues.map(dv => ({
          ...dv,
          venue: allVenues.find(v => v.id === dv.venueId) || null,
        })),
        assignments,
        checkins,
      });
    } catch (err) {
      console.error("Failed to fetch access link data:", err);
      res.status(500).json({ message: "Failed to load access link" });
    }
  });

  app.post("/api/access/:token/checkin", async (req: any, res) => {
    try {
      const { token } = req.params;
      const link = await storage.getAccessLinkByToken(token);
      if (!link) return res.status(404).json({ message: "Link not found" });
      if (link.revoked) return res.status(410).json({ message: "This link has been revoked" });
      if (new Date(link.expiresAt) < new Date()) return res.status(410).json({ message: "This link has expired" });

      const [contact] = await db.select().from(contacts).where(eq(contacts.id, link.contactId));
      if (!contact?.userId) return res.status(403).json({ message: "No user account linked" });

      const { eventName, date } = req.body;
      if (!eventName || !date) return res.status(400).json({ message: "eventName and date required" });

      const allEvents = await storage.getEvents(link.workspaceId);
      let scopedEventNames: Set<string>;
      if (link.projectId) {
        scopedEventNames = new Set(allEvents.filter(e => e.projectId === link.projectId).map(e => e.name));
      } else if (link.eventName) {
        scopedEventNames = new Set([link.eventName]);
      } else {
        return res.status(400).json({ message: "Invalid link scope" });
      }

      if (!scopedEventNames.has(eventName)) return res.status(403).json({ message: "Event not in link scope" });

      const userAssignments = await db.select().from(eventAssignments)
        .where(and(eq(eventAssignments.userId, contact.userId), eq(eventAssignments.eventName, eventName), eq(eventAssignments.workspaceId, link.workspaceId)));
      const hasAssignment = userAssignments.some(a => !a.date || a.date === date);
      if (!hasAssignment) return res.status(403).json({ message: "Not assigned to this event" });

      const checkin = await storage.upsertDailyCheckin({ userId: contact.userId, eventName, date, workspaceId: link.workspaceId });
      res.json(checkin);
    } catch (err) {
      console.error("Failed to check in via access link:", err);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post("/api/access/:token/checkout", async (req: any, res) => {
    try {
      const { token } = req.params;
      const link = await storage.getAccessLinkByToken(token);
      if (!link) return res.status(404).json({ message: "Link not found" });
      if (link.revoked) return res.status(410).json({ message: "This link has been revoked" });
      if (new Date(link.expiresAt) < new Date()) return res.status(410).json({ message: "This link has expired" });

      const [contact] = await db.select().from(contacts).where(eq(contacts.id, link.contactId));
      if (!contact?.userId) return res.status(403).json({ message: "No user account linked" });

      const { checkinId } = req.body;
      if (!checkinId) return res.status(400).json({ message: "checkinId required" });

      const [existing] = await db.select().from(dailyCheckins).where(eq(dailyCheckins.id, checkinId));
      if (!existing || existing.workspaceId !== link.workspaceId) return res.status(404).json({ message: "Checkin not found" });
      if (existing.userId !== contact.userId) return res.status(403).json({ message: "Not authorized" });

      const allEvents = await storage.getEvents(link.workspaceId);
      let scopedEventNames: Set<string>;
      if (link.projectId) {
        scopedEventNames = new Set(allEvents.filter(e => e.projectId === link.projectId).map(e => e.name));
      } else if (link.eventName) {
        scopedEventNames = new Set([link.eventName]);
      } else {
        return res.status(400).json({ message: "Invalid link scope" });
      }
      if (!scopedEventNames.has(existing.eventName)) return res.status(403).json({ message: "Checkin not in link scope" });

      const checkin = await storage.checkOutDaily(checkinId);
      res.json(checkin);
    } catch (err) {
      console.error("Failed to check out via access link:", err);
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  // Gear Requests
  app.get("/api/gear-requests/:eventId", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const eventId = parseInt(req.params.eventId);
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const requests = await storage.getGearRequests(eventId, workspaceId);
    res.json(requests);
  });

  const gearRequestBodySchema = z.object({
    eventId: z.number().int().positive(),
    recipientEmail: z.string().email(),
    items: z.string().min(1),
    notes: z.string().nullable().optional(),
  });

  app.post("/api/gear-requests", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace" });

      const parsed = gearRequestBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const { eventId, recipientEmail, items, notes } = parsed.data;

      const ev = await storage.getEvent(eventId);
      if (!ev || ev.workspaceId !== workspaceId) {
        return res.status(404).json({ message: "Show not found" });
      }

      const requesterName = `${req.user.firstName} ${req.user.lastName}`.trim();
      const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
      const orgName = ws?.name || "Daily Sheet";

      let venueName: string | undefined;
      if (ev.venueId) {
        const venue = await storage.getVenue(ev.venueId);
        venueName = venue?.name;
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const timestampStr = now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

      const pdfBuffer = await generateGearRequestPdf({
        orgName,
        showName: ev.name,
        venueName,
        date: dateStr,
        requestedByName: requesterName,
        department: req.user.department || undefined,
        recipientEmail,
        items: items.trim(),
        notes: notes?.trim() || undefined,
        timestamp: timestampStr,
      });

      const fileName = `Gear_Request_${ev.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;
      const url = await saveFile(fileName, pdfBuffer);

      const fileRecord = await storage.createFile({
        name: `Gear Request - ${requesterName} - ${timestampStr}`,
        url,
        type: "application/pdf",
        size: pdfBuffer.length,
        eventName: ev.name,
        folderName: "Gear Requests",
        workspaceId,
      });

      const gearRequest = await storage.createGearRequest({
        eventId,
        workspaceId,
        requestedBy: req.user.id,
        requestedByName: requesterName,
        recipientEmail,
        items: items.trim(),
        notes: notes?.trim() || null,
        status: "sent",
        fileId: fileRecord.id,
      });

      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff;">
            <div style="background: #1e293b; padding: 20px 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Gear Request</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0;">${esc(orgName)} · ${esc(ev.name)}</p>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
                <tr><td style="color: #64748b; padding: 4px 0; width: 120px;">Show</td><td style="font-weight: 600;">${esc(ev.name)}</td></tr>
                ${venueName ? `<tr><td style="color: #64748b; padding: 4px 0;">Venue</td><td>${esc(venueName)}</td></tr>` : ""}
                <tr><td style="color: #64748b; padding: 4px 0;">Requested By</td><td>${esc(requesterName)}${req.user.department ? ` · ${esc(req.user.department)}` : ""}</td></tr>
                <tr><td style="color: #64748b; padding: 4px 0;">Date</td><td>${dateStr}</td></tr>
              </table>
              <h2 style="font-size: 16px; color: #1e293b; margin: 0 0 12px;">Items Requested</h2>
              <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${esc(items.trim())}</div>
              ${notes?.trim() ? `
                <h2 style="font-size: 16px; color: #1e293b; margin: 20px 0 12px;">Notes</h2>
                <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${esc(notes.trim())}</div>
              ` : ""}
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: right;">Sent via Daily Sheet · ${timestampStr}</p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: recipientEmail,
          subject: `Gear Request: ${ev.name} — ${requesterName}`,
          html: emailHtml,
          attachments: [{
            filename: `Gear_Request_${ev.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            content: pdfBuffer.toString("base64"),
          }],
        });
      }

      res.status(201).json(gearRequest);
    } catch (error: any) {
      console.error("[gear-request] Error:", error?.message || error);
      res.status(500).json({ message: "Failed to create gear request" });
    }
  });
}
