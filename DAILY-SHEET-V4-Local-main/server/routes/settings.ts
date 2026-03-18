import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole } from "./utils";

export function registerSettingsRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/settings/:key", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json({ key: req.params.key, value: null });
    const value = await storage.getSetting(req.params.key, workspaceId);
    res.json({ key: req.params.key, value });
  });

  app.put("/api/settings/:key", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const { value } = req.body;
    if (typeof value !== "string") {
      return res.status(400).json({ message: "value must be a string" });
    }
    await storage.setSetting(req.params.key, value, workspaceId);
    res.json({ key: req.params.key, value });
  });
}
