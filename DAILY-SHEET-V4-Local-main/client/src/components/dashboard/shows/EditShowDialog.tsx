import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event, Venue } from "@shared/schema";

export function EditShowDialog({
  open,
  onClose,
  show,
  venuesList,
}: {
  open: boolean;
  onClose: () => void;
  show: Event;
  venuesList: Venue[];
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
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
  }, [show, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/events/${show.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Show Updated" });
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
      endDate: values.endDate || null,
      venueId: values.venueId === "none" ? null : Number(values.venueId),
      notes: values.notes || null,
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
            <div className="grid grid-cols-2 gap-3">
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
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} rows={3} data-testid="input-edit-show-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
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
