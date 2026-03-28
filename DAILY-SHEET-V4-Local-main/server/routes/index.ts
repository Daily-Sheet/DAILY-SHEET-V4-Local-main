import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth } from "../replit_integrations/auth";
import { db } from "../db";
import { users, workspaces, workspaceMembers } from "@shared/models/auth";
import { schedules, contacts, files, venues, events, fileFolders, comments, settings as settingsTable, eventAssignments, bandPortalLinks, eventDayVenues } from "@shared/schema";
import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";

import { registerAuthRoutes } from "./auth";
import { registerScheduleRoutes } from "./schedules";
import { registerContactRoutes } from "./contacts";
import { registerFileRoutes } from "./files";
import { registerVenueRoutes } from "./venues";
import { registerProjectRoutes } from "./projects";
import { registerCrewRoutes } from "./crew";
import { registerAccessRoutes } from "./access";
import { registerWorkspaceRoutes } from "./workspaces";
import { registerTimesheetRoutes } from "./timesheet";
import { registerUserRoutes } from "./users";
import { registerSettingsRoutes } from "./settings";
import { registerEventRoutes } from "./events";
import { registerNotificationRoutes } from "./notifications";
import { registerPdfRoutes } from "./pdf";
import { registerCalendarRoutes } from "./calendar";
import { registerWeatherRoutes } from "./weather";
import { registerMapRoutes } from "./map";
import { registerLegRoutes } from "./legs";
import { registerBandPortalRoutes } from "./bandPortal";
import { registerConfigRoutes } from "./config";
import { registerAfterJobReportRoutes } from "./afterJobReports";
import { initWebSocketServer } from "../ws/wsServer";

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage_multer });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  registerAuthRoutes(app, upload);
  registerScheduleRoutes(app, upload);
  registerContactRoutes(app, upload);
  registerFileRoutes(app, upload);
  registerVenueRoutes(app, upload);
  registerProjectRoutes(app, upload);
  registerCrewRoutes(app, upload);
  registerAccessRoutes(app, upload);
  registerWorkspaceRoutes(app, upload);
  registerTimesheetRoutes(app, upload);
  registerUserRoutes(app, upload);
  registerSettingsRoutes(app, upload);
  registerEventRoutes(app, upload);
  registerNotificationRoutes(app, upload);
  registerPdfRoutes(app, upload);
  registerCalendarRoutes(app, upload);
  registerWeatherRoutes(app, upload);
  registerMapRoutes(app, upload);
  registerLegRoutes(app, upload);
  registerBandPortalRoutes(app, upload);
  registerConfigRoutes(app);
  registerAfterJobReportRoutes(app, upload);

  // Initialize WebSocket server for real-time sync
  initWebSocketServer(httpServer);

  // Migrate existing users without workspaces
  await migrateExistingUsersToWorkspaces();

  // Backfill schedules.eventId from eventName
  await migrateScheduleEventIds();

  // Backfill files.folderId and band_portal_links.folderId from folderName
  await migrateFileFolderIds();

  // Backfill eventDayVenues for events with venueId but missing day-venue rows
  await migrateEventDayVenues();

  return httpServer;
}

async function migrateExistingUsersToWorkspaces() {
  try {
    const allUsers = await db.select().from(users).where(isNull(users.workspaceId));
    if (allUsers.length === 0) {
      const orphanTables = [
        { name: "schedules", table: schedules, col: schedules.workspaceId },
        { name: "events", table: events, col: events.workspaceId },
        { name: "contacts", table: contacts, col: contacts.workspaceId },
        { name: "venues", table: venues, col: venues.workspaceId },
        { name: "files", table: files, col: files.workspaceId },
      ];
      for (const { name, table, col } of orphanTables) {
        const orphaned = await db.select({ id: (table as any).id }).from(table).where(isNull(col)).limit(1);
        if (orphaned.length > 0) {
          console.warn(`WARNING: Found orphaned records in ${name} table with null workspaceId`);
        }
      }
      return;
    }

    for (const user of allUsers) {
      const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
      const [workspace] = await db.insert(workspaces).values({
        name: `${displayName}'s Workspace`,
        ownerId: user.id,
      }).returning();

      await db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: ["owner", "manager"].includes(user.role) ? "manager" : (user.role === "admin" ? "admin" : (user.role || "commenter")),
      });

      await db.update(users).set({ workspaceId: workspace.id }).where(eq(users.id, user.id));

      await db.update(contacts).set({ workspaceId: workspace.id })
        .where(eq(contacts.userId, user.id));

      console.log(`Migrated user ${user.email} to workspace "${workspace.name}" (id: ${workspace.id})`);
    }

    const [firstWorkspace] = await db.select().from(workspaces).orderBy(workspaces.id);
    if (firstWorkspace) {
      const tables = [
        { table: schedules, col: schedules.workspaceId },
        { table: venues, col: venues.workspaceId },
        { table: events, col: events.workspaceId },
        { table: files, col: files.workspaceId },
        { table: fileFolders, col: fileFolders.workspaceId },
        { table: comments, col: comments.workspaceId },
        { table: settingsTable, col: settingsTable.workspaceId },
        { table: eventAssignments, col: eventAssignments.workspaceId },
      ];

      for (const { table, col } of tables) {
        await db.update(table).set({ workspaceId: firstWorkspace.id } as any).where(isNull(col));
      }

      await db.update(contacts).set({ workspaceId: firstWorkspace.id }).where(isNull(contacts.workspaceId));
    }
  } catch (error) {
    console.error("Migration error (non-fatal):", error);
  }
}

async function migrateScheduleEventIds() {
  try {
    // Ensure the column exists in the database
    await db.execute(sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS event_id INTEGER`);

    // Find schedules that have eventName but no eventId
    const orphans = await db.select({ id: schedules.id, eventName: schedules.eventName, workspaceId: schedules.workspaceId })
      .from(schedules)
      .where(and(isNull(schedules.eventId), isNotNull(schedules.eventName)));
    if (orphans.length === 0) return;

    const allEvents = await db.select().from(events);
    // Map (name, workspaceId) → event.id
    const eventLookup = new Map<string, number>();
    for (const ev of allEvents) {
      eventLookup.set(`${ev.name}::${ev.workspaceId}`, ev.id);
    }

    let updated = 0;
    for (const row of orphans) {
      const key = `${row.eventName}::${row.workspaceId}`;
      const eventId = eventLookup.get(key);
      if (eventId) {
        await db.update(schedules).set({ eventId }).where(eq(schedules.id, row.id));
        updated++;
      }
    }
    if (updated > 0) {
      console.log(`Migrated ${updated}/${orphans.length} schedules: backfilled eventId from eventName`);
    }
  } catch (error) {
    console.error("Schedule eventId migration error (non-fatal):", error);
  }
}

async function migrateFileFolderIds() {
  try {
    // Ensure columns exist
    await db.execute(sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS folder_id INTEGER`);
    await db.execute(sql`ALTER TABLE band_portal_links ADD COLUMN IF NOT EXISTS folder_id INTEGER`);

    // Load all folders for lookup
    const allFolders = await db.select().from(fileFolders);
    if (allFolders.length === 0) return;

    // Build lookup: (folderName, eventName, projectId, workspaceId) → folder.id
    const folderLookup = new Map<string, number>();
    for (const f of allFolders) {
      const key = `${f.name}::${f.eventName ?? ""}::${f.projectId ?? ""}::${f.workspaceId ?? ""}`;
      folderLookup.set(key, f.id);
    }

    // Backfill files
    const orphanFiles = await db.select({
      id: files.id, folderName: files.folderName,
      eventName: files.eventName, projectId: files.projectId, workspaceId: files.workspaceId,
    }).from(files).where(and(isNull(files.folderId), isNotNull(files.folderName)));

    let updatedFiles = 0;
    for (const row of orphanFiles) {
      const key = `${row.folderName}::${row.eventName ?? ""}::${row.projectId ?? ""}::${row.workspaceId ?? ""}`;
      const folderId = folderLookup.get(key);
      if (folderId) {
        await db.update(files).set({ folderId }).where(eq(files.id, row.id));
        updatedFiles++;
      }
    }
    if (updatedFiles > 0) {
      console.log(`Migrated ${updatedFiles}/${orphanFiles.length} files: backfilled folderId from folderName`);
    }

    // Backfill band portal links
    const orphanLinks = await db.select({
      id: bandPortalLinks.id, folderName: bandPortalLinks.folderName,
      eventName: bandPortalLinks.eventName, workspaceId: bandPortalLinks.workspaceId,
    }).from(bandPortalLinks).where(isNull(bandPortalLinks.folderId));

    let updatedLinks = 0;
    for (const row of orphanLinks) {
      const key = `${row.folderName}::${row.eventName ?? ""}::${""/* no projectId */}::${row.workspaceId ?? ""}`;
      const folderId = folderLookup.get(key);
      if (folderId) {
        await db.update(bandPortalLinks).set({ folderId }).where(eq(bandPortalLinks.id, row.id));
        updatedLinks++;
      }
    }
    if (updatedLinks > 0) {
      console.log(`Migrated ${updatedLinks}/${orphanLinks.length} band portal links: backfilled folderId`);
    }
  } catch (error) {
    console.error("File folderId migration error (non-fatal):", error);
  }
}

async function migrateEventDayVenues() {
  try {
    // Find events that have a venueId + date range but no eventDayVenues rows
    const allEvents = await db.select().from(events);
    const allDayVenues = await db.select().from(eventDayVenues);

    // Build a set of (eventId, date) pairs that already exist
    const existingKeys = new Set(allDayVenues.map(dv => `${dv.eventId}::${dv.date}`));

    let created = 0;
    for (const ev of allEvents) {
      if (!ev.venueId || !ev.startDate || !ev.endDate) continue;

      const start = new Date(ev.startDate + "T00:00:00");
      const end = new Date(ev.endDate + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const key = `${ev.id}::${dateStr}`;
        if (!existingKeys.has(key)) {
          await db.insert(eventDayVenues).values({
            eventId: ev.id,
            date: dateStr,
            venueId: ev.venueId,
            workspaceId: ev.workspaceId,
          });
          existingKeys.add(key);
          created++;
        }
      }
    }
    if (created > 0) {
      console.log(`Migrated ${created} eventDayVenues rows: backfilled from event.venueId`);
    }
  } catch (error) {
    console.error("EventDayVenues migration error (non-fatal):", error);
  }
}
