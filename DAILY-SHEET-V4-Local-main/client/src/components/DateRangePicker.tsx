import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeStart: (date: string) => void;
  onChangeEnd: (date: string) => void;
  testIdPrefix?: string;
  defaultMonth?: Date;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  testIdPrefix = "date-range",
  defaultMonth: defaultMonthProp,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalRange, setInternalRange] = useState<DateRange | undefined>(undefined);

  const from = startDate ? new Date(startDate + "T12:00:00") : undefined;
  const to = endDate ? new Date(endDate + "T12:00:00") : undefined;

  useEffect(() => {
    if (open) {
      setInternalRange(from || to ? { from, to } : undefined);
    }
  }, [open]);

  const displayText = () => {
    if (from && to) {
      if (startDate === endDate) {
        return format(from, "MMM d, yyyy");
      }
      return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
    }
    if (from) {
      return `${format(from, "MMM d, yyyy")} - pick end date`;
    }
    return "Pick dates";
  };

  const handleSelect = (range: DateRange | undefined) => {
    setInternalRange(range);

    if (!range?.from) return;

    const newStart = format(range.from, "yyyy-MM-dd");
    onChangeStart(newStart);

    if (range.to) {
      const newEnd = format(range.to, "yyyy-MM-dd");
      onChangeEnd(newEnd);
      setOpen(false);
    } else {
      onChangeEnd(newStart);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">Show Dates</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !from && "text-muted-foreground"
            )}
            data-testid={`${testIdPrefix}-trigger`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={internalRange}
            onSelect={handleSelect}
            numberOfMonths={1}
            initialFocus
            defaultMonth={from || defaultMonthProp}
            captionLayout="dropdown-buttons"
            fromYear={2020}
            toYear={new Date().getFullYear() + 5}
            classNames={{
              caption: "flex justify-between pt-1 items-center gap-1 px-1",
              caption_label: "hidden",
              caption_dropdowns: "flex gap-1 items-center",
              dropdown_month: "text-sm",
              dropdown_year: "text-sm",
              dropdown: "border rounded-md px-1 py-0.5 text-sm bg-background",
              vhidden: "sr-only",
              nav: "flex items-center gap-1",
              nav_button_previous: "",
              nav_button_next: "",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-yellow-200/50 dark:[&:has([aria-selected].day-outside)]:bg-yellow-600/20 [&:has([aria-selected])]:bg-yellow-200 dark:[&:has([aria-selected])]:bg-yellow-600/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day_range_middle:
                "aria-selected:bg-yellow-200 aria-selected:text-yellow-900 dark:aria-selected:bg-yellow-600/40 dark:aria-selected:text-yellow-100",
              day_selected:
                "bg-yellow-400 text-yellow-950 hover:bg-yellow-400 hover:text-yellow-950 focus:bg-yellow-400 focus:text-yellow-950",
              day_range_end: "day-range-end",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
