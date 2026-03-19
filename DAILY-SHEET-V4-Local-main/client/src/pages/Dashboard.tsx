import { useState, useRef, useMemo, useEffect, useCallback, useSyncExternalStore, lazy, Suspense } from "react";
import { DEPARTMENTS } from "@shared/constants";
import { cn } from "@/lib/utils";
const PdfPreview = lazy(() => import("@/components/PdfPreview"));
import { Link, useSearch, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format, addDays, parseISO, isToday, isSameDay, startOfWeek, eachDayOfInterval, differenceInDays } from "date-fns";
import { getLocalTimeMinutes, formatTime, toTimeInputValue, getUrgencyStatus, getUserTimezone } from "@/lib/timeUtils";
import type { UrgencyStatus } from "@/lib/timeUtils";
import { 
  Calendar as CalendarIcon, Users, MapPin, Share2, 
  Wifi, Phone, Mail,
  Mic2, Clock, Trash2, Settings, LogOut, MessageSquare, Send, Pin, Briefcase,
  Sun, Moon, Search, Filter, FileText, Download, Upload, File,
  ChevronLeft, ChevronRight, Eye, UserCog, FolderOpen, ChevronDown, ChevronUp, X, Check,
  Archive, ArrowUpDown, Sparkles, Loader2, ExternalLink, CheckCircle2, Circle, RotateCw, RotateCcw,
  List, BarChart3,
  Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Thermometer, LogIn, UtensilsCrossed
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { useTheme } from "@/components/ThemeProvider";
import { NotificationBell } from "@/components/NotificationBell";
import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";

import { CommandPalette } from "@/components/CommandPalette";
import { GripVertical, Copy, Bell, Navigation, Wrench, Plane, PlaneTakeoff, PlaneLanding, Hotel, CarFront, SlidersHorizontal, EyeOff, Star } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSchedules, useDeleteSchedule, useUpdateSchedule } from "@/hooks/use-schedules";
import { useContacts, useDeleteContact, useUpdateContact, useCreateContact } from "@/hooks/use-contacts";
import type { Contact, Schedule, Event, FileFolder, Venue, EventDayVenue } from "@shared/schema";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, UserPlus, Plus } from "lucide-react";
import { useVenues, useCreateVenue } from "@/hooks/use-venue";
import { useZones } from "@/hooks/use-zones";
import { useSections } from "@/hooks/use-sections";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import type { Zone, Section, Project, TravelDay } from "@shared/schema";
import { useAuth, resetBootstrap, type AuthUser } from "@/hooks/use-auth";
import type { DashboardPreferences } from "@shared/models/auth";
import { useComments, useCreateComment, useDeleteComment, useToggleCommentPin } from "@/hooks/use-comments";

import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreateScheduleDialog, ScheduleTemplateDialog, SaveAsTemplateButton, CopyDayScheduleButton, useCombinedCategories, CategorySelect } from "@/components/CreateScheduleDialog";
import { CreateContactDialog } from "@/components/CreateContactDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useToast } from "@/hooks/use-toast";
import { useEventSelection } from "@/contexts/EventSelectionContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

import { useColorScheme, PALETTES, type PaletteName } from "@/components/ColorSchemeProvider";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Save } from "lucide-react";
import { PullToRefresh } from "@/components/PullToRefresh";
import GanttScheduleView from "@/components/GanttScheduleView";

import { buildNestedSchedule, flattenNested } from "@/lib/schedule-nesting";

// ─── Extracted dashboard components ──────────────────────────────────────────
import { useUrgencyTick, URGENCY_STYLES, matchesSearch, useUserActivity, ActiveDot } from "@/components/dashboard/utils";
import { ScheduleCommentsDialog, InlineComments } from "@/components/dashboard/schedule/ScheduleComments";
import { EditScheduleDialog } from "@/components/dashboard/schedule/EditScheduleDialog";
import { ClearDayButton, ScheduleItem, SortableScheduleItem } from "@/components/dashboard/schedule/ScheduleItem";
import { CrewPositionEditor } from "@/components/dashboard/crew/CrewPositionEditor";
import { VenueMiniMap, VenueQuickSelect, DailySheetNoVenue, TechPacketHistory } from "@/components/dashboard/venue/VenueView";
import { TravelDayCrewSummary, OnTourWidget } from "@/components/dashboard/overview/OnTourWidget";
import { GearRequestDialog, GearRequestHistory } from "@/components/dashboard/overview/GearRequest";
import { getWeatherIcon, getWeatherLabel, WeatherWidget } from "@/components/dashboard/overview/WeatherWidget";
import { ActivityFeed, OverviewActivitySquare } from "@/components/dashboard/overview/ActivityFeed";
import { ProfileDialog } from "@/components/dashboard/header/ProfileDialog";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { DayNavigator } from "@/components/dashboard/header/DayNavigator";
import { ShowSwitcher } from "@/components/dashboard/header/ShowSwitcher";
import { EditShowDialog } from "@/components/dashboard/shows/EditShowDialog";
import { FilesView, FilePreviewPanel } from "@/components/dashboard/files/FilesView";
import { AssignedCrewView, getContactShowNames, NoAssignmentState } from "@/components/dashboard/crew/AssignedCrewView";
import { ContactsView } from "@/components/dashboard/contacts/ContactsView";
import { SendDailyDialog } from "@/components/dashboard/pdf/SendDailyDialog";
import { CrewDirectoryDialog } from "@/components/dashboard/crew/CrewDirectoryDialog";
import { TimesheetTab } from "@/components/dashboard/timesheet/TimesheetTab";


type Workspace = { id: number; name: string; role: string };

const ALL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "assigned-crew", label: "Crew" },
  { id: "timesheet", label: "Timesheet" },
  { id: "files", label: "Files" },
  { id: "venue", label: "Venue" },
  { id: "activity", label: "Activity" },
] as const;
type TabId = typeof ALL_TABS[number]["id"];
const DEFAULT_TAB_ORDER: TabId[] = ALL_TABS.map(t => t.id);

function SortableTabRow({
  id, label, isHidden, isDefault, onToggleHidden, onSetDefault,
}: {
  id: string; label: string; isHidden: boolean; isDefault: boolean;
  onToggleHidden: () => void; onSetDefault: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card border border-border/50 select-none"
    >
      <span {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className={cn("flex-1 text-sm font-medium", isHidden && "line-through text-muted-foreground")}>{label}</span>
      <button
        onClick={onSetDefault}
        className={cn("p-1 rounded hover:bg-muted", isDefault ? "text-yellow-500" : "text-muted-foreground")}
        title="Set as default tab"
      >
        <Star className="h-3.5 w-3.5" fill={isDefault ? "currentColor" : "none"} />
      </button>
      <button
        onClick={onToggleHidden}
        className={cn("p-1 rounded hover:bg-muted", isHidden ? "text-muted-foreground" : "text-foreground")}
        title={isHidden ? "Show tab" : "Hide tab"}
      >
        <EyeOff className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const prefs = user?.dashboardPreferences;

  // Local customize state (only committed when saved)
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [draftOrder, setDraftOrder] = useState<TabId[]>(() => {
    const saved = prefs?.tabOrder as TabId[] | undefined;
    return saved?.length ? saved : [...DEFAULT_TAB_ORDER];
  });
  const [draftHidden, setDraftHidden] = useState<Set<TabId>>(() => {
    return new Set((prefs?.hiddenTabs ?? []) as TabId[]);
  });
  const [draftDefault, setDraftDefault] = useState<TabId>(() => {
    return (prefs?.defaultTab as TabId | undefined) ?? "overview";
  });

  // Sync draft state when prefs load
  useEffect(() => {
    if (!prefs) return;
    const saved = prefs.tabOrder as TabId[] | undefined;
    setDraftOrder(saved?.length ? saved : [...DEFAULT_TAB_ORDER]);
    setDraftHidden(new Set((prefs.hiddenTabs ?? []) as TabId[]));
    setDraftDefault((prefs.defaultTab as TabId | undefined) ?? "overview");
  }, [prefs]);

  // Applied (saved) preferences
  const TAB_ORDER: TabId[] = useMemo(() => {
    const saved = prefs?.tabOrder as TabId[] | undefined;
    if (!saved?.length) return [...DEFAULT_TAB_ORDER];
    // Ensure all tabs are represented (in case new tabs added later)
    const seen = new Set(saved);
    const missing = DEFAULT_TAB_ORDER.filter(t => !seen.has(t));
    return [...saved, ...missing] as TabId[];
  }, [prefs?.tabOrder]);

  const hiddenTabs: Set<TabId> = useMemo(() => {
    return new Set((prefs?.hiddenTabs ?? []) as TabId[]);
  }, [prefs?.hiddenTabs]);

  const visibleTabs = useMemo(() => TAB_ORDER.filter(t => !hiddenTabs.has(t)), [TAB_ORDER, hiddenTabs]);

  const defaultTab = (prefs?.defaultTab as TabId | undefined) ?? "overview";

  const [activeTab, setActiveTab] = useState(() => {
    return (prefs?.defaultTab as TabId | undefined) ?? "overview";
  });

  // Apply default tab from prefs on load
  useEffect(() => {
    if (prefs?.defaultTab) setActiveTab(prefs.defaultTab as TabId);
  }, [prefs?.defaultTab]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) || elapsed > 500) return;
    const currentIndex = visibleTabs.indexOf(activeTab as TabId);
    if (currentIndex === -1) return;
    if (dx < 0 && currentIndex < visibleTabs.length - 1) {
      setActiveTab(visibleTabs[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      setActiveTab(visibleTabs[currentIndex - 1]);
    }
  }, [activeTab, visibleTabs]);
  const [scheduleViewMode, setScheduleViewMode] = useState<"list" | "timeline">("list");

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        return;
      }
      // Ignore when typing in a field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "t" || e.key === "T") {
        setSelectedDate(format(new Date(), "yyyy-MM-dd"));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedDate(d => format(addDays(parseISO(d), -1), "yyyy-MM-dd"));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedDate(d => format(addDays(parseISO(d), 1), "yyyy-MM-dd"));
      } else if (e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        if (idx < visibleTabs.length) setActiveTab(visibleTabs[idx]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visibleTabs]);

  const [whatChangedBanner, setWhatChangedBanner] = useState<{ counts: { scheduleChanges: number; assignmentChanges: number; comments: number; fileChanges: number; total: number } } | null>(null);
  const [whatChangedDismissed, setWhatChangedDismissed] = useState(false);

  // Workspace invite banner
  const { data: workspaceInviteNotifications = [] } = useQuery<import("@shared/schema").Notification[]>({
    queryKey: ["/api/notifications"],
    select: (data) => data.filter((n: import("@shared/schema").Notification) => n.type === "workspace_invite" && !n.read),
  });
  const pendingInviteNotif = workspaceInviteNotifications[0] ?? null;
  const [inviteBannerDismissed, setInviteBannerDismissed] = useState(false);

  const markInviteReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const switchToInviteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: number) => {
      const res = await apiRequest("PATCH", "/api/auth/workspace", { workspaceId });
      return res.json();
    },
    onSuccess: () => {
      resetBootstrap();
      queryClient.clear();
      window.location.reload();
    },
    onError: () => toast({ title: "Failed to switch organization", variant: "destructive" }),
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parsed = parseISO(dateParam);
      if (!isNaN(parsed.getTime())) return dateParam;
    }
    return today;
  });
  const queryClient = useQueryClient();

  const savePreferencesMutation = useMutation({
    mutationFn: async (newPrefs: DashboardPreferences) => {
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newPrefs),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], (old: any) =>
        old ? { ...old, dashboardPreferences: updatedUser.dashboardPreferences } : old
      );
      toast({ title: "Layout saved" });
      setCustomizeOpen(false);
    },
    onError: () => toast({ title: "Failed to save layout", variant: "destructive" }),
  });

  const searchString = useSearch();

  useEffect(() => {
    if (!searchString) return;
    const params = new URLSearchParams(searchString);
    const dateParam = params.get("date");
    const eventParam = params.get("event");
    let applied = false;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parsed = parseISO(dateParam);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(dateParam);
        applied = true;
      }
    }
    const showParam = eventParam || params.get("show");
    if (showParam) {
      eventSelection.singleSelect(showParam);
      applied = true;
    }
    if (applied) {
      setTimeout(() => {
        window.history.replaceState({}, "", window.location.pathname);
      }, 0);
    }
  }, [searchString]);

  const { data: userWorkspaces = [] } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const currentWorkspace = userWorkspaces.find((w: Workspace) => w.id === user?.workspaceId);

  const eventSelection = useEventSelection();
  const selectedEvents = eventSelection.selectedEvents;

  useEffect(() => {
    if (user?.workspaceId) {
      eventSelection.setWorkspaceScope(user.workspaceId);
    }
  }, [user?.workspaceId]);

  const { data: schedules = [] } = useSchedules();
  const { data: contacts = [] } = useContacts();
  const activityMap = useUserActivity();
  const { data: venuesList = [] } = useVenues();
  const { data: allZones = [] } = useZones();
  const { data: allSections = [] } = useSections();
  const { data: allProjects = [] } = useProjects();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"], refetchInterval: 15_000, refetchOnWindowFocus: true });
  const { data: allDayVenues = [] } = useQuery<EventDayVenue[]>({ queryKey: ["/api/event-day-venues"] });
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"], refetchInterval: 30_000, refetchOnWindowFocus: true });

  const activeTourProjectIds = useMemo(() => allProjects.filter((p: Project) => p.isTour && !p.archived).map((p: Project) => p.id), [allProjects]);
  const firstTourProjectId = activeTourProjectIds[0] ?? null;
  const { data: dashboardTravelDays = [] } = useQuery<TravelDay[]>({
    queryKey: ["/api/projects", firstTourProjectId, "travel-days"],
    enabled: !!firstTourProjectId,
  });
  const travelDayForSelectedDate = useMemo(() => {
    return dashboardTravelDays.find(td => td.date === selectedDate) || null;
  }, [dashboardTravelDays, selectedDate]);

  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

  const eventLinkedVenueId = useMemo(() => {
    const eventNames = eventsList.map((e: Event) => e.name);
    const effectiveEvents = selectedEvents.length > 0
      ? selectedEvents.filter(n => eventNames.includes(n))
      : eventNames;
    for (const name of effectiveEvents) {
      const ev = eventsList.find((e: Event) => e.name === name);
      if (ev) {
        const dayVenue = allDayVenues.find(dv => dv.eventId === ev.id && dv.date === selectedDate);
        if (dayVenue) return dayVenue.venueId;
        if (ev.venueId) return ev.venueId;
      }
    }
    return null;
  }, [selectedEvents, eventsList, allDayVenues, selectedDate]);
  const venue = (() => {
    if (eventLinkedVenueId) return venuesList.find(v => v.id === eventLinkedVenueId) || null;
    if (selectedVenueId) return venuesList.find(v => v.id === selectedVenueId) || null;
    return venuesList[0] || null;
  })();

  const { mutate: deleteSchedule } = useDeleteSchedule();
  const { mutate: deleteContact } = useDeleteContact();

  const isManager = user?.role === "owner" || user?.role === "manager";
  const isAdmin = ["owner", "manager", "admin"].includes(user?.role || "");
  const canEdit = isAdmin;
  const canComplete = isAdmin;
  const [, setLocation] = useLocation();
  const createProjectForShow = useMutation({
    mutationFn: async (event: Event) => {
      const projRes = await apiRequest("POST", "/api/projects", {
        name: event.name,
        workspaceId: event.workspaceId,
        startDate: event.startDate,
        endDate: event.endDate,
      });
      const project = await projRes.json();
      await apiRequest("PATCH", `/api/events/${event.id}`, { projectId: project.id });
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  const hasNoAssignment = !isManager && (!user?.eventAssignments || user.eventAssignments.length === 0) && (!user?.projectAssignments || user.projectAssignments.length === 0);

  const [showLanding, setShowLanding] = useState(!isManager);

  useEffect(() => {
    if (!user?.id || whatChangedDismissed) return;
    (async () => {
      try {
        const lastSeenRes = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/activity/last-seen", { credentials: "include" });
        if (!lastSeenRes.ok) return;
        const { lastSeen } = await lastSeenRes.json();
        if (!lastSeen) {
          await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/activity/mark-seen", { method: "POST", credentials: "include" });
          return;
        }
        const countsRes = await fetch(`/api/activity?since=${encodeURIComponent(lastSeen)}&counts=true&limit=200`, { credentials: "include" });
        if (!countsRes.ok) return;
        const data = await countsRes.json();
        if (data.counts && data.counts.total > 0) {
          setWhatChangedBanner({ counts: data.counts });
        }
      } catch {}
    })();
  }, [user?.id]);

  const dismissWhatChanged = useCallback(async () => {
    setWhatChangedDismissed(true);
    setWhatChangedBanner(null);
    try {
      await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/activity/mark-seen", { method: "POST", credentials: "include" });
    } catch {}
  }, []);

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [editingShow, setEditingShow] = useState<Event | null>(null);

  const [gearRequestOpen, setGearRequestOpen] = useState(false);

  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [crewMsgOpen, setCrewMsgOpen] = useState(false);
  const [crewMsgCopied, setCrewMsgCopied] = useState(false);
  const [quickAddType, setQuickAddType] = useState<"show" | "project" | "contact" | null>(null);

  const [quickShowName, setQuickShowName] = useState("");
  const [quickShowStartDate, setQuickShowStartDate] = useState("");
  const [quickShowEndDate, setQuickShowEndDate] = useState("");
  const quickCreateShow = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const [quickProjectName, setQuickProjectName] = useState("");
  const [quickProjectDesc, setQuickProjectDesc] = useState("");
  const { mutate: quickCreateProjectMut, isPending: quickProjectSaving } = useCreateProject();

  const [quickContactFirst, setQuickContactFirst] = useState("");
  const [quickContactLast, setQuickContactLast] = useState("");
  const [quickContactRole, setQuickContactRole] = useState("");
  const [quickContactEmail, setQuickContactEmail] = useState("");
  const [quickContactPhone, setQuickContactPhone] = useState("");
  const { mutate: quickCreateContactMut, isPending: quickContactSaving } = useCreateContact();

  function handleQuickAdd(type: "show" | "project" | "contact" | "gear") {
    if (type === "gear") {
      setGearRequestOpen(true);
      return;
    }
    if (type === "show") {
      setQuickShowName("");
      setQuickShowStartDate(selectedDate);
      setQuickShowEndDate(selectedDate);
      setQuickAddType("show");
    } else if (type === "project") {
      setQuickProjectName("");
      setQuickProjectDesc("");
      setQuickAddType("project");
    } else if (type === "contact") {
      setQuickContactFirst("");
      setQuickContactLast("");
      setQuickContactRole("");
      setQuickContactEmail("");
      setQuickContactPhone("");
      setQuickAddType("contact");
    }
  }

  const sortedSchedule = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const diff = getLocalTimeMinutes(a.startTime) - getLocalTimeMinutes(b.startTime);
      if (diff !== 0) return diff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [schedules]);

  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const hasSelection = selectedEvents.length > 0;
    const selectedSet = new Set(selectedEvents);
    const activeEventsList = (eventsList as Event[]).filter((e: Event) => !e.archived);

    const filteredEvents = hasSelection
      ? activeEventsList.filter((e: Event) => selectedSet.has(e.name))
      : activeEventsList;

    if (!hasSelection) {
      dateSet.add(todayStr);
    }

    const filteredSchedules = hasSelection
      ? schedules.filter((s) => s.eventName && selectedSet.has(s.eventName))
      : schedules;

    filteredSchedules.forEach((item) => {
      const d = item.eventDate || format(new Date(item.startTime), "yyyy-MM-dd");
      if (dateRegex.test(d)) {
        dateSet.add(d);
      }
    });
    filteredEvents.forEach((event) => {
      if (event.startDate && event.endDate && dateRegex.test(event.startDate) && dateRegex.test(event.endDate)) {
        const start = new Date(event.startDate + "T12:00:00");
        const end = new Date(event.endDate + "T12:00:00");
        const current = new Date(start);
        const maxDays = 90;
        let count = 0;
        while (current <= end && count < maxDays) {
          dateSet.add(format(current, "yyyy-MM-dd"));
          current.setDate(current.getDate() + 1);
          count++;
        }
      } else if (event.startDate && dateRegex.test(event.startDate)) {
        dateSet.add(event.startDate);
      } else if (event.endDate && dateRegex.test(event.endDate)) {
        dateSet.add(event.endDate);
      }
    });
    return Array.from(dateSet).sort();
  }, [schedules, eventsList, selectedEvents]);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const fallback = availableDates.includes(todayStr) ? todayStr : availableDates[0];
      setSelectedDate(fallback);
    }
  }, [availableDates, selectedDate]);

  const availableEvents = useMemo(() => {
    const activeEvents = (eventsList as Event[]).filter((e: Event) => !e.archived);
    if (!isManager) {
      const assigned = user?.eventAssignments as string[] | undefined;
      const assignedSet = new Set(assigned || []);
      const projAssignments = user?.projectAssignments || [];
      if (projAssignments.length > 0) {
        const projIds = new Set(projAssignments.map(pa => pa.projectId));
        for (const ev of activeEvents) {
          if (ev.projectId && projIds.has(ev.projectId)) {
            assignedSet.add(ev.name);
          }
        }
      }
      if (assignedSet.size === 0) return [];
      return activeEvents
        .filter((e: Event) => assignedSet.has(e.name))
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
        .map((e: Event) => e.name);
    }
    return activeEvents
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
      .map((e: Event) => e.name);
  }, [eventsList, isManager, user]);

  const expandedAssignedEvents = useMemo(() => {
    if (isManager) return null;
    const assigned = user?.eventAssignments as string[] | undefined;
    const assignedSet = new Set(assigned || []);
    const projAssignments = user?.projectAssignments || [];
    if (projAssignments.length > 0) {
      const projIds = new Set(projAssignments.map(pa => pa.projectId));
      for (const ev of eventsList) {
        if (ev.projectId && projIds.has(ev.projectId)) {
          assignedSet.add(ev.name);
        }
      }
    }
    return assignedSet;
  }, [eventsList, isManager, user]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const closestFutureEvent = useMemo(() => {
    const now = new Date();
    const availableSet = new Set(availableEvents);

    // Events active today (startDate <= today <= endDate)
    const todayEvents = eventsList.filter((e: Event) => {
      if (!availableSet.has(e.name) || !e.startDate) return false;
      const end = e.endDate || e.startDate;
      return e.startDate <= todayStr && end >= todayStr;
    });

    if (todayEvents.length > 0) {
      // Score each event by how close its schedule items are to the current time
      const scored = todayEvents.map((e: Event) => {
        const eventSchedules = (schedules as Schedule[]).filter(
          s => s.eventName === e.name && s.eventDate === todayStr
        );
        if (eventSchedules.length === 0) return { event: e, score: Infinity };
        const nowMs = now.getTime();
        const minDist = Math.min(
          ...eventSchedules.map(s => {
            const start = new Date(s.startTime).getTime();
            const end = s.endTime ? new Date(s.endTime).getTime() : start;
            if (nowMs >= start && nowMs <= end) return 0; // in progress
            if (nowMs < start) return start - nowMs;       // upcoming
            return nowMs - end;                             // past
          })
        );
        return { event: e, score: minDist };
      });
      scored.sort((a, b) => a.score - b.score);
      return scored[0].event;
    }

    // No events today — find the next upcoming event by start date
    const futureEvents = eventsList
      .filter((e: Event) => {
        if (!availableSet.has(e.name)) return false;
        return e.startDate && e.startDate > todayStr;
      })
      .sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999"));
    return futureEvents.length > 0 ? futureEvents[0] : null;
  }, [eventsList, availableEvents, todayStr, schedules]);

  const defaultSelectedEvents = useMemo(() => {
    if (isManager) {
      return closestFutureEvent ? [closestFutureEvent.name] : [];
    }
    return [...availableEvents];
  }, [isManager, closestFutureEvent, availableEvents]);

  const defaultsApplied = useRef(false);
  useEffect(() => {
    if (defaultsApplied.current) return;
    if (availableEvents.length === 0) return;
    // If the URL already specifies a show (e.g. from calendar click), let the
    // URL-param effect handle selection — don't override it with auto-defaults.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("show") || urlParams.get("event")) {
      defaultsApplied.current = true;
      return;
    }
    if (isManager) {
      // Always jump to the closest show in time on every dashboard visit
      if (closestFutureEvent) {
        eventSelection.setSelectedEvents([closestFutureEvent.name]);
        // Also jump the date to the show's start date if it's not today
        if (closestFutureEvent.startDate && closestFutureEvent.startDate !== todayStr) {
          setSelectedDate(closestFutureEvent.startDate);
        }
      }
    } else {
      const hasValidSelection = selectedEvents.length > 0 && selectedEvents.some(n => availableEvents.includes(n));
      if (!hasValidSelection) {
        eventSelection.setSelectedEvents([...defaultSelectedEvents]);
      }
    }
    defaultsApplied.current = true;
  }, [availableEvents, closestFutureEvent]);

  const roleDefaultsApplied = useRef(false);
  useEffect(() => {
    if (roleDefaultsApplied.current) return;
    if (!user || availableEvents.length === 0) return;
    const role = user.role as string;
    if (role !== "commenter" && role !== "client") return;
    const today = format(new Date(), "yyyy-MM-dd");
    const nearestEvent = eventsList
      .filter((e: Event) => availableEvents.includes(e.name))
      .filter((e: Event) => {
        const end = e.endDate || e.startDate;
        return !end || end >= today;
      })
      .sort((a: Event, b: Event) => (a.startDate || "9999").localeCompare(b.startDate || "9999"))[0];
    if (nearestEvent) {
      eventSelection.singleSelect(nearestEvent.name);
      setActiveTab(role === "client" ? "files" : "schedule");
    }
    roleDefaultsApplied.current = true;
  }, [user, availableEvents, eventsList]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    // Auto-select shows active on the clicked date
    const availableSet = new Set(availableEvents);
    const showsOnDate = (eventsList as Event[]).filter((e: Event) => {
      if (!availableSet.has(e.name) || !e.startDate) return false;
      const end = e.endDate || e.startDate;
      return e.startDate <= date && end >= date;
    }).map((e: Event) => e.name);
    if (showsOnDate.length > 0) {
      eventSelection.setSelectedEvents(showsOnDate);
    }
  }, [availableEvents, eventsList, eventSelection]);

  const effectiveSelectedEvents: string[] = useMemo(() => {
    if (!isManager && availableEvents.length === 0) return [];
    const availableSet = new Set(availableEvents);
    const validSelected = selectedEvents.filter(n => availableSet.has(n));
    if (validSelected.length > 0 && validSelected.length < availableEvents.length) return validSelected;
    return availableEvents;
  }, [availableEvents, isManager, selectedEvents]);
  const effectiveSelectedEventsSet = useMemo(() => new Set(effectiveSelectedEvents), [effectiveSelectedEvents]);
  const multiShowSelected = effectiveSelectedEvents.length > 1;

  const { buildColorMap } = useColorScheme();
  const showColorMap = useMemo(() => {
    return buildColorMap(eventsList.map((e: Event) => e.name));
  }, [eventsList, buildColorMap]);

  const filteredSchedule = useMemo(() => sortedSchedule.filter((item) => {
    if (!isManager) {
      if (!expandedAssignedEvents || expandedAssignedEvents.size === 0) return false;
      if (item.eventName && !expandedAssignedEvents.has(item.eventName)) return false;
    }
    const d = item.eventDate || format(new Date(item.startTime), "yyyy-MM-dd");
    if (d !== selectedDate) return false;
    if (effectiveSelectedEvents.length > 0) {
      return item.eventName ? effectiveSelectedEventsSet.has(item.eventName) : false;
    }
    return true;
  }), [sortedSchedule, selectedDate, effectiveSelectedEventsSet, isManager, expandedAssignedEvents]);

  const searchFilteredNestedFlat = useMemo(() => {
    const tree = buildNestedSchedule(filteredSchedule);
    return flattenNested(tree);
  }, [filteredSchedule]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; sortOrder: number }[]) => {
      await apiRequest("PATCH", "/api/schedules/reorder", { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
    },
  });

  const duplicateScheduleMutation = useMutation({
    mutationFn: async (item: any) => {
      const { id, createdAt, updatedAt, ...rest } = item;
      await apiRequest("POST", "/api/schedules", { ...rest, title: `${rest.title} (copy)` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
    },
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = filteredSchedule;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    const updates = reordered.map((item, idx) => ({ id: item.id, sortOrder: idx }));
    reorderMutation.mutate(updates);
  }, [filteredSchedule, reorderMutation]);

  const dailySheetSchedule = useMemo(() => {
    return sortedSchedule.filter((item) => {
      if (!isManager) {
        if (!expandedAssignedEvents || expandedAssignedEvents.size === 0) return false;
        if (item.eventName && !expandedAssignedEvents.has(item.eventName)) return false;
      }
      const d = item.eventDate || format(new Date(item.startTime), "yyyy-MM-dd");
      return d === selectedDate;
    }).sort((a, b) => {
      const diff = getLocalTimeMinutes(a.startTime) - getLocalTimeMinutes(b.startTime);
      if (diff !== 0) return diff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [sortedSchedule, selectedDate, isManager, expandedAssignedEvents]);

  const allShowsForSelectedDate = useMemo(() => {
    if (!isManager) {
      if (!expandedAssignedEvents || expandedAssignedEvents.size === 0) return [];
    }
    return (eventsList as Event[]).filter((ev: Event) => {
      if (ev.archived) return false;
      if (!isManager && expandedAssignedEvents && !expandedAssignedEvents.has(ev.name)) return false;
      if (!ev.startDate) return false;
      const start = ev.startDate;
      const end = ev.endDate || ev.startDate;
      return selectedDate >= start && selectedDate <= end;
    });
  }, [eventsList, selectedDate, isManager, expandedAssignedEvents]);

  const showsForSelectedDate = useMemo(() => {
    if (effectiveSelectedEvents.length === 0) return allShowsForSelectedDate;
    return allShowsForSelectedDate.filter((ev: Event) => effectiveSelectedEventsSet.has(ev.name));
  }, [allShowsForSelectedDate, effectiveSelectedEvents, effectiveSelectedEventsSet]);

  const dailySheetContacts = useMemo(() => {
    const dateShowNames = new Set(showsForSelectedDate.map(s => s.name));
    const relevantUserIds = new Set(
      allEventAssignments
        .filter((a: any) => dateShowNames.has(a.eventName))
        .map((a: any) => a.userId)
    );
    if (!isManager) {
      const assigned = user?.eventAssignments as string[] | undefined;
      if (!assigned || assigned.length === 0) return [];
      const assignedNames = new Set(assigned);
      const assignedUserIds = new Set(
        allEventAssignments
          .filter((a: any) => assignedNames.has(a.eventName) && dateShowNames.has(a.eventName))
          .map((a: any) => a.userId)
      );
      return contacts.filter(c => c.userId && assignedUserIds.has(c.userId));
    }
    return contacts.filter(c => c.userId && relevantUserIds.has(c.userId));
  }, [contacts, isManager, user, showsForSelectedDate, allEventAssignments]);

  if (!user?.workspaceId && userWorkspaces.length === 0) {
    return (
      <div className="min-h-screen bg-background font-body flex flex-col">
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-base sm:text-xl font-display uppercase tracking-wide text-foreground">Daily Sheet</h1>
            </div>
            <HeaderUserMenu contacts={[]} canEdit={false} allEventAssignments={[]} />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4" data-testid="empty-state-no-org">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display uppercase tracking-wide text-foreground">Waiting for an Invite</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You're not part of any organization yet. Ask an admin to invite you to their organization, then refresh this page.
            </p>
            <Button variant="outline" onClick={() => { resetBootstrap(); queryClient.invalidateQueries(); }} data-testid="button-refresh-waiting">
              <RotateCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasNoAssignment) {
    return (
      <div className="min-h-screen bg-background font-body flex flex-col">
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-base sm:text-xl font-display uppercase tracking-wide text-foreground">Daily Sheet</h1>
              {currentWorkspace && <p className="text-xs text-muted-foreground">{currentWorkspace.name}</p>}
            </div>
            <HeaderUserMenu contacts={[]} canEdit={false} allEventAssignments={[]} />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4" data-testid="empty-state-no-assignments">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display uppercase tracking-wide text-foreground">No Shows Assigned</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You haven't been assigned to any shows yet. Contact your production manager to get added to a show.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showLanding && !isManager && eventsList.length > 0) {
    const directAssigned = new Set(user?.eventAssignments || []);
    const projAssignments = user?.projectAssignments || [];
    const projAssignedNames = new Set<string>();
    if (projAssignments.length > 0) {
      const projIds = new Set(projAssignments.map(pa => pa.projectId));
      for (const ev of eventsList) {
        if (ev.projectId && projIds.has(ev.projectId)) {
          if (!directAssigned.has(ev.name)) {
            projAssignedNames.add(ev.name);
          }
          directAssigned.add(ev.name);
        }
      }
    }
    const assignedEvents = eventsList.filter((e: Event) => directAssigned.has(e.name));
    if (assignedEvents.length > 0) {
      return (
        <div className="min-h-screen bg-background font-body flex flex-col">
          <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-base sm:text-xl font-display uppercase tracking-wide text-foreground">Daily Sheet</h1>
                {currentWorkspace && <p className="text-xs text-muted-foreground">{currentWorkspace.name}</p>}
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button onClick={toggleTheme} className="h-9 w-9 rounded-lg flex items-center justify-center hover-elevate" data-testid="button-toggle-theme-landing">
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button onClick={() => logout()} className="h-9 w-9 rounded-lg flex items-center justify-center hover-elevate" data-testid="button-logout-landing">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>
          <div className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full">
            <h2 className="text-lg font-display uppercase tracking-wide text-foreground mb-4" data-testid="text-your-shows">Your Shows</h2>
            <div className="space-y-3">
              {assignedEvents.map((event: Event) => {
                const eventVenue = event.venueId ? venuesList.find(v => v.id === event.venueId) : null;
                const eventProject = event.projectId ? allProjects.find((p: Project) => p.id === event.projectId) : null;
                const isFestival = eventProject?.isFestival;
                const dateRange = event.startDate && event.endDate
                  ? `${format(new Date(event.startDate + "T00:00:00"), "MMM d")} – ${format(new Date(event.endDate + "T00:00:00"), "MMM d, yyyy")}`
                  : event.startDate
                    ? format(new Date(event.startDate + "T00:00:00"), "MMM d, yyyy")
                    : null;
                return (
                  <button
                    key={event.id}
                    className="w-full text-left bg-card border border-border rounded-xl p-4 hover-elevate active-elevate-2 transition-all"
                    onClick={() => {
                      eventSelection.singleSelect(event.name);
                      setShowLanding(false);
                    }}
                    data-testid={`button-show-landing-${event.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-semibold uppercase tracking-wide text-foreground truncate">
                            {event.name}
                          </h3>
                          {projAssignedNames.has(event.name) && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap flex-shrink-0">All Stages</span>
                          )}
                        </div>
                        {isFestival && eventProject && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="secondary" className="text-[10px]">Stage</Badge>
                            <span className="text-xs text-muted-foreground">{eventProject.name}</span>
                          </div>
                        )}
                        {dateRange && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{dateRange}</span>
                          </div>
                        )}
                        {eventVenue && (
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{eventVenue.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {assignedEvents.length > 1 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowLanding(false)}
                data-testid="button-view-all-shows"
              >
                View All Shows
              </Button>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <PullToRefresh>
    <div className="min-h-screen bg-background pb-24 sm:pb-0 font-body print:pb-0 print:min-h-0 overflow-x-clip">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm print:static print:border-none print:hidden">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link href={`/calendar?date=${selectedDate}`}>
                <button
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shadow-lg transition-transform cursor-pointer hover-elevate active-elevate-2 bg-primary shadow-primary/25 flex-shrink-0"
                  data-testid="button-header-calendar"
                >
                  <CalendarIcon className="h-5 w-5 text-primary-foreground" />
                </button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-display uppercase tracking-wide text-foreground truncate">Daily Sheet</h1>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 print:hidden flex-shrink-0">
              {(isManager || isAdmin) && (
                <>
                  <div className="hidden sm:flex sm:items-center sm:gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSendDialog(true)} data-testid="button-send-daily">
                      <Send className="mr-2 h-4 w-4" /> Send Daily
                    </Button>
                    <Link href="/admin">
                      <Button data-testid="link-admin-panel">
                        <Settings className="mr-2 h-4 w-4" /> Admin
                      </Button>
                    </Link>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="sm:hidden bg-card/50 backdrop-blur-sm border-border/30" onClick={() => setShowSendDialog(true)} data-testid="button-send-daily-mobile">
                        <Send className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send Daily</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/admin">
                        <Button variant="outline" size="icon" className="sm:hidden bg-card/50 backdrop-blur-sm border-border/30" data-testid="button-admin-mobile">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Admin</TooltipContent>
                  </Tooltip>
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-card/50 backdrop-blur-sm border-border/30" onClick={() => setCommandPaletteOpen(true)} data-testid="button-command-palette">
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search (⌘K)</TooltipContent>
              </Tooltip>
              <NotificationBell />
              <HeaderUserMenu contacts={contacts} canEdit={canEdit} allEventAssignments={allEventAssignments} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 print:px-0 print:py-1">
        <AnimatePresence>
          {whatChangedBanner && !whatChangedDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 print:hidden"
            >
              <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3" data-testid="banner-what-changed">
                <button
                  className="flex items-center gap-2 text-sm text-left cursor-pointer hover:underline"
                  onClick={() => { setActiveTab("activity"); dismissWhatChanged(); }}
                  data-testid="button-what-changed-details"
                >
                  <Bell className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>
                    <strong>{whatChangedBanner.counts.total} update{whatChangedBanner.counts.total !== 1 ? "s" : ""}</strong> since you were last here
                    {(() => {
                      const parts: string[] = [];
                      if (whatChangedBanner.counts.scheduleChanges > 0) parts.push(`${whatChangedBanner.counts.scheduleChanges} schedule change${whatChangedBanner.counts.scheduleChanges !== 1 ? "s" : ""}`);
                      if (whatChangedBanner.counts.assignmentChanges > 0) parts.push(`${whatChangedBanner.counts.assignmentChanges} assignment${whatChangedBanner.counts.assignmentChanges !== 1 ? "s" : ""}`);
                      if (whatChangedBanner.counts.comments > 0) parts.push(`${whatChangedBanner.counts.comments} comment${whatChangedBanner.counts.comments !== 1 ? "s" : ""}`);
                      if (whatChangedBanner.counts.fileChanges > 0) parts.push(`${whatChangedBanner.counts.fileChanges} file change${whatChangedBanner.counts.fileChanges !== 1 ? "s" : ""}`);
                      return parts.length > 0 ? ` — ${parts.join(", ")}` : "";
                    })()}
                  </span>
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={dismissWhatChanged} data-testid="button-dismiss-what-changed">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pendingInviteNotif && !inviteBannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 print:hidden"
            >
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{pendingInviteNotif.message}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {pendingInviteNotif.workspaceId && pendingInviteNotif.workspaceId !== user?.workspaceId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-blue-500/40 hover:bg-blue-500/10"
                      disabled={switchToInviteWorkspaceMutation.isPending}
                      onClick={() => {
                        markInviteReadMutation.mutate(pendingInviteNotif.id);
                        switchToInviteWorkspaceMutation.mutate(pendingInviteNotif.workspaceId!);
                      }}
                    >
                      Switch →
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      markInviteReadMutation.mutate(pendingInviteNotif.id);
                      setInviteBannerDismissed(true);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="space-y-4">
          {/* Customize layout dialog */}
          <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Customize Dashboard</DialogTitle>
                <DialogDescription>Drag to reorder tabs, hide ones you don't need, and star your default.</DialogDescription>
              </DialogHeader>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    setDraftOrder(prev => {
                      const oldIdx = prev.indexOf(active.id as TabId);
                      const newIdx = prev.indexOf(over.id as TabId);
                      return arrayMove(prev, oldIdx, newIdx);
                    });
                  }
                }}
              >
                <SortableContext items={draftOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1 py-1">
                    {draftOrder.map(tabId => {
                      const meta = ALL_TABS.find(t => t.id === tabId)!;
                      const isHidden = draftHidden.has(tabId);
                      const isDefault = draftDefault === tabId;
                      return (
                        <SortableTabRow
                          key={tabId}
                          id={tabId}
                          label={meta.label}
                          isHidden={isHidden}
                          isDefault={isDefault}
                          onToggleHidden={() => setDraftHidden(prev => {
                            const next = new Set(prev);
                            if (next.has(tabId)) next.delete(tabId); else next.add(tabId);
                            return next;
                          })}
                          onSetDefault={() => setDraftDefault(tabId)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomizeOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => savePreferencesMutation.mutate({
                    tabOrder: draftOrder,
                    hiddenTabs: Array.from(draftHidden),
                    defaultTab: draftDefault,
                  })}
                  disabled={savePreferencesMutation.isPending}
                >
                  {savePreferencesMutation.isPending ? "Saving…" : "Save Layout"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-2 print:hidden sticky top-[52px] sm:top-16 z-40 bg-background -mx-4 px-4 pb-3 pt-2 border-b border-border/40 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 overflow-x-auto scrollbar-hide min-w-0 text-center">
              <TabsList className="bg-card p-1 rounded-xl inline-flex w-max">
                {visibleTabs.map(tabId => {
                  const meta = ALL_TABS.find(t => t.id === tabId)!;
                  return (
                    <TabsTrigger
                      key={tabId}
                      value={tabId}
                      className="rounded-lg px-2.5 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all whitespace-nowrap"
                      data-testid={tabId === "timesheet" ? "tab-timesheet" : tabId === "activity" ? "tab-activity" : undefined}
                    >
                      {meta.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setDraftOrder(TAB_ORDER);
                  setDraftHidden(hiddenTabs);
                  setDraftDefault(defaultTab);
                  setCustomizeOpen(true);
                }}
                title="Customize tabs"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <ShowSwitcher
                eventsList={eventsList as Event[]}
                availableEvents={availableEvents}
                effectiveSelectedEvents={effectiveSelectedEvents}
                effectiveSelectedEventsSet={effectiveSelectedEventsSet}
                projects={allProjects}
                selectedDate={selectedDate}
                onToggleEvent={eventSelection.toggleEvent}
                onSingleSelect={(name) => {
                  eventSelection.singleSelect(name);
                  const ev = (eventsList as Event[]).find((e: Event) => e.name === name);
                  if (ev?.startDate) {
                    const start = ev.startDate;
                    const end = ev.endDate || ev.startDate;
                    // If today falls within the show's run, stay on today; otherwise jump to start
                    setSelectedDate(todayStr >= start && todayStr <= end ? todayStr : start);
                  }
                }}
                onSelectAll={() => eventSelection.selectAll(availableEvents)}
                onSelectAllCurrent={(names) => eventSelection.setSelectedEvents(names)}
                onClearAll={() => eventSelection.setSelectedEvents([])}
                userProjectAssignments={user?.projectAssignments}
                userEventAssignments={user?.eventAssignments as string[] | undefined}
              />
              <span className="hidden sm:inline text-xs text-muted-foreground truncate min-w-0" data-testid="text-show-summary">
                {effectiveSelectedEvents.length === 1
                  ? effectiveSelectedEvents[0]
                  : effectiveSelectedEvents.length > 1
                    ? `${effectiveSelectedEvents.length} of ${availableEvents.length} shows`
                    : null}
              </span>
            </div>
            {allShowsForSelectedDate.length > 1 && (
              <div className="-mx-4 px-4" data-testid="show-filter-pills">
                <div className="flex flex-wrap gap-1.5 pb-0.5">
                  {(() => {
                    const pillNames = allShowsForSelectedDate.map((ev: Event) => ev.name);
                    const allPillsShown = pillNames.every(n => effectiveSelectedEventsSet.has(n));
                    return (
                      <>
                        <button
                          onClick={() => eventSelection.selectAll(availableEvents)}
                          className={cn(
                            "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                            allPillsShown
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                          data-testid="pill-show-all"
                        >
                          All
                        </button>
                        {pillNames.map(name => {
                          const isActive = !allPillsShown && effectiveSelectedEventsSet.has(name);
                          const color = showColorMap.get(name);
                          return (
                            <button
                              key={name}
                              onClick={() => {
                                if (isActive) {
                                  eventSelection.selectAll(availableEvents);
                                } else {
                                  eventSelection.singleSelect(name);
                                }
                              }}
                              className={cn(
                                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                              data-testid={`pill-show-${name.replace(/\s+/g, '-')}`}
                            >
                              {color && (
                                <span
                                  className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", color.dot)}
                                />
                              )}
                              {name}
                            </button>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            <DayNavigator
              dates={availableDates}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              events={(eventsList as Event[]).filter((e: Event) => !e.archived)}
            />
          </div>

          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            data-testid="swipe-area"
          >
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <TabsContent value="overview" key="overview" forceMount className="space-y-4 outline-none">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {hasNoAssignment ? (
                    <NoAssignmentState message="You haven't been assigned to any shows yet. Once an admin assigns you to a show, your overview will appear here." />
                  ) : effectiveSelectedEvents.length === 0 && availableEvents.length > 0 ? (
                    <Card className="border border-border/30 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Mic2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">No shows selected</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Tap the show switcher above to pick which shows to view</p>
                      </CardContent>
                    </Card>
                  ) : (
                  <>
                  <OnTourWidget events={eventsList} projects={allProjects} venues={venuesList} allDayVenues={allDayVenues} selectedDate={selectedDate} />
                  {travelDayForSelectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      data-testid="overview-travel-day"
                    >
                      <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-xl rounded-xl overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Plane className="w-4 h-4 text-amber-500" />
                              </div>
                              <div>
                                <h3 className="text-sm font-display uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400" data-testid="text-travel-day-title">Travel Day</h3>
                                {(() => {
                                  const tourProject = allProjects.find((p: Project) => p.id === travelDayForSelectedDate.projectId);
                                  return tourProject ? <p className="text-xs text-muted-foreground">{tourProject.name}</p> : null;
                                })()}
                              </div>
                            </div>
                            {(() => {
                              const tourProject = allProjects.find((p: Project) => p.id === travelDayForSelectedDate.projectId);
                              return tourProject ? (
                                <Link href={`/project/${tourProject.id}`}>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700" data-testid="button-travel-day-itinerary">
                                    View Itinerary
                                  </Button>
                                </Link>
                              ) : null;
                            })()}
                          </div>
                          {travelDayForSelectedDate.departureAirport && travelDayForSelectedDate.arrivalAirport && (
                            <div className="flex items-center gap-2 text-sm">
                              <Navigation className="w-3.5 h-3.5 text-amber-500" />
                              <span className="font-medium">{travelDayForSelectedDate.departureAirport}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">{travelDayForSelectedDate.arrivalAirport}</span>
                            </div>
                          )}
                          {(travelDayForSelectedDate.flightNumber || travelDayForSelectedDate.airline) && (
                            <div className="flex items-center gap-2 text-sm bg-background/50 rounded-lg p-2">
                              <PlaneTakeoff className="w-3.5 h-3.5 text-muted-foreground" />
                              {travelDayForSelectedDate.airline && <span className="text-muted-foreground">{travelDayForSelectedDate.airline}</span>}
                              {travelDayForSelectedDate.flightNumber && <span className="font-semibold">{travelDayForSelectedDate.flightNumber}</span>}
                              {travelDayForSelectedDate.departureTime && (
                                <span className="text-xs text-muted-foreground ml-auto">{travelDayForSelectedDate.departureTime}</span>
                              )}
                            </div>
                          )}
                          {travelDayForSelectedDate.notes && (
                            <p className="text-xs text-muted-foreground italic">{travelDayForSelectedDate.notes}</p>
                          )}
                          <TravelDayCrewSummary travelDayId={travelDayForSelectedDate.id} userId={user?.id} contacts={contacts} hasTopLevelDetails={!!(travelDayForSelectedDate.departureAirport || travelDayForSelectedDate.flightNumber || travelDayForSelectedDate.notes)} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                  {showsForSelectedDate.length === 0 && !travelDayForSelectedDate && (
                    <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="overview-empty">
                      <Clock className="w-12 h-12 text-muted-foreground/40 mb-4" />
                      <h3 className="text-xl font-display uppercase tracking-wide text-muted-foreground mb-2">No Shows for Today</h3>
                      <p className="text-sm text-muted-foreground/70">There are no shows scheduled for {isToday(parseISO(selectedDate)) ? "today" : format(parseISO(selectedDate), "EEEE, MMM d")}.</p>
                    </div>
                  )}
                  {showsForSelectedDate.length > 0 && (
                    <div className={cn(
                      "gap-4 mt-3",
                      showsForSelectedDate.length > 1 ? "grid grid-cols-1 md:grid-cols-2" : "space-y-4"
                    )}>
                      {(() => {
                        const sortedShows = [...showsForSelectedDate].sort((a, b) => {
                          const dateA = a.startDate || "";
                          const dateB = b.startDate || "";
                          return dateB.localeCompare(dateA);
                        });
                        return sortedShows.map(s => s.name);
                      })().map((evName, showIdx) => {
                        const showName = evName;
                        const showScheduleItems = filteredSchedule.filter(item => item.eventName === showName);
                        const showUserIds = new Set(allEventAssignments.filter((a: any) => a.eventName === showName).map((a: any) => a.userId));
                        const showContacts = [...dailySheetContacts.filter(c => c.userId && showUserIds.has(c.userId))].sort((a, b) => {
                          const nameA = [a.firstName, a.lastName].filter(Boolean).join(" ");
                          const nameB = [b.firstName, b.lastName].filter(Boolean).join(" ");
                          return nameA.localeCompare(nameB);
                        });
                        const labelColor = showColorMap.get(showName);
                        const showEvent = showsForSelectedDate.find(s => s.name === showName);
                        const dayVenueEntry = showEvent ? allDayVenues.find(dv => dv.eventId === showEvent.id && dv.date === selectedDate) : null;
                        const resolvedVenueId = dayVenueEntry ? dayVenueEntry.venueId : showEvent?.venueId;
                        const showVenue = resolvedVenueId ? venuesList.find(v => v.id === resolvedVenueId) || null : null;
                        const showProject = showEvent?.projectId ? allProjects.find(p => p.id === showEvent.projectId) : null;
                        return (
                          <motion.div
                            key={showName}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: showIdx * 0.05 }}
                          >
                          <Card className="border border-border/30 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl flex flex-col overflow-hidden" data-testid={`overview-card-${showName.replace(/\s+/g, '-')}`}>
                            {showVenue ? (
                              <div className="bg-secondary/70 backdrop-blur-sm text-secondary-foreground rounded-t-xl">
                                <div className="p-3 sm:p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="min-w-0">
                                        {showProject && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-accent truncate" data-testid={`text-venue-bar-project-${showEvent?.id}`}>{showProject.name}</span>
                                            {showProject.driveUrl && (
                                              <a href={showProject.driveUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 flex-shrink-0" data-testid={`link-drive-venue-bar-${showEvent?.id}`} title="Open Google Drive">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                              </a>
                                            )}
                                          </div>
                                        )}
                                        <div className="text-sm sm:text-base font-display uppercase tracking-wide truncate flex items-center gap-1.5" data-testid={`text-venue-bar-name-${showEvent?.id}`}>
                                          <span className="font-bold" data-testid={`text-venue-bar-show-${showEvent?.id}`}>{showName}</span>
                                          {canEdit && showEvent && (
                                            <Link href={`/project/${showEvent.projectId}`} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 print:hidden" data-testid={`link-edit-show-${showEvent.id}`}>
                                              <Pencil className="w-3 h-3" />
                                            </Link>
                                          )}
                                          <span className="mx-1.5 opacity-50">|</span>
                                          {showVenue.name}
                                        </div>
                                        {showVenue.address && (
                                          <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showVenue.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-secondary-foreground/70 underline underline-offset-2 hover:text-secondary-foreground transition-colors truncate block max-w-full"
                                            data-testid={`link-venue-bar-address-${showEvent?.id}`}
                                          >
                                            {showVenue.address}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 flex flex-col items-center">
                                      <div className="text-2xl font-display font-bold text-yellow-400 leading-none">
                                        {format(new Date(selectedDate + "T12:00:00"), "d")}
                                      </div>
                                      <div className="text-[10px] uppercase tracking-widest opacity-70">
                                        {format(new Date(selectedDate + "T12:00:00"), "MMM")}
                                      </div>
                                      {canEdit && showEvent && (
                                        <VenueQuickSelect
                                          show={showEvent}
                                          selectedDate={selectedDate}
                                          currentVenueId={resolvedVenueId ?? null}
                                          venuesList={venuesList}
                                          onEditShow={() => setEditingShow(showEvent)}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  {resolvedVenueId && (
                                    <div className="mt-2 pt-2 border-t border-secondary-foreground/10">
                                      <div className="flex items-center justify-between gap-2">
                                        {showVenue.parking && (
                                          <span className="text-[11px] text-secondary-foreground/70 flex-1" data-testid={`venue-bar-parking-${showEvent?.id}`}><span className="font-semibold">Parking:</span> {showVenue.parking}</span>
                                        )}
                                        <WeatherWidget venueId={resolvedVenueId} date={selectedDate} />
                                      </div>
                                    </div>
                                  )}
                                  {!resolvedVenueId && showVenue.parking && (
                                    <div className="mt-2 pt-2 border-t border-secondary-foreground/10 text-[11px] text-secondary-foreground/70">
                                      <span data-testid={`venue-bar-parking-${showEvent?.id}`}><span className="font-semibold">Parking:</span> {showVenue.parking}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : showEvent ? (
                              <div className="px-3 py-2">
                                <DailySheetNoVenue
                                  show={showEvent}
                                  canEdit={canEdit}
                                  venuesList={venuesList}
                                  selectedDate={selectedDate}
                                  projectName={showProject?.name}
                                  projectDriveUrl={showProject?.driveUrl}
                                  projectHref={canEdit ? `/project/${showEvent.projectId}` : undefined}
                                />
                              </div>
                            ) : (
                              <CardHeader className="px-3 py-2 pb-0 flex flex-col gap-0.5">
                                <div className="flex flex-row items-center gap-2 flex-wrap">
                                  <div className={cn("w-3 h-3 rounded-full flex-shrink-0", labelColor ? labelColor.dot : "bg-primary")} />
                                  <h3 className="text-sm font-display uppercase tracking-wide text-foreground" data-testid={`overview-show-label-${showName.replace(/\s+/g, '-')}`}>
                                    {showName}
                                  </h3>
                                </div>
                              </CardHeader>
                            )}
                            <CardContent className="p-3 flex-1">
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors text-left min-h-[120px]"
                                  onClick={() => setActiveTab("venue")}
                                  data-testid={`overview-venue-${showName.replace(/\s+/g, '-')}`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-display uppercase tracking-wide text-muted-foreground">Venue</span>
                                  </div>
                                  {showVenue ? (
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                      <span className="text-sm font-semibold leading-tight truncate">{showVenue.name}</span>
                                      {showVenue.address && (
                                        <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2">{showVenue.address}</span>
                                      )}
                                      {showVenue.parking && (
                                        <span className="text-[10px] text-muted-foreground/70 leading-tight line-clamp-2 mt-auto"><span className="font-semibold">P:</span> {showVenue.parking}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">No venue assigned</span>
                                  )}
                                </button>

                                <button
                                  className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors text-left min-h-[120px]"
                                  onClick={() => setActiveTab("schedule")}
                                  data-testid={`overview-schedule-${showName.replace(/\s+/g, '-')}`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-display uppercase tracking-wide text-muted-foreground">Schedule</span>
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto">{showScheduleItems.length}</Badge>
                                  </div>
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    {(() => {
                                      const withTime = showScheduleItems.filter(item => item.startTime);
                                      const withoutTime = showScheduleItems.filter(item => !item.startTime);
                                      const sorted = [...withTime].sort((a, b) => getLocalTimeMinutes(a.startTime!) - getLocalTimeMinutes(b.startTime!));
                                      const allItems = [...sorted, ...withoutTime];
                                      return (
                                        <>
                                          {allItems.map(item => {
                                            const zone = item.zoneId ? (allZones as any[]).find(z => z.id === item.zoneId) : null;
                                            const section = item.sectionId ? (allSections as any[]).find(s => s.id === item.sectionId) : null;
                                            return (
                                              <div key={item.id} className="flex items-center gap-1 text-[11px] leading-tight min-w-0">
                                                {item.startTime && <span className="font-medium text-foreground/80 flex-shrink-0">{formatTime(item.startTime)}</span>}
                                                <span className="text-muted-foreground truncate">{item.category || item.title}</span>
                                                {section && <span className="text-[9px] text-primary/70 flex-shrink-0">· {section.name}</span>}
                                                {zone && <span className="text-[9px] text-primary/70 flex-shrink-0">· {zone.name}</span>}
                                              </div>
                                            );
                                          })}
                                          {allItems.length === 0 && (
                                            <span className="text-xs text-muted-foreground italic">No items</span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </button>

                                <button
                                  className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors text-left min-h-[120px]"
                                  onClick={() => setActiveTab("assigned-crew")}
                                  data-testid={`overview-crew-${showName.replace(/\s+/g, '-')}`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-display uppercase tracking-wide text-muted-foreground">Crew</span>
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto">{showContacts.length}</Badge>
                                    {(() => {
                                      const phones = showContacts.filter(c => c.phone).map(c => c.phone!.replace(/[^\d+]/g, "")).filter(p => p.length >= 7);
                                      const unique = Array.from(new Set(phones));
                                      if (unique.length >= 2) {
                                        return (
                                          <a
                                            href={`sms:/open?addresses=${unique.join(",")}`}
                                            className="text-primary flex-shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                            data-testid={`overview-group-text-${showName.replace(/\s+/g, '-')}`}
                                            title="Group Text"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </a>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    {(() => {
                                      if (showContacts.length === 0) {
                                        return <span className="text-xs text-muted-foreground italic">No crew</span>;
                                      }
                                      const deptGroups = new Map<string, typeof showContacts>();
                                      for (const c of showContacts) {
                                        const dept = c.role ? c.role.split(",")[0].trim() : "General";
                                        const label = dept || "General";
                                        if (!deptGroups.has(label)) deptGroups.set(label, []);
                                        deptGroups.get(label)!.push(c);
                                      }
                                      let rendered = 0;
                                      const maxPreview = 4;
                                      const elements: JSX.Element[] = [];
                                      for (const [dept, members] of Array.from(deptGroups)) {
                                        if (rendered >= maxPreview) break;
                                        elements.push(
                                          <span key={`dept-${dept}`} className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-display mt-0.5 first:mt-0">{dept}</span>
                                        );
                                        for (const c of members) {
                                          if (rendered >= maxPreview) break;
                                          const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ");
                                          elements.push(
                                            <div key={c.id} className="flex items-center justify-between gap-1 min-w-0">
                                              <span className="text-[11px] font-medium truncate">{fullName}</span>
                                              {c.phone && (
                                                <a
                                                  href={`tel:${c.phone}`}
                                                  className="text-[10px] text-primary flex-shrink-0 flex items-center gap-0.5"
                                                  onClick={(e) => e.stopPropagation()}
                                                  data-testid={`overview-crew-phone-${c.id}`}
                                                >
                                                  <Phone className="w-2.5 h-2.5" />
                                                </a>
                                              )}
                                            </div>
                                          );
                                          rendered++;
                                        }
                                      }
                                      if (showContacts.length > maxPreview) {
                                        elements.push(
                                          <span key="more" className="text-[10px] text-muted-foreground/60 mt-auto">+{showContacts.length - maxPreview} more</span>
                                        );
                                      }
                                      return elements;
                                    })()}
                                  </div>
                                </button>

                                <OverviewActivitySquare
                                  showName={showName}
                                  onTap={() => setActiveTab("activity")}
                                />
                              </div>
                            </CardContent>
                          </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  </>
                  )}
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "schedule" && (
              <TabsContent value="schedule" key="schedule" forceMount className="space-y-4 outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {hasNoAssignment ? (
                    <NoAssignmentState message="You haven't been assigned to any shows yet. Once an admin assigns you, your schedule will appear here." />
                  ) : effectiveSelectedEvents.length === 0 && availableEvents.length > 0 ? (
                    <Card className="border border-border/30 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Mic2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">No shows selected</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Tap the show switcher above to pick which shows to view</p>
                      </CardContent>
                    </Card>
                  ) : (
                  <>
                  <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-display uppercase tracking-wide">Schedule</h2>
                      {(() => {
                        const allCrewSet = new Set<number>();
                        filteredSchedule.forEach(item => {
                          if (item.eventName) {
                            const crewUserIds = new Set(allEventAssignments.filter((a: any) => a.eventName === item.eventName).map((a: any) => a.userId));
                            dailySheetContacts.forEach(c => {
                              if (c.userId && crewUserIds.has(c.userId)) {
                                allCrewSet.add(c.id);
                              }
                            });
                          }
                        });
                        const totalCrewCount = allCrewSet.size;
                        return totalCrewCount > 0 ? (
                          <Badge variant="outline" className="text-[10px]" data-testid="badge-total-crew"><Users className="w-3 h-3 mr-0.5" />{totalCrewCount} Crew</Badge>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {canEdit && effectiveSelectedEvents.length > 0 && (
                        <>
                          <ScheduleTemplateDialog
                            defaultEventName={effectiveSelectedEvents.length === 1 ? effectiveSelectedEvents[0] : undefined}
                            defaultDate={selectedDate}
                            availableEvents={effectiveSelectedEvents}
                          />
                          <CreateScheduleDialog
                            defaultEventName={effectiveSelectedEvents.length === 1 ? effectiveSelectedEvents[0] : undefined}
                            defaultDate={selectedDate}
                            trigger={
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" data-testid="button-add-schedule-item">
                                <Plus className="h-3 w-3" /> Add Item
                              </Button>
                            }
                          />
                        </>
                      )}
                      <div className="flex items-center border border-border/30 rounded-lg bg-card/50 backdrop-blur-sm" data-testid="schedule-view-toggle">
                        <button
                          onClick={() => setScheduleViewMode("list")}
                          className={cn(
                            "px-2 py-1 flex items-center gap-1 text-xs transition-colors rounded-md",
                            scheduleViewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
                          )}
                          data-testid="button-view-list"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setScheduleViewMode("timeline")}
                          className={cn(
                            "px-2 py-1 flex items-center gap-1 text-xs transition-colors rounded-md",
                            scheduleViewMode === "timeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
                          )}
                          data-testid="button-view-timeline"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {scheduleViewMode === "timeline" ? (
                    <GanttScheduleView
                      schedules={filteredSchedule}
                      showColorMap={showColorMap}
                      selectedEvents={effectiveSelectedEvents}
                      canEdit={canEdit}
                      canComplete={canComplete}
                      onDelete={(id) => deleteScheduleMutation.mutate(id)}
                      renderEditDialog={(item, onClose) => <EditScheduleDialog item={item} onClose={onClose} />}
                      onDuplicate={(item) => duplicateScheduleMutation.mutate(item)}
                    />
                  ) : multiShowSelected ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {effectiveSelectedEvents
                        .filter((showName) => filteredSchedule.some(item => item.eventName === showName))
                        .map((showName) => {
                        const showItems = filteredSchedule.filter(item => item.eventName === showName);
                        const showNested = flattenNested(buildNestedSchedule(showItems));
                        const labelColor = showColorMap.get(showName);
                        const showCrewUserIds = new Set(allEventAssignments.filter((a: any) => a.eventName === showName).map((a: any) => a.userId));
                        const showCrewContacts = [...dailySheetContacts.filter(c => c.userId && showCrewUserIds.has(c.userId))].sort((a, b) => {
                          const nameA = [a.firstName, a.lastName].filter(Boolean).join(" ");
                          const nameB = [b.firstName, b.lastName].filter(Boolean).join(" ");
                          return nameA.localeCompare(nameB);
                        });
                        return (
                          <div key={showName} className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm flex flex-col">
                            <div className="px-3 py-2 pb-0 flex flex-row items-center gap-2 flex-wrap">
                              <div className={cn("w-3 h-3 rounded-full flex-shrink-0", labelColor ? labelColor.dot : "bg-primary")} />
                              <h3 className="text-sm font-display uppercase tracking-wide text-foreground" data-testid={`schedule-show-label-${showName.replace(/\s+/g, '-')}`}>{showName}</h3>
                              <Badge variant="secondary" className="text-[10px]">{showItems.length} item{showItems.length !== 1 ? "s" : ""}</Badge>
                              <Badge variant="outline" className="text-[10px]" data-testid={`badge-crew-count-${showName.replace(/\s+/g, '-')}`}><Users className="w-3 h-3 mr-0.5" />{showCrewContacts.length}</Badge>
                            </div>
                            <div className="p-2 flex-1 flex flex-col">
                              <div className="space-y-1.5">
                                {showNested.map(({ item, depth }, index) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.25, ease: "easeOut" }}
                                  >
                                  <ScheduleItem
                                    item={item}
                                    canEdit={canEdit}
                                    canComplete={canComplete}
                                    onDelete={(id) => deleteScheduleMutation.mutate(id)}
                                    onDuplicate={(item) => duplicateScheduleMutation.mutate(item)}
                                    showColor={labelColor || null}
                                    multiShow={false}
                                    depth={depth}
                                    zones={allZones}
                                    sections={allSections}
                                    contacts={contacts}
                                    activityMap={activityMap}
                                    allEventAssignments={allEventAssignments}
                                  />
                                  </motion.div>
                                ))}
                              </div>
                                {showItems.length === 0 && (
                                  <div className="p-4 text-center text-muted-foreground text-sm">
                                    No schedule items for this show.
                                  </div>
                                )}
                              {showCrewContacts.length > 0 && (
                                <div className="border-t border-border/30 px-3 py-2 mt-auto">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-display uppercase tracking-wide text-muted-foreground">Crew</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {showCrewContacts.map((contact) => (
                                      <Badge key={contact.id} variant="outline" className="text-[10px] bg-card/60 backdrop-blur-sm" data-testid={`schedule-crew-${contact.id}`}>
                                        {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                                        {contact.role && <span className="ml-1 text-muted-foreground">({contact.role})</span>}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {filteredSchedule.length === 0 && (
                        <div className="col-span-full p-8 text-center text-muted-foreground">
                          No schedule items for this day.
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 space-y-1.5">
                              {searchFilteredNestedFlat.map(({ item, depth }, index) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03, duration: 0.25, ease: "easeOut" }}
                                >
                                <ScheduleItem
                                  item={item}
                                  canEdit={canEdit}
                                  canComplete={canComplete}
                                  onDelete={(id) => deleteScheduleMutation.mutate(id)}
                                  onDuplicate={(item) => duplicateScheduleMutation.mutate(item)}
                                  showColor={item.eventName ? showColorMap.get(item.eventName) || null : null}
                                  multiShow={false}
                                  depth={depth}
                                  zones={allZones}
                                  sections={allSections}
                                  contacts={contacts}
                                  activityMap={activityMap}
                                  allEventAssignments={allEventAssignments}
                                />
                                </motion.div>
                              ))}
                          {filteredSchedule.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
                              {availableEvents.length === 0
                                ? "Create a show first to start building your schedule."
                                : "No schedule items for this day."}
                            </div>
                          )}
                      </div>
                    </>
                  )}
                  </>
                  )}
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "assigned-crew" && (
              <TabsContent value="assigned-crew" key="assigned-crew" forceMount className="space-y-4 outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {(() => {
                    const showNames = showsForSelectedDate.map(s => s.name);
                    const crewUserIds = new Set(allEventAssignments.filter((a: any) => showNames.includes(a.eventName)).map((a: any) => a.userId));
                    const allCrewContacts = dailySheetContacts.filter(c => c.userId && crewUserIds.has(c.userId));
                    const crewWithPhone = allCrewContacts.filter(c => c.phone);
                    const crewMissingPhone = allCrewContacts.filter(c => !c.phone);
                    if (allCrewContacts.length === 0) return null;
                    const smsLink = `sms:${crewWithPhone.map(c => c.phone!.replace(/\s/g, "")).join(",")}`;
                    function handleCopyCrewNumbers() {
                      const lines = crewWithPhone.map(c => {
                        const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
                        return `${name}: ${c.phone}`;
                      }).join("\n");
                      navigator.clipboard.writeText(lines);
                      setCrewMsgCopied(true);
                      setTimeout(() => setCrewMsgCopied(false), 2000);
                    }
                    return (
                      <div className="flex justify-end mb-2">
                        <Dialog open={crewMsgOpen} onOpenChange={setCrewMsgOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-message-crew-dashboard">
                              <MessageSquare className="w-3.5 h-3.5" /> Message Crew
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Message All Crew</DialogTitle>
                              <DialogDescription>
                                Opens a pre-filled group text on your phone with all assigned crew.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-1">
                              {crewWithPhone.length > 0 ? (
                                <div className="space-y-1">
                                  {crewWithPhone.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 text-sm">
                                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                      <span className="flex-1">{[c.firstName, c.lastName].filter(Boolean).join(" ")}</span>
                                      <span className="text-xs text-muted-foreground font-mono">{c.phone}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">No crew members have a phone number saved.</p>
                              )}
                              {crewMissingPhone.length > 0 && (
                                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 space-y-1">
                                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Missing phone numbers:</p>
                                  {crewMissingPhone.map(c => (
                                    <p key={c.id} className="text-xs text-muted-foreground">
                                      {[c.firstName, c.lastName].filter(Boolean).join(" ")}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 flex-1"
                                onClick={handleCopyCrewNumbers}
                                disabled={crewWithPhone.length === 0}
                                data-testid="button-copy-crew-numbers-dashboard"
                              >
                                {crewMsgCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {crewMsgCopied ? "Copied!" : "Copy Numbers"}
                              </Button>
                              <Button asChild size="sm" className="gap-1.5 flex-1" disabled={crewWithPhone.length === 0} data-testid="button-open-group-text-dashboard">
                                <a href={smsLink}>
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Open Group Text ({crewWithPhone.length})
                                </a>
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })()}
                  <AssignedCrewView contacts={contacts} user={user} selectedEvents={showsForSelectedDate.map(s => s.name)} allEventAssignments={allEventAssignments} selectedDate={selectedDate} />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "timesheet" && (
              <TabsContent value="timesheet" key="timesheet" forceMount className="space-y-4 outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {effectiveSelectedEvents.length > 1 ? (
                    <div className="text-center py-12 text-muted-foreground space-y-3">
                      <Clock className="w-10 h-10 mx-auto opacity-40" />
                      <p className="text-sm">Multiple shows selected. Pick one show to view its time sheet.</p>
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {effectiveSelectedEvents.map(name => (
                          <Button key={name} size="sm" variant="outline" onClick={() => eventSelection.singleSelect(name)}>
                            {name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : effectiveSelectedEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No show selected.</div>
                  ) : (() => {
                    const ev = eventsList.find((e: Event) => e.name === effectiveSelectedEvents[0]);
                    if (!ev) return <div className="text-center py-12 text-muted-foreground text-sm">Show not found.</div>;
                    const currentUserName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
                    return (
                      <TimesheetTab
                        eventId={ev.id}
                        eventName={ev.name}
                        date={selectedDate}
                        isAdmin={isAdmin}
                        currentUserName={currentUserName}
                      />
                    );
                  })()}
                </motion.div>
              </TabsContent>
            )}

            {(activeTab as string) === "contacts" && (
              <TabsContent value="contacts" key="contacts" forceMount className="space-y-6 outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ContactsView contacts={contacts} canEdit={canEdit} allEventAssignments={allEventAssignments} />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "files" && (
              <TabsContent value="files" key="files" forceMount className="space-y-4 outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {effectiveSelectedEvents.length === 0 && availableEvents.length > 0 ? (
                    <Card className="border border-border/30 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Mic2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">No shows selected</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Tap the show switcher above to pick which shows to view</p>
                      </CardContent>
                    </Card>
                  ) : (
                  <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-display uppercase tracking-wide">Show Files</h2>
                    {canEdit && effectiveSelectedEvents.length > 0 && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleQuickAdd("gear")} data-testid="button-add-gear-request">
                        <Plus className="h-3 w-3" /> Gear Request
                      </Button>
                    )}
                  </div>
                  {(() => {
                    const driveProjects = effectiveSelectedEvents
                      .map(name => eventsList.find((e: Event) => e.name === name))
                      .filter(Boolean)
                      .map(ev => ev!.projectId ? allProjects.find(p => p.id === ev!.projectId) : null)
                      .filter((p): p is NonNullable<typeof p> => !!p?.driveUrl)
                      .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
                    if (driveProjects.length > 0) {
                      return (
                        <div className="mb-4 space-y-2">
                          {driveProjects.map(p => (
                            <a key={p.id} href={p.driveUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm text-accent" data-testid={`link-files-drive-${p.id}`}>
                              <ExternalLink className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{p.name} — Google Drive</span>
                            </a>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <FilesView selectedEvents={effectiveSelectedEvents} />
                  {(() => {
                    const selectedEventIds = effectiveSelectedEvents
                      .map(name => eventsList.find((e: Event) => e.name === name))
                      .filter(Boolean)
                      .map(ev => ev!.id);
                    if (selectedEventIds.length === 0) return null;
                    return <GearRequestHistory eventIds={selectedEventIds} eventsList={eventsList} />;
                  })()}
                  </>
                  )}
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "venue" && (
              <TabsContent value="venue" key="venue" forceMount className="space-y-4 outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {(() => {
                    const showNames = effectiveSelectedEvents;
                    const showVenuePairs: { show: Event; venue: Venue; resolvedVenueId: number }[] = [];
                    showNames.forEach(name => {
                      const ev = eventsList.find((e: Event) => e.name === name);
                      if (!ev) return;
                      if (ev.startDate && selectedDate < ev.startDate) return;
                      if (ev.endDate && selectedDate > ev.endDate) return;
                      const dayVenue = allDayVenues.find(dv => dv.eventId === ev.id && dv.date === selectedDate);
                      const resolvedVenueId = dayVenue ? dayVenue.venueId : ev.venueId;
                      if (!resolvedVenueId) return;
                      const venue = venuesList.find(v => v.id === resolvedVenueId);
                      if (!venue) return;
                      showVenuePairs.push({ show: ev, venue, resolvedVenueId });
                    });

                    if (showVenuePairs.length === 0) {
                      const noShowsSelected = effectiveSelectedEvents.length === 0 && availableEvents.length > 0;
                      return (
                        <Card className="border border-border/30 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl">
                          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            {noShowsSelected ? (
                              <>
                                <Mic2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                <p className="text-muted-foreground font-medium">No shows selected</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">Tap the show switcher above to pick which shows to view</p>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-10 h-10 text-muted-foreground/40 mb-3" />
                                <p className="text-muted-foreground">No venue for this date. Venues only appear on show days.</p>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }

                    const venueGroups: Record<number, { venue: Venue; shows: Event[]; resolvedVenueId: number }> = {};
                    for (const pair of showVenuePairs) {
                      if (!venueGroups[pair.resolvedVenueId]) {
                        venueGroups[pair.resolvedVenueId] = { venue: pair.venue, shows: [], resolvedVenueId: pair.resolvedVenueId };
                      }
                      venueGroups[pair.resolvedVenueId].shows.push(pair.show);
                    }

                    return Object.values(venueGroups).map(({ venue: v, shows: groupShows, resolvedVenueId }, idx) => (
                      <motion.div
                        key={`venue-${v.id}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                      <Card className="border border-border/30 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl" data-testid={`card-dashboard-venue-${v.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <CardTitle className="text-2xl font-display uppercase tracking-wide text-primary">{v.name}</CardTitle>
                              {(groupShows.length > 1 || Object.keys(venueGroups).length > 1) && (
                                <p className="text-xs text-muted-foreground mt-0.5">{groupShows.map(s => s.name).join(", ")}</p>
                              )}
                            </div>
                            {canEdit && (
                              <VenueQuickSelect
                                show={groupShows[0]}
                                selectedDate={selectedDate}
                                currentVenueId={resolvedVenueId}
                                venuesList={venuesList}
                                onEditShow={() => setEditingShow(groupShows[0])}
                              />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {v.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {v.address}</p>}
                          <div className="grid md:grid-cols-2 gap-3">
                            {(v.contactName || v.contactPhone) && (
                              <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-2">Production Contact</h4>
                                {v.contactName && <p>{v.contactName}</p>}
                                {v.contactPhone && <p className="text-primary">{v.contactPhone}</p>}
                              </div>
                            )}
                            {(v.wifiSsid || v.wifiPassword) && (
                              <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-2">Wi-Fi</h4>
                                {v.wifiSsid && <p>SSID: {v.wifiSsid}</p>}
                                {v.wifiPassword && <p>Pass: {v.wifiPassword}</p>}
                              </div>
                            )}
                          </div>
                          {(v.parking || v.loadIn || v.capacity) && (
                            <div className="grid md:grid-cols-3 gap-3">
                              {v.parking && (
                                <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                  <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-1">Parking</h4>
                                  <p className="text-sm">{v.parking}</p>
                                </div>
                              )}
                              {v.loadIn && (
                                <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                  <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-1">Load In</h4>
                                  <p className="text-sm">{v.loadIn}</p>
                                </div>
                              )}
                              {v.capacity && (
                                <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                  <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-1">Capacity</h4>
                                  <p className="text-sm">{v.capacity}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {(v.dressingRooms || v.showers || v.laundry || (v.meals && v.meals !== "none")) && (
                            <div className="grid md:grid-cols-2 gap-3">
                              {v.dressingRooms && (
                                <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                  <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-1">Dressing Rooms</h4>
                                  <p className="text-sm">{v.dressingRoomsNotes || "Available"}</p>
                                </div>
                              )}
                              {v.showers && (
                                <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                  <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-1">Showers</h4>
                                  <p className="text-sm">{v.showersNotes || "Available"}</p>
                                </div>
                              )}
                              {v.laundry && (
                                <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                  <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-1">Laundry</h4>
                                  <p className="text-sm">{v.laundryNotes || "Available"}</p>
                                </div>
                              )}
                              {v.meals && v.meals !== "none" && (
                                <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                                  <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-1">Meals</h4>
                                  <p className="text-sm">{v.meals === "client_provided" ? "Client Provided" : "Walkaway"}{v.mealsNotes ? ` - ${v.mealsNotes}` : ""}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {v.notes && (
                            <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3">
                              <h4 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-2">Notes</h4>
                              <p className="text-sm">{v.notes}</p>
                            </div>
                          )}
                          <TechPacketHistory venueId={v.id} canUpload={canEdit} />
                          <VenueMiniMap venue={v} />
                        </CardContent>
                      </Card>
                      </motion.div>
                    ));
                  })()}
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "activity" && (
              <TabsContent value="activity" key="activity" forceMount className="space-y-4 outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {effectiveSelectedEvents.length < availableEvents.length && effectiveSelectedEvents.length === 1 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BarChart3 className="h-4 w-4 flex-shrink-0" />
                      Activity for <span className="font-medium text-foreground">{effectiveSelectedEvents[0]}</span>
                      <button
                        className="ml-auto text-xs underline underline-offset-2 hover:text-foreground transition-colors"
                        onClick={() => eventSelection.selectAll(availableEvents)}
                        data-testid="button-activity-clear-filter"
                      >
                        Show all
                      </button>
                    </div>
                  )}
                  <ActivityFeed filterEvents={effectiveSelectedEvents} />
                </motion.div>
              </TabsContent>
            )}

          </AnimatePresence>
          </div>
        </Tabs>
      </main>
      <GearRequestDialog
        events={showsForSelectedDate.length > 0 ? showsForSelectedDate : (eventsList as Event[])}
        open={gearRequestOpen}
        onOpenChange={setGearRequestOpen}
      />

      <SendDailyDialog
        open={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        selectedDate={selectedDate}
        showsForSelectedDate={showsForSelectedDate}
        contacts={contacts}
        workspaceName={currentWorkspace?.name}
        showColorMap={showColorMap}
        allEventAssignments={allEventAssignments}
      />

      {editingShow && (
        <EditShowDialog
          open={!!editingShow}
          onClose={() => setEditingShow(null)}
          show={editingShow}
          venuesList={venuesList}
        />
      )}


      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigateTab={(tab) => setActiveTab(tab as TabId)}
        onSelectShow={(name) => eventSelection.singleSelect(name)}
      />

    </div>
    </PullToRefresh>
  );
}
