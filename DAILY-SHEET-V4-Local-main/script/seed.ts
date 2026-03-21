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
const DATABASE_URL = process.env.DATABASE_URL as string;

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

  // 4. Fake Venues
  const venuesTable = (await import("../shared/schema.js")).venues;
  const [venueCount] = await db.select({ value: count() }).from(venuesTable).where(eq(venuesTable.workspaceId, workspaceId));
  if (venueCount.value === 0) {
    await db.insert(venuesTable).values([
      {
        name: "The Grand Arena",
        address: "123 Main St, Big City",
        contactName: "Jane Venue",
        contactPhone: "555-1234",
        wifiSsid: "GrandArenaGuest",
        wifiPassword: "grand2024",
        notes: "Parking in rear lot.",
        workspaceId,
        createdByWorkspaceId: workspaceId,
      },
      {
        name: "Downtown Club",
        address: "456 Center Ave, Downtown",
        contactName: "Mike Clubber",
        contactPhone: "555-5678",
        wifiSsid: "DowntownClub",
        wifiPassword: "clubguest",
        notes: "Load-in via alley.",
        workspaceId,
        createdByWorkspaceId: workspaceId,
      },
      {
        name: "Festival Grounds",
        address: "789 Festival Rd, Outskirts",
        contactName: "Sally Field",
        contactPhone: "555-9012",
        wifiSsid: "FestGrounds",
        wifiPassword: "festival!",
        notes: "Outdoor venue, bring rain gear.",
        workspaceId,
        createdByWorkspaceId: workspaceId,
      },
    ]);
    ok("Seeded 3 fake venues");
  } else {
    skip("Venues already exist");
  }

  // 5. Fake Projects
  const projectsTable = (await import("../shared/schema.js")).projects;
  const [projectCount] = await db.select({ value: count() }).from(projectsTable).where(eq(projectsTable.workspaceId, workspaceId));
  if (projectCount.value === 0) {
    const [tour, festival] = await db.insert(projectsTable).values([
      {
        name: "Spring Tour 2026",
        description: "A multi-city spring tour.",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        isTour: true,
        isFestival: false,
        workspaceId,
      },
      {
        name: "Summer Fest 2026",
        description: "Annual summer festival.",
        startDate: "2026-06-10",
        endDate: "2026-06-12",
        isTour: false,
        isFestival: true,
        workspaceId,
      },
    ]).returning({ id: projectsTable.id });
    ok("Seeded 2 fake projects");

    // 6. Fake Events (Shows/Runs)
    const eventsTable = (await import("../shared/schema.js")).events;
    const venues = await db.select({ id: venuesTable.id }).from(venuesTable).where(eq(venuesTable.workspaceId, workspaceId));
    await db.insert(eventsTable).values([
      {
        name: "Opening Night",
        color: "#FF5733",
        notes: "Kickoff show for the tour.",
        startDate: "2026-03-01",
        endDate: "2026-03-01",
        venueId: venues[0]?.id,
        projectId: tour.id,
        workspaceId,
      },
      {
        name: "Downtown Bash",
        color: "#33A1FF",
        notes: "Club show downtown.",
        startDate: "2026-03-10",
        endDate: "2026-03-10",
        venueId: venues[1]?.id,
        projectId: tour.id,
        workspaceId,
      },
      {
        name: "Festival Opener",
        color: "#33FF57",
        notes: "First day of the festival.",
        startDate: "2026-06-10",
        endDate: "2026-06-10",
        venueId: venues[2]?.id,
        projectId: festival.id,
        workspaceId,
      },
      {
        name: "Festival Finale",
        color: "#FF33A1",
        notes: "Closing show for the festival.",
        startDate: "2026-06-12",
        endDate: "2026-06-12",
        venueId: venues[2]?.id,
        projectId: festival.id,
        workspaceId,
      },
    ]);
    ok("Seeded 4 fake events (shows/runs)");
  } else {
    skip("Projects/events already exist");
  }

  console.log(`\nSeed complete.\n\n  Login:     ${SEED_ADMIN.email}\n  Password:  ${SEED_ADMIN.password}\n\nChange the password after first login.\n`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
