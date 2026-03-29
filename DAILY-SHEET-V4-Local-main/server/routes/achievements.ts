import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_BY_KEY } from "@shared/achievements";
import { checkAchievements, recalculateAllProgress } from "../achievements/engine";

export function registerAchievementRoutes(app: Express, _upload: multer.Multer) {
  // Get full catalog with user's unlock status
  app.get("/api/achievements/catalog", isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const unlocked = await storage.getUserAchievements(userId);
    const unlockedKeys = new Set(unlocked.map(a => a.achievementKey));
    const progress = await storage.getAchievementProgress(userId);
    const progressMap = new Map(progress.map(p => [p.metricKey, p.value]));

    const catalog = ACHIEVEMENT_CATALOG.map(a => {
      const isUnlocked = unlockedKeys.has(a.key);
      const unlock = unlocked.find(u => u.achievementKey === a.key);
      // Hide secret achievements that haven't been unlocked
      if (a.secret && !isUnlocked) {
        return {
          key: a.key,
          name: "???",
          description: "This achievement is hidden. Keep exploring!",
          icon: "🔒",
          category: a.category,
          secret: true,
          threshold: a.threshold,
          metricKey: a.metricKey,
          unlocked: false,
          unlockedAt: null,
          progress: 0,
        };
      }
      return {
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        secret: a.secret,
        threshold: a.threshold,
        metricKey: a.metricKey,
        unlocked: isUnlocked,
        unlockedAt: unlock?.unlockedAt ?? null,
        progress: progressMap.get(a.metricKey) ?? 0,
      };
    });

    res.json(catalog);
  });

  // Get current user's unlocked achievements
  app.get("/api/achievements/my", isAuthenticated, async (req: any, res) => {
    const unlocked = await storage.getUserAchievements(req.user.id);
    const progress = await storage.getAchievementProgress(req.user.id);
    const prefs = await storage.getAchievementDisplayPrefs(req.user.id);
    res.json({ unlocked, progress, displayPrefs: prefs || null });
  });

  // Get another user's public achievements
  app.get("/api/achievements/user/:userId", isAuthenticated, async (req: any, res) => {
    const { userId } = req.params;
    const unlocked = await storage.getUserAchievements(userId);
    const unlockedKeys = new Set(unlocked.map(a => a.achievementKey));
    const prefs = await storage.getAchievementDisplayPrefs(userId);

    // Only show unlocked achievements (secrets that are unlocked become visible)
    const visible = unlocked.map(u => {
      const def = ACHIEVEMENT_BY_KEY.get(u.achievementKey);
      if (!def) return null;
      return {
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        secret: def.secret,
        unlockedAt: u.unlockedAt,
      };
    }).filter(Boolean);

    res.json({
      achievements: visible,
      displayPrefs: prefs || null,
      totalUnlocked: unlocked.length,
      totalAvailable: ACHIEVEMENT_CATALOG.length,
    });
  });

  // Workspace-wide achievement overview (owner/manager/admin)
  app.get("/api/achievements/workspace", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const workspaceId = req.user.workspaceId;
    // Get all workspace members
    const members = await storage.getWorkspaceMembers(workspaceId);
    const memberData = await Promise.all(members.map(async (m) => {
      const user = await storage.getUser(m.userId);
      const unlocked = await storage.getUserAchievements(m.userId);
      const unlockedKeys = new Set(unlocked.map(a => a.achievementKey));
      const achievements = unlocked.map(u => {
        const def = ACHIEVEMENT_BY_KEY.get(u.achievementKey);
        if (!def) return null;
        return {
          key: def.key,
          name: def.name,
          icon: def.icon,
          category: def.category,
          secret: def.secret,
          unlockedAt: u.unlockedAt,
        };
      }).filter(Boolean);
      return {
        userId: m.userId,
        name: user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : m.userId,
        profileImageUrl: user?.profileImageUrl || null,
        role: m.role,
        unlockedCount: unlocked.length,
        achievements,
      };
    }));

    // Build per-achievement breakdown: who has each one
    const achievementBreakdown = ACHIEVEMENT_CATALOG.map(a => {
      const holders = memberData
        .filter(m => m.achievements.some((ua: any) => ua.key === a.key))
        .map(m => ({ userId: m.userId, name: m.name, profileImageUrl: m.profileImageUrl }));
      return {
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        secret: a.secret,
        threshold: a.threshold,
        holderCount: holders.length,
        holders,
      };
    });

    res.json({
      members: memberData.sort((a, b) => b.unlockedCount - a.unlockedCount),
      achievements: achievementBreakdown,
      totalAchievements: ACHIEVEMENT_CATALOG.length,
    });
  });

  // Manual trigger for achievement recheck
  app.post("/api/achievements/check", isAuthenticated, async (req: any, res) => {
    const newlyUnlocked = await recalculateAllProgress(req.user.id);
    res.json({ newlyUnlocked });
  });

  // Update display preferences
  app.patch("/api/achievements/display-prefs", isAuthenticated, async (req: any, res) => {
    const { pinnedAchievements, showOnCrewCard } = req.body;
    const prefs = await storage.upsertAchievementDisplayPrefs(
      req.user.id,
      pinnedAchievements,
      showOnCrewCard,
    );
    res.json(prefs);
  });
}
