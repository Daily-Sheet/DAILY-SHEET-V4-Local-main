import { useState, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Mic2, ChevronDown, ArrowUpDown, X, Search, Archive, ChevronRight, Briefcase, Check, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Event } from "@shared/schema";
import type { Project } from "@shared/schema";

type ShowSortMode = "timeline" | "alpha";

export function ShowSwitcher({
  eventsList,
  availableEvents,
  effectiveSelectedEvents,
  effectiveSelectedEventsSet,
  projects,
  selectedDate,
  onToggleEvent,
  onSingleSelect,
  onSelectAll,
  onSelectAllCurrent,
  onClearAll,
  userProjectAssignments,
  userEventAssignments,
}: {
  eventsList: Event[];
  availableEvents: string[];
  effectiveSelectedEvents: string[];
  effectiveSelectedEventsSet: Set<string>;
  projects: Project[];
  selectedDate: string;
  onToggleEvent: (name: string) => void;
  onSingleSelect: (name: string) => void;
  onSelectAll: () => void;
  onSelectAllCurrent: (names: string[]) => void;
  onClearAll: () => void;
  userProjectAssignments?: { projectId: number }[];
  userEventAssignments?: string[];
}) {
  const [sortMode, setSortMode] = useState<ShowSortMode>("timeline");
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [toggledProjects, setToggledProjects] = useState<Set<number | "other">>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const eventsMap = useMemo(() => {
    const map = new Map<string, Event>();
    eventsList.forEach((e: Event) => map.set(e.name, e));
    return map;
  }, [eventsList]);

  const isOnSelectedDate = useCallback((name: string) => {
    const ev = eventsMap.get(name);
    if (!ev?.startDate) return false;
    const start = ev.startDate;
    const end = ev.endDate || ev.startDate;
    return selectedDate >= start && selectedDate <= end;
  }, [eventsMap, selectedDate]);

  const showsOnSelectedDate = useMemo(() => {
    return availableEvents.filter(isOnSelectedDate);
  }, [availableEvents, isOnSelectedDate]);

  const matchesSearchFilter = useCallback((name: string) => {
    if (!searchQuery.trim()) return true;
    return name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  }, [searchQuery]);

  const { currentEvents, archivedEvents } = useMemo(() => {
    const current: string[] = [];
    const archived: string[] = [];
    availableEvents.forEach(name => {
      if (!matchesSearchFilter(name)) return;
      const ev = eventsMap.get(name);
      const endOrStart = ev?.endDate || ev?.startDate;
      if (endOrStart && endOrStart < todayStr) {
        archived.push(name);
      } else {
        current.push(name);
      }
    });
    const sortFn = (a: string, b: string) => {
      if (sortMode === "alpha") return a.localeCompare(b);
      const evA = eventsMap.get(a);
      const evB = eventsMap.get(b);
      return (evA?.startDate || "").localeCompare(evB?.startDate || "");
    };
    current.sort(sortFn);
    archived.sort(sortFn);
    return { currentEvents: current, archivedEvents: archived };
  }, [availableEvents, eventsMap, sortMode, todayStr, matchesSearchFilter]);

  const hasProjects = projects.length > 0 && eventsList.some((e: Event) => e.projectId);

  const projectsWithEvents = useMemo(() => {
    if (!hasProjects) return [];
    const projectEventMap = new Map<number, Event[]>();
    eventsList.forEach(ev => {
      if (ev.projectId) {
        if (!projectEventMap.has(ev.projectId)) projectEventMap.set(ev.projectId, []);
        projectEventMap.get(ev.projectId)!.push(ev);
      }
    });
    return projects
      .filter(p => projectEventMap.has(p.id) && !p.archived)
      .map(p => {
        const evs = projectEventMap.get(p.id) || [];
        const hasToday = evs.some(ev => {
          const start = ev.startDate || "";
          const end = ev.endDate || ev.startDate || "";
          return start <= todayStr && end >= todayStr;
        });
        const earliest = evs.reduce((min, ev) => (ev.startDate && ev.startDate < min ? ev.startDate : min), "9999");
        const latest = evs.reduce((max, ev) => {
          const end = ev.endDate || ev.startDate || "";
          return end > max ? end : max;
        }, "");
        const isPast = latest < todayStr;
        return { project: p, hasToday, earliest, latest, isPast };
      })
      .sort((a, b) => {
        if (a.hasToday && !b.hasToday) return -1;
        if (!a.hasToday && b.hasToday) return 1;
        if (a.isPast && !b.isPast) return 1;
        if (!a.isPast && b.isPast) return -1;
        return a.earliest.localeCompare(b.earliest);
      });
  }, [hasProjects, projects, eventsList, todayStr]);

  const projectGroups = useMemo(() => {
    if (!hasProjects) return [];
    const groups: { project: Project | null; events: string[] }[] = [];

    const byProject = new Map<number | null, string[]>();
    currentEvents.forEach(name => {
      const ev = eventsMap.get(name);
      const pid = ev?.projectId ?? null;
      if (!byProject.has(pid)) byProject.set(pid, []);
      byProject.get(pid)!.push(name);
    });

    const sortedProjects = [...projectsWithEvents].map(pw => pw.project);
    sortedProjects.forEach(p => {
      const evs = byProject.get(p.id);
      if (evs && evs.length > 0) {
        groups.push({ project: p, events: evs });
      }
    });

    const ungrouped = byProject.get(null);
    if (ungrouped && ungrouped.length > 0) {
      groups.push({ project: null, events: ungrouped });
    }

    return groups;
  }, [hasProjects, currentEvents, eventsMap, projectsWithEvents]);

  const projectAssignedEventNames = useMemo(() => {
    if (!userProjectAssignments || userProjectAssignments.length === 0) return new Set<string>();
    const directSet = new Set(userEventAssignments || []);
    const projIds = new Set(userProjectAssignments.map(pa => pa.projectId));
    const viaProject = new Set<string>();
    eventsList.forEach((ev: Event) => {
      if (ev.projectId && projIds.has(ev.projectId) && !directSet.has(ev.name)) {
        viaProject.add(ev.name);
      }
    });
    return viaProject;
  }, [userProjectAssignments, userEventAssignments, eventsList]);

  const allCurrentSelected = currentEvents.length > 0 && currentEvents.every(n => effectiveSelectedEventsSet.has(n));

  const pillLabel = effectiveSelectedEvents.length === 0
    ? "No Shows"
    : effectiveSelectedEvents.length === 1
      ? effectiveSelectedEvents[0]
      : `${effectiveSelectedEvents.length} Shows`;

  const toggleProjectExpanded = (id: number | "other") => {
    setToggledProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderEventRow = (name: string) => {
    const isSelected = effectiveSelectedEventsSet.has(name);
    const ev = eventsMap.get(name);
    const isViaProject = projectAssignedEventNames.has(name);
    const isActiveToday = isOnSelectedDate(name);
    const evProject = ev?.projectId ? projects.find(p => p.id === ev.projectId) : null;
    const dateLabel = ev?.startDate
      ? `${format(parseISO(ev.startDate), "MMM d")}${ev.endDate && ev.endDate !== ev.startDate ? ` – ${format(parseISO(ev.endDate), "MMM d")}` : ""}`
      : null;

    return (
      <div
        key={name}
        className={cn(
          "flex items-center gap-1 w-full px-2 py-1.5 rounded-md text-sm group",
          isSelected && "bg-primary/5"
        )}
        data-testid={`menu-show-${name}`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleEvent(name)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleEvent(name); } }}
          className="shrink-0 p-0.5 hover-elevate rounded cursor-pointer"
          data-testid={`checkbox-area-${name}`}
        >
          <Checkbox
            checked={isSelected}
            className="pointer-events-none"
            data-testid={`checkbox-show-${name}`}
          />
        </div>
        <button
          type="button"
          onClick={() => onSingleSelect(name)}
          className="flex-1 text-left truncate hover-elevate rounded px-1 py-0.5 min-w-0"
          data-testid={`select-show-${name}`}
        >
          <div className="flex items-center gap-1">
            {isActiveToday && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
            <span className="truncate">{name}</span>
            {isViaProject && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap flex-shrink-0">{evProject?.isTour ? "All Shows" : "All Stages"}</span>
            )}
          </div>
          {dateLabel && (
            <span className="text-[10px] text-muted-foreground block">{dateLabel}</span>
          )}
        </button>
      </div>
    );
  };

  const renderProjectGroup = (group: { project: Project | null; events: string[] }) => {
    const groupId = group.project?.id ?? ("other" as const);
    const defaultExpanded = group.events.length <= 10;
    const isExpanded = toggledProjects.has(groupId) ? !defaultExpanded : defaultExpanded;
    const pw = group.project ? projectsWithEvents.find(pw => pw.project.id === group.project!.id) : null;
    const groupEventsSelected = group.events.every(n => effectiveSelectedEventsSet.has(n));
    const someSelected = group.events.some(n => effectiveSelectedEventsSet.has(n));
    const selectedCount = group.events.filter(n => effectiveSelectedEventsSet.has(n)).length;
    const isTour = group.project?.isTour;
    const isFestival = group.project?.isFestival;

    return (
      <div key={groupId} className="border-b border-border/30 last:border-b-0" data-testid={`project-group-${groupId}`}>
        <button
          type="button"
          onClick={() => toggleProjectExpanded(groupId)}
          className={cn(
            "flex items-center gap-1.5 w-full px-2.5 py-2 hover:bg-muted/50 transition-colors",
            isExpanded && "bg-muted/30"
          )}
          data-testid={`button-expand-project-${groupId}`}
        >
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground/60 transition-transform shrink-0", isExpanded && "rotate-90")} />
          {group.project ? (
            <Briefcase className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          ) : (
            <Mic2 className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          )}
          {pw?.hasToday && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
          <span className="text-xs font-semibold flex-1 text-left truncate" data-testid={`label-project-group-${groupId}`}>
            {group.project?.name ?? "Other Shows"}
          </span>
          {isTour && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">Tour</span>}
          {isFestival && <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">Festival</span>}
          <span className="text-[9px] text-muted-foreground/60 shrink-0">
            {selectedCount}/{group.events.length}
          </span>
        </button>
        {isExpanded && (
          <div className="pb-1">
            {pw && pw.earliest !== "9999" && (
              <div className="flex items-center justify-between px-3 py-0.5">
                <span className="text-[9px] text-muted-foreground/50">{format(parseISO(pw.earliest), "MMM d")} – {format(parseISO(pw.latest), "MMM d")}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (groupEventsSelected) {
                      const first = group.events[0];
                      if (first) onSingleSelect(first);
                    } else {
                      onSelectAllCurrent(group.events);
                    }
                  }}
                  className="text-[9px] text-primary hover-elevate rounded px-1"
                  data-testid={`button-select-all-project-${groupId}`}
                >
                  {groupEventsSelected ? "Deselect" : "Select All"}
                </button>
              </div>
            )}
            {!pw && (
              <div className="flex items-center justify-end px-3 py-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (groupEventsSelected) {
                      const first = group.events[0];
                      if (first) onSingleSelect(first);
                    } else {
                      onSelectAllCurrent(group.events);
                    }
                  }}
                  className="text-[9px] text-primary hover-elevate rounded px-1"
                  data-testid={`button-select-all-project-${groupId}`}
                >
                  {groupEventsSelected ? "Deselect" : "Select All"}
                </button>
              </div>
            )}
            <div className="space-y-0.5 pl-2">
              {group.events.map(renderEventRow)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 hover-elevate cursor-pointer transition-colors"
        data-testid="button-show-switcher"
      >
        <Mic2 className="h-3 w-3 shrink-0" />
        <span className="truncate min-w-0 max-w-[110px] sm:max-w-[200px]">
          {pillLabel}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0" onCloseAutoFocus={() => setSearchQuery("")}>
        <div className="px-3 py-2 border-b space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (allCurrentSelected) {
                    onClearAll();
                  } else {
                    onSelectAllCurrent(currentEvents);
                  }
                }}
                className="text-[10px] text-primary hover-elevate rounded px-1 shrink-0"
                data-testid="button-toggle-all-shows"
              >
                {allCurrentSelected ? "Deselect All" : "Select All"}
              </button>
              {effectiveSelectedEvents.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[10px] text-muted-foreground hover:text-destructive hover-elevate rounded px-1 shrink-0 flex items-center gap-0.5"
                  data-testid="button-clear-all-shows"
                >
                  <X className="h-2.5 w-2.5" /> Clear
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSortMode(prev => prev === "timeline" ? "alpha" : "timeline")}
              className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground"
              data-testid="button-sort-shows"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortMode === "timeline" ? "Timeline" : "A–Z"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shows..."
              className="h-7 pl-7 text-xs bg-muted/30 border-border/30"
              data-testid="input-search-shows"
            />
          </div>
          {showsOnSelectedDate.length > 0 && selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) && (
            <button
              type="button"
              onClick={() => onSelectAllCurrent(showsOnSelectedDate)}
              className="text-[10px] text-primary/80 hover:text-primary hover-elevate rounded px-1 flex items-center gap-1"
              data-testid="button-shows-on-date"
            >
              <CalendarIcon className="h-3 w-3" />
              <span>Shows on {format(parseISO(selectedDate), "MMM d")} ({showsOnSelectedDate.length})</span>
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {hasProjects && projectGroups.length > 0 ? (
            <div>
              {projectGroups.map(renderProjectGroup)}
            </div>
          ) : currentEvents.length > 0 ? (
            <div className="p-1.5">
              {currentEvents.map(renderEventRow)}
            </div>
          ) : null}

          {archivedEvents.length > 0 && (
            <div className="border-t border-border/30">
              <button
                type="button"
                onClick={() => setArchivedOpen(prev => !prev)}
                className="flex items-center gap-1.5 w-full px-2.5 py-2 hover:bg-muted/50 transition-colors"
                data-testid="button-toggle-archived"
              >
                <ChevronRight className={cn("h-3 w-3 text-muted-foreground/60 transition-transform shrink-0", archivedOpen && "rotate-90")} />
                <Archive className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground flex-1 text-left">
                  Archived ({archivedEvents.length})
                </span>
              </button>
              {archivedOpen && (
                <div className="space-y-0.5 px-1.5 pb-1.5">
                  {archivedEvents.map(renderEventRow)}
                </div>
              )}
            </div>
          )}

          {currentEvents.length === 0 && archivedEvents.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No shows available
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
