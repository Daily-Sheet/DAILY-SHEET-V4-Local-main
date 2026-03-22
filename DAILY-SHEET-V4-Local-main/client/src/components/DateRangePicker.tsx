import { DatePicker } from "@/components/ui/date-picker";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeStart: (date: string) => void;
  onChangeEnd: (date: string) => void;
  testIdPrefix?: string;
  defaultMonth?: Date;
  label?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  testIdPrefix = "date-range",
  label = "Show Dates",
}: DateRangePickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Start</label>
          <DatePicker
            value={startDate}
            onChange={(v) => {
              onChangeStart(v);
              if (endDate && v > endDate) onChangeEnd(v);
            }}
            maxDate={endDate || undefined}
            data-testid={`${testIdPrefix}-start`}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">End</label>
          <DatePicker
            value={endDate}
            onChange={(v) => {
              onChangeEnd(v);
              if (startDate && v < startDate) onChangeStart(v);
            }}
            minDate={startDate || undefined}
            data-testid={`${testIdPrefix}-end`}
          />
        </div>
      </div>
    </div>
  );
}
