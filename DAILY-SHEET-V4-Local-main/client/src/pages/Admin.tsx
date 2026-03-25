import { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { getProjectTypeColors } from "@/lib/projectColors";
import { AppHeader } from "@/components/AppHeader";
import { motion, AnimatePresence } from "framer-motion";
const PdfPreview = lazy(() => import("@/components/PdfPreview"));
import { Link, useLocation } from "wouter";
import { useEventSelection } from "@/contexts/EventSelectionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar as CalendarIcon, Users, Speaker, MapPin, Upload, Search, Briefcase,
  Plus, Pencil, Trash2, Save, X, Clock, Shield, KeyRound, CalendarPlus, Eye, Sparkles, Loader2, FileText,
  ChevronDown, ChevronRight, Check, UserPlus, Mail, Send, RotateCw, UserCheck, Sun, Moon, Palette, Filter, Layers, Settings, Archive, ArchiveRestore, Headphones, ExternalLink, LogOut, Download, MessageSquare, BarChart3, Map as MapIcon, List, Link2, Copy, MoreHorizontal, Building2, Plane
} from "lucide-react";
import { PlacesAutocomplete } from "@/components/maps/PlacesAutocomplete";
import { GoogleMapView } from "@/components/maps/GoogleMapView";
import * as XLSX from "xlsx";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSchedules } from "@/hooks/use-schedules";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useBulkDeleteContacts } from "@/hooks/use-contacts";
import { useAuth, resetBootstrap } from "@/hooks/use-auth";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useVenues, useCreateVenue, useUpdateVenue, useDeleteVenue } from "@/hooks/use-venue";
import { useZonesByVenue, useCreateZone, useUpdateZone, useDeleteZone } from "@/hooks/use-zones";
import { useSectionsByEvent, useCreateSection, useUpdateSection, useDeleteSection } from "@/hooks/use-sections";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { useTheme } from "@/components/ThemeProvider";
import { useColorScheme, PALETTES, type PaletteName } from "@/components/ColorSchemeProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, WorkspaceInvite } from "@shared/models/auth";
import type { AccessLink } from "@shared/schema";

import {
  insertContactSchema, insertVenueSchema, insertEventSchema, insertProjectSchema,
  type InsertContact, type InsertVenue, type InsertEvent, type InsertProject,
  type Schedule, type Contact, type Event, type Venue, type Zone, type Project, type Section,
  type TimesheetEntry, type DailyCheckin, type Leg, type TravelDay
} from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { SaveShowAsTemplateButton } from "@/components/CreateScheduleDialog";
import { VenueForm } from "@/components/dashboard/venue/VenueForm";

function AdminSettingsPopover() {
  const { palette, setPalette } = useColorScheme();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isColorblind = palette === "colorblind";
  const [priorPalette, setPriorPalette] = useState<PaletteName>("default");

  const handleColorblindToggle = () => {
    if (isColorblind) {
      setPalette(priorPalette);
    } else {
      setPriorPalette(palette);
      setPalette("colorblind");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-admin-settings">
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-card/95 backdrop-blur-md border-border/30" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-2">Appearance</h4>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover-elevate"
              data-testid="button-admin-theme-toggle"
            >
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </div>
            </button>
          </div>
          <Separator />
          <div>
            <button
              onClick={handleColorblindToggle}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors mb-2",
                isColorblind ? "bg-primary/10" : "hover-elevate",
              )}
              data-testid="toggle-admin-colorblind-mode"
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Colorblind Mode</span>
              </div>
              <div className={cn(
                "w-8 h-4 rounded-full transition-colors relative",
                isColorblind ? "bg-primary" : "bg-muted",
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                  isColorblind ? "translate-x-4" : "translate-x-0.5",
                )} />
              </div>
            </button>
            <h4 className="text-sm font-medium mb-2">Color Palette</h4>
            <div className="space-y-1">
              {(Object.entries(PALETTES) as [PaletteName, typeof PALETTES[PaletteName]][]).map(([key, { label, colors: palColors }]) => (
                <button
                  key={key}
                  onClick={() => setPalette(key)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    palette === key ? "bg-primary/10 font-medium" : "hover-elevate",
                  )}
                  data-testid={`admin-color-scheme-${key}`}
                >
                  <div className="flex gap-0.5">
                    {palColors.slice(0, 5).map((c, i) => (
                      <div key={i} className={cn("w-3 h-3 rounded-full", c.bar)} />
                    ))}
                  </div>
                  <span>{label}</span>
                  {palette === key && (
                    <Check className="h-3 w-3 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const ADMIN_NAV_ITEMS = [
  { value: "projects", label: "Projects", icon: Briefcase },
  { value: "venue", label: "Venues", icon: MapPin },
  { value: "people", label: "People", icon: Users },
  { value: "settings", label: "Settings", icon: Settings },
  { value: "timesheets", label: "Time Sheets", icon: Clock },
] as const;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("projects");
  const activeItem = ADMIN_NAV_ITEMS.find(i => i.value === activeTab);

  return (
    <div className="min-h-screen bg-background font-body overflow-x-clip pb-20 sm:pb-0">
      <AppHeader showBack actions={<AdminSettingsPopover />} />

      <main className="container mx-auto px-4 py-4">
        {/* Mobile: dropdown selector */}
        <div className="md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full bg-card border-border/40" data-testid="select-admin-section-mobile">
              <div className="flex items-center gap-2">
                {activeItem && <activeItem.icon className="w-4 h-4 text-muted-foreground" />}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {ADMIN_NAV_ITEMS.map(item => (
                <SelectItem key={item.value} value={item.value} data-testid={`option-admin-${item.value}`}>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: sidebar + content */}
        <div className="flex gap-6 items-start">
          <nav className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0 sticky top-20">
            {ADMIN_NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  data-testid={`nav-admin-${item.value}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-w-0 space-y-4">
            {activeTab === "projects" && <ProjectsAdmin />}
            {activeTab === "venue" && <VenueAdmin />}
            {activeTab === "people" && <PeopleAdmin />}
            {activeTab === "settings" && <SettingsAdmin />}
            {activeTab === "timesheets" && <TimeSheetsAdmin />}
          </div>
        </div>
      </main>
    </div>
  );
}


function parseRoles(role: string): string[] {
  return role.split(",").map(r => r.trim()).filter(Boolean);
}

function formatRoles(roles: string[]): string {
  return roles.join(", ");
}

function useDepartmentOptions() {
  const { data: dbDepartments = [] } = useQuery<any[]>({ queryKey: ["/api/departments"] });
  return useMemo(() => dbDepartments.map((d: any) => d.name), [dbDepartments]);
}

function InlineRoleEditor({ contactId, currentRole, allRoles, onUpdate }: {
  contactId: number;
  currentRole: string;
  allRoles: string[];
  onUpdate: (newRole: string) => void;
}) {
  const selectedDepts = parseRoles(currentRole);
  const deptOptions = useDepartmentOptions();

  const options = useMemo(() => {
    return Array.from(new Set([...deptOptions, ...allRoles])).sort();
  }, [allRoles, deptOptions]);

  const toggleDept = (dept: string) => {
    const isSelected = selectedDepts.includes(dept);
    let updated: string[];
    if (isSelected) {
      updated = selectedDepts.filter(d => d !== dept);
      if (updated.length === 0) return;
    } else {
      updated = [...selectedDepts, dept].sort();
    }
    onUpdate(formatRoles(updated));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-1 flex-wrap cursor-pointer" data-testid={`badge-role-${contactId}`}>
          {selectedDepts.map(dept => (
            <Badge key={dept} variant="outline" className="text-xs font-normal">
              {dept}
            </Badge>
          ))}
          <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-56 overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
        {options.map(dept => (
          <DropdownMenuItem
            key={dept}
            onSelect={(e) => { e.preventDefault(); toggleDept(dept); }}
            data-testid={`option-role-${dept.toLowerCase()}`}
          >
            <div className="w-4 h-4 mr-2 flex items-center justify-center rounded border border-input shrink-0">
              {selectedDepts.includes(dept) && <Check className="w-3 h-3" />}
            </div>
            {dept}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MultiDepartmentSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const selected = parseRoles(value);
  const deptOptions = useDepartmentOptions();

  const toggleDept = (dept: string) => {
    const isSelected = selected.includes(dept);
    let updated: string[];
    if (isSelected) {
      updated = selected.filter(d => d !== dept);
      if (updated.length === 0) return;
    } else {
      updated = [...selected, dept].sort();
    }
    onChange(formatRoles(updated));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal" data-testid="select-contact-role">
          <span className="truncate text-left">
            {selected.length > 0 ? selected.join(", ") : "Select departments..."}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-56 overflow-y-auto w-56">
        {deptOptions.map(dept => (
          <DropdownMenuItem
            key={dept}
            onSelect={(e) => { e.preventDefault(); toggleDept(dept); }}
            data-testid={`option-dept-${dept.toLowerCase()}`}
          >
            <div className="w-4 h-4 mr-2 flex items-center justify-center rounded border border-input shrink-0">
              {selected.includes(dept) && <Check className="w-3 h-3" />}
            </div>
            {dept}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PeopleAdmin() {
  const { user: currentUser } = useAuth();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { mutate: createContact, isPending: isCreating } = useCreateContact();
  const { mutate: updateContact } = useUpdateContact();
  const { mutate: deleteContact } = useDeleteContact();
  const { mutate: bulkDeleteContacts, isPending: isBulkDeleting } = useBulkDeleteContacts();
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: allProjects = [] } = useProjects();
  const { data: activity = [] } = useQuery<{ userId: string; lastActiveAt: string | null }[]>({ queryKey: ["/api/user-activity"], refetchInterval: 60_000 });
  const activityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    const now = Date.now();
    for (const a of activity) {
      if (a.lastActiveAt) map.set(a.userId, now - new Date(a.lastActiveAt).getTime() < ACTIVE_THRESHOLD_MS);
    }
    return map;
  }, [activity]);
  const { data: userWorkspaces = [] } = useQuery<any[]>({ queryKey: ["/api/workspaces"] });
  const currentOrg = userWorkspaces.find((w: any) => w.id === currentUser?.workspaceId);
  const orgName = currentOrg?.name || "Daily Sheet";
  const { data: invites = [] } = useQuery<WorkspaceInvite[]>({
    queryKey: ["/api/workspaces", currentUser?.workspaceId, "invites"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${currentUser?.workspaceId}/invites`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!currentUser?.workspaceId,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "invited" | "no_login">("all");
  const [contactTypeFilter, setContactTypeFilter] = useState<"all" | "crew" | "external">("all");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("commenter");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const availableEventNames = useMemo(() => eventsList.map((e: Event) => e.name).sort(), [eventsList]);
  const pendingInvites = useMemo(() => invites.filter(i => i.status === "pending"), [invites]);
  const visibleInvites = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return invites.filter(invite => invite.status !== "accepted" || (invite.updatedAt ? new Date(invite.updatedAt).getTime() > oneDayAgo : false));
  }, [invites]);

  type PersonStatus = "active" | "invited" | "no_login";
  type UnifiedPerson = { contact: Contact; user?: User; invite?: WorkspaceInvite; status: PersonStatus };

  const unifiedPeople = useMemo<UnifiedPerson[]>(() => {
    return contacts.map(contact => {
      if (contact.userId) {
        const user = users.find(u => u.id === contact.userId);
        if (user) return { contact, user, status: "active" as const };
      }
      if (contact.email) {
        const invite = pendingInvites.find(i => i.email.toLowerCase() === contact.email!.toLowerCase());
        if (invite) return { contact, invite, status: "invited" as const };
      }
      return { contact, status: "no_login" as const };
    });
  }, [contacts, users, pendingInvites]);

  const orphanInvites = useMemo(() => {
    return visibleInvites.filter(invite =>
      invite.status === "pending" && !contacts.some(c => c.email && c.email.toLowerCase() === invite.email.toLowerCase())
    );
  }, [visibleInvites, contacts]);

  const orphanUsers = useMemo(() => {
    return users.filter(user => !contacts.some(c => c.userId === user.id));
  }, [users, contacts]);

  const roles = useMemo(() => Array.from(new Set(contacts.flatMap(c => parseRoles(c.role)))).sort(), [contacts]);

  const filteredPeople = useMemo(() => {
    return unifiedPeople.filter(({ contact, status }) => {
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (contactTypeFilter !== "all" && contact.contactType !== contactTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").toLowerCase();
        if (!name.includes(q) && !(contact.email?.toLowerCase().includes(q)) && !(contact.phone?.toLowerCase().includes(q)) && !(contact.role.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [unifiedPeople, statusFilter, contactTypeFilter, searchQuery]);

  const counts = useMemo(() => ({
    all: unifiedPeople.length,
    active: unifiedPeople.filter(p => p.status === "active").length,
    invited: unifiedPeople.filter(p => p.status === "invited").length,
    no_login: unifiedPeople.filter(p => p.status === "no_login").length,
  }), [unifiedPeople]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/users/${id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "Role updated" }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await fetch(`/api/users/${id}/password`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!res.ok) throw new Error("Failed to reset password");
      return res.json();
    },
    onSuccess: () => toast({ title: "Password reset successfully." }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed"); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Deleted", description: "User removed." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      await apiRequest("POST", `/api/workspaces/${currentUser!.workspaceId}/invite`, { email, role });
    },
    onSuccess: (_data, vars) => {
      toast({ title: "Invite Sent", description: `Invitation sent to ${vars.email}.` });
      setInviteEmail(""); setInviteRole("commenter"); setShowInviteForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentUser?.workspaceId, "invites"] });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to send invite.", variant: "destructive" }),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => { await apiRequest("DELETE", `/api/workspaces/${currentUser!.workspaceId}/invites/${inviteId}`); },
    onSuccess: () => { toast({ title: "Revoked" }); queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentUser?.workspaceId, "invites"] }); },
    onError: () => toast({ title: "Error", description: "Failed to revoke invite.", variant: "destructive" }),
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => { await apiRequest("POST", `/api/workspaces/${currentUser!.workspaceId}/invites/${inviteId}/resend`); },
    onSuccess: () => {
      toast({ title: "Resent" });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentUser?.workspaceId, "invites"] });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to resend.", variant: "destructive" }),
  });

  const [accessLinkContactId, setAccessLinkContactId] = useState<number | null>(null);
  const [accessLinkEventName, setAccessLinkEventName] = useState("");
  const [accessLinkProjectId, setAccessLinkProjectId] = useState<number | null>(null);
  const [accessLinkScopeType, setAccessLinkScopeType] = useState<"event" | "project">("event");
  const [accessLinkExpiry, setAccessLinkExpiry] = useState<"today" | "3days" | "1week" | "show" | "custom">("1week");
  const [accessLinkCustomDate, setAccessLinkCustomDate] = useState("");
  const [generatedAccessUrl, setGeneratedAccessUrl] = useState<string | null>(null);
  const [showAccessLinksForContact, setShowAccessLinksForContact] = useState<number | null>(null);

  const { data: contactAccessLinks = [] } = useQuery<AccessLink[]>({
    queryKey: ["/api/access-links/contact", showAccessLinksForContact],
    queryFn: async () => {
      const res = await fetch(`/api/access-links/contact/${showAccessLinksForContact}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!showAccessLinksForContact,
  });

  const createAccessLinkMutation = useMutation({
    mutationFn: async ({ contactId, eventName, projectId, expiresAt }: { contactId: number; eventName?: string; projectId?: number; expiresAt: string }) => {
      const res = await apiRequest("POST", "/api/access-links", { contactId, eventName: eventName || undefined, projectId: projectId || undefined, expiresAt });
      return res.json();
    },
    onSuccess: (data: AccessLink) => {
      const url = `${window.location.origin}/access/${data.token}`;
      setGeneratedAccessUrl(url);
      queryClient.invalidateQueries({ queryKey: ["/api/access-links/contact", accessLinkContactId] });
      toast({ title: "Access link created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const revokeAccessLinkMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/access-links/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-links/contact", showAccessLinksForContact] });
      toast({ title: "Link revoked" });
    },
    onError: () => toast({ title: "Error", description: "Failed to revoke link.", variant: "destructive" }),
  });

  const computeExpiryDate = (preset: string, eventName: string): string => {
    const now = new Date();
    if (preset === "today") {
      const eod = new Date(now);
      eod.setHours(23, 59, 59, 999);
      return eod.toISOString();
    }
    if (preset === "3days") return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    if (preset === "1week") return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (preset === "show") {
      if (accessLinkScopeType === "project" && accessLinkProjectId) {
        const projectEvents = eventsList.filter((e: Event) => e.projectId === accessLinkProjectId && e.endDate);
        if (projectEvents.length > 0) {
          const maxEnd = projectEvents.reduce((max, e) => {
            const d = new Date(e.endDate! + "T23:59:59");
            return d > max ? d : max;
          }, new Date(0));
          return maxEnd.toISOString();
        }
      } else {
        const ev = eventsList.find((e: Event) => e.name === eventName);
        if (ev?.endDate) {
          const end = new Date(ev.endDate + "T23:59:59");
          return end.toISOString();
        }
      }
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === "custom" && accessLinkCustomDate) {
      return new Date(accessLinkCustomDate + "T23:59:59").toISOString();
    }
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  };

  const handleCreateAccessLink = () => {
    if (!accessLinkContactId) return;
    if (accessLinkScopeType === "event" && !accessLinkEventName) return;
    if (accessLinkScopeType === "project" && !accessLinkProjectId) return;
    const expiresAt = computeExpiryDate(accessLinkExpiry, accessLinkEventName);
    createAccessLinkMutation.mutate({
      contactId: accessLinkContactId,
      eventName: accessLinkScopeType === "event" ? accessLinkEventName : undefined,
      projectId: accessLinkScopeType === "project" ? accessLinkProjectId ?? undefined : undefined,
      expiresAt,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: "Copied to clipboard" }));
  };

  const getAccessLinkTextUrl = (url: string, contactName: string, scopeLabel: string) => {
    const msg = `Here's your daily sheet for ${scopeLabel}: ${url}`;
    return `sms:/open?addresses=&body=${encodeURIComponent(msg)}`;
  };

  const getInviteTextUrl = (email: string) => {
    const msg = `You've been invited to join ${orgName} on Daily Sheet. Sign up here: ${window.location.origin}/register?email=${encodeURIComponent(email)}`;
    return `sms:/open?addresses=&body=${encodeURIComponent(msg)}`;
  };

  const statusBadge = (status: PersonStatus) => {
    if (status === "active") return <Badge className="text-[10px] px-1.5 py-0 bg-green-600 text-white border-green-600 shrink-0">Active</Badge>;
    if (status === "invited") return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-600 dark:text-yellow-400 shrink-0">Invited</Badge>;
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground shrink-0">No Login</Badge>;
  };

  const isLoading = contactsLoading || usersLoading;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-display uppercase tracking-wide">People</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { setShowInviteForm(v => !v); setShowAddContact(false); }} data-testid="button-open-invite-form">
            <Mail className="mr-2 h-4 w-4" /> Send Invite
          </Button>
          <Button onClick={() => { setShowAddContact(v => !v); setShowInviteForm(false); }} data-testid="button-add-contact">
            <Plus className="mr-2 h-4 w-4" /> Add Person
          </Button>
        </div>
      </div>

      {showInviteForm && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardContent className="p-4">
            <form onSubmit={(e) => { e.preventDefault(); if (!inviteEmail.trim()) return; sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole }); }} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="crew@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="pl-9" required data-testid="input-invite-email" />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger data-testid="select-invite-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="commenter">Commenter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={sendInviteMutation.isPending || !inviteEmail.trim()} data-testid="button-send-invite">
                <Send className="w-4 h-4 mr-2" />{sendInviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
              {inviteEmail.trim() && (
                <a href={getInviteTextUrl(inviteEmail.trim())} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap" data-testid="button-invite-via-text">
                  <MessageSquare className="w-4 h-4" /> Text
                </a>
              )}
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowInviteForm(false)} data-testid="button-close-invite-form"><X className="w-4 h-4" /></Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showAddContact && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardHeader><CardTitle className="text-lg font-display uppercase tracking-wide text-primary">New Contact</CardTitle></CardHeader>
          <CardContent>
            <ContactForm
              onSubmit={(data) => {
                createContact(data, {
                  onSuccess: () => { setShowAddContact(false); toast({ title: "Contact Added" }); },
                  onError: () => toast({ title: "Error", description: "Failed to create contact.", variant: "destructive" }),
                });
              }}
              onCancel={() => setShowAddContact(false)}
              isPending={isCreating}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search people..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-people-search" />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {(["all", "crew", "external"] as const).map(t => (
            <Button key={t} variant={contactTypeFilter === t ? "secondary" : "ghost"} size="sm" className="h-8 text-xs px-2.5" onClick={() => setContactTypeFilter(t)} data-testid={`button-type-filter-${t}`}>
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} className="w-full">
        <TabsList className="h-9 w-full sm:w-auto">
          {(["all", "active", "invited", "no_login"] as const).map(s => (
            <TabsTrigger key={s} value={s} className="text-xs gap-1.5 px-3" data-testid={`tab-status-filter-${s}`}>
              {s === "no_login" ? "No Login" : s.charAt(0).toUpperCase() + s.slice(1)}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 min-w-[1.25rem] h-4 leading-none">{counts[s]}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredPeople.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
            <input type="checkbox" checked={filteredPeople.every(p => selectedIds.has(p.contact.id))} onChange={(e) => { if (e.target.checked) setSelectedIds(new Set(filteredPeople.map(p => p.contact.id))); else setSelectedIds(new Set()); }} className="rounded" data-testid="checkbox-select-all-people" />
            Select All ({filteredPeople.length})
          </label>
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <Button variant="destructive" size="sm" disabled={isBulkDeleting}
                onClick={() => {
                  if (!window.confirm(`Delete ${selectedIds.size} contact(s)? This cannot be undone.`)) return;
                  bulkDeleteContacts(Array.from(selectedIds), {
                    onSuccess: (result) => { toast({ title: "Deleted", description: `${result.deleted} contact(s) removed.` }); setSelectedIds(new Set()); },
                    onError: () => toast({ title: "Error", description: "Failed to delete contacts.", variant: "destructive" }),
                  });
                }}
                data-testid="button-bulk-delete-people"
              >
                <Trash2 className="w-4 h-4 mr-1" />{isBulkDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} data-testid="button-clear-people-selection">Clear</Button>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : filteredPeople.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardContent className="p-12 text-center text-muted-foreground">
            {unifiedPeople.length === 0 ? 'No contacts yet. Click "Add Contact" to get started.' : "No people match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredPeople.map(({ contact, user, invite, status }, idx) => {
            const isEditing = editingId === contact.id;

            return (
              <motion.div key={contact.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02, duration: 0.3 }}>
                <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
                  <CardContent className="p-3">
                    {isEditing ? (
                      <ContactForm
                        defaultValues={contact}
                        onSubmit={(data) => {
                          updateContact({ id: contact.id, data }, {
                            onSuccess: () => { setEditingId(null); toast({ title: "Updated" }); },
                            onError: () => toast({ title: "Error", description: "Failed to update.", variant: "destructive" }),
                          });
                        }}
                        onCancel={() => setEditingId(null)}
                        isPending={false}
                        isEdit
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input type="checkbox" checked={selectedIds.has(contact.id)} onChange={(e) => { const next = new Set(selectedIds); if (e.target.checked) next.add(contact.id); else next.delete(contact.id); setSelectedIds(next); }} className="mt-1.5 rounded cursor-pointer shrink-0" data-testid={`checkbox-select-person-${contact.id}`} />
                            <Avatar className="h-9 w-9 border border-border shrink-0 mt-0.5">
                              <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
                                {[contact.firstName, contact.lastName].filter(Boolean).map(n => n![0]).join("").toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {user && <ActiveDotAdmin userId={user.id} activityMap={activityMap} />}
                                <span className="font-semibold truncate" data-testid={`text-person-name-${contact.id}`}>
                                  {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                                </span>
                                {statusBadge(status)}
                                {contact.contactType === "external" && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0">External</Badge>
                                )}
                                <InlineRoleEditor
                                  contactId={contact.id}
                                  currentRole={contact.role}
                                  allRoles={roles}
                                  onUpdate={(newRole) => {
                                    updateContact({ id: contact.id, data: { ...contact, role: newRole } }, {
                                      onSuccess: () => toast({ title: "Department updated" }),
                                      onError: () => toast({ title: "Error", description: "Failed to update.", variant: "destructive" }),
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground flex-wrap min-w-0">
                                {contact.email && <span className="truncate max-w-[200px] sm:max-w-none">{contact.email}</span>}
                                {contact.phone && <span className="shrink-0">{contact.phone}</span>}
                                {user && <Badge variant="secondary" className="text-[10px]">{user.role}</Badge>}
                              </div>
                              {contact.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{contact.notes}"</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-wrap justify-end sm:flex-shrink-0">
                            {user && (
                              <Select value={user.role} onValueChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}>
                                <SelectTrigger className="w-28 h-7 text-xs" data-testid={`select-user-role-${user.id}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="commenter">Commenter</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {invite && (
                              <>
                                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                  Sent {new Date(String(invite.createdAt)).toLocaleDateString()}
                                </span>
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => resendInviteMutation.mutate(invite.id)} disabled={resendInviteMutation.isPending} data-testid={`button-resend-invite-${invite.id}`}>
                                  <RotateCw className="w-3 h-3 mr-1" /> Resend
                                </Button>
                              </>
                            )}
                            {status === "no_login" && contact.email && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => sendInviteMutation.mutate({ email: contact.email!, role: "commenter" })} disabled={sendInviteMutation.isPending} data-testid={`button-quick-invite-${contact.id}`}>
                                <UserPlus className="w-3 h-3 mr-1" /> Invite
                              </Button>
                            )}
                            {status === "no_login" && !contact.email && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setEditingId(contact.id)} data-testid={`button-add-email-${contact.id}`}>
                                <Mail className="w-3 h-3 mr-1" /> Add email
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(contact.id)} data-testid={`button-edit-person-${contact.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            {user && currentUser?.id !== user.id ? (
                              <ConfirmDelete onConfirm={() => deleteUserMutation.mutate(user.id)} title="Remove from workspace?" description={`Remove ${contact.firstName} ${contact.lastName} (${user.email}) from this workspace? Their account will not be deleted.`} triggerVariant="ghost" triggerSize="icon" triggerClassName="h-7 w-7 text-destructive" triggerLabel={<Trash2 className="w-3.5 h-3.5" />} data-testid={`button-delete-person-${contact.id}`} />
                            ) : invite ? (
                              <ConfirmDelete onConfirm={() => revokeInviteMutation.mutate(invite.id)} title="Revoke invite?" description={`Revoke the invite for ${invite.email}?`} triggerVariant="ghost" triggerSize="icon" triggerClassName="h-7 w-7 text-destructive" triggerLabel={<Trash2 className="w-3.5 h-3.5" />} data-testid={`button-revoke-invite-${invite.id}`} />
                            ) : !user ? (
                              <ConfirmDelete onConfirm={() => deleteContact(contact.id, { onSuccess: () => toast({ title: "Deleted", description: "Contact removed." }) })} title="Delete contact?" description={`Remove ${contact.firstName} ${contact.lastName}?`} triggerVariant="ghost" triggerSize="icon" triggerClassName="h-7 w-7 text-destructive" triggerLabel={<Trash2 className="w-3.5 h-3.5" />} data-testid={`button-delete-person-${contact.id}`} />
                            ) : null}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-more-actions-${contact.id}`}>
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user && (
                                  <DropdownMenuItem onClick={() => { const pw = prompt("New password:"); if (pw) resetPasswordMutation.mutate({ id: user.id, password: pw }); }} data-testid={`button-reset-password-${user.id}`}>
                                    <KeyRound className="w-3.5 h-3.5 mr-2" /> Reset Password
                                  </DropdownMenuItem>
                                )}
                                {(status === "no_login" || status === "invited") && (
                                  <DropdownMenuItem onClick={() => { setAccessLinkContactId(contact.id); setAccessLinkEventName(""); setGeneratedAccessUrl(null); setShowAccessLinksForContact(contact.id); }} data-testid={`button-share-access-link-${contact.id}`}>
                                    <Link2 className="w-3.5 h-3.5 mr-2" /> Share Access Link
                                  </DropdownMenuItem>
                                )}
                                {invite && contact.email && (
                                  <DropdownMenuItem asChild>
                                    <a href={getInviteTextUrl(contact.email)} data-testid={`button-text-invite-contact-${contact.id}`}>
                                      <MessageSquare className="w-3.5 h-3.5 mr-2" /> Text Invite
                                    </a>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {orphanUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Users without a contact record</p>
          {orphanUsers.map(user => (
            <Card key={user.id} className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-display text-xs">
                        {(user.email || "??").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <ActiveDotAdmin userId={user.id} activityMap={activityMap} />
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{user.role}</Badge>
                        <p className="text-xs text-muted-foreground">No contact record linked</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={user.role} onValueChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}>
                      <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-orphan-user-role-${user.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="commenter">Commenter</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    {currentUser?.id !== user.id && (
                      <ConfirmDelete onConfirm={() => deleteUserMutation.mutate(user.id)} title="Remove from workspace?" description={`Remove ${user.email} from this workspace? Their account will not be deleted.`} triggerVariant="ghost" triggerSize="icon" triggerClassName="h-8 w-8 text-destructive" triggerLabel={<Trash2 className="w-3.5 h-3.5" />} data-testid={`button-delete-orphan-user-${user.id}`} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {orphanInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending invites without a contact record</p>
          {orphanInvites.map(invite => (
            <Card key={invite.id} className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl" data-testid={`invite-row-${invite.id}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(String(invite.createdAt)).toLocaleDateString()} · <span className="italic">Contact not yet created</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize text-xs">{invite.role}</Badge>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400 text-xs">Pending</Badge>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => resendInviteMutation.mutate(invite.id)} disabled={resendInviteMutation.isPending} data-testid={`button-resend-orphan-invite-${invite.id}`}>
                      <RotateCw className="w-3 h-3 mr-1" /> Resend
                    </Button>
                    <a href={getInviteTextUrl(invite.email)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-input bg-background text-xs font-medium hover:bg-accent transition-colors" data-testid={`button-text-orphan-invite-${invite.id}`}>
                      <MessageSquare className="w-3 h-3" /> Text
                    </a>
                    <ConfirmDelete onConfirm={() => revokeInviteMutation.mutate(invite.id)} title="Revoke invite?" description={`Revoke the invite for ${invite.email}?`} triggerVariant="ghost" triggerSize="icon" triggerClassName="h-7 w-7 text-destructive" triggerLabel={<Trash2 className="w-3.5 h-3.5" />} data-testid={`button-revoke-orphan-invite-${invite.id}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {unifiedPeople.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredPeople.length} of {unifiedPeople.length} people
        </div>
      )}

      <Dialog open={accessLinkContactId !== null} onOpenChange={(open) => { if (!open) { setAccessLinkContactId(null); setGeneratedAccessUrl(null); setShowAccessLinksForContact(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Share Access Link
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const c = contacts.find(c => c.id === accessLinkContactId);
                return c ? `Create a temporary read-only link for ${c.firstName} ${c.lastName}` : "Create a temporary access link";
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!generatedAccessUrl ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Scope</label>
                  <Select value={accessLinkScopeType} onValueChange={(v: "event" | "project") => { setAccessLinkScopeType(v); setAccessLinkEventName(""); setAccessLinkProjectId(null); }}>
                    <SelectTrigger data-testid="select-access-link-scope-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Single Show / Event</SelectItem>
                      <SelectItem value="project">Tour / Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {accessLinkScopeType === "event" ? (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Show / Event</label>
                    <Select value={accessLinkEventName} onValueChange={setAccessLinkEventName}>
                      <SelectTrigger data-testid="select-access-link-event"><SelectValue placeholder="Select a show..." /></SelectTrigger>
                      <SelectContent>
                        {availableEventNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tour / Project</label>
                    <Select value={accessLinkProjectId ? String(accessLinkProjectId) : ""} onValueChange={(v: string) => setAccessLinkProjectId(Number(v))}>
                      <SelectTrigger data-testid="select-access-link-project"><SelectValue placeholder="Select a project..." /></SelectTrigger>
                      <SelectContent>
                        {allProjects.filter((p: Project) => !p.archived).map((p: Project) => <SelectItem key={p.id} value={String(p.id)}>{p.name}{p.isTour ? " (Tour)" : p.isFestival ? " (Festival)" : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Expires</label>
                  <Select value={accessLinkExpiry} onValueChange={(v: "today" | "3days" | "1week" | "show" | "custom") => setAccessLinkExpiry(v)}>
                    <SelectTrigger data-testid="select-access-link-expiry"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today only</SelectItem>
                      <SelectItem value="3days">3 days</SelectItem>
                      <SelectItem value="1week">1 week</SelectItem>
                      <SelectItem value="show">Show duration</SelectItem>
                      <SelectItem value="custom">Custom date</SelectItem>
                    </SelectContent>
                  </Select>
                  {accessLinkExpiry === "custom" && (
                    <DatePicker value={accessLinkCustomDate} onChange={(v) => setAccessLinkCustomDate(v)} data-testid="input-access-link-custom-date" />
                  )}
                </div>
                <Button onClick={handleCreateAccessLink} disabled={(accessLinkScopeType === "event" ? !accessLinkEventName : !accessLinkProjectId) || createAccessLinkMutation.isPending} className="w-full" data-testid="button-create-access-link">
                  {createAccessLinkMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <><Link2 className="w-4 h-4 mr-2" /> Generate Link</>}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Share this link:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm break-all select-all" data-testid="text-generated-access-url">{generatedAccessUrl}</code>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(generatedAccessUrl)} data-testid="button-copy-access-link">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(() => {
                    const c = contacts.find(c => c.id === accessLinkContactId);
                    const name = c ? `${c.firstName} ${c.lastName}` : "";
                    return (
                      <a href={getAccessLinkTextUrl(generatedAccessUrl, name, accessLinkScopeType === "project" ? (allProjects.find((p: Project) => p.id === accessLinkProjectId)?.name || "your project") : accessLinkEventName)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors" data-testid="button-text-access-link">
                        <MessageSquare className="w-4 h-4" /> Send via Text
                      </a>
                    );
                  })()}
                  <Button variant="outline" onClick={() => { setGeneratedAccessUrl(null); setAccessLinkEventName(""); }} data-testid="button-create-another-access-link">
                    Create Another
                  </Button>
                </div>
              </div>
            )}

            {contactAccessLinks.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Links</p>
                {contactAccessLinks.filter(l => !l.revoked && new Date(l.expiresAt) > new Date()).map(link => (
                  <div key={link.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 text-sm" data-testid={`access-link-row-${link.id}`}>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{link.eventName || (link.projectId ? (() => { const p = allProjects.find((pr: Project) => pr.id === link.projectId); return p ? `${p.name} (Project)` : "Project link"; })() : "Link")}</p>
                      <p className="text-xs text-muted-foreground">Expires {new Date(link.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(`${window.location.origin}/access/${link.token}`)} data-testid={`button-copy-link-${link.id}`}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => revokeAccessLinkMutation.mutate(link.id)} data-testid={`button-revoke-link-${link.id}`}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactForm({ defaultValues, onSubmit, onCancel, isPending, isEdit }: {
  defaultValues?: Contact;
  onSubmit: (data: InsertContact) => void;
  onCancel: () => void;
  isPending: boolean;
  isEdit?: boolean;
}) {
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      firstName: defaultValues?.firstName || "",
      lastName: defaultValues?.lastName || "",
      role: defaultValues?.role || "Crew",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      notes: defaultValues?.notes || "",
      contactType: defaultValues?.contactType || "crew",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl><Input placeholder="First name" {...field} data-testid="input-contact-first-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl><Input placeholder="Last name" {...field} value={field.value || ""} data-testid="input-contact-last-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Departments</FormLabel>
              <FormControl>
                <MultiDepartmentSelect value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="contactType" render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Type</FormLabel>
            <FormControl>
              <div className="flex gap-1 rounded-lg border p-1 w-fit" data-testid="toggle-contact-type">
                {[
                  { value: "crew", label: "Crew" },
                  { value: "external", label: "External" },
                ].map(opt => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={field.value === opt.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => field.onChange(opt.value)}
                    data-testid={`button-contact-type-${opt.value}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </FormControl>
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="email@example.com" {...field} value={field.value || ""} data-testid="input-contact-email" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input placeholder="555-0100" {...field} value={field.value || ""} data-testid="input-contact-phone" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Textarea placeholder="Additional info..." {...field} value={field.value || ""} data-testid="input-contact-notes" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-contact">
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-contact">
            <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function VenueZonesSection({ venueId }: { venueId: number }) {
  const { data: zonesList = [] } = useZonesByVenue(venueId);
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneDesc, setNewZoneDesc] = useState("");
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editZoneName, setEditZoneName] = useState("");
  const [editZoneDesc, setEditZoneDesc] = useState("");

  return (
    <div className="border-t border-border mt-4 pt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        data-testid={`toggle-zones-${venueId}`}
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Layers className="w-4 h-4" />
        <span>Zones</span>
        {zonesList.length > 0 && (
          <Badge variant="secondary" className="h-4 min-w-[1rem] px-1 text-[10px]">{zonesList.length}</Badge>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 pl-6">
          {zonesList.length === 0 && !addingZone && (
            <p className="text-xs text-muted-foreground">No zones defined. Add zones for rooms, stages, or areas within this venue.</p>
          )}

          {zonesList.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2 group" data-testid={`zone-item-${zone.id}`}>
              {editingZoneId === zone.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editZoneName}
                    onChange={(e) => setEditZoneName(e.target.value)}
                    placeholder="Zone name"
                    className="h-8 text-sm flex-1"
                    data-testid={`input-edit-zone-name-${zone.id}`}
                  />
                  <Input
                    value={editZoneDesc}
                    onChange={(e) => setEditZoneDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="h-8 text-sm flex-1"
                    data-testid={`input-edit-zone-desc-${zone.id}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (editZoneName.trim()) {
                        updateZone.mutate({ id: zone.id, data: { name: editZoneName.trim(), description: editZoneDesc.trim() || null } }, {
                          onSuccess: () => { setEditingZoneId(null); toast({ title: "Updated", description: "Zone updated." }); },
                          onError: () => toast({ title: "Error", description: "Failed to update zone.", variant: "destructive" }),
                        });
                      }
                    }}
                    data-testid={`button-save-zone-${zone.id}`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingZoneId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{zone.name}</span>
                    {zone.description && <span className="text-xs text-muted-foreground ml-2">— {zone.description}</span>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setEditingZoneId(zone.id); setEditZoneName(zone.name); setEditZoneDesc(zone.description || ""); }}
                    data-testid={`button-edit-zone-${zone.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => deleteZone.mutate(zone.id, {
                      onSuccess: () => toast({ title: "Deleted", description: "Zone removed." }),
                      onError: () => toast({ title: "Error", description: "Failed to delete zone.", variant: "destructive" }),
                    })}
                    data-testid={`button-delete-zone-${zone.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {addingZone ? (
            <div className="flex items-center gap-2">
              <Input
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Zone name (e.g. Main Stage)"
                className="h-8 text-sm flex-1"
                autoFocus
                data-testid={`input-new-zone-name-${venueId}`}
              />
              <Input
                value={newZoneDesc}
                onChange={(e) => setNewZoneDesc(e.target.value)}
                placeholder="Description (optional)"
                className="h-8 text-sm flex-1"
                data-testid={`input-new-zone-desc-${venueId}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={createZone.isPending}
                onClick={() => {
                  if (newZoneName.trim()) {
                    createZone.mutate({ name: newZoneName.trim(), description: newZoneDesc.trim() || null, venueId, sortOrder: zonesList.length, workspaceId: null }, {
                      onSuccess: () => { setNewZoneName(""); setNewZoneDesc(""); setAddingZone(false); toast({ title: "Created", description: "Zone added." }); },
                      onError: () => toast({ title: "Error", description: "Failed to add zone.", variant: "destructive" }),
                    });
                  }
                }}
                data-testid={`button-save-new-zone-${venueId}`}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAddingZone(false); setNewZoneName(""); setNewZoneDesc(""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddingZone(true)}
              data-testid={`button-add-zone-${venueId}`}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Zone
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ShowSectionsSection({ eventId }: { eventId: number }) {
  const { data: sectionsList = [] } = useSectionsByEvent(eventId);
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionDesc, setNewSectionDesc] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editSectionDesc, setEditSectionDesc] = useState("");

  return (
    <div className="border-t border-border mt-4 pt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        data-testid={`toggle-sections-${eventId}`}
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Layers className="w-4 h-4" />
        <span>Sections</span>
        {sectionsList.length > 0 && (
          <Badge variant="secondary" className="h-4 min-w-[1rem] px-1 text-[10px]">{sectionsList.length}</Badge>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 pl-6">
          {sectionsList.length === 0 && !addingSection && (
            <p className="text-xs text-muted-foreground">No sections defined. Add sections for areas or segments within this show.</p>
          )}

          {sectionsList.map((section) => (
            <div key={section.id} className="flex items-center gap-2 group" data-testid={`section-item-${section.id}`}>
              {editingSectionId === section.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editSectionName}
                    onChange={(e) => setEditSectionName(e.target.value)}
                    placeholder="Section name"
                    className="h-8 text-sm flex-1"
                    data-testid={`input-edit-section-name-${section.id}`}
                  />
                  <Input
                    value={editSectionDesc}
                    onChange={(e) => setEditSectionDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="h-8 text-sm flex-1"
                    data-testid={`input-edit-section-desc-${section.id}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (editSectionName.trim()) {
                        updateSection.mutate({ id: section.id, data: { name: editSectionName.trim(), description: editSectionDesc.trim() || null } }, {
                          onSuccess: () => { setEditingSectionId(null); toast({ title: "Updated", description: "Section updated." }); },
                          onError: () => toast({ title: "Error", description: "Failed to update section.", variant: "destructive" }),
                        });
                      }
                    }}
                    data-testid={`button-save-section-${section.id}`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingSectionId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{section.name}</span>
                    {section.description && <span className="text-xs text-muted-foreground ml-2">— {section.description}</span>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setEditingSectionId(section.id); setEditSectionName(section.name); setEditSectionDesc(section.description || ""); }}
                    data-testid={`button-edit-section-${section.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => deleteSection.mutate(section.id, {
                      onSuccess: () => toast({ title: "Deleted", description: "Section removed." }),
                      onError: () => toast({ title: "Error", description: "Failed to delete section.", variant: "destructive" }),
                    })}
                    data-testid={`button-delete-section-${section.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {addingSection ? (
            <div className="flex items-center gap-2">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name (e.g. VIP Area)"
                className="h-8 text-sm flex-1"
                autoFocus
                data-testid={`input-new-section-name-${eventId}`}
              />
              <Input
                value={newSectionDesc}
                onChange={(e) => setNewSectionDesc(e.target.value)}
                placeholder="Description (optional)"
                className="h-8 text-sm flex-1"
                data-testid={`input-new-section-desc-${eventId}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={createSection.isPending}
                onClick={() => {
                  if (newSectionName.trim()) {
                    createSection.mutate({ name: newSectionName.trim(), description: newSectionDesc.trim() || null, eventId, sortOrder: sectionsList.length, workspaceId: null }, {
                      onSuccess: () => { setNewSectionName(""); setNewSectionDesc(""); setAddingSection(false); toast({ title: "Created", description: "Section added." }); },
                      onError: () => toast({ title: "Error", description: "Failed to add section.", variant: "destructive" }),
                    });
                  }
                }}
                data-testid={`button-save-new-section-${eventId}`}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAddingSection(false); setNewSectionName(""); setNewSectionDesc(""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddingSection(true)}
              data-testid={`button-add-section-${eventId}`}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Section
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function VenueMapView({ venues }: { venues: Venue[] }) {
  const mappable = venues.filter(v => v.latitude && v.longitude);
  const missing = venues.filter(v => !v.latitude || !v.longitude);

  const markers = mappable.map(v => ({
    lat: parseFloat(v.latitude!),
    lng: parseFloat(v.longitude!),
    title: `${v.name}\n${v.address}`,
  }));

  return (
    <div className="space-y-4" data-testid="venue-map-container">
      {mappable.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No venues have coordinates set. Edit a venue and add latitude/longitude to see it on the map.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
          <GoogleMapView
            markers={markers}
            height={450}
            zoom={2}
          />
        </div>
      )}
      {missing.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Venues Missing Coordinates ({missing.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {missing.map(v => (
                <div key={v.id} className="flex items-center gap-2 text-sm" data-testid={`venue-missing-coords-${v.id}`}>
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span>{v.name}</span>
                  <span className="text-muted-foreground">— {v.address}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VenueAdmin() {
  const { data: venuesList = [], isLoading } = useVenues();
  const { mutate: createVenue, isPending: isCreating } = useCreateVenue();
  const { mutate: updateVenue, isPending: isUpdating } = useUpdateVenue();
  const { mutate: deleteVenue } = useDeleteVenue();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedVenues, setExpandedVenues] = useState<Set<number>>(new Set());
  const [venueView, setVenueView] = useState<"list" | "map">("list");

  if (isLoading) return <div className="text-center text-muted-foreground py-12">Loading venues...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-display uppercase tracking-wide flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Venues
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm p-0.5">
            <Button
              variant={venueView === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setVenueView("list")}
              data-testid="button-venue-list-view"
            >
              <List className="w-4 h-4 mr-1" /> List
            </Button>
            <Button
              variant={venueView === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setVenueView("map")}
              data-testid="button-venue-map-view"
            >
              <MapIcon className="w-4 h-4 mr-1" /> Map
            </Button>
          </div>
          {!showAdd && venueView === "list" && (
            <Button onClick={() => setShowAdd(true)} data-testid="button-add-venue">
              <Plus className="mr-2 h-4 w-4" /> Add Venue
            </Button>
          )}
        </div>
      </div>

      {venueView === "map" ? (
        <VenueMapView venues={venuesList} />
      ) : (
        <>

      {showAdd && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-display uppercase tracking-wide">New Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueForm
              isPending={isCreating}
              onCancel={() => setShowAdd(false)}
              onSave={(data) => {
                createVenue(data, {
                  onSuccess: () => {
                    toast({ title: "Created", description: "Venue added." });
                    setShowAdd(false);
                  },
                  onError: () => toast({ title: "Error", description: "Failed to add venue.", variant: "destructive" }),
                });
              }}
            />
          </CardContent>
        </Card>
      )}

      {venuesList.length === 0 && !showAdd ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-4">No venues added yet.</p>
            <Button onClick={() => setShowAdd(true)} data-testid="button-add-first-venue">
              <Plus className="mr-2 h-4 w-4" /> Add Your First Venue
            </Button>
          </CardContent>
        </Card>
      ) : (
        venuesList.map((venue, venueIndex) => (
          <motion.div
            key={venue.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: venueIndex * 0.03, duration: 0.3 }}
          >
          <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl" data-testid={`card-venue-${venue.id}`}>
            {editingId === venue.id ? (
              <>
                <CardHeader>
                  <CardTitle className="text-lg font-display uppercase tracking-wide">Edit Venue</CardTitle>
                </CardHeader>
                <CardContent>
                  <VenueForm
                    venue={venue}
                    isPending={isUpdating}
                    onCancel={() => setEditingId(null)}
                    onSave={(data) => {
                      updateVenue({ id: venue.id, data }, {
                        onSuccess: () => {
                          toast({ title: "Updated", description: "Venue details saved." });
                          setEditingId(null);
                        },
                        onError: () => toast({ title: "Error", description: "Failed to save venue.", variant: "destructive" }),
                      });
                    }}
                  />
                </CardContent>
              </>
            ) : (
              <>
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedVenues(prev => {
                    const next = new Set(prev);
                    next.has(venue.id) ? next.delete(venue.id) : next.add(venue.id);
                    return next;
                  })}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedVenues.has(venue.id) ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <span className="font-display uppercase tracking-wide text-sm font-semibold">{venue.name}</span>
                      {venue.address && <span className="text-xs text-muted-foreground ml-2 truncate">{venue.address}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {venue.techPacketUrl && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(venue.techPacketUrl!, '_blank')} data-testid={`button-view-tech-packet-${venue.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(venue.id)} data-testid={`button-edit-venue-${venue.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDelete
                      onConfirm={() => deleteVenue(venue.id, {
                        onSuccess: () => toast({ title: "Deleted", description: "Venue removed." }),
                        onError: () => toast({ title: "Error", description: "Failed to delete venue.", variant: "destructive" }),
                      })}
                      title="Delete venue?"
                      description={`Delete "${venue.name}"? This cannot be undone.`}
                      triggerClassName="text-destructive"
                      data-testid={`button-delete-venue-${venue.id}`}
                    />
                  </div>
                </div>
                {expandedVenues.has(venue.id) && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {venue.contactName && (
                        <div>
                          <span className="text-muted-foreground">Contact:</span>{" "}
                          <span>{venue.contactName}</span>
                          {venue.contactPhone && <span className="ml-1 text-muted-foreground">({venue.contactPhone})</span>}
                        </div>
                      )}
                      {venue.wifiSsid && (
                        <div>
                          <span className="text-muted-foreground">Wi-Fi:</span>{" "}
                          <span>{venue.wifiSsid}</span>
                          {venue.wifiPassword && <span className="ml-1 text-muted-foreground">/ {venue.wifiPassword}</span>}
                        </div>
                      )}
                      {venue.notes && (
                        <div>
                          <span className="text-muted-foreground">Notes:</span>{" "}
                          <span>{venue.notes}</span>
                        </div>
                      )}
                      {venue.techPacketUrl && (
                        <div>
                          <Button variant="outline" size="sm" onClick={() => window.open(venue.techPacketUrl!, '_blank')} data-testid={`button-view-tech-packet-link-${venue.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Tech Packet
                          </Button>
                        </div>
                      )}
                    </div>
                    <VenueZonesSection venueId={venue.id} />
                  </CardContent>
                )}
              </>
            )}
          </Card>
          </motion.div>
        ))
      )}
      </>
      )}
    </div>
  );
}

function SearchableContactSelect({ contacts, onSelect, testId }: { contacts: Contact[]; onSelect: (id: number) => void; testId?: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = contacts.filter((c) => {
    const name = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase();
    const role = (c.role || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  return (
    <Popover open={searchOpen} onOpenChange={(v) => { setSearchOpen(v); if (!v) setSearchQuery(""); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-64 justify-start font-normal text-muted-foreground" data-testid={testId}>
          <Search className="w-4 h-4 mr-2 flex-shrink-0" />
          Add contact to this show...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            data-testid={testId ? `${testId}-search` : undefined}
          />
        </div>
        <div className="max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">No contacts found</div>
          ) : (
            filtered.map((contact) => (
              <button
                key={contact.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover-elevate flex items-center gap-2"
                onClick={() => {
                  onSelect(contact.id);
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                data-testid={`option-contact-${contact.id}`}
              >
                <span>{[contact.firstName, contact.lastName].filter(Boolean).join(" ")}</span>
                <span className="text-muted-foreground">({contact.role})</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EventsAdmin() {
  const [, setLocation] = useLocation();
  const eventSelection = useEventSelection();
  const { data: eventsList = [], isLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: projectsList = [] } = useProjects();
  const { data: schedules = [] } = useSchedules();
  const { data: contacts = [] } = useContacts();
  const { data: venues = [] } = useVenues();
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"] });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [showFilter, setShowFilter] = useState<"current" | "archived" | "all">("current");
  const [showSearch, setShowSearch] = useState("");
  const [expandedShowId, setExpandedShowId] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const filteredEventsList = useMemo(() => {
    return eventsList.filter((e: Event) => {
      if (showSearch.trim()) {
        const q = showSearch.trim().toLowerCase();
        if (!e.name.toLowerCase().includes(q)) return false;
      }
      if (showFilter === "all") return true;
      const endOrStart = e.endDate || e.startDate;
      const isPast = endOrStart && endOrStart < todayStr;
      return showFilter === "archived" ? isPast : !isPast;
    }).sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999"));
  }, [eventsList, showFilter, showSearch, todayStr]);

  const groupedEvents = useMemo(() => {
    const groups: { key: string; label: string; project: Project | null; events: Event[] }[] = [];
    const projectMap = new Map<number, Project>();
    projectsList.forEach((p: Project) => projectMap.set(p.id, p));

    const byProject = new Map<number | null, Event[]>();
    filteredEventsList.forEach((e: Event) => {
      const pid = e.projectId != null && projectMap.has(e.projectId) ? e.projectId : null;
      if (!byProject.has(pid)) byProject.set(pid, []);
      byProject.get(pid)!.push(e);
    });

    const projectIds = Array.from(byProject.keys()).filter((k): k is number => k !== null);
    projectIds
      .sort((a, b) => {
        const pa = projectMap.get(a);
        const pb = projectMap.get(b);
        return (pa?.startDate || "9999").localeCompare(pb?.startDate || "9999");
      })
      .forEach((pid) => {
        const proj = projectMap.get(pid)!;
        groups.push({ key: `project-${pid}`, label: proj.name, project: proj, events: byProject.get(pid)! });
      });

    const standalone = byProject.get(null);
    if (standalone && standalone.length > 0) {
      groups.push({ key: "standalone", label: "Standalone Shows", project: null, events: standalone });
    }

    if (groups.length === 0 && filteredEventsList.length > 0) {
      groups.push({ key: "standalone", label: "Standalone Shows", project: null, events: filteredEventsList });
    }

    return groups;
  }, [filteredEventsList, projectsList]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newVenueId, setNewVenueId] = useState<number | null>(null);
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editVenueId, setEditVenueId] = useState<number | null>(null);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [newVenueForAllDays, setNewVenueForAllDays] = useState(false);
  const [editVenueForAllDays, setEditVenueForAllDays] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; notes?: string; startDate?: string; endDate?: string; venueId?: number | null; projectId?: number | null; venueForAllDays?: boolean }) => {
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create show");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: "Created", description: "Show created successfully." });
      setShowAdd(false);
      setNewName("");
      setNewNotes("");
      setNewStartDate("");
      setNewEndDate("");
      setNewVenueId(null);
      setNewProjectId(null);
      setNewVenueForAllDays(false);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEvent> & { venueForAllDays?: boolean } }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update show");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: "Updated", description: "Show updated successfully." });
      setEditingId(null);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      toast({ title: "Deleted", description: "Show and all related data removed." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const getScheduleCount = (eventName: string) =>
    schedules.filter(s => s.eventName === eventName).length;

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const archivedCount = useMemo(() => {
    return eventsList.filter((e: Event) => {
      const endOrStart = e.endDate || e.startDate;
      return endOrStart && endOrStart < todayStr;
    }).length;
  }, [eventsList, todayStr]);

  if (isLoading) return <div className="text-center text-muted-foreground py-12">Loading shows...</div>;

  const renderShowRow = (event: Event) => {
    const count = getScheduleCount(event.name);
    const isEditing = editingId === event.id;
    const isExpanded = expandedShowId === event.id;
    const venue = event.venueId ? venues.find((v: Venue) => v.id === event.venueId) : null;

    if (isEditing) {
      return (
        <div key={event.id} className="border border-border/30 rounded-xl p-4 bg-card/50 backdrop-blur-sm" data-testid={`card-event-${event.id}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editName.trim()) {
                if (editStartDate && editEndDate && editStartDate > editEndDate) {
                  toast({ title: "Invalid dates", description: "End date must be on or after start date.", variant: "destructive" });
                  return;
                }
                updateMutation.mutate({ id: event.id, data: {
                  name: editName.trim(),
                  notes: editNotes.trim() || null,
                  startDate: editStartDate || null,
                  endDate: editEndDate || null,
                  venueId: editVenueId,
                  projectId: editProjectId ?? undefined,
                  venueForAllDays: editVenueForAllDays,
                } });
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Show Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid={`input-edit-event-name-${event.id}`}
              />
            </div>
            <DateRangePicker
              startDate={editStartDate}
              endDate={editEndDate}
              onChangeStart={setEditStartDate}
              onChangeEnd={setEditEndDate}
              testIdPrefix={`edit-event-date-range-${event.id}`}
            />
            <div>
              <label className="text-sm font-medium">Venue (optional)</label>
              <Select
                value={editVenueId !== null ? String(editVenueId) : "none"}
                onValueChange={(val) => setEditVenueId(val === "none" ? null : Number(val))}
              >
                <SelectTrigger data-testid={`select-edit-event-venue-${event.id}`}>
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No venue</SelectItem>
                  {venues.map((v: Venue) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editVenueId !== null && editStartDate && editEndDate && editStartDate !== editEndDate && (
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id={`editVenueForAllDays-${event.id}`}
                    checked={editVenueForAllDays}
                    onCheckedChange={(checked) => setEditVenueForAllDays(checked === true)}
                    data-testid={`checkbox-edit-venue-all-days-${event.id}`}
                  />
                  <Label htmlFor={`editVenueForAllDays-${event.id}`} className="text-sm cursor-pointer">
                    Same venue for all show days
                  </Label>
                </div>
              )}
              {editVenueId !== null && editStartDate && editEndDate && editStartDate !== editEndDate && !editVenueForAllDays && (
                <p className="text-xs text-muted-foreground mt-1">
                  Venue will be set for the first day only. You can assign venues to other days from the dashboard.
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Project (optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn("w-full justify-between font-normal", !editProjectId && "text-muted-foreground")}
                    data-testid={`select-edit-event-project-${event.id}`}
                  >
                    {editProjectId
                      ? projectsList.find((p: any) => p.id === editProjectId)?.name || "Unknown project"
                      : "No project"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandList>
                      <CommandEmpty>No projects found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="no-project"
                          onSelect={() => setEditProjectId(null)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", editProjectId === null ? "opacity-100" : "opacity-0")} />
                          No project
                        </CommandItem>
                        {projectsList
                          .filter((p: any) => !p.archived || p.id === editProjectId)
                          .map((p: any) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => setEditProjectId(p.id)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", editProjectId === p.id ? "opacity-100" : "opacity-0")} />
                              {p.name}{p.archived ? " (archived)" : ""}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                data-testid={`input-edit-event-notes-${event.id}`}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !editName.trim()}>
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div key={event.id} className="border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden" data-testid={`card-event-${event.id}`}>
        <div className="flex items-center gap-3 p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setExpandedShowId(isExpanded ? null : event.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`toggle-expand-event-${event.id}`}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              eventSelection.singleSelect(event.name);
              setLocation(`/dashboard${event.startDate ? `?date=${event.startDate}` : ""}`);
            }}
            data-testid={`link-event-dashboard-${event.id}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base truncate" data-testid={`text-event-name-${event.id}`}>{event.name}</h3>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {count} item{count !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
              {(event.startDate || event.endDate) && (
                <span className="flex items-center gap-1" data-testid={`text-event-dates-${event.id}`}>
                  <CalendarIcon className="w-3 h-3" />
                  {event.startDate && event.endDate ? (
                    event.startDate === event.endDate
                      ? format(new Date(event.startDate + "T12:00:00"), "MMM d, yyyy")
                      : `${format(new Date(event.startDate + "T12:00:00"), "MMM d")} – ${format(new Date(event.endDate + "T12:00:00"), "MMM d, yyyy")}`
                  ) : event.startDate ? (
                    format(new Date(event.startDate + "T12:00:00"), "MMM d, yyyy")
                  ) : (
                    `Ends ${format(new Date(event.endDate! + "T12:00:00"), "MMM d, yyyy")}`
                  )}
                </span>
              )}
              {venue && (
                <span className="flex items-center gap-1" data-testid={`text-event-venue-${event.id}`}>
                  <MapPin className="w-3 h-3" />
                  {venue.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setEditingId(event.id);
                setEditName(event.name);
                setEditNotes(event.notes || "");
                setEditStartDate(event.startDate || "");
                setEditEndDate(event.endDate || "");
                setEditVenueId(event.venueId ?? null);
                setEditProjectId(event.projectId ?? null);
                setEditVenueForAllDays(false);
              }}
              data-testid={`button-edit-event-${event.id}`}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <ConfirmDelete
              onConfirm={() => deleteMutation.mutate(event.id)}
              title="Delete show?"
              description={count > 0 ? `This show has ${count} schedule item(s). Deleting it won't remove those items, but they'll become unassigned. Continue?` : "This will permanently delete the show. This cannot be undone."}
              triggerVariant="ghost"
              triggerSize="icon"
              triggerClassName="h-7 w-7 text-destructive"
              triggerLabel={<Trash2 className="w-3 h-3" />}
              data-testid={`button-delete-event-${event.id}`}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
            {event.notes && (
              <p className="text-sm text-muted-foreground italic">{event.notes}</p>
            )}

            {(() => {
              const assignedUserIds = new Set(allEventAssignments.filter((a: any) => a.eventName === event.name).map((a: any) => a.userId));
              const assignedContacts = contacts.filter((c) => (!c.contactType || c.contactType === "crew") && c.userId && assignedUserIds.has(c.userId));
              return assignedContacts.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Assigned Crew</p>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedContacts.map((contact) => (
                      <Badge
                        key={contact.id}
                        variant="outline"
                        className="text-xs"
                        data-testid={`badge-assigned-contact-${contact.id}`}
                      >
                        {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                        <span className="text-muted-foreground ml-1">({contact.role})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <ShowSectionsSection eventId={event.id} />

            <div className="border-t border-border mt-4 pt-3">
              <SaveShowAsTemplateButton eventName={event.name} allSchedules={schedules} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-display uppercase tracking-wide">Manage Shows</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and organize your shows. Schedule items and user access are linked to these show names.
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {(["current", "archived", "all"] as const).map((f) => {
              const label = f === "current" ? "Current & Upcoming" : f === "archived" ? "Archived" : "All";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setShowFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5",
                    showFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover-elevate"
                  )}
                  data-testid={`pill-${f}-shows`}
                >
                  {label}
                  {f === "archived" && archivedCount > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-[1rem] px-1 text-[10px]">{archivedCount}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="button-add-event">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Show
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search shows..."
          value={showSearch}
          onChange={(e) => setShowSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-shows"
        />
      </div>

      {showAdd && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-display uppercase tracking-wide text-primary">New Show</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) {
                  if (newStartDate && newEndDate && newStartDate > newEndDate) {
                    toast({ title: "Invalid dates", description: "End date must be on or after start date.", variant: "destructive" });
                    return;
                  }
                  createMutation.mutate({
                    name: newName.trim(),
                    notes: newNotes.trim() || undefined,
                    startDate: newStartDate || undefined,
                    endDate: newEndDate || undefined,
                    venueId: newVenueId,
                    projectId: newProjectId,
                    venueForAllDays: newVenueForAllDays,
                  });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium">Show Name</label>
                <Input
                  placeholder="e.g. Main Concert, VIP Reception"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  data-testid="input-new-event-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Project (optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between font-normal", !newProjectId && "text-muted-foreground")}
                      data-testid="select-new-event-project"
                    >
                      {newProjectId
                        ? projectsList.find((p: any) => p.id === newProjectId)?.name || "Unknown project"
                        : "No project"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search projects..." />
                      <CommandList>
                        <CommandEmpty>No projects found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="no-project"
                            onSelect={() => setNewProjectId(null)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", newProjectId === null ? "opacity-100" : "opacity-0")} />
                            No project
                          </CommandItem>
                          {projectsList.filter((p: any) => !p.archived).map((p: any) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => setNewProjectId(p.id)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", newProjectId === p.id ? "opacity-100" : "opacity-0")} />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <DateRangePicker
                startDate={newStartDate}
                endDate={newEndDate}
                onChangeStart={setNewStartDate}
                onChangeEnd={setNewEndDate}
                testIdPrefix="new-event-date-range"
                defaultMonth={newProjectId ? (() => {
                  const proj = projectsList.find((p: any) => p.id === newProjectId);
                  return proj?.startDate ? new Date(proj.startDate + "T12:00:00") : undefined;
                })() : undefined}
              />
              <div>
                <label className="text-sm font-medium">Venue (optional)</label>
                <Select
                  value={newVenueId !== null ? String(newVenueId) : "none"}
                  onValueChange={(val) => setNewVenueId(val === "none" ? null : Number(val))}
                >
                  <SelectTrigger data-testid="select-new-event-venue">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No venue</SelectItem>
                    {venues.map((v: Venue) => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newVenueId !== null && newStartDate && newEndDate && newStartDate !== newEndDate && (
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="newVenueForAllDays"
                      checked={newVenueForAllDays}
                      onCheckedChange={(checked) => setNewVenueForAllDays(checked === true)}
                      data-testid="checkbox-new-venue-all-days"
                    />
                    <Label htmlFor="newVenueForAllDays" className="text-sm cursor-pointer">
                      Same venue for all show days
                    </Label>
                  </div>
                )}
                {newVenueId !== null && newStartDate && newEndDate && newStartDate !== newEndDate && !newVenueForAllDays && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Venue will be set for the first day only. You can assign venues to other days from the dashboard.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Details about this show..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  data-testid="input-new-event-notes"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setNewName(""); setNewNotes(""); setNewStartDate(""); setNewEndDate(""); setNewVenueId(null); setNewProjectId(null); }} data-testid="button-cancel-event">
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !newName.trim()} data-testid="button-save-event">
                  <Save className="mr-2 h-4 w-4" /> Create
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filteredEventsList.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardContent className="p-12 text-center text-muted-foreground">
            {showSearch.trim()
              ? `No shows matching "${showSearch.trim()}".`
              : showFilter === "archived"
                ? "No archived shows."
                : eventsList.length === 0
                  ? 'No shows created yet. Click "New Show" to get started, then assign schedule items to your shows.'
                  : showFilter === "all"
                    ? "No shows found."
                    : "No current or upcoming shows."}
          </CardContent>
        </Card>
      ) : groupedEvents.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardContent className="p-12 text-center text-muted-foreground">
            No shows found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {groupedEvents.map((group) => {
            const isGroupCollapsed = collapsedGroups.has(group.key);
            return (
              <div key={group.key} data-testid={`group-${group.key}`}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center gap-2 w-full text-left mb-2 group"
                  data-testid={`toggle-group-${group.key}`}
                >
                  {isGroupCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-display text-sm uppercase tracking-wide font-semibold">
                    {group.project ? (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-primary" />
                        {group.label}
                      </span>
                    ) : group.label}
                  </span>
                  <Badge variant="outline" className="text-[10px] ml-1">{group.events.length}</Badge>
                  {group.project?.description && (
                    <span className="text-xs text-muted-foreground font-normal ml-2 hidden sm:inline">{group.project.description}</span>
                  )}
                </button>
                {!isGroupCollapsed && (
                  <div className="space-y-2 ml-1">
                    {group.events.map(renderShowRow)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;


function ActiveDotAdmin({ userId, activityMap }: { userId: string; activityMap: Map<string, boolean> }) {
  const isActive = activityMap.get(userId);
  if (!isActive) return null;
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"
      title="Active now"
      data-testid={`indicator-active-admin-${userId}`}
    />
  );
}

function CreateShowForProjectDialog({ projectId, projectName, venues, isFestival, legId, buttonLabel, eventTypeOverride, defaultStartDate, defaultEndDate }: { projectId: number; projectName: string; venues: Venue[]; isFestival?: boolean; legId?: number | null; buttonLabel?: string; eventTypeOverride?: string; defaultStartDate?: string; defaultEndDate?: string }) {
  const entityLabel = eventTypeOverride === "area" ? "Area" : isFestival ? "Stage" : "Show";
  const [open, setOpen] = useState(false);
  const [showName, setShowName] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate || format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(defaultEndDate || defaultStartDate || format(new Date(), "yyyy-MM-dd"));

  // Sync dates when leg dates change (e.g. after editing a festival's dates)
  useEffect(() => {
    if (defaultStartDate) setStartDate(defaultStartDate);
    if (defaultEndDate) setEndDate(defaultEndDate);
    else if (defaultStartDate) setEndDate(defaultStartDate);
  }, [defaultStartDate, defaultEndDate]);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [venueSearchOpen, setVenueSearchOpen] = useState(false);
  const [venueForAllDays, setVenueForAllDays] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNewVenueForm, setShowNewVenueForm] = useState(false);
  const [inlineVenueName, setInlineVenueName] = useState("");
  const [inlineVenueAddress, setInlineVenueAddress] = useState("");
  const [inlineVenueContactName, setInlineVenueContactName] = useState("");
  const [inlineVenueContactPhone, setInlineVenueContactPhone] = useState("");
  const [inlineVenueWifi, setInlineVenueWifi] = useState("");
  const [inlineVenueWifiPassword, setInlineVenueWifiPassword] = useState("");
  const [inlineVenueParking, setInlineVenueParking] = useState("");
  const [inlineVenueLoadIn, setInlineVenueLoadIn] = useState("");
  const [inlineVenueCapacity, setInlineVenueCapacity] = useState("");
  const [inlineVenueDressingRooms, setInlineVenueDressingRooms] = useState(false);
  const [inlineVenueDressingRoomsNotes, setInlineVenueDressingRoomsNotes] = useState("");
  const [inlineVenueShowers, setInlineVenueShowers] = useState(false);
  const [inlineVenueShowersNotes, setInlineVenueShowersNotes] = useState("");
  const [inlineVenueLaundry, setInlineVenueLaundry] = useState(false);
  const [inlineVenueLaundryNotes, setInlineVenueLaundryNotes] = useState("");
  const [inlineVenueMeals, setInlineVenueMeals] = useState("");
  const [inlineVenueMealsNotes, setInlineVenueMealsNotes] = useState("");
  const [inlineVenueTechPacketUrl, setInlineVenueTechPacketUrl] = useState("");
  const [inlineVenueLatitude, setInlineVenueLatitude] = useState("");
  const [inlineVenueLongitude, setInlineVenueLongitude] = useState("");
  const [isParsingTechPacket, setIsParsingTechPacket] = useState(false);
  const techPacketFileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createVenueMutation = useCreateVenue();

  async function handleTechPacketUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingTechPacket(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/venues/parse-tech-packet", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to parse");
      const data = await res.json();
      if (data.name) setInlineVenueName(data.name);
      if (data.address) setInlineVenueAddress(data.address);
      if (data.contactName) setInlineVenueContactName(data.contactName);
      if (data.contactPhone) setInlineVenueContactPhone(data.contactPhone);
      if (data.wifiSsid) setInlineVenueWifi(data.wifiSsid);
      if (data.wifiPassword) setInlineVenueWifiPassword(data.wifiPassword);
      if (data.parking) setInlineVenueParking(data.parking);
      if (data.loadIn) setInlineVenueLoadIn(data.loadIn);
      if (data.capacity) setInlineVenueCapacity(data.capacity);
      if (data.dressingRooms) setInlineVenueDressingRooms(true);
      if (data.dressingRoomsNotes) setInlineVenueDressingRoomsNotes(data.dressingRoomsNotes);
      if (data.showers) setInlineVenueShowers(true);
      if (data.showersNotes) setInlineVenueShowersNotes(data.showersNotes);
      if (data.laundry) setInlineVenueLaundry(true);
      if (data.laundryNotes) setInlineVenueLaundryNotes(data.laundryNotes);
      if (data.meals) setInlineVenueMeals(data.meals);
      if (data.mealsNotes) setInlineVenueMealsNotes(data.mealsNotes);
      toast({ title: "Tech Packet Parsed", description: "Venue fields auto-filled from document." });
    } catch {
      toast({ title: "Parse Failed", description: "Could not extract venue details.", variant: "destructive" });
    } finally {
      setIsParsingTechPacket(false);
      if (techPacketFileRef.current) techPacketFileRef.current.value = "";
    }
  }

  const resetInlineVenue = () => {
    setShowNewVenueForm(false);
    setInlineVenueName(""); setInlineVenueAddress(""); setInlineVenueContactName(""); setInlineVenueContactPhone("");
    setInlineVenueWifi(""); setInlineVenueWifiPassword(""); setInlineVenueParking(""); setInlineVenueLoadIn("");
    setInlineVenueCapacity(""); setInlineVenueDressingRooms(false); setInlineVenueDressingRoomsNotes("");
    setInlineVenueShowers(false); setInlineVenueShowersNotes(""); setInlineVenueLaundry(false); setInlineVenueLaundryNotes("");
    setInlineVenueMeals(""); setInlineVenueMealsNotes(""); setInlineVenueTechPacketUrl("");
    setInlineVenueLatitude(""); setInlineVenueLongitude("");
  };

  const hasVenue = venueId !== null;
  const selectedVenue = venues.find(v => v.id === venueId);
  const isMultiDay = startDate && endDate && startDate !== endDate;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: `${entityLabel} Created`, description: `${entityLabel} added to ${projectName}` });
      setOpen(false);
      setShowName(""); setNotes(""); setVenueId(null); setVenueForAllDays(false);
      setStartDate(format(new Date(), "yyyy-MM-dd")); setEndDate(format(new Date(), "yyyy-MM-dd"));
      resetInlineVenue();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!showName.trim()) return;
    createMutation.mutate({
      name: showName.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      venueId: venueId || undefined,
      venueForAllDays,
      notes: notes.trim() || undefined,
      projectId,
      legId: legId ?? undefined,
      eventType: eventTypeOverride || (isFestival ? "stage" : "show"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title={`Add ${entityLabel.toLowerCase()} to this project`} data-testid={`button-add-show-project-${projectId}${legId ? `-leg-${legId}` : ""}`}>
          <Plus className="w-4 h-4" />{buttonLabel && <span className="ml-1">{buttonLabel}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">New {entityLabel} for {projectName}</DialogTitle>
          <DialogDescription>Create a new {entityLabel.toLowerCase()} assigned to this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{entityLabel} Name</Label>
            <Input
              placeholder={isFestival ? "e.g. Main Stage, Second Stage" : "e.g. Main Concert, VIP Reception"}
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              data-testid="input-project-show-name"
            />
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChangeStart={setStartDate}
            onChangeEnd={setEndDate}
            testIdPrefix="project-show-date-range"
            label={`${entityLabel} Dates`}
          />
          <div>
            <Label className="text-sm font-medium">Venue (optional)</Label>
            <Popover open={venueSearchOpen} onOpenChange={setVenueSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={venueSearchOpen}
                  className={cn("w-full justify-between font-normal", !hasVenue ? "text-muted-foreground" : "")}
                  data-testid="select-project-show-venue"
                >
                  {selectedVenue ? selectedVenue.name : "Select a venue"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <Command>
                  <CommandInput placeholder="Search venues..." data-testid="input-project-venue-search" />
                  <CommandList>
                    <CommandEmpty>No venue found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="no-venue"
                        onSelect={() => { setVenueId(null); setVenueSearchOpen(false); resetInlineVenue(); }}
                        data-testid="project-venue-option-none"
                      >
                        <Check className={cn("mr-2 h-4 w-4", !hasVenue ? "opacity-100" : "opacity-0")} />
                        No venue
                      </CommandItem>
                      {venues.map(v => (
                        <CommandItem
                          key={v.id}
                          value={v.name}
                          onSelect={() => { setVenueId(v.id); setVenueSearchOpen(false); resetInlineVenue(); }}
                          data-testid={`project-venue-option-${v.id}`}
                        >
                          <Check className={cn("mr-2 h-4 w-4", venueId === v.id ? "opacity-100" : "opacity-0")} />
                          {v.name}
                        </CommandItem>
                      ))}
                      <CommandItem
                        value="create-new-venue"
                        onSelect={() => { setShowNewVenueForm(true); setVenueSearchOpen(false); }}
                        data-testid="project-venue-option-create"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Venue
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {showNewVenueForm && (
              <Card className="mt-2 bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-medium">New Venue</p>
                  <div className="flex items-center gap-2 p-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30">
                    <input
                      type="file"
                      ref={techPacketFileRef}
                      onChange={handleTechPacketUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      data-testid="input-project-tech-packet-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => techPacketFileRef.current?.click()}
                      disabled={isParsingTechPacket}
                      data-testid="button-project-upload-tech-packet"
                    >
                      {isParsingTechPacket ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Parsing...</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" />Parse Tech Packet</>
                      )}
                    </Button>
                    <span className="text-xs text-muted-foreground">Auto-fill from PDF/image</span>
                  </div>
                  <Input placeholder="Venue name" value={inlineVenueName} onChange={(e) => setInlineVenueName(e.target.value)} data-testid="input-project-venue-name" />
                  <PlacesAutocomplete
                    value={inlineVenueAddress}
                    onChange={setInlineVenueAddress}
                    onPlaceSelect={(place) => {
                      setInlineVenueAddress(place.address);
                      setInlineVenueLatitude(place.lat);
                      setInlineVenueLongitude(place.lng);
                      if (place.name && !inlineVenueName.trim()) {
                        setInlineVenueName(place.name);
                      }
                    }}
                    placeholder="Search for a venue or address..."
                    data-testid="input-project-venue-address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Contact name" value={inlineVenueContactName} onChange={(e) => setInlineVenueContactName(e.target.value)} data-testid="input-project-venue-contact-name" />
                    <Input placeholder="Contact phone" value={inlineVenueContactPhone} onChange={(e) => setInlineVenueContactPhone(e.target.value)} data-testid="input-project-venue-contact-phone" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="WiFi network" value={inlineVenueWifi} onChange={(e) => setInlineVenueWifi(e.target.value)} data-testid="input-project-venue-wifi" />
                    <Input placeholder="WiFi password" value={inlineVenueWifiPassword} onChange={(e) => setInlineVenueWifiPassword(e.target.value)} data-testid="input-project-venue-wifi-password" />
                  </div>
                  <Input placeholder="Parking details" value={inlineVenueParking} onChange={(e) => setInlineVenueParking(e.target.value)} data-testid="input-project-venue-parking" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Load-in details" value={inlineVenueLoadIn} onChange={(e) => setInlineVenueLoadIn(e.target.value)} data-testid="input-project-venue-load-in" />
                    <Input placeholder="Capacity" value={inlineVenueCapacity} onChange={(e) => setInlineVenueCapacity(e.target.value)} data-testid="input-project-venue-capacity" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox checked={inlineVenueDressingRooms} onCheckedChange={(c) => setInlineVenueDressingRooms(!!c)} data-testid="checkbox-project-venue-dressing-rooms" />
                      <span className="text-sm">Dressing Rooms</span>
                    </label>
                    {inlineVenueDressingRooms && <Input placeholder="Dressing room notes" value={inlineVenueDressingRoomsNotes} onChange={(e) => setInlineVenueDressingRoomsNotes(e.target.value)} data-testid="input-project-venue-dressing-rooms-notes" />}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox checked={inlineVenueShowers} onCheckedChange={(c) => setInlineVenueShowers(!!c)} data-testid="checkbox-project-venue-showers" />
                      <span className="text-sm">Showers</span>
                    </label>
                    {inlineVenueShowers && <Input placeholder="Shower notes" value={inlineVenueShowersNotes} onChange={(e) => setInlineVenueShowersNotes(e.target.value)} data-testid="input-project-venue-showers-notes" />}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox checked={inlineVenueLaundry} onCheckedChange={(c) => setInlineVenueLaundry(!!c)} data-testid="checkbox-project-venue-laundry" />
                      <span className="text-sm">Laundry</span>
                    </label>
                    {inlineVenueLaundry && <Input placeholder="Laundry notes" value={inlineVenueLaundryNotes} onChange={(e) => setInlineVenueLaundryNotes(e.target.value)} data-testid="input-project-venue-laundry-notes" />}
                  </div>
                  <Select value={inlineVenueMeals} onValueChange={setInlineVenueMeals}>
                    <SelectTrigger data-testid="select-project-venue-meals-trigger">
                      <SelectValue placeholder="Meals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No meals</SelectItem>
                      <SelectItem value="client_provided">Client Provided</SelectItem>
                      <SelectItem value="walkaway">Walkaway</SelectItem>
                    </SelectContent>
                  </Select>
                  {inlineVenueMeals && inlineVenueMeals !== "none" && <Input placeholder="Meal details" value={inlineVenueMealsNotes} onChange={(e) => setInlineVenueMealsNotes(e.target.value)} data-testid="input-project-venue-meals-notes" />}
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={resetInlineVenue}>Cancel</Button>
                    <Button type="button" size="sm" disabled={!inlineVenueName.trim() || createVenueMutation.isPending} onClick={() => {
                      createVenueMutation.mutate({
                        name: inlineVenueName.trim(),
                        address: inlineVenueAddress.trim() || "",
                        contactName: inlineVenueContactName.trim() || "",
                        contactPhone: inlineVenueContactPhone.trim() || "",
                        wifiSsid: inlineVenueWifi.trim() || "",
                        wifiPassword: inlineVenueWifiPassword.trim() || "",
                        parking: inlineVenueParking.trim() || "",
                        loadIn: inlineVenueLoadIn.trim() || "",
                        capacity: inlineVenueCapacity.trim() || "",
                        dressingRooms: inlineVenueDressingRooms,
                        dressingRoomsNotes: inlineVenueDressingRoomsNotes.trim() || "",
                        showers: inlineVenueShowers,
                        showersNotes: inlineVenueShowersNotes.trim() || "",
                        laundry: inlineVenueLaundry,
                        laundryNotes: inlineVenueLaundryNotes.trim() || "",
                        meals: inlineVenueMeals === "none" ? "" : inlineVenueMeals,
                        mealsNotes: inlineVenueMealsNotes.trim() || "",
                        techPacketUrl: inlineVenueTechPacketUrl || "",
                        latitude: inlineVenueLatitude || "",
                        longitude: inlineVenueLongitude || "",
                        notes: "",
                      }, {
                        onSuccess: (newVenue: any) => {
                          setVenueId(newVenue.id);
                          resetInlineVenue();
                          toast({ title: "Venue Created", description: `${newVenue.name} has been created and selected.` });
                        },
                        onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                      });
                    }} data-testid="button-save-project-venue">
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {hasVenue && isMultiDay && (
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id={`venueForAllDays-${projectId}`}
                  checked={venueForAllDays}
                  onCheckedChange={(checked) => setVenueForAllDays(checked === true)}
                  data-testid="checkbox-project-venue-all-days"
                />
                <Label htmlFor={`venueForAllDays-${projectId}`} className="text-sm cursor-pointer">
                  Same venue for all show days
                </Label>
              </div>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium">Notes (optional)</Label>
            <Textarea
              placeholder="Details about this show..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              data-testid="input-project-show-notes"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-project-show">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !showName.trim()} data-testid="button-submit-project-show">
              {createMutation.isPending ? "Creating..." : `Create ${entityLabel}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCrewManager({ projectId, projectName, label = "Festival Crew", isTour = false }: { projectId: number; projectName: string; label?: string; isTour?: boolean }) {
  const { data: contacts = [] } = useContacts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/project-assignments", projectId],
  });
  const assignedUserIds = new Set(assignments.map((a: any) => a.userId));
  const crewContacts = contacts.filter((c: Contact) =>
    (!c.contactType || c.contactType === "crew") && c.userId && !assignedUserIds.has(c.userId)
  );

  const assignMut = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", "/api/project-assignments", { userId, projectId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments"] });
      toast({ title: "Assigned", description: `Crew assigned to ${projectName}.` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/project-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments"] });
      toast({ title: "Removed", description: "Crew removed from festival." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const assignedContacts = assignments.map((a: any) => {
    const contact = contacts.find((c: Contact) => c.userId === a.userId);
    return { assignment: a, contact };
  }).filter(item => item.contact);

  return (
    <div className="space-y-2" data-testid={`project-crew-manager-${projectId}`}>
      <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">{label}</div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {assignedContacts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {assignedContacts.map(({ assignment, contact }) => (
                <Badge
                  key={assignment.id}
                  variant="secondary"
                  className="flex items-center gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  data-testid={`badge-project-crew-${assignment.id}`}
                >
                  <Users className="w-3 h-3" />
                  {[contact!.firstName, contact!.lastName].filter(Boolean).join(" ")}
                  <span className="text-[9px] opacity-70 ml-0.5">{isTour ? "All Shows" : "All Stages"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-0.5 no-default-hover-elevate"
                    onClick={() => removeMut.mutate(assignment.id)}
                    disabled={removeMut.isPending}
                    data-testid={`button-remove-project-crew-${assignment.id}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No crew assigned at festival level yet.</p>
          )}
          {crewContacts.length > 0 && (
            <Select
              value=""
              onValueChange={(userId) => {
                if (userId) assignMut.mutate(userId);
              }}
            >
              <SelectTrigger className="w-48 h-8 text-xs" data-testid={`select-assign-project-crew-${projectId}`}>
                <SelectValue placeholder="Add festival crew..." />
              </SelectTrigger>
              <SelectContent>
                {crewContacts.map((c: Contact) => (
                  <SelectItem key={c.id} value={c.userId!}>
                    {[c.firstName, c.lastName].filter(Boolean).join(" ")}
                    {c.role ? ` — ${c.role}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}
    </div>
  );
}

function StandaloneShowsSection({ venues }: { venues: Venue[] }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newVenueId, setNewVenueId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editVenueId, setEditVenueId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const standaloneShows = useMemo(() =>
    (eventsList as Event[])
      .filter((e: Event) => !e.projectId)
      .sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999")),
    [eventsList]
  );

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Show created" });
      setOpen(false);
      setNewName(""); setNewStartDate(""); setNewEndDate(""); setNewVenueId(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Show updated" });
      setEditingId(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/events/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Show deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startEdit = (show: Event) => {
    setEditingId(show.id);
    setEditName(show.name);
    setEditStartDate(show.startDate || "");
    setEditEndDate(show.endDate || "");
    setEditVenueId(show.venueId ?? null);
    setEditNotes(show.notes || "");
  };

  if (standaloneShows.length === 0 && !open) {
    return (
      <div className="mt-4 pt-4 border-t border-border/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unassigned Shows</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(true)} data-testid="button-add-standalone-show">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground italic mt-1">All shows are assigned to projects.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Unassigned Shows {standaloneShows.length > 0 ? `(${standaloneShows.length})` : ""}
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(!open)} data-testid="button-add-standalone-show">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {open && (
        <div className="border border-border/30 rounded-lg p-3 bg-muted/30 mb-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              createMutation.mutate({
                name: newName.trim(),
                startDate: newStartDate || undefined,
                endDate: newEndDate || undefined,
                venueId: newVenueId || undefined,
              });
            }}
            className="space-y-2"
          >
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Show name" data-testid="input-new-standalone-show-name" />
            <DateRangePicker startDate={newStartDate} endDate={newEndDate} onChangeStart={setNewStartDate} onChangeEnd={setNewEndDate} testIdPrefix="new-standalone-show" />
            <Select value={newVenueId !== null ? String(newVenueId) : "none"} onValueChange={(val) => setNewVenueId(val === "none" ? null : Number(val))}>
              <SelectTrigger data-testid="select-new-standalone-show-venue"><SelectValue placeholder="Venue (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No venue</SelectItem>
                {venues.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} data-testid="button-cancel-standalone-show"><X className="w-3 h-3 mr-1" />Cancel</Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending || !newName.trim()} data-testid="button-create-standalone-show"><Plus className="w-3 h-3 mr-1" />Create</Button>
            </div>
          </form>
        </div>
      )}
      <div className="space-y-1">
        {standaloneShows.map(show => (
          editingId === show.id ? (
            <div key={show.id} className="border border-border/30 rounded-lg p-3 bg-muted/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editName.trim()) return;
                  updateMutation.mutate({ id: show.id, data: {
                    name: editName.trim(),
                    startDate: editStartDate || null,
                    endDate: editEndDate || null,
                    venueId: editVenueId,
                    notes: editNotes.trim() || null,
                  }});
                }}
                className="space-y-2"
              >
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Show name" data-testid={`input-edit-standalone-show-name-${show.id}`} />
                <DateRangePicker startDate={editStartDate} endDate={editEndDate} onChangeStart={setEditStartDate} onChangeEnd={setEditEndDate} testIdPrefix={`edit-standalone-show-date-${show.id}`} />
                <Select value={editVenueId !== null ? String(editVenueId) : "none"} onValueChange={(val) => setEditVenueId(val === "none" ? null : Number(val))}>
                  <SelectTrigger data-testid={`select-edit-standalone-show-venue-${show.id}`}><SelectValue placeholder="Venue (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No venue</SelectItem>
                    {venues.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes (optional)" rows={2} data-testid={`input-edit-standalone-show-notes-${show.id}`} />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}><X className="w-3 h-3 mr-1" />Cancel</Button>
                  <Button type="submit" size="sm" disabled={updateMutation.isPending}><Save className="w-3 h-3 mr-1" />Save</Button>
                </div>
              </form>
            </div>
          ) : (
            <div key={show.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 group" data-testid={`row-standalone-show-${show.id}`}>
              <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground/40" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid={`text-standalone-show-name-${show.id}`}>{show.name}</p>
                {(show.startDate || show.endDate) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {show.startDate === show.endDate ? show.startDate : `${show.startDate ?? "?"} → ${show.endDate ?? "?"}`}
                    {show.venueId && venues.find(v => v.id === show.venueId) && ` · ${venues.find(v => v.id === show.venueId)!.name}`}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(show)} data-testid={`button-edit-standalone-show-${show.id}`}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <ConfirmDelete
                  onConfirm={() => deleteMutation.mutate(show.id)}
                  title="Delete show?"
                  description={`Delete "${show.name}"? This cannot be undone.`}
                  triggerVariant="ghost"
                  triggerSize="icon"
                  triggerClassName="h-7 w-7 text-destructive hover:text-destructive"
                  triggerLabel={<Trash2 className="w-3 h-3" />}
                  data-testid={`button-delete-standalone-show-${show.id}`}
                />
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function ProjectShowsSection({ projectId, isFestival, isTour, venues, projectName }: {
  projectId: number;
  isFestival: boolean;
  isTour?: boolean;
  venues: Venue[];
  projectName: string;
}) {
  const entityLabel = isFestival ? "Stage" : "Show";
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editVenueId, setEditVenueId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [addTravelOpen, setAddTravelOpen] = useState(false);
  const [newTravel, setNewTravel] = useState({ date: "", notes: "", flightNumber: "", airline: "", departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: "" });
  const resetTravelForm = () => setNewTravel({ date: "", notes: "", flightNumber: "", airline: "", departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const { data: travelDays = [] } = useQuery<TravelDay[]>({
    queryKey: ["/api/projects", projectId, "travel-days"],
  });

  const createTravelDayMutation = useMutation({
    mutationFn: async (data: { date: string; legId: number | null; notes?: string; flightNumber?: string; airline?: string; departureAirport?: string; arrivalAirport?: string; departureTime?: string; arrivalTime?: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/travel-days`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "travel-days"] });
      setAddTravelOpen(false);
      resetTravelForm();
      toast({ title: "Travel day added" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteTravelDayMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/travel-days/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "travel-days"] });
      toast({ title: "Travel day deleted" });
    },
  });

  const shows = useMemo(() =>
    (eventsList as Event[])
      .filter((e: any) => e.projectId === projectId && ((!isTour && !isFestival) || !e.legId))
      .sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999")),
    [eventsList, projectId, isTour]
  );

  type ListItem = { type: "show"; show: Event; date: string } | { type: "travel"; td: TravelDay; date: string };
  const mergedItems = useMemo((): ListItem[] => {
    const showItems: ListItem[] = shows.map(s => ({ type: "show" as const, show: s, date: s.startDate || "9999" }));
    const filteredTravel = isTour ? travelDays.filter(td => !td.legId) : travelDays;
    const travelItems: ListItem[] = filteredTravel.map(td => ({ type: "travel" as const, td, date: td.date }));
    return [...showItems, ...travelItems].sort((a, b) => a.date.localeCompare(b.date));
  }, [shows, travelDays]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: `${entityLabel} updated` });
      setEditingId(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/events/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: `${entityLabel} deleted` });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startEdit = (show: Event) => {
    setEditingId(show.id);
    setEditName(show.name);
    setEditStartDate(show.startDate || "");
    setEditEndDate(show.endDate || "");
    setEditVenueId(show.venueId ?? null);
    setEditNotes(show.notes || "");
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {isTour ? "Unassigned " : ""}{entityLabel}s{travelDays.length > 0 ? " & Travel" : ""} {mergedItems.length > 0 ? `(${mergedItems.length})` : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setAddTravelOpen(true)} data-testid={`button-add-travel-day-${projectId}`}>
            <Plane className="w-3.5 h-3.5 mr-1" /> Travel Day
          </Button>
          <CreateShowForProjectDialog projectId={projectId} projectName={projectName} venues={venues} isFestival={isFestival} />
        </div>
      </div>
      <div className="space-y-1">
        {mergedItems.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-1">No {entityLabel.toLowerCase()}s yet. Add one above.</p>
        )}
        {mergedItems.map(item => {
          if (item.type === "travel") {
            const td = item.td;
            return (
              <div key={`td-${td.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-400/20 group" data-testid={`travel-day-${td.id}`}>
                <Plane className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{td.date}</span>
                  {td.airline && td.flightNumber && (
                    <span className="text-xs text-muted-foreground ml-2">{td.airline} {td.flightNumber}</span>
                  )}
                  {td.departureAirport && td.arrivalAirport && (
                    <span className="text-xs text-muted-foreground ml-2">{td.departureAirport} → {td.arrivalAirport}</span>
                  )}
                  {td.notes && <span className="text-xs text-muted-foreground ml-2">· {td.notes}</span>}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ConfirmDelete
                    onConfirm={() => deleteTravelDayMutation.mutate(td.id)}
                    title="Delete travel day?"
                    description="This will remove the travel day and all crew travel details."
                    triggerVariant="ghost"
                    triggerSize="icon"
                    triggerClassName="h-7 w-7 text-destructive hover:text-destructive"
                    triggerLabel={<Trash2 className="w-3 h-3" />}
                  />
                </div>
              </div>
            );
          }
          const show = item.show;
          return editingId === show.id ? (
            <div key={show.id} className="border border-border/30 rounded-lg p-3 bg-muted/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editName.trim()) return;
                  if (editStartDate && editEndDate && editStartDate > editEndDate) {
                    toast({ title: "Invalid dates", description: "End date must be on or after start date.", variant: "destructive" });
                    return;
                  }
                  updateMutation.mutate({ id: show.id, data: {
                    name: editName.trim(),
                    startDate: editStartDate || null,
                    endDate: editEndDate || null,
                    venueId: editVenueId,
                    notes: editNotes.trim() || null,
                    projectId,
                  }});
                }}
                className="space-y-2"
              >
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder={`${entityLabel} name`} data-testid={`input-edit-show-name-${show.id}`} />
                <DateRangePicker startDate={editStartDate} endDate={editEndDate} onChangeStart={setEditStartDate} onChangeEnd={setEditEndDate} testIdPrefix={`edit-show-date-${show.id}`} />
                <Select value={editVenueId !== null ? String(editVenueId) : "none"} onValueChange={(val) => setEditVenueId(val === "none" ? null : Number(val))}>
                  <SelectTrigger data-testid={`select-edit-show-venue-${show.id}`}><SelectValue placeholder="Venue (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No venue</SelectItem>
                    {venues.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes (optional)" rows={2} data-testid={`input-edit-show-notes-${show.id}`} />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)} data-testid={`button-cancel-edit-show-${show.id}`}><X className="w-3 h-3 mr-1" />Cancel</Button>
                  <Button type="submit" size="sm" disabled={updateMutation.isPending} data-testid={`button-save-edit-show-${show.id}`}><Save className="w-3 h-3 mr-1" />Save</Button>
                </div>
              </form>
            </div>
          ) : (
            <div key={show.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 group" data-testid={`row-show-${show.id}`}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: show.color || "hsl(var(--primary))" }} />
              <div className="flex-1 min-w-0">
                <Link href={`/dashboard?event=${encodeURIComponent(show.name)}${show.startDate ? `&date=${show.startDate}` : ""}`} className="text-sm font-medium truncate hover:underline hover:text-primary block" data-testid={`text-show-name-${show.id}`}>{show.name}</Link>
                {(show.startDate || show.endDate) && (
                  <p className="text-xs text-muted-foreground truncate" data-testid={`text-show-dates-${show.id}`}>
                    {show.startDate === show.endDate
                      ? show.startDate
                      : `${show.startDate ?? "?"} → ${show.endDate ?? "?"}`}
                    {show.venueId && venues.find(v => v.id === show.venueId) && ` · ${venues.find(v => v.id === show.venueId)!.name}`}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(show)} data-testid={`button-edit-show-${show.id}`}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <ConfirmDelete
                  onConfirm={() => deleteMutation.mutate(show.id)}
                  title={`Delete ${entityLabel.toLowerCase()}?`}
                  description={`Delete "${show.name}"? This cannot be undone.`}
                  triggerVariant="ghost"
                  triggerSize="icon"
                  triggerClassName="h-7 w-7 text-destructive hover:text-destructive"
                  triggerLabel={<Trash2 className="w-3 h-3" />}
                  data-testid={`button-delete-show-${show.id}`}
                />
              </div>
            </div>
          );
        })}
      </div>

          {/* Add Travel Day Dialog */}
          <Dialog open={addTravelOpen} onOpenChange={(o) => { if (!o) { setAddTravelOpen(false); resetTravelForm(); } }}>
            <DialogContent className="sm:max-w-[480px] font-body max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">
                  Add Travel Day
                </DialogTitle>
                <DialogDescription className="sr-only">Add a travel day with flight details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
                <div>
                  <Label>Date</Label>
                  <DatePicker value={newTravel.date} onChange={(v) => setNewTravel(p => ({ ...p, date: v }))} />
                </div>
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flight Details (Optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Airline</Label>
                    <Input placeholder="e.g. United" value={newTravel.airline} onChange={e => setNewTravel(p => ({ ...p, airline: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Flight Number</Label>
                    <Input placeholder="e.g. UA1234" value={newTravel.flightNumber} onChange={e => setNewTravel(p => ({ ...p, flightNumber: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Departure Airport</Label>
                    <Input placeholder="e.g. SFO" value={newTravel.departureAirport} onChange={e => setNewTravel(p => ({ ...p, departureAirport: e.target.value.toUpperCase() }))} className="mt-1" maxLength={4} />
                  </div>
                  <div>
                    <Label>Arrival Airport</Label>
                    <Input placeholder="e.g. LAX" value={newTravel.arrivalAirport} onChange={e => setNewTravel(p => ({ ...p, arrivalAirport: e.target.value.toUpperCase() }))} className="mt-1" maxLength={4} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Departure Time</Label>
                    <TimePicker value={newTravel.departureTime} onChange={(v) => setNewTravel(p => ({ ...p, departureTime: v }))} />
                  </div>
                  <div>
                    <Label>Arrival Time</Label>
                    <TimePicker value={newTravel.arrivalTime} onChange={(v) => setNewTravel(p => ({ ...p, arrivalTime: v }))} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional travel notes..." value={newTravel.notes} onChange={e => setNewTravel(p => ({ ...p, notes: e.target.value }))} className="mt-1 resize-none" rows={2} />
                </div>
              </div>
              <Button
                className="w-full flex-shrink-0 mt-3"
                onClick={() => newTravel.date && createTravelDayMutation.mutate({
                  date: newTravel.date,
                  legId: null,
                  notes: newTravel.notes || undefined,
                  flightNumber: newTravel.flightNumber || undefined,
                  airline: newTravel.airline || undefined,
                  departureAirport: newTravel.departureAirport || undefined,
                  arrivalAirport: newTravel.arrivalAirport || undefined,
                  departureTime: newTravel.departureTime || undefined,
                  arrivalTime: newTravel.arrivalTime || undefined,
                })}
                disabled={!newTravel.date || createTravelDayMutation.isPending}
              >
                {createTravelDayMutation.isPending ? "Adding..." : "Add Travel Day"}
              </Button>
            </DialogContent>
          </Dialog>
    </div>
  );
}

function ProjectLegsSection({ projectId, projectName, venues, isFestival }: { projectId: number; projectName: string; venues: Venue[]; isFestival?: boolean }) {
  const containerLabel = isFestival ? "Festival" : "Leg / Run";
  const containersLabel = isFestival ? "Festivals" : "Legs / Runs";
  const entityLabel = isFestival ? "Stage" : "Show";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editLegId, setEditLegId] = useState<number | null>(null);
  const [addShowsToLegId, setAddShowsToLegId] = useState<number | null>(null);
  const [selectedShowIds, setSelectedShowIds] = useState<Set<number>>(new Set());
  const [expandedLegs, setExpandedLegs] = useState<Record<number, boolean>>({});
  const [newLeg, setNewLeg] = useState({ name: "", notes: "", showCount: 0, startDate: "", endDate: "", stageCount: 0 });
  const [editLegData, setEditLegData] = useState({ name: "", notes: "", startDate: "", endDate: "" });
  const [cascadeConfirmOpen, setCascadeConfirmOpen] = useState(false);
  const [pendingLegUpdate, setPendingLegUpdate] = useState<{ id: number; data: any; oldStartDate: string; oldEndDate: string } | null>(null);
  const [addTravelLegId, setAddTravelLegId] = useState<number | null>(null);
  const [newTravel, setNewTravel] = useState({
    date: "", notes: "", flightNumber: "", airline: "",
    departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: ""
  });
  const resetTravelForm = () => setNewTravel({
    date: "", notes: "", flightNumber: "", airline: "",
    departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: ""
  });

  const { data: legs = [] } = useQuery<Leg[]>({
    queryKey: ["/api/projects", projectId, "legs"],
  });
  const { data: allEvents = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: travelDays = [] } = useQuery<TravelDay[]>({
    queryKey: ["/api/projects", projectId, "travel-days"],
  });
  const projectEvents = useMemo(() => allEvents.filter(e => e.projectId === projectId), [allEvents, projectId]);
  const unassignedShows = useMemo(() => projectEvents.filter((e: any) => !e.legId).sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "")), [projectEvents]);

  const createLegMutation = useMutation({
    mutationFn: async (data: { name: string; notes?: string; showCount?: number; startDate?: string; stageCount?: number; endDate?: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/legs`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "legs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setAddOpen(false);
      setNewLeg({ name: "", notes: "", showCount: 0, startDate: "", endDate: "", stageCount: 0 });
      toast({ title: `${containerLabel} created` });
    },
  });

  const updateLegMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; notes: string; startDate?: string; endDate?: string } }) => {
      const res = await apiRequest("PATCH", `/api/legs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "legs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditLegId(null);
      toast({ title: `${containerLabel} updated` });
    },
  });

  const cascadeDatesMutation = useMutation({
    mutationFn: async ({ legId, oldStartDate, oldEndDate, newStartDate, newEndDate }: { legId: number; oldStartDate: string; oldEndDate: string; newStartDate: string; newEndDate: string }) => {
      const legEvents = projectEvents.filter((e: any) => e.legId === legId);
      const oldStart = new Date(oldStartDate + "T00:00:00");
      const oldEnd = new Date(oldEndDate + "T00:00:00");
      const newStart = new Date(newStartDate + "T00:00:00");
      const newEnd = new Date(newEndDate + "T00:00:00");

      const updates = legEvents.map(ev => {
        const patch: any = {};
        if (ev.startDate) {
          const evStart = new Date(ev.startDate + "T00:00:00");
          const startOffsetDays = Math.round((evStart.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));
          const newEvStart = new Date(newStart);
          newEvStart.setDate(newEvStart.getDate() + startOffsetDays);
          patch.startDate = newEvStart.toISOString().split("T")[0];
        }
        if (ev.endDate) {
          const evEnd = new Date(ev.endDate + "T00:00:00");
          const endOffsetFromEnd = Math.round((oldEnd.getTime() - evEnd.getTime()) / (1000 * 60 * 60 * 24));
          const newEvEnd = new Date(newEnd);
          newEvEnd.setDate(newEvEnd.getDate() - endOffsetFromEnd);
          patch.endDate = newEvEnd.toISOString().split("T")[0];
        }
        return { id: ev.id, patch };
      }).filter(u => u.patch.startDate || u.patch.endDate);

      await Promise.all(updates.map(u => apiRequest("PATCH", `/api/events/${u.id}`, u.patch)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event dates updated to match new festival dates" });
    },
  });

  const deleteLegMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/legs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "legs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: `${containerLabel} deleted, ${entityLabel.toLowerCase()}s moved to Unassigned` });
    },
  });

  const moveToLegMutation = useMutation({
    mutationFn: async ({ eventIds, legId }: { eventIds: number[]; legId: number | null }) => {
      await Promise.all(eventIds.map(id => apiRequest("PATCH", `/api/events/${id}`, { legId })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setAddShowsToLegId(null);
      setSelectedShowIds(new Set());
      toast({ title: `${entityLabel}s moved` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/events/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Show deleted" });
    },
  });

  const createTravelDayMutation = useMutation({
    mutationFn: async (data: { date: string; legId: number | null; notes?: string; flightNumber?: string; airline?: string; departureAirport?: string; arrivalAirport?: string; departureTime?: string; arrivalTime?: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/travel-days`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "travel-days"] });
      setAddTravelLegId(null);
      resetTravelForm();
      toast({ title: "Travel day added" });
    },
  });

  const deleteTravelDayMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/travel-days/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "travel-days"] });
      toast({ title: "Travel day removed" });
    },
  });

  return (
    <div className="mt-3 border-t border-blue-500/10 pt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{containersLabel}</h4>
        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => setAddOpen(true)} data-testid={`button-add-leg-${projectId}`}>
          <Plus className="w-3 h-3 mr-1" /> Add {containerLabel}
        </Button>
      </div>

      {legs.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No {containersLabel.toLowerCase()} yet. Create one to organize {entityLabel.toLowerCase()}s.</p>
      )}

      <div className="space-y-2">
        {[...legs].sort((a, b) => {
          const aShows = projectEvents.filter((e: any) => e.legId === a.id);
          const bShows = projectEvents.filter((e: any) => e.legId === b.id);
          const aDate = aShows.reduce((min, e) => e.startDate && e.startDate < min ? e.startDate : min, "9999");
          const bDate = bShows.reduce((min, e) => e.startDate && e.startDate < min ? e.startDate : min, "9999");
          return aDate.localeCompare(bDate);
        }).map(leg => {
          const legShows = projectEvents.filter((e: any) => e.legId === leg.id).sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
          const legTravelDays = travelDays.filter(td => td.legId === leg.id).sort((a, b) => a.date.localeCompare(b.date));
          const isExpanded = expandedLegs[leg.id] ?? false;
          return (
            <div key={leg.id} className="rounded-lg border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 p-2.5">
                <button className="flex-1 min-w-0 text-left flex items-center gap-2" onClick={() => setExpandedLegs(prev => ({ ...prev, [leg.id]: !prev[leg.id] }))}>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  <div className="min-w-0">
                    <Link href={`/project/${projectId}?from=admin`} className="text-sm font-medium truncate hover:underline hover:text-primary block" onClick={(e: React.MouseEvent) => e.stopPropagation()}>{leg.name}</Link>
                    <p className="text-xs text-muted-foreground">{(() => {
                      if (isFestival) {
                        const stages = legShows.filter((e: any) => e.eventType !== "area");
                        const areas = legShows.filter((e: any) => e.eventType === "area");
                        const parts: string[] = [];
                        if (stages.length > 0) parts.push(`${stages.length} stage${stages.length !== 1 ? "s" : ""}`);
                        if (areas.length > 0) parts.push(`${areas.length} area${areas.length !== 1 ? "s" : ""}`);
                        return parts.join(" · ") || "empty";
                      }
                      const parts: string[] = [];
                      parts.push(`${legShows.length} show${legShows.length !== 1 ? "s" : ""}`);
                      if (legTravelDays.length > 0) parts.push(`${legTravelDays.length} travel day${legTravelDays.length !== 1 ? "s" : ""}`);
                      return parts.join(" · ");
                    })()}{(() => {
                      let ds = leg.startDate;
                      let de = leg.endDate;
                      if (!ds && legShows.length > 0) {
                        const starts = legShows.map(e => e.startDate).filter(Boolean).sort();
                        const ends = legShows.map(e => e.endDate).filter(Boolean).sort();
                        if (starts.length) ds = starts[0];
                        if (ends.length) de = ends[ends.length - 1];
                      }
                      return ds ? ` · ${format(new Date(ds + "T00:00:00"), "MMM d")}${de && de !== ds ? ` – ${format(new Date(de + "T00:00:00"), "MMM d")}` : ""}` : "";
                    })()}{leg.notes ? ` · ${leg.notes}` : ""}</p>
                  </div>
                </button>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => { setAddShowsToLegId(leg.id); setSelectedShowIds(new Set()); }} disabled={unassignedShows.length === 0} data-testid={`button-add-shows-leg-${leg.id}`}>
                  <Plus className="w-3 h-3 mr-1" /> {entityLabel}s
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditLegId(leg.id); setEditLegData({ name: leg.name, notes: leg.notes || "", startDate: leg.startDate || "", endDate: leg.endDate || "" }); }} data-testid={`button-edit-leg-${leg.id}`}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <ConfirmDelete
                  onConfirm={() => deleteLegMutation.mutate(leg.id)}
                  title={`Delete ${containerLabel}?`}
                  description={`${entityLabel}s in this ${containerLabel.toLowerCase()} will be moved to Unassigned. This cannot be undone.`}
                  triggerClassName="text-muted-foreground h-6 w-6"
                  triggerLabel={<Trash2 className="w-3 h-3" />}
                  data-testid={`button-delete-leg-${leg.id}`}
                />
              </div>
              {isExpanded && (legShows.length > 0 || legTravelDays.length > 0) && (() => {
                const items: ({ kind: "show"; show: Event; date: string } | { kind: "travel"; td: TravelDay; date: string })[] = [
                  ...legShows.map(s => ({ kind: "show" as const, show: s, date: s.startDate || "9999" })),
                  ...legTravelDays.map(td => ({ kind: "travel" as const, td, date: td.date })),
                ];
                items.sort((a, b) => a.date.localeCompare(b.date));
                return (
                <div className="border-t border-blue-500/10 px-2.5 pb-2 pt-1 space-y-0.5">
                  {items.map(item => item.kind === "show" ? (
                    <div key={item.show.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 group" data-testid={`row-leg-show-${item.show.id}`}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.show.color || "hsl(var(--primary))" }} />
                      <div className="flex-1 min-w-0">
                        <Link href={`/dashboard?event=${encodeURIComponent(item.show.name)}${item.show.startDate ? `&date=${item.show.startDate}` : ""}`} className="text-sm font-medium truncate hover:underline hover:text-primary block">{item.show.name}</Link>
                        {(item.show.startDate || item.show.endDate) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.show.startDate === item.show.endDate ? item.show.startDate : `${item.show.startDate ?? "?"} → ${item.show.endDate ?? "?"}`}
                            {item.show.venueId && venues.find(v => v.id === item.show.venueId) && ` · ${venues.find(v => v.id === item.show.venueId)!.name}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Remove from leg" onClick={() => moveToLegMutation.mutate({ eventIds: [item.show.id], legId: null })}>
                          <X className="w-3 h-3" />
                        </Button>
                        <ConfirmDelete
                          onConfirm={() => deleteMutation.mutate(item.show.id)}
                          title="Delete show?"
                          description={`Delete "${item.show.name}"? This cannot be undone.`}
                          triggerVariant="ghost"
                          triggerSize="icon"
                          triggerClassName="h-6 w-6 text-destructive hover:text-destructive"
                          triggerLabel={<Trash2 className="w-3 h-3" />}
                          data-testid={`button-delete-leg-show-${item.show.id}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div key={`td-${item.td.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-400/20 group" data-testid={`row-leg-travel-${item.td.id}`}>
                      <Plane className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Travel Day</span>
                        <p className="text-xs text-muted-foreground truncate">
                          {format(new Date(item.td.date + "T00:00:00"), "EEE, MMM d")}
                          {item.td.airline && ` · ${item.td.airline}`}
                          {item.td.flightNumber && ` ${item.td.flightNumber}`}
                          {item.td.departureAirport && item.td.arrivalAirport && ` · ${item.td.departureAirport} → ${item.td.arrivalAirport}`}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ConfirmDelete
                          onConfirm={() => deleteTravelDayMutation.mutate(item.td.id)}
                          title="Delete travel day?"
                          description="This will remove the travel day and all crew travel details."
                          triggerVariant="ghost"
                          triggerSize="icon"
                          triggerClassName="h-6 w-6 text-destructive hover:text-destructive"
                          triggerLabel={<Trash2 className="w-3 h-3" />}
                          data-testid={`button-delete-leg-travel-${item.td.id}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
              {isExpanded && (
                <div className={`border-t border-blue-500/10 px-2.5 ${legShows.length === 0 ? "py-2" : "pb-2 pt-1"}`}>
                  {legShows.length === 0 && <p className="text-xs text-muted-foreground italic mb-1">No {entityLabel.toLowerCase()}s in this {containerLabel.toLowerCase()} yet.</p>}
                  <div className="flex gap-2 flex-wrap">
                    <CreateShowForProjectDialog projectId={projectId} projectName={projectName} venues={venues} isFestival={isFestival} legId={leg.id} buttonLabel={`Add ${entityLabel}`} defaultStartDate={leg.startDate || undefined} defaultEndDate={leg.endDate || undefined} />
                    {isFestival && (
                      <CreateShowForProjectDialog projectId={projectId} projectName={projectName} venues={venues} isFestival={isFestival} legId={leg.id} buttonLabel="Add Area" eventTypeOverride="area" defaultStartDate={leg.startDate || undefined} defaultEndDate={leg.endDate || undefined} />
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setAddTravelLegId(leg.id); resetTravelForm(); if (leg.startDate) setNewTravel(p => ({ ...p, date: leg.startDate! })); }}>
                      <Plane className="w-4 h-4" /><span className="ml-1">Add Travel Day</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(() => {
        const unassignedTravel = travelDays.filter(td => !td.legId).sort((a, b) => a.date.localeCompare(b.date));
        if (unassignedTravel.length === 0) return null;
        return (
          <div className="mt-3 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Unassigned Travel Days</p>
            {unassignedTravel.map(td => (
              <div key={`td-${td.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-400/20 group">
                <Plane className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Travel Day</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {format(new Date(td.date + "T00:00:00"), "EEE, MMM d")}
                    {td.airline && ` · ${td.airline}`}
                    {td.flightNumber && ` ${td.flightNumber}`}
                    {td.departureAirport && td.arrivalAirport && ` · ${td.departureAirport} → ${td.arrivalAirport}`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ConfirmDelete
                    onConfirm={() => deleteTravelDayMutation.mutate(td.id)}
                    title="Delete travel day?"
                    description="This will remove the travel day and all crew travel details."
                    triggerVariant="ghost"
                    triggerSize="icon"
                    triggerClassName="h-6 w-6 text-destructive hover:text-destructive"
                    triggerLabel={<Trash2 className="w-3 h-3" />}
                    data-testid={`button-delete-travel-${td.id}`}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Create Leg/Festival Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setNewLeg({ name: "", notes: "", showCount: 0, startDate: "", endDate: "", stageCount: 0 }); }}>
        <DialogContent className="sm:max-w-[420px] font-body">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">New {containerLabel}</DialogTitle>
            <DialogDescription className="sr-only">Create a new {containerLabel.toLowerCase()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input placeholder={isFestival ? "e.g. Aftershock" : "e.g. US West Coast Run"} value={newLeg.name} onChange={e => setNewLeg(p => ({ ...p, name: e.target.value }))} className="mt-1" data-testid="input-leg-name" />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Additional notes..." value={newLeg.notes} onChange={e => setNewLeg(p => ({ ...p, notes: e.target.value }))} className="mt-1 resize-none" rows={2} data-testid="input-leg-notes" />
            </div>
            <Separator />
            {isFestival ? (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auto-Generate Stages</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Number of Stages</Label>
                    <Input type="number" min={0} max={50} value={newLeg.stageCount || ""} onChange={e => setNewLeg(p => ({ ...p, stageCount: parseInt(e.target.value) || 0 }))} className="mt-1" placeholder="0" data-testid="input-leg-stage-count" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <DatePicker value={newLeg.startDate} onChange={(v) => setNewLeg(p => ({ ...p, startDate: v }))} data-testid="input-leg-start-date" />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <DatePicker value={newLeg.endDate} onChange={(v) => setNewLeg(p => ({ ...p, endDate: v }))} data-testid="input-leg-end-date" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Each stage spans the full festival date range. Leave at 0 to create an empty festival.</p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auto-Generate Shows</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Number of Shows</Label>
                    <Input type="number" min={0} max={100} value={newLeg.showCount || ""} onChange={e => setNewLeg(p => ({ ...p, showCount: parseInt(e.target.value) || 0 }))} className="mt-1" placeholder="0" data-testid="input-leg-show-count" />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <DatePicker value={newLeg.startDate} onChange={(v) => setNewLeg(p => ({ ...p, startDate: v }))} data-testid="input-leg-start-date" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Leave at 0 to create an empty leg.</p>
              </>
            )}
          </div>
          <Button
            className="w-full mt-3"
            onClick={() => newLeg.name.trim() && createLegMutation.mutate({
              name: newLeg.name.trim(),
              notes: newLeg.notes || undefined,
              ...(isFestival ? {
                stageCount: newLeg.stageCount || undefined,
                startDate: newLeg.startDate || undefined,
                endDate: newLeg.endDate || undefined,
              } : {
                showCount: newLeg.showCount || undefined,
                startDate: newLeg.startDate || undefined,
              }),
            })}
            disabled={!newLeg.name.trim() || createLegMutation.isPending}
            data-testid="button-save-leg"
          >
            {createLegMutation.isPending ? "Creating..." : `Create ${containerLabel}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Leg Dialog */}
      <Dialog open={editLegId !== null} onOpenChange={(o) => { if (!o) setEditLegId(null); }}>
        <DialogContent className="sm:max-w-[420px] font-body">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Edit {containerLabel}</DialogTitle>
            <DialogDescription className="sr-only">Edit {containerLabel.toLowerCase()} details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editLegData.name} onChange={e => setEditLegData(p => ({ ...p, name: e.target.value }))} className="mt-1" data-testid="input-edit-leg-name" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={editLegData.notes} onChange={e => setEditLegData(p => ({ ...p, notes: e.target.value }))} className="mt-1 resize-none" rows={2} data-testid="input-edit-leg-notes" />
            </div>
            {isFestival && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <div className="mt-1">
                    <DatePicker value={editLegData.startDate} onChange={(v) => setEditLegData(p => ({ ...p, startDate: v }))} maxDate={editLegData.endDate || undefined} data-testid="input-edit-leg-start-date" />
                  </div>
                </div>
                <div>
                  <Label>End Date</Label>
                  <div className="mt-1">
                    <DatePicker value={editLegData.endDate} onChange={(v) => setEditLegData(p => ({ ...p, endDate: v }))} minDate={editLegData.startDate || undefined} data-testid="input-edit-leg-end-date" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            className="w-full mt-3"
            onClick={() => {
              if (!editLegId || !editLegData.name.trim()) return;
              const leg = legs.find(l => l.id === editLegId);
              const oldStartDate = leg?.startDate || "";
              const oldEndDate = leg?.endDate || "";
              const datesChanged = isFestival && (editLegData.startDate !== oldStartDate || editLegData.endDate !== oldEndDate);
              const hasChildEvents = isFestival && projectEvents.some((e: any) => e.legId === editLegId);
              const hasBothOldDates = oldStartDate && oldEndDate;

              if (datesChanged && hasChildEvents && hasBothOldDates && editLegData.startDate && editLegData.endDate) {
                setPendingLegUpdate({ id: editLegId, data: { name: editLegData.name.trim(), notes: editLegData.notes, startDate: editLegData.startDate, endDate: editLegData.endDate }, oldStartDate, oldEndDate });
                setCascadeConfirmOpen(true);
              } else {
                updateLegMutation.mutate({ id: editLegId, data: { name: editLegData.name.trim(), notes: editLegData.notes, ...(isFestival ? { startDate: editLegData.startDate || undefined, endDate: editLegData.endDate || undefined } : {}) } });
              }
            }}
            disabled={!editLegData.name.trim() || updateLegMutation.isPending}
            data-testid="button-update-leg"
          >
            {updateLegMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Cascade Date Confirmation Dialog */}
      <Dialog open={cascadeConfirmOpen} onOpenChange={(o) => { if (!o) setCascadeConfirmOpen(false); }}>
        <DialogContent className="sm:max-w-[420px] font-body">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Update Event Dates?</DialogTitle>
            <DialogDescription>
              Shift all stages and areas to match the new festival dates? Individual date offsets will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button className="flex-1" onClick={async () => {
              if (!pendingLegUpdate) return;
              await updateLegMutation.mutateAsync({ id: pendingLegUpdate.id, data: pendingLegUpdate.data });
              await cascadeDatesMutation.mutateAsync({
                legId: pendingLegUpdate.id,
                oldStartDate: pendingLegUpdate.oldStartDate,
                oldEndDate: pendingLegUpdate.oldEndDate,
                newStartDate: pendingLegUpdate.data.startDate,
                newEndDate: pendingLegUpdate.data.endDate,
              });
              setCascadeConfirmOpen(false);
              setPendingLegUpdate(null);
            }} disabled={updateLegMutation.isPending || cascadeDatesMutation.isPending}>
              {(updateLegMutation.isPending || cascadeDatesMutation.isPending) ? "Updating..." : "Yes, shift all dates"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => {
              if (!pendingLegUpdate) return;
              updateLegMutation.mutate({ id: pendingLegUpdate.id, data: pendingLegUpdate.data });
              setCascadeConfirmOpen(false);
              setPendingLegUpdate(null);
            }} disabled={updateLegMutation.isPending}>
              No, just update festival
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Shows to Leg Dialog */}
      <Dialog open={addShowsToLegId !== null} onOpenChange={(o) => { if (!o) { setAddShowsToLegId(null); setSelectedShowIds(new Set()); } }}>
        <DialogContent className="sm:max-w-[420px] font-body max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">
              Add {entityLabel}s to {legs.find(l => l.id === addShowsToLegId)?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Select unassigned {entityLabel.toLowerCase()}s to add</DialogDescription>
          </DialogHeader>
          {unassignedShows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No unassigned {entityLabel.toLowerCase()}s available.</p>
          ) : (
            <>
              <label className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer border-b border-border mb-1">
                <Checkbox
                  checked={selectedShowIds.size === unassignedShows.length && unassignedShows.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedShowIds(new Set(unassignedShows.map(e => e.id)));
                    } else {
                      setSelectedShowIds(new Set());
                    }
                  }}
                />
                <p className="text-sm font-medium">Select All ({unassignedShows.length})</p>
              </label>
              <div className="overflow-y-auto flex-1 min-h-0 space-y-1 pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
                {unassignedShows.map(event => (
                  <label key={event.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedShowIds.has(event.id)}
                      onCheckedChange={(checked) => {
                        setSelectedShowIds(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(event.id);
                          else next.delete(event.id);
                          return next;
                        });
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      {event.startDate && <p className="text-xs text-muted-foreground">{format(new Date(event.startDate + "T00:00:00"), "MMM d, yyyy")}</p>}
                    </div>
                  </label>
                ))}
              </div>
              <Button
                className="w-full flex-shrink-0 mt-3"
                onClick={() => addShowsToLegId && selectedShowIds.size > 0 && moveToLegMutation.mutate({ eventIds: Array.from(selectedShowIds), legId: addShowsToLegId })}
                disabled={selectedShowIds.size === 0 || moveToLegMutation.isPending}
              >
                {moveToLegMutation.isPending ? "Moving..." : `Add ${selectedShowIds.size} ${entityLabel.toLowerCase()}${selectedShowIds.size !== 1 ? "s" : ""} to ${containerLabel.toLowerCase()}`}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Travel Day Dialog */}
      <Dialog open={addTravelLegId !== null} onOpenChange={(o) => { if (!o) { setAddTravelLegId(null); resetTravelForm(); } }}>
        <DialogContent className="sm:max-w-[480px] font-body max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">
              Add Travel Day to {legs.find(l => l.id === addTravelLegId)?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Add a travel day with flight details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
            <div>
              <Label>Date</Label>
              <DatePicker value={newTravel.date} onChange={(v) => setNewTravel(p => ({ ...p, date: v }))} />
            </div>
            <Separator />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flight Details (Optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Airline</Label>
                <Input placeholder="e.g. United" value={newTravel.airline} onChange={e => setNewTravel(p => ({ ...p, airline: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Flight Number</Label>
                <Input placeholder="e.g. UA1234" value={newTravel.flightNumber} onChange={e => setNewTravel(p => ({ ...p, flightNumber: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Departure Airport</Label>
                <Input placeholder="e.g. SFO" value={newTravel.departureAirport} onChange={e => setNewTravel(p => ({ ...p, departureAirport: e.target.value.toUpperCase() }))} className="mt-1" maxLength={4} />
              </div>
              <div>
                <Label>Arrival Airport</Label>
                <Input placeholder="e.g. LAX" value={newTravel.arrivalAirport} onChange={e => setNewTravel(p => ({ ...p, arrivalAirport: e.target.value.toUpperCase() }))} className="mt-1" maxLength={4} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Departure Time</Label>
                <TimePicker value={newTravel.departureTime} onChange={(v) => setNewTravel(p => ({ ...p, departureTime: v }))} />
              </div>
              <div>
                <Label>Arrival Time</Label>
                <TimePicker value={newTravel.arrivalTime} onChange={(v) => setNewTravel(p => ({ ...p, arrivalTime: v }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Additional travel notes..." value={newTravel.notes} onChange={e => setNewTravel(p => ({ ...p, notes: e.target.value }))} className="mt-1 resize-none" rows={2} />
            </div>
          </div>
          <Button
            className="w-full flex-shrink-0 mt-3"
            onClick={() => newTravel.date && createTravelDayMutation.mutate({
              date: newTravel.date,
              legId: addTravelLegId,
              notes: newTravel.notes || undefined,
              flightNumber: newTravel.flightNumber || undefined,
              airline: newTravel.airline || undefined,
              departureAirport: newTravel.departureAirport || undefined,
              arrivalAirport: newTravel.arrivalAirport || undefined,
              departureTime: newTravel.departureTime || undefined,
              arrivalTime: newTravel.arrivalTime || undefined,
            })}
            disabled={!newTravel.date || createTravelDayMutation.isPending}
          >
            {createTravelDayMutation.isPending ? "Adding..." : "Add Travel Day"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectsAdmin() {
  const { data: projectsList = [], isLoading } = useProjects();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: venuesList = [] } = useVenues();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProjectNumber, setNewProjectNumber] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newDriveUrl, setNewDriveUrl] = useState("");
  const [newIsFestival, setNewIsFestival] = useState(false);
  const [newIsTour, setNewIsTour] = useState(false);
  const [newAutoGenCount, setNewAutoGenCount] = useState(0);
  const [newAutoGenStartDate, setNewAutoGenStartDate] = useState("");

  const [genShowsProjectId, setGenShowsProjectId] = useState<number | null>(null);
  const [genShowsCount, setGenShowsCount] = useState(10);
  const [genShowsStartDate, setGenShowsStartDate] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProjectNumber, setEditProjectNumber] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editDriveUrl, setEditDriveUrl] = useState("");
  const [editIsFestival, setEditIsFestival] = useState(false);
  const [editIsTour, setEditIsTour] = useState(false);

  const [showArchived, setShowArchived] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const toggleCardExpanded = (projectId: number) =>
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });
  const [collapsedShows, setCollapsedShows] = useState<Set<number>>(new Set());
  const toggleShowsCollapsed = (projectId: number) =>
    setCollapsedShows(prev => {
      const next = new Set(prev);
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });

  const activeProjects = useMemo(() => projectsList.filter((p: Project) => !p.archived), [projectsList]);
  const archivedProjects = useMemo(() => projectsList.filter((p: Project) => p.archived), [projectsList]);
  const tourProjects = useMemo(() => activeProjects.filter((p: Project) => p.isTour).sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999")), [activeProjects]);
  const festivalProjects = useMemo(() => activeProjects.filter((p: Project) => p.isFestival).sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999")), [activeProjects]);
  const regularProjects = useMemo(() => activeProjects.filter((p: Project) => !p.isTour && !p.isFestival).sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999")), [activeProjects]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const eventsForProject = (projectId: number) =>
    eventsList.filter((e: Event) => e.projectId === projectId);

  const handleToggleArchive = (project: Project) => {
    updateProject.mutate(
      { id: project.id, data: { archived: !project.archived } },
      {
        onSuccess: () => {
          toast({ title: project.archived ? "Project Restored" : "Project Archived" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const autoGenCount = newAutoGenCount;
    const autoGenStart = newAutoGenStartDate || newStartDate;
    const entityLabel = newIsFestival ? "stages" : "shows";
    createProject.mutate(
      { name: newName.trim(), description: newDescription.trim() || null, projectNumber: newProjectNumber.trim() || null, startDate: newStartDate || null, endDate: newEndDate || null, driveUrl: newDriveUrl.trim() || null, isFestival: newIsFestival, isTour: newIsTour },
      {
        onSuccess: async (project: any) => {
          if (autoGenCount > 0 && autoGenStart) {
            try {
              await apiRequest("POST", `/api/projects/${project.id}/generate-shows`, {
                count: autoGenCount,
                startDate: autoGenStart,
              });
              queryClient.invalidateQueries({ queryKey: ["/api/events"] });
              queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
              toast({ title: "Project Created", description: `Project created with ${autoGenCount} ${entityLabel}.` });
            } catch (err: any) {
              toast({ title: "Project Created", description: `Project created but failed to generate ${entityLabel}: ${err.message}`, variant: "destructive" });
            }
          } else {
            toast({ title: "Project Created", description: "New project has been created." });
          }
          setShowAdd(false);
          setNewName("");
          setNewDescription("");
          setNewProjectNumber("");
          setNewStartDate("");
          setNewEndDate("");
          setNewDriveUrl("");
          setNewIsFestival(false);
          setNewIsTour(false);
          setNewAutoGenCount(0);
          setNewAutoGenStartDate("");
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return;
    updateProject.mutate(
      { id: editingId, data: { name: editName.trim(), description: editDescription.trim() || null, projectNumber: editProjectNumber.trim() || null, startDate: editStartDate || null, endDate: editEndDate || null, driveUrl: editDriveUrl.trim() || null, isFestival: editIsFestival, isTour: editIsTour } },
      {
        onSuccess: () => {
          setEditingId(null);
          toast({ title: "Project Updated" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDescription(p.description || "");
    setEditProjectNumber(p.projectNumber || "");
    setEditStartDate(p.startDate || "");
    setEditEndDate(p.endDate || "");
    setEditDriveUrl(p.driveUrl || "");
    setEditIsFestival(p.isFestival ?? false);
    setEditIsTour(p.isTour ?? false);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display uppercase tracking-wide text-primary">Projects</h2>
        <Button onClick={() => setShowAdd(true)} className="gap-2" data-testid="button-add-project">
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Projects group related shows together (e.g., a festival with multiple stages). Assign shows to projects to organize them.
      </p>

      {showAdd && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 border-primary/30 rounded-xl">
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              data-testid="input-new-project-name"
            />
            <Textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              data-testid="input-new-project-description"
            />
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Project Number (optional)</Label>
              <Input
                placeholder="e.g. PRJ-001"
                value={newProjectNumber}
                onChange={(e) => setNewProjectNumber(e.target.value)}
                data-testid="input-new-project-number"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
                <DatePicker
                  value={newStartDate}
                  onChange={(v) => {
                    setNewStartDate(v);
                    if (newEndDate && v && newEndDate < v) setNewEndDate(v);
                  }}
                  maxDate={newEndDate || undefined}
                  data-testid="input-new-project-start-date"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
                <DatePicker
                  value={newEndDate}
                  onChange={(v) => {
                    setNewEndDate(v);
                    if (newStartDate && v && v < newStartDate) setNewStartDate(v);
                  }}
                  minDate={newStartDate || undefined}
                  data-testid="input-new-project-end-date"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Google Drive Link (optional)</Label>
              <Input
                type="url"
                placeholder="https://drive.google.com/..."
                value={newDriveUrl}
                onChange={(e) => setNewDriveUrl(e.target.value)}
                data-testid="input-new-project-drive-url"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-festival-mode"
                checked={newIsFestival}
                onCheckedChange={(checked) => { setNewIsFestival(checked === true); if (checked) setNewIsTour(false); }}
                data-testid="checkbox-new-project-festival"
              />
              <Label htmlFor="new-festival-mode" className="text-sm cursor-pointer">Festival Mode</Label>
              <span className="text-xs text-muted-foreground">(Shows become Stages — all crew see all stages)</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-tour-mode"
                checked={newIsTour}
                onCheckedChange={(checked) => { setNewIsTour(checked === true); if (checked) setNewIsFestival(false); }}
                data-testid="checkbox-new-project-tour"
              />
              <Label htmlFor="new-tour-mode" className="text-sm cursor-pointer">Tour</Label>
              <span className="text-xs text-muted-foreground">(Unlock route map, itinerary, and travel days)</span>
            </div>
            {(() => {
              const label = newIsFestival ? "stage" : "show";
              const labelPlural = newIsFestival ? "stages" : "shows";
              const hint = newIsFestival
                ? "Auto-generate stages for this festival. All stages share the same date. You can rename them later."
                : newIsTour
                  ? "Auto-generate shows for this tour. Each show gets consecutive dates starting from the date below. You can rename and adjust dates later."
                  : "Auto-generate shows for this project. Each show gets consecutive dates starting from the date below. You can rename and adjust dates later.";
              const dateLabel = newIsFestival ? "Festival date" : "Starting date";
              const prefix = newName.trim() || "Project";
              const entityLabel = newIsFestival ? "Stage" : "Show";
              return (
                <div className="ml-0 border-l-2 border-primary/20 pl-4 space-y-3 py-2">
                  <p className="text-xs text-muted-foreground">{hint}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Number of {labelPlural}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={newAutoGenCount || ""}
                        onChange={(e) => setNewAutoGenCount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        placeholder="0"
                        className="h-8"
                        data-testid="input-auto-gen-count"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">{dateLabel}</Label>
                      <DatePicker
                        value={newAutoGenStartDate || newStartDate}
                        onChange={(v) => setNewAutoGenStartDate(v)}
                        compact
                        data-testid="input-auto-gen-start-date"
                      />
                    </div>
                  </div>
                  {newAutoGenCount > 0 && (newAutoGenStartDate || newStartDate) && (
                    <p className="text-xs text-primary/70">
                      Will create {newAutoGenCount} {labelPlural}: {prefix} - {entityLabel} 1{newAutoGenCount > 1 ? ` through ${entityLabel} ${newAutoGenCount}` : ""}
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setNewName(""); setNewDescription(""); setNewProjectNumber(""); setNewStartDate(""); setNewEndDate(""); setNewDriveUrl(""); setNewIsFestival(false); setNewIsTour(false); setNewAutoGenCount(0); setNewAutoGenStartDate(""); }} data-testid="button-cancel-add-project">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || createProject.isPending} data-testid="button-save-project">
                <Save className="w-4 h-4 mr-1" /> {createProject.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeProjects.length === 0 && archivedProjects.length === 0 && !showAdd ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardContent className="py-8 text-center text-muted-foreground">
            No projects yet. Create a project to group related shows together.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[
            { label: "Tours", projects: tourProjects, key: "tours" },
            { label: "Festivals", projects: festivalProjects, key: "festivals" },
            { label: "Projects", projects: regularProjects, key: "regular" },
          ].filter(g => g.projects.length > 0).map(group => (
            <div key={group.key}>
              <button
                className="flex items-center gap-2 w-full text-left py-1.5 mb-1"
                onClick={() => setCollapsedSections(prev => {
                  const next = new Set(prev);
                  next.has(group.key) ? next.delete(group.key) : next.add(group.key);
                  return next;
                })}
              >
                {collapsedSections.has(group.key) ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label} ({group.projects.length})</span>
              </button>
              {!collapsedSections.has(group.key) && (
              <div className="space-y-3">
              {group.projects.map((project: Project, projectIndex: number) => {
            const isEditing = editingId === project.id;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: projectIndex * 0.03, duration: 0.3 }}
              >
              <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl" data-testid={`card-project-${project.id}`}>
                <CardContent className="pt-4 space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        data-testid="input-edit-project-name"
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        placeholder="Description (optional)"
                        data-testid="input-edit-project-description"
                      />
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Project Number (optional)</Label>
                        <Input
                          placeholder="e.g. PRJ-001"
                          value={editProjectNumber}
                          onChange={(e) => setEditProjectNumber(e.target.value)}
                          data-testid="input-edit-project-number"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
                          <DatePicker
                            value={editStartDate}
                            onChange={(v) => {
                              setEditStartDate(v);
                              if (editEndDate && v && editEndDate < v) setEditEndDate(v);
                            }}
                            maxDate={editEndDate || undefined}
                            data-testid="input-edit-project-start-date"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
                          <DatePicker
                            value={editEndDate}
                            onChange={(v) => {
                              setEditEndDate(v);
                              if (editStartDate && v && v < editStartDate) setEditStartDate(v);
                            }}
                            minDate={editStartDate || undefined}
                            data-testid="input-edit-project-end-date"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Google Drive Link (optional)</Label>
                        <Input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={editDriveUrl}
                          onChange={(e) => setEditDriveUrl(e.target.value)}
                          data-testid="input-edit-project-drive-url"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-festival-mode-${project.id}`}
                          checked={editIsFestival}
                          onCheckedChange={(checked) => { setEditIsFestival(checked === true); if (checked) setEditIsTour(false); }}
                          data-testid="checkbox-edit-project-festival"
                        />
                        <Label htmlFor={`edit-festival-mode-${project.id}`} className="text-sm cursor-pointer">Festival Mode</Label>
                        <span className="text-xs text-muted-foreground">(Shows become Stages — all crew see all stages)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-tour-mode-${project.id}`}
                          checked={editIsTour}
                          onCheckedChange={(checked) => { setEditIsTour(checked === true); if (checked) setEditIsFestival(false); }}
                          data-testid="checkbox-edit-project-tour"
                        />
                        <Label htmlFor={`edit-tour-mode-${project.id}`} className="text-sm cursor-pointer">Tour</Label>
                        <span className="text-xs text-muted-foreground">(Unlock route map, itinerary, and travel days)</span>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)} data-testid="button-cancel-edit-project">
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdate} disabled={!editName.trim() || updateProject.isPending} data-testid="button-save-edit-project">
                          <Save className="w-4 h-4 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Collapsible header */}
                      <button
                        className="w-full text-left flex items-center gap-2"
                        onClick={() => toggleCardExpanded(project.id)}
                        data-testid={`button-toggle-project-${project.id}`}
                      >
                        {expandedCards.has(project.id) ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                          <span className="font-display text-base font-semibold uppercase tracking-wide text-foreground truncate">{project.name}</span>
                          {project.projectNumber && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">#{project.projectNumber}</Badge>
                          )}
                          {(project.isFestival || project.isTour) && (() => {
                            const pc = getProjectTypeColors(project);
                            return <Badge variant="secondary" className={cn("text-[10px] uppercase tracking-wide", pc.bg, pc.text, pc.darkText)}>{project.isTour ? "Tour" : "Festival"}</Badge>;
                          })()}
                        </div>
                      </button>

                      {expandedCards.has(project.id) && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/project/${project.id}?from=admin`} className="font-display text-sm font-semibold uppercase tracking-wide text-primary hover:underline flex items-center gap-1.5" data-testid={`link-project-${project.id}`}>View Project Page <ExternalLink className="w-3.5 h-3.5 inline-flex opacity-60" /></Link>
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                          )}
                          {project.driveUrl && (
                            <a
                              href={project.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1"
                              data-testid={`link-project-drive-${project.id}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Google Drive
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1 justify-end flex-wrap">
                          {project.isTour && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setGenShowsProjectId(genShowsProjectId === project.id ? null : project.id);
                                setGenShowsCount(10);
                                setGenShowsStartDate(project.startDate || "");
                              }}
                              title="Generate tour shows"
                              data-testid={`button-gen-shows-${project.id}`}
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => startEdit(project)} data-testid={`button-edit-project-${project.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleArchive(project)}
                            title="Archive project"
                            data-testid={`button-archive-project-${project.id}`}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <ConfirmDelete
                            onConfirm={() => deleteProject.mutate(project.id)}
                            title="ARE YOU SURE YOU WANT TO DELETE EVERYTHING?"
                            description={`This will permanently delete "${project.name}" and ALL associated shows, legs, travel days, crew travel, assignments, and files. This cannot be undone.`}
                            triggerVariant="ghost"
                            triggerSize="sm"
                            triggerClassName="text-destructive hover:text-destructive"
                            triggerLabel={<Trash2 className="w-4 h-4" />}
                            data-testid={`button-delete-project-${project.id}`}
                          />
                        </div>
                      </div>
                      )}

                      {expandedCards.has(project.id) && project.isTour && (
                        <ProjectLegsSection projectId={project.id} projectName={project.name} venues={venuesList} />
                      )}

                      {expandedCards.has(project.id) && (
                      <ProjectShowsSection
                        projectId={project.id}
                        isFestival={project.isFestival ?? false}
                        isTour={project.isTour ?? false}
                        venues={venuesList}
                        projectName={project.name}
                      />
                      )}

                      {expandedCards.has(project.id) && genShowsProjectId === project.id && (
                        <div className="mt-3 border-t border-amber-500/20 pt-3 space-y-3">
                          <p className="text-xs text-muted-foreground">Generate numbered shows for this tour. Each show gets consecutive dates. You can rename and adjust dates afterward.</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground mb-1 block">Number of shows</Label>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={genShowsCount || ""}
                                onChange={(e) => setGenShowsCount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                placeholder="10"
                                className="h-8"
                                data-testid={`input-gen-shows-count-${project.id}`}
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground mb-1 block">Starting date</Label>
                              <DatePicker
                                value={genShowsStartDate}
                                onChange={(v) => setGenShowsStartDate(v)}
                                compact
                                data-testid={`input-gen-shows-start-${project.id}`}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setGenShowsProjectId(null)} data-testid={`button-cancel-gen-shows-${project.id}`}>
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                            <Button
                              size="sm"
                              disabled={!genShowsCount || genShowsCount < 1 || !genShowsStartDate}
                              onClick={async () => {
                                try {
                                  const res = await apiRequest("POST", `/api/projects/${project.id}/generate-shows`, {
                                    count: genShowsCount,
                                    startDate: genShowsStartDate,
                                  });
                                  const data = await res.json();
                                  queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                                  queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
                                  toast({ title: "Shows Generated", description: `Created ${data.created} shows for "${project.name}".` });
                                  setGenShowsProjectId(null);
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message, variant: "destructive" });
                                }
                              }}
                              data-testid={`button-confirm-gen-shows-${project.id}`}
                            >
                              <CalendarPlus className="w-4 h-4 mr-1" /> Generate {genShowsCount || 0} Shows
                            </Button>
                          </div>
                        </div>
                      )}

                      {expandedCards.has(project.id) && (project.isFestival || project.isTour) && !isEditing && (
                        <div className="mt-3 border-t border-purple-500/10 pt-3">
                          <ProjectCrewManager projectId={project.id} projectName={project.name} label={project.isTour ? "Tour Crew" : "Festival Crew"} isTour={project.isTour ?? false} />
                        </div>
                      )}

                    </div>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
              </div>
              )}
            </div>
          ))}

          {activeProjects.length === 0 && !showAdd && archivedProjects.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No active projects. Check the archived section below.</p>
          )}

          {archivedProjects.length > 0 && (
            <div className="mt-6">
              <Button
                variant="ghost"
                className="gap-2 text-muted-foreground"
                onClick={() => setShowArchived(!showArchived)}
                data-testid="button-toggle-archived-projects"
              >
                {showArchived ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Archive className="w-4 h-4" />
                Archived ({archivedProjects.length})
              </Button>
              {showArchived && (
                <div className="space-y-3 mt-3">
                  {archivedProjects.map((project: Project) => {
                    const assignedEvents = eventsForProject(project.id);
                    return (
                      <Card key={project.id} className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl opacity-70" data-testid={`card-archived-project-${project.id}`}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Link href={`/project/${project.id}?from=admin`} className="font-display text-base font-semibold uppercase tracking-wide text-muted-foreground" data-testid={`link-archived-project-${project.id}`}>{project.name}</Link>
                                {project.projectNumber && (
                                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide" data-testid={`badge-archived-project-number-${project.id}`}>#{project.projectNumber}</Badge>
                                )}
                                <Badge variant="outline" className="text-[10px]">Archived</Badge>
                              </div>
                              {project.description && (
                                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                              )}
                              {(project.startDate || project.endDate) && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {project.startDate && format(new Date(project.startDate + "T00:00:00"), "MMM d, yyyy")}
                                  {project.startDate && project.endDate && " – "}
                                  {project.endDate && format(new Date(project.endDate + "T00:00:00"), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleArchive(project)}
                                title="Restore project"
                                data-testid={`button-restore-project-${project.id}`}
                              >
                                <ArchiveRestore className="w-4 h-4" />
                              </Button>
                              <ConfirmDelete
                                onConfirm={() => deleteProject.mutate(project.id)}
                                title="Delete project?"
                                description={`Permanently delete "${project.name}"? Shows assigned to this project will become unassigned.`}
                                triggerVariant="ghost"
                                triggerSize="sm"
                                triggerClassName="text-destructive hover:text-destructive"
                                triggerLabel={<Trash2 className="w-4 h-4" />}
                                data-testid={`button-delete-archived-project-${project.id}`}
                              />
                            </div>
                          </div>
                          {assignedEvents.length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => toggleShowsCollapsed(project.id)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1.5 w-full text-left"
                                data-testid={`button-toggle-shows-archived-${project.id}`}
                              >
                                {collapsedShows.has(project.id)
                                  ? <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                  : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
                                {assignedEvents.length} show{assignedEvents.length !== 1 ? "s" : ""}
                              </button>
                              {!collapsedShows.has(project.id) && (
                                <div className="flex flex-wrap gap-1.5">
                                  {assignedEvents.map((ev: Event) => (
                                    <Badge key={ev.id} variant="secondary" className="text-xs">{ev.name}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <StandaloneShowsSection venues={venuesList} />
    </div>
  );
}

function SettingsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: userWorkspaces = [] } = useQuery<any[]>({ queryKey: ["/api/workspaces"] });
  const currentOrg = userWorkspaces.find((w: any) => w.id === user?.workspaceId);
  const [orgName, setOrgName] = useState("");
  const [orgNameEditing, setOrgNameEditing] = useState(false);

  useEffect(() => {
    if (currentOrg?.name && !orgNameEditing) setOrgName(currentOrg.name);
  }, [currentOrg?.name]);

  const [, setLocation] = useLocation();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const { data: wsMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/workspaces", user?.workspaceId, "members"],
    enabled: !!user?.workspaceId,
  });
  const { data: wsUsers = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const isOrgOwner = currentOrg?.ownerId === user?.id;
  const isLastAdmin = wsMembers.filter((m: any) => ["owner", "manager"].includes(m.role)).length <= 1 && wsMembers.some((m: any) => m.userId === user?.id && ["owner", "manager"].includes(m.role));

  const renameOrg = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("PATCH", `/api/workspaces/${user!.workspaceId}/name`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setOrgNameEditing(false);
      toast({ title: "Organization renamed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to rename organization", variant: "destructive" });
    },
  });

  const leaveOrg = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/workspaces/${user!.workspaceId}/leave`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries();
      toast({ title: `You have left ${currentOrg?.name || "the organization"}` });
      if (data.newWorkspaceId) {
        window.location.reload();
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to leave organization", variant: "destructive" });
    },
  });

  const transferOwnership = useMutation({
    mutationFn: async (newOwnerId: string) => {
      await apiRequest("PATCH", `/api/workspaces/${user!.workspaceId}/transfer-ownership`, { newOwnerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowTransferOwnership(false);
      setConfirmTransfer(false);
      setTransferTargetId("");
      toast({ title: "Ownership transferred", description: "You are now a manager of this organization." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to transfer ownership", variant: "destructive" });
    },
  });

  const [newOrgName, setNewOrgName] = useState("");
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);

  const createOrg = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/workspaces", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setNewOrgName("");
      setShowNewOrgForm(false);
      toast({ title: "Organization created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create organization", variant: "destructive" });
    },
  });

  const switchOrg = useMutation({
    mutationFn: async (workspaceId: number) => {
      const res = await apiRequest("PATCH", "/api/auth/workspace", { workspaceId });
      return res.json();
    },
    onSuccess: () => {
      resetBootstrap();
      queryClient.clear();
      window.location.reload();
    },
    onError: (err: any) => {
      toast({ title: "Failed to switch organization", description: err.message, variant: "destructive" });
    },
  });

  const [newTaskType, setNewTaskType] = useState("");
  const [editingTaskTypeId, setEditingTaskTypeId] = useState<number | null>(null);
  const [editingTaskTypeName, setEditingTaskTypeName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [newCrewPosition, setNewCrewPosition] = useState("");
  const [editingPosId, setEditingPosId] = useState<number | null>(null);
  const [editingPosName, setEditingPosName] = useState("");
  const [taskTypesOpen, setTaskTypesOpen] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const [crewPositionsOpen, setCrewPositionsOpen] = useState(false);

  const { data: taskTypes = [], isLoading: loadingTT } = useQuery<any[]>({ queryKey: ["/api/task-types"] });
  const { data: departments = [], isLoading: loadingDept } = useQuery<any[]>({ queryKey: ["/api/departments"] });
  const { data: crewPositionsList = [], isLoading: loadingPos } = useQuery<any[]>({ queryKey: ["/api/crew-positions"] });

  const createTaskType = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/task-types", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-types"] });
      setNewTaskType("");
      toast({ title: "Task type added" });
    },
  });

  const updateTaskType = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/task-types/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-types"] });
      setEditingTaskTypeId(null);
      toast({ title: "Task type updated" });
    },
  });

  const deleteTaskType = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/task-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-types"] });
      toast({ title: "Task type removed" });
    },
  });

  const createDepartment = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/departments", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setNewDepartment("");
      toast({ title: "Department added" });
    },
  });

  const updateDepartment = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/departments/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setEditingDeptId(null);
      toast({ title: "Department updated" });
    },
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department removed" });
    },
  });

  const seedTaskTypes = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/task-types/seed-defaults");
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-types"] });
      toast({ title: data.added > 0 ? `Added ${data.added} default task types` : "All defaults already exist" });
    },
  });

  const seedDepartments = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/departments/seed-defaults");
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: data.added > 0 ? `Added ${data.added} default departments` : "All defaults already exist" });
    },
  });

  const createCrewPosition = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/crew-positions", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-positions"] });
      setNewCrewPosition("");
      toast({ title: "Crew position added" });
    },
  });

  const updateCrewPosition = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/crew-positions/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-positions"] });
      setEditingPosId(null);
      toast({ title: "Crew position updated" });
    },
  });

  const deleteCrewPosition = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/crew-positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-positions"] });
      toast({ title: "Crew position removed" });
    },
  });

  const seedCrewPositions = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/crew-positions/seed-defaults");
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-positions"] });
      toast({ title: data.added > 0 ? `Added ${data.added} default positions` : "All defaults already exist" });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Organization
          </CardTitle>
          <p className="text-sm text-muted-foreground">Rename your organization.</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={orgName}
              onChange={(e) => { setOrgName(e.target.value); setOrgNameEditing(true); }}
              placeholder="Organization name"
              data-testid="input-org-name"
            />
            <Button
              size="sm"
              onClick={() => { if (orgName.trim()) renameOrg.mutate(orgName.trim()); }}
              disabled={!orgName.trim() || orgName.trim() === currentOrg?.name || renameOrg.isPending}
              data-testid="button-rename-org"
            >
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {isOrgOwner && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5" /> Transfer Ownership
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Transfer your owner role to another member. You will become a manager.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showTransferOwnership ? (
              <Button variant="outline" size="sm" onClick={() => setShowTransferOwnership(true)}>
                Transfer Ownership
              </Button>
            ) : !confirmTransfer ? (
              <div className="space-y-3">
                <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wsMembers
                      .filter((m: any) => m.userId !== user?.id)
                      .map((m: any) => {
                        const u = wsUsers.find((u: any) => u.id === m.userId);
                        const label = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || m.userId : m.userId;
                        return (
                          <SelectItem key={m.userId} value={m.userId}>
                            {label} ({m.role})
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!transferTargetId}
                    onClick={() => setConfirmTransfer(true)}
                  >
                    Continue
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowTransferOwnership(false); setTransferTargetId(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-destructive font-medium">
                  This cannot be undone. Are you sure you want to transfer ownership?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={transferOwnership.isPending}
                    onClick={() => transferOwnership.mutate(transferTargetId)}
                  >
                    {transferOwnership.isPending ? "Transferring..." : "Yes, transfer"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmTransfer(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isOrgOwner && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 border-destructive/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <LogOut className="w-5 h-5" /> Leave Organization
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Leave <strong>{currentOrg?.name}</strong>. Your show assignments in this organization will be removed.
            </p>
          </CardHeader>
          <CardContent>
            {isLastAdmin && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                You are the only admin. Promote another member to admin before leaving.
              </p>
            )}
            {!confirmLeave ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={isLastAdmin}
                onClick={() => setConfirmLeave(true)}
                data-testid="button-leave-org"
              >
                <LogOut className="w-4 h-4 mr-1" /> Leave Organization
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-destructive font-medium">Are you sure?</p>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={leaveOrg.isPending}
                  onClick={() => leaveOrg.mutate()}
                  data-testid="button-confirm-leave-org"
                >
                  {leaveOrg.isPending ? "Leaving..." : "Yes, leave"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmLeave(false)}
                  data-testid="button-cancel-leave-org"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Your Organizations
          </CardTitle>
          <p className="text-sm text-muted-foreground">Organizations you belong to. Switch between them or create a new one.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {userWorkspaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organizations found.</p>
          ) : (
            <div className="space-y-2">
              {userWorkspaces.map((ws: any) => {
                const isCurrent = ws.id === user?.workspaceId;
                return (
                  <div
                    key={ws.id}
                    className={cn(
                      "flex items-center justify-between gap-2 p-3 rounded-lg border",
                      isCurrent ? "border-primary bg-primary/5" : "border-border/40"
                    )}
                    data-testid={`row-org-${ws.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate" data-testid={`text-org-name-${ws.id}`}>{ws.name}</span>
                      <Badge variant={isCurrent ? "default" : "secondary"} className="text-xs shrink-0">
                        {ws.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isCurrent ? (
                        <Badge variant="outline" className="text-xs">
                          <Check className="w-3 h-3 mr-1" /> Current
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={switchOrg.isPending}
                          onClick={() => switchOrg.mutate(ws.id)}
                          data-testid={`button-switch-org-${ws.id}`}
                        >
                          {switchOrg.isPending && switchOrg.variables === ws.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : null}
                          Switch
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!showNewOrgForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewOrgForm(true)}
              data-testid="button-show-create-org"
            >
              <Plus className="w-4 h-4 mr-1" /> Create New Organization
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Organization name..."
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newOrgName.trim()) createOrg.mutate(newOrgName.trim());
                  if (e.key === "Escape") { setShowNewOrgForm(false); setNewOrgName(""); }
                }}
                autoFocus
                data-testid="input-new-org-name"
              />
              <Button
                size="sm"
                disabled={!newOrgName.trim() || createOrg.isPending}
                onClick={() => createOrg.mutate(newOrgName.trim())}
                data-testid="button-create-org"
              >
                {createOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Create
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowNewOrgForm(false); setNewOrgName(""); }}
                data-testid="button-cancel-create-org"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
        <CardHeader className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors rounded-t-lg" onClick={() => setTaskTypesOpen(!taskTypesOpen)} data-testid="toggle-task-types">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2">
              {taskTypesOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Layers className="w-5 h-5" /> Task Types
              {!taskTypesOpen && taskTypes.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{taskTypes.length}</Badge>}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); seedTaskTypes.mutate(); }}
              disabled={seedTaskTypes.isPending}
              data-testid="button-seed-task-types"
            >
              <RotateCw className={cn("w-3.5 h-3.5 mr-1", seedTaskTypes.isPending && "animate-spin")} />
              Seed Defaults
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Manage the task types available for schedule items.</p>
        </CardHeader>
        {taskTypesOpen && <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="New task type name..."
              value={newTaskType}
              onChange={(e) => setNewTaskType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTaskType.trim()) createTaskType.mutate(newTaskType.trim());
              }}
              data-testid="input-new-task-type"
            />
            <Button
              size="sm"
              disabled={!newTaskType.trim() || createTaskType.isPending}
              onClick={() => createTaskType.mutate(newTaskType.trim())}
              data-testid="button-add-task-type"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {loadingTT ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : taskTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No task types yet.</p>
          ) : (
            <div className="space-y-1">
              {taskTypes.map((tt: any) => (
                <div key={tt.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group" data-testid={`row-task-type-${tt.id}`}>
                  {editingTaskTypeId === tt.id ? (
                    <>
                      <Input
                        value={editingTaskTypeName}
                        onChange={(e) => setEditingTaskTypeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingTaskTypeName.trim()) updateTaskType.mutate({ id: tt.id, name: editingTaskTypeName.trim() });
                          if (e.key === "Escape") setEditingTaskTypeId(null);
                        }}
                        className="h-8 text-sm"
                        autoFocus
                        data-testid={`input-edit-task-type-${tt.id}`}
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateTaskType.mutate({ id: tt.id, name: editingTaskTypeName.trim() })} data-testid={`button-save-task-type-${tt.id}`}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingTaskTypeId(null)} data-testid={`button-cancel-edit-task-type-${tt.id}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm flex-1">{tt.name}</span>
                      {tt.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={() => { setEditingTaskTypeId(tt.id); setEditingTaskTypeName(tt.name); }} data-testid={`button-edit-task-type-${tt.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <ConfirmDelete
                        onConfirm={() => deleteTaskType.mutate(tt.id)}
                        title="Delete Task Type?"
                        description={`Remove "${tt.name}" task type?`}
                        triggerLabel={<Trash2 className="w-3.5 h-3.5" />}
                        triggerVariant="ghost"
                        triggerSize="icon"
                        triggerClassName="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        data-testid={`button-delete-task-type-${tt.id}`}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>}
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
        <CardHeader className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors rounded-t-lg" onClick={() => setDepartmentsOpen(!departmentsOpen)} data-testid="toggle-departments">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2">
              {departmentsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Briefcase className="w-5 h-5" /> Departments
              {!departmentsOpen && departments.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{departments.length}</Badge>}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); seedDepartments.mutate(); }}
              disabled={seedDepartments.isPending}
              data-testid="button-seed-departments"
            >
              <RotateCw className={cn("w-3.5 h-3.5 mr-1", seedDepartments.isPending && "animate-spin")} />
              Seed Defaults
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Manage departments/roles available for contacts.</p>
        </CardHeader>
        {departmentsOpen && <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="New department name..."
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDepartment.trim()) createDepartment.mutate(newDepartment.trim());
              }}
              data-testid="input-new-department"
            />
            <Button
              size="sm"
              disabled={!newDepartment.trim() || createDepartment.isPending}
              onClick={() => createDepartment.mutate(newDepartment.trim())}
              data-testid="button-add-department"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {loadingDept ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments yet.</p>
          ) : (
            <div className="space-y-1">
              {departments.map((dept: any) => (
                <div key={dept.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group" data-testid={`row-department-${dept.id}`}>
                  {editingDeptId === dept.id ? (
                    <>
                      <Input
                        value={editingDeptName}
                        onChange={(e) => setEditingDeptName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingDeptName.trim()) updateDepartment.mutate({ id: dept.id, name: editingDeptName.trim() });
                          if (e.key === "Escape") setEditingDeptId(null);
                        }}
                        className="h-8 text-sm"
                        autoFocus
                        data-testid={`input-edit-department-${dept.id}`}
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateDepartment.mutate({ id: dept.id, name: editingDeptName.trim() })} data-testid={`button-save-department-${dept.id}`}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingDeptId(null)} data-testid={`button-cancel-edit-department-${dept.id}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm flex-1">{dept.name}</span>
                      {dept.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={() => { setEditingDeptId(dept.id); setEditingDeptName(dept.name); }} data-testid={`button-edit-department-${dept.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <ConfirmDelete
                        onConfirm={() => deleteDepartment.mutate(dept.id)}
                        title="Delete Department?"
                        description={`Remove "${dept.name}" department?`}
                        triggerLabel={<Trash2 className="w-3.5 h-3.5" />}
                        triggerVariant="ghost"
                        triggerSize="icon"
                        triggerClassName="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        data-testid={`button-delete-department-${dept.id}`}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>}
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
        <CardHeader className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors rounded-t-lg" onClick={() => setCrewPositionsOpen(!crewPositionsOpen)} data-testid="toggle-crew-positions">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2">
              {crewPositionsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Headphones className="w-5 h-5" /> Crew Positions
              {!crewPositionsOpen && crewPositionsList.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{crewPositionsList.length}</Badge>}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); seedCrewPositions.mutate(); }}
              disabled={seedCrewPositions.isPending}
              data-testid="button-seed-crew-positions"
            >
              <RotateCw className={cn("w-3.5 h-3.5 mr-1", seedCrewPositions.isPending && "animate-spin")} />
              Seed Defaults
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Manage crew position presets (e.g. FOH, MONS, PATCH) used when assigning crew to shows.</p>
        </CardHeader>
        {crewPositionsOpen && <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="New position name..."
              value={newCrewPosition}
              onChange={(e) => setNewCrewPosition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCrewPosition.trim()) createCrewPosition.mutate(newCrewPosition.trim());
              }}
              data-testid="input-new-crew-position"
            />
            <Button
              size="sm"
              disabled={!newCrewPosition.trim() || createCrewPosition.isPending}
              onClick={() => createCrewPosition.mutate(newCrewPosition.trim())}
              data-testid="button-add-crew-position"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {loadingPos ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : crewPositionsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No crew positions yet.</p>
          ) : (
            <div className="space-y-1">
              {crewPositionsList.map((pos: any) => (
                <div key={pos.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group" data-testid={`row-crew-position-${pos.id}`}>
                  {editingPosId === pos.id ? (
                    <>
                      <Input
                        value={editingPosName}
                        onChange={(e) => setEditingPosName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingPosName.trim()) updateCrewPosition.mutate({ id: pos.id, name: editingPosName.trim() });
                          if (e.key === "Escape") setEditingPosId(null);
                        }}
                        className="h-8 text-sm"
                        autoFocus
                        data-testid={`input-edit-crew-position-${pos.id}`}
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateCrewPosition.mutate({ id: pos.id, name: editingPosName.trim() })} data-testid={`button-save-crew-position-${pos.id}`}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingPosId(null)} data-testid={`button-cancel-edit-crew-position-${pos.id}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm flex-1">{pos.name}</span>
                      {pos.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={() => { setEditingPosId(pos.id); setEditingPosName(pos.name); }} data-testid={`button-edit-crew-position-${pos.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <ConfirmDelete
                        onConfirm={() => deleteCrewPosition.mutate(pos.id)}
                        title="Delete Crew Position?"
                        description={`Remove "${pos.name}" position?`}
                        triggerLabel={<Trash2 className="w-3.5 h-3.5" />}
                        triggerVariant="ghost"
                        triggerSize="icon"
                        triggerClassName="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        data-testid={`button-delete-crew-position-${pos.id}`}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>}
      </Card>

      <ScheduleTemplatesSection />
    </div>
  );
}

function ScheduleTemplatesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateDesc, setEditTemplateDesc] = useState("");
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(null);

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<any[]>({
    queryKey: ["/api/schedule-templates"],
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, name, description }: { id: number; name: string; description: string }) => {
      await apiRequest("PATCH", `/api/schedule-templates/${id}`, { name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates"] });
      setEditingTemplateId(null);
      toast({ title: "Template updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update template.", variant: "destructive" }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedule-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" }),
  });

  const parseItems = (itemsJson: string): any[] => {
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
      <CardHeader
        className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors rounded-t-lg"
        onClick={() => setTemplatesOpen(!templatesOpen)}
        data-testid="toggle-schedule-templates"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            {templatesOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <FileText className="w-5 h-5" /> Schedule Templates
            {!templatesOpen && templates.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{templates.length}</Badge>}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Saved schedule templates that can be applied to shows.</p>
      </CardHeader>
      {templatesOpen && (
        <CardContent className="space-y-3">
          {loadingTemplates ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates saved yet. Save a show schedule as a template from the Shows tab.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {templates.map((template: any) => {
                  const items = parseItems(template.items);
                  const isExpanded = expandedTemplateId === template.id;
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-4"
                        data-testid={`card-template-${template.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {editingTemplateId === template.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editTemplateName}
                                  onChange={(e) => setEditTemplateName(e.target.value)}
                                  placeholder="Template name"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && editTemplateName.trim()) {
                                      updateTemplate.mutate({ id: template.id, name: editTemplateName.trim(), description: editTemplateDesc.trim() });
                                    }
                                    if (e.key === "Escape") setEditingTemplateId(null);
                                  }}
                                  data-testid={`input-edit-template-name-${template.id}`}
                                />
                                <Input
                                  value={editTemplateDesc}
                                  onChange={(e) => setEditTemplateDesc(e.target.value)}
                                  placeholder="Description (optional)"
                                  data-testid={`input-edit-template-desc-${template.id}`}
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateTemplate.mutate({ id: template.id, name: editTemplateName.trim(), description: editTemplateDesc.trim() })}
                                    disabled={!editTemplateName.trim() || updateTemplate.isPending}
                                    data-testid={`button-save-template-${template.id}`}
                                  >
                                    <Check className="w-4 h-4 mr-1" /> Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingTemplateId(null)} data-testid={`button-cancel-edit-template-${template.id}`}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <button
                                  className="text-sm font-medium hover:underline cursor-pointer text-left"
                                  onClick={() => {
                                    setEditingTemplateId(template.id);
                                    setEditTemplateName(template.name);
                                    setEditTemplateDesc(template.description || "");
                                  }}
                                  data-testid={`button-rename-template-${template.id}`}
                                >
                                  {template.name}
                                </button>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {template.type === "show" ? "Show" : "Day"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                                </div>
                                {template.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setExpandedTemplateId(isExpanded ? null : template.id)}
                              data-testid={`button-preview-template-${template.id}`}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                            <ConfirmDelete
                              onConfirm={() => deleteTemplate.mutate(template.id)}
                              title="Delete Template?"
                              description={`Remove "${template.name}" template? This cannot be undone.`}
                              triggerLabel={<Trash2 className="w-3.5 h-3.5" />}
                              triggerVariant="ghost"
                              triggerSize="icon"
                              triggerClassName="text-destructive"
                              data-testid={`button-delete-template-${template.id}`}
                            />
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && items.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-border/30 space-y-1" data-testid={`template-items-${template.id}`}>
                                {items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted/30">
                                    <span className="text-muted-foreground w-6 text-right">{idx + 1}.</span>
                                    <span className="font-medium flex-1">{item.title || "Untitled"}</span>
                                    {item.category && <Badge variant="outline" className="text-[10px]">{item.category}</Badge>}
                                    {item.startTime && <span className="text-muted-foreground">{item.startTime}</span>}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function parseTimeToMinutes(str: string): number | null {
  if (!str || !str.trim()) return null;
  const clean = str.trim().toUpperCase();
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24 && !clean.includes("AM") && !clean.includes("PM")) {
    const hours = parseInt(match24[1]);
    const minutes = parseInt(match24[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }
  const match = clean.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM|A|P)?$/);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const period = match[3];
  if (period === "PM" || period === "P") {
    if (hours !== 12) hours += 12;
  } else if (period === "AM" || period === "A") {
    if (hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
}

function punchTimeToHHMM(ts: string | Date | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts as string);
  if (isNaN(d.getTime())) return "";
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function timeTo24(str: string): string {
  if (!str || !str.trim()) return "";
  const minutes = parseTimeToMinutes(str);
  if (minutes === null) return str;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function calcTotalHours(timeIn: string, timeOut: string, mealOut: string, mealIn: string, paidBreak: boolean): string {
  const tIn = parseTimeToMinutes(timeIn);
  const tOut = parseTimeToMinutes(timeOut);
  if (tIn === null || tOut === null) return "";
  let totalMinutes = tOut >= tIn ? tOut - tIn : (1440 - tIn) + tOut;
  if (!paidBreak) {
    const mOut = parseTimeToMinutes(mealOut);
    const mIn = parseTimeToMinutes(mealIn);
    if (mOut !== null && mIn !== null) {
      const breakMinutes = mIn >= mOut ? mIn - mOut : (1440 - mOut) + mIn;
      totalMinutes -= breakMinutes;
    }
  }
  if (totalMinutes <= 0) return "0";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function TimesheetRow({ entry, onUpdate, onDelete }: { entry: TimesheetEntry; onUpdate: (entry: TimesheetEntry, field: string, value: string | boolean) => void; onDelete: () => void }) {
  const [local, setLocal] = useState({
    employeeName: entry.employeeName,
    position: entry.position || "",
    timeIn: timeTo24(entry.timeIn || ""),
    mealBreakOut: timeTo24(entry.mealBreakOut || ""),
    mealBreakIn: timeTo24(entry.mealBreakIn || ""),
    timeOut: timeTo24(entry.timeOut || ""),
    initials: entry.initials || "",
  });

  useEffect(() => {
    setLocal({
      employeeName: entry.employeeName,
      position: entry.position || "",
      timeIn: timeTo24(entry.timeIn || ""),
      mealBreakOut: timeTo24(entry.mealBreakOut || ""),
      mealBreakIn: timeTo24(entry.mealBreakIn || ""),
      timeOut: timeTo24(entry.timeOut || ""),
      initials: entry.initials || "",
    });
  }, [entry.id, entry.employeeName, entry.position, entry.timeIn, entry.mealBreakOut, entry.mealBreakIn, entry.timeOut, entry.initials]);

  const handleChange = (field: string, value: string) => {
    setLocal(prev => ({ ...prev, [field]: value }));
    onUpdate({ ...entry, ...local, [field]: value }, field, value);
  };

  const totalDisplay = calcTotalHours(
    local.timeIn,
    local.timeOut,
    local.mealBreakOut,
    local.mealBreakIn,
    entry.paidMealBreak !== false
  );

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`row-timesheet-${entry.id}`}>
      <td className="p-1">
        <Input className="h-8 text-sm" value={local.employeeName} onChange={(e) => handleChange("employeeName", e.target.value)} placeholder="Name" data-testid={`input-ts-name-${entry.id}`} />
      </td>
      <td className="p-1">
        <Input className="h-8 text-sm" value={local.position} onChange={(e) => handleChange("position", e.target.value)} placeholder="Position" data-testid={`input-ts-position-${entry.id}`} />
      </td>
      <td className="p-1">
        <TimePicker compact value={local.timeIn} onChange={(v) => handleChange("timeIn", v)} data-testid={`input-ts-timein-${entry.id}`} />
      </td>
      <td className="p-1">
        <TimePicker compact clearable value={local.mealBreakOut} onChange={(v) => handleChange("mealBreakOut", v)} data-testid={`input-ts-mealout-${entry.id}`} />
      </td>
      <td className="p-1">
        <TimePicker compact clearable value={local.mealBreakIn} onChange={(v) => handleChange("mealBreakIn", v)} data-testid={`input-ts-mealin-${entry.id}`} />
      </td>
      <td className="p-1">
        <TimePicker compact value={local.timeOut} onChange={(v) => handleChange("timeOut", v)} data-testid={`input-ts-timeout-${entry.id}`} />
      </td>
      <td className="p-1 text-center">
        <Button variant="ghost" size="sm" className={cn("h-8 text-xs font-medium", entry.paidMealBreak !== false ? "text-green-600" : "text-orange-500")} onClick={() => onUpdate(entry, "paidMealBreak", entry.paidMealBreak === false)} data-testid={`toggle-ts-paid-${entry.id}`}>
          {entry.paidMealBreak !== false ? "Paid" : "Unpaid"}
        </Button>
      </td>
      <td className="p-1 text-center">
        <span className="text-sm font-medium" data-testid={`text-ts-total-${entry.id}`}>{totalDisplay || "—"}</span>
      </td>
      <td className="p-1">
        <Input className="h-8 text-sm text-center" value={local.initials} onChange={(e) => handleChange("initials", e.target.value)} placeholder="—" data-testid={`input-ts-initials-${entry.id}`} />
      </td>
      <td className="p-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100" onClick={onDelete} data-testid={`button-delete-ts-${entry.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function TimesheetReportsView({ projectsList }: { projectsList: Project[] }) {
  const [reportProjectId, setReportProjectId] = useState<string>("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  const effectiveProjectId = reportProjectId && reportProjectId !== "all" ? reportProjectId : "";
  const hasFilters = effectiveProjectId || (reportStartDate && reportEndDate);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (effectiveProjectId) params.set("projectId", effectiveProjectId);
    if (reportStartDate) params.set("startDate", reportStartDate);
    if (reportEndDate) params.set("endDate", reportEndDate);
    return params.toString();
  }, [effectiveProjectId, reportStartDate, reportEndDate]);

  const { data: reportData, isLoading: reportLoading } = useQuery<{ summary: any[]; totalAllHours: number }>({
    queryKey: ["/api/timesheet-entries/summary", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/timesheet-entries/summary?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    enabled: !!hasFilters,
  });

  const summary = reportData?.summary || [];
  const totalAllHours = reportData?.totalAllHours || 0;

  const exportCSV = () => {
    if (summary.length === 0) return;
    const header = "Employee Name,Positions,Total Hours,Days Worked\n";
    const rows = summary.map(r => `"${r.employeeName}","${r.positions}",${r.totalHours},${r.daysWorked}`).join("\n");
    const footer = `\n"TOTAL","",${totalAllHours},""`;
    const blob = new Blob([header + rows + footer], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-report-${reportStartDate || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (summary.length === 0) return;
    const ws = XLSX.utils.json_to_sheet([
      ...summary.map(r => ({
        "Employee Name": r.employeeName,
        "Positions": r.positions,
        "Total Hours": r.totalHours,
        "Days Worked": r.daysWorked,
      })),
      { "Employee Name": "TOTAL", "Positions": "", "Total Hours": totalAllHours, "Days Worked": "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `timesheet-report-${reportStartDate || "all"}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Project</label>
              <Select value={reportProjectId} onValueChange={setReportProjectId}>
                <SelectTrigger data-testid="select-report-project">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectsList.filter(p => !p.archived).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker
                value={reportStartDate}
                onChange={setReportStartDate}
                maxDate={reportEndDate || undefined}
                clearable
                data-testid="select-report-start-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <DatePicker
                value={reportEndDate}
                onChange={setReportEndDate}
                minDate={reportStartDate || undefined}
                clearable
                data-testid="select-report-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {hasFilters && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg font-display uppercase tracking-wide text-primary">Summary Report</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={exportCSV} disabled={summary.length === 0} data-testid="button-export-csv">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={exportExcel} disabled={summary.length === 0} data-testid="button-export-excel">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="text-center text-muted-foreground py-8">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading report...
              </div>
            ) : summary.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No timesheet data found for the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm border-collapse" data-testid="table-report-summary">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 font-medium text-xs uppercase tracking-wide">Employee Name</th>
                      <th className="text-left p-2 font-medium text-xs uppercase tracking-wide">Positions</th>
                      <th className="text-right p-2 font-medium text-xs uppercase tracking-wide">Total Hours</th>
                      <th className="text-right p-2 font-medium text-xs uppercase tracking-wide">Days Worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/20" data-testid={`row-report-${idx}`}>
                        <td className="p-2" data-testid={`text-report-name-${idx}`}>{row.employeeName}</td>
                        <td className="p-2 text-muted-foreground">{row.positions}</td>
                        <td className="p-2 text-right font-medium">{row.totalHours}</td>
                        <td className="p-2 text-right">{row.daysWorked}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-semibold" data-testid="row-report-total">
                      <td className="p-2" colSpan={2}>Grand Total</td>
                      <td className="p-2 text-right">{totalAllHours}</td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TimeSheetsAdmin() {
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: projectsList = [] } = useProjects();
  const { data: contacts = [] } = useContacts();
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"] });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [timesheetMode, setTimesheetMode] = useState<"entries" | "reports">("entries");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendEmails, setSendEmails] = useState("");
  const [pdfToken, setPdfToken] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const selectedEvent = selectedEventId ? eventsList.find((e: Event) => e.id === selectedEventId) : null;
  const selectedProject = selectedEvent?.projectId ? projectsList.find((p: any) => p.id === selectedEvent.projectId) : null;

  const { data: entries = [], isLoading } = useQuery<TimesheetEntry[]>({
    queryKey: ["/api/timesheet-entries", selectedEventId, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEventId) params.set("eventId", String(selectedEventId));
      if (selectedDate) params.set("date", selectedDate);
      const res = await fetch(`/api/timesheet-entries?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedEventId,
  });

  const { data: punchRecords = [] } = useQuery<DailyCheckin[]>({
    queryKey: ["/api/daily-checkins", selectedEvent?.name, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({ eventName: selectedEvent!.name, date: selectedDate });
      const res = await fetch(`/api/daily-checkins?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedEvent?.name && !!selectedDate,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/timesheet-entries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-entries", selectedEventId, selectedDate] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/timesheet-entries/${id}`, data);
      return res.json();
    },
    onSuccess: (updated: TimesheetEntry) => {
      queryClient.setQueryData(
        ["/api/timesheet-entries", selectedEventId, selectedDate],
        (old: TimesheetEntry[] | undefined) =>
          old ? old.map(e => e.id === updated.id ? updated : e) : old
      );
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/timesheet-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-entries", selectedEventId, selectedDate] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleAutoPopulate = () => {
    if (!selectedEventId || !selectedEvent) return;
    const assignedUserIds = allEventAssignments
      .filter((a: any) => a.eventName === selectedEvent.name)
      .map((a: any) => a.userId);

    const existingNames = new Set(entries.map(e => e.employeeName.toLowerCase()));

    const crewToAdd = (contacts as Contact[])
      .filter(c => c.userId && assignedUserIds.includes(c.userId))
      .filter(c => {
        const name = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase();
        return !existingNames.has(name);
      });

    crewToAdd.forEach(c => {
      const assignment = allEventAssignments.find(
        (a: any) => a.eventName === selectedEvent.name && a.userId === c.userId
      );
      const punch = punchRecords.find((p: DailyCheckin) => p.userId === c.userId);
      const timeIn = punchTimeToHHMM(punch?.checkedInAt);
      const mealBreakOut = punchTimeToHHMM(punch?.lunchOutAt);
      const mealBreakIn = punchTimeToHHMM(punch?.lunchInAt);
      const timeOut = punchTimeToHHMM(punch?.checkedOutAt);
      const totalHours = calcTotalHours(timeIn, timeOut, mealBreakOut, mealBreakIn, true);
      createMutation.mutate({
        eventId: selectedEventId,
        date: selectedDate,
        employeeName: [c.firstName, c.lastName].filter(Boolean).join(" "),
        position: assignment?.position || "",
        ...(timeIn && { timeIn }),
        ...(mealBreakOut && { mealBreakOut }),
        ...(mealBreakIn && { mealBreakIn }),
        ...(timeOut && { timeOut }),
        ...(totalHours && { totalHours }),
      });
    });

    if (crewToAdd.length === 0) {
      toast({ title: "No new crew", description: "All assigned crew are already on the sheet." });
    } else {
      const punchCount = crewToAdd.filter(c => punchRecords.some((p: DailyCheckin) => p.userId === c.userId)).length;
      toast({
        title: "Crew Added",
        description: punchCount > 0
          ? `Added ${crewToAdd.length} crew member(s), ${punchCount} with punch times.`
          : `Added ${crewToAdd.length} crew member(s).`,
      });
    }
  };

  const handleFillFromPunches = () => {
    if (!selectedEventId || !selectedEvent || punchRecords.length === 0) {
      toast({ title: "No punch data", description: "No punch records found for this show and date.", variant: "destructive" });
      return;
    }

    const contactsByName = new Map<string, Contact>();
    (contacts as Contact[]).forEach(c => {
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase();
      if (c.userId) contactsByName.set(name, c);
    });

    let filled = 0;
    entries.forEach(entry => {
      const contact = contactsByName.get(entry.employeeName.toLowerCase());
      if (!contact?.userId) return;
      const punch = punchRecords.find((p: DailyCheckin) => p.userId === contact.userId);
      if (!punch) return;

      const updates: any = {};
      if (!entry.timeIn && punch.checkedInAt) updates.timeIn = punchTimeToHHMM(punch.checkedInAt);
      if (!entry.mealBreakOut && punch.lunchOutAt) updates.mealBreakOut = punchTimeToHHMM(punch.lunchOutAt);
      if (!entry.mealBreakIn && punch.lunchInAt) updates.mealBreakIn = punchTimeToHHMM(punch.lunchInAt);
      if (!entry.timeOut && punch.checkedOutAt) updates.timeOut = punchTimeToHHMM(punch.checkedOutAt);

      if (Object.keys(updates).length === 0) return;

      const mergedTimeIn = updates.timeIn ?? entry.timeIn ?? "";
      const mergedTimeOut = updates.timeOut ?? entry.timeOut ?? "";
      const mergedMealOut = updates.mealBreakOut ?? entry.mealBreakOut ?? "";
      const mergedMealIn = updates.mealBreakIn ?? entry.mealBreakIn ?? "";
      const total = calcTotalHours(mergedTimeIn, mergedTimeOut, mergedMealOut, mergedMealIn, entry.paidMealBreak !== false);
      if (total) updates.totalHours = total;

      updateMutation.mutate({ id: entry.id, data: updates });
      filled++;
    });

    if (filled === 0) {
      toast({ title: "Nothing to fill", description: "All matching rows already have times, or no punch records matched." });
    } else {
      toast({ title: "Times Filled", description: `Updated ${filled} row(s) from punch records.` });
    }
  };

  const handleAddRow = () => {
    if (!selectedEventId) return;
    createMutation.mutate({
      eventId: selectedEventId,
      date: selectedDate,
      employeeName: "",
      position: "",
    });
  };

  const debouncedUpdate = useCallback(
    (() => {
      const timers = new Map<string, ReturnType<typeof setTimeout>>();
      return (id: number, field: string, updates: any) => {
        const key = `${id}-${field}`;
        const existing = timers.get(key);
        if (existing) clearTimeout(existing);
        timers.set(key, setTimeout(() => {
          updateMutation.mutate({ id, data: updates });
          timers.delete(key);
        }, 500));
      };
    })(),
    [updateMutation]
  );

  const handleFieldChange = (entry: TimesheetEntry, field: string, value: string | boolean) => {
    const updates: any = { [field]: value };
    const updatedEntry = { ...entry, [field]: value };
    const total = calcTotalHours(
      updatedEntry.timeIn || "",
      updatedEntry.timeOut || "",
      updatedEntry.mealBreakOut || "",
      updatedEntry.mealBreakIn || "",
      updatedEntry.paidMealBreak !== false
    );
    updates.totalHours = total;
    if (typeof value === "boolean") {
      updateMutation.mutate({ id: entry.id, data: updates });
    } else {
      debouncedUpdate(entry.id, field, updates);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setPdfToken(null);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
    try {
      const res = await apiRequest("POST", "/api/timesheet/preview", {
        eventId: selectedEventId,
        date: selectedDate,
      });
      const data = await res.json();
      setPdfToken(data.pdfToken);
      const pdfRes = await fetch(`/api/timesheet/pdf/${data.pdfToken}`);
      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      }
      setSendDialogOpen(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    const emailList = sendEmails.split(/[,;\s]+/).filter(e => e.includes("@"));
    if (emailList.length === 0) {
      toast({ title: "No emails", description: "Enter at least one email address.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await apiRequest("POST", "/api/timesheet/send", {
        eventId: selectedEventId,
        date: selectedDate,
        emails: emailList,
      });
      toast({ title: "Sent", description: `Time sheet sent to ${emailList.length} recipient(s).` });
      setSendDialogOpen(false);
      setSendEmails("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const activeEvents = eventsList.filter((e: Event) => {
    const endOrStart = e.endDate || e.startDate;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return !endOrStart || endOrStart >= todayStr;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display uppercase tracking-wide text-primary">Time Sheets</h2>
        <div className="flex items-center rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm p-0.5">
          <Button
            variant={timesheetMode === "entries" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimesheetMode("entries")}
            data-testid="button-timesheet-entries-mode"
          >
            <Clock className="w-4 h-4 mr-1" /> Entries
          </Button>
          <Button
            variant={timesheetMode === "reports" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimesheetMode("reports")}
            data-testid="button-timesheet-reports-mode"
          >
            <BarChart3 className="w-4 h-4 mr-1" /> Reports
          </Button>
        </div>
      </div>

      {timesheetMode === "reports" ? (
        <TimesheetReportsView projectsList={projectsList} />
      ) : (
      <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Show</label>
              <Select
                value={selectedEventId ? String(selectedEventId) : ""}
                onValueChange={(val) => setSelectedEventId(val ? Number(val) : null)}
              >
                <SelectTrigger data-testid="select-timesheet-event">
                  <SelectValue placeholder="Select a show" />
                </SelectTrigger>
                <SelectContent>
                  {activeEvents.map((e: Event) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                  {eventsList.filter((e: Event) => !activeEvents.includes(e)).length > 0 && (
                    <>
                      <div className="text-muted-foreground font-medium text-xs px-2 py-1.5">— Archived —</div>
                      {eventsList.filter((e: Event) => !activeEvents.includes(e)).map((e: Event) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                data-testid="select-timesheet-date"
              />
            </div>
          </div>

          {selectedProject && (
            <p className="text-sm text-muted-foreground">Project: <span className="font-medium text-foreground">{selectedProject.name}</span></p>
          )}
        </CardContent>
      </Card>

      {selectedEventId && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg font-display uppercase tracking-wide text-primary">
                {selectedEvent?.name || "Time Sheet"} — {format(new Date(selectedDate + "T12:00:00"), "MMM d, yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={handleAutoPopulate} data-testid="button-auto-populate-crew">
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Auto-Populate Crew
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFillFromPunches}
                  disabled={entries.length === 0}
                  data-testid="button-fill-from-punches"
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" /> Fill from Punches
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddRow} data-testid="button-add-timesheet-row">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Row
                </Button>
                <Button
                  size="sm"
                  onClick={handlePreview}
                  disabled={previewing || entries.length === 0}
                  data-testid="button-preview-timesheet"
                >
                  {previewing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                  Preview & Send
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading entries...</div>
            ) : entries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No time entries yet. Click "Auto-Populate Crew" to add assigned crew or "Add Row" for a blank entry.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 font-medium text-xs uppercase tracking-wide w-[160px]">Employee</th>
                      <th className="text-left p-2 font-medium text-xs uppercase tracking-wide w-[120px]">Position</th>
                      <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Time In</th>
                      <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Meal Out</th>
                      <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Meal In</th>
                      <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Time Out</th>
                      <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[70px]">Break</th>
                      <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[80px]">Total</th>
                      <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[70px]">Initials</th>
                      <th className="w-[40px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <TimesheetRow key={entry.id} entry={entry} onUpdate={handleFieldChange} onDelete={() => deleteMutation.mutate(entry.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide text-primary">Time Sheet PDF</DialogTitle>
            <DialogDescription>Preview and send the time sheet via email.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
          {pdfToken && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PDF Preview</h4>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-testid="button-open-timesheet-pdf"
                >
                  <a href={pdfBlobUrl || `/api/timesheet/pdf/${pdfToken}`} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3 h-3 mr-1" />
                    Open PDF
                  </a>
                </Button>
              </div>
              <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
                <PdfPreview url={pdfBlobUrl || `/api/timesheet/pdf/${pdfToken}`} />
              </Suspense>
            </div>
          )}
          </div>
          <div className="space-y-3 flex-shrink-0">
            <div>
              <label className="text-sm font-medium">Send to (comma-separated emails)</label>
              <Input
                value={sendEmails}
                onChange={(e) => setSendEmails(e.target.value)}
                placeholder="email@example.com, another@example.com"
                data-testid="input-timesheet-emails"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Close</Button>
              <Button onClick={handleSend} disabled={sending || !sendEmails.trim()} data-testid="button-send-timesheet">
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
