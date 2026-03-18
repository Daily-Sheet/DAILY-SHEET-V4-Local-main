import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScheduleSchema, type InsertSchedule, type Contact, type Event, type TaskType, type ScheduleTemplate as DbScheduleTemplate, type EventDayVenue, type CrewMember } from "@shared/schema";
import { DEFAULT_TASK_TYPES } from "@shared/constants";
import { toTimeInputValue } from "@/lib/timeUtils";
import { useCreateSchedule } from "@/hooks/use-schedules";
import { useContacts } from "@/hooks/use-contacts";
import { useAuth } from "@/hooks/use-auth";
import { useZones } from "@/hooks/use-zones";
import { useSections } from "@/hooks/use-sections";
import { useVenues } from "@/hooks/use-venue";
import type { Zone, Section, Venue } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { Plus, X, ChevronDown, Check, Calendar as CalendarIcon, Tent, Briefcase, FileText, Copy, Save, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ConfirmDelete } from "@/components/ConfirmDelete";


function timeStringToDate(timeStr: string, dateStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const base = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function useTaskTypes() {
  return useQuery<TaskType[]>({ queryKey: ["/api/task-types"] });
}

function useCombinedCategories(): string[] {
  const { data: customTypes = [] } = useTaskTypes();
  const customNames = customTypes.map(t => t.name);
  const defaults: string[] = [...DEFAULT_TASK_TYPES];
  for (const name of customNames) {
    if (!defaults.includes(name)) {
      defaults.push(name);
    }
  }
  return defaults.sort();
}

export function CategorySelect({
  value,
  onValueChange,
  categories,
  testId,
}: {
  value: string;
  onValueChange: (val: string) => void;
  categories: string[];
  testId?: string;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
        setAdding(false);
        setNewTypeName("");
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [popoverOpen]);
  const { toast } = useToast();
  const qc = useQueryClient();
  const canAdd = ["owner", "manager", "admin"].includes(user?.workspaceRole || "");

  const handleAddNew = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      onValueChange(trimmed);
      setAdding(false);
      setNewTypeName("");
      setPopoverOpen(false);
      return;
    }
    setSaving(true);
    try {
      await apiRequest("POST", "/api/task-types", { name: trimmed });
      await qc.invalidateQueries({ queryKey: ["/api/task-types"] });
      onValueChange(trimmed);
      setAdding(false);
      setNewTypeName("");
      setPopoverOpen(false);
      toast({ title: `"${trimmed}" added as a task type` });
    } catch (err: any) {
      toast({ title: "Failed to add task type", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        role="combobox"
        type="button"
        className={cn(
          "w-full justify-between text-left font-normal",
          !value && "text-muted-foreground"
        )}
        onClick={() => {
          setPopoverOpen(!popoverOpen);
          if (popoverOpen) {
            setAdding(false);
            setNewTypeName("");
          }
        }}
        data-testid={testId}
      >
        <span className="truncate">{value || "Select task type"}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {popoverOpen && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md">
          <div className="max-h-48 overflow-y-auto p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onValueChange(cat);
                  setPopoverOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover-elevate",
                  value === cat && "bg-primary/10 font-medium"
                )}
                data-testid={testId ? `${testId}-option-${cat.replace(/\s+/g, "-").toLowerCase()}` : undefined}
              >
                {value === cat && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                {value !== cat && <span className="w-3.5 shrink-0" />}
                {cat}
              </button>
            ))}
          </div>
          {canAdd && (
            <>
              <div className="border-t" />
              {!adding ? (
                <button
                  type="button"
                  onClick={() => {
                    setAdding(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover-elevate"
                  data-testid={testId ? `${testId}-add-new` : "button-add-new-task-type"}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add new task type
                </button>
              ) : (
                <div className="flex items-center gap-1 p-2">
                  <Input
                    ref={inputRef}
                    placeholder="New type name..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNew();
                      }
                      if (e.key === "Escape") {
                        setAdding(false);
                        setNewTypeName("");
                      }
                    }}
                    className="h-8 text-sm"
                    data-testid="input-new-task-type-name"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleAddNew}
                    disabled={!newTypeName.trim() || saving}
                    data-testid="button-save-new-task-type"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CreateScheduleDialog({ defaultEventName, defaultDate, trigger }: { defaultEventName?: string; defaultDate?: string; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [crewDropdownOpen, setCrewDropdownOpen] = useState(false);
  const [noEndTime, setNoEndTime] = useState(false);
  const { mutate, isPending } = useCreateSchedule();
  const { toast } = useToast();
  const { data: contacts = [] } = useContacts();
  const categories = useCombinedCategories();
  const { data: zones = [] } = useZones();
  const { data: allSections = [] } = useSections();
  const { data: venuesList = [] } = useVenues();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"] });

  const { data: allDayVenues = [] } = useQuery<EventDayVenue[]>({ queryKey: ["/api/event-day-venues"] });

  const selectedEvent = defaultEventName ? (eventsList as Event[]).find(e => e.name === defaultEventName) : null;
  const filteredSections = selectedEvent ? (allSections as Section[]).filter(s => s.eventId === selectedEvent.id) : [];

  const today = defaultDate || format(new Date(), "yyyy-MM-dd");

  const { data: crewPositions = [] } = useQuery<any[]>({ queryKey: ["/api/crew-positions"] });

  const crewList = useMemo(() => {
    const assignedUserIds = defaultEventName
      ? new Set(allEventAssignments.filter((a: any) => a.eventName === defaultEventName).map((a: any) => a.userId))
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
        const assignment = defaultEventName && c.userId
          ? allEventAssignments.find((a: any) => a.userId === c.userId && a.eventName === defaultEventName)
          : null;
        return { name, userId: c.userId || null, departments, defaultPosition: assignment?.position || null };
      })
      .filter((opt, i, arr) => opt.name && arr.findIndex(o => o.name === opt.name) === i)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, allEventAssignments, defaultEventName]);

  const form = useForm<InsertSchedule>({
    resolver: zodResolver(insertScheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Show",
      location: "",
      eventDate: today,
      eventName: defaultEventName || "",
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
      crew: [] as CrewMember[],
      zoneId: null,
      sectionId: null,
    },
  });

  const watchedDate = form.watch("eventDate") || today;
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

  function onSubmit(data: InsertSchedule) {
    const eventDate = data.eventDate || today;
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
    const submitData = { ...data, startTime: normalizedStart, endTime: normalizedEnd, crew, crewNames: crew.map((m: CrewMember) => m.name) };
    mutate({ ...submitData, eventName: defaultEventName || "", zoneId: data.zoneId || null, sectionId: data.sectionId || null }, {
      onSuccess: () => {
        setOpen(false);
        setCrewDropdownOpen(false);
        form.reset();
        toast({ title: "Schedule Added", description: "New item has been added to the timeline." });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (!v) setCrewDropdownOpen(false);
      if (v) {
        setNoEndTime(false);
        form.reset({
          title: "",
          description: "",
          category: "Show",
          location: "",
          eventDate: today,
          eventName: defaultEventName || "",
          startTime: new Date(),
          endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
          crew: [] as CrewMember[],
          zoneId: null,
          sectionId: null,
        });
      }
    }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="bg-primary text-white gap-1.5 h-7 text-xs font-display uppercase tracking-wide">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] font-body max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Add Schedule Item</DialogTitle>
          <DialogDescription className="sr-only">Create a new schedule item</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 min-h-0">
            <div className="space-y-4 overflow-y-auto min-h-0 flex-1 pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <FormControl>
                      <CategorySelect
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          const currentTitle = form.getValues("title");
                          if (!currentTitle || categories.includes(currentTitle)) {
                            form.setValue("title", val);
                          }
                        }}
                        categories={categories}
                        testId="select-create-schedule-category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-fills from task type" {...field} data-testid="input-create-schedule-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="input-create-schedule-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(new Date(field.value + "T12:00:00"), "MMM d, yyyy")
                              : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value + "T12:00:00") : undefined}
                          onSelect={(date) => {
                            if (date) field.onChange(format(date, "yyyy-MM-dd"));
                          }}
                          initialFocus
                          defaultMonth={field.value ? new Date(field.value + "T12:00:00") : new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <TimePicker
                      value={toTimeInputValue(field.value)}
                      onChange={(time24) => {
                        const eventDate = form.getValues("eventDate") || today;
                        field.onChange(timeStringToDate(time24, eventDate));
                      }}
                      data-testid="input-create-schedule-start"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>End Time</FormLabel>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={noEndTime}
                          onCheckedChange={(checked) => setNoEndTime(!!checked)}
                          data-testid="checkbox-no-end-time"
                        />
                        <span className="text-xs text-muted-foreground">No end time</span>
                      </label>
                    </div>
                    {!noEndTime && (
                      <TimePicker
                        value={toTimeInputValue(field.value)}
                        onChange={(time24) => {
                          const eventDate = form.getValues("eventDate") || today;
                          field.onChange(timeStringToDate(time24, eventDate));
                        }}
                        data-testid="input-create-schedule-end"
                      />
                    )}
                    {noEndTime && (
                      <p className="text-xs text-muted-foreground italic">This item will have no end time.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Stage" {...field} value={field.value || ""} data-testid="input-create-schedule-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {venueZones.length > 0 && (
                <FormField
                  control={form.control}
                  name="zoneId"
                  render={({ field }) => (
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
                  )}
                />
              )}

              {filteredSections.length > 0 && (
                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section (Optional)</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-create-section">
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
                  )}
                />
              )}

              <FormItem>
                <FormLabel>Assigned Crew (Optional)</FormLabel>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                    onClick={() => setCrewDropdownOpen(!crewDropdownOpen)}
                    data-testid="button-crew-dropdown-create"
                  >
                    <span className="text-muted-foreground truncate flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {(() => {
                        const selected = ((form.watch as any)("crew") as CrewMember[] | null) || [];
                        return selected.length === 0 ? "Select crew members..." : `${selected.length} crew assigned`;
                      })()}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                  </Button>
                  {crewDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                      {crewList.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">No crew contacts found</div>
                      ) : (
                        crewList.map(opt => {
                          const selected = ((form.watch as any)("crew") as CrewMember[] | null) || [];
                          const isSelected = selected.some((m: CrewMember) => m.name === opt.name);
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                              onClick={() => toggleCrew(opt)}
                              data-testid={`crew-option-${opt.name.replace(/\s+/g, '-')}`}
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
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
                            <button
                              type="button"
                              onClick={() => toggleCrew({ name: member.name, userId: member.userId || null, departments: member.departments || [], defaultPosition: member.position || null })}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              data-testid={`button-remove-crew-create-${member.name.replace(/\s+/g, '-')}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={member.position || "__none__"}
                              onValueChange={(val) => updateCrewPosition(member.name, val === "__none__" ? null : val)}
                            >
                              <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                                <SelectValue placeholder="No position" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">No position</SelectItem>
                                {(crewPositions as any[]).map((p: any) => (
                                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                ))}
                                {member.position && !(crewPositions as any[]).some((p: any) => p.name === member.position) && (
                                  <SelectItem value={member.position}>{member.position}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional details..." className="resize-none" rows={2} {...field} value={field.value || ""} data-testid="input-create-schedule-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            </div>
            <Button type="submit" className="w-full flex-shrink-0" disabled={isPending}>
              {isPending ? "Adding..." : "Add to Schedule"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateItem {
  title: string;
  category: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  description?: string;
  offsetDays?: number;
}

interface BuiltInTemplate {
  name: string;
  description: string;
  icon: string;
  items: TemplateItem[];
  builtIn: true;
}

const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    name: "Concert Day",
    description: "Standard concert day with load-in, sound check, and show",
    icon: "music",
    builtIn: true,
    items: [
      { title: "Load In", category: "Load In", startHour: 8, startMinute: 0, endHour: 10, endMinute: 0 },
      { title: "Stage Setup", category: "Load In", startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
      { title: "Lunch", category: "Meal", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 },
      { title: "Sound Check", category: "Sound Check", startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
      { title: "Dinner", category: "Meal", startHour: 17, startMinute: 0, endHour: 18, endMinute: 0 },
      { title: "Doors Open", category: "Doors Open", startHour: 19, startMinute: 0, endHour: 19, endMinute: 30 },
      { title: "Show", category: "Show", startHour: 20, startMinute: 0, endHour: 22, endMinute: 0 },
    ],
  },
  {
    name: "Festival Day",
    description: "Multi-stage festival day with rolling schedule",
    icon: "tent",
    builtIn: true,
    items: [
      { title: "Site Open / Load In", category: "Load In", startHour: 6, startMinute: 0, endHour: 8, endMinute: 0 },
      { title: "Sound Checks - All Stages", category: "Sound Check", startHour: 8, startMinute: 0, endHour: 11, endMinute: 0 },
      { title: "Crew Lunch", category: "Meal", startHour: 11, startMinute: 0, endHour: 12, endMinute: 0 },
      { title: "Gates Open", category: "Doors Open", startHour: 12, startMinute: 0, endHour: 12, endMinute: 30 },
      { title: "Main Stage - Act 1", category: "Show", startHour: 13, startMinute: 0, endHour: 14, endMinute: 0 },
      { title: "Main Stage - Act 2", category: "Show", startHour: 15, startMinute: 0, endHour: 16, endMinute: 30 },
      { title: "Crew Dinner", category: "Meal", startHour: 17, startMinute: 0, endHour: 18, endMinute: 0 },
      { title: "Headliner", category: "Show", startHour: 20, startMinute: 0, endHour: 22, endMinute: 0 },
    ],
  },
  {
    name: "Corporate Show",
    description: "Corporate meeting or conference day",
    icon: "briefcase",
    builtIn: true,
    items: [
      { title: "Venue Setup", category: "Load In", startHour: 7, startMinute: 0, endHour: 8, endMinute: 30 },
      { title: "AV Check", category: "Sound Check", startHour: 8, startMinute: 30, endHour: 9, endMinute: 0 },
      { title: "Registration & Coffee", category: "Coffee Break", startHour: 9, startMinute: 0, endHour: 9, endMinute: 30 },
      { title: "Morning Session", category: "Show", startHour: 9, startMinute: 30, endHour: 12, endMinute: 0 },
      { title: "Lunch", category: "Meal", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 },
      { title: "Afternoon Session", category: "Show", startHour: 13, startMinute: 0, endHour: 16, endMinute: 0 },
      { title: "Networking Reception", category: "VIP Reception", startHour: 16, startMinute: 30, endHour: 18, endMinute: 0 },
    ],
  },
];

const templateIcons: Record<string, typeof FileText> = {
  music: CalendarIcon,
  tent: Tent,
  briefcase: Briefcase,
};

export function ScheduleTemplateDialog({ defaultEventName, defaultDate, availableEvents = [] }: { defaultEventName?: string; defaultDate?: string; availableEvents?: string[] }) {
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedShowName, setSelectedShowName] = useState(defaultEventName || "");
  const [activeTab, setActiveTab] = useState<"day" | "show">("day");
  const [showStartDate, setShowStartDate] = useState("");
  const { mutateAsync } = useCreateSchedule();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedTemplates = [] } = useQuery<DbScheduleTemplate[]>({
    queryKey: ["/api/schedule-templates"],
  });

  const dayTemplates = savedTemplates.filter(t => t.type === "day" || !t.type);
  const showTemplates = savedTemplates.filter(t => t.type === "show");

  const today = format(new Date(), "yyyy-MM-dd");
  const dateToUse = defaultDate || today;

  function addDaysToDate(baseDate: string, days: number): string {
    const d = new Date(baseDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    return format(d, "yyyy-MM-dd");
  }

  async function applyBuiltInTemplate(template: BuiltInTemplate) {
    setApplying(true);
    try {
      const eventName = selectedShowName || defaultEventName || "";
      for (const item of template.items) {
        const startTime = new Date(dateToUse + "T00:00:00");
        startTime.setHours(item.startHour, item.startMinute, 0, 0);
        const endTime = new Date(dateToUse + "T00:00:00");
        endTime.setHours(item.endHour, item.endMinute, 0, 0);

        await mutateAsync({
          title: item.title,
          category: item.category,
          startTime,
          endTime,
          eventDate: dateToUse,
          eventName,
          description: item.description || "",
          location: "",
          crew: [] as CrewMember[],
        });
      }
      setOpen(false);
      toast({
        title: "Template Applied",
        description: `"${template.name}" template added ${template.items.length} schedule items.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  }

  async function applySavedTemplate(template: DbScheduleTemplate) {
    setApplying(true);
    try {
      const eventName = selectedShowName || defaultEventName || "";
      const items: TemplateItem[] = JSON.parse(template.items);
      const isShowTemplate = template.type === "show";
      const baseDate = isShowTemplate ? showStartDate : dateToUse;

      if (isShowTemplate && !baseDate) {
        toast({ title: "Select a start date", description: "Pick a start date for the show template.", variant: "destructive" });
        setApplying(false);
        return;
      }

      for (const item of items) {
        const itemDate = isShowTemplate && item.offsetDays != null
          ? addDaysToDate(baseDate, item.offsetDays)
          : baseDate;
        const startTime = new Date(itemDate + "T00:00:00");
        startTime.setHours(item.startHour, item.startMinute, 0, 0);
        const endTime = new Date(itemDate + "T00:00:00");
        endTime.setHours(item.endHour, item.endMinute, 0, 0);

        await mutateAsync({
          title: item.title,
          category: item.category,
          startTime,
          endTime,
          eventDate: itemDate,
          eventName,
          description: item.description || "",
          location: "",
          crew: [] as CrewMember[],
        });
      }
      setOpen(false);
      const maxOffset = Math.max(0, ...items.map(i => i.offsetDays || 0));
      toast({
        title: "Template Applied",
        description: isShowTemplate
          ? `"${template.name}" added ${items.length} items across ${maxOffset + 1} day(s).`
          : `"${template.name}" template added ${items.length} schedule items.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  }

  const deleteSavedTemplate = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedule-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates"] });
      toast({ title: "Template Deleted" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setSelectedShowName(defaultEventName || (availableEvents.length > 0 ? availableEvents[0] : "")); setShowStartDate(""); setActiveTab("day"); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs font-display uppercase tracking-wide" data-testid="button-schedule-template">
          <FileText className="w-3.5 h-3.5" /> Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] font-body max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Schedule Templates</DialogTitle>
          <DialogDescription className="sr-only">Choose a schedule template to apply</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("day")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "day" ? "bg-background shadow-sm" : "text-muted-foreground hover-elevate"
            )}
            data-testid="tab-template-day"
          >
            Day Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("show")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "show" ? "bg-background shadow-sm" : "text-muted-foreground hover-elevate"
            )}
            data-testid="tab-template-show"
          >
            Show Templates
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {activeTab === "day"
            ? "Choose a template to quickly add schedule items for a single day."
            : "Apply a multi-day show template. Items will be spread across days from your chosen start date."}
        </p>

        {availableEvents.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assign to Show</label>
            <Select value={selectedShowName} onValueChange={setSelectedShowName}>
              <SelectTrigger data-testid="select-template-show">
                <SelectValue placeholder="Select a show" />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((name) => (
                  <SelectItem key={name} value={name} data-testid={`select-template-show-${name}`}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {activeTab === "show" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</label>
            <DatePicker
              value={showStartDate}
              onChange={setShowStartDate}
              data-testid="input-show-template-start-date"
            />
          </div>
        )}

        {activeTab === "day" && (
          <>
            {dayTemplates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Your Day Templates</h3>
                {dayTemplates.map((template) => {
                  const items: TemplateItem[] = JSON.parse(template.items);
                  return (
                    <Card key={template.id} className="hover-elevate cursor-pointer" data-testid={`saved-template-${template.id}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0" onClick={() => !applying && applySavedTemplate(template)}>
                          <h3 className="font-display text-sm uppercase tracking-wide font-semibold">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">{items.length} items{template.description ? ` - ${template.description}` : ""}</p>
                        </div>
                        <ConfirmDelete
                          title="Delete Template"
                          description={`Delete "${template.name}"?`}
                          onConfirm={() => deleteSavedTemplate.mutate(template.id)}
                          data-testid={`delete-template-${template.id}`}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Built-in Templates</h3>
              {BUILT_IN_TEMPLATES.map((template) => {
                const IconComponent = templateIcons[template.icon] || FileText;
                return (
                  <Card key={template.name} className="hover-elevate cursor-pointer" onClick={() => !applying && applyBuiltInTemplate(template)} data-testid={`template-${template.name.toLowerCase().replace(/\s/g, '-')}`}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm uppercase tracking-wide font-semibold">{template.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{template.items.length} items</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "show" && (
          <div className="space-y-2">
            {showTemplates.length > 0 ? (
              <>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Show Templates</h3>
                {showTemplates.map((template) => {
                  const items: TemplateItem[] = JSON.parse(template.items);
                  const maxOffset = Math.max(0, ...items.map(i => i.offsetDays || 0));
                  const dayCount = maxOffset + 1;
                  return (
                    <Card key={template.id} className="hover-elevate cursor-pointer" data-testid={`saved-show-template-${template.id}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0" onClick={() => !applying && applySavedTemplate(template)}>
                          <h3 className="font-display text-sm uppercase tracking-wide font-semibold">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {items.length} items across {dayCount} day{dayCount !== 1 ? "s" : ""}
                            {template.description ? ` - ${template.description}` : ""}
                          </p>
                        </div>
                        <ConfirmDelete
                          title="Delete Template"
                          description={`Delete "${template.name}"?`}
                          onConfirm={() => deleteSavedTemplate.mutate(template.id)}
                          data-testid={`delete-show-template-${template.id}`}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No show templates yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save a show as a template from the Admin Shows section to create multi-day templates.
                </p>
              </div>
            )}
          </div>
        )}

        {applying && (
          <div className="flex items-center justify-center py-2">
            <p className="text-sm text-muted-foreground">Applying template...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SaveAsTemplateButton({ schedules, eventName }: { schedules: any[]; eventName?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; items: string; type: string }) => {
      await apiRequest("POST", "/api/schedule-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates"] });
      setOpen(false);
      setName("");
      toast({ title: "Template Saved", description: "Your schedule has been saved as a template." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function handleSave() {
    if (!name.trim()) return;
    const items: TemplateItem[] = schedules.map(s => {
      const start = new Date(s.startTime);
      const end = s.endTime ? new Date(s.endTime) : start;
      return {
        title: s.title,
        category: s.category,
        startHour: start.getHours(),
        startMinute: start.getMinutes(),
        endHour: end.getHours(),
        endMinute: end.getMinutes(),
        description: s.description || "",
      };
    });
    saveMutation.mutate({ name: name.trim(), items: JSON.stringify(items), type: "day" });
  }

  if (schedules.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-display uppercase tracking-wide text-xs" data-testid="button-save-template">
          <Save className="w-3.5 h-3.5" /> Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wide text-primary">Save as Template</DialogTitle>
          <DialogDescription className="sr-only">Save current schedule items as a reusable template</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Save {schedules.length} schedule item{schedules.length !== 1 ? "s" : ""} as a reusable day template.
        </p>
        <Input
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="input-template-name"
        />
        <Button onClick={handleSave} disabled={!name.trim() || saveMutation.isPending} className="w-full" data-testid="button-confirm-save-template">
          {saveMutation.isPending ? "Saving..." : "Save Template"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function SaveShowAsTemplateButton({ eventName, allSchedules }: { eventName: string; allSchedules: any[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const showSchedules = allSchedules.filter(s => s.eventName === eventName);

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; items: string; type: string }) => {
      await apiRequest("POST", "/api/schedule-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates"] });
      setOpen(false);
      setName("");
      toast({ title: "Show Template Saved", description: "The show schedule has been saved as a multi-day template." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function handleSave() {
    if (!name.trim()) return;
    if (showSchedules.length === 0) return;

    const dates = Array.from(new Set(showSchedules.map(s => s.eventDate).filter(Boolean))).sort();
    const baseDate = dates[0];

    const items: TemplateItem[] = showSchedules.map(s => {
      const start = new Date(s.startTime);
      const end = s.endTime ? new Date(s.endTime) : start;
      const itemDate = s.eventDate || baseDate;
      const offsetDays = baseDate && itemDate
        ? Math.round((new Date(itemDate + "T12:00:00").getTime() - new Date(baseDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        title: s.title,
        category: s.category,
        startHour: start.getHours(),
        startMinute: start.getMinutes(),
        endHour: end.getHours(),
        endMinute: end.getMinutes(),
        description: s.description || "",
        offsetDays,
      };
    });
    saveMutation.mutate({ name: name.trim(), items: JSON.stringify(items), type: "show" });
  }

  if (showSchedules.length === 0) return null;

  const dates = Array.from(new Set(showSchedules.map(s => s.eventDate).filter(Boolean))).sort();
  const dayCount = dates.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setName(eventName + " Template"); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" data-testid={`button-save-show-template-${eventName}`}>
          <Save className="w-3.5 h-3.5" /> Save Show as Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wide text-primary">Save Show as Template</DialogTitle>
          <DialogDescription className="sr-only">Save all schedule items for this show as a multi-day template</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Save {showSchedules.length} schedule item{showSchedules.length !== 1 ? "s" : ""} across {dayCount} day{dayCount !== 1 ? "s" : ""} as a reusable show template.
        </p>
        <p className="text-xs text-muted-foreground">
          When applied, items will be offset from the chosen start date to preserve the multi-day structure.
        </p>
        <Input
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="input-show-template-name"
        />
        <Button onClick={handleSave} disabled={!name.trim() || saveMutation.isPending} className="w-full" data-testid="button-confirm-save-show-template">
          {saveMutation.isPending ? "Saving..." : "Save Show Template"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function CopyDayScheduleButton({ schedules, defaultEventName, onCopy }: { schedules: any[]; defaultEventName?: string; onCopy?: () => void }) {
  const [open, setOpen] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const { mutateAsync } = useCreateSchedule();
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  if (schedules.length === 0) return null;

  async function handleCopy() {
    if (!targetDate) return;
    setCopying(true);
    try {
      for (const s of schedules) {
        const origStart = new Date(s.startTime);
        const origEnd = s.endTime ? new Date(s.endTime) : origStart;

        const newStart = new Date(targetDate + "T00:00:00");
        newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
        const newEnd = new Date(targetDate + "T00:00:00");
        newEnd.setHours(origEnd.getHours(), origEnd.getMinutes(), 0, 0);

        await mutateAsync({
          title: s.title,
          category: s.category,
          startTime: newStart,
          endTime: newEnd,
          eventDate: targetDate,
          eventName: defaultEventName || s.eventName || "",
          description: s.description || "",
          location: s.location || "",
          crew: (s as any).crew || (s.crewNames || []).map((n: string) => ({ name: n })),
          crewNames: s.crewNames || [],
        });
      }
      setOpen(false);
      setTargetDate("");
      toast({
        title: "Schedule Copied",
        description: `${schedules.length} items copied to ${format(new Date(targetDate + "T12:00:00"), "MMM d, yyyy")}.`,
      });
      onCopy?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCopying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-display uppercase tracking-wide text-xs" data-testid="button-copy-day">
          <Copy className="w-3.5 h-3.5" /> Copy Day
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wide text-primary">Copy Schedule to Another Day</DialogTitle>
          <DialogDescription className="sr-only">Copy schedule items to a different date</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Copy {schedules.length} item{schedules.length !== 1 ? "s" : ""} to a different date. You can edit them individually after.
        </p>
        <Calendar
          mode="single"
          selected={targetDate ? new Date(targetDate + "T12:00:00") : undefined}
          onSelect={(date) => {
            if (date) setTargetDate(format(date, "yyyy-MM-dd"));
          }}
          initialFocus
          defaultMonth={
            targetDate
              ? new Date(targetDate + "T12:00:00")
              : schedules[0]?.eventDate
                ? new Date(schedules[0].eventDate + "T12:00:00")
                : undefined
          }
        />
        <Button onClick={handleCopy} disabled={!targetDate || copying} className="w-full" data-testid="button-confirm-copy-day">
          {copying ? "Copying..." : `Copy to ${targetDate ? format(new Date(targetDate + "T12:00:00"), "MMM d") : "..."}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export { useCombinedCategories };
