import { useRef, useMemo } from "react";
import { format, addDays, parseISO, isToday, startOfWeek, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColorScheme } from "@/components/ColorSchemeProvider";
import type { Event } from "@shared/schema";

export function DayNavigator({
  dates,
  selectedDate,
  onSelectDate,
  events = [],
}: {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  events?: Event[];
}) {
  const { buildColorMap } = useColorScheme();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const eventDateSet = useMemo(() => new Set(dates), [dates]);

  const colorMap = useMemo(() => {
    return buildColorMap(events.map(ev => ev.name));
  }, [events, buildColorMap]);

  const eventsOnDate = useMemo(() => {
    const map = new Map<string, string[]>();
    events.forEach(ev => {
      if (!ev.startDate || !ev.endDate) return;
      const start = parseISO(ev.startDate);
      const end = parseISO(ev.endDate);
      const days = eachDayOfInterval({ start, end });
      days.forEach(d => {
        const ds = format(d, "yyyy-MM-dd");
        const existing = map.get(ds) || [];
        existing.push(ev.name);
        map.set(ds, existing);
      });
    });
    return map;
  }, [events]);

  const selectedParsed = parseISO(selectedDate);
  const weekStart = startOfWeek(selectedParsed, { weekStartsOn: 0 });
  const weekDays = useMemo(() =>
    eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }).map(d => format(d, "yyyy-MM-dd")),
    [weekStart.toISOString()]
  );

  const goToPrevWeek = () => {
    onSelectDate(format(addDays(weekStart, -7), "yyyy-MM-dd"));
  };

  const goToNextWeek = () => {
    onSelectDate(format(addDays(weekStart, 7), "yyyy-MM-dd"));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      // Short swipe (< 120px) = one day; longer swipe = one week
      const isLongSwipe = Math.abs(deltaX) > 120;
      if (deltaX < 0) {
        isLongSwipe ? goToNextWeek() : onSelectDate(format(addDays(selectedParsed, 1), "yyyy-MM-dd"));
      } else {
        isLongSwipe ? goToPrevWeek() : onSelectDate(format(addDays(selectedParsed, -1), "yyyy-MM-dd"));
      }
    }
  };

  const weekLabel = (() => {
    const ws = parseISO(weekDays[0]);
    const we = parseISO(weekDays[6]);
    if (ws.getMonth() === we.getMonth()) {
      return format(ws, "MMMM yyyy");
    }
    return `${format(ws, "MMM")} – ${format(we, "MMM yyyy")}`;
  })();

  return (
    <div
      className="print:hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="day-navigator"
    >
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase" data-testid="text-week-label">
          {weekLabel}
        </span>
        <div className="flex items-center gap-2">
          {selectedDate !== format(new Date(), "yyyy-MM-dd") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectDate(format(new Date(), "yyyy-MM-dd"))}
              data-testid="button-go-today"
            >
              Today
            </Button>
          )}
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Swipe · ←/→ keys
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={goToPrevWeek}
          data-testid="button-prev-week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((date) => {
              const d = parseISO(date);
              const isSelected = date === selectedDate;
              const today = isToday(d);
              const hasEvent = eventDateSet.has(date);
              return (
                <button
                  key={date}
                  onClick={() => onSelectDate(date)}
                  className={cn(
                    "flex flex-col items-center py-1.5 sm:py-2 rounded-lg transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover-elevate",
                  )}
                  data-testid={`button-day-${date}`}
                >
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-medium opacity-80">
                    {format(d, "EEE")}
                  </span>
                  <span className={cn(
                    "text-base sm:text-lg font-bold font-display",
                    !isSelected && today && "font-extrabold",
                  )}>
                    {format(d, "d")}
                  </span>
                  {today && !isSelected && (
                    <div className="w-4 h-0.5 rounded-full bg-primary" />
                  )}
                  <div className="flex items-center gap-0.5 mt-0.5 h-2">
                    {(() => {
                      const showsOnDay = eventsOnDate.get(date) || [];
                      if (showsOnDay.length > 0) {
                        return showsOnDay.slice(0, 4).map((name, idx) => {
                          const c = colorMap.get(name);
                          return (
                            <div
                              key={`${name}-${idx}`}
                              className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground" : (c?.dot || "bg-primary"))}
                              title={name}
                            />
                          );
                        });
                      }
                      return null;
                    })()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={goToNextWeek}
          data-testid="button-next-week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
