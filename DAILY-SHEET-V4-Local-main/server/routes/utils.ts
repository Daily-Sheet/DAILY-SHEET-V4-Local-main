import type { RequestHandler } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { workspaces, workspaceMembers, users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import crypto from "crypto";
import { emitDomainEvent } from "../ws/eventBus";

const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Daily Sheet <noreply@daily-sheet.app>";

export function normalizeTimeToEventDate(time: Date, eventDate: string): Date {
  const ed = new Date(eventDate + "T00:00:00Z");
  const result = new Date(ed);
  result.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), 0);
  return result;
}

export const pdfCache = new Map<string, { buffer: Buffer; expiresAt: number }>();
export const PDF_TTL_MS = 10 * 60 * 1000;

export function storePdf(buffer: Buffer): string {
  const token = crypto.randomBytes(24).toString("hex");
  const now = Date.now();
  pdfCache.forEach((v, k) => {
    if (v.expiresAt < now) pdfCache.delete(k);
  });
  pdfCache.set(token, { buffer, expiresAt: now + PDF_TTL_MS });
  return token;
}

export async function sendInviteEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping invite email");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  console.log(`[email] Sending email to ${to}: "${subject}"`);
  const result = await resend.emails.send({ from: RESEND_FROM_EMAIL, to, subject, html });
  if (result.error) {
    console.error(`[email] Resend API error:`, JSON.stringify(result.error));
    throw new Error(result.error.message);
  }
  console.log(`[email] Email sent successfully, id: ${result.data?.id}`);
  return result;
}

// Role hierarchy (highest to lowest):
// owner → manager → admin → commenter / client
export const WORKSPACE_ROLES = ["owner", "manager", "admin", "commenter", "client"] as const;
export const ASSIGNABLE_ROLES = ["manager", "admin", "commenter", "client"] as const;

export async function getWorkspaceRole(userId: string, workspaceId: number | null | undefined): Promise<string> {
  if (!workspaceId) return "commenter";
  const members = await storage.getWorkspaceMembers(workspaceId);
  const member = members.find((m: any) => m.userId === userId);

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
  const isOwner = workspace && workspace.ownerId === userId;

  // Org owner always gets the "owner" role regardless of DB value
  if (isOwner) {
    if (member && member.role !== "owner") {
      await db.update(workspaceMembers).set({ role: "owner" }).where(eq(workspaceMembers.id, member.id));
    } else if (!member) {
      await db.insert(workspaceMembers).values({ workspaceId, userId, role: "owner" });
    }
    return "owner";
  }

  if (member) return member.role;

  const [currentUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
  if (!currentUser) return "commenter";

  for (const m of members) {
    const [memberUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, m.userId));
    if (memberUser && (memberUser.email ?? "").toLowerCase() === (currentUser.email ?? "").toLowerCase()) {
      await db.update(workspaceMembers).set({ userId }).where(eq(workspaceMembers.id, m.id));
      console.log(`[workspace-role] Reconciled workspace member ${m.id}: updated userId to ${userId} (email: ${currentUser.email})`);
      return m.role;
    }
  }

  return "commenter";
}

export async function getUserAllowedEventNames(userId: string, workspaceId: number): Promise<string[] | null> {
  const role = await getWorkspaceRole(userId, workspaceId);
  if (role === "owner" || role === "manager" || role === "admin") return null;
  const allAssignments = await storage.getAllAssignments(workspaceId);
  const directNames = allAssignments
    .filter((a: any) => a.userId === userId)
    .map((a: any) => a.eventName);
  const nameSet = new Set(directNames);
  const projAssignments = await storage.getProjectAssignmentsByUser(userId, workspaceId);
  if (projAssignments.length > 0) {
    const projIds = new Set(projAssignments.map((pa: any) => pa.projectId));
    const allEvents = await storage.getEvents(workspaceId);
    for (const ev of allEvents) {
      if (ev.projectId && projIds.has(ev.projectId)) {
        nameSet.add(ev.name);
      }
    }
  }
  return Array.from(nameSet);
}

export async function getUserAllowedEventIds(userId: string, workspaceId: number): Promise<number[] | null> {
  const allowedNames = await getUserAllowedEventNames(userId, workspaceId);
  // If the user has unrestricted access, propagate null.
  if (allowedNames === null) {
    return null;
  }
  // If there are no allowed event names, there are no allowed event IDs.
  if (allowedNames.length === 0) {
    return [];
  }

  const allEvents = await storage.getEvents(workspaceId);
  const idSet = new Set<number>();

  for (const ev of allEvents) {
    // Support either `name` or `eventName` as the event's name property.
    const eventName = (ev as any).name ?? (ev as any).eventName;
    if (eventName && allowedNames.includes(eventName)) {
      idSet.add(ev.id);
    }
  }
  return Array.from(idSet);
}

export async function notifyUsers(
  userIds: string[],
  actorId: string,
  type: string,
  title: string,
  message: string,
  workspaceId: number,
  eventName?: string,
) {
  const recipients = userIds.filter(id => id !== actorId);
  for (const userId of recipients) {
    try {
      await storage.createNotification({ userId, type, title, message, eventName: eventName ?? null, read: false, workspaceId });
      const user = await storage.getUser(userId);
      if (user?.pushToken) {
        console.log(`[PUSH] Would send to ${userId}: ${title} - ${message} (token: ${user.pushToken.substring(0, 10)}...)`);
      }
    } catch (err) {
      console.error("Failed to create notification for user", userId, err);
    }
  }
}

export async function getCrewUserIdsForEvent(eventName: string, workspaceId: number): Promise<string[]> {
  const assignments = await storage.getAllAssignments(workspaceId);
  return Array.from(new Set(assignments.filter(a => a.eventName === eventName).map(a => a.userId)));
}

export async function logActivity(
  actorId: string,
  actorName: string,
  type: string,
  action: string,
  title: string,
  message: string,
  workspaceId: number,
  eventName?: string,
  details?: string,
) {
  try {
    await storage.createActivityEntry({ actorId, actorName, type, action, title, message, eventName: eventName ?? null, workspaceId, details: details ?? null });
    emitDomainEvent({ type: "activity:new", workspaceId, eventName, actorId, actorName, payload: { activityType: type, action } });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

/** Preserve raw ISO string for client-side timezone formatting */
export function formatTimeForLog(t: Date | string | null | undefined): string {
  if (!t) return "";
  if (typeof t === "string") return t;
  return t.toISOString();
}

export function buildScheduleDiff(before: any, after: any): string | undefined {
  const fields: { key: string; label: string; format?: (v: any) => string }[] = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "startTime", label: "Start Time", format: formatTimeForLog },
    { key: "endTime", label: "End Time", format: formatTimeForLog },
    { key: "notes", label: "Notes" },
    { key: "eventDate", label: "Date" },
    { key: "eventName", label: "Show" },
    { key: "completed", label: "Completed", format: (v: any) => v ? "Yes" : "No" },
  ];
  const changes: { field: string; from: string; to: string }[] = [];
  for (const f of fields) {
    const oldVal = before[f.key];
    const newVal = after[f.key];
    const oldStr = f.format ? f.format(oldVal) : String(oldVal ?? "");
    const newStr = f.format ? f.format(newVal) : String(newVal ?? "");
    if (oldStr !== newStr && newVal !== undefined) {
      changes.push({ field: f.label, from: oldStr, to: newStr });
    }
  }
  return changes.length > 0 ? JSON.stringify(changes) : undefined;
}

export function buildScheduleSnapshot(schedule: any): string {
  const items: { field: string; value: string }[] = [];
  if (schedule.title) items.push({ field: "Title", value: schedule.title });
  if (schedule.category) items.push({ field: "Category", value: schedule.category });
  if (schedule.startTime) items.push({ field: "Start Time", value: formatTimeForLog(schedule.startTime) });
  if (schedule.endTime) items.push({ field: "End Time", value: formatTimeForLog(schedule.endTime) });
  if (schedule.eventDate) items.push({ field: "Date", value: schedule.eventDate });
  if (schedule.notes) items.push({ field: "Notes", value: schedule.notes });
  return JSON.stringify(items);
}

export function requireRole(...roles: string[]): RequestHandler {
  return async (req: any, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const workspaceId = user.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace selected" });
    const members = await storage.getWorkspaceMembers(workspaceId);
    const member = members.find((m: any) => m.userId === user.id);
    if (!member) return res.status(403).json({ message: "Not a member of this workspace" });
    if (!roles.includes(member.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    (req as any).workspaceRole = member.role;
    (req as any).dbUser = user;
    next();
  };
}

export function requireWorkspaceAdmin(): RequestHandler {
  return async (req: any, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const wsId = Number(req.params.id);
    if (!wsId || isNaN(wsId)) return res.status(400).json({ message: "Invalid workspace ID" });
    const members = await storage.getWorkspaceMembers(wsId);
    const requesterMember = members.find((m: any) => m.userId === user.id);
    if (!requesterMember || !["owner", "manager"].includes(requesterMember.role)) {
      return res.status(403).json({ message: "Only org owners and managers can perform this action" });
    }
    req.wsMembers = members;
    next();
  };
}
