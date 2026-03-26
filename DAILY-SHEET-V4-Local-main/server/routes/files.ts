import type { Express } from "express";
import type multer from "multer";
import express from "express";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { db } from "../db";
import { files } from "@shared/schema";
import { eq } from "drizzle-orm";
import { insertFileFolderSchema } from "@shared/schema";
import { z } from "zod";
import { saveFileFromDisk, streamFileToResponse, deleteStoredFile } from "../fileStorage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, getUserAllowedEventNames } from "./utils";

export function registerFileRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/files", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let filesList = await storage.getFiles(workspaceId);
    const allowed = await getUserAllowedEventNames(req.user.id, workspaceId);
    if (allowed !== null) {
      if (allowed.length === 0) return res.json([]);
      const allowedSet = new Set(allowed);
      // Allow project-level files (no eventName) + show-level files the user can access
      filesList = filesList.filter((f: any) =>
        f.projectId && !f.eventName ? true : f.eventName && allowedSet.has(f.eventName)
      );
    }
    res.json(filesList);
  });

  app.post("/api/files", isAuthenticated, requireRole("owner", "manager", "admin"), upload.single("file"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const eventName = req.body.eventName || null;
      const folderName = req.body.folderName || null;
      const projectId = req.body.projectId ? Number(req.body.projectId) : null;
      const diskPath = req.file.path;
      const url = await saveFileFromDisk(diskPath, req.file.filename);
      const fileData: any = {
        name: req.body.name || req.file.originalname,
        url,
        type: req.file.mimetype,
        size: req.file.size,
        eventName,
        folderName,
        workspaceId,
        projectId,
      };
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (err) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.patch("/api/files/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const fileId = Number(req.params.id);
      const { name } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      const allFiles = await storage.getFiles(workspaceId);
      const record = allFiles.find((f: any) => f.id === fileId);
      if (!record) return res.status(404).json({ message: "File not found" });
      const updated = await storage.updateFile(fileId, { name: name.trim() });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to rename file" });
    }
  });

  app.delete("/api/files/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const fileId = Number(req.params.id);
      const allFiles = await storage.getFiles(workspaceId);
      const record = allFiles.find((f: any) => f.id === fileId);
      if (!record) return res.status(404).json({ message: "File not found" });
      await deleteStoredFile(record.url);
      await storage.deleteFile(fileId);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.get("/api/files/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const fileId = Number(req.params.id);
      const allFiles = await storage.getFiles(workspaceId);
      const record = allFiles.find((f: any) => f.id === fileId);
      if (!record) return res.status(404).json({ message: "File not found" });
      const mime = record.type || "application/octet-stream";
      const isViewable = mime.startsWith("image/") || mime.startsWith("text/") || mime.startsWith("video/") || mime.startsWith("audio/") || mime === "application/pdf";
      const served = await streamFileToResponse(record.url, res, mime, record.name, isViewable);
      if (!served) {
        return res.status(404).json({ message: "File not found in storage" });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // File Folders
  app.get("/api/file-folders", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    const folders = await storage.getFileFolders(workspaceId);
    res.json(folders);
  });

  app.post("/api/file-folders", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const input = insertFileFolderSchema.parse(req.body);
      if (workspaceId) {
        const folders = await storage.getFileFolders(workspaceId);
        const existing = folders.find((f: any) =>
          f.name.toLowerCase() === input.name.trim().toLowerCase() &&
          f.eventName === (input.eventName || null) &&
          f.parentId === (input.parentId || null) &&
          f.projectId === (input.projectId || null)
        );
        if (existing) {
          return res.status(409).json({ message: "A folder with that name already exists" });
        }
      }
      const folder = await storage.createFileFolder({ name: input.name.trim(), eventName: input.eventName || null, parentId: input.parentId || null, workspaceId, projectId: input.projectId || null });
      res.status(201).json(folder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/file-folders/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const folderId = Number(req.params.id);
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      const allFolders = await storage.getFileFolders(workspaceId);
      const record = allFolders.find((f: any) => f.id === folderId);
      if (!record) return res.status(404).json({ message: "Folder not found" });
      const oldName = record.name;
      const newName = name.trim();
      const updated = await storage.updateFileFolder(folderId, { name: newName });
      if (workspaceId && oldName !== newName) {
        const allFiles = await storage.getFiles(workspaceId);
        const folderFiles = allFiles.filter((f: any) => f.folderName === oldName && f.eventName === record.eventName && (f.projectId || null) === (record.projectId || null));
        for (const f of folderFiles) {
          await storage.updateFile(f.id, { name: f.name });
          await db.update(files).set({ folderName: newName }).where(eq(files.id, f.id));
        }
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to rename folder" });
    }
  });

  app.delete("/api/file-folders/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const folderId = Number(req.params.id);
      const allFolders = await storage.getFileFolders(workspaceId);
      const record = allFolders.find((f: any) => f.id === folderId);
      if (!record) return res.status(404).json({ message: "Folder not found" });

      const getDescendantFolderIds = (parentId: number): number[] => {
        const children = allFolders.filter((f: any) => f.parentId === parentId);
        let ids: number[] = [];
        for (const child of children) {
          ids.push(child.id);
          ids = ids.concat(getDescendantFolderIds(child.id));
        }
        return ids;
      }
      const allFolderIds = [folderId, ...getDescendantFolderIds(folderId)];
      const foldersToDelete = allFolders.filter((f: any) => allFolderIds.includes(f.id));

      if (workspaceId) {
        const allFiles = await storage.getFiles(workspaceId);
        for (const folder of foldersToDelete) {
          const folderFiles = allFiles.filter((f: any) => f.folderName === folder.name && f.eventName === folder.eventName && (f.projectId || null) === (folder.projectId || null));
          for (const f of folderFiles) {
            const diskPath = path.join(process.cwd(), f.url);
            if (fs.existsSync(diskPath)) {
              try { fs.unlinkSync(diskPath); } catch (_) {}
            }
          }
        }
      }
      for (const id of allFolderIds.reverse()) {
        await storage.deleteFileFolder(id, workspaceId);
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Static serving for uploads
  app.use("/uploads", (req, res, next) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    next();
  }, (req, res, next) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    express.static(uploadDir)(req, res, next);
  });
}
