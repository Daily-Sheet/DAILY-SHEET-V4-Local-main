import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getLocalTimeMinutes, formatTime, getUrgencyStatus } from "@/lib/timeUtils";
import type { Schedule } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock, CheckCircle2, Circle, Pencil, Trash2, Copy, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface GanttScheduleViewProps {
  schedules: Schedule[];
  showColorMap: Map<string, { dot: string; bg: string; text: string; border: string; bar: string }>;
  selectedEvents: string[];
  canEdit?: boolean;
  canComplete?: boolean;
  onDelete?: (id: number) => void;
  renderEditDialog?: (item: Schedule, onClose: () => void) => React.ReactNode;
  onDuplicate?: (item: Schedule) => void;
}

// Category → left-border accent colour (Tailwind border-l colour class)
const CATEGORY_COLORS: Record<string, string> = {
  production:  "border-l-blue-500",
  show:        "border-l-green-500",
  catering:    "border-l-orange-400",
  travel:      "border-l-purple-500",
  meeting:     "border-l-cyan-500",
  security:    "border-l-red-500",
  media:       "border-l-pink-500",
};
function categoryAccent(category: string): string {
  return CATEGORY_COLORS[category?.toLowerCase()] ?? "border-l-muted-foreground/40";
}

const ROW_HEIGHT = 32;
const ROW_GAP = 2;
const HEADER_HEIGHT = 24;
const MIN_BAR_PX = 20;
const LABEL_WIDTH = 100;

const V_HEADER_HEIGHT = 32;
const V_COL_MIN_WIDTH = 60;
const V_BAR_MARGIN = 2;
const V_HOUR_HEIGHT = 40;

/** Get effective minutes for a schedule item, accounting for isNextDay (+1440) */
function effectiveMinutes(item: Schedule): { startMin: number; endMin: number } {
  const nextDayOffset = (item as any).isNextDay ? 1440 : 0;
  const startMin = getLocalTimeMinutes(item.startTime) + nextDayOffset;
  if (item.endTime) {
    const rawEnd = getLocalTimeMinutes(item.endTime) + nextDayOffset;
    // If end is before start in clock time it spans midnight — add 24 h
    const endMin = rawEnd < startMin ? rawEnd + 1440 : rawEnd;
    return { startMin, endMin };
  }
  return { startMin, endMin: startMin + 30 };
}

function getHourRange(schedules: Schedule[]): [number, number] {
  if (schedules.length === 0) return [6, 24];
  let minH = 24, maxH = 0;
  for (const s of schedules) {
    const { startMin, endMin } = effectiveMinutes(s);
    const startHour = Math.floor(startMin / 60);
    minH = Math.min(minH, startHour);
    const endHour = Math.ceil(endMin / 60);
    maxH = Math.max(maxH, endHour);
  }
  return [Math.max(0, minH - 1), Math.min(30, maxH + 1)];
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(ref.current);
    setWidth(ref.current.clientWidth);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function useShowGroups(schedules: Schedule[], selectedEvents: string[]) {
  return useMemo(() => {
    const groups = new Map<string, Schedule[]>();
    for (const s of schedules) {
      const key = s.eventName || "Unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }
    const ordered: [string, Schedule[]][] = [];
    for (const name of selectedEvents) {
      if (groups.has(name)) {
        ordered.push([name, groups.get(name)!]);
        groups.delete(name);
      }
    }
    for (const [name, items] of Array.from(groups)) {
      ordered.push([name, items]);
    }
    return ordered;
  }, [schedules, selectedEvents]);
}

function useLaneAssignments(showGroups: [string, Schedule[]][]) {
  return useMemo(() => {
    const assignments = new Map<number, number>();
    const laneCounts = new Map<string, number>();

    for (const [showName, items] of showGroups) {
      const sorted = [...items].sort((a, b) => effectiveMinutes(a).startMin - effectiveMinutes(b).startMin);
      const lanes: number[][] = [];

      for (const item of sorted) {
        const { startMin: itemStart, endMin: itemEnd } = effectiveMinutes(item);

        let placed = false;
        for (let i = 0; i < lanes.length; i++) {
          const laneEnd = lanes[i][lanes[i].length - 1];
          if (itemStart >= laneEnd) {
            lanes[i].push(itemEnd);
            assignments.set(item.id, i);
            placed = true;
            break;
          }
        }
        if (!placed) {
          lanes.push([itemEnd]);
          assignments.set(item.id, lanes.length - 1);
        }
      }
      laneCounts.set(showName, Math.max(1, lanes.length));
    }

    return { assignments, laneCounts };
  }, [showGroups]);
}

function formatNowLabel(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function SelectedItemDetail({
  item,
  showColorMap,
  onClose,
  canEdit,
  canComplete,
  onDelete,
  renderEditDialog,
  onDuplicate,
}: {
  item: Schedule;
  showColorMap: GanttScheduleViewProps["showColorMap"];
  onClose: () => void;
  canEdit?: boolean;
  canComplete?: boolean;
  onDelete?: (id: number) => void;
  renderEditDialog?: (item: Schedule, onClose: () => void) => React.ReactNode;
  onDuplicate?: (item: Schedule) => void;
}) {
  const urgency = getUrgencyStatus(item);
  const color = item.eventName ? showColorMap.get(item.eventName) : undefined;
  const detailRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const toggleComplete = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/schedules/${item.id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
      toast({ title: item.completed ? "Marked incomplete" : "Marked complete" });
    },
  });

  useEffect(() => {
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [item.id]);

  return (
    <div
      ref={detailRef}
      className="border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm mt-2"
      data-testid="gantt-detail-panel"
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {(canComplete || canEdit) && (
                <button
                  type="button"
                  onClick={() => toggleComplete.mutate()}
                  disabled={toggleComplete.isPending}
                  className={cn(
                    "flex-shrink-0 transition-colors cursor-pointer",
                    item.completed
                      ? "text-green-600 dark:text-green-400"
                      : urgency === "overdue" ? "text-red-500"
                      : urgency === "urgent" ? "text-orange-500"
                      : urgency === "warning" ? "text-yellow-600 dark:text-yellow-400"
                      : "text-muted-foreground/40 hover:text-muted-foreground",
                  )}
                  data-testid={`button-gantt-complete-${item.id}`}
                >
                  {item.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
              )}
              <span className={cn(
                "font-semibold text-sm",
                item.completed && "line-through opacity-60"
              )}>
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="font-mono text-xs text-primary font-bold">
                {formatTime(item.startTime)}
              </span>
              {item.endTime && (
                <>
                  <span className="text-xs text-muted-foreground">—</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(item.endTime)}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {item.category}
              </Badge>
              {item.eventName && color && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0", color.bg, color.text, color.border)}
                >
                  {item.eventName}
                </Badge>
              )}
              {item.eventName && !color && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {item.eventName}
                </Badge>
              )}
              {urgency !== "none" && urgency !== "complete" && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                  urgency === "warning" && "border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
                  urgency === "urgent" && "border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/10",
                  urgency === "overdue" && "border-red-500 text-red-600 dark:text-red-400 bg-red-500/10",
                )}>
                  {urgency === "warning" ? "Ending Soon" : urgency === "urgent" ? "Almost Done" : "Overdue"}
                </Badge>
              )}
              {urgency === "complete" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-600 dark:text-green-400 bg-green-500/10">
                  Complete
                </Badge>
              )}
            </div>

            {item.location && (
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{item.location}</span>
              </div>
            )}

            {item.description && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                {item.description}
              </p>
            )}

            {(() => {
              const crew: any[] = (item as any).crew && ((item as any).crew as any[]).length > 0
                ? ((item as any).crew as any[])
                : ((item as any).crewNames || []).map((n: string) => ({ name: n }));
              if (crew.length === 0) return null;
              return (
                <div className="mt-2">
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide font-medium mb-1">Crew</p>
                  <div className="space-y-1">
                    {crew.map((member: any, idx: number) => (
                      <div key={`${member.name}-${idx}`} className="flex items-center gap-1.5 flex-wrap">
                        <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-medium">{member.name}</span>
                        {member.position && (
                          <span className="text-xs text-muted-foreground">· {member.position}</span>
                        )}
                        {(member.departments || []).map((dept: string) => (
                          <Badge key={dept} variant="outline" className="text-[9px] px-1.5 py-0">{dept}</Badge>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            {canEdit && onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => { onDuplicate(item); onClose(); }}
                title="Duplicate item"
                data-testid={`button-gantt-duplicate-${item.id}`}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            )}
            {canEdit && renderEditDialog && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    data-testid={`button-gantt-edit-${item.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </DialogTrigger>
                {editOpen && renderEditDialog(item, () => setEditOpen(false))}
              </Dialog>
            )}
            {canEdit && onDelete && (
              <ConfirmDelete
                onConfirm={() => {
                  onDelete(item.id);
                  onClose();
                }}
                title="Delete schedule item?"
                description={`Remove "${item.title}" from the schedule? This cannot be undone.`}
                triggerClassName="h-7 w-7 text-destructive hover:text-destructive"
                data-testid={`button-gantt-delete-${item.id}`}
              />
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground flex-shrink-0 p-1 hover:text-foreground transition-colors"
              data-testid="button-close-gantt-detail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SNAP_MINUTES = 15;

function snapTo(m: number) {
  return Math.round(m / SNAP_MINUTES) * SNAP_MINUTES;
}

function minutesToIso(item: Schedule, minutes: number): string {
  const baseStr = item.eventDate
    ? item.eventDate
    : new Date(item.startTime as unknown as string).toISOString().split("T")[0];
  const base = new Date(baseStr + "T12:00:00"); // noon to avoid DST edge cases
  // Minutes >= 1440 means we've crossed midnight — advance the date
  if (minutes >= 1440) {
    base.setDate(base.getDate() + Math.floor(minutes / 1440));
  }
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const dateStr = base.toISOString().split("T")[0];
  return new Date(
    `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
  ).toISOString();
}

function fmtMins(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

function HorizontalGantt({
  schedules,
  showColorMap,
  showGroups,
  laneAssignments,
  selectedItem,
  onSelectItem,
  canEdit,
}: {
  schedules: Schedule[];
  showColorMap: GanttScheduleViewProps["showColorMap"];
  showGroups: [string, Schedule[]][];
  laneAssignments: { assignments: Map<number, number>; laneCounts: Map<string, number> };
  selectedItem: Schedule | null;
  onSelectItem: (item: Schedule) => void;
  canEdit?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const [tooltipItem, setTooltipItem] = useState<Schedule | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── Drag state ──────────────────────────────────────────────────────────────
  const [drag, setDrag] = useState<{
    item: Schedule;
    type: "move" | "resize";
    startX: number;
    origStartMin: number;
    origEndMin: number;
  } | null>(null);
  const [preview, setPreview] = useState<{ startMin: number; endMin: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateSchedule = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/schedules/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
    },
    onError: () => {
      toast({ title: "Failed to update time", variant: "destructive" });
    },
  });
  // ────────────────────────────────────────────────────────────────────────────

  const [startHour, endHour] = useMemo(() => getHourRange(schedules), [schedules]);
  const totalHours = endHour - startHour;
  const timelineWidth = Math.max(0, containerWidth - LABEL_WIDTH);
  const hourWidth = totalHours > 0 ? timelineWidth / totalHours : 100;
  const pxPerMinute = hourWidth / 60;

  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const nowLabel = useMemo(() => formatNowLabel(), []);

  const hours = useMemo(() => {
    const h = [];
    for (let hr = startHour; hr < endHour; hr++) {
      const displayH = hr % 24;
      const ampm = displayH >= 12 ? "PM" : "AM";
      const h12 = displayH === 0 ? 12 : displayH > 12 ? displayH - 12 : displayH;
      h.push({ hour: hr, label: `${h12}${ampm}` });
    }
    return h;
  }, [startHour, endHour]);

  let currentY = 0;
  const groupOffsets: { name: string; y: number; height: number }[] = [];
  for (const [showName] of showGroups) {
    const laneCount = laneAssignments.laneCounts.get(showName) || 1;
    const groupHeight = laneCount * (ROW_HEIGHT + ROW_GAP);
    groupOffsets.push({ name: showName, y: currentY, height: groupHeight });
    currentY += groupHeight + 6;
  }
  const totalHeight = currentY;

  function minutesToX(minutes: number): number {
    return (minutes - startHour * 60) * pxPerMinute;
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!drag) return;
    const deltaX = e.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) didDrag.current = true;
    const deltaMins = deltaX / pxPerMinute;
    if (drag.type === "move") {
      const duration = drag.origEndMin - drag.origStartMin;
      const newStart = snapTo(drag.origStartMin + deltaMins);
      setPreview({ startMin: newStart, endMin: newStart + duration });
    } else {
      const newEnd = snapTo(drag.origEndMin + deltaMins);
      setPreview({
        startMin: drag.origStartMin,
        endMin: Math.max(drag.origStartMin + SNAP_MINUTES, newEnd),
      });
    }
  }, [drag, pxPerMinute]);

  const commitDrag = useCallback(() => {
    if (drag && preview && didDrag.current) {
      updateSchedule.mutate({
        id: drag.item.id,
        data: {
          startTime: minutesToIso(drag.item, preview.startMin),
          endTime: minutesToIso(drag.item, preview.endMin),
        },
      });
    }
    setDrag(null);
    setPreview(null);
    setTimeout(() => { didDrag.current = false; }, 0);
  }, [drag, preview, updateSchedule]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener("mouseup", commitDrag);
    return () => window.removeEventListener("mouseup", commitDrag);
  }, [drag, commitDrag]);
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden",
        drag && "select-none",
      )}
      style={{ cursor: drag ? "grabbing" : undefined }}
      onMouseMove={handleMouseMove}
      data-testid="gantt-schedule-view"
    >
      {containerWidth > 0 && (
        <div className="flex">
          <div
            className="flex-shrink-0 border-r border-border bg-muted/30 z-10"
            style={{ width: LABEL_WIDTH }}
          >
            <div
              className="border-b border-border flex items-center justify-between px-2 gap-1"
              style={{ height: HEADER_HEIGHT }}
            >
              <span className="text-[10px] font-display uppercase tracking-wide text-muted-foreground">Shows</span>
            </div>
            {groupOffsets.map(({ name, height }, idx) => {
              const color = showColorMap.get(name);
              return (
                <div
                  key={name}
                  className="flex items-center gap-1 px-2 border-b border-border/50"
                  style={{ height, marginTop: idx === 0 ? 0 : 6 }}
                  data-testid={`gantt-show-label-${name.replace(/\s+/g, "-")}`}
                >
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", color?.dot || "bg-primary")} />
                  <span className="text-[10px] font-medium truncate">{name}</span>
                </div>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden">
            <div style={{ width: timelineWidth }}>
              <div
                className="flex border-b border-border bg-muted/20"
                style={{ height: HEADER_HEIGHT }}
              >
                {hours.map(({ hour, label }) => (
                  <div
                    key={hour}
                    className="flex-shrink-0 flex items-center justify-center border-r border-border/30 text-[9px] text-muted-foreground font-mono"
                    style={{ width: hourWidth }}
                  >
                    {hourWidth > 30 ? label : label.replace(/[AP]M/, "")}
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: totalHeight }}>
                {hours.map(({ hour }) => (
                  <div
                    key={`grid-${hour}`}
                    className="absolute top-0 bottom-0 border-r border-border/15"
                    style={{ left: (hour - startHour) * hourWidth }}
                  />
                ))}

                {nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60 && (
                  <div
                    ref={nowRef}
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none"
                    style={{ left: minutesToX(nowMinutes) }}
                    data-testid="gantt-now-indicator"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-[3px] -mt-1" />
                    <div className="absolute top-0 -translate-y-full left-1/2 -translate-x-1/2">
                      <span className="text-[8px] font-mono font-bold text-red-500 bg-card/90 px-1 rounded whitespace-nowrap">
                        {nowLabel}
                      </span>
                    </div>
                  </div>
                )}

                {showGroups.map(([showName, items]) => {
                  const groupOffset = groupOffsets.find(g => g.name === showName);
                  if (!groupOffset) return null;
                  const color = showColorMap.get(showName);

                  return items.map((item) => {
                    const isDraggingThis = drag?.item.id === item.id;
                    const eff = effectiveMinutes(item);
                    const startMin = isDraggingThis && preview
                      ? preview.startMin
                      : eff.startMin;
                    const endMin = isDraggingThis && preview
                      ? (preview.endMin < preview.startMin ? preview.endMin + 1440 : preview.endMin)
                      : eff.endMin;
                    const x = minutesToX(startMin);
                    const barWidth = Math.max(MIN_BAR_PX, minutesToX(endMin) - x);
                    const lane = laneAssignments.assignments.get(item.id) || 0;
                    const y = groupOffset.y + lane * (ROW_HEIGHT + ROW_GAP) + 2;
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "absolute rounded-md flex items-center px-1 gap-0.5 transition-shadow",
                          "border text-left overflow-hidden group",
                          item.completed && "opacity-40",
                          color?.bg || "bg-primary/20",
                          color?.border || "border-primary/30",
                          "border-l-[3px]", categoryAccent(item.category),
                          isSelected && !isDraggingThis && "ring-2 ring-primary z-30 shadow-md",
                          !isSelected && !isDraggingThis && "hover:brightness-110 hover:shadow-sm",
                          isDraggingThis && "shadow-xl ring-2 ring-primary/70 z-40 brightness-110",
                          canEdit ? (isDraggingThis ? "cursor-grabbing" : "cursor-grab") : "cursor-pointer",
                        )}
                        style={{ left: x, top: y, width: barWidth, height: ROW_HEIGHT - 4 }}
                        onMouseDown={canEdit ? (e) => {
                          e.preventDefault();
                          const origStartMin = getLocalTimeMinutes(item.startTime);
                          const rawEnd = item.endTime
                            ? getLocalTimeMinutes(item.endTime)
                            : origStartMin + 30;
                          const origEndMin = rawEnd < origStartMin ? rawEnd + 1440 : rawEnd;
                          setDrag({ item, type: "move", startX: e.clientX, origStartMin, origEndMin });
                          setTooltipItem(null);
                          didDrag.current = false;
                        } : undefined}
                        onClick={() => {
                          if (didDrag.current) return;
                          onSelectItem(item);
                        }}
                        onMouseEnter={(e) => {
                          if (drag) return;
                          setTooltipItem(item);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setTooltipItem(null)}
                        data-testid={`gantt-bar-${item.id}`}
                      >
                        {item.completed && (
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-green-600 dark:text-green-400" />
                        )}
                        <span
                          className={cn(
                            "text-[9px] font-medium truncate leading-tight",
                            color?.text || "text-primary",
                            item.completed && "line-through",
                          )}
                        >
                          {item.title}
                        </span>
                        {barWidth > 80 && !isDraggingThis && (
                          <span className="text-[8px] text-muted-foreground flex-shrink-0 font-mono">
                            {formatTime(item.startTime)}
                          </span>
                        )}

                        {/* Resize handle — right edge */}
                        {canEdit && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2.5 flex items-center justify-center cursor-ew-resize opacity-0 group-hover:opacity-100 z-10"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const origStartMin = getLocalTimeMinutes(item.startTime);
                              const rawEnd = item.endTime
                                ? getLocalTimeMinutes(item.endTime)
                                : origStartMin + 30;
                              const origEndMin = rawEnd < origStartMin ? rawEnd + 1440 : rawEnd;
                              setDrag({ item, type: "resize", startX: e.clientX, origStartMin, origEndMin });
                              didDrag.current = false;
                            }}
                          >
                            <div className="w-[3px] h-3 rounded-full bg-current opacity-40" />
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag time preview label */}
      {drag && preview && didDrag.current && (
        <div
          className="fixed z-50 bg-card border border-primary/60 rounded-lg px-2.5 py-1 text-xs font-mono font-bold shadow-xl pointer-events-none text-primary"
          style={{ left: mousePos.x + 14, top: mousePos.y - 34 }}
        >
          {fmtMins(preview.startMin)} — {fmtMins(preview.endMin)}
        </div>
      )}

      {/* Hover tooltip */}
      {tooltipItem && tooltipItem.id !== selectedItem?.id && !drag && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg px-3 py-2 pointer-events-none max-w-[240px]"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
          data-testid="gantt-tooltip"
        >
          <div className="text-sm font-semibold">{tooltipItem.title}</div>
          <div className="text-xs text-muted-foreground">
            {formatTime(tooltipItem.startTime)}
            {tooltipItem.endTime ? ` — ${formatTime(tooltipItem.endTime)}` : ""}
          </div>
          {tooltipItem.category && (
            <Badge variant="outline" className="text-[10px] mt-1">{tooltipItem.category}</Badge>
          )}
        </div>
      )}
    </div>
  );
}

function VerticalGantt({
  schedules,
  showColorMap,
  showGroups,
  laneAssignments,
  selectedItem,
  onSelectItem,
}: {
  schedules: Schedule[];
  showColorMap: GanttScheduleViewProps["showColorMap"];
  showGroups: [string, Schedule[]][];
  laneAssignments: { assignments: Map<number, number>; laneCounts: Map<string, number> };
  selectedItem: Schedule | null;
  onSelectItem: (item: Schedule) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);

  const [startHour, endHour] = useMemo(() => getHourRange(schedules), [schedules]);
  const totalHours = endHour - startHour;
  const totalHeight = totalHours * V_HOUR_HEIGHT;

  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const nowLabel = useMemo(() => formatNowLabel(), []);

  const hours = useMemo(() => {
    const h = [];
    for (let hr = startHour; hr < endHour; hr++) {
      const displayH = hr % 24;
      const ampm = displayH >= 12 ? "P" : "A";
      const h12 = displayH === 0 ? 12 : displayH > 12 ? displayH - 12 : displayH;
      h.push({ hour: hr, label: `${h12}${ampm}` });
    }
    return h;
  }, [startHour, endHour]);

  const timeLabelWidth = 28;
  const columnsArea = Math.max(0, containerWidth - timeLabelWidth);
  const showCount = showGroups.length;
  const colWidth = showCount > 0 ? Math.max(V_COL_MIN_WIDTH, columnsArea / showCount) : V_COL_MIN_WIDTH;

  function minutesToY(minutes: number): number {
    return (minutes - startHour * 60) * (V_HOUR_HEIGHT / 60);
  }

  return (
    <div ref={containerRef} className="relative border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm" style={{ touchAction: "pan-y" }} data-testid="gantt-schedule-view">
      {containerWidth > 0 && (
        <div className="flex">
          <div
            className="flex-shrink-0 border-r border-border bg-muted/30 z-10"
            style={{ width: timeLabelWidth }}
          >
            <div style={{ height: V_HEADER_HEIGHT }} className="border-b border-border" />
            <div className="relative" style={{ height: totalHeight }}>
              {hours.map(({ hour, label }) => (
                <div
                  key={hour}
                  className="absolute flex items-start justify-center text-[9px] text-muted-foreground font-mono leading-none w-full"
                  style={{ top: (hour - startHour) * V_HOUR_HEIGHT }}
                >
                  <span className="mt-[-5px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div>
              <div
                className="flex border-b border-border bg-muted/20 sticky top-0 z-10"
                style={{ height: V_HEADER_HEIGHT }}
              >
                {showGroups.map(([showName]) => {
                  const color = showColorMap.get(showName);
                  return (
                    <div
                      key={showName}
                      className="flex items-center justify-center gap-1 border-r border-border/30 px-1 min-w-0"
                      style={{ width: colWidth }}
                      data-testid={`gantt-show-label-${showName.replace(/\s+/g, '-')}`}
                    >
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", color?.dot || "bg-primary")} />
                      <span className="text-[9px] font-medium truncate">{showName}</span>
                    </div>
                  );
                })}
              </div>

              <div className="relative" style={{ height: totalHeight, touchAction: "pan-y" }}>
                {hours.map(({ hour }) => (
                  <div
                    key={`hgrid-${hour}`}
                    className="absolute left-0 right-0 border-t border-border/15"
                    style={{ top: (hour - startHour) * V_HOUR_HEIGHT }}
                  />
                ))}

                {showGroups.map(([showName], colIdx) => (
                  <div
                    key={`col-${showName}`}
                    className="absolute top-0 bottom-0 border-r border-border/10"
                    style={{ left: (colIdx + 1) * colWidth }}
                  />
                ))}

                {nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60 && (
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none"
                    style={{ top: minutesToY(nowMinutes) }}
                    data-testid="gantt-now-indicator"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -mt-[3px] -ml-1" />
                    <div className="absolute right-1 -translate-y-full">
                      <span className="text-[7px] font-mono font-bold text-red-500 bg-card/90 px-0.5 rounded whitespace-nowrap">
                        {nowLabel}
                      </span>
                    </div>
                  </div>
                )}

                {showGroups.map(([showName, items], colIdx) => {
                  const color = showColorMap.get(showName);
                  const laneCount = laneAssignments.laneCounts.get(showName) || 1;
                  const laneWidth = (colWidth - V_BAR_MARGIN * 2) / laneCount;

                  return items.map((item) => {
                    const eff = effectiveMinutes(item);
                    const yTop = minutesToY(eff.startMin);
                    const barHeight = Math.max(MIN_BAR_PX, minutesToY(eff.endMin) - yTop);
                    const lane = laneAssignments.assignments.get(item.id) || 0;
                    const x = colIdx * colWidth + V_BAR_MARGIN + lane * laneWidth;
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        className={cn(
                          "absolute rounded-md flex flex-col items-start px-1 py-0.5 cursor-pointer transition-all",
                          "border text-left overflow-hidden",
                          "active:scale-[0.97] active:brightness-90",
                          item.completed && "opacity-40",
                          color?.bg || "bg-primary/20",
                          color?.border || "border-primary/30",
                          isSelected && "ring-2 ring-primary z-30 shadow-md",
                          !isSelected && "hover:brightness-110",
                        )}
                        style={{
                          left: x,
                          top: yTop,
                          width: laneWidth - 1,
                          height: barHeight,
                        }}
                        onClick={() => onSelectItem(item)}
                        data-testid={`gantt-bar-${item.id}`}
                      >
                        {item.completed && barHeight > 25 && (
                          <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                        )}
                        <span
                          className={cn(
                            "text-[8px] font-semibold truncate leading-tight w-full",
                            color?.text || "text-primary",
                            item.completed && "line-through",
                          )}
                        >
                          {item.title}
                        </span>
                        {barHeight > 30 && (
                          <span className="text-[7px] text-muted-foreground font-mono leading-tight">
                            {formatTime(item.startTime)}
                          </span>
                        )}
                      </button>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GanttScheduleView({
  schedules,
  showColorMap,
  selectedEvents,
  canEdit,
  canComplete,
  onDelete,
  renderEditDialog,
  onDuplicate,
}: GanttScheduleViewProps) {
  const isMobile = useIsMobile();
  const showGroups = useShowGroups(schedules, selectedEvents);
  const laneAssignments = useLaneAssignments(showGroups);
  const [selectedItem, setSelectedItem] = useState<Schedule | null>(null);

  useEffect(() => {
    if (selectedItem) {
      const updated = schedules.find(s => s.id === selectedItem.id);
      if (!updated) {
        setSelectedItem(null);
      } else if (updated !== selectedItem) {
        setSelectedItem(updated);
      }
    }
  }, [schedules]);

  const handleSelectItem = useCallback((item: Schedule) => {
    setSelectedItem(prev => prev?.id === item.id ? null : item);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (schedules.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm" data-testid="gantt-empty">
        No schedule items to display in timeline view.
      </div>
    );
  }

  return (
    <div>
      {isMobile ? (
        <VerticalGantt
          schedules={schedules}
          showColorMap={showColorMap}
          showGroups={showGroups}
          laneAssignments={laneAssignments}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />
      ) : (
        <HorizontalGantt
          schedules={schedules}
          showColorMap={showColorMap}
          showGroups={showGroups}
          laneAssignments={laneAssignments}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
          canEdit={canEdit}
        />
      )}

      {selectedItem && (
        <SelectedItemDetail
          item={selectedItem}
          showColorMap={showColorMap}
          onClose={handleClose}
          canEdit={canEdit}
          canComplete={canComplete}
          onDelete={onDelete}
          renderEditDialog={renderEditDialog}
          onDuplicate={onDuplicate}
        />
      )}
    </div>
  );
}
