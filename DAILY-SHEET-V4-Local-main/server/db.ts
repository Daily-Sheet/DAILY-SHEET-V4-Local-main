import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Fix: pg sends 'timestamp without time zone' as space-separated strings
// (e.g., "2026-03-26 21:14:41") which V8 interprets as UTC instead of local time.
// Replace space with 'T' so the Date constructor treats it as local time,
// matching the Neon DB session timezone (America/Los_Angeles).
pg.types.setTypeParser(1114, (str: string) => new Date(str.replace(" ", "T")));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool, { schema });
