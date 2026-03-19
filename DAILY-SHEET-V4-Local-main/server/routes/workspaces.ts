import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, requireWorkspaceAdmin, sendInviteEmail } from "./utils";

export function registerWorkspaceRoutes(app: Express, upload: multer.Multer) {
  // Project Assignments
  app.get("/api/project-assignments", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const assignments = await storage.getAllProjectAssignments(workspaceId);
    res.json(assignments);
  });

  app.get("/api/project-assignments/:projectId", isAuthenticated, async (req: any, res) => {
    const projectId = parseInt(req.params.projectId);
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const assignments = await storage.getProjectAssignments(projectId, workspaceId);
    res.json(assignments);
  });

  app.post("/api/project-assignments", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace" });
      const { userId, projectId, position } = req.body;
      if (!userId || !projectId) {
        return res.status(400).json({ message: "userId and projectId are required" });
      }
      const existing = await storage.getProjectAssignments(projectId, workspaceId);
      if (existing.some((a: any) => a.userId === userId)) {
        return res.status(409).json({ message: "User already assigned to this project" });
      }
      const assignment = await storage.createProjectAssignment({
        userId, projectId, workspaceId, position: position || null,
      });

      const project = await storage.getProject(projectId);
      if (project && project.isTour) {
        const tourEvents = await storage.getEvents(workspaceId);
        const projectEvents = tourEvents.filter((e: any) => e.projectId === projectId);
        for (const ev of projectEvents) {
          await storage.createAssignment({
            userId,
            eventName: ev.name,
            workspaceId,
            position: position || null,
          });
        }
      }

      res.status(201).json(assignment);
    } catch (err) {
      res.status(500).json({ message: "Failed to create project assignment" });
    }
  });

  app.patch("/api/project-assignments/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace" });
      const all = await storage.getAllProjectAssignments(workspaceId);
      const assignment = all.find((a: any) => a.id === id);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      const { position } = req.body;
      const updated = await storage.updateProjectAssignment(id, { position: position ?? null });

      // Cascade position update to all event assignments for this user in this project
      const project = await storage.getProject(assignment.projectId);
      if (project?.isTour) {
        const tourEvents = await storage.getEvents(workspaceId);
        const projectEvents = tourEvents.filter((e: any) => e.projectId === assignment.projectId);
        const allAssignments = await storage.getAllAssignments(workspaceId);
        for (const ev of projectEvents) {
          const ea = allAssignments.find((a: any) => a.userId === assignment.userId && a.eventName === ev.name);
          if (ea) {
            await storage.updateAssignment(ea.id, { position: position ?? null });
          }
        }
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update project assignment" });
    }
  });

  app.delete("/api/project-assignments/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace" });
      const all = await storage.getAllProjectAssignments(workspaceId);
      const assignment = all.find((a: any) => a.id === id);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      await storage.deleteProjectAssignment(id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Failed to delete project assignment" });
    }
  });

  // Workspace routes
  app.get("/api/workspaces", isAuthenticated, async (req: any, res) => {
    try {
      const userWorkspaces = await storage.getWorkspacesByUser(req.user.id);
      res.json(userWorkspaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/workspaces", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { name } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Organization name is required" });
      }
      const workspace = await storage.createWorkspace({ name: name.trim(), ownerId: user.id });
      await storage.addWorkspaceMember({ workspaceId: workspace.id, userId: user.id, role: "owner" });
      res.status(201).json(workspace);
    } catch (error) {
      console.error("Create workspace error:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/workspaces/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const wsId = Number(req.params.id);
      const members = await storage.getWorkspaceMembers(wsId);
      const isMember = members.find((m: any) => m.userId === req.user.id);
      if (!isMember) return res.status(403).json({ message: "You are not a member of this workspace" });
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workspace members" });
    }
  });

  app.post("/api/workspaces/:id/invite", isAuthenticated, requireWorkspaceAdmin(), async (req: any, res) => {
    try {
      const wsId = Number(req.params.id);
      const members = req.wsMembers;
      const { email, role } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const inviteRole = role || "commenter";
      if (!["manager", "admin", "commenter", "client"].includes(inviteRole)) {
        return res.status(400).json({ message: "Invalid role. Must be manager, admin, commenter, or client." });
      }
      const allUsers = await storage.getAllUsers();
      const targetUser = allUsers.find((u: any) => u.email === email);
      const workspace = await storage.getWorkspace(wsId);
      const workspaceName = workspace?.name || "a workspace";
      const inviterName = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || "Someone";
      const appUrl = `${req.protocol}://${req.get("host")}`;

      if (targetUser) {
        if (members.find((m: any) => m.userId === targetUser.id)) {
          return res.status(409).json({ message: "User is already a member of this workspace" });
        }
        const member = await storage.addWorkspaceMember({
          workspaceId: wsId,
          userId: targetUser.id,
          role: inviteRole,
        });

        // If user has no workspace yet, assign this one as their primary
        if (!targetUser.workspaceId) {
          await db.update(users).set({ workspaceId: wsId }).where(eq(users.id, targetUser.id));
        }

        const invite = await storage.createWorkspaceInvite({
          email,
          workspaceId: wsId,
          role: inviteRole,
          invitedBy: req.user.id,
          status: "accepted",
        });

        // Auto-create a contact card for the user in this workspace
        try {
          await storage.createContact({
            workspaceId: wsId,
            userId: targetUser.id,
            firstName: targetUser.firstName || "",
            lastName: targetUser.lastName || "",
            email: targetUser.email || "",
            phone: targetUser.phone || null,
            role: targetUser.department || "",
            contactType: "crew",
          });
        } catch (_) {}

        // In-app notification
        try {
          await storage.createNotification({
            userId: targetUser.id,
            workspaceId: wsId,
            title: "Added to workspace",
            message: `${inviterName} added you to ${workspaceName} as ${inviteRole}.`,
            type: "workspace_invite",
            read: false,
          });
        } catch (_) {}

        try {
          await sendInviteEmail(
            email,
            `You've been added to ${workspaceName} on Daily Sheet`,
            `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">You're in!</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has added you to <strong>${workspaceName}</strong> on Daily Sheet as a <strong>${inviteRole}</strong>.
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Log in to access your workspace. If you're already logged in, use the workspace switcher in the top menu.
              </p>
              <a href="${appUrl}/login" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">Log In to Daily Sheet</a>
            </div>`
          );
        } catch (emailErr: any) {
          console.error("[email] Failed to send invite email:", emailErr?.message || emailErr);
        }

        return res.status(201).json({ type: "joined", member, invite });
      }

      const existingInvites = await storage.getPendingInvitesByEmail(email);
      const alreadyInvited = existingInvites.find((i: any) => i.workspaceId === wsId);
      if (alreadyInvited) {
        return res.status(409).json({ message: "This email already has a pending invite to this workspace" });
      }

      const invite = await storage.createWorkspaceInvite({
        email,
        workspaceId: wsId,
        role: inviteRole,
        invitedBy: req.user.id,
        status: "pending",
      });

      try {
        await sendInviteEmail(
          email,
          `You're invited to join ${workspaceName} on Daily Sheet`,
          `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">You're invited!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on Daily Sheet as a <strong>${inviteRole}</strong>.
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Daily Sheet is a production management tool for live events. Create your account to join the crew and start collaborating.
            </p>
            <a href="${appUrl}/register?email=${encodeURIComponent(email)}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">Join Daily Sheet</a>
          </div>`
        );
      } catch (emailErr: any) {
        console.error("[email] Failed to send invite email:", emailErr?.message || emailErr);
      }

      return res.status(201).json({ type: "pending", invite });
    } catch (error) {
      res.status(500).json({ message: "Failed to invite member" });
    }
  });

  app.get("/api/workspaces/:id/invites", isAuthenticated, requireWorkspaceAdmin(), async (req: any, res) => {
    try {
      const invites = await storage.getWorkspaceInvites(Number(req.params.id));
      res.json(invites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  app.delete("/api/workspaces/:id/invites/:inviteId", isAuthenticated, requireWorkspaceAdmin(), async (req: any, res) => {
    try {
      const invite = await storage.getWorkspaceInvite(Number(req.params.inviteId));
      if (!invite || invite.workspaceId !== Number(req.params.id)) {
        return res.status(404).json({ message: "Invite not found" });
      }
      await storage.deleteWorkspaceInvite(Number(req.params.inviteId));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to revoke invite" });
    }
  });

  app.post("/api/workspaces/:id/invites/:inviteId/resend", isAuthenticated, requireWorkspaceAdmin(), async (req: any, res) => {
    try {
      const invite = await storage.getWorkspaceInvite(Number(req.params.inviteId));
      if (!invite || invite.workspaceId !== Number(req.params.id)) {
        return res.status(404).json({ message: "Invite not found" });
      }
      if (invite.status !== "pending") {
        return res.status(400).json({ message: "Can only resend pending invites" });
      }

      const workspace = await storage.getWorkspace(invite.workspaceId);
      const workspaceName = workspace?.name || "a workspace";
      const inviterName = `${(req as any).user.firstName || ""} ${(req as any).user.lastName || ""}`.trim() || "Someone";
      const appUrl = `${req.protocol}://${req.get("host")}`;

      await sendInviteEmail(
        invite.email,
        `Reminder: You're invited to join ${workspaceName} on Daily Sheet`,
        `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Friendly Reminder</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>${inviterName}</strong> invited you to join <strong>${workspaceName}</strong> on Daily Sheet as a <strong>${invite.role}</strong>.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Daily Sheet is a production management tool for live events. Create your account to join the crew and start collaborating.
          </p>
          <a href="${appUrl}/register?email=${encodeURIComponent(invite.email)}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">Join Daily Sheet</a>
        </div>`
      );

      res.json({ message: "Invite resent successfully" });
    } catch (error: any) {
      console.error("[email] Failed to resend invite:", error?.message || error);
      res.status(500).json({ message: "Failed to resend invite email" });
    }
  });

  app.delete("/api/workspaces/:id/members/:memberId", isAuthenticated, requireWorkspaceAdmin(), async (req: any, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const members = req.wsMembers;
      const targetMember = members.find((m: any) => m.id === Number(req.params.memberId));
      if (!targetMember) return res.status(404).json({ message: "Member not found in workspace" });
      await storage.removeWorkspaceMember(Number(req.params.memberId));
      const allContacts = await storage.getContacts(wsId);
      const linkedContacts = allContacts.filter((c: any) => c.userId === targetMember.userId);
      for (const c of linkedContacts) {
        await storage.deleteContact(c.id);
      }
      await storage.clearProjectManagerInWorkspace(targetMember.userId, wsId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  app.patch("/api/workspaces/:id/members/:memberId/role", isAuthenticated, requireWorkspaceAdmin(), async (req: any, res) => {
    try {
      const members = req.wsMembers;
      const targetMember = members.find((m: any) => m.id === Number(req.params.memberId));
      if (!targetMember) return res.status(404).json({ message: "Member not found in workspace" });
      const { role } = req.body;
      if (!["manager", "admin", "commenter", "client"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be manager, admin, commenter, or client." });
      }
      const updated = await storage.updateWorkspaceMemberRole(Number(req.params.memberId), role);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update member role" });
    }
  });

  app.post("/api/workspaces/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const userId = req.user.id;

      const workspace = await storage.getWorkspace(wsId);
      if (!workspace) return res.status(404).json({ message: "Organization not found" });

      if (workspace.ownerId === userId) {
        return res.status(403).json({ message: "The organization owner cannot leave. Transfer ownership first." });
      }

      const members = await storage.getWorkspaceMembers(wsId);
      const myMembership = members.find((m: any) => m.userId === userId);
      if (!myMembership) return res.status(404).json({ message: "You are not a member of this organization" });

      if (myMembership.role === "manager") {
        const otherManagers = members.filter((m: any) => ["owner", "manager"].includes(m.role) && m.userId !== userId);
        if (otherManagers.length === 0) {
          return res.status(403).json({ message: "You are the only manager. Promote another member before leaving." });
        }
      }

      await storage.removeWorkspaceMember(myMembership.id);
      await storage.deleteAssignmentsByUserInWorkspace(userId, wsId);
      const allContacts = await storage.getContacts(wsId);
      const linkedContacts = allContacts.filter((c: any) => c.userId === userId);
      for (const c of linkedContacts) {
        await storage.deleteContact(c.id);
      }

      let newWorkspaceId: number | null = null;
      if (req.user.workspaceId === wsId) {
        const remaining = await storage.getWorkspacesByUser(userId);
        if (remaining.length > 0) {
          newWorkspaceId = remaining[0].id;
          await storage.switchUserWorkspace(userId, newWorkspaceId);
        } else {
          await db.update(users).set({ workspaceId: null }).where(eq(users.id, userId));
          newWorkspaceId = null;
        }
      }

      res.json({ newWorkspaceId });
    } catch (error) {
      res.status(500).json({ message: "Failed to leave organization" });
    }
  });

  app.patch("/api/workspaces/:id/name", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const workspaceId = req.user.workspaceId;
      if (id !== workspaceId) return res.status(403).json({ message: "Cannot rename another organization" });
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ message: "Organization name is required" });
      const updated = await storage.updateWorkspace(id, { name: name.trim() });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to rename organization" });
    }
  });

  app.patch("/api/workspaces/:id/transfer-ownership", isAuthenticated, requireRole("owner"), async (req: any, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const currentOwnerId = req.user.id;
      const { newOwnerId } = req.body;

      if (!newOwnerId || typeof newOwnerId !== "string") {
        return res.status(400).json({ message: "newOwnerId is required" });
      }
      if (newOwnerId === currentOwnerId) {
        return res.status(400).json({ message: "You are already the owner" });
      }

      const members = await storage.getWorkspaceMembers(wsId);
      const targetMember = members.find((m: any) => m.userId === newOwnerId);
      if (!targetMember) {
        return res.status(404).json({ message: "Target user is not a member of this organization" });
      }

      // 1. Update workspace ownerId
      await storage.updateWorkspace(wsId, { ownerId: newOwnerId });

      // 2. Demote old owner's member row to "manager"
      const oldOwnerMember = members.find((m: any) => m.userId === currentOwnerId);
      if (oldOwnerMember) {
        await storage.updateWorkspaceMemberRole(oldOwnerMember.id, "manager");
      }

      // 3. Promote new owner's member row to "owner"
      await storage.updateWorkspaceMemberRole(targetMember.id, "owner");

      // 4. Reassign project managerId from old owner to new owner
      await storage.reassignProjectManagerInWorkspace(currentOwnerId, newOwnerId, wsId);

      res.json({ message: "Ownership transferred successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to transfer ownership" });
    }
  });
}
