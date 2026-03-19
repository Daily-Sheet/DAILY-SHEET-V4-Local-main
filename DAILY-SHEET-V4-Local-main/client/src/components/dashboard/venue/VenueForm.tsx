import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Loader2, FileText, Eye, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateVenue } from "@/hooks/use-venue";
import { insertVenueSchema, type InsertVenue, type Venue } from "@shared/schema";

// ── Shared VenueForm ────────────────────────────────────────────────────────

export function VenueForm({
  venue,
  onSave,
  onCancel,
  isPending,
}: {
  venue?: Venue;
  onSave: (data: InsertVenue) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { toast } = useToast();
  const [isParsingTechPacket, setIsParsingTechPacket] = useState(false);
  const techPacketFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<InsertVenue>({
    resolver: zodResolver(insertVenueSchema),
    defaultValues: {
      name: venue?.name || "",
      address: venue?.address || "",
      contactName: venue?.contactName || "",
      contactPhone: venue?.contactPhone || "",
      wifiSsid: venue?.wifiSsid || "",
      wifiPassword: venue?.wifiPassword || "",
      notes: venue?.notes || "",
      parking: venue?.parking || "",
      loadIn: venue?.loadIn || "",
      capacity: venue?.capacity || "",
      dressingRooms: venue?.dressingRooms || false,
      dressingRoomsNotes: venue?.dressingRoomsNotes || "",
      showers: venue?.showers || false,
      showersNotes: venue?.showersNotes || "",
      laundry: venue?.laundry || false,
      laundryNotes: venue?.laundryNotes || "",
      meals: venue?.meals || "",
      mealsNotes: venue?.mealsNotes || "",
      techPacketUrl: venue?.techPacketUrl || "",
    },
  });

  async function handleTechPacketUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingTechPacket(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/venues/parse-tech-packet", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to parse");
      }

      const data = await res.json();

      if (data.name) form.setValue("name", data.name);
      if (data.address) form.setValue("address", data.address);
      if (data.contactName) form.setValue("contactName", data.contactName);
      if (data.contactPhone) form.setValue("contactPhone", data.contactPhone);
      if (data.wifiSsid) form.setValue("wifiSsid", data.wifiSsid);
      if (data.wifiPassword) form.setValue("wifiPassword", data.wifiPassword);
      if (data.parking) form.setValue("parking", data.parking);
      if (data.loadIn) form.setValue("loadIn", data.loadIn);
      if (data.capacity) form.setValue("capacity", data.capacity);
      if (data.dressingRooms != null) form.setValue("dressingRooms", data.dressingRooms);
      if (data.dressingRoomsNotes) form.setValue("dressingRoomsNotes", data.dressingRoomsNotes);
      if (data.showers != null) form.setValue("showers", data.showers);
      if (data.showersNotes) form.setValue("showersNotes", data.showersNotes);
      if (data.laundry != null) form.setValue("laundry", data.laundry);
      if (data.laundryNotes) form.setValue("laundryNotes", data.laundryNotes);
      if (data.meals) form.setValue("meals", data.meals);
      if (data.mealsNotes) form.setValue("mealsNotes", data.mealsNotes);
      if (data.notes) form.setValue("notes", data.notes);
      if (data.techPacketUrl) form.setValue("techPacketUrl", data.techPacketUrl);

      toast({ title: "Tech packet parsed!", description: "Venue details have been filled in. Review and save." });
    } catch (err: any) {
      toast({ title: "Parse failed", description: err.message || "Could not extract venue info", variant: "destructive" });
    } finally {
      setIsParsingTechPacket(false);
      if (techPacketFileRef.current) techPacketFileRef.current.value = "";
    }
  }

  const watchDressingRooms = form.watch("dressingRooms");
  const watchShowers = form.watch("showers");
  const watchLaundry = form.watch("laundry");
  const watchMeals = form.watch("meals");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
          <input
            type="file"
            ref={techPacketFileRef}
            onChange={handleTechPacketUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            data-testid="input-tech-packet-file"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => techPacketFileRef.current?.click()}
            disabled={isParsingTechPacket}
            data-testid="button-upload-tech-packet"
          >
            {isParsingTechPacket ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Parsing...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Parse Tech Packet</>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Upload a PDF or image of the venue tech packet to auto-fill details
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl><Input placeholder="e.g. The Grand Theater" {...field} data-testid="input-venue-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl><Input placeholder="Street, City, State, ZIP" {...field} data-testid="input-venue-address" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="contactName" render={({ field }) => (
            <FormItem>
              <FormLabel>Production Contact</FormLabel>
              <FormControl><Input placeholder="Name" {...field} value={field.value || ""} data-testid="input-venue-contact-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="contactPhone" render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl><Input placeholder="Phone number" {...field} value={field.value || ""} data-testid="input-venue-contact-phone" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="wifiSsid" render={({ field }) => (
            <FormItem>
              <FormLabel>Wi-Fi Network (SSID)</FormLabel>
              <FormControl><Input placeholder="Network name" {...field} value={field.value || ""} data-testid="input-venue-wifi-ssid" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="wifiPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Wi-Fi Password</FormLabel>
              <FormControl><Input placeholder="Password" {...field} value={field.value || ""} data-testid="input-venue-wifi-password" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="parking" render={({ field }) => (
            <FormItem>
              <FormLabel>Parking</FormLabel>
              <FormControl><Input placeholder="Parking details" {...field} value={field.value || ""} data-testid="input-venue-parking" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="loadIn" render={({ field }) => (
            <FormItem>
              <FormLabel>Load In</FormLabel>
              <FormControl><Input placeholder="Load-in details" {...field} value={field.value || ""} data-testid="input-venue-load-in" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="capacity" render={({ field }) => (
          <FormItem>
            <FormLabel>Capacity</FormLabel>
            <FormControl><Input placeholder="e.g. 500, 1200 seated" {...field} value={field.value || ""} data-testid="input-venue-capacity" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Separator />

        <div className="space-y-3">
          <FormField control={form.control} name="dressingRooms" render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} data-testid="checkbox-venue-dressing-rooms" />
                </FormControl>
                <FormLabel className="cursor-pointer">Dressing Rooms</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )} />
          {watchDressingRooms && (
            <FormField control={form.control} name="dressingRoomsNotes" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="Dressing room details..." {...field} value={field.value || ""} data-testid="input-venue-dressing-rooms-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormField control={form.control} name="showers" render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} data-testid="checkbox-venue-showers" />
                </FormControl>
                <FormLabel className="cursor-pointer">Showers</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )} />
          {watchShowers && (
            <FormField control={form.control} name="showersNotes" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="Shower details..." {...field} value={field.value || ""} data-testid="input-venue-showers-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormField control={form.control} name="laundry" render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} data-testid="checkbox-venue-laundry" />
                </FormControl>
                <FormLabel className="cursor-pointer">Laundry</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )} />
          {watchLaundry && (
            <FormField control={form.control} name="laundryNotes" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="Laundry details..." {...field} value={field.value || ""} data-testid="input-venue-laundry-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        <Separator />

        <FormField control={form.control} name="meals" render={({ field }) => (
          <FormItem>
            <FormLabel>Meals</FormLabel>
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger data-testid="select-venue-meals-trigger">
                  <SelectValue placeholder="Select meal arrangement" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No meals</SelectItem>
                <SelectItem value="client_provided">Client Provided</SelectItem>
                <SelectItem value="walkaway">Walkaway</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        {watchMeals && watchMeals !== "none" && (
          <FormField control={form.control} name="mealsNotes" render={({ field }) => (
            <FormItem>
              <FormControl><Input placeholder="Meal details..." {...field} value={field.value || ""} data-testid="input-venue-meals-notes" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Internal Notes</FormLabel>
            <FormControl><Textarea placeholder="Additional notes" {...field} value={field.value || ""} className="min-h-[100px]" data-testid="input-venue-notes" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <input type="hidden" {...form.register("techPacketUrl")} />

        {form.watch("techPacketUrl") && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Tech packet attached</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => window.open(form.getValues("techPacketUrl")!, "_blank")} data-testid="button-preview-tech-packet">
              <Eye className="mr-1 h-3 w-3" /> View
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-venue">
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-venue">
            <Save className="mr-2 h-4 w-4" /> {venue ? "Save Changes" : "Add Venue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ── CreateVenueDialog ────────────────────────────────────────────────────────

export function CreateVenueDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (venue: Venue) => void;
}) {
  const { toast } = useToast();
  const { mutate: createVenue, isPending } = useCreateVenue();

  const handleSave = (data: InsertVenue) => {
    createVenue(data as any, {
      onSuccess: (newVenue: any) => {
        toast({ title: "Venue created" });
        onOpenChange(false);
        onCreated(newVenue);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Create New Venue</DialogTitle>
          <DialogDescription>Fill in venue details. Upload a tech packet to auto-fill.</DialogDescription>
        </DialogHeader>
        <VenueForm
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
