import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Copy, Check, Trash2, Plus, X, Loader2, Ban, Music2, ChevronDown, ChevronRight, FolderOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { FileFolder } from "@shared/schema";

interface BandPortalLink {
  id: number;
  token: string;
  eventName: string;
  folderName: string;
  bandName: string;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  revoked: boolean;
}

export function BandPortalManager({ selectedEvents }: { selectedEvents: string[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [bandName, setBandName] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sendingTo, setSendingTo] = useState<number | null>(null);
  const [sendEmail, setSendEmail] = useState("");

  const { data: allLinks = [] } = useQuery<BandPortalLink[]>({
    queryKey: ["/api/band-portal-links"],
  });

  const { data: foldersList = [] } = useQuery<FileFolder[]>({
    queryKey: ["/api/file-folders"],
  });

  // Filter links to selected events
  const links = allLinks.filter(l => selectedEvents.includes(l.eventName));

  // Build folder options for the searchable select — scoped to selected events
  const folderOptions = useMemo(() => {
    const selectedSet = new Set(selectedEvents);
    return foldersList
      .filter(f => f.eventName && selectedSet.has(f.eventName))
      .map(f => ({
        value: `${f.eventName}::${f.name}`,
        label: f.name,
        sublabel: f.eventName || undefined,
      }));
  }, [foldersList, selectedEvents]);

  const createMutation = useMutation({
    mutationFn: async (data: { eventName: string; folderName: string; bandName: string; notes: string; expiresInDays?: number }) => {
      const res = await fetch("/api/band-portal-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create link" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/band-portal-links"] });
      toast({ title: "Portal link created", description: "Copy the link and send it to the band." });
      setBandName("");
      setNotes("");
      setExpiresInDays("");
      setSelectedFolder("");
      setCreating(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/band-portal-links/${id}/revoke`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to revoke link");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/band-portal-links"] });
      toast({ title: "Link revoked" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/band-portal-links/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete link");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/band-portal-links"] });
      toast({ title: "Link deleted" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ id, email }: { id: number; email: string }) => {
      const res = await fetch(`/api/band-portal-links/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to send" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Link sent!" });
      setSendingTo(null);
      setSendEmail("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const copyLink = (link: BandPortalLink) => {
    const url = `${window.location.origin}/portal/${link.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied!" });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandName.trim() || !selectedFolder) return;
    const [eventName, folderName] = selectedFolder.split("::");
    createMutation.mutate({
      eventName,
      folderName,
      bandName: bandName.trim(),
      notes: notes.trim(),
      expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
    });
  };

  const isExpired = (link: BandPortalLink) =>
    link.expiresAt && new Date(link.expiresAt) < new Date();

  const activeLinks = links.filter(l => !l.revoked && !isExpired(l));
  const inactiveLinks = links.filter(l => l.revoked || isExpired(l));

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-indigo-500" />
          <span className="font-medium">Band Portal</span>
          {activeLinks.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {activeLinks.length} active
            </Badge>
          )}
        </div>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-3 py-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Send bands a link to upload their rider into a specific folder. No login required.
          </p>

          {/* Active links */}
          {activeLinks.length > 0 && (
            <div className="space-y-1.5">
              {activeLinks.map(link => (
                <div key={link.id} className="bg-muted/30 rounded-md px-2.5 py-2 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block">{link.bandName}</span>
                      <span className="text-muted-foreground truncate block">
                        <FolderOpen className="h-2.5 w-2.5 inline mr-1" />
                        {link.folderName} — {link.eventName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyLink(link)}
                        title="Copy link"
                      >
                        {copiedId === link.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-indigo-500"
                        onClick={() => { setSendingTo(sendingTo === link.id ? null : link.id); setSendEmail(""); }}
                        title="Send via email"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-orange-500"
                        onClick={() => revokeMutation.mutate(link.id)}
                        title="Revoke link"
                      >
                        <Ban className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(link.id)}
                      title="Delete link"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  </div>
                  {sendingTo === link.id && (
                    <form
                      className="flex gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (sendEmail.trim()) sendMutation.mutate({ id: link.id, email: sendEmail.trim() });
                      }}
                    >
                      <Input
                        autoFocus
                        type="email"
                        placeholder="band@email.com"
                        value={sendEmail}
                        onChange={(e) => setSendEmail(e.target.value)}
                        className="h-7 text-xs flex-1"
                      />
                      <Button type="submit" size="sm" className="h-7 px-2 text-xs" disabled={sendMutation.isPending || !sendEmail.trim()}>
                        {sendMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5 text-xs" onClick={() => { setSendingTo(null); setSendEmail(""); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inactive/revoked links */}
          {inactiveLinks.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Expired / Revoked</p>
              {inactiveLinks.map(link => (
                <div key={link.id} className="flex items-center gap-2 bg-muted/20 rounded-md px-2.5 py-1.5 text-xs opacity-60">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate flex-1">{link.bandName}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {link.revoked ? "revoked" : "expired"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(link.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Create form */}
          {creating ? (
            <form onSubmit={handleCreate} className="space-y-2 border border-border/50 rounded-md p-2.5">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1 block">Upload Folder</label>
                <SearchableSelect
                  options={folderOptions}
                  value={selectedFolder}
                  onValueChange={setSelectedFolder}
                  placeholder="Search folders..."
                  searchPlaceholder="Type to search folders..."
                  emptyMessage="No folders found. Create a folder in the Files tab first."
                  triggerClassName="h-8 text-xs"
                />
              </div>
              <Input
                placeholder="Band / artist name (what they see)"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Expires in days (optional)"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="h-8 text-xs"
                min="1"
              />
              <div className="flex gap-1.5">
                <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={createMutation.isPending || !bandName.trim() || !selectedFolder}>
                  {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create Link"}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setCreating(false); setBandName(""); setNotes(""); setExpiresInDays(""); setSelectedFolder(""); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs gap-1.5"
              onClick={() => setCreating(true)}
              disabled={selectedEvents.length === 0}
            >
              <Plus className="h-3 w-3" /> Create Upload Link
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
