import type { Express } from "express";

export function registerConfigRoutes(app: Express) {
  app.get("/api/config/maps", (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || "" });
  });
}
