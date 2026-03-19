import { db } from "./db";
import {
  schedules, contacts, files, venues, venueTechPackets, comments, users, eventAssignments, events, sessions, fileFolders, settings,
  workspaces, workspaceMembers, workspaceInvites, taskTypes, scheduleTemplates, eventDayVenues, zones, projects, sections, departments, crewPositions, timesheetEntries, notifications, activityLog, travelDays, gearRequests, projectAssignments, crewTravel, dailyCheckins, accessLinks,
  type InsertSchedule, type InsertContact, type InsertFile, type InsertVenue, type InsertVenueTechPacket, type VenueTechPacket, type InsertComment,
  type InsertEventAssignment, type InsertEvent, type InsertFileFolder,
  type InsertWorkspace, type InsertWorkspaceMember, type InsertWorkspaceInvite,
  type InsertTaskType, type InsertScheduleTemplate, type InsertEventDayVenue,
  type InsertZone, type InsertProject, type InsertSection, type InsertDepartment, type InsertCrewPosition,
  type InsertTimesheetEntry, type TimesheetEntry,
  type InsertNotification, type Notification,
  type InsertActivityLogEntry, type ActivityLogEntry,
  type InsertTravelDay, type TravelDay,
  type InsertGearRequest, type GearRequest,
  type InsertProjectAssignment, type ProjectAssignment,
  type InsertCrewTravel, type CrewTravel,
  type InsertDailyCheckin, type DailyCheckin,
  type InsertAccessLink, type AccessLink,
  type Schedule, type Contact, type Venue, type Comment, type User, type EventAssignment, type Event, type FileFolder, type Setting,
  type Workspace, type WorkspaceMember, type WorkspaceInvite, type TaskType, type ScheduleTemplate, type EventDayVenue,
  type Zone, type Project, type Section, type Department, type CrewPosition
} from "@shared/schema";
import type { File as DbFile } from "@shared/schema";
import { eq, and, desc, inArray, sql, isNotNull, isNull, or } from "drizzle-orm";

export interface IStorage {
  // Schedules
  getSchedules(workspaceId: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;
  clearDaySchedules(workspaceId: number, eventDate: string, eventName?: string): Promise<number>;

  reorderSchedules(ids: number[], timeUpdates?: { id: number; startTime: Date; endTime: Date | null }[]): Promise<void>;

  // Contacts
  getContacts(workspaceId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  bulkDeleteContacts(ids: number[]): Promise<number>;
  getContactsByUserId(userId: string): Promise<Contact[]>;
  deduplicateContacts(): Promise<number>;

  // Venues
  getAllVenues(): Promise<Venue[]>;
  getVenues(workspaceId: number): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue>;
  deleteVenue(id: number, workspaceId?: number): Promise<void>;
  getTechPacketsByVenue(venueId: number): Promise<VenueTechPacket[]>;
  createTechPacket(packet: InsertVenueTechPacket): Promise<VenueTechPacket>;

  // Comments
  getCommentsBySchedule(scheduleId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  toggleCommentPin(id: number): Promise<Comment>;

  // Users
  getAllUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;
  setPasswordResetToken(id: string, token: string | null, expiry: Date | null): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserProfile(id: string, data: { phone?: string | null; department?: string | null }): Promise<User>;
  updateUserPushToken(id: string, pushToken: string | null): Promise<void>;
  updateUserPreferences(id: string, prefs: import("@shared/schema").DashboardPreferences): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Files
  getFiles(workspaceId: number): Promise<DbFile[]>;
  createFile(file: InsertFile): Promise<DbFile>;
  updateFile(id: number, data: { name: string }): Promise<DbFile>;
  deleteFile(id: number): Promise<void>;

  // File Folders
  getFileFolders(workspaceId: number): Promise<FileFolder[]>;
  createFileFolder(folder: InsertFileFolder): Promise<FileFolder>;
  updateFileFolder(id: number, data: { name?: string; parentId?: number | null }): Promise<FileFolder>;
  deleteFileFolder(id: number, workspaceId?: number): Promise<void>;

  // Events
  getEvents(workspaceId: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventByName(name: string, workspaceId: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number, workspaceId?: number): Promise<void>;
  renameEvent(oldName: string, newName: string, workspaceId?: number): Promise<void>;

  // Settings
  getSetting(key: string, workspaceId: number): Promise<string | null>;
  setSetting(key: string, value: string, workspaceId: number): Promise<void>;

  // Event Assignments
  getAssignmentsByUser(userId: string): Promise<EventAssignment[]>;
  getAssignmentsByEventName(eventName: string): Promise<EventAssignment[]>;
  getAllAssignments(workspaceId: number): Promise<EventAssignment[]>;
  getAssignment(id: number): Promise<EventAssignment | undefined>;
  createAssignment(assignment: InsertEventAssignment): Promise<EventAssignment>;
  updateAssignment(id: number, data: Partial<InsertEventAssignment>): Promise<EventAssignment>;
  checkInAssignment(id: number): Promise<EventAssignment>;
  checkOutAssignment(id: number): Promise<EventAssignment>;
  deleteAssignment(id: number): Promise<void>;
  deleteAssignmentsByUser(userId: string): Promise<void>;
  deleteAssignmentsByUserInWorkspace(userId: string, workspaceId: number): Promise<void>;

  // Workspaces
  getWorkspace(id: number): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: number, data: Partial<InsertWorkspace>): Promise<Workspace>;
  getWorkspacesByUser(userId: string): Promise<(Workspace & { role: string })[]>;
  getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMember[]>;
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  removeWorkspaceMember(id: number): Promise<void>;
  updateWorkspaceMemberRole(id: number, role: string): Promise<WorkspaceMember>;

  // Workspace Invites
  createWorkspaceInvite(invite: InsertWorkspaceInvite): Promise<WorkspaceInvite>;
  getWorkspaceInvite(id: number): Promise<WorkspaceInvite | undefined>;
  getWorkspaceInvites(workspaceId: number): Promise<WorkspaceInvite[]>;
  getPendingInvitesByEmail(email: string): Promise<WorkspaceInvite[]>;
  updateInviteStatus(id: number, status: string): Promise<WorkspaceInvite>;
  deleteWorkspaceInvite(id: number): Promise<void>;

  // Workspace Management
  getAllWorkspaces(): Promise<(Workspace & { memberCount: number })[]>;
  deleteWorkspace(id: number): Promise<void>;

  // User workspace switching
  switchUserWorkspace(userId: string, workspaceId: number): Promise<void>;

  // Task Types
  getTaskTypes(workspaceId: number): Promise<TaskType[]>;
  createTaskType(taskType: InsertTaskType): Promise<TaskType>;
  updateTaskType(id: number, data: Partial<InsertTaskType>): Promise<TaskType>;
  deleteTaskType(id: number): Promise<void>;

  // Departments
  getDepartments(workspaceId: number): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, data: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: number): Promise<void>;

  // Crew Positions
  getCrewPositions(workspaceId: number): Promise<CrewPosition[]>;
  createCrewPosition(position: InsertCrewPosition): Promise<CrewPosition>;
  updateCrewPosition(id: number, data: Partial<InsertCrewPosition>): Promise<CrewPosition>;
  deleteCrewPosition(id: number): Promise<void>;

  // Schedule Templates
  getScheduleTemplates(workspaceId: number): Promise<ScheduleTemplate[]>;
  createScheduleTemplate(template: InsertScheduleTemplate): Promise<ScheduleTemplate>;
  updateScheduleTemplate(id: number, data: Partial<InsertScheduleTemplate>): Promise<ScheduleTemplate>;
  deleteScheduleTemplate(id: number): Promise<void>;

  // Event Day Venues
  getEventDayVenues(eventId: number): Promise<EventDayVenue[]>;
  getAllEventDayVenues(workspaceId: number): Promise<EventDayVenue[]>;
  getEventDayVenue(eventId: number, date: string): Promise<EventDayVenue | undefined>;
  setEventDayVenue(dayVenue: InsertEventDayVenue): Promise<EventDayVenue>;
  deleteEventDayVenues(eventId: number): Promise<void>;
  deleteEventDayVenue(eventId: number, date: string): Promise<void>;

  // Zones
  getZonesByVenue(venueId: number): Promise<Zone[]>;
  getZones(workspaceId: number): Promise<Zone[]>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZone(id: number, data: Partial<InsertZone>): Promise<Zone>;
  deleteZone(id: number): Promise<void>;

  // Projects
  getProjects(workspaceId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Sections
  getSectionsByEvent(eventId: number): Promise<Section[]>;
  getSections(workspaceId: number): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, data: Partial<InsertSection>): Promise<Section>;
  deleteSection(id: number): Promise<void>;

  // Timesheet Entries
  getTimesheetEntries(workspaceId: number, eventId?: number, date?: string): Promise<TimesheetEntry[]>;
  createTimesheetEntry(entry: InsertTimesheetEntry): Promise<TimesheetEntry>;
  updateTimesheetEntry(id: number, data: Partial<InsertTimesheetEntry>): Promise<TimesheetEntry>;
  deleteTimesheetEntry(id: number): Promise<void>;

  // Notifications
  getNotifications(userId: string, workspaceId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string, workspaceId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string, workspaceId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;

  // Activity Log
  archiveEventsByProject(projectId: number, archived: boolean): Promise<void>;
  getActivityLog(workspaceId: number, limit?: number, since?: Date, eventName?: string): Promise<ActivityLogEntry[]>;
  getActivityCounts(workspaceId: number, since: Date): Promise<{ scheduleChanges: number; assignmentChanges: number; comments: number; fileChanges: number; total: number }>;
  createActivityEntry(entry: InsertActivityLogEntry): Promise<ActivityLogEntry>;

  // Schedule Reorder (batch)
  reorderScheduleItems(items: { id: number; sortOrder: number }[]): Promise<void>;

  // Timesheet Summary
  getTimesheetEntriesByEventIds(eventIds: number[], startDate?: string, endDate?: string): Promise<TimesheetEntry[]>;
  getTimesheetEntriesByDateRange(workspaceId: number, startDate: string, endDate: string): Promise<TimesheetEntry[]>;

  // Travel Days
  getTravelDays(projectId: number): Promise<TravelDay[]>;
  createTravelDay(travelDay: InsertTravelDay): Promise<TravelDay>;
  deleteTravelDay(id: number): Promise<void>;

  // Crew Travel
  getCrewTravel(travelDayId: number): Promise<CrewTravel[]>;
  createCrewTravel(data: InsertCrewTravel): Promise<CrewTravel>;
  bulkCreateCrewTravel(records: InsertCrewTravel[]): Promise<CrewTravel[]>;
  updateCrewTravel(id: number, data: Partial<InsertCrewTravel>): Promise<CrewTravel>;
  deleteCrewTravel(id: number): Promise<void>;

  // Daily Checkins
  getDailyCheckins(eventName: string, date: string, workspaceId: number): Promise<DailyCheckin[]>;
  upsertDailyCheckin(data: { userId: string; eventName: string; date: string; workspaceId: number }): Promise<DailyCheckin>;
  checkOutDaily(id: number): Promise<DailyCheckin>;
  lunchOutDaily(id: number): Promise<DailyCheckin>;
  lunchInDaily(id: number): Promise<DailyCheckin>;
  resetDailyCheckin(id: number): Promise<DailyCheckin>;

  // Gear Requests
  getGearRequests(eventId: number, workspaceId: number): Promise<GearRequest[]>;
  getGearRequestsByWorkspace(workspaceId: number): Promise<GearRequest[]>;
  createGearRequest(request: InsertGearRequest): Promise<GearRequest>;

  getProjectAssignments(projectId: number, workspaceId: number): Promise<ProjectAssignment[]>;
  getProjectAssignmentsByUser(userId: string, workspaceId: number): Promise<ProjectAssignment[]>;
  getAllProjectAssignments(workspaceId: number): Promise<ProjectAssignment[]>;
  createProjectAssignment(assignment: InsertProjectAssignment): Promise<ProjectAssignment>;
  deleteProjectAssignment(id: number): Promise<void>;

  // Access Links
  createAccessLink(link: InsertAccessLink): Promise<AccessLink>;
  getAccessLinkByToken(token: string): Promise<AccessLink | undefined>;
  getAccessLinksByContact(contactId: number, workspaceId: number): Promise<AccessLink[]>;
  getAccessLinksByWorkspace(workspaceId: number): Promise<AccessLink[]>;
  revokeAccessLink(id: number, workspaceId: number): Promise<AccessLink | undefined>;
  deleteAccessLink(id: number): Promise<void>;

}

export class DatabaseStorage implements IStorage {
  // Schedules
  async getSchedules(workspaceId: number): Promise<Schedule[]> {
    return await db.select().from(schedules)
      .where(eq(schedules.workspaceId, workspaceId))
      .orderBy(schedules.sortOrder, schedules.startTime);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db.insert(schedules).values(insertSchedule).returning();
    return schedule;
  }

  async updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule> {
    const [updated] = await db.update(schedules).set(data).where(eq(schedules.id, id)).returning();
    return updated;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  async clearDaySchedules(workspaceId: number, eventDate: string, eventName?: string): Promise<number> {
    const conditions = [
      eq(schedules.workspaceId, workspaceId),
      eq(schedules.eventDate, eventDate),
    ];
    if (eventName) {
      conditions.push(eq(schedules.eventName, eventName));
    }
    const result = await db.delete(schedules).where(and(...conditions)).returning();
    return result.length;
  }

  async reorderSchedules(ids: number[], timeUpdates?: { id: number; startTime: Date; endTime: Date | null }[]): Promise<void> {
    const timeMap = new Map(timeUpdates?.map(t => [t.id, t]) || []);
    await db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        const update: any = { sortOrder: i };
        const tu = timeMap.get(ids[i]);
        if (tu) {
          update.startTime = tu.startTime;
          if (tu.endTime !== undefined) update.endTime = tu.endTime;
        }
        await tx.update(schedules).set(update).where(eq(schedules.id, ids[i]));
      }
    });
  }

  // Contacts
  async getContacts(workspaceId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.workspaceId, workspaceId));
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    if (insertContact.userId && insertContact.workspaceId) {
      const existing = await db.select().from(contacts).where(
        and(
          eq(contacts.userId, insertContact.userId),
          eq(contacts.workspaceId, insertContact.workspaceId)
        )
      );
      if (existing.length > 0) {
        const updateData: Partial<InsertContact> = {};
        if (insertContact.firstName) updateData.firstName = insertContact.firstName;
        if (insertContact.lastName !== undefined) updateData.lastName = insertContact.lastName;
        if (insertContact.email) updateData.email = insertContact.email;
        if (insertContact.phone) updateData.phone = insertContact.phone;
        if (insertContact.role) updateData.role = insertContact.role;
        if (insertContact.notes !== undefined) updateData.notes = insertContact.notes;
        if (insertContact.contactType) updateData.contactType = insertContact.contactType;
        if (Object.keys(updateData).length > 0) {
          const [updated] = await db.update(contacts).set(updateData).where(eq(contacts.id, existing[0].id)).returning();
          return updated;
        }
        return existing[0];
      }
    }
    const [contact] = await db.insert(contacts).values(insertContact).returning();
    return contact;
  }

  async deduplicateContacts(): Promise<number> {
    const allContacts = await db.select().from(contacts).where(isNotNull(contacts.userId));
    const grouped: Record<string, typeof allContacts> = {};
    for (const c of allContacts) {
      const key = `${c.userId}-${c.workspaceId}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    }
    let removedCount = 0;
    for (const [, dupes] of Object.entries(grouped)) {
      if (dupes.length <= 1) continue;
      dupes.sort((a, b) => {
        const scoreA = [a.firstName, a.lastName, a.email, a.phone, a.role, a.notes].filter(Boolean).length;
        const scoreB = [b.firstName, b.lastName, b.email, b.phone, b.role, b.notes].filter(Boolean).length;
        return scoreB - scoreA;
      });
      const keep = dupes[0];
      const mergeData: Partial<InsertContact> = {};
      for (let i = 1; i < dupes.length; i++) {
        const d = dupes[i];
        if (!keep.firstName && d.firstName) mergeData.firstName = d.firstName;
        if (!keep.lastName && d.lastName) mergeData.lastName = d.lastName;
        if (!keep.email && d.email) mergeData.email = d.email;
        if (!keep.phone && d.phone) mergeData.phone = d.phone;
        if (!keep.role && d.role) mergeData.role = d.role;
        if (!keep.notes && d.notes) mergeData.notes = d.notes;
      }
      if (Object.keys(mergeData).length > 0) {
        await db.update(contacts).set(mergeData).where(eq(contacts.id, keep.id));
      }
      for (let i = 1; i < dupes.length; i++) {
        await db.delete(contacts).where(eq(contacts.id, dupes[i].id));
        removedCount++;
      }
      console.log(`[dedup] Kept contact #${keep.id} for user ${keep.userId} in workspace ${keep.workspaceId}, removed ${dupes.length - 1} duplicates`);
    }
    return removedCount;
  }

  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact> {
    const [updated] = await db.update(contacts).set(data).where(eq(contacts.id, id)).returning();
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async bulkDeleteContacts(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await db.delete(contacts).where(inArray(contacts.id, ids));
    return result.rowCount ?? ids.length;
  }

  async getContactsByUserId(userId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId));
  }

  // Files
  async getFiles(workspaceId: number): Promise<DbFile[]> {
    return await db.select().from(files).where(eq(files.workspaceId, workspaceId));
  }

  async createFile(insertFile: InsertFile): Promise<DbFile> {
    const [item] = await db.insert(files).values(insertFile).returning();
    return item;
  }

  async updateFile(id: number, data: { name: string }): Promise<DbFile> {
    const [updated] = await db.update(files).set({ name: data.name }).where(eq(files.id, id)).returning();
    return updated;
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  // File Folders
  async getFileFolders(workspaceId: number): Promise<FileFolder[]> {
    return await db.select().from(fileFolders)
      .where(eq(fileFolders.workspaceId, workspaceId))
      .orderBy(fileFolders.name);
  }

  async createFileFolder(folder: InsertFileFolder): Promise<FileFolder> {
    const [created] = await db.insert(fileFolders).values(folder).returning();
    return created;
  }

  async updateFileFolder(id: number, data: { name?: string; parentId?: number | null }): Promise<FileFolder> {
    const [updated] = await db.update(fileFolders).set(data).where(eq(fileFolders.id, id)).returning();
    return updated;
  }

  async deleteFileFolder(id: number, workspaceId?: number): Promise<void> {
    const [folder] = await db.select().from(fileFolders).where(eq(fileFolders.id, id));
    if (folder && workspaceId) {
      await db.delete(files)
        .where(and(
          eq(files.folderName, folder.name),
          eq(files.eventName, folder.eventName ?? ''),
          eq(files.workspaceId, workspaceId)
        ));
    }
    await db.delete(fileFolders).where(eq(fileFolders.id, id));
  }

  // Venues
  async getAllVenues(): Promise<Venue[]> {
    return await db.select().from(venues);
  }

  async getVenues(workspaceId: number): Promise<Venue[]> {
    return await db.select().from(venues).where(eq(venues.workspaceId, workspaceId));
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const [created] = await db.insert(venues).values(insertVenue).returning();
    return created;
  }

  async updateVenue(id: number, venueData: Partial<InsertVenue>): Promise<Venue> {
    const [updated] = await db.update(venues)
      .set(venueData)
      .where(eq(venues.id, id))
      .returning();
    return updated;
  }

  async deleteVenue(id: number, workspaceId?: number): Promise<void> {
    const venueZones = await this.getZonesByVenue(id);
    const zonesToDelete = workspaceId
      ? venueZones.filter(z => z.workspaceId === workspaceId)
      : venueZones;
    for (const z of zonesToDelete) {
      await db.update(schedules).set({ zoneId: null }).where(eq(schedules.zoneId, z.id));
    }
    if (workspaceId) {
      await db.delete(zones).where(and(eq(zones.venueId, id), eq(zones.workspaceId, workspaceId)));
    } else {
      await db.delete(zones).where(eq(zones.venueId, id));
    }
    await db.delete(venueTechPackets).where(eq(venueTechPackets.venueId, id));
    await db.delete(venues).where(eq(venues.id, id));
  }

  async getTechPacketsByVenue(venueId: number): Promise<VenueTechPacket[]> {
    return await db.select().from(venueTechPackets)
      .where(eq(venueTechPackets.venueId, venueId))
      .orderBy(desc(venueTechPackets.uploadedAt));
  }

  async createTechPacket(packet: InsertVenueTechPacket): Promise<VenueTechPacket> {
    const [created] = await db.insert(venueTechPackets).values(packet).returning();
    return created;
  }

  // Comments
  async getCommentsBySchedule(scheduleId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.scheduleId, scheduleId)).orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async toggleCommentPin(id: number): Promise<Comment> {
    const [existing] = await db.select().from(comments).where(eq(comments.id, id));
    if (!existing) throw new Error("Comment not found");
    const [updated] = await db.update(comments).set({ pinned: !existing.pinned }).where(eq(comments.id, id)).returning();
    return updated;
  }

  // Users
  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(({ passwordHash, ...rest }) => ({ ...rest, passwordHash: null }));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserPushToken(id: string, pushToken: string | null): Promise<void> {
    await db.update(users).set({ pushToken }).where(eq(users.id, id));
  }

  async updateUserProfile(id: string, data: { phone?: string | null; department?: string | null }): Promise<User> {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    const { passwordHash, ...rest } = updated;
    return { ...rest, passwordHash: null };
  }

  async updateUserPreferences(id: string, prefs: import("@shared/schema").DashboardPreferences): Promise<User> {
    const [updated] = await db.update(users).set({ dashboardPreferences: prefs, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    const { passwordHash, ...rest } = updated;
    return { ...rest, passwordHash: null };
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    const { passwordHash, ...rest } = updated;
    return { ...rest, passwordHash: null };
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    return user;
  }

  async setPasswordResetToken(id: string, token: string | null, expiry: Date | null): Promise<void> {
    await db.update(users).set({ passwordResetToken: token, passwordResetExpiry: expiry }).where(eq(users.id, id));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUser(id);
    await db.delete(comments).where(eq(comments.authorId, id));
    await db.delete(contacts).where(eq(contacts.userId, id));
    await db.delete(eventAssignments).where(eq(eventAssignments.userId, id));
    await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, id));
    await db.delete(sessions).where(sql`sess::jsonb ->> 'userId' = ${id}`);
    if (user?.email) {
      await db.delete(workspaceInvites).where(eq(workspaceInvites.email, user.email));
    }
    await db.delete(users).where(eq(users.id, id));
  }

  // Settings
  async getSetting(key: string, workspaceId: number): Promise<string | null> {
    const [row] = await db.select().from(settings)
      .where(and(eq(settings.key, key), eq(settings.workspaceId, workspaceId)));
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string, workspaceId: number): Promise<void> {
    const existing = await db.select().from(settings)
      .where(and(eq(settings.key, key), eq(settings.workspaceId, workspaceId)));
    if (existing.length > 0) {
      await db.update(settings).set({ value }).where(eq(settings.id, existing[0].id));
    } else {
      await db.insert(settings).values({ key, value, workspaceId });
    }
  }

  // Events
  async getEvents(workspaceId: number): Promise<Event[]> {
    return await db.select().from(events)
      .where(eq(events.workspaceId, workspaceId))
      .orderBy(events.name);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventByName(name: string, workspaceId: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events)
      .where(and(eq(events.name, name), eq(events.workspaceId, workspaceId)));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(insertEvent).returning();
    return created;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event> {
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number, workspaceId?: number): Promise<void> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (event) {
      if (workspaceId) {
        await db.delete(schedules).where(and(eq(schedules.eventName, event.name), eq(schedules.workspaceId, workspaceId)));
        await db.delete(eventAssignments).where(and(eq(eventAssignments.eventName, event.name), eq(eventAssignments.workspaceId, workspaceId)));
        await db.delete(files).where(and(eq(files.eventName, event.name), eq(files.workspaceId, workspaceId)));
        await db.delete(fileFolders).where(and(eq(fileFolders.eventName, event.name), eq(fileFolders.workspaceId, workspaceId)));
      } else {
        await db.delete(schedules).where(eq(schedules.eventName, event.name));
        await db.delete(eventAssignments).where(eq(eventAssignments.eventName, event.name));
        await db.delete(files).where(eq(files.eventName, event.name));
        await db.delete(fileFolders).where(eq(fileFolders.eventName, event.name));
      }
      await db.delete(sections).where(eq(sections.eventId, id));
    }
    await db.delete(events).where(eq(events.id, id));
  }

  async renameEvent(oldName: string, newName: string, workspaceId?: number): Promise<void> {
    await db.transaction(async (tx) => {
      if (workspaceId) {
        await tx.update(schedules).set({ eventName: newName })
          .where(and(eq(schedules.eventName, oldName), eq(schedules.workspaceId, workspaceId)));
        await tx.update(eventAssignments).set({ eventName: newName })
          .where(and(eq(eventAssignments.eventName, oldName), eq(eventAssignments.workspaceId, workspaceId)));
        await tx.update(files).set({ eventName: newName })
          .where(and(eq(files.eventName, oldName), eq(files.workspaceId, workspaceId)));
        await tx.update(fileFolders).set({ eventName: newName })
          .where(and(eq(fileFolders.eventName, oldName), eq(fileFolders.workspaceId, workspaceId)));
      } else {
        await tx.update(schedules).set({ eventName: newName }).where(eq(schedules.eventName, oldName));
        await tx.update(eventAssignments).set({ eventName: newName }).where(eq(eventAssignments.eventName, oldName));
        await tx.update(files).set({ eventName: newName }).where(eq(files.eventName, oldName));
        await tx.update(fileFolders).set({ eventName: newName }).where(eq(fileFolders.eventName, oldName));
      }
    });
  }

  // Event Assignments
  async getAssignmentsByUser(userId: string): Promise<EventAssignment[]> {
    return await db.select().from(eventAssignments).where(eq(eventAssignments.userId, userId));
  }

  async getAssignmentsByEventName(eventName: string): Promise<EventAssignment[]> {
    return await db.select().from(eventAssignments).where(eq(eventAssignments.eventName, eventName));
  }

  async getAllAssignments(workspaceId: number): Promise<EventAssignment[]> {
    return await db.select().from(eventAssignments).where(eq(eventAssignments.workspaceId, workspaceId));
  }

  async getAssignment(id: number): Promise<EventAssignment | undefined> {
    const [assignment] = await db.select().from(eventAssignments).where(eq(eventAssignments.id, id));
    return assignment;
  }

  async createAssignment(assignment: InsertEventAssignment): Promise<EventAssignment> {
    const existing = await db.select().from(eventAssignments)
      .where(and(
        eq(eventAssignments.userId, assignment.userId),
        eq(eventAssignments.eventName, assignment.eventName)
      ));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(eventAssignments).values(assignment).returning();
    return created;
  }

  async updateAssignment(id: number, data: Partial<InsertEventAssignment>): Promise<EventAssignment> {
    const [updated] = await db.update(eventAssignments).set(data).where(eq(eventAssignments.id, id)).returning();
    return updated;
  }

  async checkInAssignment(id: number): Promise<EventAssignment> {
    const [updated] = await db.update(eventAssignments).set({ checkedInAt: new Date() }).where(eq(eventAssignments.id, id)).returning();
    return updated;
  }

  async checkOutAssignment(id: number): Promise<EventAssignment> {
    const [updated] = await db.update(eventAssignments).set({ checkedInAt: null }).where(eq(eventAssignments.id, id)).returning();
    return updated;
  }

  async deleteAssignment(id: number): Promise<void> {
    await db.delete(eventAssignments).where(eq(eventAssignments.id, id));
  }

  async deleteAssignmentsByUser(userId: string): Promise<void> {
    await db.delete(eventAssignments).where(eq(eventAssignments.userId, userId));
  }

  async deleteAssignmentsByUserInWorkspace(userId: string, workspaceId: number): Promise<void> {
    await db.delete(eventAssignments).where(
      and(eq(eventAssignments.userId, userId), eq(eventAssignments.workspaceId, workspaceId))
    );
  }

  // Workspaces
  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [created] = await db.insert(workspaces).values(workspace).returning();
    return created;
  }

  async updateWorkspace(id: number, data: Partial<InsertWorkspace>): Promise<Workspace> {
    const [updated] = await db.update(workspaces).set(data).where(eq(workspaces.id, id)).returning();
    return updated;
  }

  async getWorkspacesByUser(userId: string): Promise<(Workspace & { role: string })[]> {
    const members = await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, userId));
    if (members.length === 0) return [];
    const wsIds = members.map(m => m.workspaceId);
    const wsList = await db.select().from(workspaces).where(inArray(workspaces.id, wsIds));
    return wsList.map(ws => {
      const member = members.find(m => m.workspaceId === ws.id);
      return { ...ws, role: member?.role || "commenter" };
    });
  }

  async getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMember[]> {
    return await db.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
  }

  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [created] = await db.insert(workspaceMembers).values(member).returning();
    return created;
  }

  async removeWorkspaceMember(id: number): Promise<void> {
    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, id));
  }

  async updateWorkspaceMemberRole(id: number, role: string): Promise<WorkspaceMember> {
    const [updated] = await db.update(workspaceMembers).set({ role }).where(eq(workspaceMembers.id, id)).returning();
    return updated;
  }

  // Workspace Invites
  async createWorkspaceInvite(invite: InsertWorkspaceInvite): Promise<WorkspaceInvite> {
    const [created] = await db.insert(workspaceInvites).values(invite).returning();
    return created;
  }

  async getWorkspaceInvite(id: number): Promise<WorkspaceInvite | undefined> {
    const [invite] = await db.select().from(workspaceInvites).where(eq(workspaceInvites.id, id));
    return invite;
  }

  async getWorkspaceInvites(workspaceId: number): Promise<WorkspaceInvite[]> {
    return await db.select().from(workspaceInvites)
      .where(eq(workspaceInvites.workspaceId, workspaceId))
      .orderBy(desc(workspaceInvites.createdAt));
  }

  async getPendingInvitesByEmail(email: string): Promise<WorkspaceInvite[]> {
    return await db.select().from(workspaceInvites)
      .where(and(eq(workspaceInvites.email, email), eq(workspaceInvites.status, "pending")));
  }

  async updateInviteStatus(id: number, status: string): Promise<WorkspaceInvite> {
    const [updated] = await db.update(workspaceInvites).set({ status, updatedAt: new Date() }).where(eq(workspaceInvites.id, id)).returning();
    return updated;
  }

  async deleteWorkspaceInvite(id: number): Promise<void> {
    await db.delete(workspaceInvites).where(eq(workspaceInvites.id, id));
  }

  async switchUserWorkspace(userId: string, workspaceId: number): Promise<void> {
    await db.update(users).set({ workspaceId }).where(eq(users.id, userId));
  }

  async getAllWorkspaces(): Promise<(Workspace & { memberCount: number })[]> {
    const allWs = await db.select().from(workspaces).orderBy(workspaces.id);
    const allMembers = await db.select().from(workspaceMembers);
    return allWs.map(ws => ({
      ...ws,
      memberCount: allMembers.filter(m => m.workspaceId === ws.id).length,
    }));
  }

  async deleteWorkspace(id: number): Promise<void> {
    await db.delete(workspaceInvites).where(eq(workspaceInvites.workspaceId, id));
    await db.delete(comments).where(eq(comments.workspaceId, id));
    await db.delete(eventAssignments).where(eq(eventAssignments.workspaceId, id));
    await db.delete(settings).where(eq(settings.workspaceId, id));
    await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, id));
    await db.delete(schedules).where(eq(schedules.workspaceId, id));
    await db.delete(contacts).where(eq(contacts.workspaceId, id));
    await db.delete(venues).where(eq(venues.workspaceId, id));
    await db.delete(events).where(eq(events.workspaceId, id));
    await db.delete(files).where(eq(files.workspaceId, id));
    await db.delete(fileFolders).where(eq(fileFolders.workspaceId, id));
    await db.delete(taskTypes).where(eq(taskTypes.workspaceId, id));
    await db.delete(departments).where(eq(departments.workspaceId, id));
    await db.delete(scheduleTemplates).where(eq(scheduleTemplates.workspaceId, id));
    await db.delete(zones).where(eq(zones.workspaceId, id));
    await db.delete(sections).where(eq(sections.workspaceId, id));
    await db.delete(projects).where(eq(projects.workspaceId, id));
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  // Task Types
  async getTaskTypes(workspaceId: number): Promise<TaskType[]> {
    return await db.select().from(taskTypes)
      .where(eq(taskTypes.workspaceId, workspaceId))
      .orderBy(taskTypes.name);
  }

  async createTaskType(taskType: InsertTaskType): Promise<TaskType> {
    const [created] = await db.insert(taskTypes).values(taskType).returning();
    return created;
  }

  async updateTaskType(id: number, data: Partial<InsertTaskType>): Promise<TaskType> {
    const [updated] = await db.update(taskTypes).set(data).where(eq(taskTypes.id, id)).returning();
    return updated;
  }

  async deleteTaskType(id: number): Promise<void> {
    await db.delete(taskTypes).where(eq(taskTypes.id, id));
  }

  // Departments
  async getDepartments(workspaceId: number): Promise<Department[]> {
    return await db.select().from(departments)
      .where(eq(departments.workspaceId, workspaceId))
      .orderBy(departments.name);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [created] = await db.insert(departments).values(department).returning();
    return created;
  }

  async updateDepartment(id: number, data: Partial<InsertDepartment>): Promise<Department> {
    const [updated] = await db.update(departments).set(data).where(eq(departments.id, id)).returning();
    return updated;
  }

  async deleteDepartment(id: number): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Crew Positions
  async getCrewPositions(workspaceId: number): Promise<CrewPosition[]> {
    return await db.select().from(crewPositions)
      .where(eq(crewPositions.workspaceId, workspaceId))
      .orderBy(crewPositions.name);
  }

  async createCrewPosition(position: InsertCrewPosition): Promise<CrewPosition> {
    const [created] = await db.insert(crewPositions).values(position).returning();
    return created;
  }

  async updateCrewPosition(id: number, data: Partial<InsertCrewPosition>): Promise<CrewPosition> {
    const [updated] = await db.update(crewPositions).set(data).where(eq(crewPositions.id, id)).returning();
    return updated;
  }

  async deleteCrewPosition(id: number): Promise<void> {
    await db.delete(crewPositions).where(eq(crewPositions.id, id));
  }

  // Schedule Templates
  async getScheduleTemplates(workspaceId: number): Promise<ScheduleTemplate[]> {
    return await db.select().from(scheduleTemplates)
      .where(or(eq(scheduleTemplates.workspaceId, workspaceId), isNull(scheduleTemplates.workspaceId)))
      .orderBy(scheduleTemplates.name);
  }

  async createScheduleTemplate(template: InsertScheduleTemplate): Promise<ScheduleTemplate> {
    const [created] = await db.insert(scheduleTemplates).values(template).returning();
    return created;
  }

  async updateScheduleTemplate(id: number, data: Partial<InsertScheduleTemplate>): Promise<ScheduleTemplate> {
    const [updated] = await db.update(scheduleTemplates).set(data).where(eq(scheduleTemplates.id, id)).returning();
    return updated;
  }

  async deleteScheduleTemplate(id: number): Promise<void> {
    await db.delete(scheduleTemplates).where(eq(scheduleTemplates.id, id));
  }

  // Event Day Venues
  async getEventDayVenues(eventId: number): Promise<EventDayVenue[]> {
    return await db.select().from(eventDayVenues)
      .where(eq(eventDayVenues.eventId, eventId))
      .orderBy(eventDayVenues.date);
  }

  async getAllEventDayVenues(workspaceId: number): Promise<EventDayVenue[]> {
    return await db.select().from(eventDayVenues)
      .where(eq(eventDayVenues.workspaceId, workspaceId))
      .orderBy(eventDayVenues.date);
  }

  async getEventDayVenue(eventId: number, date: string): Promise<EventDayVenue | undefined> {
    const [row] = await db.select().from(eventDayVenues)
      .where(and(eq(eventDayVenues.eventId, eventId), eq(eventDayVenues.date, date)));
    return row;
  }

  async setEventDayVenue(dayVenue: InsertEventDayVenue): Promise<EventDayVenue> {
    const existing = await this.getEventDayVenue(dayVenue.eventId, dayVenue.date);
    if (existing) {
      const [updated] = await db.update(eventDayVenues)
        .set({ venueId: dayVenue.venueId })
        .where(eq(eventDayVenues.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(eventDayVenues).values(dayVenue).returning();
    return created;
  }

  async deleteEventDayVenues(eventId: number): Promise<void> {
    await db.delete(eventDayVenues).where(eq(eventDayVenues.eventId, eventId));
  }

  async deleteEventDayVenue(eventId: number, date: string): Promise<void> {
    await db.delete(eventDayVenues).where(
      and(eq(eventDayVenues.eventId, eventId), eq(eventDayVenues.date, date))
    );
  }

  // Zones
  async getZonesByVenue(venueId: number): Promise<Zone[]> {
    return await db.select().from(zones)
      .where(eq(zones.venueId, venueId))
      .orderBy(zones.sortOrder, zones.name);
  }

  async getZones(workspaceId: number): Promise<Zone[]> {
    return await db.select().from(zones)
      .where(eq(zones.workspaceId, workspaceId))
      .orderBy(zones.name);
  }

  async createZone(zone: InsertZone): Promise<Zone> {
    const [created] = await db.insert(zones).values(zone).returning();
    return created;
  }

  async updateZone(id: number, data: Partial<InsertZone>): Promise<Zone> {
    const [updated] = await db.update(zones).set(data).where(eq(zones.id, id)).returning();
    return updated;
  }

  async deleteZone(id: number): Promise<void> {
    await db.update(schedules).set({ zoneId: null }).where(eq(schedules.zoneId, id));
    await db.delete(zones).where(eq(zones.id, id));
  }

  // Projects
  async getProjects(workspaceId: number): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(projects.name);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project> {
    const [updated] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.update(events).set({ projectId: null as any }).where(eq(events.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async clearProjectManagerInWorkspace(userId: string, workspaceId: number): Promise<void> {
    await db.update(projects)
      .set({ managerId: null })
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.managerId, userId)));
  }

  async reassignProjectManagerInWorkspace(oldUserId: string, newUserId: string, workspaceId: number): Promise<void> {
    await db.update(projects)
      .set({ managerId: newUserId })
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.managerId, oldUserId)));
  }

  // Sections
  async getSectionsByEvent(eventId: number): Promise<Section[]> {
    return await db.select().from(sections)
      .where(eq(sections.eventId, eventId))
      .orderBy(sections.sortOrder, sections.name);
  }

  async getSections(workspaceId: number): Promise<Section[]> {
    return await db.select().from(sections)
      .where(eq(sections.workspaceId, workspaceId))
      .orderBy(sections.name);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const [created] = await db.insert(sections).values(section).returning();
    return created;
  }

  async updateSection(id: number, data: Partial<InsertSection>): Promise<Section> {
    const [updated] = await db.update(sections).set(data).where(eq(sections.id, id)).returning();
    return updated;
  }

  async deleteSection(id: number): Promise<void> {
    await db.update(schedules).set({ sectionId: null }).where(eq(schedules.sectionId, id));
    await db.delete(sections).where(eq(sections.id, id));
  }

  // Timesheet Entries
  async getTimesheetEntries(workspaceId: number, eventId?: number, date?: string): Promise<TimesheetEntry[]> {
    const conditions = [eq(timesheetEntries.workspaceId, workspaceId)];
    if (eventId) conditions.push(eq(timesheetEntries.eventId, eventId));
    if (date) conditions.push(eq(timesheetEntries.date, date));
    return await db.select().from(timesheetEntries).where(and(...conditions)).orderBy(timesheetEntries.employeeName);
  }

  async createTimesheetEntry(entry: InsertTimesheetEntry): Promise<TimesheetEntry> {
    const [created] = await db.insert(timesheetEntries).values(entry).returning();
    return created;
  }

  async updateTimesheetEntry(id: number, data: Partial<InsertTimesheetEntry>): Promise<TimesheetEntry> {
    const [updated] = await db.update(timesheetEntries).set(data).where(eq(timesheetEntries.id, id)).returning();
    return updated;
  }

  async deleteTimesheetEntry(id: number): Promise<void> {
    await db.delete(timesheetEntries).where(eq(timesheetEntries.id, id));
  }

  // Notifications
  async getNotifications(userId: string, workspaceId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.workspaceId, workspaceId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string, workspaceId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.workspaceId, workspaceId), eq(notifications.read, false)));
    return result[0]?.count ?? 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string, workspaceId: number): Promise<void> {
    await db.update(notifications).set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.workspaceId, workspaceId), eq(notifications.read, false)));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async archiveEventsByProject(projectId: number, archived: boolean): Promise<void> {
    await db.update(events).set({ archived }).where(eq(events.projectId, projectId));
  }

  // Activity Log
  async getActivityLog(workspaceId: number, limit: number = 100, since?: Date, eventName?: string): Promise<ActivityLogEntry[]> {
    const conditions = [eq(activityLog.workspaceId, workspaceId)];
    if (since) {
      const { gt } = await import("drizzle-orm");
      conditions.push(gt(activityLog.createdAt, since));
    }
    if (eventName) {
      conditions.push(eq(activityLog.eventName, eventName));
    }
    return await db.select().from(activityLog)
      .where(and(...conditions))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async getActivityCounts(workspaceId: number, since: Date): Promise<{ scheduleChanges: number; assignmentChanges: number; comments: number; fileChanges: number; total: number }> {
    const { gt } = await import("drizzle-orm");
    const entries = await db.select({ type: activityLog.type }).from(activityLog)
      .where(and(eq(activityLog.workspaceId, workspaceId), gt(activityLog.createdAt, since)));
    const counts = { scheduleChanges: 0, assignmentChanges: 0, comments: 0, fileChanges: 0, total: entries.length };
    for (const e of entries) {
      if (e.type === "schedule_change") counts.scheduleChanges++;
      else if (e.type === "assignment_change") counts.assignmentChanges++;
      else if (e.type === "comment") counts.comments++;
      else if (e.type === "file_change" || e.type === "daily_sheet_sent") counts.fileChanges++;
    }
    return counts;
  }

  async createActivityEntry(entry: InsertActivityLogEntry): Promise<ActivityLogEntry> {
    const [created] = await db.insert(activityLog).values(entry).returning();
    return created;
  }

  // Schedule Reorder (batch)
  async reorderScheduleItems(items: { id: number; sortOrder: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx.update(schedules).set({ sortOrder: item.sortOrder }).where(eq(schedules.id, item.id));
      }
    });
  }

  // Timesheet Summary
  async getTimesheetEntriesByEventIds(eventIds: number[], startDate?: string, endDate?: string): Promise<TimesheetEntry[]> {
    if (eventIds.length === 0) return [];
    const conditions: any[] = [inArray(timesheetEntries.eventId, eventIds)];
    const { gte, lte } = await import("drizzle-orm");
    if (startDate) conditions.push(gte(timesheetEntries.date, startDate));
    if (endDate) conditions.push(lte(timesheetEntries.date, endDate));
    return await db.select().from(timesheetEntries)
      .where(and(...conditions))
      .orderBy(timesheetEntries.employeeName);
  }

  async getTimesheetEntriesByDateRange(workspaceId: number, startDate: string, endDate: string): Promise<TimesheetEntry[]> {
    const { gte, lte } = await import("drizzle-orm");
    return await db.select().from(timesheetEntries)
      .where(and(
        eq(timesheetEntries.workspaceId, workspaceId),
        gte(timesheetEntries.date, startDate),
        lte(timesheetEntries.date, endDate)
      ))
      .orderBy(timesheetEntries.employeeName);
  }

  // Travel Days
  async getTravelDays(projectId: number): Promise<TravelDay[]> {
    return await db.select().from(travelDays)
      .where(eq(travelDays.projectId, projectId))
      .orderBy(travelDays.date);
  }

  async createTravelDay(travelDay: InsertTravelDay): Promise<TravelDay> {
    const [created] = await db.insert(travelDays).values(travelDay).returning();
    return created;
  }

  async deleteTravelDay(id: number): Promise<void> {
    await db.delete(travelDays).where(eq(travelDays.id, id));
  }

  async getGearRequests(eventId: number, workspaceId: number): Promise<GearRequest[]> {
    return await db.select().from(gearRequests)
      .where(and(eq(gearRequests.eventId, eventId), eq(gearRequests.workspaceId, workspaceId)))
      .orderBy(desc(gearRequests.createdAt));
  }

  async getGearRequestsByWorkspace(workspaceId: number): Promise<GearRequest[]> {
    return await db.select().from(gearRequests)
      .where(eq(gearRequests.workspaceId, workspaceId))
      .orderBy(desc(gearRequests.createdAt));
  }

  async createGearRequest(request: InsertGearRequest): Promise<GearRequest> {
    const [created] = await db.insert(gearRequests).values(request).returning();
    return created;
  }

  async getProjectAssignments(projectId: number, workspaceId: number): Promise<ProjectAssignment[]> {
    return await db.select().from(projectAssignments)
      .where(and(eq(projectAssignments.projectId, projectId), eq(projectAssignments.workspaceId, workspaceId)));
  }

  async getProjectAssignmentsByUser(userId: string, workspaceId: number): Promise<ProjectAssignment[]> {
    return await db.select().from(projectAssignments)
      .where(and(eq(projectAssignments.userId, userId), eq(projectAssignments.workspaceId, workspaceId)));
  }

  async getAllProjectAssignments(workspaceId: number): Promise<ProjectAssignment[]> {
    return await db.select().from(projectAssignments)
      .where(eq(projectAssignments.workspaceId, workspaceId));
  }

  async createProjectAssignment(assignment: InsertProjectAssignment): Promise<ProjectAssignment> {
    const [created] = await db.insert(projectAssignments).values(assignment).returning();
    return created;
  }

  async deleteProjectAssignment(id: number): Promise<void> {
    await db.delete(projectAssignments).where(eq(projectAssignments.id, id));
  }

  // Crew Travel
  async getCrewTravel(travelDayId: number): Promise<CrewTravel[]> {
    return await db.select().from(crewTravel)
      .where(eq(crewTravel.travelDayId, travelDayId));
  }

  async createCrewTravel(data: InsertCrewTravel): Promise<CrewTravel> {
    const [created] = await db.insert(crewTravel).values(data).returning();
    return created;
  }

  async bulkCreateCrewTravel(records: InsertCrewTravel[]): Promise<CrewTravel[]> {
    if (records.length === 0) return [];
    return await db.insert(crewTravel).values(records).returning();
  }

  async updateCrewTravel(id: number, data: Partial<InsertCrewTravel>): Promise<CrewTravel> {
    const [updated] = await db.update(crewTravel).set(data).where(eq(crewTravel.id, id)).returning();
    return updated;
  }

  async deleteCrewTravel(id: number): Promise<void> {
    await db.delete(crewTravel).where(eq(crewTravel.id, id));
  }

  // Daily Checkins
  async getDailyCheckins(eventName: string, date: string, workspaceId: number): Promise<DailyCheckin[]> {
    return await db.select().from(dailyCheckins)
      .where(and(
        eq(dailyCheckins.eventName, eventName),
        eq(dailyCheckins.date, date),
        eq(dailyCheckins.workspaceId, workspaceId)
      ));
  }

  async upsertDailyCheckin(data: { userId: string; eventName: string; date: string; workspaceId: number }): Promise<DailyCheckin> {
    const existing = await db.select().from(dailyCheckins)
      .where(and(
        eq(dailyCheckins.userId, data.userId),
        eq(dailyCheckins.eventName, data.eventName),
        eq(dailyCheckins.date, data.date),
        eq(dailyCheckins.workspaceId, data.workspaceId)
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(dailyCheckins)
        .set({ checkedInAt: new Date(), checkedOutAt: null })
        .where(eq(dailyCheckins.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(dailyCheckins).values({
      ...data,
      checkedInAt: new Date(),
      checkedOutAt: null,
    }).returning();
    return created;
  }

  async checkOutDaily(id: number): Promise<DailyCheckin> {
    const [updated] = await db.update(dailyCheckins)
      .set({ checkedOutAt: new Date() })
      .where(eq(dailyCheckins.id, id))
      .returning();
    return updated;
  }

  async lunchOutDaily(id: number): Promise<DailyCheckin> {
    const [updated] = await db.update(dailyCheckins)
      .set({ lunchOutAt: new Date() })
      .where(eq(dailyCheckins.id, id))
      .returning();
    return updated;
  }

  async lunchInDaily(id: number): Promise<DailyCheckin> {
    const [updated] = await db.update(dailyCheckins)
      .set({ lunchInAt: new Date() })
      .where(eq(dailyCheckins.id, id))
      .returning();
    return updated;
  }

  async resetDailyCheckin(id: number): Promise<DailyCheckin> {
    const [updated] = await db.update(dailyCheckins)
      .set({ checkedInAt: null, lunchOutAt: null, lunchInAt: null, checkedOutAt: null })
      .where(eq(dailyCheckins.id, id))
      .returning();
    return updated;
  }

  // Access Links
  async createAccessLink(link: InsertAccessLink): Promise<AccessLink> {
    const [created] = await db.insert(accessLinks).values(link).returning();
    return created;
  }

  async getAccessLinkByToken(token: string): Promise<AccessLink | undefined> {
    const [link] = await db.select().from(accessLinks).where(eq(accessLinks.token, token));
    return link;
  }

  async getAccessLinksByContact(contactId: number, workspaceId: number): Promise<AccessLink[]> {
    return await db.select().from(accessLinks)
      .where(and(eq(accessLinks.contactId, contactId), eq(accessLinks.workspaceId, workspaceId), eq(accessLinks.revoked, false)))
      .orderBy(desc(accessLinks.createdAt));
  }

  async getAccessLinksByWorkspace(workspaceId: number): Promise<AccessLink[]> {
    return await db.select().from(accessLinks)
      .where(eq(accessLinks.workspaceId, workspaceId))
      .orderBy(desc(accessLinks.createdAt));
  }

  async revokeAccessLink(id: number, workspaceId: number): Promise<AccessLink | undefined> {
    const [updated] = await db.update(accessLinks)
      .set({ revoked: true })
      .where(and(eq(accessLinks.id, id), eq(accessLinks.workspaceId, workspaceId)))
      .returning();
    return updated;
  }

  async deleteAccessLink(id: number): Promise<void> {
    await db.delete(accessLinks).where(eq(accessLinks.id, id));
  }

}

export const storage = new DatabaseStorage();
