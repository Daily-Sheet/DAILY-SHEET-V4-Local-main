import { pgTable, text, serial, integer, timestamp, boolean, varchar, json, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type CrewMember = {
  name: string;
  userId?: string | null;
  position?: string | null;
  departments?: string[];
};

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  category: text("category").notNull(),
  location: text("location"),
  eventDate: text("event_date"),
  eventName: text("event_name"),
  sortOrder: integer("sort_order").default(0),
  crewNames: text("crew_names").array(),
  crew: json("crew").$type<CrewMember[]>(),
  zoneId: integer("zone_id"),
  sectionId: integer("section_id"),
  workspaceId: integer("workspace_id"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by"),
  isNextDay: boolean("is_next_day").default(false),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  role: text("role").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  userId: text("user_id"),
  workspaceId: integer("workspace_id"),
  contactType: text("contact_type").notNull().default("crew"),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  eventName: text("event_name"),
  folderName: text("folder_name"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  workspaceId: integer("workspace_id"),
  projectId: integer("project_id"),
});

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  wifiSsid: text("wifi_ssid"),
  wifiPassword: text("wifi_password"),
  notes: text("notes"),
  parking: text("parking"),
  loadIn: text("load_in"),
  capacity: text("capacity"),
  dressingRooms: boolean("dressing_rooms").default(false),
  dressingRoomsNotes: text("dressing_rooms_notes"),
  showers: boolean("showers").default(false),
  showersNotes: text("showers_notes"),
  laundry: boolean("laundry").default(false),
  laundryNotes: text("laundry_notes"),
  meals: text("meals"),
  mealsNotes: text("meals_notes"),
  techPacketUrl: text("tech_packet_url"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  workspaceId: integer("workspace_id"),
  createdByWorkspaceId: integer("created_by_workspace_id"),
});

export const venueTechPackets = pgTable("venue_tech_packets", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  url: text("url").notNull(),
  originalName: text("original_name"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  workspaceId: integer("workspace_id"),
  workspaceName: text("workspace_name"),
});

export type VenueTechPacket = typeof venueTechPackets.$inferSelect;
export type InsertVenueTechPacket = typeof venueTechPackets.$inferInsert;

export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, uploadedAt: true });
export const insertVenueSchema = createInsertSchema(venues).omit({ id: true });

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export * from "./models/auth";

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  workspaceId: integer("workspace_id"),
  pinned: boolean("pinned").default(false),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, pinned: true });
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  notes: text("notes"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  venueId: integer("venue_id"),
  projectId: integer("project_id"),
  workspaceId: integer("workspace_id"),
  archived: boolean("archived").default(false),
  legId: integer("leg_id"),
  eventType: text("event_type").default("show"),
  tag: text("tag"),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export const fileFolders = pgTable("file_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  eventName: text("event_name"),
  parentId: integer("parent_id"),
  workspaceId: integer("workspace_id"),
  projectId: integer("project_id"),
});

export const insertFileFolderSchema = createInsertSchema(fileFolders).omit({ id: true });
export type FileFolder = typeof fileFolders.$inferSelect;
export type InsertFileFolder = z.infer<typeof insertFileFolderSchema>;

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  workspaceId: integer("workspace_id"),
});

export type Setting = typeof settings.$inferSelect;

export const eventAssignments = pgTable("event_assignments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventName: text("event_name").notNull(),
  workspaceId: integer("workspace_id"),
  position: text("position"),
  checkedInAt: timestamp("checked_in_at"),
  date: text("date"),
});

export const insertEventAssignmentSchema = createInsertSchema(eventAssignments).omit({ id: true });
export type EventAssignment = typeof eventAssignments.$inferSelect;
export type InsertEventAssignment = z.infer<typeof insertEventAssignmentSchema>;

export const eventDayVenues = pgTable("event_day_venues", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  date: text("date").notNull(),
  venueId: integer("venue_id").notNull(),
  workspaceId: integer("workspace_id"),
});

export const insertEventDayVenueSchema = createInsertSchema(eventDayVenues).omit({ id: true });
export type EventDayVenue = typeof eventDayVenues.$inferSelect;
export type InsertEventDayVenue = z.infer<typeof insertEventDayVenueSchema>;

export const taskTypes = pgTable("task_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false),
  workspaceId: integer("workspace_id"),
});

export const insertTaskTypeSchema = createInsertSchema(taskTypes).omit({ id: true });
export type TaskType = typeof taskTypes.$inferSelect;
export type InsertTaskType = z.infer<typeof insertTaskTypeSchema>;

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false),
  workspaceId: integer("workspace_id"),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export const crewPositions = pgTable("crew_positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false),
  workspaceId: integer("workspace_id"),
});

export const insertCrewPositionSchema = createInsertSchema(crewPositions).omit({ id: true });
export type CrewPosition = typeof crewPositions.$inferSelect;
export type InsertCrewPosition = z.infer<typeof insertCrewPositionSchema>;

export const scheduleTemplates = pgTable("schedule_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  items: text("items").notNull(),
  type: text("type").notNull().default("day"),
  workspaceId: integer("workspace_id"),
});

export const insertScheduleTemplateSchema = createInsertSchema(scheduleTemplates).omit({ id: true });
export type ScheduleTemplate = typeof scheduleTemplates.$inferSelect;
export type InsertScheduleTemplate = z.infer<typeof insertScheduleTemplateSchema>;

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  venueId: integer("venue_id").notNull(),
  sortOrder: integer("sort_order").default(0),
  workspaceId: integer("workspace_id"),
});

export const insertZoneSchema = createInsertSchema(zones).omit({ id: true });
export type Zone = typeof zones.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  projectNumber: text("project_number"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  workspaceId: integer("workspace_id"),
  archived: boolean("archived").default(false),
  driveUrl: text("drive_url"),
  managerId: text("manager_id"),
  isFestival: boolean("is_festival").default(false),
  isTour: boolean("is_tour").default(false),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventId: integer("event_id").notNull(),
  sortOrder: integer("sort_order").default(0),
  workspaceId: integer("workspace_id"),
});

export const insertSectionSchema = createInsertSchema(sections).omit({ id: true });
export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export const timesheetEntries = pgTable("timesheet_entries", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  date: text("date").notNull(),
  employeeName: text("employee_name").notNull(),
  position: text("position"),
  timeIn: text("time_in"),
  mealBreakOut: text("meal_break_out"),
  mealBreakIn: text("meal_break_in"),
  timeOut: text("time_out"),
  paidMealBreak: boolean("paid_meal_break").default(true),
  totalHours: text("total_hours"),
  initials: text("initials"),
  workspaceId: integer("workspace_id"),
});

export const insertTimesheetEntrySchema = createInsertSchema(timesheetEntries).omit({ id: true });
export type TimesheetEntry = typeof timesheetEntries.$inferSelect;
export type InsertTimesheetEntry = z.infer<typeof insertTimesheetEntrySchema>;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  eventName: text("event_name"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  workspaceId: integer("workspace_id"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  type: text("type").notNull(),
  action: text("action").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  eventName: text("event_name"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
  workspaceId: integer("workspace_id"),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type InsertActivityLogEntry = z.infer<typeof insertActivityLogSchema>;

export const travelDays = pgTable("travel_days", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  flightNumber: text("flight_number"),
  airline: text("airline"),
  departureAirport: text("departure_airport"),
  arrivalAirport: text("arrival_airport"),
  departureTime: text("departure_time"),
  arrivalTime: text("arrival_time"),
  workspaceId: integer("workspace_id"),
  legId: integer("leg_id"),
});

export const insertTravelDaySchema = createInsertSchema(travelDays).omit({ id: true });
export type TravelDay = typeof travelDays.$inferSelect;
export type InsertTravelDay = z.infer<typeof insertTravelDaySchema>;

export const legs = pgTable("legs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  projectId: integer("project_id").notNull(),
  workspaceId: integer("workspace_id"),
  sortOrder: integer("sort_order").default(0),
  notes: text("notes"),
  startDate: text("start_date"),
  endDate: text("end_date"),
});

export const insertLegSchema = createInsertSchema(legs).omit({ id: true });
export type Leg = typeof legs.$inferSelect;
export type InsertLeg = z.infer<typeof insertLegSchema>;

export const gearRequests = pgTable("gear_requests", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  workspaceId: integer("workspace_id").notNull(),
  requestedBy: text("requested_by").notNull(),
  requestedByName: text("requested_by_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  items: text("items").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("sent"),
  fileId: integer("file_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGearRequestSchema = createInsertSchema(gearRequests).omit({ id: true, createdAt: true });
export type GearRequest = typeof gearRequests.$inferSelect;
export type InsertGearRequest = z.infer<typeof insertGearRequestSchema>;

export const crewTravel = pgTable("crew_travel", {
  id: serial("id").primaryKey(),
  travelDayId: integer("travel_day_id").notNull(),
  userId: varchar("user_id").notNull(),
  flightNumber: text("flight_number"),
  airline: text("airline"),
  departureAirport: text("departure_airport"),
  arrivalAirport: text("arrival_airport"),
  departureTime: text("departure_time"),
  arrivalTime: text("arrival_time"),
  hotelName: text("hotel_name"),
  hotelAddress: text("hotel_address"),
  hotelCheckIn: text("hotel_check_in"),
  hotelCheckOut: text("hotel_check_out"),
  groundTransport: text("ground_transport"),
  notes: text("notes"),
  workspaceId: integer("workspace_id").notNull(),
});

export const insertCrewTravelSchema = createInsertSchema(crewTravel).omit({ id: true });
export type CrewTravel = typeof crewTravel.$inferSelect;
export type InsertCrewTravel = z.infer<typeof insertCrewTravelSchema>;

export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  eventName: text("event_name").notNull(),
  date: text("date").notNull(),
  checkedInAt: timestamp("checked_in_at"),
  lunchOutAt: timestamp("lunch_out_at"),
  lunchInAt: timestamp("lunch_in_at"),
  checkedOutAt: timestamp("checked_out_at"),
  workspaceId: integer("workspace_id").notNull(),
});

export const insertDailyCheckinSchema = createInsertSchema(dailyCheckins).omit({ id: true });
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = z.infer<typeof insertDailyCheckinSchema>;

export const projectAssignments = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  workspaceId: integer("workspace_id").notNull(),
  position: text("position"),
  checkedInAt: timestamp("checked_in_at"),
});

export const insertProjectAssignmentSchema = createInsertSchema(projectAssignments).omit({ id: true });
export type ProjectAssignment = typeof projectAssignments.$inferSelect;
export type InsertProjectAssignment = z.infer<typeof insertProjectAssignmentSchema>;

export const accessLinks = pgTable("access_links", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  contactId: integer("contact_id").notNull(),
  workspaceId: integer("workspace_id").notNull(),
  eventName: text("event_name"),
  projectId: integer("project_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by").notNull(),
  revoked: boolean("revoked").default(false),
});

export const insertAccessLinkSchema = createInsertSchema(accessLinks).omit({ id: true, createdAt: true });
export type AccessLink = typeof accessLinks.$inferSelect;

// Community Map
export const mapPins = pgTable("map_pins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("other"),
  description: text("description"),
  address: text("address"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertMapPinSchema = createInsertSchema(mapPins).omit({ id: true, createdAt: true });
export type MapPin = typeof mapPins.$inferSelect;
export type InsertMapPin = z.infer<typeof insertMapPinSchema>;

export const mapPinLikes = pgTable("map_pin_likes", {
  id: serial("id").primaryKey(),
  pinId: integer("pin_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MapPinLike = typeof mapPinLikes.$inferSelect;

export const mapPinComments = pgTable("map_pin_comments", {
  id: serial("id").primaryKey(),
  pinId: integer("pin_id").notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertMapPinCommentSchema = createInsertSchema(mapPinComments).omit({ id: true, createdAt: true });
export type MapPinComment = typeof mapPinComments.$inferSelect;
export type InsertMapPinComment = z.infer<typeof insertMapPinCommentSchema>;
export type InsertAccessLink = z.infer<typeof insertAccessLinkSchema>;

// Band Portal
export const bandPortalLinks = pgTable("band_portal_links", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  eventName: text("event_name").notNull(),
  folderName: text("folder_name").notNull(),
  workspaceId: integer("workspace_id").notNull(),
  bandName: text("band_name").notNull(),
  notes: text("notes"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
  revoked: boolean("revoked").default(false),
});

export const insertBandPortalLinkSchema = createInsertSchema(bandPortalLinks).omit({ id: true, createdAt: true });
export type BandPortalLink = typeof bandPortalLinks.$inferSelect;
export type InsertBandPortalLink = z.infer<typeof insertBandPortalLinkSchema>;

// After Job Reports
export const afterJobReports = pgTable("after_job_reports", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  projectId: integer("project_id"),
  workspaceId: integer("workspace_id").notNull(),
  submittedBy: varchar("submitted_by").notNull(),
  submittedByName: text("submitted_by_name"),
  rating: integer("rating"),
  wentAsPlanned: boolean("went_as_planned"),
  summary: text("summary"),
  issueCategory: text("issue_category"),
  issueDescription: text("issue_description"),
  hadInjuries: boolean("had_injuries").default(false),
  injuryDescription: text("injury_description"),
  hadEquipmentIssues: boolean("had_equipment_issues").default(false),
  equipmentDescription: text("equipment_description"),
  hadUnplannedExpenses: boolean("had_unplanned_expenses").default(false),
  expenseAmount: text("expense_amount"),
  expenseDescription: text("expense_description"),
  expenseReceiptUrl: text("expense_receipt_url"),
  attendanceEstimate: integer("attendance_estimate"),
  clientNotes: text("client_notes"),
  venueNotes: text("venue_notes"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAfterJobReportSchema = createInsertSchema(afterJobReports).omit({ id: true, createdAt: true });
export type AfterJobReport = typeof afterJobReports.$inferSelect;
export type InsertAfterJobReport = z.infer<typeof insertAfterJobReportSchema>;
