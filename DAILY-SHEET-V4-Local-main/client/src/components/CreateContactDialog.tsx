import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { useCreateContact } from "@/hooks/use-contacts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { UserPlus, ChevronDown, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function CreateContactDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateContact();
  const { toast } = useToast();
  const { data: dbDepartments = [] } = useQuery<any[]>({ queryKey: ["/api/departments"] });
  const departmentOptions = useMemo(() => dbDepartments.map((d: any) => d.name), [dbDepartments]);

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "Crew",
      email: "",
      phone: "",
      notes: "",
      contactType: "crew",
    },
  });

  function onSubmit(data: InsertContact) {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
        toast({ title: "Contact Added", description: `${fullName} has been added to the list.` });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-display uppercase tracking-wide" data-testid="button-dashboard-add-contact">
          <UserPlus className="w-4 h-4" /> Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] font-body max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">Add Contact</DialogTitle>
          <DialogDescription className="sr-only">Add a new crew member or external contact</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} data-testid="input-contact-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} value={field.value || ""} data-testid="input-contact-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <div className="flex gap-1 rounded-lg border p-1" data-testid="toggle-contact-type">
                      {[
                        { value: "crew", label: "Crew" },
                        { value: "external", label: "External" },
                      ].map(opt => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={field.value === opt.value ? "default" : "ghost"}
                          size="sm"
                          onClick={() => field.onChange(opt.value)}
                          className="flex-1"
                          data-testid={`button-contact-type-${opt.value}`}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => {
                const selected = field.value ? field.value.split(",").map((r: string) => r.trim()).filter(Boolean) : [];
                const toggleDept = (dept: string) => {
                  const isSelected = selected.includes(dept);
                  let updated: string[];
                  if (isSelected) {
                    updated = selected.filter((d: string) => d !== dept);
                    if (updated.length === 0) return;
                  } else {
                    updated = [...selected, dept].sort();
                  }
                  field.onChange(updated.join(", "));
                };
                return (
                  <FormItem>
                    <FormLabel>Departments</FormLabel>
                    <FormControl>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal" data-testid="select-contact-role">
                            <span className="truncate text-left">
                              {selected.length > 0 ? selected.join(", ") : "Select departments..."}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto w-56">
                          {departmentOptions.map(dept => (
                            <DropdownMenuItem
                              key={dept}
                              onSelect={(e) => { e.preventDefault(); toggleDept(dept); }}
                            >
                              <div className="w-4 h-4 mr-2 flex items-center justify-center rounded border border-input shrink-0">
                                {selected.includes(dept) && <Check className="w-3 h-3" />}
                              </div>
                              {dept}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} value={field.value || ""} data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555-0123" {...field} value={field.value || ""} data-testid="input-contact-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Position / Details" {...field} value={field.value || ""} data-testid="input-contact-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-4" disabled={isPending} data-testid="button-save-contact">
              {isPending ? "Saving..." : "Save Contact"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
