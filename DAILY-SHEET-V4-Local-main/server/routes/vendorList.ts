import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { checkAchievements } from "../achievements/engine";

export const VENDOR_CATEGORIES = [
  "audio",
  "lighting",
  "video",
  "staging",
  "backline",
  "transport",
  "catering",
  "security",
  "staffing",
  "rental",
  "power",
  "rigging",
  "effects",
  "decor",
  "photography",
  "other",
] as const;

export function registerVendorListRoutes(app: Express, _upload: multer.Multer) {
  // Get workspace vendors with average ratings
  app.get("/api/vendor-list", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const vendorsList = await storage.getVendors(workspaceId);
    const enriched = await Promise.all(vendorsList.map(async (v) => {
      const ratings = await storage.getVendorRatings(v.id);
      const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null;
      return { ...v, avgRating: avg, ratingCount: ratings.length };
    }));
    res.json(enriched);
  });

  // Create vendor (owner/manager/admin)
  app.post("/api/vendor-list", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Only owners, managers, or admins can add vendors" });
    }
    const { name, category, contactName, contactEmail, contactPhone, website, region, city, state, notes, isPublic } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!category?.trim()) return res.status(400).json({ message: "Category is required" });

    const vendor = await storage.createVendor({
      workspaceId: req.user.workspaceId,
      name: name.trim(),
      category,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      website: website || null,
      region: region || null,
      city: city || null,
      state: state || null,
      notes: notes || null,
      isPublic: isPublic ?? false,
      createdBy: req.user.id,
    });
    res.status(201).json(vendor);
  });

  // Update vendor (owner/manager/admin, same workspace)
  app.patch("/api/vendor-list/:id", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const id = parseInt(req.params.id);
    const vendor = await storage.getVendor(id);
    if (!vendor) return res.status(404).json({ message: "Not found" });
    if (vendor.workspaceId !== req.user.workspaceId) return res.status(403).json({ message: "Forbidden" });

    const { name, category, contactName, contactEmail, contactPhone, website, region, city, state, notes, isPublic } = req.body;
    const updated = await storage.updateVendor(id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(category !== undefined && { category }),
      ...(contactName !== undefined && { contactName }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(website !== undefined && { website }),
      ...(region !== undefined && { region }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(notes !== undefined && { notes }),
      ...(isPublic !== undefined && { isPublic }),
    });
    res.json(updated);
  });

  // Delete vendor (owner/manager/admin, same workspace)
  app.delete("/api/vendor-list/:id", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const id = parseInt(req.params.id);
    const vendor = await storage.getVendor(id);
    if (!vendor) return res.status(404).json({ message: "Not found" });
    if (vendor.workspaceId !== req.user.workspaceId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteVendor(id);
    res.sendStatus(204);
  });

  // Browse public community vendors (across all workspaces)
  app.get("/api/vendor-list/community", isAuthenticated, async (req: any, res) => {
    const vendorsList = await storage.getPublicVendors();
    const enriched = await Promise.all(vendorsList.map(async (v) => {
      const ratings = await storage.getVendorRatings(v.id);
      const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null;
      return { ...v, avgRating: avg, ratingCount: ratings.length };
    }));
    res.json(enriched);
  });

  // Import a public vendor into your workspace
  app.post("/api/vendor-list/:id/import", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const id = parseInt(req.params.id);
    const source = await storage.getVendor(id);
    if (!source || !source.isPublic) return res.status(404).json({ message: "Not found or not public" });
    if (source.workspaceId === req.user.workspaceId) return res.status(400).json({ message: "Already in your workspace" });

    const imported = await storage.createVendor({
      workspaceId: req.user.workspaceId,
      name: source.name,
      category: source.category,
      contactName: source.contactName,
      contactEmail: source.contactEmail,
      contactPhone: source.contactPhone,
      website: source.website,
      region: source.region,
      city: source.city,
      state: source.state,
      notes: source.notes,
      isPublic: false,
      importedFromVendorId: source.id,
      createdBy: req.user.id,
    });
    res.status(201).json(imported);
  });

  // Rate/review a vendor
  app.post("/api/vendor-list/:id/rate", isAuthenticated, async (req: any, res) => {
    const vendorId = parseInt(req.params.id);
    const vendor = await storage.getVendor(vendorId);
    if (!vendor) return res.status(404).json({ message: "Not found" });

    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" });

    const userName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Anonymous";
    const result = await storage.upsertVendorRating({
      vendorId,
      userId: req.user.id,
      workspaceId: req.user.workspaceId,
      rating,
      review: review || null,
    });

    checkAchievements(req.user.id, "vendor:rated", {
      workspaceId: req.user.workspaceId,
      actorName: userName,
    }).catch(() => {});

    res.json(result);
  });

  // Get ratings for a vendor
  app.get("/api/vendor-list/:id/ratings", isAuthenticated, async (req: any, res) => {
    const vendorId = parseInt(req.params.id);
    const ratings = await storage.getVendorRatings(vendorId);
    res.json(ratings);
  });
}
