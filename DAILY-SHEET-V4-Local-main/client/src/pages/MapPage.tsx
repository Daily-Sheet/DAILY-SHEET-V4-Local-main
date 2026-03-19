import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Globe, Navigation, X, Plus, Trash2, ExternalLink, MapPin, ArrowLeft, SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORIES = [
  { id: "all",           label: "All",           emoji: "🗺️",  color: "#94a3b8" },
  { id: "dining",        label: "Dining",        emoji: "🍽️",  color: "#f97316" },
  { id: "entertainment", label: "Entertainment", emoji: "🎭",  color: "#a855f7" },
  { id: "activities",    label: "Activities",    emoji: "🏃",  color: "#22c55e" },
  { id: "accommodation", label: "Stay",          emoji: "🏨",  color: "#3b82f6" },
  { id: "other",         label: "Other",         emoji: "📍",  color: "#94a3b8" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

function getCategoryMeta(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

function createPinIcon(category: string, isOwn: boolean) {
  const meta = getCategoryMeta(category);
  const border = isOwn ? "3px solid #facc15" : "2px solid rgba(255,255,255,0.6)";
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:${meta.color};border:${border};display:flex;align-items:center;justify-content:center;font-size:16px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;"><span style="transform:rotate(45deg)">${meta.emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

type EnrichedPin = {
  id: number; userId: string; userName: string;
  lat: number; lng: number; title: string; category: string;
  description?: string | null; address?: string | null; website?: string | null;
  createdAt: string; likeCount: number; commentCount: number; likedByMe: boolean;
};

type MapPinComment = {
  id: number; pinId: number; userId: string; userName: string;
  content: string; createdAt: string;
};

// Captures the map instance into a ref so we can call getCenter() outside
function MapRefCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

function ClusteredMarkers({ pins, currentUserId, onPinClick }: {
  pins: EnrichedPin[];
  currentUserId: string;
  onPinClick: (pin: EnrichedPin) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterGroupRef.current) map.removeLayer(clusterGroupRef.current);
    const group = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
    });
    pins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: createPinIcon(pin.category, pin.userId === currentUserId),
      });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onPinClick(pin);
      });
      group.addLayer(marker);
    });
    map.addLayer(group);
    clusterGroupRef.current = group;
    return () => { map.removeLayer(group); };
  }, [map, pins, currentUserId, onPinClick]);

  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mapRef = useRef<L.Map | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<CategoryId>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<EnrichedPin | null>(null);
  const [newComment, setNewComment] = useState("");

  const [form, setForm] = useState({
    title: "", category: "dining", description: "", address: "", website: "",
  });

  const { data: pins = [] } = useQuery<EnrichedPin[]>({
    queryKey: ["/api/map/pins"],
    refetchInterval: 30000,
  });

  const { data: comments = [] } = useQuery<MapPinComment[]>({
    queryKey: ["/api/map/pins", selectedPin?.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/map/pins/${selectedPin!.id}/comments`).then(r => r.json()),
    enabled: !!selectedPin,
  });

  const createPinMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/map/pins", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map/pins"] });
      setPendingLatLng(null);
      setForm({ title: "", category: "dining", description: "", address: "", website: "" });
      toast({ title: "Pin dropped! 📍" });
    },
    onError: () => toast({ title: "Failed to drop pin", variant: "destructive" }),
  });

  const deletePinMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/map/pins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map/pins"] });
      setSelectedPin(null);
      toast({ title: "Pin removed" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (pinId: number) => apiRequest("POST", `/api/map/pins/${pinId}/like`).then(r => r.json()),
    onSuccess: (data, pinId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/map/pins"] });
      if (selectedPin?.id === pinId) {
        setSelectedPin(p => p ? { ...p, likedByMe: data.liked, likeCount: data.count } : p);
      }
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ pinId, content }: { pinId: number; content: string }) =>
      apiRequest("POST", `/api/map/pins/${pinId}/comments`, { content }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map/pins", selectedPin?.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/map/pins"] });
      setNewComment("");
    },
    onError: () => toast({ title: "Failed to add comment", variant: "destructive" }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/map/comments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map/pins", selectedPin?.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/map/pins"] });
    },
  });

  const handleConfirmPinLocation = useCallback(() => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    setPendingLatLng({ lat: center.lat, lng: center.lng });
    setPinDropMode(false);
  }, []);

  const handlePinClick = useCallback((pin: EnrichedPin) => {
    setSelectedPin(pin);
  }, []);

  const filteredPins = categoryFilter === "all" ? pins : pins.filter(p => p.category === categoryFilter);
  const activeCategory = CATEGORIES.find(c => c.id === categoryFilter);

  return (
    <>
      {/* Fix Leaflet z-index so it doesn't bleed above sheets/modals */}
      <style>{`.leaflet-container { z-index: 1 !important; }`}</style>

      <div className="flex flex-col bg-background pb-16 sm:pb-0" style={{ height: "100dvh" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40 bg-card/80 backdrop-blur-xl shrink-0">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold leading-tight">Community Map</h1>
            <p className="text-[10px] text-muted-foreground">{pins.length} pin{pins.length !== 1 ? "s" : ""} worldwide</p>
          </div>
          {/* Filter button */}
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 gap-1.5 text-xs shrink-0", categoryFilter !== "all" && "border-primary text-primary")}
            onClick={() => setFilterSheetOpen(true)}
          >
            <SlidersHorizontal className="h-3 w-3" />
            {categoryFilter === "all" ? "Filter" : activeCategory?.label}
          </Button>
        </div>

        {/* Map area */}
        <div className="flex-1 relative overflow-hidden">
          <MapContainer
            center={[20, 0]}
            zoom={3}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
            />
            <MapRefCapture mapRef={mapRef} />
            <ClusteredMarkers
              pins={filteredPins}
              currentUserId={user?.id ?? ""}
              onPinClick={handlePinClick}
            />
          </MapContainer>

          {/* Pin drop mode overlay */}
          {pinDropMode && (
            <>
              {/* Crosshair at center */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 1000 }}>
                <div className="relative w-10 h-10">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary -translate-y-1/2 opacity-90" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary -translate-x-1/2 opacity-90" />
                  <div className="absolute inset-[30%] rounded-full border-2 border-primary opacity-90" />
                </div>
              </div>
              {/* Instruction + action bar */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ zIndex: 1000 }}>
                <div className="bg-card/90 backdrop-blur border border-border/40 rounded-full px-3 py-1.5 text-xs text-muted-foreground shadow">
                  Pan to your spot, then place the pin
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ zIndex: 1000 }}>
                <Button variant="outline" size="sm" className="shadow-lg" onClick={() => setPinDropMode(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="shadow-lg gap-1.5" onClick={handleConfirmPinLocation}>
                  <MapPin className="h-3.5 w-3.5" /> Place Pin Here
                </Button>
              </div>
            </>
          )}

          {/* FAB — only when not in drop mode and no sheet open */}
          {!pinDropMode && !selectedPin && !pendingLatLng && (
            <Button
              size="icon"
              className="absolute bottom-4 right-4 h-12 w-12 rounded-full shadow-xl"
              style={{ zIndex: 1000 }}
              onClick={() => setPinDropMode(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Category filter sheet */}
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base">Filter by Category</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 pb-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryFilter(cat.id as CategoryId); setFilterSheetOpen(false); }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                    categoryFilter === cat.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="flex-1">{cat.label}</span>
                  {categoryFilter === cat.id && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Add Pin form sheet */}
        <Sheet open={!!pendingLatLng} onOpenChange={(open) => { if (!open) setPendingLatLng(null); }}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" /> Drop a Pin
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <Input
                placeholder="What's this place? *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter(c => c.id !== "all").map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                      form.category === cat.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Tell the crew about it — what's good, pro tips…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
              <Input
                placeholder="Address (optional)"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
              <Input
                placeholder="Website (optional)"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              />
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setPendingLatLng(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => createPinMutation.mutate({ ...form, ...pendingLatLng })}
                  disabled={!form.title.trim() || createPinMutation.isPending}
                >
                  {createPinMutation.isPending ? "Dropping…" : "Drop Pin"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Pin detail sheet */}
        <Sheet open={!!selectedPin} onOpenChange={(open) => { if (!open) setSelectedPin(null); }}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] flex flex-col p-0">
            {selectedPin && (
              <>
                <div className="flex items-start gap-3 p-4 border-b border-border/30 shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ background: getCategoryMeta(selectedPin.category).color + "30", border: `2px solid ${getCategoryMeta(selectedPin.category).color}` }}
                  >
                    {getCategoryMeta(selectedPin.category).emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm leading-tight">{selectedPin.title}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                        {getCategoryMeta(selectedPin.category).label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        by {selectedPin.userName} · {formatDistanceToNow(new Date(selectedPin.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {selectedPin.userId === user?.id && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      onClick={() => deletePinMutation.mutate(selectedPin.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {selectedPin.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedPin.description}</p>
                  )}
                  {(selectedPin.address || selectedPin.website) && (
                    <div className="space-y-1.5">
                      {selectedPin.address && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Navigation className="h-3 w-3 shrink-0" />
                          <span>{selectedPin.address}</span>
                        </div>
                      )}
                      {selectedPin.website && (
                        <a
                          href={selectedPin.website.startsWith("http") ? selectedPin.website : `https://${selectedPin.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">{selectedPin.website}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => likeMutation.mutate(selectedPin.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-medium transition-colors",
                        selectedPin.likedByMe ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", selectedPin.likedByMe && "fill-rose-500")} />
                      {selectedPin.likeCount} {selectedPin.likeCount === 1 ? "like" : "likes"}
                    </button>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      {comments.length} {comments.length === 1 ? "comment" : "comments"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex gap-2 group">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-medium">{comment.userName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{comment.content}</p>
                        </div>
                        {comment.userId === user?.id && (
                          <button
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 p-3 border-t border-border/30 bg-card/50 shrink-0">
                  <Textarea
                    placeholder="Add a comment…"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    rows={1}
                    className="resize-none text-sm min-h-[36px] py-2"
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newComment.trim()) addCommentMutation.mutate({ pinId: selectedPin.id, content: newComment });
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="shrink-0 self-end"
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    onClick={() => {
                      if (newComment.trim()) addCommentMutation.mutate({ pinId: selectedPin.id, content: newComment });
                    }}
                  >
                    Post
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
