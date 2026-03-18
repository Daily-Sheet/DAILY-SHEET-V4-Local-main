import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { db } from "../db";
import { users, systemInvites } from "@shared/models/auth";
import { eq, count, isNotNull, and } from "drizzle-orm";
import { z } from "zod";
import { DEPARTMENTS, CONTACT_ROLES, DEFAULT_TASK_TYPES, DEFAULT_CREW_POSITIONS } from "@shared/constants";
import { isAuthenticated, invalidateUserCache } from "../replit_integrations/auth";
import { getWorkspaceRole, requireRole } from "./utils";
import { storage as storageAlias } from "../storage";

export function registerAuthRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      const workspaceRole = await getWorkspaceRole(user.id, workspaceId);
      let eventAssignments: string[] = [];
      if (workspaceId) {
        const allAssignments = await storage.getAllAssignments(workspaceId);
        eventAssignments = allAssignments
          .filter((a: any) => a.userId === user.id)
          .map((a: any) => a.eventName);
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        department: user.department,
        role: workspaceRole,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        workspaceId: user.workspaceId,
        workspaceRole,
        eventAssignments,
        dashboardPreferences: user.dashboardPreferences ?? null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/workspace", isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.body;
      if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required" });
      const userWorkspaces = await storage.getWorkspacesByUser(req.user.id);
      const targetWs = userWorkspaces.find((ws: any) => ws.id === workspaceId);
      if (!targetWs) return res.status(403).json({ message: "You are not a member of this workspace" });
      await storage.switchUserWorkspace(req.user.id, workspaceId);
      invalidateUserCache(req.user.id);
      res.json({ workspaceId, workspaceName: targetWs.name });
    } catch (error) {
      res.status(500).json({ message: "Failed to switch workspace" });
    }
  });

  const VALID_DEPARTMENTS = [...DEPARTMENTS];

  const profileUpdateSchema = z.object({
    phone: z.string().optional(),
    department: z.enum(VALID_DEPARTMENTS as [string, ...string[]]).optional(),
  });

  app.patch("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const { phone, department } = parsed.data;
      const updateData: { phone?: string | null; department?: string | null } = {};
      if (phone !== undefined) updateData.phone = phone || null;
      if (department !== undefined) updateData.department = department || null;
      const updated = await storage.updateUserProfile(user.id, updateData);

      const workspaceId = user.workspaceId;
      const workspaceRole = await getWorkspaceRole(user.id, workspaceId);
      let eventAssignments: string[] = [];
      if (workspaceId) {
        const allAssignments = await storage.getAllAssignments(workspaceId);
        eventAssignments = allAssignments
          .filter((a: any) => a.userId === user.id)
          .map((a: any) => a.eventName);
      }

      res.json({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        department: updated.department,
        role: workspaceRole,
        profileImageUrl: updated.profileImageUrl,
        createdAt: updated.createdAt,
        workspaceId: user.workspaceId,
        workspaceRole,
        eventAssignments,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/users", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const members = await storage.getWorkspaceMembers(workspaceId);
    const memberUserIds = members.map((m: any) => m.userId);
    const allUsers = await storage.getAllUsers();
    const workspaceUsers = allUsers.filter((u: any) => memberUserIds.includes(u.id));
    res.json(workspaceUsers);
  });

  app.get("/api/user-activity", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const members = await storage.getWorkspaceMembers(workspaceId);
    const memberUserIds = members.map((m: any) => m.userId);
    const allUsers = await storage.getAllUsers();
    const activity = allUsers
      .filter((u: any) => memberUserIds.includes(u.id))
      .map((u: any) => ({
        userId: u.id,
        lastActiveAt: u.lastActiveAt,
      }));
    res.json(activity);
  });

  app.get("/api/bootstrap", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const workspaceId = user.workspaceId;
      const userWorkspacesForCount = await storage.getWorkspacesByUser(user.id);
      const workspaceCount = userWorkspacesForCount.length;

      if (!workspaceId) {
        return res.json({
          user: { ...user, role: "commenter", workspaceRole: "commenter", eventAssignments: [] },
          workspaceCount,
          schedules: [], contacts: [], venues: [], events: [], zones: [],
          sections: [], projects: [], eventAssignments: [], taskTypes: [],
          eventDayVenues: [], files: [], fileFolders: [], userActivity: [],
          departments: [], crewPositions: [],
        });
      }

      const workspaceRole = await getWorkspaceRole(user.id, workspaceId);
      const allAssignments = await storage.getAllAssignments(workspaceId);
      const allProjectAssignments = await storage.getAllProjectAssignments(workspaceId);
      const userEventAssignments = allAssignments
        .filter((a: any) => a.userId === user.id)
        .map((a: any) => a.eventName);
      const userProjectAssignments = allProjectAssignments
        .filter((a: any) => a.userId === user.id);

      const isManager = workspaceRole === "owner" || workspaceRole === "manager";
      const isAdmin = isManager || workspaceRole === "admin";
      const allowed: string[] | null = isAdmin ? null : userEventAssignments;
      const allowedSet = allowed ? new Set(allowed) : null;

      const [
        allSchedules, allContacts, allVenues, allEvents, allZones,
        allSections, allProjects, allDayVenues, allFiles, allFileFolders,
        members, allUsers, taskTypes, departments, crewPositions,
      ] = await Promise.all([
        storage.getSchedules(workspaceId),
        storage.getContacts(workspaceId),
        storage.getAllVenues(),
        storage.getEvents(workspaceId),
        storage.getZones(workspaceId),
        storage.getSections(workspaceId),
        storage.getProjects(workspaceId),
        storage.getAllEventDayVenues(workspaceId),
        storage.getFiles(workspaceId),
        storage.getFileFolders(workspaceId),
        storage.getWorkspaceMembers(workspaceId),
        storage.getAllUsers(),
        storage.getTaskTypes(workspaceId),
        storage.getDepartments(workspaceId),
        storage.getCrewPositions(workspaceId),
      ]);

      let schedules = allSchedules;
      let contacts = allContacts;
      let venues = allVenues;
      let events = allEvents;
      let zones = allZones;
      let projects = allProjects;
      let dayVenues = allDayVenues;
      let files = allFiles;
      let assignments: any[] = allAssignments;

      if (isManager) {
        projects = allProjects.filter((p: any) => p.managerId === user.id || !p.managerId);
        const managerProjectIds = new Set(projects.map((p: any) => p.id));
        events = allEvents.filter((e: any) => !e.projectId || managerProjectIds.has(e.projectId));
        const managerEventNames = new Set(events.map((e: any) => e.name));
        schedules = allSchedules.filter((s: any) => s.eventName && managerEventNames.has(s.eventName));
        const managerEventIds = new Set(events.map((e: any) => e.id));
        dayVenues = allDayVenues.filter((dv: any) => managerEventIds.has(dv.eventId));
        files = allFiles.filter((f: any) => !f.eventName || managerEventNames.has(f.eventName));
        assignments = allAssignments.filter((a: any) => managerEventNames.has(a.eventName));
      } else if (allowedSet !== null) {
        const userProjAssignProjectIds = new Set(
          userProjectAssignments.map((a: any) => a.projectId)
        );

        if (allowedSet.size === 0 && userProjAssignProjectIds.size === 0) {
          schedules = []; contacts = []; venues = []; events = [];
          zones = []; projects = []; dayVenues = []; files = [];
          assignments = allAssignments.filter((a: any) => a.userId === user.id);
        } else {
          const expandedAllowed = new Set(allowedSet);
          const assignedEvents = allEvents.filter((e: any) => e.name && allowedSet.has(e.name));
          const festivalProjectIds = new Set<number>();
          for (const ev of assignedEvents) {
            if (ev.projectId) {
              const proj = allProjects.find((p: any) => p.id === ev.projectId);
              if (proj?.isFestival || proj?.isTour) festivalProjectIds.add(proj.id);
            }
          }
          for (const projId of Array.from(userProjAssignProjectIds)) {
            festivalProjectIds.add(projId);
          }
          if (festivalProjectIds.size > 0) {
            for (const ev of allEvents) {
              if (ev.projectId && festivalProjectIds.has(ev.projectId)) {
                expandedAllowed.add(ev.name);
              }
            }
          }

          schedules = allSchedules.filter((s: any) => s.eventName && expandedAllowed.has(s.eventName));
          events = allEvents.filter((e: any) => e.name && expandedAllowed.has(e.name));

          const allowedEventIds = new Set(events.map((e: any) => e.id));
          const allowedVenueIds = new Set(
            events.map((e: any) => e.venueId).filter(Boolean)
          );
          allDayVenues.filter((dv: any) => allowedEventIds.has(dv.eventId))
            .forEach((dv: any) => allowedVenueIds.add(dv.venueId));

          venues = allVenues.filter((v: any) => allowedVenueIds.has(v.id));
          zones = allZones.filter((z: any) => allowedVenueIds.has(z.venueId));
          dayVenues = allDayVenues.filter((dv: any) => allowedEventIds.has(dv.eventId));
          files = allFiles.filter((f: any) => f.eventName && expandedAllowed.has(f.eventName));

          const assignedUserIds = new Set(
            allAssignments
              .filter((a: any) => expandedAllowed.has(a.eventName))
              .map((a: any) => a.userId)
          );
          contacts = allContacts.filter((c: any) => c.userId && assignedUserIds.has(c.userId));

          const allowedProjectIds = new Set(
            events.filter((e: any) => e.projectId).map((e: any) => e.projectId)
          );
          projects = allProjects.filter((p: any) => allowedProjectIds.has(p.id));
          assignments = allAssignments.filter((a: any) => expandedAllowed.has(a.eventName));
        }
      }

      let finalTaskTypes = taskTypes;
      if (taskTypes.length === 0) {
        for (const name of DEFAULT_TASK_TYPES) {
          await storage.createTaskType({ name, workspaceId, isDefault: true });
        }
        finalTaskTypes = await storage.getTaskTypes(workspaceId);
      }

      let finalDepartments = departments;
      if (departments.length === 0) {
        for (const name of CONTACT_ROLES) {
          await storage.createDepartment({ name, workspaceId, isDefault: true });
        }
        finalDepartments = await storage.getDepartments(workspaceId);
      }

      let finalCrewPositions = crewPositions;
      if (crewPositions.length === 0) {
        for (const name of DEFAULT_CREW_POSITIONS) {
          await storage.createCrewPosition({ name, workspaceId, isDefault: true });
        }
        finalCrewPositions = await storage.getCrewPositions(workspaceId);
      }

      const memberUserIds = members.map((m: any) => m.userId);
      const userActivity = allUsers
        .filter((u: any) => memberUserIds.includes(u.id))
        .map((u: any) => ({ userId: u.id, lastActiveAt: u.lastActiveAt }));

      const filteredProjectAssignments = isManager
        ? allProjectAssignments
        : allProjectAssignments.filter((a: any) => {
            const proj = allProjects.find((p: any) => p.id === a.projectId);
            if (!proj) return false;
            const projEvents = events.filter((e: any) => e.projectId === a.projectId);
            return projEvents.length > 0;
          });

      res.json({
        user: {
          id: user.id, email: user.email, firstName: user.firstName,
          lastName: user.lastName, phone: user.phone, department: user.department,
          role: workspaceRole, profileImageUrl: user.profileImageUrl,
          createdAt: user.createdAt, workspaceId: user.workspaceId,
          workspaceRole, eventAssignments: userEventAssignments,
          projectAssignments: userProjectAssignments,
          dashboardPreferences: user.dashboardPreferences ?? null,
        },
        workspaceCount,
        schedules, contacts, venues, events, zones, sections: allSections,
        projects, eventAssignments: assignments, projectAssignments: filteredProjectAssignments,
        taskTypes: finalTaskTypes,
        eventDayVenues: dayVenues, files, fileFolders: allFileFolders,
        userActivity, departments: finalDepartments, crewPositions: finalCrewPositions,
      });
    } catch (error) {
      console.error("Bootstrap error:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole("owner", "manager"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const members = await storage.getWorkspaceMembers(workspaceId);
    const member = members.find((m: any) => m.userId === req.params.id);
    if (!member) return res.status(404).json({ message: "User not found in workspace" });
    const { role } = req.body;
    if (!["manager", "admin", "commenter", "client"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be manager, admin, commenter, or client." });
    }
    await storage.updateWorkspaceMemberRole(member.id, role);
    const updated = await storage.updateUserRole(req.params.id, role);
    res.json(updated);
  });

  app.get("/api/auth/check-setup", async (req: any, res) => {
    try {
      const [{ value: userCount }] = await db.select({ value: count() }).from(users).where(isNotNull(users.passwordHash));
      res.json({ needsSetup: userCount === 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to check setup status" });
    }
  });

  app.get("/api/auth/check-invite", async (req: any, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.json({ valid: false });
      }
      const [invite] = await db.select().from(systemInvites).where(
        and(eq(systemInvites.token, token), eq(systemInvites.status, "pending"))
      );
      if (!invite) {
        return res.json({ valid: false });
      }
      res.json({ valid: true, email: invite.email, role: invite.role });
    } catch (error) {
      res.status(500).json({ message: "Failed to check invite" });
    }
  });
}
