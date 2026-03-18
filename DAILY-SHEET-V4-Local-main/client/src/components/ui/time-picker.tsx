import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (time24: string) => void;
  compact?: boolean;
  clearable?: boolean;
  "data-testid"?: string;
}

function parse24(value: string): { hour: number; minute: number; period: "AM" | "PM" } {
  if (!value) return { hour: 12, minute: 0, period: "AM" };
  const [h, m] = value.split(":").map(Number);
  const hour24 = isNaN(h) ? 0 : h;
  const minute = isNaN(m) ? 0 : m;
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour: hour12, minute, period };
}

function to24(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h = hour12;
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function formatDisplay(value: string): string {
  if (!value) return "";
  const { hour, minute, period } = parse24(value);
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const PERIODS: ("AM" | "PM")[] = ["AM", "PM"];

function ScrollColumn({
  items,
  selected,
  onSelect,
  formatItem,
  testIdPrefix,
}: {
  items: (number | string)[];
  selected: number | string;
  onSelect: (val: any) => void;
  formatItem?: (val: any) => string;
  testIdPrefix?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = selectedRef.current;
      const offsetTop = el.offsetTop - container.offsetTop;
      container.scrollTo({ top: offsetTop - container.clientHeight / 2 + el.clientHeight / 2, behavior: "instant" });
    }
  }, [selected]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouch = (e: TouchEvent) => {
      e.stopPropagation();
    };
    el.addEventListener("touchstart", onTouch, { passive: true });
    el.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouch);
      el.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-y-auto h-48 px-1"
      data-timepicker-column
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}
    >
      {items.map((item) => {
        const isSelected = item === selected;
        const display = formatItem ? formatItem(item) : String(item);
        return (
          <button
            key={item}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "px-3 py-2 text-sm rounded-md text-center transition-colors flex-shrink-0 touch-manipulation",
              isSelected
                ? "bg-primary text-primary-foreground font-semibold"
                : "hover:bg-muted/50 active:bg-muted"
            )}
            data-testid={testIdPrefix ? `${testIdPrefix}-${item}` : undefined}
          >
            {display}
          </button>
        );
      })}
    </div>
  );
}

export function TimePicker({ value, onChange, compact, clearable, "data-testid": testId }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const { hour, minute, period } = parse24(value);

  const handleChange = useCallback((h: number, m: number, p: "AM" | "PM") => {
    onChange(to24(h, m, p));
  }, [onChange]);

  return (
    <div className="flex items-center gap-0.5">
      <Popover open={open} onOpenChange={setOpen}>
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
            {!compact && <Clock className="mr-2 h-4 w-4" />}
            {value ? formatDisplay(value) : (compact ? "—" : "Pick a time")}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex gap-1">
            <ScrollColumn
              items={HOURS}
              selected={hour}
              onSelect={(h) => handleChange(h, minute, period)}
              formatItem={(h) => String(h)}
              testIdPrefix={testId ? `${testId}-hour` : undefined}
            />
            <div className="w-px bg-border self-stretch" />
            <ScrollColumn
              items={MINUTES}
              selected={minute}
              onSelect={(m) => handleChange(hour, m, period)}
              formatItem={(m: number) => m.toString().padStart(2, "0")}
              testIdPrefix={testId ? `${testId}-min` : undefined}
            />
            <div className="w-px bg-border self-stretch" />
            <ScrollColumn
              items={PERIODS}
              selected={period}
              onSelect={(p) => handleChange(hour, minute, p)}
              testIdPrefix={testId ? `${testId}-period` : undefined}
            />
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
