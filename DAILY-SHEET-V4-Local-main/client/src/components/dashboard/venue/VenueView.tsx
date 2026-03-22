import { useState, useMemo, useRef } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { MapPin, Check, Pencil, Plus, ExternalLink, Search, Upload, FileText, Globe } from "lucide-react";
import { GoogleMapView } from "@/components/maps/GoogleMapView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCreateVenue } from "@/hooks/use-venue";
import { useQuery } from "@tanstack/react-query";
import type { Venue, Event, VenueTechPacket } from "@shared/schema";
import { PlacesAutocomplete } from "@/components/maps/PlacesAutocomplete";
import { CreateVenueDialog } from "@/components/dashboard/venue/VenueForm";

export function VenueMiniMap({ venue }: { venue: Venue }) {
  if (!venue.latitude || !venue.longitude) return null;
  const lat = typeof venue.latitude === "string" ? parseFloat(venue.latitude) : venue.latitude;
  const lng = typeof venue.longitude === "string" ? parseFloat(venue.longitude) : venue.longitude;
  if (isNaN(lat) || isNaN(lng)) return null;
  return (
    <div className="rounded-xl border border-border/30 overflow-hidden">
      <GoogleMapView
        center={{ lat, lng }}
        zoom={14}
        markers={[{ lat, lng, title: venue.name }]}
        height={200}
        interactive={false}
        data-testid={`venue-mini-map-${venue.id}`}
      />
    </div>
  );
}

export function TechPacketHistory({ venueId, canUpload }: { venueId: number; canUpload: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: packets = [] } = useQuery<VenueTechPacket[]>({
    queryKey: [`/api/venues/${venueId}/tech-packets`],
    queryFn: async () => {
      const res = await fetch(`/api/venues/${venueId}/tech-packets`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/venues/${venueId}/tech-packet`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${venueId}/tech-packets`] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Tech Packet Uploaded" });
    } catch (_err) {
      toast({ title: "Error", description: "Failed to upload tech packet.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tech Packets</span>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleUpload}
              data-testid={`input-tech-packet-upload-${venueId}`}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              data-testid={`button-upload-tech-packet-${venueId}`}
            >
              <Upload className="w-3 h-3" />
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </>
        )}
      </div>
      {packets.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No tech packets uploaded yet.</p>
      ) : (
        <div className="space-y-1">
          {packets.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline truncate flex-1"
                data-testid={`link-tech-packet-${p.id}`}
              >
                {p.originalName || "Tech Packet"}
              </a>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                {p.workspaceName && <><Globe className="w-2.5 h-2.5 inline mr-0.5" />{p.workspaceName} · </>}
                {p.uploadedAt ? format(new Date(p.uploadedAt), "MMM d, yyyy") : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VenueQuickSelect({ show, selectedDate, currentVenueId, venuesList, onEditShow }: { show: Event; selectedDate: string; currentVenueId: number | null; venuesList: Venue[]; onEditShow: () => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredVenues = useMemo(() => {
    if (!search.trim()) return venuesList;
    const q = search.toLowerCase();
    return venuesList.filter(v =>
      v.name.toLowerCase().includes(q) || (v.address ?? "").toLowerCase().includes(q)
    );
  }, [venuesList, search]);

  const setDayVenueMutation = useMutation({
    mutationFn: async (venueId: number) => {
      const res = await apiRequest("PUT", `/api/events/${show.id}/day-venues/${selectedDate}`, { venueId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      setOpen(false);
      toast({ title: "Venue Updated", description: `Venue changed for ${format(new Date(selectedDate + "T12:00:00"), "MMM d")}.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update venue.", variant: "destructive" });
    },
  });

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="mt-1 print:hidden" data-testid={`button-change-venue-${show.id}`}>
          <Pencil className="h-3 w-3 mr-1" /> Venue
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="end">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Change venue for this day</div>
        <div className="px-1 pb-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search venues..."
              className="h-7 pl-6 text-xs"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filteredVenues.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">No venues found</div>
          )}
          {filteredVenues.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setDayVenueMutation.mutate(v.id)}
              disabled={setDayVenueMutation.isPending}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover-elevate",
                v.id === currentVenueId && "bg-primary/10 font-medium"
              )}
              data-testid={`venue-option-${v.id}`}
            >
              {v.id === currentVenueId && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              {v.id !== currentVenueId && <span className="w-3.5 shrink-0" />}
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate">{v.name}</div>
                {v.address && <div className="text-[10px] text-muted-foreground truncate">{v.address}</div>}
              </div>
            </button>
          ))}
        </div>
        <div className="border-t space-y-0">
          <button
            type="button"
            onClick={() => { setOpen(false); setCreateDialogOpen(true); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover-elevate rounded-md"
            data-testid={`button-create-venue-from-quick-select-${show.id}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Create New Venue
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onEditShow(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover-elevate rounded-md"
            data-testid={`button-edit-show-from-venue-${show.id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Show Details
          </button>
        </div>
      </PopoverContent>
    </Popover>
    <CreateVenueDialog
      open={createDialogOpen}
      onOpenChange={setCreateDialogOpen}
      onCreated={(newVenue) => {
        setDayVenueMutation.mutate(newVenue.id);
      }}
    />
    </>
  );
}

export function DailySheetNoVenue({ show, canEdit, venuesList, selectedDate, projectName, projectDriveUrl, projectHref }: { show: Event | null; canEdit: boolean; venuesList: Venue[]; selectedDate: string; projectName?: string; projectDriveUrl?: string | null; projectHref?: string }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");
  const [newVenueLatitude, setNewVenueLatitude] = useState("");
  const [newVenueLongitude, setNewVenueLongitude] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createVenueMutation = useCreateVenue();

  const linkVenueMutation = useMutation({
    mutationFn: async ({ eventId, venueId }: { eventId: number; venueId: number }) => {
      const res = await apiRequest("PATCH", `/api/events/${eventId}`, { venueId, venueForAllDays: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-day-venues"] });
      toast({ title: "Venue Linked", description: "Venue has been linked to this show." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to link venue.", variant: "destructive" });
    },
  });

  const handleLinkExisting = (venueId: string) => {
    if (!show) return;
    linkVenueMutation.mutate({ eventId: show.id, venueId: parseInt(venueId) });
  };

  const handleCreateAndLink = () => {
    if (!show || !newVenueName.trim()) return;
    createVenueMutation.mutate(
      { name: newVenueName.trim(), address: newVenueAddress.trim() || "", latitude: newVenueLatitude || "", longitude: newVenueLongitude || "" },
      {
        onSuccess: (newVenue: Venue) => {
          linkVenueMutation.mutate({ eventId: show.id, venueId: newVenue.id });
          setNewVenueName("");
          setNewVenueAddress("");
          setNewVenueLatitude("");
          setNewVenueLongitude("");
          setShowCreateForm(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create venue.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Card className="bg-secondary text-secondary-foreground border-none shadow-md print:border print:shadow-none print:text-black print:bg-white">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              {projectName && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-accent truncate" data-testid="text-no-venue-project">{projectName}</span>
                  {projectDriveUrl && (
                    <a href={projectDriveUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 flex-shrink-0" data-testid="link-drive-no-venue" title="Open Google Drive">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
              <div className="text-sm sm:text-base font-display uppercase tracking-wide text-secondary-foreground/50 flex items-center gap-1.5" data-testid="text-daily-venue-not-set">
                {show?.name && <span className="font-bold text-secondary-foreground">{show.name}</span>}
                {show?.name && projectHref && (
                  <Link href={projectHref} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 print:hidden" data-testid={`link-edit-show-novenue-${show.id}`}>
                    <Pencil className="w-3 h-3 text-secondary-foreground" />
                  </Link>
                )}
                {show?.name && <span className="mx-1.5 opacity-50">|</span>}
                Venue Not Set
              </div>
              {!canEdit && (
                <p className="text-xs text-secondary-foreground/40">An admin can link a venue to this show.</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-display font-bold text-yellow-400 print:text-black leading-none">
              {format(new Date(selectedDate + "T12:00:00"), "d")}
            </div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">
              {format(new Date(selectedDate + "T12:00:00"), "MMM")}
            </div>
          </div>
        </div>

        {canEdit && show && (
          <div className="mt-3 pt-3 border-t border-secondary-foreground/10 print:hidden">
            {!showCreateForm ? (
              <div className="space-y-2">
                <p className="text-xs text-secondary-foreground/60 mb-1">Link a venue to this show:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {venuesList.length > 0 && (
                    <Select onValueChange={handleLinkExisting} disabled={linkVenueMutation.isPending} data-testid="select-link-venue">
                      <SelectTrigger className="w-[200px] bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground" data-testid="select-link-venue-trigger">
                        <SelectValue placeholder="Select existing venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venuesList.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)} data-testid={`select-venue-option-${v.id}`}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className="border-secondary-foreground/20 text-secondary-foreground"
                    data-testid="button-create-new-venue"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> New Venue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-secondary-foreground/60 mb-1">Create a new venue:</p>
                <Input
                  placeholder="Venue name"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40"
                  data-testid="input-new-venue-name"
                />
                <PlacesAutocomplete
                  value={newVenueAddress}
                  onChange={setNewVenueAddress}
                  onPlaceSelect={(place) => {
                    setNewVenueAddress(place.address);
                    setNewVenueLatitude(place.lat);
                    setNewVenueLongitude(place.lng);
                    if (place.name && !newVenueName.trim()) {
                      setNewVenueName(place.name);
                    }
                  }}
                  placeholder="Search for a venue or address..."
                  data-testid="input-new-venue-address"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateAndLink}
                    disabled={!newVenueName.trim() || createVenueMutation.isPending || linkVenueMutation.isPending}
                    data-testid="button-save-new-venue"
                  >
                    {createVenueMutation.isPending || linkVenueMutation.isPending ? "Saving..." : "Create & Link"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowCreateForm(false); setNewVenueName(""); setNewVenueAddress(""); setNewVenueLatitude(""); setNewVenueLongitude(""); }}
                    className="text-secondary-foreground/60"
                    data-testid="button-cancel-new-venue"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
