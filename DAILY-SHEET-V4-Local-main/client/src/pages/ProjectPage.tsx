import { useState, useMemo, useEffect, useCallback } from "react";
import { useRoute, Link, useSearch } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { formatTime, toTimeInputValue } from "@/lib/timeUtils";
import {
  ArrowLeft, Calendar as CalendarIcon, MapPin, Users, ChevronDown, ChevronUp,
  Clock, Phone, Mail, Wifi, Download, FolderOpen, FileText,
  Loader2, Pencil, Trash2, Plus, Upload, File, Check, X,
  MessageSquare, Send, Pin, ExternalLink, Eye, Mic2, BarChart3, List,
  Map as MapIcon, Car, Navigation, Plane, PlaneTakeoff, PlaneLanding,
  CheckCircle2, Circle, LogIn, LogOut, UserCog, Copy, Check as CheckIcon
} from "lucide-react";
import { format, parseISO, eachDayOfInterval, isToday } from "date-fns";
import type { Event, Project, Venue, Schedule, Contact, FileFolder, Zone, Section, EventDayVenue, TravelDay, CrewMember, Leg } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useContacts } from "@/hooks/use-contacts";
import { useSchedules, useDeleteSchedule, useUpdateSchedule } from "@/hooks/use-schedules";
import { useVenues } from "@/hooks/use-venue";
import { TechPacketHistory } from "@/components/dashboard/venue/VenueView";
import { CreateVenueDialog } from "@/components/dashboard/venue/VenueForm";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useZones } from "@/hooks/use-zones";
import { useSections } from "@/hooks/use-sections";
import { useComments, useCreateComment, useDeleteComment, useToggleCommentPin } from "@/hooks/use-comments";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { CreateScheduleDialog, ScheduleTemplateDialog, SaveAsTemplateButton, CopyDayScheduleButton, useCombinedCategories, CategorySelect } from "@/components/CreateScheduleDialog";
import { buildNestedSchedule, flattenNested } from "@/lib/schedule-nesting";
import GanttScheduleView from "@/components/GanttScheduleView";
import { useColorScheme } from "@/components/ColorSchemeProvider";

function CrewPositionEditorProject({ assignmentId, projectId, currentPosition }: { assignmentId: number; projectId?: number | null; currentPosition: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentPosition);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: crewPositionPresets = [] } = useQuery<any[]>({ queryKey: ["/api/crew-positions"] });
  const saveNewPresets = async (val: string) => {
    const parts = val.split(" / ").map(s => s.trim()).filter(Boolean);
    for (const name of parts) {
      const exists = crewPositionPresets.some((p: any) => p.name.toLowerCase() === name.toLowerCase());
      if (!exists) {
        await apiRequest("POST", "/api/crew-positions", { name });
      }
    }
    if (parts.length > 0) queryClient.invalidateQueries({ queryKey: ["/api/crew-positions"] });
  };
  const updateMutation = useMutation({
    mutationFn: async (position: string) => {
      const res = await apiRequest("PATCH", `/api/project-assignments/${assignmentId}`, { position: position || null });
      return res.json();
    },
    onSuccess: (_data, position) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["/api/project-assignments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      setOpen(false);
      if (position) saveNewPresets(position);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    setValue(currentPosition);
  }, [currentPosition]);

  const selectedPresets = value ? value.split(" / ").filter(Boolean) : [];
  const togglePreset = (name: string) => {
    const next = selectedPresets.includes(name)
      ? selectedPresets.filter(s => s !== name)
      : [...selectedPresets, name];
    setValue(next.join(" / "));
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(currentPosition); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px] text-muted-foreground gap-0.5" data-testid={`button-edit-position-project-${assignmentId}`}>
          <Pencil className="w-2.5 h-2.5" />
          {currentPosition ? "Edit" : "Position"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div className="space-y-2">
          <Label className="text-xs">Project Position</Label>
          {crewPositionPresets.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {crewPositionPresets.map((p: any) => (
                <Button
                  key={p.id}
                  variant={selectedPresets.includes(p.name) ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] px-1.5 uppercase tracking-wide"
                  onClick={() => togglePreset(p.name)}
                  data-testid={`button-preset-position-project-${p.id}`}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          )}
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Or type custom..."
            className="text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); updateMutation.mutate(value.trim()); } }}
            data-testid={`input-position-project-${assignmentId}`}
          />
          <div className="flex gap-1.5 justify-end">
            {currentPosition && (
              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate("")} data-testid={`button-clear-position-project-${assignmentId}`}>
                Clear
              </Button>
            )}
            <Button size="sm" onClick={() => updateMutation.mutate(value.trim())} disabled={updateMutation.isPending} data-testid={`button-save-position-project-${assignmentId}`}>
              <Check className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FileRecord {
  id: number;
  name: string;
  url: string;
  eventName: string | null;
  folderName: string | null;
  type: string;
}


function timeStringToDate(timeStr: string, dateStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const base = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function ScheduleCommentsDialog({ scheduleId, itemTitle }: { scheduleId: number; itemTitle: string }) {
  const { user } = useAuth();
  const { data: commentsList = [], isLoading } = useComments(scheduleId);
  const { mutate: createComment, isPending } = useCreateComment(scheduleId);
  const { mutate: deleteComment } = useDeleteComment(scheduleId);
  const { mutate: togglePin } = useToggleCommentPin(scheduleId);
  const [newComment, setNewComment] = useState("");

  const canComment = ["owner", "manager", "admin", "commenter"].includes(user?.role || "");
  const isAdmin = ["owner", "manager", "admin"].includes(user?.role || "");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment(newComment.trim(), {
      onSuccess: () => setNewComment(""),
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover-elevate px-1.5 py-0.5 rounded-md flex-shrink-0"
          data-testid={`button-toggle-comments-${scheduleId}`}
        >
          <MessageSquare className="h-3 w-3" />
          {commentsList.length > 0 && <span>{commentsList.length}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Comments — {itemTitle}</DialogTitle>
          <DialogDescription className="sr-only">View and add comments for this schedule item</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : commentsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          ) : (
            commentsList.map((c) => (
              <div key={c.id} className={`flex items-start gap-2 group rounded-md px-2 py-1.5 ${c.pinned ? "bg-muted/50" : ""}`} data-testid={`comment-${c.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.pinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
                    <span className="text-xs font-medium text-foreground" data-testid={`text-comment-author-${c.id}`}>{c.authorName}</span>
                    <span className="text-xs text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), "MMM d, h:mm a") : ""}</span>
                  </div>
                  <p className="text-sm text-foreground" data-testid={`text-comment-body-${c.id}`}>{c.body}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-6 w-6 ${c.pinned ? "text-primary" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}
                      onClick={() => togglePin(c.id)}
                      data-testid={`button-pin-comment-${c.id}`}
                    >
                      <Pin className="h-3 w-3" />
                    </Button>
                  )}
                  {isAdmin && (
                    <ConfirmDelete
                      onConfirm={() => deleteComment(c.id)}
                      title="Delete comment?"
                      description="This comment will be permanently removed."
                      triggerClassName="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-delete-comment-${c.id}`}
                      triggerLabel={<Trash2 className="h-3 w-3" />}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {canComment && (
          <div className="flex gap-2 items-center pt-2 border-t">
            <Input
              className="text-sm"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              data-testid={`input-comment-${scheduleId}`}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              disabled={isPending || !newComment.trim()}
              data-testid={`button-submit-comment-${scheduleId}`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InlineComments({ scheduleId }: { scheduleId: number }) {
  const { data: commentsList = [] } = useComments(scheduleId);
  if (commentsList.length === 0) return null;

  const pinnedComments = commentsList.filter(c => c.pinned);
  const recentUnpinned = commentsList.filter(c => !c.pinned);

  return (
    <div className="mt-1 space-y-0.5" data-testid={`inline-comments-${scheduleId}`}>
      {pinnedComments.map(c => (
        <div key={c.id} className="text-[11px] text-primary flex items-start gap-0.5" data-testid={`pinned-comment-${c.id}`}>
          <Pin className="h-2.5 w-2.5 flex-shrink-0 mt-0.5" />
          <span><span className="font-medium">{c.authorName.split(" ")[0]}:</span> {c.body}</span>
        </div>
      ))}
      {recentUnpinned.map(c => (
        <div key={c.id} className="text-[11px] text-muted-foreground" data-testid={`inline-comment-${c.id}`}>
          <span className="font-medium">{c.authorName.split(" ")[0]}:</span> {c.body}
        </div>
      ))}
    </div>
  );
}

function EditScheduleDialog({ item, onClose }: { item: Schedule; onClose: () => void }) {
  const { mutate: updateSchedule, isPending } = useUpdateSchedule();
  const { toast } = useToast();
  const { data: contacts = [] } = useContacts();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: zones = [] } = useZones();
  const { data: sections = [] } = useSections();
  const { data: venuesList = [] } = useVenues();
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"] });
  const { data: allDayVenues = [] } = useQuery<EventDayVenue[]>({ queryKey: ["/api/event-day-venues"] });
  const [crewDropdownOpen, setCrewDropdownOpen] = useState(false);
  const [noEndTime, setNoEndTime] = useState(!item.endTime);
  const categories = useCombinedCategories();
  const { data: crewPositions = [] } = useQuery<any[]>({ queryKey: ["/api/crew-positions"] });

  const crewList = useMemo(() => {
    const eventName = item.eventName;
    const assignedUserIds = eventName
      ? new Set(allEventAssignments.filter((a: any) => a.eventName === eventName).map((a: any) => a.userId))
      : null;
    return (contacts as Contact[])
      .filter(c => {
        if (!c.contactType || c.contactType === "crew") {
          if (assignedUserIds && c.userId) return assignedUserIds.has(c.userId);
          if (assignedUserIds) return false;
          return true;
        }
        return false;
      })
      .map(c => {
        const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
        const departments = c.role ? c.role.split(",").map((r: string) => r.trim()).filter(Boolean) : [];
        const assignment = eventName && c.userId
          ? allEventAssignments.find((a: any) => a.userId === c.userId && a.eventName === eventName)
          : null;
        return { name, userId: c.userId || null, departments, defaultPosition: assignment?.position || null };
      })
      .filter((opt, i, arr) => opt.name && arr.findIndex(o => o.name === opt.name) === i)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, allEventAssignments, item.eventName]);

  const form = useForm({
    defaultValues: {
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Show",
      location: item.location || "",
      eventDate: item.eventDate || "",
      eventName: item.eventName || "",
      startTime: item.startTime,
      endTime: item.endTime,
      crew: (item as any).crew || (item.crewNames || []).map((n: string) => ({ name: n, userId: null, position: null, departments: [] })),
      zoneId: item.zoneId || null,
      sectionId: item.sectionId || null,
    },
  });

  const watchedEventName = form.watch("eventName");
  const watchedDate = form.watch("eventDate") || item.eventDate || "";
  const selectedEvent = (eventsList as Event[])?.find(e => e.name === watchedEventName);
  const filteredSections = selectedEvent ? (sections as Section[]).filter(s => s.eventId === selectedEvent.id) : [];
  const resolvedVenueId = (() => {
    if (!selectedEvent) return null;
    const dayVenue = allDayVenues.find(dv => dv.eventId === selectedEvent.id && dv.date === watchedDate);
    return dayVenue ? dayVenue.venueId : selectedEvent.venueId;
  })();
  const venueZones = resolvedVenueId ? (zones as Zone[]).filter(z => z.venueId === resolvedVenueId) : [];

  const toggleCrew = useCallback((opt: { name: string; userId: string | null; departments: string[]; defaultPosition: string | null }) => {
    const current = ((form.getValues as any)("crew") as CrewMember[] | null) || [];
    if (current.some((m: CrewMember) => m.name === opt.name)) {
      (form.setValue as any)("crew", current.filter((m: CrewMember) => m.name !== opt.name));
    } else {
      (form.setValue as any)("crew", [...current, { name: opt.name, userId: opt.userId, position: opt.defaultPosition, departments: opt.departments }]);
    }
  }, [form]);

  const updateCrewPosition = useCallback((name: string, position: string | null) => {
    const current = ((form.getValues as any)("crew") as CrewMember[] | null) || [];
    (form.setValue as any)("crew", current.map((m: CrewMember) => m.name === name ? { ...m, position } : m));
  }, [form]);

  function onSubmit(data: any) {
    const eventDate = data.eventDate || item.eventDate || "";
    const startTimeStr = toTimeInputValue(data.startTime);
    const normalizedStart = startTimeStr ? timeStringToDate(startTimeStr, eventDate) : data.startTime;
    let normalizedEnd: Date | null = null;
    if (!noEndTime && data.endTime) {
      const endTimeStr = toTimeInputValue(data.endTime);
      if (endTimeStr) {
        normalizedEnd = timeStringToDate(endTimeStr, eventDate);
        if (normalizedEnd.getTime() <= normalizedStart.getTime()) {
          const nextDay = new Date(eventDate + "T00:00:00");
          nextDay.setDate(nextDay.getDate() + 1);
          normalizedEnd = timeStringToDate(endTimeStr, format(nextDay, "yyyy-MM-dd"));
        }
      }
    }
    const crew = ((form.getValues as any)("crew") as CrewMember[] | null) || [];
    const submitData = { ...data, startTime: normalizedStart, endTime: normalizedEnd, zoneId: data.zoneId || null, sectionId: data.sectionId || null, crew, crewNames: crew.map((m: CrewMember) => m.name) };
    updateSchedule(
      { id: item.id, data: submitData },
      {
        onSuccess: () => {
          onClose();
          toast({ title: "Updated", description: "Schedule item has been updated." });
        },
        onError: (error) => {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        },
      }
    );
  }

  return (
    <DialogContent className="sm:max-w-[600px] font-body max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Edit Schedule Item</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">Update the details for this schedule item</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 min-h-0">
          <div className="overflow-y-auto min-h-0 flex-1 pr-1 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="e.g. Sound Check" {...field} data-testid="input-edit-schedule-title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <CategorySelect
                    value={field.value}
                    onValueChange={field.onChange}
                    categories={categories}
                    testId="select-edit-schedule-category"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField control={form.control} name="eventDate" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value || ""}
                    onChange={(v) => field.onChange(v)}
                    data-testid="input-edit-schedule-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="startTime" render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <TimePicker
                  value={toTimeInputValue(field.value)}
                  onChange={(time24) => {
                    const eventDate = form.getValues("eventDate") || format(new Date(), "yyyy-MM-dd");
                    field.onChange(timeStringToDate(time24, eventDate));
                  }}
                  data-testid="input-edit-schedule-start"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="endTime" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>End Time</FormLabel>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={noEndTime}
                      onCheckedChange={(checked) => setNoEndTime(!!checked)}
                      data-testid="checkbox-edit-no-end-time"
                    />
                    <span className="text-xs text-muted-foreground">No end time</span>
                  </label>
                </div>
                {!noEndTime && (
                  <TimePicker
                    value={toTimeInputValue(field.value)}
                    onChange={(time24) => {
                      const eventDate = form.getValues("eventDate") || format(new Date(), "yyyy-MM-dd");
                      field.onChange(timeStringToDate(time24, eventDate));
                    }}
                    data-testid="input-edit-schedule-end"
                  />
                )}
                {noEndTime && (
                  <p className="text-xs text-muted-foreground italic">This item will have no end time.</p>
                )}
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={form.control} name="eventName" render={({ field }) => (
              <FormItem>
                <FormLabel>Show</FormLabel>
                {eventsList.length > 0 ? (
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-schedule-event-name">
                        <SelectValue placeholder="Select a show..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No Show</SelectItem>
                      {eventsList.map((ev) => (
                        <SelectItem key={ev.id} value={ev.name}>{ev.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl><Input placeholder="e.g. Main Concert" {...field} value={field.value || ""} data-testid="input-edit-schedule-event-name" /></FormControl>
                )}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel>Location (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g. Main Stage" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          {venueZones.length > 0 && (
            <FormField control={form.control} name="zoneId" render={({ field }) => (
              <FormItem>
                <FormLabel>Zone (Optional)</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-zone">
                      <SelectValue placeholder="Select zone..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {venueZones.map((zone: Zone) => (
                      <SelectItem key={zone.id} value={String(zone.id)} data-testid={`option-zone-${zone.id}`}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          )}
          {filteredSections.length > 0 && (
            <FormField control={form.control} name="sectionId" render={({ field }) => (
              <FormItem>
                <FormLabel>Section (Optional)</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-section">
                      <SelectValue placeholder="Select section..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredSections.map((section: Section) => (
                      <SelectItem key={section.id} value={String(section.id)} data-testid={`option-section-${section.id}`}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          )}
          <FormItem>
            <FormLabel>Assigned Crew (Optional)</FormLabel>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setCrewDropdownOpen(!crewDropdownOpen)}
                data-testid="button-crew-dropdown-edit"
              >
                <span className="text-muted-foreground truncate flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {(() => {
                    const selected = ((form.watch as any)("crew") as CrewMember[] | null) || [];
                    return selected.length === 0 ? "Select crew members..." : `${selected.length} crew assigned`;
                  })()}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {crewDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-56 overflow-y-auto p-1">
                  {crewList.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No crew available</p>
                  ) : (
                    crewList.map((opt) => {
                      const selected = ((form.watch as any)("crew") as CrewMember[] | null) || [];
                      const isSelected = selected.some((m: CrewMember) => m.name === opt.name);
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => toggleCrew(opt)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                          data-testid={`crew-option-${opt.name.replace(/\s+/g, '-')}`}
                        >
                          <div className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", isSelected ? "bg-primary border-primary" : "border-muted-foreground")}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <span className="font-medium">{opt.name}</span>
                            {opt.defaultPosition && <span className="text-muted-foreground ml-1.5 text-xs">· {opt.defaultPosition}</span>}
                            {opt.departments.length > 0 && <span className="text-muted-foreground ml-1.5 text-xs">[{opt.departments.join(", ")}]</span>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {(() => {
              const selected = ((form.watch as any)("crew") as CrewMember[] | null) || [];
              if (selected.length === 0) return null;
              return (
                <div className="mt-2 space-y-2">
                  {selected.map((member: CrewMember) => (
                    <div key={member.name} className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium">{member.name}</span>
                        <button type="button" onClick={() => toggleCrew({ name: member.name, userId: member.userId || null, departments: member.departments || [], defaultPosition: member.position || null })} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {crewPositions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 flex-1">
                            {(crewPositions as any[]).map((p: any) => {
                              const selectedPositions = (member.position || "").split(" / ").filter(Boolean);
                              const isSelected = selectedPositions.includes(p.name);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide transition-colors ${isSelected ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted text-foreground"}`}
                                  onClick={() => {
                                    const next = isSelected ? selectedPositions.filter(s => s !== p.name) : [...selectedPositions, p.name];
                                    updateCrewPosition(member.name, next.join(" / ") || null);
                                  }}
                                >
                                  {p.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                        {(member.departments || []).map((dept: string) => (
                          <Badge key={dept} variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">{dept}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </FormItem>
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl><Textarea {...field} value={field.value || ""} rows={2} data-testid="input-edit-schedule-description" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-edit-schedule">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

function ClearDayButton({ date, eventName, count }: { date: string; eventName?: string; count: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/schedules/clear-day", { eventDate: date, eventName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Day Cleared", description: `${count} schedule item${count !== 1 ? "s" : ""} removed.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const dateLabel = format(new Date(date + "T12:00:00"), "MMM d, yyyy");
  const desc = eventName
    ? `This will remove all ${count} schedule item${count !== 1 ? "s" : ""} for "${eventName}" on ${dateLabel}. This cannot be undone.`
    : `This will remove all ${count} schedule item${count !== 1 ? "s" : ""} on ${dateLabel}. This cannot be undone.`;

  return (
    <ConfirmDelete
      title="Clear Day's Schedule?"
      description={desc}
      onConfirm={() => clearMutation.mutate()}
      triggerLabel={<><Trash2 className="w-3.5 h-3.5" /> Clear Day</>}
      triggerVariant="outline"
      triggerSize="sm"
      triggerClassName="gap-1.5 font-display uppercase tracking-wide text-xs text-destructive border-destructive/30"
      data-testid="button-clear-day"
    />
  );
}

function ScheduleItemRow({
  item,
  isAdmin,
  onDelete,
  depth = 0,
  zones = [],
  sections = [],
}: {
  item: any;
  isAdmin: boolean;
  onDelete: (id: number) => void;
  depth?: number;
  zones?: Zone[];
  sections?: Section[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const isNested = depth > 0;
  const indentPx = depth * 16;

  const hasDetails = item.location || (item.zoneId && zones.length > 0) || (item.sectionId && sections.length > 0);
  const crew: any[] = (item as any).crew && ((item as any).crew as any[]).length > 0
    ? ((item as any).crew as any[])
    : (item.crewNames || []).map((n: string) => ({ name: n }));
  const hasCrew = crew.length > 0;

  return (
    <div
      className={cn(
        "px-3 py-1.5 group hover:bg-muted/30 transition-colors",
      )}
      style={isNested ? { paddingLeft: `${12 + indentPx}px` } : undefined}
      data-testid={`schedule-item-${item.id}`}
    >
      <div className="flex items-start gap-2">
        {isNested && (
          <div className="w-0.5 self-stretch bg-primary/30 flex-shrink-0 -ml-2 rounded-full" />
        )}

        <div className="flex-shrink-0 pt-0.5" style={{ width: '4.5rem' }}>
          <div className={cn("font-mono text-xs font-bold leading-tight", isNested ? "text-primary/70" : "text-primary")}>
            {formatTime(item.startTime)}
          </div>
          {item.endTime && (
            <div className="font-mono text-[10px] text-muted-foreground leading-tight">
              {formatTime(item.endTime)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className={cn("font-semibold text-sm", isNested ? "text-foreground/80" : "")}>{item.title}</span>
              <Badge variant="outline" className="text-[10px] font-normal flex-shrink-0 px-1.5 py-0">{item.category}</Badge>
              <ScheduleCommentsDialog scheduleId={item.id} itemTitle={item.title} />
            </div>
            {isAdmin && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-all"
                      data-testid={`button-edit-schedule-${item.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </DialogTrigger>
                  {editOpen && <EditScheduleDialog item={item} onClose={() => setEditOpen(false)} />}
                </Dialog>
                <ConfirmDelete
                  onConfirm={() => onDelete(item.id)}
                  title="Delete schedule item?"
                  description={`Remove "${item.title}" from the schedule? This cannot be undone.`}
                  triggerClassName="opacity-0 group-hover:opacity-100 text-destructive transition-all"
                  data-testid={`button-delete-schedule-${item.id}`}
                />
              </div>
            )}
          </div>

          {hasDetails && (
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {item.location && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{item.location}
                </span>
              )}
              {item.zoneId && zones.length > 0 && (() => {
                const zone = zones.find((z: Zone) => z.id === item.zoneId);
                return zone ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0" data-testid={`badge-zone-${item.zoneId}`}>
                    {zone.name}
                  </Badge>
                ) : null;
              })()}
              {item.sectionId && sections.length > 0 && (() => {
                const section = sections.find((s: Section) => s.id === item.sectionId);
                return section ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary" data-testid={`badge-section-${item.sectionId}`}>
                    {section.name}
                  </Badge>
                ) : null;
              })()}
            </div>
          )}

          {hasCrew && (
            <div className="mt-0.5 space-y-0.5">
              {crew.map((member: any, idx: number) => (
                <div key={`${member.name}-${idx}`} className="flex items-center gap-1 flex-wrap" data-testid={`crew-badge-${member.name.replace(/\s+/g, '-')}`}>
                  <Users className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground font-medium">{member.name}</span>
                  {member.position && <span className="text-[11px] text-muted-foreground">· {member.position}</span>}
                  {(member.departments || []).map((dept: string) => (
                    <Badge key={dept} variant="outline" className="text-[9px] px-1 py-0 leading-tight">{dept}</Badge>
                  ))}
                </div>
              ))}
            </div>
          )}

          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
          )}
          <InlineComments scheduleId={item.id} />
        </div>
      </div>
    </div>
  );
}

function EditShowDialog({
  open,
  onClose,
  show,
}: {
  open: boolean;
  onClose: () => void;
  show: Event;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const form = useForm({
    defaultValues: {
      name: show.name,
      startDate: show.startDate || "",
      endDate: show.endDate || "",
      notes: show.notes || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: show.name,
      startDate: show.startDate || "",
      endDate: show.endDate || "",
      notes: show.notes || "",
    });
  }, [show, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/events/${show.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Show Updated" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: any) => {
    const payload: any = {
      name: values.name.trim(),
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      notes: values.notes || null,
    };
    updateMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Edit Show</DialogTitle>
          <DialogDescription>Update show details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} data-testid="input-edit-show-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const endDate = form.getValues("endDate");
                        if (endDate && v && endDate < v) form.setValue("endDate", v);
                      }}
                      maxDate={form.watch("endDate") || undefined}
                      data-testid="input-edit-show-start"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const startDate = form.getValues("startDate");
                        if (startDate && v && v < startDate) form.setValue("startDate", v);
                      }}
                      minDate={form.watch("startDate") || undefined}
                      data-testid="input-edit-show-end"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} rows={3} data-testid="input-edit-show-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-edit-show">
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleTab({
  eventName,
  selectedDate,
  schedules,
  isAdmin,
  zones,
  sections,
}: {
  eventName: string;
  selectedDate: string;
  schedules: Schedule[];
  isAdmin: boolean;
  zones: Zone[];
  sections: Section[];
}) {
  const { mutate: deleteSchedule } = useDeleteSchedule();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const { buildColorMap } = useColorScheme();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const showColorMap = useMemo(() => {
    return buildColorMap(eventsList.map((e: Event) => e.name));
  }, [eventsList, buildColorMap]);

  const dayItems = useMemo(() => {
    return schedules.filter(s => s.eventName === eventName && s.eventDate === selectedDate);
  }, [schedules, eventName, selectedDate]);

  const nestedItems = useMemo(() => {
    const nested = buildNestedSchedule(dayItems);
    return flattenNested(nested);
  }, [dayItems]);

  const handleDelete = (id: number) => {
    deleteSchedule(id, {
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <CreateScheduleDialog defaultEventName={eventName} defaultDate={selectedDate} />
            <ScheduleTemplateDialog defaultEventName={eventName} defaultDate={selectedDate} availableEvents={[eventName]} />
            {dayItems.length > 0 && (
              <>
                <SaveAsTemplateButton schedules={dayItems} eventName={eventName} />
                <CopyDayScheduleButton schedules={dayItems} defaultEventName={eventName} />
                <ClearDayButton date={selectedDate} eventName={eventName} count={dayItems.length} />
              </>
            )}
          </div>
        )}
        <div className="flex items-center border border-border/30 rounded-lg bg-card/50 backdrop-blur-sm" data-testid="project-schedule-view-toggle">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-2 py-1 flex items-center gap-1 text-xs transition-colors rounded-md",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
            )}
            data-testid="button-project-view-list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={cn(
              "px-2 py-1 flex items-center gap-1 text-xs transition-colors rounded-md",
              viewMode === "timeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
            )}
            data-testid="button-project-view-timeline"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {dayItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No schedule items for this date.
        </p>
      ) : viewMode === "timeline" ? (
        <GanttScheduleView
          schedules={dayItems}
          showColorMap={showColorMap}
          selectedEvents={[eventName]}
          canEdit={isAdmin}
          canComplete={isAdmin}
          onDelete={(id) => handleDelete(id)}
          renderEditDialog={(item, onClose) => (
            <EditScheduleDialog item={item} onClose={onClose} />
          )}
        />
      ) : (
        <div className="rounded-md border border-border">
          {nestedItems.map(({ item, depth }) => (
            <ScheduleItemRow
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              depth={depth}
              zones={zones}
              sections={sections}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CrewTab({
  eventName,
  contacts,
  allEventAssignments,
  isAdmin,
  selectedDate,
  isTour,
  projectAssignments,
  projectId,
}: {
  eventName: string;
  contacts: Contact[];
  allEventAssignments: any[];
  isAdmin: boolean;
  selectedDate: string;
  isTour?: boolean;
  projectAssignments?: any[];
  projectId?: number | null;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [numbersCopied, setNumbersCopied] = useState(false);

  const eventAssignmentsForShow = useMemo(() =>
    allEventAssignments.filter((a: any) => a.eventName === eventName),
    [allEventAssignments, eventName]
  );

  const assignedUserIds = useMemo(() =>
    new Set(eventAssignmentsForShow.map((a: any) => a.userId)),
    [eventAssignmentsForShow]
  );

  const crew = useMemo(() =>
    contacts.filter(c => c.userId && assignedUserIds.has(c.userId)),
    [contacts, assignedUserIds]
  );

  const crewWithPhone = useMemo(() => crew.filter(c => c.phone), [crew]);
  const crewMissingPhone = useMemo(() => crew.filter(c => !c.phone), [crew]);

  function buildSmsLink() {
    const numbers = crewWithPhone.map(c => c.phone!.replace(/\s/g, ""));
    return `sms:${numbers.join(",")}`;
  }

  function handleCopyNumbers() {
    const lines = crewWithPhone.map(c => {
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
      return `${name}: ${c.phone}`;
    }).join("\n");
    navigator.clipboard.writeText(lines);
    setNumbersCopied(true);
    setTimeout(() => setNumbersCopied(false), 2000);
  }

  const unassignedContacts = useMemo(() => {
    return contacts
      .filter(c => c.userId && !assignedUserIds.has(c.userId) && (!c.contactType || c.contactType === "crew"))
      .filter(c => {
        if (!searchQuery) return true;
        const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
  }, [contacts, assignedUserIds, searchQuery]);

  const { data: dailyCheckins = [] } = useQuery<any[]>({
    queryKey: ["/api/daily-checkins", eventName, selectedDate],
    enabled: !!eventName && !!selectedDate,
    queryFn: async () => {
      const res = await fetch(`/api/daily-checkins?eventName=${encodeURIComponent(eventName)}&date=${encodeURIComponent(selectedDate)}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const dailyCheckinsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of dailyCheckins) {
      map.set(c.userId, c);
    }
    return map;
  }, [dailyCheckins]);

  const dailyCheckIn = useMutation({
    mutationFn: async ({ userId, eventName: en, date }: { userId?: string; eventName: string; date: string }) => {
      const body: any = { eventName: en, date };
      if (userId) body.userId = userId;
      const res = await apiRequest("POST", "/api/daily-checkins", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkins", eventName, selectedDate] });
      toast({ title: "Checked In" });
    },
  });

  const dailyCheckOut = useMutation({
    mutationFn: async ({ checkinId }: { checkinId: number }) => {
      const res = await apiRequest("POST", `/api/daily-checkins/${checkinId}/checkout`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkins", eventName, selectedDate] });
      toast({ title: "Checked Out" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/event-assignments`, { eventName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      toast({ title: "Crew Assigned" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      await apiRequest("DELETE", `/api/event-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      toast({ title: "Crew Unassigned" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const myAssignment = eventAssignmentsForShow.find((a: any) => a.userId === user?.id);
  const myDailyCheckin = user?.id ? dailyCheckinsMap.get(user.id) : null;
  const myIsCheckedIn = !!myDailyCheckin?.checkedInAt;
  const myIsCheckedOut = !!myDailyCheckin?.checkedOutAt;

  const checkedInCount = eventAssignmentsForShow.filter((a: any) => {
    const checkin = dailyCheckinsMap.get(a.userId);
    return !!checkin?.checkedInAt;
  }).length;
  const totalCount = eventAssignmentsForShow.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {crew.length > 0 && (
            <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" data-testid={`button-message-crew-${eventName.replace(/\s+/g, '-')}`}>
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
                          <CheckIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
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
                    onClick={handleCopyNumbers}
                    disabled={crewWithPhone.length === 0}
                    data-testid={`button-copy-crew-numbers-${eventName.replace(/\s+/g, '-')}`}
                  >
                    {numbersCopied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {numbersCopied ? "Copied!" : "Copy Numbers"}
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="gap-1.5 flex-1"
                    disabled={crewWithPhone.length === 0}
                    data-testid={`button-open-group-text-${eventName.replace(/\s+/g, '-')}`}
                  >
                    <a href={buildSmsLink()}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      Open Group Text ({crewWithPhone.length})
                    </a>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {isAdmin && !isTour && (
            <Popover open={assignOpen} onOpenChange={setAssignOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" data-testid={`button-assign-crew-${eventName.replace(/\s+/g, '-')}`}>
                  <Plus className="w-3.5 h-3.5" /> Assign Crew
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                  data-testid="input-search-assign-crew"
                />
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {unassignedContacts.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">No contacts available</p>
                  ) : (
                    unassignedContacts.map(c => {
                      const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ");
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            if (c.userId) assignMutation.mutate(c.userId);
                          }}
                          className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover-elevate text-left"
                          data-testid={`button-assign-contact-${c.id}`}
                        >
                          <Plus className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-foreground">{fullName}</span>
                            {c.role && <span className="text-xs text-muted-foreground ml-1">({c.role})</span>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {totalCount > 0 && (
            <Badge variant={checkedInCount === totalCount ? "default" : "outline"} className="text-[10px]" data-testid={`badge-checkin-count-project-${eventName.replace(/\s+/g, '-')}`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {checkedInCount}/{totalCount}
            </Badge>
          )}
          {myAssignment && (
            myIsCheckedIn && !myIsCheckedOut ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-green-500/30 text-green-600 dark:text-green-400"
                onClick={() => dailyCheckOut.mutate({ checkinId: myDailyCheckin.id })}
                disabled={dailyCheckOut.isPending}
                data-testid={`button-project-checkout-${eventName.replace(/\s+/g, '-')}`}
              >
                {dailyCheckOut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                Check Out
              </Button>
            ) : myIsCheckedOut ? (
              <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 dark:text-green-400" data-testid={`badge-project-checked-out-${eventName.replace(/\s+/g, '-')}`}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Checked Out {myDailyCheckin.checkedOutAt ? format(new Date(myDailyCheckin.checkedOutAt), "h:mm a") : ""}
              </Badge>
            ) : (
              <Button
                size="sm"
                className="text-xs"
                onClick={() => dailyCheckIn.mutate({ eventName, date: selectedDate })}
                disabled={dailyCheckIn.isPending}
                data-testid={`button-project-checkin-${eventName.replace(/\s+/g, '-')}`}
              >
                {dailyCheckIn.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                Check In
              </Button>
            )
          )}
        </div>
      </div>

      {crew.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No crew assigned.
        </p>
      ) : (
        <div className="space-y-3">
          {(() => {
            const sorted = [...crew].sort((a, b) => {
              const nameA = [a.firstName, a.lastName].filter(Boolean).join(" ");
              const nameB = [b.firstName, b.lastName].filter(Boolean).join(" ");
              return nameA.localeCompare(nameB);
            });
            const grouped: Record<string, typeof crew> = {};
            sorted.forEach(c => {
              const dept = c.role
                ? c.role.split(",")[0].trim()
                : "General";
              if (!grouped[dept]) grouped[dept] = [];
              grouped[dept].push(c);
            });
            const deptNames = Object.keys(grouped).sort((a, b) => {
              if (a === "General") return 1;
              if (b === "General") return -1;
              return a.localeCompare(b);
            });
            return deptNames.map(dept => (
              <div key={dept} data-testid={`crew-department-${dept}`}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{dept}</p>
                <div className="space-y-0">
                  {grouped[dept].map(c => {
                    const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ");
                    const assignment = eventAssignmentsForShow.find((a: any) => a.userId === c.userId);
                    const projectAssignment = projectAssignments?.find((pa: any) => pa.userId === c.userId);
                    const displayPosition = projectAssignment?.position || assignment?.position || "";
                    const dailyCheckin = c.userId ? dailyCheckinsMap.get(c.userId) : null;
                    const isCheckedIn = !!dailyCheckin?.checkedInAt;
                    const isCheckedOut = !!dailyCheckin?.checkedOutAt;
                    const checkedInTime = dailyCheckin?.checkedInAt ? new Date(dailyCheckin.checkedInAt) : null;
                    const checkedOutTime = dailyCheckin?.checkedOutAt ? new Date(dailyCheckin.checkedOutAt) : null;
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          "flex items-start justify-between gap-3 py-2 group rounded-md px-2 transition-colors",
                          isCheckedIn && !isCheckedOut && "bg-green-500/5",
                        )}
                        data-testid={`crew-member-${c.id}`}
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          {isAdmin && c.userId && (
                            <button
                              className="flex-shrink-0 mt-0.5 rounded-full transition-colors cursor-pointer"
                              onClick={() => {
                                if (isCheckedIn && !isCheckedOut && dailyCheckin) {
                                  dailyCheckOut.mutate({ checkinId: dailyCheckin.id });
                                } else if (!isCheckedIn) {
                                  dailyCheckIn.mutate({ userId: c.userId!, eventName, date: selectedDate });
                                }
                              }}
                              title={isCheckedIn ? (isCheckedOut ? "Already checked out" : "Check out") : "Check in"}
                              data-testid={`button-project-admin-checkin-${c.id}`}
                            >
                              {isCheckedIn ? (
                                <CheckCircle2 className={cn("h-4 w-4", isCheckedOut ? "text-green-400/60" : "text-green-500")} />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </button>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{fullName}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {c.role && (
                                <span className="text-xs text-muted-foreground">{c.role}</span>
                              )}
                              {displayPosition && (
                                <>
                                  <span className="text-xs text-muted-foreground">&middot;</span>
                                  {displayPosition.split(" / ").filter(Boolean).map((pos: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[10px] uppercase tracking-wide">{pos}</Badge>
                                  ))}
                                </>
                              )}
                              {isAdmin && projectAssignment && (
                                <CrewPositionEditorProject assignmentId={projectAssignment.id} projectId={projectId} currentPosition={projectAssignment.position || ""} />
                              )}
                            </div>
                            {(isCheckedIn || isCheckedOut) && (
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {isCheckedIn && checkedInTime && (
                                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                    <LogIn className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />{format(checkedInTime, "h:mm a")}
                                  </span>
                                )}
                                {isCheckedOut && checkedOutTime && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    <LogOut className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />{format(checkedOutTime, "h:mm a")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          {c.phone && (
                            <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-phone-${c.id}`}>
                              <Phone className="w-3 h-3" />
                              <span className="hidden sm:inline">{c.phone}</span>
                            </a>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-email-${c.id}`}>
                              <Mail className="w-3 h-3" />
                              <span className="hidden sm:inline">{c.email}</span>
                            </a>
                          )}
                          {isAdmin && assignment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-all text-destructive"
                              onClick={() => unassignMutation.mutate(assignment.id)}
                              data-testid={`button-unassign-crew-${c.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
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
}

function VenueTab({
  venue,
  event,
  venues,
  isAdmin,
  resolvedVenueId,
  selectedDate,
}: {
  venue: Venue | null | undefined;
  event: Event;
  venues: Venue[];
  isAdmin: boolean;
  resolvedVenueId: number | null;
  selectedDate: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showVenueSelect, setShowVenueSelect] = useState(false);
  const [createVenueOpen, setCreateVenueOpen] = useState(false);

  // Sets venue for the currently selected day only — matches Dashboard VenueQuickSelect behavior
  const setDayVenueMutation = useMutation({
    mutationFn: async (venueId: number | null) => {
      if (venueId === null) {
        await apiRequest("DELETE", `/api/events/${event.id}/day-venues/${selectedDate}`);
        return null;
      }
      const res = await apiRequest("PUT", `/api/events/${event.id}/day-venues/${selectedDate}`, { venueId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: "Venue Updated" });
      setShowVenueSelect(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rows: { label: string; value: string | null | undefined; isLink?: boolean; href?: string }[] = venue ? [
    { label: "Address", value: venue.address, isLink: true },
    { label: "Production Contact", value: venue.contactName },
    { label: "Contact Phone", value: venue.contactPhone },
    { label: "WiFi SSID", value: venue.wifiSsid },
    { label: "WiFi Password", value: venue.wifiPassword },
    { label: "Parking", value: venue.parking },
    { label: "Load-In", value: venue.loadIn },
    { label: "Capacity", value: venue.capacity },
    { label: "Dressing Rooms", value: venue.dressingRooms ? (venue.dressingRoomsNotes || "Available") : null },
    { label: "Showers", value: venue.showers ? (venue.showersNotes || "Available") : null },
    { label: "Laundry", value: venue.laundry ? (venue.laundryNotes || "Available") : null },
    { label: "Meals", value: venue.meals && venue.meals !== "none" ? `${venue.meals}${venue.mealsNotes ? ` - ${venue.mealsNotes}` : ""}` : null },
  ] : [];

  return (
    <div data-testid={`venue-tab-${event.id}`}>
      {isAdmin && (
        <div className="mb-3 space-y-2">
          {!showVenueSelect ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVenueSelect(true)}
              className="gap-1.5"
              data-testid={`button-change-venue-${event.id}`}
            >
              <Pencil className="w-3.5 h-3.5" /> {venue ? `Change Venue · ${format(parseISO(selectedDate), "MMM d")}` : "Assign Venue"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-56">
                <SearchableSelect
                  options={[
                    { value: "none", label: "No venue" },
                    ...venues.map(v => ({ value: String(v.id), label: v.name, sublabel: v.address || undefined })),
                  ]}
                  value={resolvedVenueId ? String(resolvedVenueId) : "none"}
                  onValueChange={(val) => {
                    if (val === "create-new") {
                      setCreateVenueOpen(true);
                    } else {
                      setDayVenueMutation.mutate(val === "none" ? null : Number(val));
                    }
                  }}
                  placeholder="Select venue..."
                  searchPlaceholder="Search venues..."
                  data-testid={`select-venue-${event.id}`}
                >
                  <button
                    type="button"
                    onClick={() => setCreateVenueOpen(true)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent cursor-pointer border-t mt-1 pt-2"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create New Venue
                  </button>
                </SearchableSelect>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVenueSelect(false)}
                data-testid={`button-cancel-venue-change-${event.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <CreateVenueDialog
            open={createVenueOpen}
            onOpenChange={setCreateVenueOpen}
            onCreated={(v) => setDayVenueMutation.mutate(v.id)}
          />
        </div>
      )}

      {!venue ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No venue assigned.
        </p>
      ) : (
        <>
          <div data-testid={`venue-detail-${venue.id}`}>
            <h4 className="font-display font-bold text-sm uppercase tracking-wide text-foreground mb-2">
              {venue.name}
            </h4>
            <div className="space-y-1.5">
              {rows.map((row, idx) => {
                if (!row.value) return null;
                return (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground min-w-[110px] flex-shrink-0 text-xs">{row.label}</span>
                    {row.isLink ? (
                      <a
                        href={row.href || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.value)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline underline-offset-2 text-xs break-all"
                        data-testid={row.href ? `link-venue-tech-packet-${venue.id}` : `link-venue-address-${venue.id}`}
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="text-foreground text-xs break-all">{row.value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/30">
            <TechPacketHistory venueId={venue.id} canUpload={isAdmin} />
          </div>
        </>
      )}
    </div>
  );
}

function formatFileSizeProject(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIconProject({ type, className }: { type: string; className?: string }) {
  const iconMap: Record<string, { Icon: any; color: string }> = {
    image: { Icon: Eye, color: "text-violet-500" },
    pdf: { Icon: FileText, color: "text-red-500" },
    video: { Icon: BarChart3, color: "text-blue-500" },
    audio: { Icon: Mic2, color: "text-amber-500" },
    sheet: { Icon: List, color: "text-green-500" },
    file: { Icon: File, color: "text-muted-foreground" },
  };
  let key = "file";
  if (type.startsWith("image/")) key = "image";
  else if (type === "application/pdf") key = "pdf";
  else if (type.startsWith("video/")) key = "video";
  else if (type.startsWith("audio/")) key = "audio";
  else if (type.includes("spreadsheet") || type.includes("csv") || type.includes("excel")) key = "sheet";
  const { Icon, color } = iconMap[key];
  return <Icon className={cn("flex-shrink-0", color, className)} />;
}

function ProjectFileRow({ file, isAdmin, onDelete, onRename }: {
  file: any;
  isAdmin: boolean;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const isImage = file.type?.startsWith("image/");
  const uploadedAt = file.uploadedAt ? new Date(file.uploadedAt) : null;
  const timeAgo = uploadedAt ? (() => {
    const diff = Date.now() - uploadedAt.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return format(uploadedAt, "MMM d");
  })() : null;

  const handleRenameSubmit = () => {
    if (editName.trim() && editName.trim() !== file.name) {
      onRename(editName.trim());
    }
    setEditing(false);
  };

  return (
    <div
      className="flex items-center gap-2.5 p-2 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm"
      data-testid={`file-item-${file.id}`}
    >
      {isImage ? (
        <a href={`/api/files/${file.id}/download`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <div className="w-9 h-9 rounded-md overflow-hidden bg-muted border border-border/50">
            <img
              src={`/api/files/${file.id}/download`}
              alt={file.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </a>
      ) : (
        <div className="w-9 h-9 rounded-md bg-muted/50 border border-border/30 flex items-center justify-center flex-shrink-0">
          <FileTypeIconProject type={file.type || ""} className="w-4 h-4" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") { setEditing(false); setEditName(file.name); }
            }}
            onBlur={handleRenameSubmit}
            className="h-6 text-xs"
            autoFocus
            data-testid={`input-rename-file-${file.id}`}
          />
        ) : (
          <p
            className={cn("text-xs font-medium truncate", isAdmin && "cursor-pointer")}
            onClick={() => { if (isAdmin) { setEditing(true); setEditName(file.name); } }}
            data-testid={`text-filename-${file.id}`}
          >
            {file.name}
          </p>
        )}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>{file.type?.split("/")[1]?.toUpperCase() || "FILE"}</span>
          <span className="opacity-40">|</span>
          <span>{formatFileSizeProject(file.size || 0)}</span>
          {timeAgo && (
            <>
              <span className="opacity-40">|</span>
              <span>{timeAgo}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button asChild variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-download-file-${file.id}`}>
          <a href={`/api/files/${file.id}/download`} target="_blank" rel="noopener noreferrer">
            <Download className="h-3 w-3" />
          </a>
        </Button>
        {isAdmin && (
          <ConfirmDelete
            onConfirm={onDelete}
            title="Delete file?"
            description={`Remove "${file.name}"? This cannot be undone.`}
            triggerClassName="text-destructive flex-shrink-0"
            data-testid={`button-delete-file-${file.id}`}
            triggerLabel={<Trash2 className="h-3 w-3" />}
          />
        )}
      </div>
    </div>
  );
}

function ProjectFolderTreeNode({
  folder,
  allFolders,
  allFiles,
  isAdmin,
  expandedFolders,
  toggleFolder,
  deleteFile,
  renameFile,
  deleteFolder,
  renameFolder,
  createFolder,
  handleFileUpload,
  isUploading,
  uploadProgressText,
  eventName,
  depth,
  renamingFolderId,
  setRenamingFolderId,
  editFolderName,
  setEditFolderName,
  newFolderParent,
  setNewFolderParent,
  newFolderName,
  setNewFolderName,
}: {
  folder: FileFolder;
  allFolders: FileFolder[];
  allFiles: any[];
  isAdmin: boolean;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (key: string) => void;
  deleteFile: any;
  renameFile: any;
  deleteFolder: any;
  renameFolder: any;
  createFolder: any;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, folderName?: string) => void;
  isUploading: boolean;
  uploadProgressText: string | null;
  eventName: string;
  depth: number;
  renamingFolderId: number | null;
  setRenamingFolderId: (id: number | null) => void;
  editFolderName: string;
  setEditFolderName: (name: string) => void;
  newFolderParent: string | null;
  setNewFolderParent: (key: string | null) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
}) {
  const folderKey = `${eventName}__folder_${folder.id}`;
  const childFolders = allFolders.filter(f => f.parentId === folder.id);
  const folderFiles = allFiles.filter((f: any) => f.folderName === folder.name && f.eventName === eventName);
  const isFolderExpanded = expandedFolders[folderKey] !== false;
  const isRenaming = renamingFolderId === folder.id;
  const newFolderKey = `subfolder_${folder.id}`;
  const isCreatingChild = newFolderParent === newFolderKey;
  const totalItems = childFolders.length + folderFiles.length;

  const handleRenameSubmit = () => {
    if (editFolderName.trim() && editFolderName.trim() !== folder.name) {
      renameFolder.mutate({ id: folder.id, name: editFolderName.trim() });
    }
    setRenamingFolderId(null);
  };

  return (
    <div
      className="rounded-lg border border-border/40 bg-background/50"
      style={{ marginLeft: depth > 0 ? `${depth * 10}px` : undefined }}
      data-testid={`folder-${folder.id}`}
    >
      <div
        className="flex items-center gap-2 p-2.5 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => toggleFolder(folderKey)}
        data-testid={`button-toggle-folder-${folder.id}`}
      >
        <FolderOpen className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
        {isRenaming ? (
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setRenamingFolderId(null);
              }}
              onBlur={handleRenameSubmit}
              className="h-6 text-xs flex-1"
              autoFocus
              data-testid={`input-rename-folder-${folder.id}`}
            />
          </div>
        ) : (
          <span
            className={cn("text-xs font-semibold flex-1 truncate uppercase tracking-wide", isAdmin && "cursor-pointer")}
            onClick={(e) => {
              if (isAdmin) {
                e.stopPropagation();
                setRenamingFolderId(folder.id);
                setEditFolderName(folder.name);
              }
            }}
            data-testid={`text-foldername-${folder.id}`}
          >
            {folder.name}
          </span>
        )}
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{totalItems}</Badge>
        {isAdmin && (
          <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setNewFolderParent(newFolderKey); setNewFolderName(""); }}
              data-testid={`button-new-subfolder-${folder.id}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <ConfirmDelete
              onConfirm={() => deleteFolder.mutate(folder.id)}
              title="Delete folder?"
              description={`Delete folder "${folder.name}" and all its contents?`}
              triggerClassName="text-destructive"
              data-testid={`button-delete-folder-${folder.id}`}
            />
          </span>
        )}
        <motion.div animate={{ rotate: isFolderExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isFolderExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2.5 space-y-1.5">
              {isCreatingChild && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Subfolder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newFolderName.trim()) {
                        createFolder.mutate({ name: newFolderName.trim(), eventName, parentId: folder.id });
                      }
                      if (e.key === "Escape") { setNewFolderParent(null); setNewFolderName(""); }
                    }}
                    className="flex-1 h-7 text-xs"
                    autoFocus
                    data-testid={`input-new-subfolder-name-${folder.id}`}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newFolderName.trim()) createFolder.mutate({ name: newFolderName.trim(), eventName, parentId: folder.id });
                    }}
                    disabled={!newFolderName.trim() || createFolder.isPending}
                    data-testid={`button-create-subfolder-${folder.id}`}
                  >
                    {createFolder.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setNewFolderParent(null); setNewFolderName(""); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {childFolders.map((child) => (
                <ProjectFolderTreeNode
                  key={child.id}
                  folder={child}
                  allFolders={allFolders}
                  allFiles={allFiles}
                  isAdmin={isAdmin}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  deleteFile={deleteFile}
                  renameFile={renameFile}
                  deleteFolder={deleteFolder}
                  renameFolder={renameFolder}
                  createFolder={createFolder}
                  handleFileUpload={handleFileUpload}
                  isUploading={isUploading}
                  uploadProgressText={uploadProgressText}
                  eventName={eventName}
                  depth={0}
                  renamingFolderId={renamingFolderId}
                  setRenamingFolderId={setRenamingFolderId}
                  editFolderName={editFolderName}
                  setEditFolderName={setEditFolderName}
                  newFolderParent={newFolderParent}
                  setNewFolderParent={setNewFolderParent}
                  newFolderName={newFolderName}
                  setNewFolderName={setNewFolderName}
                />
              ))}
              {folderFiles.map((file: any) => (
                <ProjectFileRow
                  key={file.id}
                  file={file}
                  isAdmin={isAdmin}
                  onDelete={() => deleteFile.mutate(file.id)}
                  onRename={(name) => renameFile.mutate({ id: file.id, name })}
                />
              ))}
              {isAdmin && (
                <label
                  className={cn(
                    "flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed cursor-pointer transition-all",
                    "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                  )}
                  data-testid={`button-upload-folder-${folder.id}`}
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Upload className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {isUploading ? (uploadProgressText || "Uploading...") : "Upload to folder"}
                  </span>
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, folder.name)} disabled={isUploading} multiple />
                </label>
              )}
              {folderFiles.length === 0 && childFolders.length === 0 && !isAdmin && (
                <p className="text-xs text-muted-foreground py-2 text-center">No files in this folder.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilesTab({
  eventName,
  files,
  folders,
  isAdmin,
}: {
  eventName: string;
  files: FileRecord[];
  folders: FileFolder[];
  isAdmin: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderShow, setNewFolderShow] = useState(false);
  const [newRootFolderName, setNewRootFolderName] = useState("");

  const eventFiles = useMemo(() => {
    return files.filter(f => f.eventName === eventName);
  }, [files, eventName]);

  const eventFolders = useMemo(() => {
    return folders.filter(f => f.eventName === eventName);
  }, [folders, eventName]);

  const rootFolders = useMemo(() => {
    return eventFolders.filter(f => !f.parentId);
  }, [eventFolders]);

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
  };

  const deleteFile = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File Deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const renameFile = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to rename file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
  });

  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/file-folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to rename folder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setRenamingFolderId(null);
    },
  });

  const createFolder = useMutation({
    mutationFn: async ({ name, eventName: en, parentId }: { name: string; eventName: string; parentId?: number }) => {
      const body: any = { name, eventName: en };
      if (parentId) body.parentId = parentId;
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/file-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create folder");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      toast({ title: "Created", description: "Folder created." });
      setNewFolderName("");
      setNewFolderParent(null);
      setNewFolderShow(false);
      setNewRootFolderName("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/file-folders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete folder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Deleted", description: "Folder and its files removed." });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folderName?: string) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const totalFiles = fileList.length;
    setIsUploading(true);

    for (let i = 0; i < totalFiles; i++) {
      setUploadProgressText(totalFiles > 1 ? `Uploading ${i + 1} of ${totalFiles}...` : "Uploading...");
      const file = fileList[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventName", eventName);
      if (folderName) formData.append("folderName", folderName);
      try {
        const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/files", { method: "POST", credentials: "include", body: formData });
        if (!res.ok) throw new Error("Upload failed");
      } catch (err: any) {
        toast({ title: "Upload Error", description: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    toast({ title: "Uploaded", description: totalFiles > 1 ? `${totalFiles} files uploaded successfully.` : "File uploaded successfully." });
    setIsUploading(false);
    setUploadProgressText(null);
    e.target.value = "";
  };

  const looseFiles = eventFiles.filter(f => !f.folderName);

  return (
    <div className="space-y-2.5">
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          {newFolderShow ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Folder name"
                value={newRootFolderName}
                onChange={(e) => setNewRootFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRootFolderName.trim()) {
                    createFolder.mutate({ name: newRootFolderName.trim(), eventName });
                  }
                  if (e.key === "Escape") { setNewFolderShow(false); setNewRootFolderName(""); }
                }}
                className="flex-1 h-7 text-xs"
                autoFocus
                data-testid={`input-new-folder-name-${eventName}`}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newRootFolderName.trim()) createFolder.mutate({ name: newRootFolderName.trim(), eventName });
                }}
                disabled={!newRootFolderName.trim() || createFolder.isPending}
                data-testid={`button-create-folder-${eventName}`}
              >
                {createFolder.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setNewFolderShow(false); setNewRootFolderName(""); }}
                data-testid={`button-cancel-new-folder-${eventName}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setNewFolderShow(true)}
              data-testid={`button-new-folder-${eventName}`}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Folder
            </Button>
          )}
        </div>
      )}

      {rootFolders.map((folder) => (
        <ProjectFolderTreeNode
          key={folder.id}
          folder={folder}
          allFolders={eventFolders}
          allFiles={eventFiles}
          isAdmin={isAdmin}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          deleteFile={deleteFile}
          renameFile={renameFile}
          deleteFolder={deleteFolder}
          renameFolder={renameFolder}
          createFolder={createFolder}
          handleFileUpload={handleFileUpload}
          isUploading={isUploading}
          uploadProgressText={uploadProgressText}
          eventName={eventName}
          depth={0}
          renamingFolderId={renamingFolderId}
          setRenamingFolderId={setRenamingFolderId}
          editFolderName={editFolderName}
          setEditFolderName={setEditFolderName}
          newFolderParent={newFolderParent}
          setNewFolderParent={setNewFolderParent}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
        />
      ))}

      {looseFiles.map(file => (
        <ProjectFileRow
          key={file.id}
          file={file}
          isAdmin={isAdmin}
          onDelete={() => deleteFile.mutate(file.id)}
          onRename={(name) => renameFile.mutate({ id: file.id, name })}
        />
      ))}

      {isAdmin && (
        <label
          className={cn(
            "flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-all",
            "border-border/50 hover:border-primary/30 hover:bg-primary/5"
          )}
          data-testid={`button-upload-file-${eventName.replace(/\s+/g, '-')}`}
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Upload className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-[11px] text-muted-foreground font-medium">
            {isUploading ? (uploadProgressText || "Uploading...") : "Upload Files"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e)}
            disabled={isUploading}
            multiple
            data-testid={`input-upload-file-${eventName.replace(/\s+/g, '-')}`}
          />
        </label>
      )}

      {eventFiles.length === 0 && rootFolders.length === 0 && !isAdmin && (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <File className="h-8 w-8 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">No files for this show.</p>
        </div>
      )}
    </div>
  );
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function CrewTravelManifest({ travelDayId, isAdmin, contacts, assignedUserIds }: {
  travelDayId: number; isAdmin: boolean; contacts: Contact[]; assignedUserIds?: Set<string>;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: crewTravelList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/travel-days", travelDayId, "crew"],
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    userId: "", flightNumber: "", airline: "",
    departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: "",
    hotelName: "", hotelAddress: "", hotelCheckIn: "", hotelCheckOut: "",
    groundTransport: "", notes: ""
  });

  const resetForm = () => setForm({
    userId: "", flightNumber: "", airline: "",
    departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: "",
    hotelName: "", hotelAddress: "", hotelCheckIn: "", hotelCheckOut: "",
    groundTransport: "", notes: ""
  });

  const crewContacts = useMemo(() =>
    contacts.filter(c => c.userId && (!c.contactType || c.contactType === "crew") && (!assignedUserIds || assignedUserIds.has(c.userId!))),
    [contacts, assignedUserIds]
  );

  const getCrewName = (userId: string) => {
    const contact = contacts.find(c => c.userId === userId);
    if (contact) return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    return userId;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", `/api/travel-days/${travelDayId}/crew`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-days", travelDayId, "crew"] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: "Crew travel added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/crew-travel/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-days", travelDayId, "crew"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Crew travel updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/crew-travel/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-days", travelDayId, "crew"] });
      toast({ title: "Crew travel removed" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const bulkAddMutation = useMutation({
    mutationFn: async () => {
      const allUserIds = crewContacts.map(c => c.userId).filter(Boolean) as string[];
      const res = await apiRequest("POST", `/api/travel-days/${travelDayId}/crew/bulk`, { userIds: allUserIds });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-days", travelDayId, "crew"] });
      const count = data.created?.length || 0;
      toast({ title: count > 0 ? `${count} crew added` : "All crew already added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openEdit = (ct: any) => {
    setForm({
      userId: ct.userId || "",
      flightNumber: ct.flightNumber || "",
      airline: ct.airline || "",
      departureAirport: ct.departureAirport || "",
      arrivalAirport: ct.arrivalAirport || "",
      departureTime: ct.departureTime || "",
      arrivalTime: ct.arrivalTime || "",
      hotelName: ct.hotelName || "",
      hotelAddress: ct.hotelAddress || "",
      hotelCheckIn: ct.hotelCheckIn || "",
      hotelCheckOut: ct.hotelCheckOut || "",
      groundTransport: ct.groundTransport || "",
      notes: ct.notes || "",
    });
    setEditingId(ct.id);
  };

  const crewTravelForm = (
    <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
      <div>
        <Label>Crew Member</Label>
        <Select value={form.userId || "__none__"} onValueChange={v => setForm(p => ({ ...p, userId: v === "__none__" ? "" : v }))}>
          <SelectTrigger className="mt-1" data-testid="select-crew-travel-user">
            <SelectValue placeholder="Select crew member..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select crew member...</SelectItem>
            {crewContacts.map(c => (
              <SelectItem key={c.id} value={c.userId!}>
                {[c.firstName, c.lastName].filter(Boolean).join(" ")}
                {c.role ? ` (${c.role})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flight Details</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Airline</Label>
          <Input placeholder="e.g. United" value={form.airline} onChange={e => setForm(p => ({ ...p, airline: e.target.value }))} className="mt-1" data-testid="input-crew-travel-airline" />
        </div>
        <div>
          <Label>Flight Number</Label>
          <Input placeholder="e.g. UA1234" value={form.flightNumber} onChange={e => setForm(p => ({ ...p, flightNumber: e.target.value }))} className="mt-1" data-testid="input-crew-travel-flight" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Departure Airport</Label>
          <Input placeholder="SFO" value={form.departureAirport} onChange={e => setForm(p => ({ ...p, departureAirport: e.target.value.toUpperCase() }))} className="mt-1" maxLength={4} data-testid="input-crew-travel-dep-airport" />
        </div>
        <div>
          <Label>Arrival Airport</Label>
          <Input placeholder="LAX" value={form.arrivalAirport} onChange={e => setForm(p => ({ ...p, arrivalAirport: e.target.value.toUpperCase() }))} className="mt-1" maxLength={4} data-testid="input-crew-travel-arr-airport" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Departure Time</Label>
          <TimePicker value={form.departureTime} onChange={(v) => setForm(p => ({ ...p, departureTime: v }))} data-testid="input-crew-travel-dep-time" />
        </div>
        <div>
          <Label>Arrival Time</Label>
          <TimePicker value={form.arrivalTime} onChange={(v) => setForm(p => ({ ...p, arrivalTime: v }))} data-testid="input-crew-travel-arr-time" />
        </div>
      </div>
      <Separator />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hotel</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Hotel Name</Label>
          <Input placeholder="e.g. Hilton Downtown" value={form.hotelName} onChange={e => setForm(p => ({ ...p, hotelName: e.target.value }))} className="mt-1" data-testid="input-crew-travel-hotel" />
        </div>
        <div>
          <Label>Hotel Address</Label>
          <Input placeholder="123 Main St" value={form.hotelAddress} onChange={e => setForm(p => ({ ...p, hotelAddress: e.target.value }))} className="mt-1" data-testid="input-crew-travel-hotel-address" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Check-In</Label>
          <DatePicker
            value={form.hotelCheckIn}
            onChange={(v) => {
              setForm(p => ({ ...p, hotelCheckIn: v }));
              if (form.hotelCheckOut && v && form.hotelCheckOut < v) setForm(p => ({ ...p, hotelCheckOut: v }));
            }}
            maxDate={form.hotelCheckOut || undefined}
            data-testid="input-crew-travel-hotel-checkin"
          />
        </div>
        <div>
          <Label>Check-Out</Label>
          <DatePicker
            value={form.hotelCheckOut}
            onChange={(v) => {
              setForm(p => ({ ...p, hotelCheckOut: v }));
              if (form.hotelCheckIn && v && v < form.hotelCheckIn) setForm(p => ({ ...p, hotelCheckIn: v }));
            }}
            minDate={form.hotelCheckIn || undefined}
            data-testid="input-crew-travel-hotel-checkout"
          />
        </div>
      </div>
      <Separator />
      <div>
        <Label>Ground Transport</Label>
        <Input placeholder="e.g. Rental car from Hertz" value={form.groundTransport} onChange={e => setForm(p => ({ ...p, groundTransport: e.target.value }))} className="mt-1" data-testid="input-crew-travel-ground" />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea placeholder="Additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 resize-none" rows={2} data-testid="input-crew-travel-notes" />
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  }

  const [expandedCrew, setExpandedCrew] = useState<Set<number>>(new Set());
  const toggleCrewExpand = (id: number) => setExpandedCrew(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="space-y-2" data-testid={`crew-travel-manifest-${travelDayId}`}>
      {crewTravelList.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No crew travel details yet.</p>
      )}
      {crewTravelList.map((ct: any) => {
        const hasFlight = ct.flightNumber || ct.departureAirport || ct.arrivalAirport;
        const hasHotel = ct.hotelName;
        const hasDetails = hasFlight || hasHotel || ct.groundTransport || ct.notes;
        const isCrewExpanded = expandedCrew.has(ct.id);
        return (
          <div key={ct.id} className="rounded-md border border-border/40 bg-background/50 group" data-testid={`crew-travel-item-${ct.id}`}>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleCrewExpand(ct.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid={`text-crew-travel-name-${ct.id}`}>{getCrewName(ct.userId)}</p>
                {!isCrewExpanded && hasFlight && (
                  <span className="text-[10px] text-muted-foreground truncate">{ct.departureAirport && ct.arrivalAirport ? `${ct.departureAirport} → ${ct.arrivalAirport}` : ct.flightNumber || ""}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isAdmin && isCrewExpanded && (
                  <span className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(ct)} data-testid={`button-edit-crew-travel-${ct.id}`}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <ConfirmDelete
                      onConfirm={() => deleteMutation.mutate(ct.id)}
                      title="Remove crew travel?"
                      description="This will remove the travel details for this crew member."
                      triggerClassName="text-destructive"
                      data-testid={`button-delete-crew-travel-${ct.id}`}
                      triggerLabel={<Trash2 className="w-3 h-3" />}
                    />
                  </span>
                )}
                {hasDetails && (
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isCrewExpanded && "rotate-180")} />
                )}
              </div>
            </button>
            {isCrewExpanded && hasDetails && (
              <div className="px-2.5 pb-2.5 space-y-1">
                {hasFlight && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Plane className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    {ct.airline && <span className="text-xs text-muted-foreground">{ct.airline}</span>}
                    {ct.flightNumber && <span className="text-xs font-semibold">{ct.flightNumber}</span>}
                    {(ct.departureAirport || ct.arrivalAirport) && (
                      <span className="text-xs text-muted-foreground">
                        {ct.departureAirport || "—"} {ct.departureTime ? `(${ct.departureTime})` : ""} → {ct.arrivalAirport || "—"} {ct.arrivalTime ? `(${ct.arrivalTime})` : ""}
                      </span>
                    )}
                  </div>
                )}
                {hasHotel && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{ct.hotelName}</span>
                    {ct.hotelAddress && <span className="text-xs text-muted-foreground">· {ct.hotelAddress}</span>}
                    {(ct.hotelCheckIn || ct.hotelCheckOut) && (
                      <span className="text-[10px] text-muted-foreground">
                        {ct.hotelCheckIn && format(parseISO(ct.hotelCheckIn), "MMM d")}
                        {ct.hotelCheckIn && ct.hotelCheckOut && " – "}
                        {ct.hotelCheckOut && format(parseISO(ct.hotelCheckOut), "MMM d")}
                      </span>
                    )}
                  </div>
                )}
                {ct.groundTransport && (
                  <div className="flex items-center gap-2">
                    <Car className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{ct.groundTransport}</span>
                  </div>
                )}
                {ct.notes && (
                  <p className="text-xs text-muted-foreground italic">{ct.notes}</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { resetForm(); setAddDialogOpen(true); }} data-testid={`button-add-crew-travel-${travelDayId}`}>
            <Plus className="w-3 h-3" /> Add Crew
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => bulkAddMutation.mutate()}
            disabled={bulkAddMutation.isPending}
            data-testid={`button-add-all-crew-${travelDayId}`}
          >
            <Users className="w-3 h-3" /> {bulkAddMutation.isPending ? "Adding..." : "Add All Crew"}
          </Button>
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={(o) => { setAddDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-[520px] font-body max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Add Crew Travel</DialogTitle>
            <DialogDescription className="sr-only">Add travel details for a crew member</DialogDescription>
          </DialogHeader>
          {crewTravelForm}
          <Button
            className="w-full flex-shrink-0 mt-3"
            onClick={() => form.userId && createMutation.mutate(form)}
            disabled={!form.userId || createMutation.isPending}
            data-testid="button-save-crew-travel"
          >
            {createMutation.isPending ? "Adding..." : "Add Crew Travel"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={editingId !== null} onOpenChange={(o) => { if (!o) { setEditingId(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-[520px] font-body max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Edit Crew Travel</DialogTitle>
            <DialogDescription className="sr-only">Edit travel details for a crew member</DialogDescription>
          </DialogHeader>
          {crewTravelForm}
          <Button
            className="w-full flex-shrink-0 mt-3"
            onClick={() => editingId && updateMutation.mutate({ id: editingId, data: form })}
            disabled={updateMutation.isPending}
            data-testid="button-update-crew-travel"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TourItinerary({ project, events, venues, allDayVenues, travelDays, isAdmin, schedules, zones, sections, allFiles, fileFolders, allEventAssignments, contacts, onEditShow, onDeleteShow }: {
  project: Project; events: Event[]; venues: Venue[]; allDayVenues: EventDayVenue[]; travelDays: TravelDay[]; isAdmin: boolean;
  schedules: Schedule[]; zones: Zone[]; sections: Section[]; allFiles: FileRecord[]; fileFolders: FileFolder[];
  allEventAssignments: any[]; contacts: Contact[]; onEditShow: (eventId: number) => void; onDeleteShow: (eventId: number) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showDates, setShowDates] = useState<Record<number, string>>({});
  const [showTabs, setShowTabs] = useState<Record<number, string>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTravel, setNewTravel] = useState({
    date: "", legId: null as number | null, notes: "", flightNumber: "", airline: "",
    departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: ""
  });

  const resetForm = () => setNewTravel({
    date: "", legId: null, notes: "", flightNumber: "", airline: "",
    departureAirport: "", arrivalAirport: "", departureTime: "", arrivalTime: ""
  });

  const { data: projectAssignments = [] } = useQuery<any[]>({
    queryKey: ["/api/project-assignments", project.id],
  });

  const { data: legs = [] } = useQuery<Leg[]>({
    queryKey: ["/api/projects", project.id, "legs"],
  });

  const tourAssignedUserIds = useMemo(() => {
    const ids = new Set<string>();
    const projectEventNames = new Set(events.map(e => e.name));
    allEventAssignments.forEach((a: any) => {
      if (a.userId && projectEventNames.has(a.eventName)) ids.add(a.userId);
    });
    projectAssignments.forEach((pa: any) => {
      if (pa.userId) ids.add(pa.userId);
    });
    return ids;
  }, [events, allEventAssignments, projectAssignments]);

  const toggleItem = (key: string, event?: Event) => {
    setExpandedItems(prev => {
      const isExpanding = !prev[key];
      if (isExpanding && event) {
        if (!showDates[event.id]) {
          const today = format(new Date(), "yyyy-MM-dd");
          const defaultDate = (event.startDate && event.startDate <= today && (!event.endDate || event.endDate >= today))
            ? today : (event.startDate || today);
          setShowDates(sd => ({ ...sd, [event.id]: defaultDate }));
        }
        if (!showTabs[event.id]) {
          setShowTabs(st => ({ ...st, [event.id]: "schedule" }));
        }
      }
      return { ...prev, [key]: isExpanding };
    });
  };

  function getDateRange(event: Event): string[] {
    if (!event.startDate || !event.endDate) return event.startDate ? [event.startDate] : [];
    try {
      return eachDayOfInterval({ start: parseISO(event.startDate), end: parseISO(event.endDate) }).map(d => format(d, "yyyy-MM-dd"));
    } catch { return [event.startDate]; }
  }

  const createTravelDay = useMutation({
    mutationFn: async (data: typeof newTravel) => {
      await apiRequest("POST", `/api/projects/${project.id}/travel-days`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "travel-days"] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: "Travel day added" });
    },
  });

  const deleteTravelDay = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/travel-days/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "travel-days"] });
      toast({ title: "Travel day removed" });
    },
  });

  type ItineraryItem = { type: "show"; event: Event; venue: Venue | null; date: string } | { type: "travel"; travelDay: TravelDay; date: string };
  type LegGroup = { legId: number | null; leg: Leg | null; items: ItineraryItem[] };

  const legGroups = useMemo((): LegGroup[] => {
    const showItems: ItineraryItem[] = [];
    const sorted = [...events].sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
    for (const event of sorted) {
      const dayVenue = allDayVenues.find(dv => dv.eventId === event.id && dv.date === event.startDate);
      const venueId = dayVenue ? dayVenue.venueId : event.venueId;
      const venue = venueId ? venues.find(v => v.id === venueId) || null : null;
      showItems.push({ type: "show" as const, event, venue, date: event.startDate || "" });
    }
    const travelItems: ItineraryItem[] = travelDays.map(td => ({ type: "travel" as const, travelDay: td, date: td.date }));

    // Group by legId
    const legMap = new Map<number | null, ItineraryItem[]>();
    for (const item of showItems) {
      const legId = item.type === "show" ? (item.event as any).legId ?? null : null;
      if (!legMap.has(legId)) legMap.set(legId, []);
      legMap.get(legId)!.push(item);
    }
    for (const item of travelItems) {
      const legId = (item as any).travelDay?.legId ?? null;
      if (!legMap.has(legId)) legMap.set(legId, []);
      legMap.get(legId)!.push(item);
    }

    // Sort items within each group by date
    legMap.forEach((items: ItineraryItem[]) => {
      items.sort((a: ItineraryItem, b: ItineraryItem) => (a.date || "").localeCompare(b.date || ""));
    });

    // Build groups: sorted legs first, then unassigned
    const sortedLegs = [...legs].sort((a, b) => {
      const aItems = legMap.get(a.id) || [];
      const bItems = legMap.get(b.id) || [];
      const aDate = aItems.reduce((min, i) => i.date && i.date < min ? i.date : min, "9999");
      const bDate = bItems.reduce((min, i) => i.date && i.date < min ? i.date : min, "9999");
      return aDate.localeCompare(bDate);
    });
    const groups: LegGroup[] = [];
    for (const leg of sortedLegs) {
      groups.push({ legId: leg.id, leg, items: legMap.get(leg.id) || [] });
    }
    // Unassigned group (legId=null)
    const unassigned = legMap.get(null) || [];
    if (unassigned.length > 0 || legs.length > 0) {
      groups.push({ legId: null, leg: null, items: unassigned });
    }

    // If no legs exist at all, just return one group with everything
    if (legs.length === 0 && groups.length === 0) {
      const all = [...showItems, ...travelItems].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      return [{ legId: null, leg: null, items: all }];
    }

    return groups;
  }, [events, venues, allDayVenues, travelDays, legs]);

  return (
    <div className="space-y-3" data-testid="tour-itinerary">

      {legGroups.every(g => g.items.length === 0) && (
        <p className="text-center text-sm text-muted-foreground py-4">No stops or travel days yet.</p>
      )}

      {legGroups.map((group) => {
        const showLegHeader = legs.length > 0;
        const showCount = group.items.filter(i => i.type === "show").length;

        return (
          <div key={group.legId ?? "unassigned"} className="space-y-3">
            {showLegHeader && (
              <div className="flex items-center gap-2 pt-3 pb-1">
                <div className="flex-1 min-w-0">
                  {group.leg ? (
                    <Link href={`/admin?project=${project.id}`} className="font-display font-bold text-sm uppercase tracking-wider text-primary truncate hover:underline cursor-pointer">
                      {group.leg.name}
                    </Link>
                  ) : (
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider text-primary truncate">
                      Unassigned
                    </h3>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{showCount} {showCount === 1 ? "show" : "shows"}</span>
                    {group.leg?.notes && <span>· {group.leg.notes}</span>}
                  </div>
                </div>
              </div>
            )}
            {showLegHeader && <Separator />}

            {group.items.map((item, i) => {
        const prev = i > 0 ? group.items[i - 1] : null;
        let distance: number | null = null;
        if (prev) {
          const prevVenue = prev.type === "show" ? (prev as any).venue as Venue | null : null;
          const curVenue = item.type === "show" ? (item as any).venue as Venue | null : null;
          if (prevVenue?.latitude && prevVenue?.longitude && curVenue?.latitude && curVenue?.longitude) {
            distance = Math.round(haversineDistance(
              parseFloat(prevVenue.latitude), parseFloat(prevVenue.longitude),
              parseFloat(curVenue.latitude), parseFloat(curVenue.longitude)
            ));
          }
        }

        if (item.type === "travel") {
          const td = (item as any).travelDay as TravelDay;
          const itemKey = `travel-${td.id}`;
          const isExpanded = expandedItems[itemKey] || false;
          return (
            <div key={itemKey} data-testid={`itinerary-travel-${td.id}`}>
              {distance !== null && (
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                  <Navigation className="w-3 h-3" /> {distance} mi
                </div>
              )}
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/5">
                <button
                  className="flex items-center gap-3 w-full text-left px-4 py-3 hover-elevate rounded-xl"
                  onClick={() => toggleItem(itemKey)}
                  data-testid={`button-expand-travel-${td.id}`}
                >
                  <Plane className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm uppercase tracking-wide text-amber-600 dark:text-amber-400">Travel Day</div>
                    <div className="text-xs text-muted-foreground">{format(parseISO(td.date), "EEEE, MMM d")}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAdmin && (
                      <span onClick={e => e.stopPropagation()}>
                        <ConfirmDelete
                          onConfirm={() => deleteTravelDay.mutate(td.id)}
                          title="Delete travel day?"
                          description="This will remove the travel day and all crew travel details."
                          triggerClassName="text-muted-foreground"
                          data-testid={`button-delete-travel-${td.id}`}
                          triggerLabel={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </span>
                    )}
                    <div className="text-right">
                      <div className="text-2xl font-display font-bold text-amber-400 leading-none">
                        {format(parseISO(td.date), "d")}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {format(parseISO(td.date), "MMM")}
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-amber-400/20">
                        {td.notes && <p className="text-xs text-muted-foreground mb-2 italic">{td.notes}</p>}
                        {(td.flightNumber || td.departureAirport) && (
                          <div className="mb-2 p-2 rounded-md bg-amber-500/5 border border-amber-400/20">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Group Flight</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {td.airline && <span className="text-xs text-amber-700 dark:text-amber-300">{td.airline}</span>}
                              {td.flightNumber && <span className="text-xs font-semibold">{td.flightNumber}</span>}
                              {(td.departureAirport || td.arrivalAirport) && (
                                <span className="text-xs text-muted-foreground">
                                  {td.departureAirport || "—"} {td.departureTime ? `(${td.departureTime})` : ""} → {td.arrivalAirport || "—"} {td.arrivalTime ? `(${td.arrivalTime})` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <CrewTravelManifest travelDayId={td.id} isAdmin={isAdmin} contacts={contacts} assignedUserIds={tourAssignedUserIds} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        }

        const show = item as { type: "show"; event: Event; venue: Venue | null; date: string };
        const itemKey = `show-${show.event.id}`;
        const isExpanded = expandedItems[itemKey] || false;
        const crewUserIds = new Set(allEventAssignments.filter((a: any) => a.eventName === show.event.name).map((a: any) => a.userId));
        const crewCount = contacts.filter(c => c.userId && crewUserIds.has(c.userId)).length;
        const selectedDate = showDates[show.event.id] || show.event.startDate || format(new Date(), "yyyy-MM-dd");
        const dayVenue = allDayVenues.find(dv => dv.eventId === show.event.id && dv.date === selectedDate);
        const resolvedVenueId = dayVenue ? dayVenue.venueId : show.event.venueId;
        const resolvedVenue = resolvedVenueId ? venues.find(v => v.id === resolvedVenueId) || null : null;
        const activeTab = showTabs[show.event.id] || "schedule";
        const dateRange = getDateRange(show.event);

        return (
          <div key={itemKey} data-testid={`itinerary-show-${show.event.id}`}>
            {distance !== null && (
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                <Navigation className="w-3 h-3" /> {distance} mi
              </div>
            )}
            <Card className="border border-border" data-testid={`card-project-show-${show.event.id}`}>
              <CardContent className="p-0">
                <div className="flex items-start">
                  <button
                    className="flex-1 text-left p-4 hover-elevate rounded-md min-w-0"
                    onClick={() => toggleItem(itemKey, show.event)}
                    data-testid={`btn-expand-show-${show.event.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/?event=${encodeURIComponent(show.event.name)}${show.event.startDate ? `&date=${show.event.startDate}` : ""}`} className="font-display font-bold text-base uppercase tracking-wide text-foreground truncate hover:underline hover:text-primary cursor-pointer block" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          {show.event.name}
                        </Link>
                        {(show.event.startDate || show.event.endDate) && (
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                            <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              {show.event.startDate && format(parseISO(show.event.startDate), "MMM d, yyyy")}
                              {show.event.startDate && show.event.endDate && show.event.startDate !== show.event.endDate && (
                                <> — {format(parseISO(show.event.endDate), "MMM d, yyyy")}</>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {show.venue && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span>{show.venue.name}</span>
                            </span>
                          )}
                          {crewCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3 flex-shrink-0" />
                              <span>{crewCount} crew</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {show.event.startDate && (
                          <div className="text-right">
                            <div className="text-2xl font-display font-bold text-yellow-400 leading-none">
                              {format(parseISO(show.event.startDate), "d")}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {format(parseISO(show.event.startDate), "MMM")}
                            </div>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>
                  {isAdmin && (
                    <div className="flex items-center flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="m-1 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); onEditShow(show.event.id); }}
                        data-testid={`button-edit-show-${show.event.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <ConfirmDelete
                        onConfirm={() => onDeleteShow(show.event.id)}
                        title="Delete Show"
                        description={`Are you sure you want to delete "${show.event.name}"? This will remove all schedules, crew assignments, and files for this show.`}
                        triggerClassName="m-1 text-muted-foreground hover:text-destructive"
                        data-testid={`button-delete-show-${show.event.id}`}
                      />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Separator />
                      <div className="p-4 space-y-3">
                        {dateRange.length > 1 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {dateRange.map(date => {
                              const isSelected = date === selectedDate;
                              const isTodayDate = isToday(parseISO(date));
                              return (
                                <button
                                  key={date}
                                  onClick={() => setShowDates(sd => ({ ...sd, [show.event.id]: date }))}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : isTodayDate
                                      ? "bg-muted text-foreground"
                                      : "bg-muted/50 text-muted-foreground hover-elevate"
                                  }`}
                                  data-testid={`date-pill-${show.event.id}-${date}`}
                                >
                                  {format(parseISO(date), "EEE d")}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <Tabs
                          value={activeTab}
                          onValueChange={(val) => setShowTabs(st => ({ ...st, [show.event.id]: val }))}
                        >
                          <TabsList className="w-full">
                            <TabsTrigger value="schedule" className="flex-1" data-testid={`tab-schedule-${show.event.id}`}>Schedule</TabsTrigger>
                            <TabsTrigger value="crew" className="flex-1" data-testid={`tab-crew-${show.event.id}`}>Crew</TabsTrigger>
                            <TabsTrigger value="venue" className="flex-1" data-testid={`tab-venue-${show.event.id}`}>Venue</TabsTrigger>
                            <TabsTrigger value="files" className="flex-1" data-testid={`tab-files-${show.event.id}`}>Files</TabsTrigger>
                          </TabsList>
                          <TabsContent value="schedule" className="mt-3">
                            <ScheduleTab eventName={show.event.name} selectedDate={selectedDate} schedules={schedules} isAdmin={isAdmin} zones={zones} sections={sections} />
                          </TabsContent>
                          <TabsContent value="crew" className="mt-3">
                            <CrewTab eventName={show.event.name} contacts={contacts} allEventAssignments={allEventAssignments} isAdmin={isAdmin} selectedDate={selectedDate} isTour={true} projectAssignments={projectAssignments} projectId={project.id} />
                          </TabsContent>
                          <TabsContent value="venue" className="mt-3">
                            <VenueTab venue={resolvedVenue} event={show.event} venues={venues} isAdmin={isAdmin} resolvedVenueId={resolvedVenueId ?? null} selectedDate={selectedDate} />
                          </TabsContent>
                          <TabsContent value="files" className="mt-3">
                            <FilesTab eventName={show.event.name} files={allFiles} folders={fileFolders} isAdmin={isAdmin} />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        );
      })}
          </div>
        );
      })}
    </div>
  );
}

function CreateShowInline({ isFestival, venues, isPending, onSubmit, onCancel }: {
  isFestival: boolean;
  venues: Venue[];
  isPending: boolean;
  onSubmit: (data: { name: string; startDate: string; endDate: string; venueId: number | null }) => void;
  onCancel: () => void;
}) {
  const entityLabel = isFestival ? "Stage" : "Show";
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [venueId, setVenueId] = useState<number | null>(null);

  return (
    <Card className="border-primary/30" data-testid="card-create-show">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wide">New {entityLabel}</h3>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">{entityLabel} Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${entityLabel.toLowerCase()} name`}
              data-testid="input-show-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <DatePicker value={startDate} onChange={setStartDate} data-testid="input-show-start" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <DatePicker value={endDate} onChange={setEndDate} minDate={startDate} data-testid="input-show-end" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Venue</Label>
            <Select value={venueId?.toString() || ""} onValueChange={(v) => setVenueId(v ? Number(v) : null)}>
              <SelectTrigger data-testid="select-show-venue">
                <SelectValue placeholder="Select venue (optional)" />
              </SelectTrigger>
              <SelectContent>
                {venues.map(v => (
                  <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-cancel-show">Cancel</Button>
          <Button
            size="sm"
            disabled={!name.trim() || isPending || endDate < startDate}
            onClick={() => onSubmit({ name: name.trim(), startDate, endDate, venueId })}
            data-testid="button-submit-show"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create {entityLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectPage() {
  const [, params] = useRoute("/project/:id");
  const projectId = params?.id ? Number(params.id) : null;
  const searchString = useSearch();
  const backHref = new URLSearchParams(searchString).get("from") === "admin" ? "/admin" : "/";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { user } = useAuth();
  const isAdmin = ["owner", "manager", "admin"].includes(user?.role || "");

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: allEvents = [], isLoading: eventsLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: venues = [] } = useVenues();
  const { data: contacts = [] } = useContacts();
  const { data: schedules = [] } = useSchedules();
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"] });
  const { data: allFiles = [] } = useQuery<FileRecord[]>({ queryKey: ["/api/files"] });
  const { data: fileFolders = [] } = useQuery<FileFolder[]>({ queryKey: ["/api/file-folders"] });
  const { data: zones = [] } = useZones();
  const { data: sections = [] } = useSections();
  const { data: allDayVenues = [] } = useQuery<EventDayVenue[]>({ queryKey: ["/api/event-day-venues"] });
  const { data: travelDays = [] } = useQuery<TravelDay[]>({
    queryKey: ["/api/projects", projectId, "travel-days"],
    enabled: !!projectId,
  });

  const { data: projectAssignments = [] } = useQuery<any[]>({
    queryKey: ["/api/project-assignments", projectId],
    enabled: !!projectId,
  });

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

  const projectEvents = useMemo(() => {
    if (!projectId) return [];
    let evts = allEvents.filter(e => e.projectId === projectId);
    if (!isAdmin) {
      const assigned = user?.eventAssignments as string[] | undefined;
      if (assigned && assigned.length > 0) {
        const assignedSet = new Set(assigned);
        evts = evts.filter(e => assignedSet.has(e.name));
      } else {
        evts = [];
      }
    }
    evts.sort((a, b) => {
      if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      return a.name.localeCompare(b.name);
    });
    return evts;
  }, [allEvents, projectId, isAdmin, user]);

  const [expandedShows, setExpandedShows] = useState<Record<number, boolean>>({});
  const [showDates, setShowDates] = useState<Record<number, string>>({});
  const [showTabs, setShowTabs] = useState<Record<number, string>>({});
  const [editShowDialogId, setEditShowDialogId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const deleteShowMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: "Show deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createShowMutation = useMutation({
    mutationFn: async (data: { name: string; startDate: string; endDate: string; venueId: number | null }) => {
      if (!projectId) throw new Error("Project ID is required");
      const res = await apiRequest("POST", "/api/events", {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        venueId: data.venueId,
        projectId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: project?.isFestival ? "Stage created" : "Show created" });
      setShowCreateDialog(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (projectEvents.length > 0 && Object.keys(expandedShows).length === 0) {
      const first = projectEvents[0];
      setExpandedShows({ [first.id]: true });
      setShowTabs({ [first.id]: "schedule" });
      setShowDates({ [first.id]: getDefaultDate(first) });
    }
  }, [projectEvents]);

  function getDefaultDate(event: Event): string {
    const today = format(new Date(), "yyyy-MM-dd");
    if (event.startDate && event.startDate <= today && (!event.endDate || event.endDate >= today)) {
      return today;
    }
    return event.startDate || today;
  }

  function getDateRange(event: Event): string[] {
    if (!event.startDate || !event.endDate) return event.startDate ? [event.startDate] : [];
    try {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      return eachDayOfInterval({ start, end }).map(d => format(d, "yyyy-MM-dd"));
    } catch {
      return [event.startDate];
    }
  }

  function toggleExpand(eventId: number, event: Event) {
    setExpandedShows(prev => {
      const isExpanding = !prev[eventId];
      if (isExpanding && !showDates[eventId]) {
        setShowDates(sd => ({ ...sd, [eventId]: getDefaultDate(event) }));
      }
      if (isExpanding && !showTabs[eventId]) {
        setShowTabs(st => ({ ...st, [eventId]: "schedule" }));
      }
      return { ...prev, [eventId]: isExpanding };
    });
  }

  const isLoading = projectsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Link href={backHref}>
          <Button variant="outline" data-testid="btn-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backHref === "/admin" ? "Back to Projects" : "Back to Dashboard"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      <AppHeader showBack>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-display font-bold text-accent truncate" data-testid="text-project-name">
              {project.name}
            </span>
            {project.driveUrl && (
              <a href={project.driveUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 flex-shrink-0" data-testid="link-project-drive" title="Open Google Drive">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
            <span>{projectEvents.length} {project.isFestival ? "stage" : "show"}{projectEvents.length !== 1 ? "s" : ""}</span>
            {project.isFestival && <Badge variant="secondary" className="text-[10px]">Festival</Badge>}
            {project.isTour && <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400">Tour</Badge>}
          </div>
        </div>
      </AppHeader>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {isAdmin && (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowCreateDialog(true)} data-testid="button-add-show">
              <Plus className="w-4 h-4 mr-2" />
              New {project.isFestival ? "Stage" : "Show"}
            </Button>
          </div>
        )}

        {showCreateDialog && (
          <CreateShowInline
            isFestival={project.isFestival ?? false}
            venues={venues}
            isPending={createShowMutation.isPending}
            onSubmit={(data) => createShowMutation.mutate(data)}
            onCancel={() => setShowCreateDialog(false)}
          />
        )}

        {project.isTour ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <TourItinerary
              project={project}
              events={projectEvents}
              venues={venues}
              allDayVenues={allDayVenues}
              travelDays={travelDays}
              isAdmin={isAdmin}
              schedules={schedules}
              zones={zones}
              sections={sections}
              allFiles={allFiles}
              fileFolders={fileFolders}
              allEventAssignments={allEventAssignments}
              contacts={contacts}
              onEditShow={(eventId) => setEditShowDialogId(eventId)}
              onDeleteShow={(eventId) => deleteShowMutation.mutate(eventId)}
            />
            {editShowDialogId !== null && (
              <EditShowDialog
                open={true}
                onClose={() => setEditShowDialogId(null)}
                show={projectEvents.find(e => e.id === editShowDialogId)!}
              />
            )}
          </motion.div>
        ) : projectEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-no-shows">
            No {project.isFestival ? "stages" : "shows"} in this project yet.
          </div>
        ) : (
          projectEvents.map((event, i) => {
            const crewUserIds = new Set(allEventAssignments.filter((a: any) => a.eventName === event.name).map((a: any) => a.userId));
            const crewCount = contacts.filter(c => c.userId && crewUserIds.has(c.userId)).length;
            const isExpanded = expandedShows[event.id] || false;
            const selectedDate = showDates[event.id] || getDefaultDate(event);
            const dayVenue = allDayVenues.find(dv => dv.eventId === event.id && dv.date === selectedDate);
            const resolvedVenueId = dayVenue ? dayVenue.venueId : event.venueId;
            const venue = resolvedVenueId ? venues.find(v => v.id === resolvedVenueId) : null;
            const activeTab = showTabs[event.id] || "schedule";
            const dateRange = getDateRange(event);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="border border-border"
                  data-testid={`card-project-show-${event.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-start">
                      <button
                        className="flex-1 text-left p-4 hover-elevate rounded-md min-w-0"
                        onClick={() => toggleExpand(event.id, event)}
                        data-testid={`btn-expand-show-${event.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display font-bold text-base uppercase tracking-wide text-foreground truncate">
                              {event.name}
                            </h3>
                            {(event.startDate || event.endDate) && (
                              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>
                                  {event.startDate && format(parseISO(event.startDate), "MMM d, yyyy")}
                                  {event.startDate && event.endDate && event.startDate !== event.endDate && (
                                    <> — {format(parseISO(event.endDate), "MMM d, yyyy")}</>
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {venue && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span>{venue.name}</span>
                                </span>
                              )}
                              {crewCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3 flex-shrink-0" />
                                  <span>{crewCount} crew</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {event.startDate && (
                              <div className="text-right">
                                <div className="text-2xl font-display font-bold text-yellow-400 leading-none">
                                  {format(parseISO(event.startDate), "d")}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                  {format(parseISO(event.startDate), "MMM")}
                                </div>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>
                      {isAdmin && (
                        <div className="flex items-center flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="m-1 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditShowDialogId(event.id);
                            }}
                            data-testid={`button-edit-show-${event.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <ConfirmDelete
                            onConfirm={() => deleteShowMutation.mutate(event.id)}
                            title={`Delete ${project.isFestival ? "Stage" : "Show"}`}
                            description={`Are you sure you want to delete "${event.name}"? This will remove all schedules, crew assignments, and files for this ${project.isFestival ? "stage" : "show"}.`}
                            triggerClassName="m-1 text-muted-foreground hover:text-destructive"
                            data-testid={`button-delete-show-${event.id}`}
                          />
                        </div>
                      )}
                    </div>

                    {editShowDialogId === event.id && (
                      <EditShowDialog
                        open={true}
                        onClose={() => setEditShowDialogId(null)}
                        show={event}
                      />
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <Separator />
                          <div className="p-4 space-y-3">
                            {dateRange.length > 1 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {dateRange.map(date => {
                                  const isSelected = date === selectedDate;
                                  const isTodayDate = isToday(parseISO(date));
                                  return (
                                    <button
                                      key={date}
                                      onClick={() => setShowDates(sd => ({ ...sd, [event.id]: date }))}
                                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        isSelected
                                          ? "bg-primary text-primary-foreground"
                                          : isTodayDate
                                          ? "bg-muted text-foreground"
                                          : "bg-muted/50 text-muted-foreground hover-elevate"
                                      }`}
                                      data-testid={`date-pill-${event.id}-${date}`}
                                    >
                                      {format(parseISO(date), "EEE d")}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            <Tabs
                              value={activeTab}
                              onValueChange={(val) => setShowTabs(st => ({ ...st, [event.id]: val }))}
                            >
                              <TabsList className="w-full">
                                <TabsTrigger value="schedule" className="flex-1" data-testid={`tab-schedule-${event.id}`}>
                                  Schedule
                                </TabsTrigger>
                                <TabsTrigger value="crew" className="flex-1" data-testid={`tab-crew-${event.id}`}>
                                  Crew
                                </TabsTrigger>
                                <TabsTrigger value="venue" className="flex-1" data-testid={`tab-venue-${event.id}`}>
                                  Venue
                                </TabsTrigger>
                                <TabsTrigger value="files" className="flex-1" data-testid={`tab-files-${event.id}`}>
                                  Files
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="schedule" className="mt-3">
                                <ScheduleTab
                                  eventName={event.name}
                                  selectedDate={selectedDate}
                                  schedules={schedules}
                                  isAdmin={isAdmin}
                                  zones={zones}
                                  sections={sections}
                                />
                              </TabsContent>

                              <TabsContent value="crew" className="mt-3">
                                <CrewTab
                                  eventName={event.name}
                                  contacts={contacts}
                                  allEventAssignments={allEventAssignments}
                                  isAdmin={isAdmin}
                                  selectedDate={selectedDate}
                                  projectAssignments={projectAssignments}
                                  projectId={projectId}
                                />
                              </TabsContent>

                              <TabsContent value="venue" className="mt-3">
                                <VenueTab
                                  venue={venue}
                                  event={event}
                                  venues={venues}
                                  isAdmin={isAdmin}
                                  resolvedVenueId={resolvedVenueId ?? null}
                                  selectedDate={selectedDate}
                                />
                              </TabsContent>

                              <TabsContent value="files" className="mt-3">
                                <FilesTab
                                  eventName={event.name}
                                  files={allFiles}
                                  folders={fileFolders}
                                  isAdmin={isAdmin}
                                />
                              </TabsContent>
                            </Tabs>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
