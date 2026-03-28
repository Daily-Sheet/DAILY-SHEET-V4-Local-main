import type { Express } from "express";
import type multer from "multer";
import { randomUUID } from "crypto";
import fs from "fs";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole } from "./utils";
import { saveFileFromDisk } from "../fileStorage";
import { sendInviteEmail } from "./utils";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function registerBandPortalRoutes(app: Express, upload: multer.Multer) {
  // === AUTHENTICATED ROUTES (admin manages portal links) ===

  // List all portal links for workspace
  app.get("/api/band-portal-links", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.json([]);
      const links = await storage.getBandPortalLinks(workspaceId);
      res.json(links);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Create a portal link
  app.post("/api/band-portal-links", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });

      const { eventName, folderName, bandName, notes, expiresInDays } = req.body;
      if (!eventName || !folderName || !bandName?.trim()) {
        return res.status(400).json({ message: "Event, folder, and band name are required" });
      }

      const token = randomUUID();
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Resolve folderId from folderName
      let folderId: number | null = null;
      const folders = await storage.getFileFolders(workspaceId);
      const matchedFolder = folders.find((f: any) =>
        f.name === folderName && f.eventName === eventName
      );
      if (matchedFolder) folderId = matchedFolder.id;

      const link = await storage.createBandPortalLink({
        token,
        eventName,
        folderName,
        folderId,
        workspaceId,
        bandName: bandName.trim(),
        notes: notes || null,
        expiresAt,
        createdBy: req.user.id,
        revoked: false,
      });

      res.status(201).json(link);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Revoke a portal link
  app.patch("/api/band-portal-links/:id/revoke", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const id = parseInt(req.params.id);
      const updated = await storage.revokeBandPortalLink(id, workspaceId);
      if (!updated) return res.status(404).json({ message: "Link not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Delete a portal link
  app.delete("/api/band-portal-links/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const id = parseInt(req.params.id);
      const links = await storage.getBandPortalLinks(workspaceId);
      if (!links.find(l => l.id === id)) return res.status(404).json({ message: "Link not found" });
      await storage.deleteBandPortalLink(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Send portal link via email
  app.post("/api/band-portal-links/:id/send", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
      const id = parseInt(req.params.id);
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      const links = await storage.getBandPortalLinks(workspaceId);
      const link = links.find(l => l.id === id);
      if (!link) return res.status(404).json({ message: "Link not found" });

      const portalUrl = `${req.protocol}://${req.get("host")}/portal/${link.token}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0 0 8px;">Upload your rider</h2>
          <p style="color: #666; margin: 0 0 20px;">Hi ${link.bandName}, please upload your technical rider and any relevant documents using the link below.</p>
          <p style="margin: 0 0 8px;"><strong>Event:</strong> ${link.eventName}</p>
          ${link.notes ? `<p style="color: #666; margin: 0 0 20px;">${link.notes}</p>` : ""}
          <a href="${portalUrl}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 12px;">Upload Files</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">No account required. Just click the button above to upload.</p>
        </div>
      `;
      await sendInviteEmail(email, `Upload your rider — ${link.eventName}`, html);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === PUBLIC ROUTES (band uses token, no auth required) ===

  // Get portal info by token
  app.get("/api/portal/:token", async (req, res) => {
    try {
      const link = await storage.getBandPortalLinkByToken(req.params.token);
      if (!link) return res.status(404).json({ message: "Portal link not found" });
      if (link.revoked) return res.status(410).json({ message: "This upload link has been revoked" });
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ message: "This upload link has expired" });
      }

      // Get existing files in this specific folder (prefer folderId, fallback to folderName)
      const allFiles = await storage.getFiles(link.workspaceId);
      const folderFiles = link.folderId
        ? allFiles.filter((f: any) => f.folderId === link.folderId)
        : allFiles.filter((f: any) => f.eventName === link.eventName && f.folderName === link.folderName);

      res.json({
        bandName: link.bandName,
        eventName: link.eventName,
        folderName: link.folderName,
        notes: link.notes,
        files: folderFiles.map((f: any) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          uploadedAt: f.uploadedAt,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Upload file via portal token (no auth)
  app.post("/api/portal/:token/upload", upload.single("file"), async (req: any, res) => {
    try {
      const link = await storage.getBandPortalLinkByToken(req.params.token);
      if (!link) return res.status(404).json({ message: "Portal link not found" });
      if (link.revoked) return res.status(410).json({ message: "This upload link has been revoked" });
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ message: "This upload link has expired" });
      }

      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      if (req.file.size > MAX_FILE_SIZE) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(413).json({ message: "File too large. Maximum size is 50MB." });
      }

      const url = await saveFileFromDisk(req.file.path, req.file.filename);

      const file = await storage.createFile({
        name: req.body.name || req.file.originalname,
        url,
        type: req.file.mimetype,
        size: req.file.size,
        eventName: link.eventName,
        folderName: link.folderName,
        folderId: link.folderId ?? null,
        workspaceId: link.workspaceId,
      });

      res.status(201).json({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Upload failed" });
    }
  });
}
