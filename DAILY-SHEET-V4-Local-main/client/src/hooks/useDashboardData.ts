import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { format, addDays, parseISO } from "date-fns";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSchedules, useDeleteSchedule } from "@/hooks/use-schedules";
import { useContacts, useDeleteContact } from "@/hooks/use-contacts";
import { useVenues } from "@/hooks/use-venue";
import { useZones } from "@/hooks/use-zones";
import { useSections } from "@/hooks/use-sections";
import { useProjects } from "@/hooks/use-projects";
import { useAuth, resetBootstrap } from "@/hooks/use-auth";
import { useEventSelection } from "@/contexts/EventSelectionContext";
import { useColorScheme } from "@/components/ColorSchemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter";
import { getLocalTimeMinutes } from "@/lib/timeUtils";
import { buildNestedSchedule, flattenNested } from "@/lib/schedule-nesting";
import { getProjectTypeColors } from "@/lib/projectColors";
import { useSensor, useSensors, PointerSensor, KeyboardSensor, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Event, Schedule, Venue, EventDayVenue, Contact, Project, TravelDay } from "@shared/schema";

type Workspace = { id: number; name: string; role: string };

export function useDashboardData() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const eventSelection = useEventSelection();
  const selectedEvents = eventSelection.selectedEvents;
  const selectedEventIds = eventSelection.selectedEventIds;
  const { buildColorMap } = useColorScheme();
  const searchString = useSearch();

  // ─── Active date state ───────────────────────────────────────────────
  const [activeDate, setActiveDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parsed = parseISO(dateParam);
      if (!isNaN(parsed.getTime())) return dateParam;
    }
    const stored = localStorage.getItem("activeDate");
    if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) return stored;
    return format(new Date(), "yyyy-MM-dd");
  });

  useEffect(() => {
    if (activeDate) localStorage.setItem("activeDate", activeDate);
  }, [activeDate]);

  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

  // ─── Workspace scope ─────────────────────────────────────────────────
  useEffect(() => {
    if (user?.workspaceId) {
      eventSelection.setWorkspaceScope(user.workspaceId);
    }
  }, [user?.workspaceId]);

  // ─── Queries ─────────────────────────────────────────────────────────
  const { data: schedules = [] } = useSchedules();
  const { data: contacts = [] } = useContacts();
  const { data: venuesList = [] } = useVenues();
  const { data: allZones = [] } = useZones();
  const { data: allSections = [] } = useSections();
  const { data: allProjects = [] } = useProjects();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"], refetchInterval: 15_000, refetchOnWindowFocus: true });
  const { data: allDayVenues = [] } = useQuery<EventDayVenue[]>({ queryKey: ["/api/event-day-venues"] });
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"], refetchInterval: 30_000, refetchOnWindowFocus: true });
  const { data: userWorkspaces = [] } = useQuery<Workspace[]>({ queryKey: ["/api/workspaces"] });
  const { data: workspaceInviteNotifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    select: (data: any[]) => data.filter((n: any) => n.type === "workspace_invite" && !n.read),
  });

  const currentWorkspace = userWorkspaces.find((w: Workspace) => w.id === user?.workspaceId);
  const pendingInviteNotif = workspaceInviteNotifications[0] ?? null;

  // ─── Keep event name⇄ID resolver in sync with events list ───────────
  useEffect(() => {
    if (eventsList.length > 0) {
      eventSelection.setEventResolver(eventsList);
    }
  }, [eventsList]);

  // ─── Role checks ────────────────────────────────────────────────────
  const isManager = user?.role === "owner" || user?.role === "manager";
  const isAdmin = ["owner", "manager", "admin"].includes(user?.role || "");
  const canEdit = isAdmin;
  const canComplete = isAdmin;
  const hasNoAssignment = !isManager && (!user?.eventAssignments || user.eventAssignments.length === 0) && (!user?.projectAssignments || user.projectAssignments.length === 0);

  // ─── Projects & travel days ──────────────────────────────────────────
  const activeProjects = useMemo(() => allProjects.filter((p: Project) => !p.archived), [allProjects]);
  const activeProjectIds = useMemo(() => activeProjects.map((p: Project) => p.id), [activeProjects]);

  const travelDayQueries = useQueries({
    queries: activeProjectIds.map(id => ({
      queryKey: ["/api/projects", id, "travel-days"],
      enabled: true,
    })),
  });
  const dashboardTravelDays = useMemo(() => {
    return travelDayQueries.flatMap(q => (q.data as TravelDay[]) || []);
  }, [travelDayQueries]);
  const travelDayForSelectedDate = useMemo(() => {
    return dashboardTravelDays.find(td => td.date === activeDate) || null;
  }, [dashboardTravelDays, activeDate]);

  // ─── Venue resolution ────────────────────────────────────────────────
  const eventLinkedVenueId = useMemo(() => {
    // Use selectedEventIds if available, fallback to name-based
    if (selectedEventIds.length > 0) {
      for (const id of selectedEventIds) {
        const ev = eventsList.find((e: Event) => e.id === id);
        if (ev) {
          const dayVenue = allDayVenues.find(dv => dv.eventId === ev.id && dv.date === activeDate);
          if (dayVenue) return dayVenue.venueId;
          if (ev.venueId) return ev.venueId;
        }
      }
      return null;
    }
    const eventNames = eventsList.map((e: Event) => e.name);
    const effectiveEvents = selectedEvents.length > 0
      ? selectedEvents.filter(n => eventNames.includes(n))
      : eventNames;
    for (const name of effectiveEvents) {
      const ev = eventsList.find((e: Event) => e.name === name);
      if (ev) {
        const dayVenue = allDayVenues.find(dv => dv.eventId === ev.id && dv.date === activeDate);
        if (dayVenue) return dayVenue.venueId;
        if (ev.venueId) return ev.venueId;
      }
    }
    return null;
  }, [selectedEventIds, selectedEvents, eventsList, allDayVenues, activeDate]);

  const venue = useMemo(() => {
    if (eventLinkedVenueId) return venuesList.find(v => v.id === eventLinkedVenueId) || null;
    if (selectedVenueId) return venuesList.find(v => v.id === selectedVenueId) || null;
    return venuesList[0] || null;
  }, [eventLinkedVenueId, selectedVenueId, venuesList]);

  // ─── Delete hooks ────────────────────────────────────────────────────
  const { mutate: deleteSchedule } = useDeleteSchedule();
  const { mutate: deleteContact } = useDeleteContact();

  // ─── Sorted schedule ─────────────────────────────────────────────────
  const sortedSchedule = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const aMin = getLocalTimeMinutes(a.startTime) + ((a as any).isNextDay ? 24 * 60 : 0);
      const bMin = getLocalTimeMinutes(b.startTime) + ((b as any).isNextDay ? 24 * 60 : 0);
      const diff = aMin - bMin;
      if (diff !== 0) return diff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [schedules]);

  // ─── Available dates ─────────────────────────────────────────────────
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const hasSelection = selectedEventIds.length > 0 || selectedEvents.length > 0;
    const selectedIdSet = new Set(selectedEventIds);
    const selectedNameSet = new Set(selectedEvents);
    const activeEventsList = (eventsList as Event[]).filter((e: Event) => !e.archived);
    const filteredEvents = hasSelection
      ? activeEventsList.filter((e: Event) => selectedIdSet.has(e.id) || selectedNameSet.has(e.name))
      : activeEventsList;
    if (!hasSelection) dateSet.add(todayStr);

    const filteredSchedules = hasSelection
      ? schedules.filter((s) => {
          if (s.eventId) return selectedIdSet.has(s.eventId);
          return s.eventName && selectedNameSet.has(s.eventName);
        })
      : schedules;
    filteredSchedules.forEach((item) => {
      const d = item.eventDate || format(new Date(item.startTime), "yyyy-MM-dd");
      if (dateRegex.test(d)) dateSet.add(d);
    });
    filteredEvents.forEach((event) => {
      if (event.startDate && event.endDate && dateRegex.test(event.startDate) && dateRegex.test(event.endDate)) {
        const start = new Date(event.startDate + "T12:00:00");
        const end = new Date(event.endDate + "T12:00:00");
        const current = new Date(start);
        let count = 0;
        while (current <= end && count < 90) {
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
  }, [schedules, eventsList, selectedEventIds, selectedEvents]);

  useEffect(() => {
    if (availableDates.length > 0 && !activeDate) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const fallback = availableDates.includes(todayStr) ? todayStr : availableDates[0];
      setActiveDate(fallback);
    }
  }, [availableDates, activeDate]);

  // ─── Available events ────────────────────────────────────────────────
  const availableEvents = useMemo(() => {
    const activeEvents = (eventsList as Event[]).filter((e: Event) => !e.archived);
    if (!isManager) {
      const assignedIds = user?.eventAssignmentIds as number[] | undefined;
      const assigned = user?.eventAssignments as string[] | undefined;
      const assignedIdSet = new Set(assignedIds || []);
      const assignedNameSet = new Set(assigned || []);
      const projAssignments = user?.projectAssignments || [];
      if (projAssignments.length > 0) {
        const projIds = new Set(projAssignments.map((pa: any) => pa.projectId));
        for (const ev of activeEvents) {
          if (ev.projectId && projIds.has(ev.projectId)) {
            assignedIdSet.add(ev.id);
            assignedNameSet.add(ev.name);
          }
        }
      }
      if (assignedIdSet.size === 0 && assignedNameSet.size === 0) return [];
      return activeEvents
        .filter((e: Event) => assignedIdSet.has(e.id) || assignedNameSet.has(e.name))
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
        .map((e: Event) => e.name);
    }
    return activeEvents
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
      .map((e: Event) => e.name);
  }, [eventsList, isManager, user]);

  const availableEventIds = useMemo(() => {
    const activeEvents = (eventsList as Event[]).filter((e: Event) => !e.archived);
    if (!isManager) {
      const assignedIds = user?.eventAssignmentIds as number[] | undefined;
      const assignedIdSet = new Set(assignedIds || []);
      const projAssignments = user?.projectAssignments || [];
      if (projAssignments.length > 0) {
        const projIds = new Set(projAssignments.map((pa: any) => pa.projectId));
        for (const ev of activeEvents) {
          if (ev.projectId && projIds.has(ev.projectId)) assignedIdSet.add(ev.id);
        }
      }
      if (assignedIdSet.size === 0) return [];
      return activeEvents
        .filter((e: Event) => assignedIdSet.has(e.id))
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
        .map((e: Event) => e.id);
    }
    return activeEvents
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
      .map((e: Event) => e.id);
  }, [eventsList, isManager, user]);

  const expandedAssignedEvents = useMemo(() => {
    if (isManager) return null;
    const assignedIds = user?.eventAssignmentIds as number[] | undefined;
    const assigned = user?.eventAssignments as string[] | undefined;
    const assignedIdSet = new Set(assignedIds || []);
    const projAssignments = user?.projectAssignments || [];
    if (projAssignments.length > 0) {
      const projIds = new Set(projAssignments.map((pa: any) => pa.projectId));
      for (const ev of eventsList) {
        if (ev.projectId && projIds.has(ev.projectId)) assignedIdSet.add(ev.id);
      }
    }
    return assignedIdSet;
  }, [eventsList, isManager, user]);

  // ─── Closest future event ───────────────────────────────────────────
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const closestFutureEvent = useMemo(() => {
    const now = new Date();
    const availableSet = new Set(availableEvents);
    const todayEvents = eventsList.filter((e: Event) => {
      if (!availableSet.has(e.name) || !e.startDate) return false;
      const end = e.endDate || e.startDate;
      return e.startDate <= todayStr && end >= todayStr;
    });
    if (todayEvents.length > 0) {
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
            if (nowMs >= start && nowMs <= end) return 0;
            if (nowMs < start) return start - nowMs;
            return nowMs - end;
          })
        );
        return { event: e, score: minDist };
      });
      scored.sort((a, b) => a.score - b.score);
      return scored[0].event;
    }
    const futureEvents = eventsList
      .filter((e: Event) => availableSet.has(e.name) && e.startDate && e.startDate > todayStr)
      .sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999"));
    return futureEvents.length > 0 ? futureEvents[0] : null;
  }, [eventsList, availableEvents, todayStr, schedules]);

  const defaultSelectedEvents = useMemo(() => {
    if (isManager) return closestFutureEvent ? [closestFutureEvent.name] : [];
    return [...availableEvents];
  }, [isManager, closestFutureEvent, availableEvents]);

  // ─── Default selection effects ──────────────────────────────────────
  const defaultsApplied = useRef(false);
  useEffect(() => {
    if (defaultsApplied.current) return;
    if (availableEvents.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("show") || urlParams.get("event")) {
      defaultsApplied.current = true;
      return;
    }
    let eventsToCheck = selectedEvents;
    if (eventsToCheck.length === 0 && user?.workspaceId) {
      try {
        const stored = localStorage.getItem(`dailysheet_selected_events_ws${user.workspaceId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) eventsToCheck = parsed;
        }
      } catch {}
    }
    const hasValidSelection = eventsToCheck.length > 0 && eventsToCheck.some(n => availableEvents.includes(n));
    if (!hasValidSelection) {
      if (isManager && closestFutureEvent) {
        eventSelection.setSelectedEvents([closestFutureEvent.name]);
        if (closestFutureEvent.startDate && closestFutureEvent.startDate !== todayStr) {
          setActiveDate(closestFutureEvent.startDate);
        }
      } else {
        eventSelection.setSelectedEvents([...defaultSelectedEvents]);
      }
    }
    defaultsApplied.current = true;
  }, [availableEvents, closestFutureEvent]);

  // ─── URL parameter handling ──────────────────────────────────────────
  useEffect(() => {
    if (!searchString) return;
    const params = new URLSearchParams(searchString);
    const dateParam = params.get("date");
    const eventParam = params.get("event");
    let applied = false;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parsed = parseISO(dateParam);
      if (!isNaN(parsed.getTime())) {
        setActiveDate(dateParam);
        applied = true;
      }
    }
    const showParam = eventParam || params.get("show");
    if (showParam) {
      eventSelection.singleSelect(showParam);
      applied = true;
    }
    if (applied) {
      setTimeout(() => window.history.replaceState({}, "", window.location.pathname), 0);
    }
  }, [searchString]);

  // ─── Handle date select ──────────────────────────────────────────────
  const handleDateSelect = useCallback((date: string) => {
    setActiveDate(date);
    const availableSet = new Set(availableEvents);
    const showsOnDate = (eventsList as Event[]).filter((e: Event) => {
      if (!availableSet.has(e.name) || !e.startDate) return false;
      const end = e.endDate || e.startDate;
      return e.startDate <= date && end >= date;
    }).map((e: Event) => e.name);
    eventSelection.setSelectedEvents(showsOnDate);
  }, [availableEvents, eventsList, eventSelection]);

  // ─── Effective selected events ───────────────────────────────────────
  const effectiveSelectedEvents: string[] = useMemo(() => {
    if (!isManager && availableEvents.length === 0) return [];
    const availableSet = new Set(availableEvents);
    return selectedEvents.filter(n => availableSet.has(n));
  }, [availableEvents, isManager, selectedEvents]);
  const effectiveSelectedEventsSet = useMemo(() => new Set(effectiveSelectedEvents), [effectiveSelectedEvents]);
  const multiShowSelected = effectiveSelectedEvents.length > 1;

  // ─── Show color map ──────────────────────────────────────────────────
  const showColorMap = useMemo(() => {
    return buildColorMap(eventsList.map((e: Event) => e.name));
  }, [eventsList, buildColorMap]);

  // ─── Effective selected event IDs ─────────────────────────────────────
  const effectiveSelectedEventIds: number[] = useMemo(() => {
    if (!isManager && availableEventIds.length === 0) return [];
    const availableIdSet = new Set(availableEventIds);
    return selectedEventIds.filter(id => availableIdSet.has(id));
  }, [availableEventIds, isManager, selectedEventIds]);
  const effectiveSelectedEventIdSet = useMemo(() => new Set(effectiveSelectedEventIds), [effectiveSelectedEventIds]);

  // ─── Name→Event lookup for legacy rows without eventId ───────────────
  const eventByName = useMemo(() => {
    const map = new Map<string, Event>();
    for (const e of eventsList) map.set(e.name, e);
    return map;
  }, [eventsList]);

  // ─── Filtered schedule ───────────────────────────────────────────────
  const filteredSchedule = useMemo(() => sortedSchedule.filter((item) => {
    if (!isManager) {
      if (!expandedAssignedEvents || expandedAssignedEvents.size === 0) return false;
      if (item.eventId && !expandedAssignedEvents.has(item.eventId)) return false;
      else if (!item.eventId && item.eventName) {
        // Fallback: resolve eventId from eventName for legacy rows
        const ev = eventByName.get(item.eventName);
        if (ev && !expandedAssignedEvents.has(ev.id)) return false;
      }
    }
    const d = item.eventDate || format(new Date(item.startTime), "yyyy-MM-dd");
    if (d !== activeDate) return false;
    if (effectiveSelectedEventIds.length > 0) {
      if (item.eventId) return effectiveSelectedEventIdSet.has(item.eventId);
      // Fallback for rows without eventId
      if (item.eventName) return effectiveSelectedEventsSet.has(item.eventName);
      return false;
    }
    return true;
  }), [sortedSchedule, activeDate, effectiveSelectedEventIds, effectiveSelectedEventIdSet, effectiveSelectedEventsSet, isManager, expandedAssignedEvents, eventByName]);

  const searchFilteredNestedFlat = useMemo(() => {
    const tree = buildNestedSchedule(filteredSchedule);
    return flattenNested(tree);
  }, [filteredSchedule]);

  // ─── Daily sheet schedule (unfiltered by selection) ──────────────────
  const dailySheetSchedule = useMemo(() => {
    return sortedSchedule.filter((item) => {
      if (!isManager) {
        if (!expandedAssignedEvents || expandedAssignedEvents.size === 0) return false;
        if (item.eventId && !expandedAssignedEvents.has(item.eventId)) return false;
        else if (!item.eventId && item.eventName) {
          const ev = eventByName.get(item.eventName);
          if (ev && !expandedAssignedEvents.has(ev.id)) return false;
        }
      }
      const d = item.eventDate || format(new Date(item.startTime), "yyyy-MM-dd");
      return d === activeDate;
    }).sort((a, b) => {
      const aMin = getLocalTimeMinutes(a.startTime) + ((a as any).isNextDay ? 24 * 60 : 0);
      const bMin = getLocalTimeMinutes(b.startTime) + ((b as any).isNextDay ? 24 * 60 : 0);
      const diff = aMin - bMin;
      if (diff !== 0) return diff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [sortedSchedule, activeDate, isManager, expandedAssignedEvents, eventByName]);

  // ─── Shows for selected date ─────────────────────────────────────────
  const allShowsForSelectedDate = useMemo(() => {
    if (!isManager) {
      if (!expandedAssignedEvents || expandedAssignedEvents.size === 0) return [];
    }
    return (eventsList as Event[]).filter((ev: Event) => {
      if (ev.archived) return false;
      if (!isManager && expandedAssignedEvents && !expandedAssignedEvents.has(ev.id)) return false;
      if (!ev.startDate) return false;
      const start = ev.startDate;
      const end = ev.endDate || ev.startDate;
      return activeDate >= start && activeDate <= end;
    });
  }, [eventsList, activeDate, isManager, expandedAssignedEvents]);

  const showsForSelectedDate = useMemo(() => {
    if (effectiveSelectedEventIds.length === 0 && effectiveSelectedEvents.length === 0) return allShowsForSelectedDate;
    return allShowsForSelectedDate.filter((ev: Event) =>
      effectiveSelectedEventIdSet.has(ev.id) || effectiveSelectedEventsSet.has(ev.name)
    );
  }, [allShowsForSelectedDate, effectiveSelectedEventIds, effectiveSelectedEventIdSet, effectiveSelectedEvents, effectiveSelectedEventsSet]);

  // ─── Show tour map ───────────────────────────────────────────────────
  const showTourMap = useMemo(() => {
    const map = new Map<string, { project: Project; nextStop: { event: Event; venue: Venue | null } | null }>();
    for (const tp of activeProjects) {
      if (!(tp as any).isTour) continue;
      const tourEvents = (eventsList as Event[])
        .filter(e => e.projectId === tp.id)
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
      const nextEv = tourEvents.find(ev => ev.startDate && ev.startDate > activeDate);
      let nextStop: { event: Event; venue: Venue | null } | null = null;
      if (nextEv) {
        const dayVenue = allDayVenues.find(dv => dv.eventId === nextEv.id && dv.date === nextEv.startDate);
        const venueId = dayVenue ? dayVenue.venueId : nextEv.venueId;
        const venue = venueId ? venuesList.find(v => v.id === venueId) || null : null;
        nextStop = { event: nextEv, venue };
      }
      for (const ev of tourEvents) {
        if (ev.startDate && ev.startDate <= activeDate && (!ev.endDate || ev.endDate >= activeDate)) {
          map.set(ev.name, { project: tp, nextStop });
        }
      }
    }
    return map;
  }, [activeProjects, eventsList, activeDate, allDayVenues, venuesList]);

  // ─── Daily sheet contacts ────────────────────────────────────────────
  const dailySheetContacts = useMemo(() => {
    const dateShowIds = new Set(showsForSelectedDate.map(s => s.id));
    const dateShowNames = new Set(showsForSelectedDate.map(s => s.name));
    const relevantUserIds = new Set(
      allEventAssignments
        .filter((a: any) => (a.eventId ? dateShowIds.has(a.eventId) : dateShowNames.has(a.eventName)))
        .map((a: any) => a.userId)
    );
    if (!isManager) {
      const assignedIds = user?.eventAssignmentIds as number[] | undefined;
      const assignedIdSet = new Set(assignedIds || []);
      if (assignedIdSet.size === 0) {
        // Fallback to name-based
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
      const assignedUserIds = new Set(
        allEventAssignments
          .filter((a: any) => {
            const matchesAssigned = a.eventId ? assignedIdSet.has(a.eventId) : false;
            const matchesDate = a.eventId ? dateShowIds.has(a.eventId) : dateShowNames.has(a.eventName);
            return matchesAssigned && matchesDate;
          })
          .map((a: any) => a.userId)
      );
      return contacts.filter(c => c.userId && assignedUserIds.has(c.userId));
    }
    return contacts.filter(c => c.userId && relevantUserIds.has(c.userId));
  }, [contacts, isManager, user, showsForSelectedDate, allEventAssignments]);

  // ─── DnD ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; sortOrder: number }[]) => {
      await apiRequest("PATCH", "/api/schedules/reorder", { items });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/schedules"] }),
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

  const deleteTravelDayMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/travel-days/${id}`);
    },
    onSuccess: () => {
      activeProjectIds.forEach(id => queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "travel-days"] }));
      toast({ title: "Travel day removed" });
    },
  });

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
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return {
    // Auth / user
    user, logout, isManager, isAdmin, canEdit, canComplete, hasNoAssignment,
    // Event selection
    eventSelection, selectedEvents, selectedEventIds, availableEvents, availableEventIds,
    effectiveSelectedEvents, effectiveSelectedEventsSet,
    effectiveSelectedEventIds, effectiveSelectedEventIdSet,
    multiShowSelected,
    // Date
    activeDate, setActiveDate, handleDateSelect, availableDates, todayStr,
    // Raw data
    eventsList: eventsList as Event[], schedules, contacts, venuesList, allZones, allSections, allProjects,
    allEventAssignments, allDayVenues,
    // Workspaces
    userWorkspaces, currentWorkspace, pendingInviteNotif,
    // Computed
    sortedSchedule, filteredSchedule, searchFilteredNestedFlat, dailySheetSchedule,
    showsForSelectedDate, allShowsForSelectedDate,
    showColorMap, showTourMap, dailySheetContacts,
    travelDayForSelectedDate, dashboardTravelDays,
    venue, eventLinkedVenueId, selectedVenueId, setSelectedVenueId,
    activeProjects, activeProjectIds,
    expandedAssignedEvents, closestFutureEvent,
    // DnD
    sensors, handleDragEnd, reorderMutation,
    // Mutations
    deleteSchedule, deleteContact, deleteScheduleMutation, duplicateScheduleMutation,
    deleteTravelDayMutation, markInviteReadMutation, switchToInviteWorkspaceMutation,
    createProjectForShow,
    // Query client
    queryClient,
    toast,
  };
}
