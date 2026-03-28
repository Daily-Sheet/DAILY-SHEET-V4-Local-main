import { useState, useRef, useCallback } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

interface DatePickerProps {
  value: string;
  onChange: (dateISO: string) => void;
  compact?: boolean;
  clearable?: boolean;
  minDate?: string;
  maxDate?: string;
  "data-testid"?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDate(iso: string): Date {
  if (!iso) return new Date();
  return new Date(iso + "T00:00:00");
}

function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function formatDisplay(value: string): string {
  if (!value) return "";
  return format(toDate(value), "MMM d, yyyy");
}

export function DatePicker({ value, onChange, compact, clearable, minDate, maxDate, "data-testid": testId }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? toDate(value) : null;
  const [viewMonth, setViewMonth] = useState(() => selectedDate || new Date());

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goToPrev = useCallback(() => setViewMonth(m => subMonths(m, 1)), []);
  const goToNext = useCallback(() => setViewMonth(m => addMonths(m, 1)), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      // Horizontal swipe: left = next, right = prev
      dx < 0 ? goToNext() : goToPrev();
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) {
      // Vertical swipe: down = next, up = prev
      dy > 0 ? goToNext() : goToPrev();
    }
  }, [goToNext, goToPrev]);

  const handleSelect = useCallback((d: Date) => {
    let iso = toISO(d);
    if (minDate && iso < minDate) iso = minDate;
    if (maxDate && iso > maxDate) iso = maxDate;
    onChange(iso);
    setOpen(false);
  }, [onChange, minDate, maxDate]);

  // Build calendar grid
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="flex items-center gap-0.5">
      <Popover open={open} onOpenChange={(v) => {
        setOpen(v);
        if (v && selectedDate) setViewMonth(selectedDate);
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={cn(
              "justify-start text-left font-normal flex-1",
              compact ? "h-8 text-xs px-2" : "w-full",
              !value && "text-muted-foreground"
            )}
            data-testid={testId}
          >
            {!compact && <CalendarIcon className="mr-2 h-4 w-4" />}
            {value ? formatDisplay(value) : (compact ? "—" : "Pick a date")}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "none" }}
          >
            {/* Month/year header with nav arrows */}
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={goToPrev} className="p-1 rounded-md hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold">{format(viewMonth, "MMMM yyyy")}</span>
              <button type="button" onClick={goToNext} className="p-1 rounded-md hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7">
              {days.map(d => {
                const iso = toISO(d);
                const inMonth = isSameMonth(d, viewMonth);
                const selected = selectedDate && isSameDay(d, selectedDate);
                const today = isToday(d);
                const disabled = (minDate && iso < minDate) || (maxDate && iso > maxDate);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => !disabled && handleSelect(d)}
                    disabled={!!disabled}
                    className={cn(
                      "h-8 w-8 mx-auto rounded-md text-xs font-medium transition-colors touch-manipulation",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : today
                          ? "bg-accent text-accent-foreground"
                          : inMonth
                            ? "hover:bg-muted active:bg-muted"
                            : "text-muted-foreground/40 hover:bg-muted/50",
                      disabled && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            {/* Today shortcut */}
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => { setViewMonth(new Date()); handleSelect(new Date()); }}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Today
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(""); }}
          className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          data-testid={testId ? `${testId}-clear` : undefined}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  );
}
