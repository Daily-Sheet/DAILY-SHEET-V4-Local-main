import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Trash2, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DAY_TYPES, EVENT_TYPE_COLORS } from "@shared/constants";
import type { Event } from "@shared/schema";

export function EditShowDialog({
  open,
  onClose,
  show,
  canDelete = false,
}: {
  open: boolean;
  onClose: () => void;
  show: Event;
  canDelete?: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: allEvents = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const [tagOpen, setTagOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const existingTags = useMemo(() => {
    const tags = new Set<string>();
    for (const ev of allEvents) {
      if (ev.tag) tags.add(ev.tag);
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [allEvents]);

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return existingTags;
    const q = tagSearch.toLowerCase();
    return existingTags.filter(t => t.toLowerCase().includes(q));
  }, [existingTags, tagSearch]);

  const form = useForm({
    defaultValues: {
      name: show.name,
      startDate: show.startDate || "",
      endDate: show.endDate || "",
      notes: show.notes || "",
      tag: show.tag || "",
      eventType: (show as any).eventType || "show",
    },
  });

  useEffect(() => {
    form.reset({
      name: show.name,
      startDate: show.startDate || "",
      endDate: show.endDate || "",
      notes: show.notes || "",
      tag: show.tag || "",
      eventType: (show as any).eventType || "show",
    });
  }, [show, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/events/${show.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: "Show Updated" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/events/${show.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      qc.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: "Show Deleted" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: any) => {
    const payload: any = {
      name: values.name.trim(),
      startDate: values.startDate || null,
      endDate: values.endDate || values.startDate || null,
      notes: values.notes || null,
      tag: values.tag?.trim() || null,
      eventType: values.eventType || "show",
    };
    updateMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Edit Show</DialogTitle>
          <DialogDescription>Update show details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} data-testid="input-edit-show-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const endDate = form.getValues("endDate");
                        if (endDate && v && endDate < v) form.setValue("endDate", v);
                      }}
                      data-testid="input-edit-show-start"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date <span className="text-muted-foreground/60 text-xs font-normal">(blank = single day)</span></FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const startDate = form.getValues("startDate");
                        if (!startDate || (v && v < startDate)) form.setValue("startDate", v);
                      }}
                      data-testid="input-edit-show-end"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} rows={3} data-testid="input-edit-show-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="eventType" render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_TYPES.filter(t => t.value !== "travel").map(t => {
                    const colors = EVENT_TYPE_COLORS[t.value];
                    const isActive = field.value === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => field.onChange(t.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                          isActive
                            ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder}`
                            : `${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tag" render={({ field }) => (
              <FormItem>
                <FormLabel>Tag</FormLabel>
                <div className="flex items-center gap-1.5">
                  <Popover open={tagOpen} onOpenChange={(v) => { setTagOpen(v); if (!v) setTagSearch(""); }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        type="button"
                        className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                        data-testid="input-edit-show-tag"
                      >
                        <span className="truncate">{field.value || "Select or type a tag..."}</span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <div className="p-2">
                        <Input
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          placeholder="Search or type new tag..."
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && tagSearch.trim()) {
                              e.preventDefault();
                              field.onChange(tagSearch.trim());
                              setTagOpen(false);
                              setTagSearch("");
                            }
                          }}
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto p-1">
                        {tagSearch.trim() && !existingTags.some(t => t.toLowerCase() === tagSearch.trim().toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => { field.onChange(tagSearch.trim()); setTagOpen(false); setTagSearch(""); }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer text-primary"
                          >
                            + Create "{tagSearch.trim()}"
                          </button>
                        )}
                        {filteredTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => { field.onChange(tag); setTagOpen(false); setTagSearch(""); }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                              tag === field.value && "bg-accent/50 font-medium"
                            )}
                          >
                            {tag === field.value ? <Check className="h-3.5 w-3.5 text-primary shrink-0" /> : <span className="w-3.5 shrink-0" />}
                            <span className="truncate">{tag}</span>
                          </button>
                        ))}
                        {filteredTags.length === 0 && !tagSearch.trim() && (
                          <div className="py-3 text-center text-sm text-muted-foreground">No tags yet — type to create one</div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {field.value && (
                    <button
                      type="button"
                      onClick={() => field.onChange("")}
                      className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear tag"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="flex-row items-center gap-2">
              {canDelete && (
                <ConfirmDelete
                  title="Delete Show?"
                  description={`This will permanently delete "${show.name}" and all its schedule items. This cannot be undone.`}
                  onConfirm={() => deleteMutation.mutate()}
                  triggerLabel={<><Trash2 className="w-3.5 h-3.5" /> Delete</>}
                  triggerVariant="outline"
                  triggerSize="sm"
                  triggerClassName="mr-auto gap-1.5 text-destructive border-destructive/30"
                  data-testid="button-delete-show"
                />
              )}
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-edit-show">
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
