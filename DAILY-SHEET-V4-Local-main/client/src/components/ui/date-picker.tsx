import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (dateISO: string) => void;
  compact?: boolean;
  clearable?: boolean;
  minDate?: string;
  maxDate?: string;
  "data-testid"?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function parseISO(value: string): { year: number; month: number; day: number } {
  if (!value) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }
  const [y, m, d] = value.split("-").map(Number);
  return { year: y || new Date().getFullYear(), month: (m || 1) - 1, day: d || 1 };
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function formatDisplay(value: string): string {
  if (!value) return "";
  const { year, month, day } = parseISO(value);
  return `${MONTHS[month]} ${day}, ${year}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampDate(iso: string, minDate?: string, maxDate?: string): string {
  if (!iso) return iso;
  if (minDate && iso < minDate) return minDate;
  if (maxDate && iso > maxDate) return maxDate;
  return iso;
}

function ScrollColumn({
  items,
  selected,
  onSelect,
  formatItem,
  testIdPrefix,
  disabledItems,
}: {
  items: (number | string)[];
  selected: number | string;
  onSelect: (val: any) => void;
  formatItem?: (val: any) => string;
  testIdPrefix?: string;
  disabledItems?: Set<number | string>;
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
      data-datepicker-column
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}
      onWheel={(e) => {
        e.stopPropagation();
        e.preventDefault();
        containerRef.current?.scrollBy({ top: e.deltaY });
      }}
    >
      {items.map((item) => {
        const isSelected = item === selected;
        const isDisabled = disabledItems?.has(item);
        const display = formatItem ? formatItem(item) : String(item);
        return (
          <button
            key={item}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => !isDisabled && onSelect(item)}
            disabled={isDisabled}
            className={cn(
              "px-3 py-2 text-sm rounded-md text-center transition-colors flex-shrink-0 touch-manipulation",
              isSelected
                ? "bg-primary text-primary-foreground font-semibold"
                : isDisabled
                  ? "text-muted-foreground/30 cursor-not-allowed"
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

export function DatePicker({ value, onChange, compact, clearable, minDate, maxDate, "data-testid": testId }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const { year, month, day } = parseISO(value);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const start = minDate ? parseISO(minDate).year : currentYear - 2;
    const end = maxDate ? parseISO(maxDate).year : currentYear + 5;
    const arr: number[] = [];
    for (let y = Math.min(start, currentYear - 2); y <= Math.max(end, currentYear + 5); y++) arr.push(y);
    return arr;
  }, [currentYear, minDate, maxDate]);

  const monthIndices = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  const maxDay = daysInMonth(year, month);
  const daysList = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  const handleChange = useCallback((y: number, m: number, d: number) => {
    const maxD = daysInMonth(y, m);
    const clampedDay = Math.min(d, maxD);
    const raw = toISO(y, m, clampedDay);
    const clamped = clampDate(raw, minDate, maxDate);
    onChange(clamped);
  }, [onChange, minDate, maxDate]);

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
            {!compact && <CalendarIcon className="mr-2 h-4 w-4" />}
            {value ? formatDisplay(value) : (compact ? "—" : "Pick a date")}
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
              items={monthIndices}
              selected={month}
              onSelect={(m) => handleChange(year, m, day)}
              formatItem={(m: number) => MONTHS[m]}
              testIdPrefix={testId ? `${testId}-month` : undefined}
            />
            <div className="w-px bg-border self-stretch" />
            <ScrollColumn
              items={daysList}
              selected={Math.min(day, maxDay)}
              onSelect={(d) => handleChange(year, month, d)}
              testIdPrefix={testId ? `${testId}-day` : undefined}
            />
            <div className="w-px bg-border self-stretch" />
            <ScrollColumn
              items={years}
              selected={year}
              onSelect={(y) => handleChange(y, month, day)}
              testIdPrefix={testId ? `${testId}-year` : undefined}
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
