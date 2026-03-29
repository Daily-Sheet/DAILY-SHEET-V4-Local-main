import { useState, useMemo } from "react";
import { useVendors, useCommunityVendors, useCreateVendor, useUpdateVendor, useDeleteVendor, useImportVendor, useRateVendor, type VendorWithRating } from "@/hooks/use-vendors";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Search, Plus, Pencil, Trash2, Star, Phone, Mail, Globe, MapPin, Download, Store, ExternalLink,
} from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import type { Vendor } from "@shared/schema";

const VENDOR_CATEGORIES = [
  { value: "audio", label: "Audio" },
  { value: "lighting", label: "Lighting" },
  { value: "video", label: "Video" },
  { value: "staging", label: "Staging" },
  { value: "backline", label: "Backline" },
  { value: "transport", label: "Transport" },
  { value: "catering", label: "Catering" },
  { value: "security", label: "Security" },
  { value: "staffing", label: "Staffing" },
  { value: "rental", label: "Rental" },
  { value: "power", label: "Power / Generator" },
  { value: "rigging", label: "Rigging" },
  { value: "effects", label: "Effects / SFX" },
  { value: "decor", label: "Decor / Scenic" },
  { value: "photography", label: "Photo / Video" },
  { value: "other", label: "Other" },
];

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          className={cn("transition-colors", readonly ? "cursor-default" : "cursor-pointer hover:text-yellow-400")}
        >
          <Star className={cn("w-4 h-4", i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
        </button>
      ))}
    </div>
  );
}

function VendorCard({
  vendor, canEdit, onEdit, onDelete, onRate, showImport, onImport,
}: {
  vendor: VendorWithRating;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRate: () => void;
  showImport?: boolean;
  onImport?: () => void;
}) {
  const catLabel = VENDOR_CATEGORIES.find(c => c.value === vendor.category)?.label || vendor.category;
  return (
    <Card className="group hover:border-primary/20 transition-all">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{vendor.name}</h3>
            <Badge variant="outline" className="text-[10px] mt-0.5">{catLabel}</Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {vendor.avgRating !== null && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{vendor.avgRating.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground">({vendor.ratingCount})</span>
              </div>
            )}
          </div>
        </div>

        {(vendor.city || vendor.state || vendor.region) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{[vendor.city, vendor.state, vendor.region].filter(Boolean).join(", ")}</span>
          </div>
        )}

        {vendor.contactName && (
          <p className="text-xs text-muted-foreground truncate">{vendor.contactName}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {vendor.contactPhone && (
            <a href={`tel:${vendor.contactPhone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <Phone className="w-3 h-3" />{vendor.contactPhone}
            </a>
          )}
          {vendor.contactEmail && (
            <a href={`mailto:${vendor.contactEmail}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <Mail className="w-3 h-3" />Email
            </a>
          )}
          {vendor.website && (
            <a href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <Globe className="w-3 h-3" />Website
            </a>
          )}
        </div>

        {vendor.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{vendor.notes}</p>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRate}>
            <Star className="w-3 h-3 mr-1" />Rate
          </Button>
          {canEdit && (
            <>
              <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={onEdit}>
                <Pencil className="w-3 h-3 mr-1" />Edit
              </Button>
              <ConfirmDelete
                onConfirm={onDelete}
                title="Delete vendor?"
                description={`Remove ${vendor.name} from your vendor list?`}
                triggerClassName="opacity-0 group-hover:opacity-100 text-destructive transition-all"
              />
            </>
          )}
          {showImport && onImport && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onImport}>
              <Download className="w-3 h-3 mr-1" />Import
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VendorFormDialog({
  open, onOpenChange, vendor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: VendorWithRating | null;
}) {
  const { toast } = useToast();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const isEdit = !!vendor;

  const [name, setName] = useState(vendor?.name || "");
  const [category, setCategory] = useState(vendor?.category || "audio");
  const [contactName, setContactName] = useState(vendor?.contactName || "");
  const [contactEmail, setContactEmail] = useState(vendor?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(vendor?.contactPhone || "");
  const [website, setWebsite] = useState(vendor?.website || "");
  const [city, setCity] = useState(vendor?.city || "");
  const [state, setState] = useState(vendor?.state || "");
  const [region, setRegion] = useState(vendor?.region || "");
  const [notes, setNotes] = useState(vendor?.notes || "");
  const [isPublic, setIsPublic] = useState(vendor?.isPublic ?? false);

  function handleSubmit() {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const data = {
      name, category, contactName: contactName || null, contactEmail: contactEmail || null,
      contactPhone: contactPhone || null, website: website || null, city: city || null,
      state: state || null, region: region || null, notes: notes || null, isPublic,
    };
    if (isEdit && vendor) {
      updateVendor.mutate({ id: vendor.id, ...data }, {
        onSuccess: () => { toast({ title: "Vendor updated" }); onOpenChange(false); },
        onError: () => toast({ title: "Error updating vendor", variant: "destructive" }),
      });
    } else {
      createVendor.mutate(data, {
        onSuccess: () => { toast({ title: "Vendor added" }); onOpenChange(false); },
        onError: () => toast({ title: "Error adding vendor", variant: "destructive" }),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] font-body max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">
            {isEdit ? "Edit Vendor" : "Add Vendor"}
          </DialogTitle>
          <DialogDescription className="sr-only">{isEdit ? "Edit vendor details" : "Add a new vendor to your list"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-1 -m-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vendor name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Name</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@vendor.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="555-0100" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Website</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://vendor.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">City</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Nashville" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">State</Label>
              <Input value={state} onChange={e => setState(e.target.value)} placeholder="TN" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Region</Label>
              <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Southeast" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes about this vendor..." rows={2} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Label className="text-xs">Share publicly with the community</Label>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={createVendor.isPending || updateVendor.isPending} className="w-full">
            {(createVendor.isPending || updateVendor.isPending) ? "Saving..." : isEdit ? "Save Changes" : "Add Vendor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RateDialog({
  open, onOpenChange, vendor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: VendorWithRating | null;
}) {
  const { toast } = useToast();
  const rateVendor = useRateVendor();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  if (!vendor) return null;

  function handleSubmit() {
    if (rating < 1) {
      toast({ title: "Select a rating", variant: "destructive" });
      return;
    }
    rateVendor.mutate({ vendorId: vendor!.id, rating, review: review || undefined }, {
      onSuccess: () => {
        toast({ title: "Rating submitted" });
        onOpenChange(false);
        setRating(0);
        setReview("");
      },
      onError: () => toast({ title: "Error submitting rating", variant: "destructive" }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wide text-primary">Rate {vendor.name}</DialogTitle>
          <DialogDescription className="sr-only">Rate this vendor</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <StarRating value={rating} onChange={setRating} />
          </div>
          <Textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Optional review..." rows={3} />
          <Button onClick={handleSubmit} disabled={rateVendor.isPending} className="w-full">
            {rateVendor.isPending ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VendorDirectory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: vendors, isLoading } = useVendors();
  const { data: communityVendors, isLoading: communityLoading } = useCommunityVendors();
  const deleteVendor = useDeleteVendor();
  const importVendor = useImportVendor();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorWithRating | null>(null);
  const [ratingVendor, setRatingVendor] = useState<VendorWithRating | null>(null);

  const canEdit = ["owner", "manager", "admin"].includes(user?.role || "");

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter(v => {
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return v.name.toLowerCase().includes(q) ||
          (v.contactName && v.contactName.toLowerCase().includes(q)) ||
          (v.city && v.city.toLowerCase().includes(q)) ||
          (v.state && v.state.toLowerCase().includes(q));
      }
      return true;
    });
  }, [vendors, search, categoryFilter]);

  const filteredCommunity = useMemo(() => {
    if (!communityVendors) return [];
    const myWorkspaceId = user?.workspaceId;
    return communityVendors
      .filter(v => v.workspaceId !== myWorkspaceId)
      .filter(v => {
        if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return v.name.toLowerCase().includes(q) ||
            (v.contactName && v.contactName.toLowerCase().includes(q)) ||
            (v.city && v.city.toLowerCase().includes(q));
        }
        return true;
      });
  }, [communityVendors, search, categoryFilter, user?.workspaceId]);

  function handleDelete(id: number) {
    deleteVendor.mutate(id, {
      onSuccess: () => toast({ title: "Vendor deleted" }),
      onError: () => toast({ title: "Error deleting vendor", variant: "destructive" }),
    });
  }

  function handleImport(id: number) {
    importVendor.mutate(id, {
      onSuccess: () => toast({ title: "Vendor imported to your workspace" }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          <span className="font-display text-lg uppercase tracking-wide">Vendor Directory</span>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditingVendor(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />Add Vendor
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="pl-9 h-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {VENDOR_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="workspace">
        <TabsList>
          <TabsTrigger value="workspace">My Workspace ({vendors?.length || 0})</TabsTrigger>
          <TabsTrigger value="community">Community ({filteredCommunity.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {vendors?.length === 0 ? "No vendors yet. Add your first vendor to get started!" : "No vendors match your search."}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
              {filteredVendors.map(v => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  canEdit={canEdit}
                  onEdit={() => { setEditingVendor(v); setFormOpen(true); }}
                  onDelete={() => handleDelete(v.id)}
                  onRate={() => setRatingVendor(v)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community">
          {communityLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading community vendors...</div>
          ) : filteredCommunity.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No public community vendors found. Share your vendors to contribute!
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
              {filteredCommunity.map(v => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  canEdit={false}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onRate={() => setRatingVendor(v)}
                  showImport={canEdit}
                  onImport={() => handleImport(v.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <VendorFormDialog
        key={editingVendor?.id || "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        vendor={editingVendor}
      />

      <RateDialog
        open={!!ratingVendor}
        onOpenChange={(open) => { if (!open) setRatingVendor(null); }}
        vendor={ratingVendor}
      />
    </div>
  );
}
