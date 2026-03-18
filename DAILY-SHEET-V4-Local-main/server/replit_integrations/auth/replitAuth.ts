import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { authStorage } from "./storage";
import { storage } from "../../storage";
import { db } from "../../db";
import { users, workspaces, workspaceMembers, systemInvites } from "@shared/models/auth";
import { contacts } from "@shared/schema";
import { eq, and, count, isNotNull } from "drizzle-orm";
import { z } from "zod";

import { DEPARTMENTS } from "@shared/constants";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
      maxAge: sessionTtl,
    },
  });
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  department: z.enum(DEPARTMENTS),
  token: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/register", async (req, res) => {
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const { email, password, firstName, lastName, phone, department, token } = parsed.data;
      const selfSignup = req.body.selfSignup === true;
      const standaloneSignup = req.body.standaloneSignup === true;
      const organizationName = req.body.organizationName;

      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [{ value: userCount }] = await db.select({ value: count() }).from(users).where(isNotNull(users.passwordHash));
      const isFirstUser = userCount === 0;

      let systemInvite: any = null;
      if (!isFirstUser && token) {
        const [inv] = await db.select().from(systemInvites).where(
          and(eq(systemInvites.token, token), eq(systemInvites.status, "pending"))
        );
        if (inv) {
          if (inv.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ message: "This invite was sent to a different email address." });
          }
          systemInvite = inv;
        }
      }

      const pendingWorkspaceInvites = await storage.getPendingInvitesByEmail(email);

      if (!isFirstUser && !systemInvite && !selfSignup && !standaloneSignup && pendingWorkspaceInvites.length === 0) {
        return res.status(403).json({ message: "Registration requires an invitation. Please contact an admin to get invited." });
      }

      const role = isFirstUser ? "manager" : (selfSignup ? "manager" : (systemInvite?.role || "commenter"));

      const [user] = await db.insert(users).values({
        email,
        firstName,
        lastName,
        phone: phone || null,
        department,
        passwordHash,
        role,
      }).returning();

      if (systemInvite) {
        await db.update(systemInvites).set({ status: "accepted" }).where(eq(systemInvites.id, systemInvite.id));
      }

      let assignedWorkspaceId: number;

      if (pendingWorkspaceInvites.length > 0) {
        const firstInvite = pendingWorkspaceInvites[0];
        assignedWorkspaceId = firstInvite.workspaceId;

        await db.insert(workspaceMembers).values({
          workspaceId: firstInvite.workspaceId,
          userId: user.id,
          role: firstInvite.role,
        });

        await storage.updateInviteStatus(firstInvite.id, "accepted");

        for (let i = 1; i < pendingWorkspaceInvites.length; i++) {
          const invite = pendingWorkspaceInvites[i];
          await db.insert(workspaceMembers).values({
            workspaceId: invite.workspaceId,
            userId: user.id,
            role: invite.role,
          });
          await storage.updateInviteStatus(invite.id, "accepted");
        }
      } else if (isFirstUser || (systemInvite && systemInvite.role === "admin") || (systemInvite && systemInvite.role === "manager") || selfSignup) {
        const workspaceName = organizationName?.trim() || `${firstName} ${lastName}'s Organization`;
        const [workspace] = await db.insert(workspaces).values({
          name: workspaceName,
          ownerId: user.id,
        }).returning();

        await db.insert(workspaceMembers).values({
          workspaceId: workspace.id,
          userId: user.id,
          role: "owner",
        });

        assignedWorkspaceId = workspace.id;
      } else if (standaloneSignup) {
        assignedWorkspaceId = null as any;
      } else {
        return res.status(403).json({ message: "You have been invited as a regular user but have not been added to any workspace yet. Ask your admin to invite you to their workspace." });
      }

      if (assignedWorkspaceId) {
        await db.update(users).set({ workspaceId: assignedWorkspaceId }).where(eq(users.id, user.id));
      }

      if (assignedWorkspaceId) {
        const existingByEmail = await db.select().from(contacts).where(
          and(
            eq(contacts.email, email),
            eq(contacts.workspaceId, assignedWorkspaceId)
          )
        );
        const existingByUserId = await db.select().from(contacts).where(
          and(
            eq(contacts.userId, user.id),
            eq(contacts.workspaceId, assignedWorkspaceId)
          )
        );
        const existingContact = existingByUserId.length > 0 ? existingByUserId : existingByEmail;
        if (existingContact.length > 0) {
          await db.update(contacts).set({
            firstName,
            lastName,
            role: department,
            phone: phone || null,
            userId: user.id,
          }).where(eq(contacts.id, existingContact[0].id));
          if (existingByEmail.length > 0 && existingByUserId.length > 0 && existingByEmail[0].id !== existingByUserId[0].id && !existingByEmail[0].userId) {
            await db.delete(contacts).where(eq(contacts.id, existingByEmail[0].id));
          }
        } else {
          await db.insert(contacts).values({
            firstName,
            lastName,
            role: department,
            email,
            phone: phone || null,
            userId: user.id,
            workspaceId: assignedWorkspaceId,
          });
        }
      }

      (req.session as any).userId = user.id;
      res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, department: user.department, workspaceId: assignedWorkspaceId });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      const { email, password } = parsed.data;

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      (req.session as any).userId = user.id;
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, workspaceId: user.workspaceId });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
}

const lastActivityUpdate = new Map<string, number>();
const ACTIVITY_THROTTLE_MS = 60_000;

const userCache = new Map<string, { user: any; timestamp: number }>();
const USER_CACHE_TTL_MS = 5_000;

function getCachedUser(userId: string) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL_MS) {
    return cached.user;
  }
  return null;
}

function setCachedUser(userId: string, user: any) {
  userCache.set(userId, { user, timestamp: Date.now() });
}

export function invalidateUserCache(userId: string) {
  userCache.delete(userId);
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let user = getCachedUser(userId);
  if (!user) {
    user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    setCachedUser(userId, user);
  }

  const { passwordHash, ...safeUser } = user;
  (req as any).user = safeUser;

  const now = Date.now();
  const lastUpdate = lastActivityUpdate.get(userId) || 0;
  if (now - lastUpdate > ACTIVITY_THROTTLE_MS) {
    lastActivityUpdate.set(userId, now);
    db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId)).execute().catch(() => {});
  }

  next();
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  if (userId) {
    let user = getCachedUser(userId);
    if (!user) {
      user = await authStorage.getUser(userId);
      if (user) {
        setCachedUser(userId, user);
      }
    }
    if (user) {
      const { passwordHash, ...safeUser } = user;
      (req as any).user = safeUser;
    }
  }
  next();
};
