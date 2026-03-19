import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth } from "../replit_integrations/auth";
import { db } from "../db";
import { users, workspaces, workspaceMembers } from "@shared/models/auth";
import { schedules, contacts, files, venues, events, fileFolders, comments, settings as settingsTable, eventAssignments } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

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

  // Migrate existing users without workspaces
  await migrateExistingUsersToWorkspaces();

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
