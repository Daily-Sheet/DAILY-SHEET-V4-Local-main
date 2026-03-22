import "./env";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { seedGlobalTemplates } from "./seed-templates";

const app = express();
const httpServer = createServer(app);

const corsOrigins: (string | RegExp)[] = [];
if (process.env.CORS_ORIGIN) {
  corsOrigins.push(...process.env.CORS_ORIGIN.split(",").map(o => o.trim()));
}
if (process.env.NODE_ENV !== "production") {
  corsOrigins.push(/http:\/\/localhost:\d+/);
}
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  // Ensure community map tables exist (idempotent — safe on every deploy)
  try {
    const { pool } = await import("./db");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS map_pins (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        user_name TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        description TEXT,
        address TEXT,
        website TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS map_pin_likes (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER NOT NULL,
        user_id VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS map_pin_comments (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER NOT NULL,
        user_id VARCHAR NOT NULL,
        user_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_locations (
        user_id VARCHAR PRIMARY KEY,
        user_name TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        sharing BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    log("Map tables ready");
  } catch (err) {
    console.error("Map table migration error (non-fatal):", err);
  }

  // Legs migration
  try {
    const { pool } = await import("./db");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS legs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        workspace_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        notes TEXT
      );
      ALTER TABLE events ADD COLUMN IF NOT EXISTS leg_id INTEGER;
      ALTER TABLE travel_days ADD COLUMN IF NOT EXISTS leg_id INTEGER;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'show';
      ALTER TABLE legs ADD COLUMN IF NOT EXISTS start_date TEXT;
      ALTER TABLE legs ADD COLUMN IF NOT EXISTS end_date TEXT;
    `);
    log("Legs migration ready");
  } catch (err) {
    console.error("Legs migration error (non-fatal):", err);
  }

  // Event tags migration
  try {
    const { pool } = await import("./db");
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS tag TEXT;`);
    log("Event tags migration ready");
  } catch (err) {
    console.error("Event tags migration error (non-fatal):", err);
  }

  // Schedule isNextDay migration
  try {
    const { pool } = await import("./db");
    await pool.query(`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_next_day BOOLEAN DEFAULT FALSE;`);
    log("Schedule isNextDay migration ready");
  } catch (err) {
    console.error("Schedule isNextDay migration error (non-fatal):", err);
  }

  await registerRoutes(httpServer, app);

  storage.deduplicateContacts().then(count => {
    if (count > 0) log(`Deduplicated ${count} contact record(s)`);
  }).catch(err => console.error("Contact dedup error:", err));

  seedGlobalTemplates().catch(err => console.error("Template seed error:", err));

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
