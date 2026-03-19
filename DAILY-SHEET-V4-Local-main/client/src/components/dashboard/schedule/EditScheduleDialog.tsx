import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon, ChevronDown, X, Check, Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { toTimeInputValue } from "@/lib/timeUtils";
import { useUpdateSchedule } from "@/hooks/use-schedules";
import { useContacts } from "@/hooks/use-contacts";
import { useVenues } from "@/hooks/use-venue";
import { useZones } from "@/hooks/use-zones";
import { useSections } from "@/hooks/use-sections";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCombinedCategories, CategorySelect } from "@/components/CreateScheduleDialog";
import type { Schedule, Event, EventDayVenue, Contact, CrewMember } from "@shared/schema";
import type { Zone, Section } from "@shared/schema";

type CrewOption = {
  name: string;
  userId: string | null;
  departments: string[];
  defaultPosition: string | null;
};

export function timeStringToDate(timeStr: string, dateStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const base = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  base.setHours(hours, minutes, 0, 0);
  return base;
}

export function EditScheduleDialog({ item, onClose }: { item: Schedule; onClose: () => void }) {
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

  const crewList = useMemo<CrewOption[]>(() => {
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

  const toggleCrew = useCallback((opt: CrewOption) => {
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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="input-edit-schedule-date"
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
                      defaultMonth={field.value ? new Date(field.value + "T12:00:00") : (item.eventDate ? new Date(item.eventDate + "T12:00:00") : undefined)}
                    />
                  </PopoverContent>
                </Popover>
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
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
              {crewDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
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
                          data-testid={`crew-edit-option-${opt.name.replace(/\s+/g, '-')}`}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{opt.name}</span>
                            {opt.defaultPosition && <span className="text-muted-foreground ml-1.5 text-xs">· {opt.defaultPosition}</span>}
                            {opt.departments.length > 0 && (
                              <span className="text-muted-foreground ml-1.5 text-xs">[{opt.departments.join(", ")}]</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {/* Selected crew with position/department editing */}
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
                          data-testid={`button-remove-crew-${member.name.replace(/\s+/g, '-')}`}
                        >
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
              <FormControl><Textarea placeholder="Additional details..." className="resize-none" rows={2} {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          </div>
          <Button type="submit" className="w-full flex-shrink-0" disabled={isPending} data-testid="button-save-schedule">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}
