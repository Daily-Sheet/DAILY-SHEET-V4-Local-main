import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  department: varchar("department"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  role: varchar("role").notNull().default("commenter"),
  superAdmin: boolean("super_admin").default(false),
  workspaceId: integer("workspace_id"),
  pushToken: varchar("push_token"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  dashboardPreferences: jsonb("dashboard_preferences").$type<DashboardPreferences>(),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
});

export type DashboardPreferences = {
  tabOrder: string[];
  hiddenTabs: string[];
  defaultTab: string;
};

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  ownerId: varchar("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull().default("commenter"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true });
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({ id: true, createdAt: true });
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;

export const workspaceInvites = pgTable("workspace_invites", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  workspaceId: integer("workspace_id").notNull(),
  role: varchar("role").notNull().default("commenter"),
  invitedBy: varchar("invited_by").notNull(),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkspaceInviteSchema = createInsertSchema(workspaceInvites).omit({ id: true, createdAt: true });
export type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
export type InsertWorkspaceInvite = z.infer<typeof insertWorkspaceInviteSchema>;

export const systemInvites = pgTable("system_invites", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  role: varchar("role").notNull().default("admin"),
  token: varchar("token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull(),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSystemInviteSchema = createInsertSchema(systemInvites).omit({ id: true, createdAt: true });
export type SystemInvite = typeof systemInvites.$inferSelect;
export type InsertSystemInvite = z.infer<typeof insertSystemInviteSchema>;
