import { users, workspaces, workspaceMembers, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, count } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUser(userData.id!);
    if (!existing) {
      const [{ value: userCount }] = await db.select({ value: count() }).from(users);
      if (userCount === 0) {
        userData.role = "admin";
      }
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!existing && !user.workspaceId) {
      const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
      const [workspace] = await db.insert(workspaces).values({
        name: `${displayName}'s Workspace`,
        ownerId: user.id,
      }).returning();

      await db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: "admin",
      });

      await db.update(users).set({ workspaceId: workspace.id }).where(eq(users.id, user.id));

      return { ...user, workspaceId: workspace.id };
    }

    return user;
  }
}

export const authStorage = new AuthStorage();
