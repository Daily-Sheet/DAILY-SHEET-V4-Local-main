import { format, parseISO, differenceInDays } from "date-fns";
import { Users, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventTileProps = {
  event: {
    id: number;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
    color?: { dot: string };
  };
  crew?: number;
  scheduleItems?: number;
  onClick?: () => void;
  showDetails?: boolean; // If true, show crew/schedule info
};

export function EventTile({ event, crew, scheduleItems, onClick, showDetails = true }: EventTileProps) {
  let dateDisplay = null;
  if (event.startDate && event.endDate) {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);
    const days = differenceInDays(end, start) + 1;
    if (days === 1) {
      dateDisplay = (
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {format(start, "MMM d, yyyy")}
        </p>
      );
    } else {
      dateDisplay = (
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {format(start, "MMM d")} – {format(end, "MMM d, yyyy")} · {days}d
        </p>
      );
    }
  }
  return (
    <div
      className={cn(
        "px-4 py-3 flex items-start gap-2.5 cursor-pointer hover:bg-muted/40 transition-colors rounded-xl",
        onClick && "active:bg-muted/60"
      )}
      onClick={onClick}
      tabIndex={0}
      role={onClick ? "button" : undefined}
    >
      <div className={cn("w-2.5 h-2.5 rounded-full mt-[3px] flex-shrink-0", event.color?.dot || "bg-primary")} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate">{event.name}</p>
        {dateDisplay}
        {showDetails && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />{crew} crew
            </span>
            {scheduleItems && scheduleItems > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{scheduleItems} item{scheduleItems !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>
      {onClick && (
        <span className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
}
