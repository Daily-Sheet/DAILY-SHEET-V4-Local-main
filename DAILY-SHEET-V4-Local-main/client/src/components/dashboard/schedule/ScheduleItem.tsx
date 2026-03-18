import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Users, Pencil, Trash2, CheckCircle2, Circle, Copy } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTime, getUrgencyStatus } from "@/lib/timeUtils";
import { useMutation, useQueryClient, useMutationState } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useToast } from "@/hooks/use-toast";
import type { Contact, Schedule } from "@shared/schema";
import type { Zone, Section } from "@shared/schema";
import { useUrgencyTick } from "@/components/dashboard/utils";
import { ScheduleCommentsDialog, InlineComments } from "./ScheduleComments";
import { EditScheduleDialog } from "./EditScheduleDialog";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

export function ClearDayButton({ date, eventName, count }: { date: string; eventName?: string; count: number }) {
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

export function ScheduleItem({
  item,
  canEdit,
  canComplete,
  onDelete,
  onDuplicate,
  showColor,
  multiShow,
  depth = 0,
  zones = [],
  sections = [],
  contacts = [],
  activityMap,
  allEventAssignments = [],
}: {
  item: any;
  canEdit: boolean;
  canComplete: boolean;
  onDelete: (id: number) => void;
  onDuplicate?: (item: any) => void;
  showColor?: { bg: string; text: string; border: string } | null;
  multiShow?: boolean;
  depth?: number;
  zones?: Zone[];
  sections?: Section[];
  contacts?: Contact[];
  activityMap?: Map<string, boolean>;
  allEventAssignments?: any[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const isNested = depth > 0;
  const indentPx = depth * 16;

  useUrgencyTick();
  const urgency = getUrgencyStatus(item);

  const toggleComplete = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/schedules/${item.id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
    },
  });

  const CATEGORY_BORDER: Record<string, string> = {
    production: "border-l-blue-500/70",
    show: "border-l-green-500/70",
    catering: "border-l-orange-400/70",
    travel: "border-l-purple-500/70",
    meeting: "border-l-cyan-500/70",
    security: "border-l-red-500/70",
    media: "border-l-pink-500/70",
  };
  const categoryBorder = CATEGORY_BORDER[(item.category || "").toLowerCase()];

  const hasDetails = item.location || (item.zoneId && zones.length > 0) || (item.sectionId && sections.length > 0);
  return (
    <div
      className={cn(
        "px-3 py-2 group transition-all duration-200 rounded-xl border bg-card/50 backdrop-blur-sm",
        urgency === "none" ? cn("border-border/30 hover:border-border/50 hover:bg-card/70 border-l-[3px]", categoryBorder || "border-l-border/50") : "",
        urgency === "warning" && "border-yellow-500/30 bg-yellow-400/10 dark:bg-yellow-500/10 hover:bg-yellow-400/15",
        urgency === "urgent" && "border-orange-500/30 bg-orange-400/10 dark:bg-orange-500/10 hover:bg-orange-400/15",
        urgency === "overdue" && "border-red-500/30 bg-red-400/10 dark:bg-red-500/10 hover:bg-red-400/15",
        urgency === "complete" && "border-green-500/30 bg-green-400/10 dark:bg-green-500/10 hover:bg-green-400/15",
      )}
      style={isNested ? { marginLeft: `${indentPx}px` } : undefined}
      data-testid={`schedule-item-${item.id}`}
    >
      <div className="flex items-start gap-2">
        {isNested && (
          <div className="w-0.5 self-stretch bg-primary/30 flex-shrink-0 -ml-1 rounded-full" />
        )}

        {canComplete && (
          <button
            type="button"
            onClick={() => toggleComplete.mutate()}
            disabled={toggleComplete.isPending}
            className={cn(
              "flex-shrink-0 mt-0.5 transition-colors cursor-pointer",
              item.completed ? "text-green-600 dark:text-green-400" : urgency === "overdue" ? "text-red-500" : urgency === "urgent" ? "text-orange-500" : urgency === "warning" ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
            data-testid={`button-complete-schedule-${item.id}`}
          >
            {item.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          </button>
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
              <span className={cn("font-semibold text-sm", isNested ? "text-foreground/80" : "", item.completed && "line-through opacity-60")}>{item.title}</span>
              <Badge variant="outline" className="text-[10px] font-normal flex-shrink-0 px-1.5 py-0 bg-card/60 backdrop-blur-sm">{item.category}</Badge>
              {urgency !== "none" && urgency !== "complete" && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                  urgency === "warning" && "border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
                  urgency === "urgent" && "border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/10",
                  urgency === "overdue" && "border-red-500 text-red-600 dark:text-red-400 bg-red-500/10",
                )} data-testid={`badge-urgency-${item.id}`}>
                  {urgency === "warning" ? "Ending Soon" : urgency === "urgent" ? "Almost Done" : "Overdue"}
                </Badge>
              )}
              {urgency === "complete" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-600 dark:text-green-400 bg-green-500/10" data-testid={`badge-complete-${item.id}`}>
                  Complete
                </Badge>
              )}
              <ScheduleCommentsDialog scheduleId={item.id} itemTitle={item.title} />
            </div>
            {canEdit && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {onDuplicate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => onDuplicate(item)}
                    data-testid={`button-duplicate-schedule-${item.id}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
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

          {(multiShow && item.eventName && showColor) && (
            <Badge
              variant="outline"
              className={cn("text-[10px] font-medium mt-0.5 px-1.5 py-0", showColor.bg, showColor.text, showColor.border)}
              data-testid={`badge-show-${item.eventName?.replace(/\s+/g, '-')}-${item.id}`}
            >
              {item.eventName}
            </Badge>
          )}

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

          {(() => {
            const crew: any[] = item.crew && (item.crew as any[]).length > 0
              ? (item.crew as any[])
              : (item.crewNames || []).map((n: string) => ({ name: n }));
            if (crew.length === 0) return null;
            return (
              <div className="mt-1 space-y-0.5">
                {crew.map((member: any, idx: number) => (
                  <div key={`${member.name}-${idx}`} className="flex items-center gap-1 flex-wrap" data-testid={`crew-badge-${member.name.replace(/\s+/g, '-')}-${item.id}`}>
                    <Users className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground font-medium">{member.name}</span>
                    {member.position && (
                      <span className="text-[11px] text-muted-foreground">· {member.position}</span>
                    )}
                    {(member.departments || []).map((dept: string) => (
                      <Badge key={dept} variant="outline" className="text-[9px] px-1 py-0 leading-tight">{dept}</Badge>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}

          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
          )}
          <InlineComments scheduleId={item.id} />
        </div>
      </div>
    </div>
  );
}

export function SortableScheduleItem({ id, children }: { id: number; children: (dragHandleProps: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}
