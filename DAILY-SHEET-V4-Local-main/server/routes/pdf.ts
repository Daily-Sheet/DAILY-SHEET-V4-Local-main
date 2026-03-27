import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { inArray } from "drizzle-orm";
import { Resend } from "resend";
import { generateDailySheetPdf } from "../pdfGenerator";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, pdfCache, storePdf, getCrewUserIdsForEvent, notifyUsers, logActivity } from "./utils";

const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Daily Sheet <noreply@daily-sheet.app>";

async function buildDailySheetData(workspaceId: number, date: string, eventNames: string[], userTimezone: string, senderName: string) {
  const [allSchedules, allContacts, allEvents, allVenues, dayVenues, allZones, allProjects, allSections, allAssignments] = await Promise.all([
    storage.getSchedules(workspaceId),
    storage.getContacts(workspaceId),
    storage.getEvents(workspaceId),
    storage.getAllVenues(),
    storage.getAllEventDayVenues(workspaceId),
    storage.getZones(workspaceId),
    storage.getProjects(workspaceId),
    storage.getSections(workspaceId),
    storage.getAllAssignments(workspaceId),
  ]);

  const requestedSet = new Set(eventNames);
  const shows = allEvents.filter(ev => requestedSet.has(ev.name));
  if (shows.length === 0) throw new Error("No matching shows found in this workspace");

  const daySchedules = allSchedules
    .filter(s => {
      const itemDate = s.eventDate || (s.startTime ? new Date(s.startTime).toISOString().split("T")[0] : null);
      return itemDate === date && (!s.eventName || requestedSet.has(s.eventName));
    })
    .sort((a, b) => {
      const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, minute: "numeric", timeZone: userTimezone });
      const partsA = fmt.formatToParts(new Date(a.startTime));
      const partsB = fmt.formatToParts(new Date(b.startTime));
      const hourA = Number(partsA.find(p => p.type === "hour")?.value || 0);
      const minA = Number(partsA.find(p => p.type === "minute")?.value || 0);
      const hourB = Number(partsB.find(p => p.type === "hour")?.value || 0);
      const minB = Number(partsB.find(p => p.type === "minute")?.value || 0);
      return (hourA * 60 + minA) - (hourB * 60 + minB);
    });

  const allShowNames = new Set(shows.map(s => s.name));
  daySchedules.forEach(s => { if (s.eventName) allShowNames.add(s.eventName); });

  const assignedUserIdsByShow = new Map<string, Set<string>>();
  for (const a of allAssignments) {
    if (allShowNames.has(a.eventName)) {
      if (!assignedUserIdsByShow.has(a.eventName)) assignedUserIdsByShow.set(a.eventName, new Set());
      assignedUserIdsByShow.get(a.eventName)!.add(a.userId);
    }
  }
  const allAssignedUserIds = new Set<string>();
  assignedUserIdsByShow.forEach(ids => ids.forEach(id => allAssignedUserIds.add(id)));

  const recipients = allContacts.filter(c =>
    c.email && c.email.includes("@") &&
    c.userId && allAssignedUserIds.has(c.userId)
  );
  const contactEmails = recipients.map(c => c.email!);

  const assignedIdArr = Array.from(allAssignedUserIds);
  const assignedUsers = assignedIdArr.length > 0
    ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, assignedIdArr))
    : [];
  const userEmails = assignedUsers
    .filter(u => u.email && u.email.includes("@"))
    .map(u => u.email!);

  const uniqueEmails = Array.from(new Set([...contactEmails, ...userEmails]));

  const fmtDate = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };
  const fmtTime = (ts: string | Date) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: userTimezone });
  };
  const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const orphanedNames = new Set<string>();
  daySchedules.forEach(s => {
    if (s.eventName && !shows.find(sh => sh.name === s.eventName)) orphanedNames.add(s.eventName);
  });
  const allShowSections = [
    ...shows.map(s => ({ name: s.name, eventId: s.id, venueId: s.venueId })),
    ...Array.from(orphanedNames).map(name => ({ name, eventId: null as number | null, venueId: null as number | null })),
  ];

  let showSections = "";
  for (const show of allShowSections) {
    const dayVenueEntry = show.eventId ? dayVenues.find(dv => dv.eventId === show.eventId && dv.date === date) : null;
    const resolvedVenueId = dayVenueEntry ? dayVenueEntry.venueId : show.venueId;
    const venue = resolvedVenueId ? allVenues.find(v => v.id === resolvedVenueId) : null;
    const items = daySchedules.filter(s => s.eventName === show.name);
    const showUserIds = assignedUserIdsByShow.get(show.name) || new Set();
    const crew = allContacts.filter(c => c.userId && showUserIds.has(c.userId));
    const showEvent = show.eventId ? allEvents.find(ev => ev.id === show.eventId) : null;
    const showProjectName = showEvent?.projectId ? allProjects.find(p => p.id === showEvent.projectId)?.name : null;

    showSections += `
    <div style="margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;color:#ffffff;border-radius:8px;margin-bottom:12px;">
        <tr><td style="padding:16px;">
          <h2 style="margin:0;font-size:18px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">${escHtml(show.name)}${showProjectName ? ` <span style="font-size:13px;font-weight:normal;opacity:0.6;text-transform:none;letter-spacing:normal;">(${escHtml(showProjectName)})</span>` : ""}</h2>
          ${venue ? `<p style="margin:4px 0 0;font-size:13px;opacity:0.85;">${escHtml(venue.name)}${venue.address ? ` &mdash; ${escHtml(venue.address)}` : ""}</p>` : ""}
          ${venue?.contactName ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Venue Contact: ${escHtml(venue.contactName)}${venue.contactPhone ? ` (${escHtml(venue.contactPhone)})` : ""}</p>` : ""}
          ${venue?.wifiSsid ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">WiFi: ${escHtml(venue.wifiSsid)}${venue.wifiPassword ? ` / ${escHtml(venue.wifiPassword)}` : ""}</p>` : ""}
          ${venue?.parking ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Parking: ${escHtml(venue.parking)}</p>` : ""}
          ${venue?.loadIn ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Load In: ${escHtml(venue.loadIn)}</p>` : ""}
          ${venue?.capacity ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Capacity: ${escHtml(venue.capacity)}</p>` : ""}
          ${venue?.dressingRooms ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Dressing Rooms: Yes${venue.dressingRoomsNotes ? ` - ${escHtml(venue.dressingRoomsNotes)}` : ""}</p>` : ""}
          ${venue?.showers ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Showers: Yes${venue.showersNotes ? ` - ${escHtml(venue.showersNotes)}` : ""}</p>` : ""}
          ${venue?.laundry ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Laundry: Yes${venue.laundryNotes ? ` - ${escHtml(venue.laundryNotes)}` : ""}</p>` : ""}
          ${venue?.meals && venue.meals !== "none" ? `<p style="margin:2px 0 0;font-size:12px;opacity:0.7;">Meals: ${venue.meals === "client_provided" ? "Client Provided" : "Walkaway"}${venue.mealsNotes ? ` - ${escHtml(venue.mealsNotes)}` : ""}</p>` : ""}
        </td></tr>
      </table>
      ${items.length > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;border-collapse:separate;font-size:13px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Time</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Item</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Category</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Location</th>
        </tr></thead>
        <tbody>${items.map((item, i) => {
          const title = escHtml(item.title || item.category || "Untitled");
          const desc = item.description ? `<br><span style="font-size:12px;color:#64748b;">${escHtml(item.description)}</span>` : "";
          const crewStr = item.crewNames?.length ? `<br><span style="font-size:11px;color:#64748b;">Crew: ${item.crewNames.map(escHtml).join(", ")}</span>` : "";
          const zoneName = item.zoneId ? allZones.find(z => z.id === item.zoneId)?.name : null;
          const sectionName = item.sectionId ? allSections.find(s => s.id === item.sectionId)?.name : null;
          const locationStr = [item.location, zoneName ? `[${zoneName}]` : "", sectionName ? `{${sectionName}}` : ""].filter(Boolean).join(" ");
          return `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">${fmtTime(item.startTime)}${item.endTime ? ` - ${fmtTime(item.endTime)}` : ""}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;">${title}${desc}${crewStr}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${escHtml(item.category || "")}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${escHtml(locationStr)}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>` : `<p style="color:#94a3b8;font-style:italic;font-size:13px;">No schedule items for this show.</p>`}
      ${crew.length > 0 ? `
      <h3 style="margin:14px 0 6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#475569;">Crew</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;border-collapse:separate;font-size:13px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:6px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Name</th>
          <th style="padding:6px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Position</th>
          <th style="padding:6px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Dept</th>
          <th style="padding:6px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Phone</th>
          <th style="padding:6px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Email</th>
        </tr></thead>
        <tbody>${crew.map((c, i) => {
          const crewAssignment = allAssignments.find(a => a.userId === c.userId && a.eventName === show.name);
          return `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${escHtml([c.firstName, c.lastName].filter(Boolean).join(" "))}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;text-transform:uppercase;font-size:12px;">${crewAssignment?.position ? escHtml(crewAssignment.position) : ""}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${escHtml(c.role || "")}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${c.phone ? `<a href="tel:${c.phone}" style="color:#2563eb;">${escHtml(c.phone)}</a>` : ""}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${c.email ? `<a href="mailto:${c.email}" style="color:#2563eb;">${escHtml(c.email)}</a>` : ""}</td>
        </tr>`;
        }).join("")}</tbody>
      </table>` : ""}
    </div>`;
  }

  const unassigned = daySchedules.filter(s => !s.eventName);
  if (unassigned.length > 0) {
    showSections += `
    <div style="margin-bottom:28px;">
      <h3 style="margin:0 0 10px;font-size:15px;font-weight:600;text-transform:uppercase;color:#475569;">General Schedule</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;border-collapse:separate;font-size:13px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Time</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Item</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Category</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-weight:600;">Location</th>
        </tr></thead>
        <tbody>${unassigned.map((item, i) => {
          const title = escHtml(item.title || item.category || "Untitled");
          const desc = item.description ? `<br><span style="font-size:12px;color:#64748b;">${escHtml(item.description)}</span>` : "";
          const crewStr = item.crewNames?.length ? `<br><span style="font-size:11px;color:#64748b;">Crew: ${item.crewNames.map(escHtml).join(", ")}</span>` : "";
          const zoneName = item.zoneId ? allZones.find(z => z.id === item.zoneId)?.name : null;
          const sectionName = item.sectionId ? allSections.find(s => s.id === item.sectionId)?.name : null;
          const locationStr = [item.location, zoneName ? `[${zoneName}]` : "", sectionName ? `{${sectionName}}` : ""].filter(Boolean).join(" ");
          return `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">${fmtTime(item.startTime)}${item.endTime ? ` - ${fmtTime(item.endTime)}` : ""}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;">${title}${desc}${crewStr}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${escHtml(item.category || "")}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${escHtml(locationStr)}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>
    </div>`;
  }

  const dateFormatted = fmtDate(date);
  const showNamesList = allShowSections.map(s => s.name).join(", ");
  const subject = `Daily Sheet - ${showNamesList} - ${dateFormatted}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:680px;margin:0 auto;padding:24px;">
<div style="text-align:center;margin-bottom:24px;">
  <h1 style="margin:0;font-size:24px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#1e293b;">Daily Sheet</h1>
  <p style="margin:4px 0 0;font-size:14px;color:#64748b;">${dateFormatted}</p>
  <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Sent by ${escHtml(senderName)}</p>
</div>
${showSections}
<div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;">
  <p style="font-size:11px;color:#94a3b8;">Generated by Daily Sheet</p>
</div>
</div>
</body></html>`;

  const structuredSections = allShowSections.map(show => {
    const dayVenueEntry = show.eventId ? dayVenues.find(dv => dv.eventId === show.eventId && dv.date === date) : null;
    const resolvedVenueId = dayVenueEntry ? dayVenueEntry.venueId : show.venueId;
    const venueObj = resolvedVenueId ? allVenues.find(v => v.id === resolvedVenueId) : null;
    const items = daySchedules.filter(s => s.eventName === show.name);
    const sectionUserIds = assignedUserIdsByShow.get(show.name) || new Set();
    const crew = allContacts.filter(c => c.userId && sectionUserIds.has(c.userId));
    const sectionEvent = show.eventId ? allEvents.find(ev => ev.id === show.eventId) : null;
    const sectionProjectName = sectionEvent?.projectId ? allProjects.find(p => p.id === sectionEvent.projectId)?.name : null;
    return {
      name: show.name,
      projectName: sectionProjectName || undefined,
      venue: venueObj ? {
        name: venueObj.name,
        address: venueObj.address || undefined,
        contactName: venueObj.contactName || undefined,
        contactPhone: venueObj.contactPhone || undefined,
        wifiSsid: venueObj.wifiSsid || undefined,
        wifiPassword: venueObj.wifiPassword || undefined,
        parking: venueObj.parking || undefined,
        loadIn: venueObj.loadIn || undefined,
        capacity: venueObj.capacity || undefined,
        dressingRooms: venueObj.dressingRooms || undefined,
        dressingRoomsNotes: venueObj.dressingRoomsNotes || undefined,
        showers: venueObj.showers || undefined,
        showersNotes: venueObj.showersNotes || undefined,
        laundry: venueObj.laundry || undefined,
        laundryNotes: venueObj.laundryNotes || undefined,
        meals: venueObj.meals || undefined,
        mealsNotes: venueObj.mealsNotes || undefined,
      } : null,
      scheduleItems: items.map(item => ({
        time: `${fmtTime(item.startTime)}${item.endTime ? ` - ${fmtTime(item.endTime)}` : ""}`,
        title: item.title || item.category || "Untitled",
        description: item.description || undefined,
        category: item.category || undefined,
        location: item.location || undefined,
        crewNames: item.crewNames?.length ? item.crewNames : undefined,
      })),
      crew: crew.map(c => ({
        name: [c.firstName, c.lastName].filter(Boolean).join(" "),
        role: c.role || undefined,
        phone: c.phone || undefined,
        email: c.email || undefined,
      })),
    };
  });

  const unassignedStructured = unassigned.map(item => ({
    time: `${fmtTime(item.startTime)}${item.endTime ? ` - ${fmtTime(item.endTime)}` : ""}`,
    title: item.title || item.category || "Untitled",
    description: item.description || undefined,
    category: item.category || undefined,
    location: item.location || undefined,
    crewNames: item.crewNames?.length ? item.crewNames : undefined,
  }));

  return {
    html,
    subject,
    recipients,
    uniqueEmails,
    showNames: allShowSections.map(s => s.name),
    dateFormatted,
    senderName,
    pdfData: {
      dateFormatted,
      senderName,
      showSections: structuredSections,
      unassignedItems: unassignedStructured,
    },
  };
}

export function registerPdfRoutes(app: Express, upload: multer.Multer) {
  app.post("/api/daily-sheet/preview", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const { date, eventNames, timezone } = req.body;
      if (!date || !eventNames || !Array.isArray(eventNames) || eventNames.length === 0) {
        return res.status(400).json({ message: "date and eventNames[] are required" });
      }
      const userTimezone = typeof timezone === "string" && timezone ? timezone : "America/New_York";
      const senderName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Production";

      const data = await buildDailySheetData(workspaceId, date, eventNames, userTimezone, senderName);

      const pdfBuffer = await generateDailySheetPdf(data.pdfData);
      const pdfToken = storePdf(pdfBuffer);

      res.json({
        pdfToken,
        subject: data.subject,
        recipients: data.recipients.map(c => ({
          id: c.id,
          name: [c.firstName, c.lastName].filter(Boolean).join(" "),
          email: c.email,
          role: c.role,
        })),
        recipientCount: data.uniqueEmails.length,
        showNames: data.showNames,
      });
    } catch (error: any) {
      console.error("Preview daily sheet error:", error);
      res.status(500).json({ message: error.message || "Failed to generate preview" });
    }
  });

  app.get("/api/daily-sheet/pdf/:token", (req, res) => {
    const entry = pdfCache.get(req.params.token);
    if (!entry || entry.expiresAt < Date.now()) {
      pdfCache.delete(req.params.token);
      return res.status(404).json({ message: "PDF expired or not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=\"daily-sheet.pdf\"");
    res.setHeader("Content-Length", entry.buffer.length.toString());
    res.send(entry.buffer);
  });

  app.post("/api/daily-sheet/send", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const { date, eventNames, timezone, extraEmails, selectedEmails } = req.body;
      if (!date || !eventNames || !Array.isArray(eventNames) || eventNames.length === 0) {
        return res.status(400).json({ message: "date and eventNames[] are required" });
      }
      const userTimezone = typeof timezone === "string" && timezone ? timezone : "America/New_York";

      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ message: "Email service not configured" });
      }

      const senderName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Production";
      const data = await buildDailySheetData(workspaceId, date, eventNames, userTimezone, senderName);

      const pdfBuffer = await generateDailySheetPdf(data.pdfData);

      let allEmails: string[];
      if (Array.isArray(selectedEmails) && selectedEmails.length > 0) {
        allEmails = Array.from(new Set(
          selectedEmails.filter((e: any) => typeof e === "string" && e.includes("@"))
        ));
      } else {
        const additionalEmails: string[] = Array.isArray(extraEmails)
          ? extraEmails.filter((e: any) => typeof e === "string" && e.includes("@"))
          : [];
        allEmails = Array.from(new Set([...data.uniqueEmails, ...additionalEmails]));
      }

      if (allEmails.length === 0) {
        return res.status(400).json({ message: "No recipients found. Add crew members or additional email addresses." });
      }

      const pdfFilename = `Daily_Sheet_${date}_${data.showNames.join("_").replace(/[^a-zA-Z0-9_]/g, "")}.pdf`;

      const resend = new Resend(process.env.RESEND_API_KEY);
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      for (let i = 0; i < allEmails.length; i++) {
        const email = allEmails[i];
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 600));
        try {
          const r = await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: email,
            subject: data.subject,
            html: data.html,
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
      res.json({
        message: `Sent to ${successCount} of ${allEmails.length} recipients`,
        results,
      });

      const showLabel = data.showNames.join(", ");
      const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";
      Promise.all(eventNames.map(evName =>
        getCrewUserIdsForEvent(evName, workspaceId)
          .then(crewIds => notifyUsers(crewIds, user.id, "daily_sheet_sent", "Daily Sheet Sent", `The daily sheet for ${showLabel} (${date}) has been emailed`, workspaceId, evName))
      )).catch(err => console.error("Notification error:", err));
      logActivity(user.id, actorName, "daily_sheet_sent", "sent", "Daily Sheet", `Sent daily sheet for ${showLabel} (${date}) to ${allEmails.length} recipients`, workspaceId, eventNames[0], JSON.stringify([{ field: "Shows", value: showLabel }, { field: "Date", value: date }, { field: "Recipients", value: `${allEmails.length} emails` }]))
        .catch(err => console.error("Activity log error:", err));
    } catch (error: any) {
      console.error("Send daily sheet error:", error);
      res.status(500).json({ message: error.message || "Failed to send daily sheet" });
    }
  });

  // Save show as template (multi-day)
  app.post("/api/show-templates/:eventName", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const eventName = decodeURIComponent(req.params.eventName);
      const { name, description } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ message: "Template name is required" });
      }

      const allEvents = await storage.getEvents(workspaceId);
      const event = allEvents.find((e: any) => e.name === eventName);
      if (!event) return res.status(404).json({ message: "Show not found" });

      const allSchedules = await storage.getSchedules(workspaceId);
      const showSchedules = allSchedules.filter((s: any) => s.eventName === eventName);

      if (showSchedules.length === 0) {
        return res.status(400).json({ message: "No schedule items found for this show" });
      }

      const startDate = event.startDate || showSchedules[0]?.eventDate;
      const baseDate = startDate ? new Date(startDate + "T00:00:00Z") : new Date();

      const items = showSchedules.map((s: any) => {
        const itemDate = s.eventDate ? new Date(s.eventDate + "T00:00:00Z") : baseDate;
        const offsetDays = Math.round((itemDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
        return {
          title: s.title,
          category: s.category,
          description: s.description,
          location: s.location,
          startTimeOffset: s.startTime ? `${new Date(s.startTime).getUTCHours().toString().padStart(2, '0')}:${new Date(s.startTime).getUTCMinutes().toString().padStart(2, '0')}` : null,
          endTimeOffset: s.endTime ? `${new Date(s.endTime).getUTCHours().toString().padStart(2, '0')}:${new Date(s.endTime).getUTCMinutes().toString().padStart(2, '0')}` : null,
          sortOrder: s.sortOrder,
          offsetDays,
        };
      });

      const template = await storage.createScheduleTemplate({
        name: name.trim(),
        description: description || null,
        items: JSON.stringify(items),
        type: "show",
        workspaceId,
      });

      res.status(201).json(template);
    } catch (err) {
      console.error("Save show template error:", err);
      res.status(500).json({ message: "Failed to save show template" });
    }
  });

  // Apply show template to an event
  app.post("/api/apply-show-template/:templateId", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const templateId = Number(req.params.templateId);
      const { eventName, startDate } = req.body;
      if (!eventName || !startDate) {
        return res.status(400).json({ message: "Event name and start date are required" });
      }

      const allTemplates = await storage.getScheduleTemplates(workspaceId);
      const template = allTemplates.find((t: any) => t.id === templateId);
      if (!template) return res.status(404).json({ message: "Template not found" });

      // Resolve eventId from eventName
      const event = await storage.getEventByName(eventName, workspaceId);
      const eventId = event?.id ?? null;

      const items = JSON.parse(template.items) as any[];
      const base = new Date(startDate + "T00:00:00Z");
      const created: any[] = [];

      for (const item of items) {
        const itemDate = new Date(base.getTime() + (item.offsetDays || 0) * 24 * 60 * 60 * 1000);
        const eventDate = itemDate.toISOString().split("T")[0];

        let startTime: Date | undefined;
        let endTime: Date | undefined;
        if (item.startTimeOffset) {
          const [h, m] = item.startTimeOffset.split(":").map(Number);
          startTime = new Date(itemDate);
          startTime.setUTCHours(h, m, 0, 0);
        }
        if (item.endTimeOffset) {
          const [h, m] = item.endTimeOffset.split(":").map(Number);
          endTime = new Date(itemDate);
          endTime.setUTCHours(h, m, 0, 0);
        }

        const schedule = await storage.createSchedule({
          title: item.title || "",
          category: item.category || "General",
          description: item.description || null,
          location: item.location || null,
          startTime: startTime || new Date(itemDate),
          endTime: endTime || null,
          eventDate,
          eventName,
          eventId,
          sortOrder: item.sortOrder || 0,
          workspaceId,
        });
        created.push(schedule);
      }

      res.status(201).json({ count: created.length, items: created });
    } catch (err) {
      console.error("Apply show template error:", err);
      res.status(500).json({ message: "Failed to apply show template" });
    }
  });
}
