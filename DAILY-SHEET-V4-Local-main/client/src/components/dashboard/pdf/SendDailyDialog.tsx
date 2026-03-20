import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { format } from "date-fns";
import { Send, Download, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getUserTimezone } from "@/lib/timeUtils";
import type { Event, Contact } from "@shared/schema";

const PdfPreview = lazy(() => import("@/components/PdfPreview"));

export function SendDailyDialog({
  open,
  onClose,
  selectedDate,
  showsForSelectedDate,
  contacts,
  workspaceName,
  showColorMap,
  allEventAssignments,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  showsForSelectedDate: Event[];
  contacts: Contact[];
  workspaceName?: string;
  showColorMap?: Map<string, { dot: string; bg: string; text: string; border: string; bar: string }>;
  allEventAssignments: any[];
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "preview" | "confirm">("preview");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [previewRecipients, setPreviewRecipients] = useState<Array<{ id: number; name: string; email: string; role: string }>>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<number>>(new Set());
  const [previewSubject, setPreviewSubject] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [previewShowNames, setPreviewShowNames] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState("");
  const [extraEmails, setExtraEmails] = useState("");
  const [selectedShowNames, setSelectedShowNames] = useState<Set<string>>(new Set());

  const allShowNames = useMemo(() => showsForSelectedDate.map(s => s.name), [showsForSelectedDate]);
  const hasMultipleShows = allShowNames.length > 1;
  const eventNames = useMemo(() => Array.from(selectedShowNames), [selectedShowNames]);

  const toggleShow = (name: string) => {
    setSelectedShowNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const fetchPreview = async (names: string[], cancelled: { current: boolean }) => {
    setLoading(true);
    try {
      if (names.length === 0) {
        setPreviewError("No shows available for this date.");
        return;
      }
      const timezone = getUserTimezone();
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/daily-sheet/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: selectedDate, eventNames: names, timezone }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText);
      }
      const data = await res.json();
      if (cancelled.current) return;
      if (data.pdfToken) {
        setPdfUrl(`/api/daily-sheet/pdf/${data.pdfToken}`);
        try {
          const pdfRes = await fetch(`/api/daily-sheet/pdf/${data.pdfToken}`);
          if (pdfRes.ok) {
            const blob = await pdfRes.blob();
            if (!cancelled.current) setPdfBlobUrl(URL.createObjectURL(blob));
          }
        } catch {}
      }
      const recs = data.recipients || [];
      setPreviewRecipients(recs);
      setSelectedRecipientIds(new Set(recs.map((r: any) => r.id)));
      setPreviewSubject(data.subject || "");
      setRecipientCount(data.recipientCount || 0);
      setPreviewShowNames(data.showNames || []);
    } catch (err: any) {
      if (cancelled.current) return;
      setPreviewError(err.message || "Could not generate preview.");
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const initialSelected = new Set(allShowNames);
    setSelectedShowNames(initialSelected);
    setPdfUrl("");
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); }
    setPdfBlobUrl(null);
    setPreviewRecipients([]);
    setSelectedRecipientIds(new Set());
    setPreviewSubject("");
    setRecipientCount(0);
    setPreviewShowNames([]);
    setPreviewError("");
    setExtraEmails("");

    if (hasMultipleShows) {
      setStep("select");
    } else {
      setStep("preview");
      const cancelFlag = { current: false };
      fetchPreview(allShowNames, cancelFlag);
      return () => { cancelFlag.current = true; };
    }
  }, [open, selectedDate, showsForSelectedDate]);

  const parsedExtraEmails = useMemo(() => {
    if (!extraEmails.trim()) return [];
    return extraEmails
      .split(/[,;\n]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@") && e.includes("."));
  }, [extraEmails]);

  const allRecipientEmails = useMemo(() => {
    const fromContacts = previewRecipients
      .filter(r => selectedRecipientIds.has(r.id))
      .map(r => r.email.toLowerCase());
    const combined = new Set([...fromContacts, ...parsedExtraEmails]);
    return Array.from(combined);
  }, [previewRecipients, selectedRecipientIds, parsedExtraEmails]);

  const handleSend = async () => {
    setSending(true);
    try {
      const timezone = getUserTimezone();
      const res = await apiRequest("POST", "/api/daily-sheet/send", {
        date: selectedDate,
        eventNames,
        timezone,
        extraEmails: parsedExtraEmails,
        selectedEmails: allRecipientEmails,
      });
      const data = await res.json();
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failCount = data.results?.filter((r: any) => !r.success).length || 0;
      toast({
        title: "Daily Sheet Sent",
        description: failCount > 0
          ? `Sent to ${successCount} crew member${successCount !== 1 ? "s" : ""}. ${failCount} failed.`
          : `Successfully sent to ${successCount} crew member${successCount !== 1 ? "s" : ""}.`,
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "Failed to Send",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const dateFormatted = format(new Date(selectedDate + "T12:00:00"), "EEEE, MMM d, yyyy");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {step === "select" ? "Select Shows" : step === "preview" ? "Preview Daily Sheet" : "Confirm Send"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" ? (
              <>Choose which show{allShowNames.length > 1 ? "s" : ""} to include in the daily sheet for <span className="font-medium">{dateFormatted}</span>.</>
            ) : step === "preview" ? (
              <>Review the email that will be sent for <span className="font-medium">{dateFormatted}</span>.
              {workspaceName && <span className="block text-xs text-muted-foreground mt-1">Organization: {workspaceName}</span>}</>
            ) : (
              <>Ready to send to <span className="font-medium">{allRecipientEmails.length} recipient{allRecipientEmails.length !== 1 ? "s" : ""}</span>.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              {allShowNames.map(name => {
                const isSelected = selectedShowNames.has(name);
                const color = showColorMap?.get(name);
                const showUserIds = new Set(allEventAssignments.filter((a: any) => a.eventName === name).map((a: any) => a.userId));
                const showContacts = contacts.filter(c => c.userId && showUserIds.has(c.userId) && c.email);
                return (
                  <label
                    key={name}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    data-testid={`label-select-show-${name.replace(/\s+/g, '-')}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleShow(name)}
                      data-testid={`checkbox-select-show-${name.replace(/\s+/g, '-')}`}
                    />
                    <div className={cn("w-3 h-3 rounded-full flex-shrink-0", color?.dot || "bg-primary")} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {showContacts.length} crew with email
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedShowNames.size} of {allShowNames.length} show{allShowNames.length !== 1 ? "s" : ""} selected. At least one must remain selected.
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-muted-foreground">Generating preview...</p>
                </div>
              </div>
            ) : previewError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-sm text-destructive">{previewError}</p>
                <Button variant="outline" size="sm" onClick={() => {
                  setPreviewError("");
                  fetchPreview(eventNames, { current: false });
                }} data-testid="button-retry-preview">Retry</Button>
              </div>
            ) : pdfUrl ? (
              <>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Shows</h4>
                  <div className="flex flex-wrap gap-1">
                    {previewShowNames.map(name => (
                      <Badge key={name} variant="secondary" data-testid={`badge-preview-show-${name.replace(/\s+/g, '-')}`}>{name}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Assigned Crew ({selectedRecipientIds.size} of {previewRecipients.length} selected)
                    </h4>
                    {previewRecipients.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          if (selectedRecipientIds.size === previewRecipients.length) {
                            setSelectedRecipientIds(new Set());
                          } else {
                            setSelectedRecipientIds(new Set(previewRecipients.map(r => r.id)));
                          }
                        }}
                        data-testid="button-toggle-all-recipients"
                      >
                        {selectedRecipientIds.size === previewRecipients.length ? "Deselect All" : "Select All"}
                      </Button>
                    )}
                  </div>
                  {previewRecipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No crew members with email addresses found for these shows.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-0.5 border rounded-md p-2">
                      {[...previewRecipients].sort((a, b) => a.name.localeCompare(b.name)).map((r) => {
                        const isChecked = selectedRecipientIds.has(r.id);
                        return (
                          <label
                            key={r.id}
                            className={cn(
                              "flex items-center gap-2 text-sm py-1 px-1 rounded cursor-pointer transition-colors",
                              isChecked ? "opacity-100" : "opacity-50"
                            )}
                            data-testid={`label-recipient-${r.id}`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => {
                                setSelectedRecipientIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(r.id)) next.delete(r.id);
                                  else next.add(r.id);
                                  return next;
                                });
                              }}
                              data-testid={`checkbox-recipient-${r.id}`}
                            />
                            <span className="truncate">{r.name}</span>
                            <Badge variant="outline" className="text-[10px] flex-shrink-0">{r.role}</Badge>
                            <span className="text-muted-foreground truncate ml-auto text-xs">{r.email}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Additional Recipients
                  </h4>
                  <textarea
                    value={extraEmails}
                    onChange={(e) => setExtraEmails(e.target.value)}
                    placeholder="Add email addresses (comma or newline separated)"
                    className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    data-testid="input-extra-emails"
                  />
                  {parsedExtraEmails.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {parsedExtraEmails.length} additional email{parsedExtraEmails.length !== 1 ? "s" : ""} will receive the daily sheet
                    </p>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PDF Attachment Preview</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid="button-open-pdf"
                    >
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3 h-3 mr-1" />
                        Open PDF
                      </a>
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1.5 border-b flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{previewSubject}</span>
                    </div>
                    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
                      <PdfPreview url={pdfBlobUrl || pdfUrl} />
                    </Suspense>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No preview available.</p>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-md p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">You are about to send this daily sheet</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Date: <span className="font-medium text-foreground">{dateFormatted}</span></p>
                <p>Shows: <span className="font-medium text-foreground">{previewShowNames.join(", ")}</span></p>
                <p>Assigned crew: <span className="font-medium text-foreground">{selectedRecipientIds.size} of {previewRecipients.length}</span></p>
                {parsedExtraEmails.length > 0 && (
                  <p>Additional emails: <span className="font-medium text-foreground">{parsedExtraEmails.join(", ")}</span></p>
                )}
                <p>Total recipients: <span className="font-medium text-foreground">{allRecipientEmails.length}</span></p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Each recipient will receive an individual email with the full daily sheet including venue info, schedule, and crew contacts.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0">
          {step === "select" && (
            <>
              <Button variant="outline" onClick={onClose} data-testid="button-cancel-select">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setStep("preview");
                  setPreviewError("");
                  setPdfUrl("");
                  fetchPreview(eventNames, { current: false });
                }}
                disabled={selectedShowNames.size === 0}
                data-testid="button-continue-to-preview"
              >
                Continue to Preview
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={hasMultipleShows ? () => {
                setStep("select");
                setPdfUrl("");
                setPreviewRecipients([]);
                setPreviewSubject("");
                setRecipientCount(0);
                setPreviewShowNames([]);
                setPreviewError("");
              } : onClose} disabled={loading} data-testid="button-cancel-preview">
                {hasMultipleShows ? "Back" : "Cancel"}
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={loading || allRecipientEmails.length === 0}
                data-testid="button-proceed-to-send"
              >
                <Send className="mr-2 h-4 w-4" /> Send to {allRecipientEmails.length} recipient{allRecipientEmails.length !== 1 ? "s" : ""}
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("preview")} disabled={sending} data-testid="button-back-to-preview">
                Back to Preview
              </Button>
              <Button onClick={handleSend} disabled={sending || allRecipientEmails.length === 0} data-testid="button-confirm-send">
                {sending ? "Sending..." : "Confirm Send"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
