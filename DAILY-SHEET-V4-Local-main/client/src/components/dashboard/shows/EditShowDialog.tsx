import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event, Venue } from "@shared/schema";

export function EditShowDialog({
  open,
  onClose,
  show,
  venuesList,
  canDelete = false,
}: {
  open: boolean;
  onClose: () => void;
  show: Event;
  venuesList: Venue[];
  canDelete?: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [venueForAllDays, setVenueForAllDays] = useState(false);
  const form = useForm({
    defaultValues: {
      name: show.name,
      startDate: show.startDate || "",
      endDate: show.endDate || "",
      venueId: show.venueId ? String(show.venueId) : "none",
      notes: show.notes || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: show.name,
      startDate: show.startDate || "",
      endDate: show.endDate || "",
      venueId: show.venueId ? String(show.venueId) : "none",
      notes: show.notes || "",
    });
    setVenueForAllDays(false);
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

  const watchedVenueId = form.watch("venueId");
  const watchedStartDate = form.watch("startDate");
  const watchedEndDate = form.watch("endDate");
  const isMultiDay = !!watchedStartDate && !!watchedEndDate && watchedStartDate !== watchedEndDate;
  const showAllDaysOption = watchedVenueId !== "none" && isMultiDay;

  const onSubmit = (values: any) => {
    const payload: any = {
      name: values.name.trim(),
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      venueId: values.venueId === "none" ? null : Number(values.venueId),
      notes: values.notes || null,
      ...(venueForAllDays && { venueForAllDays: true }),
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
                      maxDate={form.watch("endDate") || undefined}
                      data-testid="input-edit-show-start"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const startDate = form.getValues("startDate");
                        if (startDate && v && v < startDate) form.setValue("startDate", v);
                      }}
                      minDate={form.watch("startDate") || undefined}
                      data-testid="input-edit-show-end"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="venueId" render={({ field }) => (
              <FormItem>
                <FormLabel>Venue</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-show-venue">
                      <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No venue</SelectItem>
                    {venuesList.map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {showAllDaysOption && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="venueForAllDays"
                  checked={venueForAllDays}
                  onCheckedChange={(v) => setVenueForAllDays(!!v)}
                  data-testid="checkbox-venue-for-all-days"
                />
                <label htmlFor="venueForAllDays" className="text-sm cursor-pointer select-none">
                  Apply this venue to all days
                </label>
              </div>
            )}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} rows={3} data-testid="input-edit-show-notes" /></FormControl>
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
