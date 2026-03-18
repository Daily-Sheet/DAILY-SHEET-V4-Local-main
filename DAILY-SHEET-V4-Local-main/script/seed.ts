/**
 * Daily Sheet — Local Development Seed Script
 *
 * Creates a default workspace and admin user for local development.
 * Safe to run multiple times — skips creation if records already exist.
 *
 * Usage:
 *   DATABASE_URL=postgresql://dailysheet:dailysheet@localhost:5432/dailysheet \
 *     npx tsx script/seed.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcrypt";
import { eq, count, isNotNull } from "drizzle-orm";
import { users, workspaces, workspaceMembers } from "../shared/models/auth.js";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema: { users, workspaces, workspaceMembers } });

// ── Seed configuration ──────────────────────────────────────────────────────

const SEED_ADMIN = {
  email: "admin@localhost",
  password: "admin1234",
  firstName: "Admin",
  lastName: "User",
  department: "Management" as const,
};

const SEED_WORKSPACE = {
  name: "My Organization",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function ok(msg: string) { console.log(`  ✓  ${msg}`); }
function skip(msg: string) { console.log(`  –  ${msg} (already exists, skipping)`); }

// ── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\nDaily Sheet — seed script\n");

  // 1. Admin user
  const [{ value: existingUserCount }] = await db
    .select({ value: count() })
    .from(users)
    .where(isNotNull(users.passwordHash));

  let adminUserId: string;

  if (existingUserCount > 0) {
    skip(`Admin user (${SEED_ADMIN.email})`);
    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, SEED_ADMIN.email));
    if (!existingAdmin) {
      console.log(`  !  No user with email ${SEED_ADMIN.email} found. Seed a fresh DB or update SEED_ADMIN.email.`);
      process.exit(0);
    }
    adminUserId = existingAdmin.id;
  } else {
    const passwordHash = await bcrypt.hash(SEED_ADMIN.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        email: SEED_ADMIN.email,
        firstName: SEED_ADMIN.firstName,
        lastName: SEED_ADMIN.lastName,
        department: SEED_ADMIN.department,
        passwordHash,
        role: "admin",
        superAdmin: true,
      })
      .returning({ id: users.id });
    adminUserId = newUser.id;
    ok(`Created admin user: ${SEED_ADMIN.email} / password: ${SEED_ADMIN.password}`);
  }

  // 2. Workspace
  const existingWorkspaces = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerId, adminUserId));

  let workspaceId: number;

  if (existingWorkspaces.length > 0) {
    workspaceId = existingWorkspaces[0].id;
    skip(`Workspace "${SEED_WORKSPACE.name}"`);
  } else {
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({ name: SEED_WORKSPACE.name, ownerId: adminUserId })
      .returning({ id: workspaces.id });
    workspaceId = newWorkspace.id;
    ok(`Created workspace: "${SEED_WORKSPACE.name}" (id=${workspaceId})`);
  }

  // 3. Workspace membership
  const existingMembership = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, adminUserId));

  if (existingMembership.length > 0) {
    skip(`Workspace membership for admin`);
  } else {
    await db.insert(workspaceMembers).values({
      workspaceId,
      userId: adminUserId,
      role: "manager",
    });
    ok(`Added admin as manager of workspace ${workspaceId}`);
  }

  console.log(`
Seed complete.

  Login:     ${SEED_ADMIN.email}
  Password:  ${SEED_ADMIN.password}

Change the password after first login.
`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
