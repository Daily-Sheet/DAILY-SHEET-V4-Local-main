import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Eye, Users, Phone, Mail, Search, Loader2,
  CheckCircle2, Circle, LogIn, LogOut, UtensilsCrossed, RotateCcw, Plus, UserPlus, Pencil, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useProjects } from "@/hooks/use-projects";
import { useUserActivity, ActiveDot, matchesSearch } from "@/components/dashboard/utils";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { CrewPositionEditor } from "@/components/dashboard/crew/CrewPositionEditor";
import type { Contact, Event } from "@shared/schema";
import type { AuthUser } from "@/hooks/use-auth";

export function getContactShowNames(contact: Contact, eventAssignments: any[]): string[] {
  if (!contact.userId) return [];
  return eventAssignments.filter(a => a.userId === contact.userId).map(a => a.eventName);
}

export function NoAssignmentState({ message }: { message?: string }) {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Eye className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-xl font-display uppercase tracking-wide text-muted-foreground mb-2">No Show Assignment</h3>
        <p className="text-sm text-muted-foreground/70 max-w-md">{message || "You haven't been assigned to any shows yet. Contact an admin to get assigned to a show."}</p>
      </CardContent>
    </Card>
  );
}

function AssignContactToEventDialog({ eventName, contacts, allEventAssignments, selectedDate }: { eventName: string; contacts: Contact[]; allEventAssignments: any[]; selectedDate?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [dayOnly, setDayOnly] = useState(false);
  const [assignDate, setAssignDate] = useState(selectedDate || "");

  const assignedUserIds = useMemo(() => {
    return new Set(
      allEventAssignments
        .filter(a => a.eventName === eventName && (a.date === null || a.date === undefined || !dayOnly || a.date === assignDate))
        .map(a => a.userId)
    );
  }, [allEventAssignments, eventName, dayOnly, assignDate]);

  const availableContacts = useMemo(() => {
    return contacts.filter(c => (!c.contactType || c.contactType === "crew") && c.userId && !assignedUserIds.has(c.userId));
  }, [contacts, eventName, assignedUserIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return availableContacts;
    const q = search.toLowerCase();
    return availableContacts.filter(c =>
      [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [availableContacts, search]);

  async function handleAssign(contact: Contact) {
    if (!contact.userId) return;
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    setAssigningId(contact.id);
    try {
      await apiRequest("POST", `/api/users/${contact.userId}/event-assignments`, {
        eventName,
        date: dayOnly && assignDate ? assignDate : null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      const dateLabel = dayOnly && assignDate ? ` for ${assignDate}` : "";
      toast({ title: "Assigned", description: `${name} assigned to ${eventName}${dateLabel}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(""); setDayOnly(false); setAssignDate(selectedDate || ""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" data-testid={`button-add-crew-${eventName}`}>
          <UserPlus className="w-3.5 h-3.5" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] font-body max-h-[85vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Assign Crew to {eventName}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Pick from existing contacts to assign to this show.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 py-1 px-1 bg-muted/30 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm" data-testid="toggle-day-only">
            <input
              type="checkbox"
              checked={dayOnly}
              onChange={e => setDayOnly(e.target.checked)}
              className="rounded"
            />
            <span>Specific day only</span>
          </label>
          {dayOnly && (
            <Input
              type="date"
              value={assignDate}
              onChange={e => setAssignDate(e.target.value)}
              className="h-7 text-xs w-auto flex-1"
              data-testid="input-assign-date"
            />
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-assign-crew"
          />
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 min-h-0">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {availableContacts.length === 0 ? "All contacts are already assigned to this show." : "No matching contacts found."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(contact => {
                const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
                return (
                  <div key={contact.id} className="flex items-center justify-between gap-2 px-3 py-3 hover:bg-muted/30 transition-colors rounded-md mx-1" data-testid={`assign-contact-row-${contact.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span className="uppercase tracking-wide font-medium">{contact.role}</span>
                        {(() => {
                          const showNames = getContactShowNames(contact, allEventAssignments);
                          return showNames.length > 0 ? (
                            <span className="flex gap-1 flex-wrap">{showNames.map((en: string) => (
                              <Badge key={en} variant="secondary" className="text-[10px]">{en}</Badge>
                            ))}</span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assigningId === contact.id}
                      onClick={() => handleAssign(contact)}
                      data-testid={`button-assign-contact-${contact.id}`}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Assign
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectPositionEditor({ assignmentId, currentPosition }: { assignmentId: number; currentPosition: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentPosition);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: crewPositionPresets = [] } = useQuery<any[]>({ queryKey: ["/api/crew-positions"] });

  const updateMutation = useMutation({
    mutationFn: async (position: string) => {
      const res = await apiRequest("PATCH", `/api/project-assignments/${assignmentId}`, { position: position || null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      setOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  useEffect(() => { setValue(currentPosition); }, [currentPosition]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(currentPosition); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px] text-muted-foreground gap-0.5" data-testid={`button-edit-proj-position-${assignmentId}`}>
          <Pencil className="w-2.5 h-2.5" />
          {currentPosition ? "Edit" : "Position"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2">
          <Label className="text-xs">Tour Position</Label>
          {crewPositionPresets.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {crewPositionPresets.map((p: any) => (
                <Button key={p.id} variant={value === p.name ? "default" : "outline"} size="sm"
                  className="text-[10px] px-1.5 uppercase tracking-wide"
                  onClick={() => { setValue(p.name); updateMutation.mutate(p.name); }}>
                  {p.name}
                </Button>
              ))}
            </div>
          )}
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Or type custom..."
            className="text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); updateMutation.mutate(value.trim()); } }}
          />
          <div className="flex gap-1.5 justify-end">
            {currentPosition && (
              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate("")}>Clear</Button>
            )}
            <Button size="sm" onClick={() => updateMutation.mutate(value.trim())} disabled={updateMutation.isPending}>
              <Check className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AssignProjectCrewDialog({ projectId, projectName, contacts, isTour }: { projectId: number; projectName: string; contacts: Contact[]; isTour?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: existingAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/project-assignments", projectId] });
  const assignedUserIds = new Set(existingAssignments.map((a: any) => a.userId));
  const crewContacts = contacts.filter(c => (!c.contactType || c.contactType === "crew") && c.userId && !assignedUserIds.has(c.userId));
  const filtered = search.trim()
    ? crewContacts.filter(c => matchesSearch(search, c.firstName, c.lastName, c.email, c.role))
    : crewContacts;

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", "/api/project-assignments", { userId, projectId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments"] });
      toast({ title: "Assigned", description: `Crew assigned to ${projectName}.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" data-testid="button-assign-project-crew">
          <UserPlus className="h-3 w-3" />
          {isTour ? "Assign to Tour" : "Assign to Festival"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col" data-testid="dialog-assign-project-crew">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Assign to {projectName}</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search crew..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2"
          data-testid="input-search-project-crew"
        />
        <div className="flex-1 overflow-auto space-y-1 max-h-[50vh]">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No available crew to assign.</p>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                onClick={() => { if (c.userId) assignMutation.mutate(c.userId); }}
                disabled={assignMutation.isPending}
                data-testid={`button-assign-project-crew-${c.id}`}
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium">{[c.firstName, c.lastName].filter(Boolean).join(" ")}</span>
                  {c.role && <span className="text-xs text-muted-foreground ml-2">{c.role}</span>}
                </div>
                <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AssignedCrewView({ contacts, user, selectedEvents, allEventAssignments, dashboardSearchQuery = "", selectedDate }: { contacts: Contact[]; user: AuthUser | null | undefined; selectedEvents: string[]; allEventAssignments: any[]; dashboardSearchQuery?: string; selectedDate: string }) {
  const isManager = user?.role === "owner" || user?.role === "manager";
  const canPunchOthers = isManager || user?.role === "admin";
  const canEdit = canPunchOthers;
  const userEvents = user?.eventAssignments ?? [];
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: allProjects = [] } = useProjects();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const activityMap = useUserActivity();

  const firstEventName = selectedEvents.length > 0 ? selectedEvents[0] : "";

  const dailyCheckinQueries = useQueries({
    queries: selectedEvents.map(eventName => ({
      queryKey: ["/api/daily-checkins", eventName, selectedDate],
      enabled: !!eventName && !!selectedDate,
      queryFn: async () => {
        const res = await fetch(`/api/daily-checkins?eventName=${encodeURIComponent(eventName)}&date=${encodeURIComponent(selectedDate)}`);
        if (!res.ok) return [];
        return res.json();
      },
    })),
  });

  const dailyCheckinsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (let i = 0; i < selectedEvents.length; i++) {
      const eventName = selectedEvents[i];
      const checkins = dailyCheckinQueries[i]?.data || [];
      for (const c of checkins) {
        map.set(`${c.userId}-${eventName}`, c);
      }
    }
    return map;
  }, [selectedEvents, dailyCheckinQueries]);

  const dailyCheckIn = useMutation({
    mutationFn: async ({ userId, eventName, date }: { userId?: string; eventName: string; date: string }) => {
      const body: any = { eventName, date };
      if (userId) body.userId = userId;
      const res = await apiRequest("POST", "/api/daily-checkins", body);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkins", variables.eventName, variables.date] });
      toast({ title: "Checked In", description: "You're checked in for today." });
    },
  });

  const dailyCheckOut = useMutation({
    mutationFn: async ({ checkinId, eventName }: { checkinId: number; eventName: string }) => {
      const res = await apiRequest("POST", `/api/daily-checkins/${checkinId}/checkout`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkins", variables.eventName, selectedDate] });
      toast({ title: "Checked Out", description: "You're checked out." });
    },
  });

  const dailyLunchOut = useMutation({
    mutationFn: async ({ checkinId, eventName }: { checkinId: number; eventName: string }) => {
      const res = await apiRequest("POST", `/api/daily-checkins/${checkinId}/lunch-out`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkins", variables.eventName, selectedDate] });
      toast({ title: "Lunch Out", description: "Enjoy your break." });
    },
  });

  const dailyLunchIn = useMutation({
    mutationFn: async ({ checkinId, eventName }: { checkinId: number; eventName: string }) => {
      const res = await apiRequest("POST", `/api/daily-checkins/${checkinId}/lunch-in`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkins", variables.eventName, selectedDate] });
      toast({ title: "Back from Lunch", description: "Welcome back!" });
    },
  });

  const dailyReset = useMutation({
    mutationFn: async ({ checkinId, eventName }: { checkinId: number; eventName: string }) => {
      const res = await apiRequest("POST", `/api/daily-checkins/${checkinId}/reset`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkins", variables.eventName, selectedDate] });
      toast({ title: "Punches Reset", description: "Punch record cleared." });
    },
  });

  const selectedEventsSet = useMemo(() => new Set(selectedEvents), [selectedEvents]);

  const dateFilteredAssignments = useMemo(() =>
    allEventAssignments.filter((a: any) => a.date === null || a.date === undefined || a.date === selectedDate),
    [allEventAssignments, selectedDate]
  );

  const assignedContacts = useMemo(() => {
    if (selectedEvents.length === 0) return [];
    const crewOnly = contacts.filter(c => !c.contactType || c.contactType === "crew");
    let filtered: Contact[];
    if (isManager) {
      filtered = crewOnly.filter(c => {
        const showNames = getContactShowNames(c, dateFilteredAssignments);
        return showNames.some(en => selectedEventsSet.has(en));
      });
    } else if (userEvents.length === 0) {
      filtered = [];
    } else {
      const eventSet = new Set(userEvents);
      filtered = crewOnly.filter(c => {
        const showNames = getContactShowNames(c, dateFilteredAssignments);
        return showNames.some(en => eventSet.has(en) && selectedEventsSet.has(en));
      });
    }
    if (dashboardSearchQuery.trim()) {
      filtered = filtered.filter(c =>
        matchesSearch(dashboardSearchQuery, c.firstName, c.lastName, c.email, c.phone, c.role, c.notes)
      );
    }
    return filtered;
  }, [contacts, userEvents, isManager, selectedEvents, dateFilteredAssignments, dashboardSearchQuery]);

  const groupedByEvent = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    for (const c of assignedContacts) {
      const names = getContactShowNames(c, dateFilteredAssignments);
      if (names.length === 0) {
        if (!groups["Unassigned"]) groups["Unassigned"] = [];
        groups["Unassigned"].push(c);
      } else {
        for (const en of names) {
          if (selectedEvents.length > 0 && !selectedEventsSet.has(en)) continue;
          if (!groups[en]) groups[en] = [];
          groups[en].push(c);
        }
      }
    }
    if (canEdit && selectedEvents.length > 0) {
      for (const se of selectedEvents) {
        if (!groups[se]) groups[se] = [];
      }
    }
    return groups;
  }, [assignedContacts, isManager, canEdit, eventsList, selectedEvents, allEventAssignments]);

  async function handleUnassignCrew(contact: Contact, fromEvent: string) {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    const assignment = allEventAssignments.find((a: any) => a.userId === contact.userId && a.eventName === fromEvent);
    if (!assignment) {
      toast({ title: "Error", description: "Assignment not found.", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("DELETE", `/api/event-assignments/${assignment.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      toast({ title: "Removed", description: `${name} removed from ${fromEvent}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const festivalOrTourProject = useMemo(() => {
    if (selectedEvents.length === 0) return null;
    const ev = eventsList.find((e: Event) => selectedEvents.includes(e.name) && e.projectId);
    if (!ev?.projectId) return null;
    const proj = allProjects.find((p: any) => p.id === ev.projectId);
    return (proj?.isFestival || proj?.isTour) ? proj : null;
  }, [selectedEvents, eventsList, allProjects]);

  const festivalProject = festivalOrTourProject;
  const isTourProject = festivalOrTourProject?.isTour ?? false;
  const isFestivalProject = festivalOrTourProject?.isFestival ?? false;

  const { data: projectAssignments = [] } = useQuery<any[]>({
    queryKey: ["/api/project-assignments", festivalOrTourProject?.id],
    enabled: !!festivalOrTourProject,
  });

  const projectCrewContacts = useMemo(() => {
    if (!festivalProject || projectAssignments.length === 0) return [];
    const userIds = new Set(projectAssignments.map((a: any) => a.userId));
    let crew = contacts.filter(c => c.userId && userIds.has(c.userId));
    if (dashboardSearchQuery.trim()) {
      crew = crew.filter(c => matchesSearch(dashboardSearchQuery, c.firstName, c.lastName, c.email, c.phone, c.role, c.notes));
    }
    return crew.sort((a, b) => {
      const nameA = [a.firstName, a.lastName].filter(Boolean).join(" ");
      const nameB = [b.firstName, b.lastName].filter(Boolean).join(" ");
      return nameA.localeCompare(nameB);
    });
  }, [festivalProject, projectAssignments, contacts, dashboardSearchQuery]);

  const [crewSubTab, setCrewSubTab] = useState<"festival" | "stage">("festival");

  if (!isManager && !canEdit && userEvents.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-display uppercase tracking-wide">Assigned Crew</h2>
        <Card className="border-none shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-display uppercase tracking-wide text-muted-foreground mb-2">No Show Assignment</h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">You haven't been assigned to any shows yet. Once an admin assigns you to a show, the crew for that show will appear here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (Object.keys(groupedByEvent).length === 0 && assignedContacts.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-display uppercase tracking-wide">Assigned Crew</h2>
        {!isManager && userEvents.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="text-assigned-events">
            <Eye className="w-3 h-3" />
            <span>Your shows: {userEvents.join(", ")}</span>
          </div>
        )}
        <Card className="border-none shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-display uppercase tracking-wide text-muted-foreground mb-1">No Crew Assigned Yet</h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">No crew members have been assigned to any show(s) yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleUnassignProjectCrew(assignment: any) {
    try {
      await apiRequest("DELETE", `/api/project-assignments/${assignment.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments", festivalOrTourProject?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments"] });
      toast({ title: "Removed", description: `Crew removed from ${isTourProject ? "tour" : "festival"}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const projectLabel = isTourProject ? "Tour Crew" : "Festival Crew";
  const showLabel = isTourProject ? "Show Crew" : "Stage Crew";

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display uppercase tracking-wide">Assigned Crew</h2>
      {!isManager && userEvents.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="text-assigned-events">
          <Eye className="w-3 h-3" />
          <span>Your shows: {userEvents.join(", ")}</span>
        </div>
      )}
      {festivalProject && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/30 w-fit" data-testid="crew-sub-tabs">
          <button
            onClick={() => setCrewSubTab("festival")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              crewSubTab === "festival"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid="button-crew-subtab-festival"
          >
            {projectLabel}
            {projectCrewContacts.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-80">({projectCrewContacts.length})</span>
            )}
          </button>
          <button
            onClick={() => setCrewSubTab("stage")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              crewSubTab === "stage"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid="button-crew-subtab-stage"
          >
            {showLabel}
            {assignedContacts.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-80">({assignedContacts.length})</span>
            )}
          </button>
        </div>
      )}
      {(!festivalProject || crewSubTab === "festival") && festivalProject && (
        <div className="space-y-3" data-testid="project-crew-section">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-display uppercase tracking-wide text-primary flex items-center gap-2">
              {festivalProject.name}
              <Badge variant="default" className="text-[10px] bg-purple-600 text-white">{isTourProject ? "All Shows" : "All Stages"}</Badge>
              {projectCrewContacts.length > 0 && (
                <Badge variant="secondary" className="text-xs">{projectCrewContacts.length} crew</Badge>
              )}
            </h3>
            {canEdit && (
              <AssignProjectCrewDialog projectId={festivalProject.id} projectName={festivalProject.name} contacts={contacts} isTour={isTourProject} />
            )}
          </div>
          {projectCrewContacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
              No crew assigned at the {isTourProject ? "tour" : "festival"} level yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {projectCrewContacts.map((contact, idx) => {
                const assignment = projectAssignments.find((a: any) => a.userId === contact.userId);
                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    className="rounded-xl border border-purple-500/20 bg-card/50 backdrop-blur-sm p-3 group transition-all duration-200 hover:border-purple-500/40"
                    data-testid={`card-project-crew-${contact.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <ActiveDot userId={contact.userId} activityMap={activityMap} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{[contact.firstName, contact.lastName].filter(Boolean).join(" ")}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600 dark:text-purple-400">{isTourProject ? "All Shows" : "All Stages"}</Badge>
                            {assignment?.position && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wide font-medium max-w-[100px] truncate">{assignment.position}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wide truncate min-w-0">{contact.role}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {canEdit && assignment && (
                              <ProjectPositionEditor assignmentId={assignment.id} currentPosition={assignment.position || ""} />
                            )}
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors" data-testid={`link-project-crew-phone-${contact.id}`}>
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors" data-testid={`link-project-crew-email-${contact.id}`}>
                                <Mail className="h-3 w-3" />
                              </a>
                            )}
                            {canEdit && assignment && (
                              <ConfirmDelete
                                onConfirm={() => handleUnassignProjectCrew(assignment)}
                                title={`Remove from ${isTourProject ? "tour" : "festival"}?`}
                                description={`Remove ${[contact.firstName, contact.lastName].filter(Boolean).join(" ")} from ${festivalProject.name}?`}
                                triggerClassName="opacity-0 group-hover:opacity-100 text-destructive transition-all shrink-0"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {festivalProject && crewSubTab === "stage" && Object.keys(groupedByEvent).length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
          No crew assigned to individual {isTourProject ? "shows" : "stages"} yet.
        </div>
      )}
      {(!festivalProject || crewSubTab === "stage") && Object.entries(groupedByEvent).map(([groupEventName, crewList]) => {
        const sortedCrewList = [...crewList].sort((a, b) => {
          const nameA = [a.firstName, a.lastName].filter(Boolean).join(" ");
          const nameB = [b.firstName, b.lastName].filter(Boolean).join(" ");
          return nameA.localeCompare(nameB);
        });
        const deptGroups: Record<string, Contact[]> = {};
        for (const contact of sortedCrewList) {
          const dept = contact.role
            ? contact.role.split(",")[0].trim() || "General"
            : "General";
          if (!deptGroups[dept]) deptGroups[dept] = [];
          deptGroups[dept].push(contact);
        }
        const sortedDepts = Object.keys(deptGroups).sort((a, b) => {
          if (a === "General") return 1;
          if (b === "General") return -1;
          return a.localeCompare(b);
        });
        const eventAssignmentsForShow = allEventAssignments.filter((a: any) => a.eventName === groupEventName);
        const visibleUserIds = new Set(sortedCrewList.map((c: any) => c.userId).filter(Boolean));
        const visibleAssignments = eventAssignmentsForShow.filter((a: any) => visibleUserIds.has(a.userId));
        const checkedInCount = visibleAssignments.filter((a: any) => {
          const checkin = dailyCheckinsMap.get(`${a.userId}-${groupEventName}`);
          return !!checkin?.checkedInAt;
        }).length;
        const totalCount = visibleAssignments.length;
        return (
        <div key={groupEventName} className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-display uppercase tracking-wide text-primary flex items-center gap-2">
              {groupEventName}
              <Badge variant="secondary" className="text-xs">{sortedCrewList.length} crew</Badge>
              {totalCount > 0 && (
                <Badge variant={checkedInCount === totalCount ? "default" : "outline"} className="text-[10px]" data-testid={`badge-checkin-count-${groupEventName}`}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {checkedInCount}/{totalCount}
                </Badge>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {canEdit && !isTourProject && <AssignContactToEventDialog eventName={groupEventName} contacts={contacts} allEventAssignments={allEventAssignments} selectedDate={selectedDate} />}
            </div>
          </div>
          {sortedCrewList.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">No crew assigned to this show yet.</div>
          ) : (
            <div className="space-y-2">
              {(() => {
                let globalIdx = 0;
                return sortedDepts.map(dept => (
                  <div key={dept} className="space-y-1.5">
                    <div className="px-1 pt-1" data-testid={`dept-header-${groupEventName}-${dept}`}>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{dept}</span>
                      <span className="text-[11px] text-muted-foreground/50 ml-1.5">({deptGroups[dept].length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {deptGroups[dept].map(contact => {
                        const idx = globalIdx++;
                        const assignment = allEventAssignments.find((a: any) => a.userId === contact.userId && a.eventName === groupEventName);
                        const dailyCheckin = contact.userId ? dailyCheckinsMap.get(`${contact.userId}-${groupEventName}`) : null;
                        const isCheckedIn = !!dailyCheckin?.checkedInAt;
                        const isLunchOut = !!dailyCheckin?.lunchOutAt;
                        const isLunchIn = !!dailyCheckin?.lunchInAt;
                        const isCheckedOut = !!dailyCheckin?.checkedOutAt;
                        const checkedInTime = dailyCheckin?.checkedInAt ? new Date(dailyCheckin.checkedInAt) : null;
                        const lunchOutTime = dailyCheckin?.lunchOutAt ? new Date(dailyCheckin.lunchOutAt) : null;
                        const lunchInTime = dailyCheckin?.lunchInAt ? new Date(dailyCheckin.lunchInAt) : null;
                        const checkedOutTime = dailyCheckin?.checkedOutAt ? new Date(dailyCheckin.checkedOutAt) : null;
                        const canPunchThisPerson = contact.userId && (canPunchOthers || contact.userId === user?.id);
                        const timeAgo = checkedInTime ? (() => {
                          const mins = Math.round((Date.now() - checkedInTime.getTime()) / 60000);
                          if (mins < 1) return "just now";
                          if (mins < 60) return `${mins}m ago`;
                          const hrs = Math.floor(mins / 60);
                          return `${hrs}h ${mins % 60}m ago`;
                        })() : null;
                        return (
                        <motion.div
                          key={contact.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          className={cn(
                            "rounded-xl border bg-card/50 backdrop-blur-sm p-3 group transition-all duration-200",
                            isCheckedIn && !isCheckedOut
                              ? "border-green-500/30 shadow-[0_0_12px_-4px_rgba(34,197,94,0.2)]"
                              : isCheckedOut
                                ? "border-green-500/20 bg-card/40"
                                : "border-border/30 hover:border-border/50 hover:bg-card/70"
                          )}
                          data-testid={`card-assigned-crew-${contact.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileTap={canEdit && contact.userId ? { scale: 0.85 } : undefined}
                              className={cn(
                                "flex-shrink-0 rounded-full transition-colors duration-200",
                                canEdit && contact.userId ? "cursor-pointer" : "cursor-default pointer-events-none"
                              )}
                              onClick={() => {
                                if (canEdit && contact.userId) {
                                  if (isCheckedIn && !isCheckedOut && dailyCheckin) {
                                    dailyCheckOut.mutate({ checkinId: dailyCheckin.id, eventName: groupEventName });
                                  } else if (!isCheckedIn) {
                                    dailyCheckIn.mutate({ userId: contact.userId, eventName: groupEventName, date: selectedDate });
                                  }
                                }
                              }}
                              aria-label={isCheckedIn ? "Check out this crew member" : "Check in this crew member"}
                              aria-disabled={!(canEdit && contact.userId)}
                              tabIndex={canEdit && contact.userId ? 0 : -1}
                              title={isCheckedIn ? (isCheckedOut ? "Already checked out" : "Check out this crew member") : "Check in this crew member"}
                              data-testid={`button-admin-checkin-${contact.id}`}
                            >
                              {isCheckedIn ? (
                                <CheckCircle2 className={cn("h-5 w-5 drop-shadow-[0_0_4px_rgba(34,197,94,0.4)]", isCheckedOut ? "text-green-400/60" : "text-green-500")} data-testid={`checkin-dot-${contact.id}`} />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/40" data-testid={`checkin-dot-${contact.id}`} />
                              )}
                            </motion.button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <ActiveDot userId={contact.userId} activityMap={activityMap} />
                                  <span className="font-semibold text-sm truncate">{[contact.firstName, contact.lastName].filter(Boolean).join(" ")}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {assignment?.date && (
                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Today</Badge>
                                  )}
                                  {assignment?.position && (
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide font-medium max-w-[100px] truncate">{assignment.position}</Badge>
                                  )}
                                  {canEdit && (
                                    <CrewPositionEditor assignmentId={assignment?.id} currentPosition={assignment?.position || ""} />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground uppercase tracking-wide truncate min-w-0">{contact.role}</span>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {contact.phone && (
                                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors" aria-label={`Call ${[contact.firstName, contact.lastName].filter(Boolean).join(" ")}`} data-testid={`link-crew-phone-${contact.id}`}>
                                      <Phone className="h-3 w-3" />
                                    </a>
                                  )}
                                  {contact.email && (
                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors" aria-label={`Email ${[contact.firstName, contact.lastName].filter(Boolean).join(" ")}`} data-testid={`link-crew-email-${contact.id}`}>
                                      <Mail className="h-3 w-3" />
                                    </a>
                                  )}
                                  {canEdit && (
                                    <ConfirmDelete
                                      onConfirm={() => handleUnassignCrew(contact, groupEventName)}
                                      title="Remove crew member?"
                                      description={`Remove ${[contact.firstName, contact.lastName].filter(Boolean).join(" ")} from ${groupEventName}?`}
                                      triggerClassName="opacity-0 group-hover:opacity-100 text-destructive transition-all shrink-0"
                                      data-testid={`button-delete-crew-${contact.id}`}
                                    />
                                  )}
                                </div>
                              </div>
                              {isCheckedOut && checkedOutTime ? (
                                <div className="text-[10px] text-muted-foreground font-medium mt-0.5" data-testid={`checkout-time-${contact.id}`}>
                                  <LogOut className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />{format(checkedInTime!, "h:mm")}–{format(checkedOutTime, "h:mm a")}
                                </div>
                              ) : isLunchIn && lunchInTime ? (
                                <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5" data-testid={`lunch-in-time-${contact.id}`}>
                                  <UtensilsCrossed className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />{format(lunchOutTime!, "h:mm")}–{format(lunchInTime, "h:mm a")} · {timeAgo}
                                </div>
                              ) : isLunchOut && lunchOutTime ? (
                                <div className="text-[10px] text-orange-500 font-medium mt-0.5" data-testid={`lunch-out-time-${contact.id}`}>
                                  <UtensilsCrossed className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />Lunch {format(lunchOutTime, "h:mm a")} · {timeAgo}
                                </div>
                              ) : isCheckedIn && checkedInTime ? (
                                <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5" data-testid={`checkin-time-${contact.id}`}>
                                  <LogIn className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />{format(checkedInTime, "h:mm a")} · {timeAgo}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {canPunchThisPerson && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap" data-testid={`punch-bar-${contact.id}`}>
                              {!isCheckedIn && (
                                <Button size="sm" variant="outline" className="text-xs h-6 px-2 gap-1" onClick={() => dailyCheckIn.mutate({ userId: contact.userId!, eventName: groupEventName, date: selectedDate })} disabled={dailyCheckIn.isPending} data-testid={`button-card-checkin-${contact.id}`}>
                                  {dailyCheckIn.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}Check In
                                </Button>
                              )}
                              {isCheckedIn && !isLunchOut && !isCheckedOut && (
                                <Button size="sm" variant="outline" className="text-xs h-6 px-2 gap-1" onClick={() => dailyLunchOut.mutate({ checkinId: dailyCheckin!.id, eventName: groupEventName })} disabled={dailyLunchOut.isPending} data-testid={`button-card-lunch-out-${contact.id}`}>
                                  {dailyLunchOut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UtensilsCrossed className="h-3 w-3" />}Lunch Out
                                </Button>
                              )}
                              {isCheckedIn && isLunchOut && !isLunchIn && !isCheckedOut && (
                                <Button size="sm" variant="outline" className="text-xs h-6 px-2 gap-1" onClick={() => dailyLunchIn.mutate({ checkinId: dailyCheckin!.id, eventName: groupEventName })} disabled={dailyLunchIn.isPending} data-testid={`button-card-lunch-in-${contact.id}`}>
                                  {dailyLunchIn.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}Back from Lunch
                                </Button>
                              )}
                              {isCheckedIn && !isCheckedOut && (
                                <Button size="sm" variant="outline" className="text-xs h-6 px-2 gap-1 border-green-500/30 text-green-600 dark:text-green-400" onClick={() => dailyCheckOut.mutate({ checkinId: dailyCheckin!.id, eventName: groupEventName })} disabled={dailyCheckOut.isPending} data-testid={`button-card-checkout-${contact.id}`}>
                                  {dailyCheckOut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}Check Out
                                </Button>
                              )}
                              {isCheckedOut && (
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5" data-testid={`badge-card-done-${contact.id}`}>
                                  <CheckCircle2 className="h-3 w-3" />Done
                                </span>
                              )}
                              {isCheckedOut && canPunchOthers && (
                                <Button size="sm" variant="ghost" className="text-xs h-6 px-2 gap-1 text-muted-foreground hover:text-destructive" onClick={() => dailyReset.mutate({ checkinId: dailyCheckin!.id, eventName: groupEventName })} disabled={dailyReset.isPending} data-testid={`button-reset-punch-${contact.id}`}>
                                  {dailyReset.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Reset
                                </Button>
                              )}
                            </div>
                          )}
                        </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
