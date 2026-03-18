import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole } from "./utils";

export function registerUserRoutes(app: Express, upload: multer.Multer) {
  // Admin password reset
  app.patch("/api/users/:id/password", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const members = await storage.getWorkspaceMembers(workspaceId);
      if (!members.find((m: any) => m.userId === req.params.id)) {
        return res.status(404).json({ message: "User not found in workspace" });
      }
      const { password } = req.body;
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const bcrypt = await import("bcrypt");
      const passwordHash = await bcrypt.default.hash(password, 10);
      await storage.updateUserPassword(req.params.id, passwordHash);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.patch("/api/user/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const { tabOrder, hiddenTabs, defaultTab } = req.body;
      if (!Array.isArray(tabOrder) || !Array.isArray(hiddenTabs) || typeof defaultTab !== "string") {
        return res.status(400).json({ message: "Invalid preferences format" });
      }
      const updated = await storage.updateUserPreferences(req.user.id, { tabOrder, hiddenTabs, defaultTab });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const targetId = req.params.id;
      if (targetId === req.user.id) {
        return res.status(400).json({ message: "You cannot remove yourself" });
      }
      const workspaceId = req.user.workspaceId;
      const members = await storage.getWorkspaceMembers(workspaceId);
      const membership = members.find((m: any) => m.userId === targetId);
      if (!membership) {
        return res.status(404).json({ message: "User not found in workspace" });
      }

      // Remove from workspace membership only — do NOT delete the user account
      await storage.removeWorkspaceMember(membership.id);

      // Remove their contacts and assignments scoped to this workspace
      const allContacts = await storage.getContacts(workspaceId);
      for (const c of allContacts.filter((c: any) => c.userId === targetId)) {
        await storage.deleteContact(c.id);
      }
      await storage.deleteAssignmentsByUserInWorkspace(targetId, workspaceId);

      // If this workspace was their active workspace, clear it so they land on workspace selection
      const targetUser = await storage.getUser(targetId);
      if (targetUser?.workspaceId === workspaceId) {
        const remaining = await storage.getWorkspacesByUser(targetId);
        const next = remaining.find((w: any) => w.id !== workspaceId);
        await db.update(users).set({ workspaceId: next?.id ?? null }).where(eq(users.id, targetId));
      }

      res.json({ message: "User removed from workspace" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove user from workspace" });
    }
  });
}
