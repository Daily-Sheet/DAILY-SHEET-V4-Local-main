import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";

export function registerNotificationRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const notifs = await storage.getNotifications(user.id, user.workspaceId);
      res.json(notifs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const count = await storage.getUnreadNotificationCount(user.id, user.workspaceId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      await storage.markAllNotificationsAsRead(user.id, user.workspaceId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const id = Number(req.params.id);
      const userNotifs = await storage.getNotifications(user.id, user.workspaceId);
      if (!userNotifs.find(n => n.id === id)) {
        return res.status(404).json({ message: "Notification not found" });
      }
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const id = Number(req.params.id);
      const userNotifs = await storage.getNotifications(user.id, user.workspaceId);
      if (!userNotifs.find(n => n.id === id)) {
        return res.status(404).json({ message: "Notification not found" });
      }
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Activity Log
  app.get("/api/activity", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const limit = limitParam && !isNaN(limitParam) && limitParam > 0 ? limitParam : undefined;
      const sinceParam = req.query.since as string | undefined;
      const since = sinceParam ? new Date(sinceParam) : undefined;
      const eventName = req.query.event as string | undefined;
      const entries = await storage.getActivityLog(user.workspaceId, limit, since, eventName);

      if (req.query.counts === "true" && since) {
        const counts = await storage.getActivityCounts(user.workspaceId, since);
        return res.json({ entries, counts });
      }

      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/activity/last-seen", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workspaceId = req.user.workspaceId;
      const value = await storage.getSetting(`lastSeenActivity_${userId}`, workspaceId);
      res.json({ lastSeen: value || null });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/activity/mark-seen", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workspaceId = req.user.workspaceId;
      await storage.setSetting(`lastSeenActivity_${userId}`, new Date().toISOString(), workspaceId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Push token registration
  app.post("/api/push-token", isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token is required" });
      }
      await storage.updateUserPushToken(req.user.id, token);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to save push token" });
    }
  });
}
