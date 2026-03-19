import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";

export function registerMapRoutes(app: Express, _upload: multer.Multer) {
  // Get all pins with like counts, comment counts, and current user's like status
  app.get("/api/map/pins", isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const pins = await storage.getMapPins();
    const enriched = await Promise.all(pins.map(async (pin) => {
      const likes = await storage.getMapPinLikes(pin.id);
      const comments = await storage.getMapPinComments(pin.id);
      return {
        ...pin,
        likeCount: likes.length,
        commentCount: comments.length,
        likedByMe: likes.some(l => l.userId === userId),
      };
    }));
    res.json(enriched);
  });

  // Create a pin
  app.post("/api/map/pins", isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const userName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Anonymous";
    const { lat, lng, title, category, description, address, website } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    if (lat == null || lng == null) return res.status(400).json({ message: "Location is required" });
    const pin = await storage.createMapPin({
      userId, userName,
      lat: parseFloat(lat), lng: parseFloat(lng),
      title: title.trim(),
      category: category || "other",
      description: description || null,
      address: address || null,
      website: website || null,
    });
    res.status(201).json(pin);
  });

  // Update a pin (owner only)
  app.patch("/api/map/pins/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const pins = await storage.getMapPins();
    const pin = pins.find(p => p.id === id);
    if (!pin) return res.status(404).json({ message: "Not found" });
    if (pin.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    const { title, category, description, address, website } = req.body;
    const updated = await storage.updateMapPin(id, {
      ...(title && { title: title.trim() }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
      ...(address !== undefined && { address }),
      ...(website !== undefined && { website }),
    });
    res.json(updated);
  });

  // Delete a pin (owner only)
  app.delete("/api/map/pins/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const pins = await storage.getMapPins();
    const pin = pins.find(p => p.id === id);
    if (!pin) return res.status(404).json({ message: "Not found" });
    if (pin.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteMapPin(id);
    res.sendStatus(204);
  });

  // Toggle like
  app.post("/api/map/pins/:id/like", isAuthenticated, async (req: any, res) => {
    const pinId = parseInt(req.params.id);
    const result = await storage.toggleMapPinLike(pinId, req.user.id);
    res.json(result);
  });

  // Get comments for a pin
  app.get("/api/map/pins/:id/comments", isAuthenticated, async (req: any, res) => {
    const pinId = parseInt(req.params.id);
    const comments = await storage.getMapPinComments(pinId);
    res.json(comments);
  });

  // Add a comment
  app.post("/api/map/pins/:id/comments", isAuthenticated, async (req: any, res) => {
    const pinId = parseInt(req.params.id);
    const userId = req.user.id;
    const userName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Anonymous";
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content is required" });
    const comment = await storage.createMapPinComment({ pinId, userId, userName, content: content.trim() });
    res.status(201).json(comment);
  });

  // Delete a comment (owner only)
  app.delete("/api/map/comments/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    // Fetch all comments to find this one (simple approach)
    // We store userId on the comment so we can check ownership
    const { db } = await import("../db");
    const { mapPinComments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const [comment] = await db.select().from(mapPinComments).where(eq(mapPinComments.id, id));
    if (!comment) return res.status(404).json({ message: "Not found" });
    if (comment.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteMapPinComment(id);
    res.sendStatus(204);
  });
}
