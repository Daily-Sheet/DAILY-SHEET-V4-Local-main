import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { format } from "date-fns";
import { Send, Star, Loader2, AlertTriangle, DollarSign, Wrench, HeartPulse, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event, Contact } from "@shared/schema";

const PdfPreview = lazy(() => import("@/components/PdfPreview"));

interface AfterJobReportDialogProps {
  open: boolean;
  onClose: () => void;
  showsForSelectedDate: Event[];
  contacts: Contact[];
  allEventAssignments: any[];
}

const ISSUE_CATEGORIES = ["Technical", "Weather", "Venue", "Staffing", "Safety", "Client", "Other"];

export function AfterJobReportDialog({
  open,
  onClose,
  showsForSelectedDate,
  contacts,
  allEventAssignments,
}: AfterJobReportDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "form" | "review">("select");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [submitting, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportAlreadyExists, setReportAlreadyExists] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [wentAsPlanned, setWentAsPlanned] = useState<boolean | null>(null);
  const [summary, setSummary] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [hadInjuries, setHadInjuries] = useState(false);
  const [injuryDescription, setInjuryDescription] = useState("");
  const [hadEquipmentIssues, setHadEquipmentIssues] = useState(false);
  const [equipmentDescription, setEquipmentDescription] = useState("");
  const [hadUnplannedExpenses, setHadUnplannedExpenses] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState("");
  const [attendanceEstimate, setAttendanceEstimate] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [venueNotes, setVenueNotes] = useState("");

  // Review step state
  const [pdfToken, setPdfToken] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [previewRecipients, setPreviewRecipients] = useState<Array<{ id: number; name: string; email: string; role: string }>>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<number>>(new Set());
  const [extraEmails, setExtraEmails] = useState("");

  const selectedEvent = useMemo(
    () => showsForSelectedDate.find(s => s.id === selectedEventId) || null,
    [showsForSelectedDate, selectedEventId]
  );

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;
    setStep(showsForSelectedDate.length === 1 ? "form" : "select");
    setSelectedEventId(showsForSelectedDate.length === 1 ? showsForSelectedDate[0].id : null);
    setReportAlreadyExists(false);
    resetForm();
  }, [open]);

  // Check if report already exists when event is selected
  useEffect(() => {
    if (!selectedEventId || !open) return;
    const checkExisting = async () => {
      try {
        const res = await fetch(
          (import.meta.env.VITE_API_URL ?? "") + `/api/after-job-reports/event/${selectedEventId}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setReportAlreadyExists(data.exists);
        }
      } catch {}
    };
    checkExisting();
  }, [selectedEventId, open]);

  function resetForm() {
    setRating(0);
    setWentAsPlanned(null);
    setSummary("");
    setIssueCategory("");
    setIssueDescription("");
    setHadInjuries(false);
    setInjuryDescription("");
    setHadEquipmentIssues(false);
    setEquipmentDescription("");
    setHadUnplannedExpenses(false);
    setExpenseAmount("");
    setExpenseDescription("");
    setExpenseReceiptUrl("");
    setAttendanceEstimate("");
    setClientNotes("");
    setVenueNotes("");
    setPdfToken("");
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPreviewRecipients([]);
    setSelectedRecipientIds(new Set());
    setExtraEmails("");
  }

  const formData = useMemo(() => ({
    rating: rating || null,
    wentAsPlanned,
    summary: summary || null,
    issueCategory: issueCategory || null,
    issueDescription: issueDescription || null,
    hadInjuries,
    injuryDescription: injuryDescription || null,
    hadEquipmentIssues,
    equipmentDescription: equipmentDescription || null,
    hadUnplannedExpenses,
    expenseAmount: expenseAmount || null,
    expenseDescription: expenseDescription || null,
    expenseReceiptUrl: expenseReceiptUrl || null,
    attendanceEstimate: attendanceEstimate ? parseInt(attendanceEstimate, 10) : null,
    clientNotes: clientNotes || null,
    venueNotes: venueNotes || null,
  }), [rating, wentAsPlanned, summary, issueCategory, issueDescription, hadInjuries, injuryDescription, hadEquipmentIssues, equipmentDescription, hadUnplannedExpenses, expenseAmount, expenseDescription, expenseReceiptUrl, attendanceEstimate, clientNotes, venueNotes]);

  const isFormValid = rating > 0 && wentAsPlanned !== null && summary.trim().length > 0;

  const handleGoToReview = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(
        (import.meta.env.VITE_API_URL ?? "") + "/api/after-job-reports/preview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ eventId: selectedEventId, formData }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setPdfToken(data.pdfToken);
      // Fetch PDF blob for preview
      try {
        const pdfRes = await fetch(
          (import.meta.env.VITE_API_URL ?? "") + `/api/after-job-reports/pdf/${data.pdfToken}`,
          { credentials: "include" }
        );
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          setPdfBlobUrl(URL.createObjectURL(blob));
        }
      } catch {}

      const recs = data.recipients || [];
      setPreviewRecipients(recs);
      setSelectedRecipientIds(new Set(recs.map((r: any) => r.id)));
      setStep("review");
    } catch (err: any) {
      toast({ title: "Preview Failed", description: err.message || "Could not generate preview", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const parsedExtraEmails = useMemo(() => {
    if (!extraEmails.trim()) return [];
    return extraEmails.split(/[,;\n]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@") && e.includes("."));
  }, [extraEmails]);

  const allRecipientEmails = useMemo(() => {
    const fromContacts = previewRecipients
      .filter(r => selectedRecipientIds.has(r.id))
      .map(r => r.email.toLowerCase());
    return Array.from(new Set([...fromContacts, ...parsedExtraEmails]));
  }, [previewRecipients, selectedRecipientIds, parsedExtraEmails]);

  const handleSubmitAndSend = async () => {
    if (!selectedEventId) return;
    setSending(true);
    try {
      // 1. Create the report
      const createRes = await apiRequest("POST", "/api/after-job-reports", {
        eventId: selectedEventId,
        ...formData,
      });
      const report = await createRes.json();

      // 2. Send emails if recipients selected
      if (allRecipientEmails.length > 0) {
        const sendRes = await apiRequest("POST", `/api/after-job-reports/${report.id}/send`, {
          selectedEmails: allRecipientEmails,
        });
        const sendData = await sendRes.json();
        const successCount = sendData.results?.filter((r: any) => r.success).length || 0;
        const failCount = sendData.results?.filter((r: any) => !r.success).length || 0;
        toast({
          title: "Report Filed & Sent",
          description: failCount > 0
            ? `Report saved. Emailed to ${successCount} recipient${successCount !== 1 ? "s" : ""}. ${failCount} failed.`
            : `Report saved and sent to ${successCount} recipient${successCount !== 1 ? "s" : ""}.`,
        });
      } else {
        toast({ title: "Report Filed", description: "After job report saved successfully." });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {step === "select" ? "Select Show" : step === "form" ? "After Job Report" : "Review & Send"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Choose which show to file a report for."
              : step === "form"
              ? selectedEvent
                ? `Filing report for ${selectedEvent.name}`
                : "Fill out the after job report."
              : `Review the report and select recipients.`}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Show */}
        {step === "select" && (
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 p-1 -m-1">
            {showsForSelectedDate.map(show => (
              <label
                key={show.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors",
                  selectedEventId === show.id ? "border-primary bg-primary/5" : "border-border"
                )}
                onClick={() => setSelectedEventId(show.id)}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full flex-shrink-0",
                  selectedEventId === show.id ? "bg-primary" : "bg-muted"
                )} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{show.name}</span>
                  {show.startDate && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(new Date(show.startDate + "T12:00:00"), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Step 2: Smart Form */}
        {step === "form" && (
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 p-1 -m-1">
            {reportAlreadyExists && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">A report has already been filed for this show. Submitting will be blocked.</p>
              </div>
            )}

            {/* Rating */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall Rating *</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="transition-colors"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Went as planned */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Did the show go as planned? *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={wentAsPlanned === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWentAsPlanned(true)}
                >Yes</Button>
                <Button
                  type="button"
                  variant={wentAsPlanned === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setWentAsPlanned(false)}
                >No</Button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary / Notes *</Label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Brief summary of how the show went..."
                className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Conditional: Issues */}
            {wentAsPlanned === false && (
              <div className="space-y-3 p-3 rounded-md border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">What went wrong?</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={issueCategory} onValueChange={setIssueCategory}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select category..." /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <textarea
                    value={issueDescription}
                    onChange={e => setIssueDescription(e.target.value)}
                    placeholder="Describe what happened..."
                    className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Injuries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-red-500" />
                  <Label className="text-sm">Were there any injuries?</Label>
                </div>
                <Switch checked={hadInjuries} onCheckedChange={setHadInjuries} />
              </div>
              {hadInjuries && (
                <textarea
                  value={injuryDescription}
                  onChange={e => setInjuryDescription(e.target.value)}
                  placeholder="Describe the injury..."
                  className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              )}
            </div>

            {/* Equipment Issues */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-500" />
                  <Label className="text-sm">Any equipment issues?</Label>
                </div>
                <Switch checked={hadEquipmentIssues} onCheckedChange={setHadEquipmentIssues} />
              </div>
              {hadEquipmentIssues && (
                <textarea
                  value={equipmentDescription}
                  onChange={e => setEquipmentDescription(e.target.value)}
                  placeholder="Describe the issue and affected gear..."
                  className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              )}
            </div>

            {/* Unplanned Expenses */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <Label className="text-sm">Any unplanned expenses?</Label>
                </div>
                <Switch checked={hadUnplannedExpenses} onCheckedChange={setHadUnplannedExpenses} />
              </div>
              {hadUnplannedExpenses && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    placeholder="Amount (e.g. 250.00)"
                    className="w-full border rounded-md p-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <textarea
                    value={expenseDescription}
                    onChange={e => setExpenseDescription(e.target.value)}
                    placeholder="What was it for?"
                    className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Optional Fields */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Optional</Label>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Attendance Estimate</Label>
                <input
                  type="number"
                  value={attendanceEstimate}
                  onChange={e => setAttendanceEstimate(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full border rounded-md p-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Client / Venue Contact Notes</Label>
                <textarea
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  placeholder="Notes about contacts at the venue..."
                  className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Anything to flag for next time at this venue?</Label>
                <textarea
                  value={venueNotes}
                  onChange={e => setVenueNotes(e.target.value)}
                  placeholder="Tips, warnings, or suggestions for future shows here..."
                  className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Send */}
        {step === "review" && (
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {/* Summary card */}
            <div className="bg-muted/50 rounded-md p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Report Summary</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Show: <span className="font-medium text-foreground">{selectedEvent?.name}</span></p>
                <p>Rating: <span className="font-medium text-foreground">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span></p>
                <p>Went as Planned: <span className="font-medium text-foreground">{wentAsPlanned ? "Yes" : "No"}</span></p>
                {hadInjuries && <p className="text-red-600 dark:text-red-400">Injuries reported</p>}
                {hadEquipmentIssues && <p className="text-amber-600 dark:text-amber-400">Equipment issues reported</p>}
                {hadUnplannedExpenses && <p className="text-amber-600 dark:text-amber-400">Unplanned expenses: ${expenseAmount || "—"}</p>}
              </div>
            </div>

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recipients ({selectedRecipientIds.size} of {previewRecipients.length} selected)
                </h4>
                {previewRecipients.length > 0 && (
                  <Button
                    variant="ghost" size="sm" className="h-6 text-xs px-2"
                    onClick={() => {
                      if (selectedRecipientIds.size === previewRecipients.length) {
                        setSelectedRecipientIds(new Set());
                      } else {
                        setSelectedRecipientIds(new Set(previewRecipients.map(r => r.id)));
                      }
                    }}
                  >
                    {selectedRecipientIds.size === previewRecipients.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>
              {previewRecipients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No crew members with email addresses found.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-0.5 border rounded-md p-2">
                  {[...previewRecipients].sort((a, b) => a.name.localeCompare(b.name)).map(r => {
                    const isChecked = selectedRecipientIds.has(r.id);
                    return (
                      <label
                        key={r.id}
                        className={cn(
                          "flex items-center gap-2 text-sm py-1 px-1 rounded cursor-pointer transition-colors",
                          isChecked ? "opacity-100" : "opacity-50"
                        )}
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

            {/* Additional emails */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Additional Recipients</h4>
              <textarea
                value={extraEmails}
                onChange={e => setExtraEmails(e.target.value)}
                placeholder="Add email addresses (comma or newline separated)"
                className="w-full border rounded-md p-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={2}
              />
              {parsedExtraEmails.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{parsedExtraEmails.length} additional email{parsedExtraEmails.length !== 1 ? "s" : ""}</p>
              )}
            </div>

            <Separator />

            {/* PDF Preview */}
            {pdfToken && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">PDF Preview</h4>
                <div className="border rounded-md overflow-hidden">
                  <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
                    <PdfPreview url={pdfBlobUrl || ((import.meta.env.VITE_API_URL ?? "") + `/api/after-job-reports/pdf/${pdfToken}`)} />
                  </Suspense>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {allRecipientEmails.length > 0
                ? `Report will be saved and emailed to ${allRecipientEmails.length} recipient${allRecipientEmails.length !== 1 ? "s" : ""} with PDF attachment.`
                : "Report will be saved without sending any emails. You can still add recipients above."}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0">
          {step === "select" && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => {
                  setStep("form");
                  setReportAlreadyExists(false);
                }}
                disabled={!selectedEventId}
              >Continue</Button>
            </>
          )}
          {step === "form" && (
            <>
              <Button variant="outline" onClick={showsForSelectedDate.length > 1 ? () => setStep("select") : onClose}>
                {showsForSelectedDate.length > 1 ? "Back" : "Cancel"}
              </Button>
              <Button
                onClick={handleGoToReview}
                disabled={!isFormValid || loading || reportAlreadyExists}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  "Review & Send"
                )}
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")} disabled={submitting}>
                Back
              </Button>
              <Button
                onClick={handleSubmitAndSend}
                disabled={submitting}
              >
                {submitting ? (
                  "Submitting..."
                ) : allRecipientEmails.length > 0 ? (
                  <><Send className="mr-2 h-4 w-4" /> Save & Send to {allRecipientEmails.length}</>
                ) : (
                  "Save Report"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
