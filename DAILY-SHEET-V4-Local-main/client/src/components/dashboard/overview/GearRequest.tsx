import { useState, useEffect } from "react";
import { Wrench, Send, Loader2, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";
import { FilePreviewPanel } from "@/components/dashboard/files/FilesView";

export function GearRequestDialog({ events, open, onOpenChange }: { events: Event[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [items, setItems] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  useEffect(() => {
    if (open && events.length > 0 && !selectedEventId) {
      setSelectedEventId(String(events[0].id));
    }
  }, [open, events, selectedEventId]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gear-requests", {
        eventId: parseInt(selectedEventId),
        recipientEmail,
        items,
        notes: notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Gear Request Sent", description: "The request has been emailed and saved as a PDF." });
      queryClient.invalidateQueries({ queryKey: ["/api/gear-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setRecipientEmail("");
      setItems("");
      setNotes("");
      setSelectedEventId("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send gear request.", variant: "destructive" });
    },
  });

  const canSubmit = selectedEventId && recipientEmail.includes("@") && items.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" data-testid="dialog-gear-request">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Gear Request
          </DialogTitle>
          <DialogDescription className="sr-only">Send an onsite gear request via email</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Show</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger data-testid="select-gear-show">
                <SelectValue placeholder="Select a show" />
              </SelectTrigger>
              <SelectContent>
                {events.map(ev => (
                  <SelectItem key={ev.id} value={String(ev.id)}>{ev.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Recipient Email</Label>
            <Input
              type="email"
              placeholder="vendor@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              data-testid="input-gear-email"
            />
          </div>
          <div>
            <Label>Items Needed</Label>
            <Textarea
              placeholder="List the gear you need, one item per line..."
              value={items}
              onChange={(e) => setItems(e.target.value)}
              rows={6}
              className="resize-none"
              data-testid="input-gear-items"
            />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
              data-testid="input-gear-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
            className="w-full"
            data-testid="button-send-gear-request"
          >
            {submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Send Request</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GearRequestHistory({ eventIds, eventsList }: { eventIds: number[]; eventsList: Event[] }) {
  const [expanded, setExpanded] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const queries = eventIds.map(id => ({
    queryKey: ["/api/gear-requests", id],
    enabled: expanded,
  }));
  const results = useQueries({ queries });
  const allRequests: any[] = results
    .flatMap(r => (r.data as any[]) || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = results.some(r => r.isLoading && r.fetchStatus !== "idle");

  return (
    <div className="mt-6" data-testid="gear-request-history">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-toggle-gear-history"
      >
        <Wrench className="h-4 w-4" />
        <span>Gear Requests</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        {!expanded && allRequests.length > 0 && (
          <Badge variant="secondary" className="text-xs">{allRequests.length}</Badge>
        )}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : allRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No gear requests yet.</p>
          ) : (
            allRequests.map((gr: any) => {
              const ev = eventsList.find((e: Event) => e.id === gr.eventId);
              return (
                <div key={gr.id} className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-3 text-sm" data-testid={`gear-request-item-${gr.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{ev?.name || "Show"}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {gr.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {gr.fileId && (
                        <button
                          onClick={() => setPreviewFile({ id: gr.fileId, name: `Gear Request - ${gr.requestedByName}`, type: "application/pdf" })}
                          className="text-xs text-primary hover:underline"
                          data-testid={`button-view-gear-pdf-${gr.id}`}
                        >
                          View PDF
                        </button>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(gr.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 text-muted-foreground text-xs space-y-0.5">
                    <div>To: {gr.recipientEmail}</div>
                    <div className="truncate">Items: {gr.items.split("\n")[0]}{gr.items.includes("\n") ? "..." : ""}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {previewFile && (
        <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
