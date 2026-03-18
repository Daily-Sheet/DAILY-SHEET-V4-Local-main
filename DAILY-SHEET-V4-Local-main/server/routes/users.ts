import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
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
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      const workspaceId = req.user.workspaceId;
      const members = await storage.getWorkspaceMembers(workspaceId);
      if (!members.find((m: any) => m.userId === targetId)) {
        return res.status(404).json({ message: "User not found in workspace" });
      }
      await storage.deleteUser(targetId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
}
