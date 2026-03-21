import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  format, addMonths, subMonths, parseISO, isToday, isSameMonth,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  differenceInDays,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Users, CalendarDays,
  ExternalLink, Clock, X, Plane, LayoutGrid, List,
  MapPin,
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import type { Event, Project, Venue } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/components/ColorSchemeProvider";
import { useEventSelection } from "@/contexts/EventSelectionContext";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useVenues } from "@/hooks/use-venue";

// ─── Types ───────────────────────────────────────────────────────────────────

type ShowOnDay = {
  event: Event;
  crew: number;
  scheduleItems: number;
  color: { dot: string; bg: string; text: string; border: string; bar: string } | undefined;
};

type TravelDayOnDay = {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  departureAirport?: string | null;
  arrivalAirport?: string | null;
  flightNumber?: string | null;
  airline?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  notes?: string | null;
};

// ─── Day panel (non-admin) ───────────────────────────────────────────────────

function DayPanel({
  date,
  shows,
  travelDays,
  onNavigate,
  onNavigateTour,
  onClose,
}: {
  date: string;
  shows: ShowOnDay[];
  travelDays: TravelDayOnDay[];
  onNavigate: (date: string, showName?: string) => void;
  onNavigateTour: (projectId: number, date: string) => void;
  onClose: () => void;
}) {
  const formatted = format(parseISO(date), "EEEE, MMMM d");
  const hasContent = shows.length > 0 || travelDays.length > 0;

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Selected Day</p>
          <h3 className="font-semibold text-sm truncate">{formatted}</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!hasContent ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Nothing scheduled on this day.
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          {shows.map(({ event, crew, scheduleItems, color }) => (
            <div key={`show-${event.id}`} className="px-4 py-3 flex items-start gap-2.5">
              <div className={cn("w-2.5 h-2.5 rounded-full mt-[3px] flex-shrink-0", color?.dot || "bg-primary")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug truncate">{event.name}</p>
                {event.startDate && event.endDate && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(parseISO(event.startDate), "MMM d")}
                    {" – "}
                    {format(parseISO(event.endDate), "MMM d, yyyy")}
                    {" · "}
                    {differenceInDays(parseISO(event.endDate), parseISO(event.startDate)) + 1}d
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />{crew} crew
                  </span>
                  {scheduleItems > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{scheduleItems} item{scheduleItems !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onNavigate(date, event.name)}
                className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title={`Open ${event.name} in Dashboard`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {travelDays.map((td) => (
            <div key={`travel-${td.id}`} className="px-4 py-3 flex items-start gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full mt-[3px] flex-shrink-0 bg-sky-500" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Plane className="w-3 h-3 text-sky-500 flex-shrink-0" />
                  <p className="text-sm font-medium leading-snug truncate">
                    {td.departureAirport && td.arrivalAirport
                      ? `${td.departureAirport} → ${td.arrivalAirport}`
                      : "Travel Day"}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{td.projectName}</p>
                {(td.airline || td.flightNumber) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {[td.airline, td.flightNumber].filter(Boolean).join(" · ")}
                  </p>
                )}
                {(td.departureTime || td.arrivalTime) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {td.departureTime && `Dep ${td.departureTime}`}
                    {td.departureTime && td.arrivalTime && " · "}
                    {td.arrivalTime && `Arr ${td.arrivalTime}`}
                  </p>
                )}
                {td.notes && (
                  <p className="text-[10px] text-muted-foreground/70 italic mt-0.5 truncate">{td.notes}</p>
                )}
              </div>
              <button
                onClick={() => onNavigateTour(td.projectId, td.date)}
                className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Open tour project"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-border/30">
        <Button
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => onNavigate(date, shows[0]?.event.name)}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Open {format(parseISO(date), "MMM d")} in Dashboard
        </Button>
      </div>
    </div>
  );
}

type CalendarItem = {
  id: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  isFestival: boolean;
  projectId?: number;
  eventNames: string[];
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuth();
  const isAdmin = ["owner", "manager", "admin"].includes(user?.role || "");
  const isMobile = useIsMobile();

  const { data: allEvents = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: allProjects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: allSchedules = [] } = useQuery<any[]>({ queryKey: ["/api/schedules"] });
  const { data: venuesList = [] } = useVenues();

  const eventsList = useMemo(() => {
    if (isAdmin) return allEvents.filter((e: Event) => !e.archived);
    const assigned = user?.eventAssignments as string[] | undefined;
    if (!assigned || assigned.length === 0) return [];
    const assignedSet = new Set(assigned);
    return allEvents.filter((e: Event) => !e.archived && assignedSet.has(e.name));
  }, [allEvents, isAdmin, user]);

  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"] });

  // Fetch travel days for all tour projects
  const tourProjects = useMemo(
    () => (allProjects as any[]).filter(p => p.isTour),
    [allProjects],
  );

  const travelDayResults = useQueries({
    queries: tourProjects.map((p: any) => ({
      queryKey: ["/api/projects", p.id, "travel-days"],
      queryFn: async () => {
        const res = await fetch(`/api/projects/${p.id}/travel-days`, { credentials: "include" });
        if (!res.ok) return [];
        return res.json();
      },
    })),
  });

  const allTravelDays = useMemo<TravelDayOnDay[]>(() => {
    return travelDayResults.flatMap((result, idx) => {
      const project = tourProjects[idx];
      return ((result.data as any[]) || []).map((td: any) => ({
        ...td,
        projectName: project?.name || "Tour",
        projectId: project?.id,
      }));
    });
  }, [travelDayResults, tourProjects]);

  const crewByEvent = useMemo(() => {
    const map = new Map<string, number>();
    allEventAssignments.forEach((a: any) => {
      map.set(a.eventName, (map.get(a.eventName) || 0) + 1);
    });
    return map;
  }, [allEventAssignments]);

  const schedulesByShowDate = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    allSchedules.forEach((s: any) => {
      if (!s.eventName || !s.eventDate) return;
      if (!map.has(s.eventName)) map.set(s.eventName, new Map());
      const dm = map.get(s.eventName)!;
      dm.set(s.eventDate, (dm.get(s.eventDate) || 0) + 1);
    });
    return map;
  }, [allSchedules]);

  const today = format(new Date(), "yyyy-MM-dd");
  const searchString = typeof window !== "undefined" ? window.location.search : "";

  const [calView, setCalView] = useState<"grid" | "agenda">("grid");
  const [selectedDate, setSelectedDate] = useState(() => {
    const params = new URLSearchParams(searchString);
    const dateParam = params.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parsed = parseISO(dateParam);
      if (!isNaN(parsed.getTime())) return dateParam;
    }
    return today;
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => parseISO(selectedDate));
  const [calendarFilter, setCalendarFilter] = useState<string>("all");
  const [, navigate] = useLocation();
  const eventSelection = useEventSelection();

  useEffect(() => {
    const sel = parseISO(selectedDate);
    if (!isSameMonth(sel, currentMonth)) {
      setCurrentMonth(sel);
    }
  }, [selectedDate]);

  const { buildColorMap } = useColorScheme();

  const colorMap = useMemo(() => buildColorMap(eventsList.map(ev => ev.name)), [eventsList, buildColorMap]);

  const calendarItems = useMemo(() => {
    const festivalGroups = new Map<number, Event[]>();
    const standalone: Event[] = [];
    eventsList.forEach(ev => {
      if (ev.projectId) {
        const proj = allProjects.find(p => p.id === ev.projectId);
        if (proj?.isFestival) {
          const group = festivalGroups.get(proj.id) || [];
          group.push(ev);
          festivalGroups.set(proj.id, group);
          return;
        }
      }
      standalone.push(ev);
    });

    const items: CalendarItem[] = [];

    festivalGroups.forEach((stages, projId) => {
      const proj = allProjects.find(p => p.id === projId);
      const starts = stages.map(s => s.startDate).filter(Boolean) as string[];
      const ends = stages.map(s => s.endDate).filter(Boolean) as string[];
      items.push({
        id: `festival-${projId}`,
        label: proj?.name || stages[0].name,
        startDate: starts.length > 0 ? starts.sort()[0] : null,
        endDate: ends.length > 0 ? ends.sort().reverse()[0] : null,
        isFestival: true,
        projectId: projId,
        eventNames: stages.map(s => s.name),
      });
    });

    standalone.forEach(ev => {
      items.push({
        id: `event-${ev.id}`,
        label: ev.name,
        startDate: ev.startDate,
        endDate: ev.endDate,
        isFestival: false,
        eventNames: [ev.name],
      });
    });

    return items;
  }, [eventsList, allProjects]);

  const calendarColorMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildColorMap> extends Map<any, infer V> ? V : never>();
    calendarItems.forEach(ci => {
      const firstEventColor = ci.eventNames.length > 0 ? colorMap.get(ci.eventNames[0]) : undefined;
      if (firstEventColor) map.set(ci.id, firstEventColor);
    });
    return map;
  }, [calendarItems, colorMap, buildColorMap]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthCalendarItems = useMemo(() => {
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    return calendarItems.filter(ci => {
      if (!ci.startDate || !ci.endDate) return false;
      return ci.endDate >= monthStart && ci.startDate <= monthEnd;
    });
  }, [calendarItems, currentMonth]);

  const calendarDotInfo = useMemo(() => {
    const map = new Map<string, string[]>();
    calendarDays.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const itemsOnDay = calendarItems.filter(ci => {
        if (!ci.startDate || !ci.endDate) return false;
        return dateStr >= ci.startDate && dateStr <= ci.endDate;
      });
      if (itemsOnDay.length > 0) map.set(dateStr, itemsOnDay.map(ci => ci.id));
    });
    return map;
  }, [calendarItems, calendarDays]);

  const overlapInfo = useMemo(() => {
    const dateOverlaps = new Map<string, string[]>();
    calendarDays.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const eventsOnDay = eventsList.filter(ev => {
        if (!ev.startDate || !ev.endDate) return false;
        return dateStr >= ev.startDate && dateStr <= ev.endDate;
      });
      if (eventsOnDay.length > 0) dateOverlaps.set(dateStr, eventsOnDay.map(e => e.name));
    });
    return dateOverlaps;
  }, [eventsList, calendarDays]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const selectedDayTravelDays = useMemo<TravelDayOnDay[]>(() => {
    if (!selectedDate) return [];
    return allTravelDays.filter(td => td.date === selectedDate);
  }, [selectedDate, allTravelDays]);

  const selectedDayShows = useMemo<ShowOnDay[]>(() => {
    if (!selectedDate) return [];
    return eventsList
      .filter(ev => {
        if (!ev.startDate || !ev.endDate) return false;
        return selectedDate >= ev.startDate && selectedDate <= ev.endDate;
      })
      .map(ev => ({
        event: ev,
        crew: crewByEvent.get(ev.name) || 0,
        scheduleItems: schedulesByShowDate.get(ev.name)?.get(selectedDate) || 0,
        color: colorMap.get(ev.name),
      }));
  }, [selectedDate, eventsList, crewByEvent, schedulesByShowDate, colorMap]);


  function handleDayClick(dateStr: string) {
    if (dateStr === selectedDate && panelOpen) {
      setPanelOpen(false);
      return;
    }
    setSelectedDate(dateStr);
    const hasShows = (overlapInfo.get(dateStr) || []).length > 0;
    const hasTravelDays = allTravelDays.some(td => td.date === dateStr);
    if (hasShows || hasTravelDays) setPanelOpen(true);
    if (calendarFilter !== "all") {
      const ci = calendarItems.find(c => c.id === calendarFilter);
      if (ci?.eventNames.length) eventSelection.selectAll(ci.eventNames);
    }
  }


  function handleNavigateToDashboard(date: string, showName?: string) {
    if (showName) {
      eventSelection.singleSelect(showName);
      navigate(`/?date=${date}&show=${encodeURIComponent(showName)}`);
    } else {
      navigate(`/?date=${date}`);
    }
  }

  function handleNavigateToTour(projectId: number, _date: string) {
    navigate(`/project/${projectId}`);
  }

  const getFilteredEventNames = (filterId: string): string[] => {
    if (filterId === "all") return [];
    const ci = calendarItems.find(c => c.id === filterId);
    return ci ? ci.eventNames : [];
  };

  const showPanel = panelOpen && selectedDate && (selectedDayShows.length > 0 || selectedDayTravelDays.length > 0);

  const monthTravelDays = useMemo(() => {
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    return allTravelDays.filter(td => td.date >= monthStart && td.date <= monthEnd);
  }, [allTravelDays, currentMonth]);

  const agendaItems = useMemo(() => {
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const filtered = calendarFilter === "all"
      ? monthCalendarItems
      : monthCalendarItems.filter(ci => ci.id === calendarFilter);
    const showItems = filtered.map(ci => ({
      type: "show" as const,
      sortDate: ci.startDate && ci.startDate < monthStart ? monthStart : (ci.startDate || monthStart),
      data: ci,
    }));
    const travelItems = monthTravelDays.map(td => ({
      type: "travel" as const,
      sortDate: td.date,
      data: td,
    }));
    return [...showItems, ...travelItems].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  }, [monthCalendarItems, monthTravelDays, calendarFilter, currentMonth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "t" || e.key === "T") {
        setCurrentMonth(new Date());
        setSelectedDate(today);
        return;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentMonth(m => subMonths(m, 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentMonth(m => addMonths(m, 1));
      } else if (e.key === "Escape" && panelOpen) {
        e.preventDefault();
        setPanelOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      <AppHeader showBack />

      <PullToRefresh>
        <main className="max-w-7xl mx-auto px-4 py-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

            {/* ─── Full Calendar (always visible) ─── */}
            <>
                {/* Month nav */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="text-muted-foreground hover:text-foreground" data-testid="button-cal-prev-month">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">{format(subMonths(currentMonth, 1), "MMM")}</span>
                  </Button>
                  <h3 className="text-lg sm:text-xl font-semibold tracking-tight w-40 text-center" data-testid="text-cal-month">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="text-muted-foreground hover:text-foreground" data-testid="button-cal-next-month">
                    <span className="text-xs hidden sm:inline">{format(addMonths(currentMonth, 1), "MMM")}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-0.5 rounded-lg border border-border/40 p-0.5 ml-1">
                    <button
                      onClick={() => setCalView("grid")}
                      className={cn("p-1.5 rounded-md transition-colors", calView === "grid" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                      title="Grid view"
                      data-testid="button-cal-grid-view"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCalView("agenda")}
                      className={cn("p-1.5 rounded-md transition-colors", calView === "agenda" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                      title="Agenda view"
                      data-testid="button-cal-agenda-view"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Show filter tabs */}
                {monthCalendarItems.length > 1 && (
                  <div className="overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-4" data-testid="cal-filter-tabs">
                    <div className="flex gap-1.5 flex-nowrap">
                      <button
                        onClick={() => setCalendarFilter("all")}
                        className={cn(
                          "flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          calendarFilter === "all"
                            ? "bg-foreground text-background shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/80",
                        )}
                        data-testid="cal-filter-all"
                      >
                        All
                      </button>
                      {monthCalendarItems.map(ci => {
                        const c = calendarColorMap.get(ci.id);
                        const crew = ci.eventNames.reduce((sum, en) => sum + (crewByEvent.get(en) || 0), 0);
                        const isActive = calendarFilter === ci.id;
                        return (
                          <button
                            key={ci.id}
                            onClick={() => setCalendarFilter(ci.id)}
                            className={cn(
                              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                              isActive
                                ? "bg-foreground text-background shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted/80",
                            )}
                            data-testid={`cal-filter-${ci.label}`}
                          >
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", isActive ? "bg-background/60" : (c?.dot || "bg-primary"))} />
                            <span className="truncate max-w-[120px]">{ci.label}</span>
                            {ci.isFestival && <span className="opacity-50">·F</span>}
                            <span className="opacity-40">{crew}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Agenda view */}
                {calView === "agenda" && (
                  <div className="space-y-2 mb-4">
                    {agendaItems.length === 0 && (
                      <div className="text-center py-12 text-sm text-muted-foreground">
                        Nothing scheduled in {format(currentMonth, "MMMM yyyy")}.
                      </div>
                    )}
                    {agendaItems.map((entry, idx) => {
                      if (entry.type === "show") {
                        const ci = entry.data as CalendarItem;
                        const c = calendarColorMap.get(ci.id);
                        const crew = ci.eventNames.reduce((sum, en) => sum + (crewByEvent.get(en) || 0), 0);
                        const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
                        const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
                        const displayStart = ci.startDate && ci.startDate < monthStart ? monthStart : ci.startDate;
                        const displayEnd = ci.endDate && ci.endDate > monthEnd ? monthEnd : ci.endDate;
                        return (
                          <button
                            key={`agenda-show-${ci.id}-${idx}`}
                            onClick={() => {
                              setSelectedDate(displayStart || entry.sortDate);
                              setPanelOpen(true);
                              setCalView("grid");
                              setCurrentMonth(parseISO(displayStart || entry.sortDate));
                            }}
                            className="w-full text-left rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/70 hover:border-border/60 transition-all px-4 py-3 flex items-center gap-3 group"
                            data-testid={`agenda-item-${ci.id}`}
                          >
                            <div className={cn("w-2.5 h-10 rounded-full flex-shrink-0", c?.dot || "bg-primary/60")} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ci.label}</p>
                              {ci.isFestival && <span className="text-[10px] text-muted-foreground/60">Festival</span>}
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {displayStart && format(parseISO(displayStart), "MMM d")}
                                {displayStart && displayEnd && displayStart !== displayEnd && ` – ${format(parseISO(displayEnd), "MMM d")}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                              {crew > 0 && (
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{crew}</span>
                              )}
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                            </div>
                          </button>
                        );
                      } else {
                        const td = entry.data as TravelDayOnDay;
                        return (
                          <button
                            key={`agenda-travel-${td.id}`}
                            onClick={() => handleNavigateToTour(td.projectId, td.date)}
                            className="w-full text-left rounded-xl border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 transition-all px-4 py-3 flex items-center gap-3 group"
                            data-testid={`agenda-travel-${td.id}`}
                          >
                            <div className="w-2.5 h-10 rounded-full flex-shrink-0 bg-sky-500/60" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Plane className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                <p className="font-medium text-sm truncate">
                                  {td.departureAirport && td.arrivalAirport
                                    ? `${td.departureAirport} → ${td.arrivalAirport}`
                                    : "Travel Day"}
                                </p>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{td.projectName} · {format(parseISO(td.date), "MMM d")}</p>
                              {(td.airline || td.flightNumber) && (
                                <p className="text-[11px] text-muted-foreground/70">{[td.airline, td.flightNumber].filter(Boolean).join(" · ")}</p>
                              )}
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                          </button>
                        );
                      }
                    })}
                  </div>
                )}

                {/* Main layout: calendar + side panel */}
                <div className={cn("flex gap-4 items-start", calView === "agenda" && "hidden")}>

                  {/* Calendar grid */}
                  <div className="flex-1 min-w-0">
                    <div className="rounded-xl border border-border/50 bg-card/40 dark:bg-card/20 backdrop-blur-sm overflow-hidden">
                      <div className="grid grid-cols-7 border-b border-border/30">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                          <div key={day} className="text-center text-[10px] sm:text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest py-2.5">
                            {isMobile ? day.charAt(0) : day}
                          </div>
                        ))}
                      </div>

                      {weeks.map((week, wi) => (
                        <div key={wi}>
                          <div className="grid grid-cols-7">
                            {week.map((day) => {
                              const dateStr = format(day, "yyyy-MM-dd");
                              const inMonth = isSameMonth(day, currentMonth);
                              const todayDay = isToday(day);
                              const selected = dateStr === selectedDate && panelOpen;
                              const dotsOnDay = calendarDotInfo.get(dateStr) || [];
                              const dayIsOverlap = dotsOnDay.length > 1;

                              const filteredDotsOnDay = calendarFilter === "all"
                                ? dotsOnDay
                                : dotsOnDay.filter(ciId => ciId === calendarFilter);

                              const eventsOnDay = overlapInfo.get(dateStr) || [];
                              const filteredEvents = calendarFilter === "all"
                                ? eventsOnDay
                                : eventsOnDay.filter(en => {
                                    const ci = calendarItems.find(c => c.id === calendarFilter);
                                    return ci?.eventNames.includes(en);
                                  });

                              const travelDaysOnDay = allTravelDays.filter(td => td.date === dateStr);
                              const hasShows = eventsOnDay.length > 0;
                              const hasTravelDays = travelDaysOnDay.length > 0;

                              return (
                                <button
                                  key={dateStr}
                                  onClick={() => handleDayClick(dateStr)}
                                  className={cn(
                                    "relative flex flex-col items-start p-1 sm:p-1.5 transition-all border-b border-r border-border/20 group",
                                    isMobile ? "min-h-[56px]" : "min-h-[72px]",
                                    !inMonth && "opacity-30",
                                    selected && "bg-primary/10 dark:bg-primary/15",
                                    !selected && (hasShows || hasTravelDays) && "hover:bg-muted/40",
                                    !selected && !hasShows && !hasTravelDays && "hover:bg-muted/20",
                                  )}
                                  data-testid={`cal-day-${dateStr}`}
                                >
                                  <div className="flex items-center justify-between w-full mb-0.5">
                                    <span className={cn(
                                      "text-xs sm:text-sm leading-none",
                                      todayDay && "bg-primary text-primary-foreground rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-bold",
                                      !todayDay && selected && "font-semibold text-primary",
                                      !todayDay && !selected && "text-foreground/80",
                                    )}>
                                      {format(day, "d")}
                                    </span>
                                    {dayIsOverlap && calendarFilter === "all" && inMonth && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-destructive/70" title="Overlapping shows" />
                                    )}
                                  </div>

                                  {!isMobile && (filteredEvents.length > 0 || hasTravelDays) && (
                                    <div className="flex flex-col gap-px w-full mt-auto overflow-hidden">
                                      {filteredEvents.slice(0, 2).map((en, idx) => {
                                        const c = colorMap.get(en);
                                        return (
                                          <div
                                            key={`${en}-${idx}`}
                                            className={cn(
                                              "text-[8px] sm:text-[9px] leading-tight truncate rounded px-0.5 py-px font-medium",
                                              c?.bg || "bg-primary/10",
                                              c?.text || "text-primary",
                                            )}
                                            title={en}
                                          >
                                            {en}
                                          </div>
                                        );
                                      })}
                                      {filteredEvents.length > 2 && (
                                        <span className="text-[8px] text-muted-foreground/60 pl-0.5">+{filteredEvents.length - 2}</span>
                                      )}
                                      {travelDaysOnDay.slice(0, 1).map(td => (
                                        <div
                                          key={`travel-${td.id}`}
                                          className="text-[8px] sm:text-[9px] leading-tight truncate rounded px-0.5 py-px font-medium bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center gap-0.5"
                                          title={`Travel: ${td.departureAirport ?? ""} → ${td.arrivalAirport ?? ""}`}
                                        >
                                          <Plane className="w-2 h-2 flex-shrink-0" />
                                          {td.departureAirport && td.arrivalAirport
                                            ? `${td.departureAirport}→${td.arrivalAirport}`
                                            : "Travel"}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {isMobile && (filteredDotsOnDay.length > 0 || hasTravelDays) && (
                                    <div className="flex gap-0.5 mt-auto">
                                      {filteredDotsOnDay.slice(0, 3).map((ciId, idx) => {
                                        const c = calendarColorMap.get(ciId);
                                        return (
                                          <div
                                            key={`${ciId}-${idx}`}
                                            className={cn("w-1 h-1 rounded-full", c?.dot || "bg-primary")}
                                          />
                                        );
                                      })}
                                      {hasTravelDays && (
                                        <div className="w-1 h-1 rounded-full bg-sky-500" title="Travel day" />
                                      )}
                                      {filteredDotsOnDay.length > 3 && (
                                        <span className="text-[7px] text-muted-foreground">+{filteredDotsOnDay.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 px-1">
                      <button
                        onClick={() => { setCurrentMonth(new Date()); setSelectedDate(today); setPanelOpen(false); }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-cal-today"
                      >
                        Today
                      </button>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                        {monthCalendarItems.length > 0 && (
                          <span>{monthCalendarItems.length} {monthCalendarItems.length === 1 ? "event" : "events"} this month</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop day panel — sticky sidebar (non-admin only) */}
                  <AnimatePresence>
                    {showPanel && !isMobile && (
                      <motion.div
                        key="day-panel-desktop"
                        initial={{ opacity: 0, x: 16, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 280 }}
                        exit={{ opacity: 0, x: 16, width: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-shrink-0 sticky top-20 overflow-hidden"
                        style={{ minWidth: 0 }}
                      >
                        <DayPanel
                          date={selectedDate}
                          shows={selectedDayShows}
                          travelDays={selectedDayTravelDays}
                          onNavigate={handleNavigateToDashboard}
                          onNavigateTour={handleNavigateToTour}
                          onClose={() => setPanelOpen(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile day panel — below calendar (non-admin only) */}
                <AnimatePresence>
                  {showPanel && isMobile && (
                    <motion.div
                      key="day-panel-mobile"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="mt-4"
                    >
                      <DayPanel
                        date={selectedDate}
                        shows={selectedDayShows}
                        travelDays={selectedDayTravelDays}
                        onNavigate={handleNavigateToDashboard}
                        onNavigateTour={handleNavigateToTour}
                        onClose={() => setPanelOpen(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>

          </motion.div>
        </main>
      </PullToRefresh>

    </div>
  );
}
