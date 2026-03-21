import { useState } from "react";
import { Calendar as CalendarIcon, Trash2, Users, MessageSquare, Send, Clock, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function ActivityFeed({ filterEvents = [] }: { filterEvents?: string[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const singleEvent = filterEvents.length === 1 ? filterEvents[0] : null;
  const queryKey = singleEvent ? ["/api/activity", { event: singleEvent }] : ["/api/activity"];
  const { data: entries = [], isLoading } = useQuery<{
    id: number;
    actorId: string;
    actorName: string;
    type: string;
    action: string;
    title: string;
    message: string;
    eventName: string | null;
    details: string | null;
    createdAt: string | null;
    workspaceId: number | null;
  }[]>({
    queryKey,
    queryFn: async () => {
      const url = singleEvent
        ? `/api/activity?event=${encodeURIComponent(singleEvent)}`
        : `/api/activity`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function getRelativeTime(dateStr: string | Date): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  function getActionIcon(type: string, action: string) {
    if (type === "schedule_change" && action === "created") return <CalendarIcon className="h-4 w-4 text-green-500" />;
    if (type === "schedule_change" && action === "updated") return <CalendarIcon className="h-4 w-4 text-blue-500" />;
    if (type === "schedule_change" && action === "deleted") return <Trash2 className="h-4 w-4 text-red-500" />;
    if (type === "assignment_change") return <Users className="h-4 w-4 text-green-500" />;
    if (type === "comment") return <MessageSquare className="h-4 w-4 text-orange-500" />;
    if (type === "daily_sheet_sent") return <Send className="h-4 w-4 text-purple-500" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  }

  function getActionLabel(action: string) {
    switch (action) {
      case "created": return "Added";
      case "updated": return "Updated";
      case "deleted": return "Removed";
      case "sent": return "Sent";
      default: return action;
    }
  }

  function parseDetails(details: string | null): any[] | null {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return null; }
  }

  function renderDetails(entry: typeof entries[0]) {
    const items = parseDetails(entry.details);
    if (!items || items.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 text-xs" data-testid={`activity-details-${entry.id}`}>
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground font-medium shrink-0 w-20 text-right">{item.field}:</span>
            {"from" in item ? (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="bg-red-500/15 text-red-600 dark:text-red-400 line-through px-1.5 py-0.5 rounded text-[11px]">{item.from || "(empty)"}</span>
                <span className="text-muted-foreground">→</span>
                <span className="bg-green-500/15 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded text-[11px]">{item.to || "(empty)"}</span>
              </div>
            ) : (
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[11px]",
                entry.action === "deleted" ? "bg-red-500/15 text-red-600 dark:text-red-400 line-through" : "bg-green-500/15 text-green-600 dark:text-green-400"
              )}>{item.value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading activity...
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-activity">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No activity yet. Changes to schedules, assignments, and comments will appear here.
        </CardContent>
      </Card>
    );
  }

  const grouped = entries.reduce((acc, entry) => {
    const dateKey = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Unknown";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  return (
    <div className="space-y-4" data-testid="activity-feed">
      {Object.entries(grouped).map(([dateLabel, dayEntries]) => (
        <div key={dateLabel}>
          <h3 className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 px-1">{dateLabel}</h3>
          <Card>
            <CardContent className="p-0 divide-y">
              {dayEntries.map((entry) => {
                const hasDetails = !!entry.details;
                const isExpanded = expandedIds.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={cn("px-4 py-3", hasDetails && "cursor-pointer hover-elevate")}
                    onClick={() => hasDetails && toggleExpand(entry.id)}
                    data-testid={`activity-item-${entry.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {getActionIcon(entry.type, entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{entry.actorName}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {getActionLabel(entry.action)}
                          </Badge>
                          {entry.eventName && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {entry.eventName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.message}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        <span className="text-[10px] text-muted-foreground/70">
                          {entry.createdAt ? getRelativeTime(entry.createdAt) : ""}
                        </span>
                        {hasDetails && (
                          <ChevronDown className={cn("h-3 w-3 text-muted-foreground/50 transition-transform", isExpanded && "rotate-180")} />
                        )}
                      </div>
                    </div>
                    {isExpanded && renderDetails(entry)}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

export function OverviewActivitySquare({ showName, onTap, className = "" }: { showName: string; onTap: () => void; className?: string }) {
  const { data: entries = [] } = useQuery<{
    id: number;
    actorName: string;
    type: string;
    action: string;
    message: string;
    eventName: string | null;
    createdAt: string | null;
  }[]>({
    queryKey: ["/api/activity", { limit: 10 }],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/activity?limit=10", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
  });

  function getRelativeTime(dateStr: string | Date): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d`;
    return new Date(dateStr).toLocaleDateString();
  }

  function getActionIcon(type: string, action: string) {
    if (type === "schedule_change" && action === "created") return <CalendarIcon className="h-3 w-3 text-green-500" />;
    if (type === "schedule_change" && action === "updated") return <CalendarIcon className="h-3 w-3 text-blue-500" />;
    if (type === "schedule_change" && action === "deleted") return <Trash2 className="h-3 w-3 text-red-500" />;
    if (type === "assignment_change") return <Users className="h-3 w-3 text-green-500" />;
    if (type === "comment") return <MessageSquare className="h-3 w-3 text-orange-500" />;
    if (type === "daily_sheet_sent") return <Send className="h-3 w-3 text-purple-500" />;
    return <Clock className="h-3 w-3 text-muted-foreground" />;
  }

  const showEntries = entries.filter(e => e.eventName === showName).slice(0, 4);

  return (
    <button
      className={`flex flex-col gap-1.5 p-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors text-left min-h-[120px] h-full w-full min-w-0 max-h-[14rem] ${className}`}
      onClick={onTap}
      data-testid={`overview-activity-${showName.replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-1.5">
        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-display uppercase tracking-wide text-muted-foreground">Activity</span>
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {showEntries.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No recent activity</span>
        ) : (
          showEntries.map(entry => (
            <div key={entry.id} className="flex items-center gap-1 min-w-0">
              <div className="flex-shrink-0">{getActionIcon(entry.type, entry.action)}</div>
              <span className="text-[11px] truncate flex-1">{entry.message}</span>
              <span className="text-[9px] text-muted-foreground/60 flex-shrink-0">
                {entry.createdAt ? getRelativeTime(entry.createdAt) : ""}
              </span>
            </div>
          ))
        )}
      </div>
    </button>
  );
}
