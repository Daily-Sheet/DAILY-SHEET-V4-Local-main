import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { format, parseISO, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { getProjectTypeColors } from "@/lib/projectColors";
import { AppHeader } from "@/components/AppHeader";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime, getLocalTimeMinutes } from "@/lib/timeUtils";
import {
  Calendar as CalendarIcon, Users, MapPin, Send, Clock, Mic2,
  Search, Navigation, Plus, List, BarChart3, ChevronDown, ChevronUp,
  Plane, PlaneTakeoff, Phone, ExternalLink, Pencil, Loader2, MessageSquare,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "@/components/CommandPalette";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserActivity } from "@/components/dashboard/utils";
import { ScheduleItem } from "@/components/dashboard/schedule/ScheduleItem";
import { EditScheduleDialog } from "@/components/dashboard/schedule/EditScheduleDialog";
import { CreateScheduleDialog, ScheduleTemplateDialog, SaveAsTemplateButton, CopyDayScheduleButton } from "@/components/CreateScheduleDialog";
import { ClearDayButton } from "@/components/dashboard/schedule/ScheduleItem";
import { VenueMiniMap, VenueQuickSelect, TechPacketHistory } from "@/components/dashboard/venue/VenueView";
import { WeatherWidget } from "@/components/dashboard/overview/WeatherWidget";
import { ActivityFeed, OverviewActivitySquare } from "@/components/dashboard/overview/ActivityFeed";
import { TravelDayCrewSummary } from "@/components/dashboard/overview/OnTourWidget";
import { GearRequestDialog, GearRequestHistory } from "@/components/dashboard/overview/GearRequest";
import { DayNavigator } from "@/components/dashboard/header/DayNavigator";
import { ShowSwitcher } from "@/components/dashboard/header/ShowSwitcher";
import { EditShowDialog } from "@/components/dashboard/shows/EditShowDialog";
import { FilesView } from "@/components/dashboard/files/FilesView";
import { AssignedCrewView, NoAssignmentState } from "@/components/dashboard/crew/AssignedCrewView";
import { SendDailyDialog } from "@/components/dashboard/pdf/SendDailyDialog";
import { TimesheetTab } from "@/components/dashboard/timesheet/TimesheetTab";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import GanttScheduleView from "@/components/GanttScheduleView";
import { buildNestedSchedule, flattenNested } from "@/lib/schedule-nesting";
import { useAuth } from "@/hooks/use-auth";
import type { Event, Venue } from "@shared/schema";

type RightPanel = "venue" | "crew" | "activity" | "files" | "timesheet";

export default function DesktopDashboard() {
  const d = useDashboardData();
  const { user } = useAuth();
  const activityMap = useUserActivity();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [editingShow, setEditingShow] = useState<Event | null>(null);
  const [gearRequestOpen, setGearRequestOpen] = useState(false);
  const [travelExpanded, setTravelExpanded] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>("venue");

  const [scheduleViewMode, setScheduleViewMode] = useState<"list" | "timeline">(() => {
    const stored = localStorage.getItem("dashboard_scheduleViewMode");
    if (stored === "list" || stored === "timeline") return stored;
    return "list";
  });

  const setScheduleViewModePersist = useCallback((mode: "list" | "timeline") => {
    setScheduleViewMode(mode);
    localStorage.setItem("dashboard_scheduleViewMode", mode);
  }, []);

  // ─── Venue resolution for right panel ────────────────────────────────
  const venueGroups = useMemo(() => {
    const groups: Record<number, { venue: Venue; shows: Event[]; resolvedVenueId: number }> = {};
    for (const name of d.effectiveSelectedEvents) {
      const ev = d.eventsList.find(e => e.name === name);
      if (!ev) continue;
      if (ev.startDate && d.activeDate < ev.startDate) continue;
      if (ev.endDate && d.activeDate > ev.endDate) continue;
      const dayVenue = d.allDayVenues.find(dv => dv.eventId === ev.id && dv.date === d.activeDate);
      const resolvedVenueId = dayVenue ? dayVenue.venueId : ev.venueId;
      if (!resolvedVenueId) continue;
      const venue = d.venuesList.find(v => v.id === resolvedVenueId);
      if (!venue) continue;
      if (!groups[resolvedVenueId]) {
        groups[resolvedVenueId] = { venue, shows: [], resolvedVenueId };
      }
      groups[resolvedVenueId].shows.push(ev);
    }
    return Object.values(groups);
  }, [d.effectiveSelectedEvents, d.eventsList, d.allDayVenues, d.activeDate, d.venuesList]);

  const searchFilteredNestedFlat = useMemo(() => {
    const tree = buildNestedSchedule(d.filteredSchedule);
    return flattenNested(tree);
  }, [d.filteredSchedule]);

  if (!user?.workspaceId) {
    return (
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (d.hasNoAssignment) {
    return (
      <div className="min-h-screen bg-background font-body flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <NoAssignmentState message="You haven't been assigned to any shows yet. Contact your production manager to get added to a show." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      {/* ─── Header ─────────────────────────────────────────── */}
      <AppHeader
        actions={<>
          {(d.isManager || d.isAdmin) && (
            <Button variant="outline" size="sm" onClick={() => setShowSendDialog(true)} data-testid="button-send-daily">
              <Send className="mr-2 h-4 w-4" /> Send Daily
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="bg-card/50 backdrop-blur-sm border-border/30" onClick={() => setCommandPaletteOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search (⌘K)</TooltipContent>
          </Tooltip>
        </>}
      >
        <ShowSwitcher
          eventsList={d.eventsList}
          availableEvents={d.availableEvents}
          effectiveSelectedEvents={d.effectiveSelectedEvents}
          effectiveSelectedEventsSet={d.effectiveSelectedEventsSet}
          projects={d.allProjects}
          selectedDate={d.activeDate}
          onToggleEvent={d.eventSelection.toggleEvent}
          onSingleSelect={(name) => {
            d.eventSelection.singleSelect(name);
            const ev = d.eventsList.find(e => e.name === name);
            if (ev?.startDate) {
              const start = ev.startDate;
              const end = ev.endDate || ev.startDate;
              const today = d.todayStr;
              d.setActiveDate(today >= start && today <= end ? today : start);
            }
          }}
          onSelectAll={() => d.eventSelection.selectAll(d.availableEvents)}
          onSelectAllCurrent={(names) => d.eventSelection.setSelectedEvents(names)}
          onClearAll={() => d.eventSelection.setSelectedEvents([])}
          userProjectAssignments={user?.projectAssignments}
          userEventAssignments={user?.eventAssignments as string[] | undefined}
        />
      </AppHeader>

      {/* ─── Three-column layout ─────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── LEFT SIDEBAR: Day Navigator ──────────────────── */}
        <aside className="w-72 xl:w-80 border-r border-border/40 bg-card/30 backdrop-blur-sm flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            <DayNavigator
              dates={d.availableDates}
              selectedDate={d.activeDate}
              onSelectDate={d.handleDateSelect}
              events={d.eventsList.filter(e => !e.archived)}
            />

            {/* Show pills for the selected date */}
            {d.allShowsForSelectedDate.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                  Shows on {format(parseISO(d.activeDate + "T12:00:00"), "MMM d")}
                </span>
                <div className="space-y-1">
                  {d.allShowsForSelectedDate.map(show => {
                    const isActive = d.effectiveSelectedEventsSet.has(show.name);
                    const color = d.showColorMap.get(show.name);
                    const project = show.projectId ? d.allProjects.find(p => p.id === show.projectId) : null;
                    const pc = getProjectTypeColors(project);
                    return (
                      <button
                        key={show.name}
                        onClick={() => {
                          if (isActive && d.effectiveSelectedEvents.length === 1) {
                            d.eventSelection.selectAll(d.availableEvents);
                          } else {
                            d.eventSelection.singleSelect(show.name);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm",
                          isActive
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50 border border-transparent"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", color?.dot || "bg-primary")} />
                        <span className="truncate font-medium">{show.name}</span>
                        {show.tag && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 ml-auto shrink-0">{show.tag}</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Travel day card */}
            {d.travelDayForSelectedDate && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <button
                  type="button"
                  className="w-full flex items-center justify-between"
                  onClick={() => setTravelExpanded(prev => !prev)}
                >
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-display uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">Travel Day</span>
                  </div>
                  {travelExpanded ? <ChevronUp className="w-3 h-3 text-amber-500" /> : <ChevronDown className="w-3 h-3 text-amber-500" />}
                </button>
                {travelExpanded && (
                  <div className="space-y-2 text-xs">
                    {d.travelDayForSelectedDate.departureAirport && d.travelDayForSelectedDate.arrivalAirport && (
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3 h-3 text-amber-500" />
                        <span className="font-medium">{d.travelDayForSelectedDate.departureAirport}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{d.travelDayForSelectedDate.arrivalAirport}</span>
                      </div>
                    )}
                    {d.travelDayForSelectedDate.flightNumber && (
                      <div className="flex items-center gap-1.5">
                        <PlaneTakeoff className="w-3 h-3 text-muted-foreground" />
                        <span>{d.travelDayForSelectedDate.airline} {d.travelDayForSelectedDate.flightNumber}</span>
                      </div>
                    )}
                    {d.travelDayForSelectedDate.notes && (
                      <p className="text-muted-foreground italic">{d.travelDayForSelectedDate.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ─── CENTER: Schedule ─────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Schedule header */}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-display uppercase tracking-wide">Schedule</h2>
                <span className="text-sm text-muted-foreground">
                  {isToday(parseISO(d.activeDate)) ? "Today" : format(parseISO(d.activeDate + "T12:00:00"), "EEEE, MMM d")}
                </span>
                {(() => {
                  const crewSet = new Set<number>();
                  d.filteredSchedule.forEach(item => {
                    if (item.eventName) {
                      d.allEventAssignments.filter((a: any) => a.eventName === item.eventName).forEach((a: any) => {
                        const c = d.dailySheetContacts.find(c => c.userId === a.userId);
                        if (c) crewSet.add(c.id);
                      });
                    }
                  });
                  return crewSet.size > 0 ? (
                    <Badge variant="outline" className="text-[10px]"><Users className="w-3 h-3 mr-0.5" />{crewSet.size} Crew</Badge>
                  ) : null;
                })()}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {d.canEdit && d.effectiveSelectedEvents.length > 0 && (
                  <>
                    <ScheduleTemplateDialog
                      defaultEventName={d.effectiveSelectedEvents.length === 1 ? d.effectiveSelectedEvents[0] : undefined}
                      defaultDate={d.activeDate}
                      availableEvents={d.effectiveSelectedEvents}
                    />
                    <CreateScheduleDialog
                      defaultEventName={d.effectiveSelectedEvents.length === 1 ? d.effectiveSelectedEvents[0] : undefined}
                      defaultDate={d.activeDate}
                      trigger={
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" /> Add Item
                        </Button>
                      }
                    />
                    {d.filteredSchedule.length > 0 && (
                      <>
                        <SaveAsTemplateButton
                          schedules={d.filteredSchedule}
                          eventName={d.effectiveSelectedEvents.length === 1 ? d.effectiveSelectedEvents[0] : undefined}
                        />
                        <CopyDayScheduleButton
                          schedules={d.filteredSchedule}
                          defaultEventName={d.effectiveSelectedEvents.length === 1 ? d.effectiveSelectedEvents[0] : undefined}
                        />
                        <ClearDayButton
                          date={d.activeDate}
                          eventName={d.effectiveSelectedEvents.length === 1 ? d.effectiveSelectedEvents[0] : undefined}
                          count={d.filteredSchedule.length}
                        />
                      </>
                    )}
                  </>
                )}
                <div className="flex items-center border border-border/30 rounded-lg bg-card/50 backdrop-blur-sm">
                  <button
                    onClick={() => setScheduleViewModePersist("list")}
                    className={cn(
                      "px-2 py-1 flex items-center gap-1 text-xs transition-colors rounded-md",
                      scheduleViewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setScheduleViewModePersist("timeline")}
                    className={cn(
                      "px-2 py-1 flex items-center gap-1 text-xs transition-colors rounded-md",
                      scheduleViewMode === "timeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Schedule content */}
            {d.effectiveSelectedEvents.length === 0 ? (
              <Card className="border border-border/30 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Mic2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    {d.allShowsForSelectedDate.length === 0 ? "No shows on this day" : "No shows selected"}
                  </p>
                </CardContent>
              </Card>
            ) : scheduleViewMode === "timeline" ? (
              <GanttScheduleView
                schedules={d.filteredSchedule}
                showColorMap={d.showColorMap}
                selectedEvents={d.effectiveSelectedEvents}
                canEdit={d.canEdit}
                canComplete={d.canEdit}
                onDelete={(id) => d.deleteScheduleMutation.mutate(id)}
                renderEditDialog={(item, onClose) => <EditScheduleDialog item={item} onClose={onClose} />}
                onDuplicate={(item) => d.duplicateScheduleMutation.mutate(item)}
              />
            ) : d.multiShowSelected ? (
              /* Multi-show: side-by-side columns */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {d.effectiveSelectedEvents
                  .filter(showName => d.filteredSchedule.some(item => item.eventName === showName))
                  .map(showName => {
                    const showItems = d.filteredSchedule.filter(item => item.eventName === showName);
                    const showNested = flattenNested(buildNestedSchedule(showItems));
                    const labelColor = d.showColorMap.get(showName);
                    return (
                      <div key={showName} className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm flex flex-col">
                        <div className="px-3 py-2 flex items-center gap-2">
                          <span className={cn("w-3 h-3 rounded-full shrink-0", labelColor?.dot || "bg-primary")} />
                          <h3 className="text-sm font-display uppercase tracking-wide">{showName}</h3>
                          <Badge variant="secondary" className="text-[10px]">{showItems.length}</Badge>
                        </div>
                        <div className="p-2 flex-1 space-y-1.5">
                          {showNested.map(({ item, depth }, index) => (
                            <ScheduleItem
                              key={item.id}
                              item={item}
                              canEdit={d.canEdit}
                              canComplete={d.canEdit}
                              onDelete={(id) => d.deleteScheduleMutation.mutate(id)}
                              onDuplicate={(item) => d.duplicateScheduleMutation.mutate(item)}
                              showColor={labelColor || null}
                              multiShow={false}
                              depth={depth}
                              zones={d.allZones}
                              sections={d.allSections}
                              contacts={d.contacts}
                              activityMap={activityMap}
                              allEventAssignments={d.allEventAssignments}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              /* Single show list */
              <DndContext sensors={d.sensors} collisionDetection={closestCenter} onDragEnd={d.handleDragEnd}>
                <SortableContext items={d.filteredSchedule.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {searchFilteredNestedFlat.map(({ item, depth }, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.2 }}
                      >
                        <ScheduleItem
                          item={item}
                          canEdit={d.canEdit}
                          canComplete={d.canEdit}
                          onDelete={(id) => d.deleteScheduleMutation.mutate(id)}
                          onDuplicate={(item) => d.duplicateScheduleMutation.mutate(item)}
                          showColor={item.eventName ? d.showColorMap.get(item.eventName) || null : null}
                          multiShow={false}
                          depth={depth}
                          zones={d.allZones}
                          sections={d.allSections}
                          contacts={d.contacts}
                          activityMap={activityMap}
                          allEventAssignments={d.allEventAssignments}
                        />
                      </motion.div>
                    ))}
                    {d.filteredSchedule.length === 0 && (
                      <div className="p-12 text-center text-muted-foreground rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
                        No schedule items for this day.
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR ────────────────────────────────── */}
        <aside className="w-80 xl:w-96 border-l border-border/40 bg-card/30 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-border/40 shrink-0">
            {([
              { id: "venue" as RightPanel, label: "Venue", icon: MapPin },
              { id: "crew" as RightPanel, label: "Crew", icon: Users },
              { id: "activity" as RightPanel, label: "Activity", icon: BarChart3 },
              { id: "files" as RightPanel, label: "Files", icon: ExternalLink },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightPanel(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
                  rightPanel === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rightPanel === "venue" && (
              <>
                {venueGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MapPin className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No venue for this date</p>
                  </div>
                ) : venueGroups.map(({ venue: v, shows: groupShows, resolvedVenueId }) => (
                  <div key={v.id} className="space-y-3">
                    <div>
                      <h3 className="text-lg font-display uppercase tracking-wide text-primary">{v.name}</h3>
                      {groupShows.length > 1 && (
                        <p className="text-xs text-muted-foreground">{groupShows.map(s => s.name).join(", ")}</p>
                      )}
                    </div>
                    {v.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="underline underline-offset-2">{v.address}</span>
                      </a>
                    )}
                    <WeatherWidget venueId={resolvedVenueId} date={d.activeDate} />
                    <div className="grid grid-cols-2 gap-2">
                      {(v.contactName || v.contactPhone) && (
                        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 col-span-2">
                          <h4 className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Production Contact</h4>
                          {v.contactName && <p className="text-sm font-medium">{v.contactName}</p>}
                          {v.contactPhone && <p className="text-xs text-primary">{v.contactPhone}</p>}
                        </div>
                      )}
                      {(v.wifiSsid || v.wifiPassword) && (
                        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 col-span-2">
                          <h4 className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Wi-Fi</h4>
                          {v.wifiSsid && <p className="text-sm">SSID: <span className="font-medium">{v.wifiSsid}</span></p>}
                          {v.wifiPassword && <p className="text-xs text-muted-foreground">Pass: {v.wifiPassword}</p>}
                        </div>
                      )}
                      {v.parking && (
                        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5">
                          <h4 className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Parking</h4>
                          <p className="text-xs">{v.parking}</p>
                        </div>
                      )}
                      {v.loadIn && (
                        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5">
                          <h4 className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Load In</h4>
                          <p className="text-xs">{v.loadIn}</p>
                        </div>
                      )}
                      {v.capacity && (
                        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5">
                          <h4 className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Capacity</h4>
                          <p className="text-xs">{v.capacity}</p>
                        </div>
                      )}
                    </div>
                    {v.notes && (
                      <div className="rounded-lg border border-border/30 bg-card/40 p-2.5">
                        <h4 className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Notes</h4>
                        <p className="text-xs">{v.notes}</p>
                      </div>
                    )}
                    <VenueMiniMap venue={v} />
                    <TechPacketHistory venueId={v.id} canUpload={d.canEdit} />
                  </div>
                ))}
              </>
            )}

            {rightPanel === "crew" && (
              <AssignedCrewView
                contacts={d.contacts}
                user={user}
                selectedEvents={d.showsForSelectedDate.map(s => s.name)}
                allEventAssignments={d.allEventAssignments}
                selectedDate={d.activeDate}
              />
            )}

            {rightPanel === "activity" && (
              <ActivityFeed filterEvents={d.effectiveSelectedEvents} />
            )}

            {rightPanel === "files" && (
              <div className="space-y-4">
                {(() => {
                  const driveProjects = d.effectiveSelectedEvents
                    .map(name => d.eventsList.find(e => e.name === name))
                    .filter(Boolean)
                    .map(ev => ev!.projectId ? d.allProjects.find(p => p.id === ev!.projectId) : null)
                    .filter((p): p is NonNullable<typeof p> => !!(p as any)?.driveUrl)
                    .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
                  if (driveProjects.length > 0) {
                    return (
                      <div className="space-y-2">
                        {driveProjects.map(p => (
                          <a key={p.id} href={(p as any).driveUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-card/50 text-accent text-sm">
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            <span className="font-medium truncate">{p.name} — Drive</span>
                          </a>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
                <FilesView selectedEvents={d.effectiveSelectedEvents} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ─── Dialogs ──────────────────────────────────────── */}
      <GearRequestDialog
        events={d.showsForSelectedDate.length > 0 ? d.showsForSelectedDate : d.eventsList}
        open={gearRequestOpen}
        onOpenChange={setGearRequestOpen}
      />
      <SendDailyDialog
        open={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        selectedDate={d.activeDate}
        showsForSelectedDate={d.showsForSelectedDate}
        contacts={d.contacts}
        workspaceName={d.currentWorkspace?.name}
        showColorMap={d.showColorMap}
        allEventAssignments={d.allEventAssignments}
      />
      {editingShow && (
        <EditShowDialog
          open={!!editingShow}
          onClose={() => setEditingShow(null)}
          show={editingShow}
          canDelete={d.isAdmin}
        />
      )}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigateTab={(tab) => {
          const tabMap: Record<string, RightPanel> = { venue: "venue", "assigned-crew": "crew", activity: "activity", files: "files" };
          if (tabMap[tab]) setRightPanel(tabMap[tab]);
        }}
        onSelectShow={(name, startDate, endDate) => {
          d.eventSelection.singleSelect(name);
          if (startDate) {
            const end = endDate || startDate;
            d.setActiveDate(d.todayStr >= startDate && d.todayStr <= end ? d.todayStr : startDate);
          }
        }}
      />
    </div>
  );
}
