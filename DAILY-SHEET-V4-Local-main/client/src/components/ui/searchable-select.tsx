import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";

// ── SearchableSelect (single value) ─────────────────────────────────────────

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  className,
  triggerClassName,
  "data-testid": testId,
  children,
}: {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  "data-testid"?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? "").toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", triggerClassName)}
          data-testid={testId}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", className)} align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-7 text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto px-1 pb-1">
          {filtered.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          )}
          {filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onValueChange(opt.value);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                opt.value === value && "bg-accent/50 font-medium"
              )}
            >
              {opt.value === value ? (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate">{opt.label}</div>
                {opt.sublabel && <div className="text-[10px] text-muted-foreground truncate">{opt.sublabel}</div>}
              </div>
            </button>
          ))}
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── SearchableMultiSelect (checkbox multi-select with search) ────────────────

export interface SearchableMultiOption {
  id: string;
  label: string;
  sublabel?: string;
}

export function SearchableMultiSelect({
  options,
  selected,
  onToggle,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  className,
  triggerClassName,
  "data-testid": testId,
}: {
  options: SearchableMultiOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  "data-testid"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? "").toLowerCase().includes(q)
    );
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", triggerClassName)}
          data-testid={testId}
        >
          <span className="text-muted-foreground truncate">
            {selected.size === 0 ? placeholder : `${selected.size} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", className)} align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-7 text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto px-1 pb-1">
          {filtered.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          )}
          {filtered.map((opt) => {
            const isSelected = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <div
                  className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <span className="font-medium">{opt.label}</span>
                  {opt.sublabel && <span className="text-muted-foreground ml-1.5 text-xs">{opt.sublabel}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
