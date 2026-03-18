import type { Express } from "express";
import type multer from "multer";
import path from "path";
import fs from "fs";
import OpenAI from "openai";
import { storage } from "../storage";
import { z } from "zod";
import { api } from "@shared/routes";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, getUserAllowedEventNames } from "./utils";

export function registerVenueRoutes(app: Express, upload: multer.Multer) {
  // Venues (shared globally across all workspaces)
  app.get(api.venues.list.path, isAuthenticated, async (req: any, res) => {
    if (!req.user.workspaceId) return res.json([]);
    res.json(await storage.getAllVenues());
  });

  async function autoCreateContactForVenue(contactName: string | null | undefined, contactPhone: string | null | undefined, workspaceId: number) {
    if (!contactName || !contactName.trim()) return;
    const name = contactName.trim();
    const parts = name.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    const phone = contactPhone?.trim() || null;
    const existingContacts = await storage.getContacts(workspaceId);
    const match = existingContacts.find(c => {
      const existingFull = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase();
      return existingFull === name.toLowerCase();
    });
    if (match) {
      if (phone && phone !== match.phone) {
        await storage.updateContact(match.id, { phone });
      }
    } else {
      await storage.createContact({
        firstName,
        lastName: lastName || null,
        role: "Venue",
        phone,
        email: null,
        notes: null,
        workspaceId,
      });
    }
  }

  app.post(api.venues.create.path, isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const input = api.venues.create.input.parse(req.body);
      const venue = await storage.createVenue({ ...input, workspaceId: null, createdByWorkspaceId: workspaceId });
      await autoCreateContactForVenue(input.contactName, input.contactPhone, workspaceId);
      res.status(201).json(venue);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/venues/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const id = parseInt(req.params.id);
      const record = await storage.getVenue(id);
      if (!record) return res.status(404).json({ message: "Venue not found" });
      const input = api.venues.update.input.parse(req.body);
      const venue = await storage.updateVenue(id, input);
      if (input.contactName) {
        await autoCreateContactForVenue(input.contactName, input.contactPhone ?? record.contactPhone, workspaceId);
      }
      res.json(venue);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/venues/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const id = parseInt(req.params.id);
    const record = await storage.getVenue(id);
    if (!record) return res.status(404).json({ message: "Venue not found" });
    if (record.createdByWorkspaceId !== null && record.createdByWorkspaceId !== workspaceId) {
      return res.status(403).json({ message: "Only the workspace that created this venue can delete it." });
    }
    await storage.deleteVenue(id, workspaceId);
    res.sendStatus(204);
  });

  app.post("/api/venues/parse-tech-packet", isAuthenticated, requireRole("owner", "manager", "admin"), upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filepath = req.file.path;
      const filename = req.file.originalname;

      const fileBuffer = fs.readFileSync(filepath);
      const base64 = fileBuffer.toString("base64");

      const ext = path.extname(filename).toLowerCase();
      const supportedImageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const isPdf = ext === ".pdf";
      const isImage = supportedImageExts.includes(ext);

      if (!isPdf && !isImage) {
        fs.unlinkSync(filepath);
        return res.status(400).json({ message: "Unsupported file type. Please upload a PDF or image (JPG, PNG, WEBP)." });
      }

      let mimeType = "application/octet-stream";
      if ([".jpg", ".jpeg"].includes(ext)) mimeType = "image/jpeg";
      else if (ext === ".png") mimeType = "image/png";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (isPdf) mimeType = "application/pdf";

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const contentParts: any[] = [];

      if (isImage) {
        const dataUrl = `data:${mimeType};base64,${base64}`;
        contentParts.push({
          type: "image_url",
          image_url: { url: dataUrl }
        });
      }

      let pdfText = "";
      if (isPdf) {
        try {
          const { PDFParse, VerbosityLevel } = await import("pdf-parse");
          const parser = new PDFParse({ data: new Uint8Array(fileBuffer), verbosity: VerbosityLevel.ERRORS });
          const result = await parser.getText();
          pdfText = result.text || "";
          await parser.destroy();
        } catch (pdfErr: any) {
          console.error("PDF parsing error:", pdfErr);
          return res.status(400).json({ message: "Could not read this PDF. Try uploading an image/screenshot of the tech packet instead." });
        }
        if (!pdfText.trim()) {
          return res.status(400).json({ message: "Could not extract text from PDF. Try uploading an image instead." });
        }
      }

      contentParts.push({
        type: "text",
        text: `You are a venue information extractor for live event production. ${isPdf ? `Here is the text extracted from a tech packet PDF:\n\n---\n${pdfText}\n---\n\nAnalyze` : "Analyze"} this tech packet document and extract all venue details you can find. Return a JSON object with these exact fields:
{
  "name": "venue name (string or null)",
  "address": "full street address (string or null)",
  "contactName": "production contact name (string or null)",
  "contactPhone": "contact phone number (string or null)",
  "wifiSsid": "wifi network name (string or null)",
  "wifiPassword": "wifi password (string or null)",
  "parking": "parking details (string or null)",
  "loadIn": "load-in information - doors, dock locations, times (string or null)",
  "capacity": "venue capacity (string or null)",
  "dressingRooms": "boolean or null - true if available",
  "dressingRoomsNotes": "dressing room details (string or null)",
  "showers": "boolean or null - true if available",
  "showersNotes": "shower details (string or null)",
  "laundry": "boolean or null - true if available",
  "laundryNotes": "laundry details (string or null)",
  "meals": "one of: none, client_provided, walkaway, or null",
  "mealsNotes": "meal details (string or null)",
  "notes": "any other important venue information not captured above (string or null)"
}
For any field you cannot determine from the document, use null. Be thorough - tech packets often contain power specs, stage dimensions, rigging points, and other technical details that should go in the notes field.`
      });

      const techPacketUrl = `/uploads/${req.file.filename}`;
      const models = ["gpt-4o", "gpt-5.2"];
      let lastError: any = null;

      for (const model of models) {
        try {
          const response = await openai.chat.completions.create({
            model,
            messages: [{
              role: "user",
              content: contentParts
            }],
            response_format: { type: "json_object" },
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            lastError = new Error("No response from AI");
            continue;
          }

          const parsed = JSON.parse(content);
          parsed.techPacketUrl = techPacketUrl;
          return res.json(parsed);
        } catch (modelErr: any) {
          console.error(`Tech packet parse error with ${model}:`, modelErr.message || modelErr);
          lastError = modelErr;
        }
      }

      res.status(500).json({
        message: "Failed to parse tech packet: " + (lastError?.message || "Unknown error"),
        techPacketUrl,
      });
    } catch (err: any) {
      console.error("Tech packet parse error:", err);
      const techPacketUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      res.status(500).json({
        message: "Failed to parse tech packet: " + (err.message || "Unknown error"),
        techPacketUrl,
      });
    }
  });

  app.get("/api/venues/:id/tech-packets", isAuthenticated, async (req: any, res) => {
    const venueId = parseInt(req.params.id);
    const packets = await storage.getTechPacketsByVenue(venueId);
    res.json(packets);
  });

  app.post("/api/venues/:id/tech-packet", isAuthenticated, requireRole("owner", "manager", "admin"), upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const venueId = parseInt(req.params.id);
      const workspaceId = req.user.workspaceId;
      const url = `/uploads/${req.file.filename}`;
      const originalName = req.file.originalname || null;

      const ws = workspaceId ? await storage.getWorkspace(workspaceId) : null;
      const workspaceName = ws?.name ?? null;

      const packet = await storage.createTechPacket({ venueId, url, originalName, workspaceId, workspaceName });
      // Also update the venue's primary techPacketUrl for backward compat
      await storage.updateVenue(venueId, { techPacketUrl: url });
      res.json(packet);
    } catch (err: any) {
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      console.error("Tech packet upload error:", err);
      res.status(500).json({ message: "Failed to upload tech packet" });
    }
  });

  // Zones
  app.get("/api/zones", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let zoneList = await storage.getZones(workspaceId);
    const allowed = await getUserAllowedEventNames(req.user.id, workspaceId);
    if (allowed !== null) {
      if (allowed.length === 0) return res.json([]);
      const allEvents = await storage.getEvents(workspaceId);
      const allowedVenueIds = new Set(
        allEvents.filter((e: any) => allowed.includes(e.name)).map((e: any) => e.venueId).filter(Boolean)
      );
      const dayVenues = await storage.getAllEventDayVenues(workspaceId);
      const allowedEventIds = new Set(
        allEvents.filter((e: any) => allowed.includes(e.name)).map((e: any) => e.id)
      );
      dayVenues.filter((dv: any) => allowedEventIds.has(dv.eventId)).forEach((dv: any) => allowedVenueIds.add(dv.venueId));
      zoneList = zoneList.filter((z: any) => allowedVenueIds.has(z.venueId));
    }
    res.json(zoneList);
  });

  app.get("/api/venues/:venueId/zones", isAuthenticated, async (req: any, res) => {
    const venueId = parseInt(req.params.venueId);
    const zoneList = await storage.getZonesByVenue(venueId);
    res.json(zoneList);
  });

  app.post("/api/zones", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const { name, description, venueId, sortOrder } = req.body;
    if (!name?.trim() || !venueId) return res.status(400).json({ message: "Name and venue are required" });
    const zone = await storage.createZone({ name: name.trim(), description: description || null, venueId, sortOrder: sortOrder || 0, workspaceId });
    res.status(201).json(zone);
  });

  app.patch("/api/zones/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updated = await storage.updateZone(id, data);
    res.json(updated);
  });

  app.delete("/api/zones/:id", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteZone(id);
    res.sendStatus(204);
  });
}
