import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Users, Plus, Send, Trash2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/hooks/use-contacts";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { TimesheetEntry, DailyCheckin, Contact } from "@shared/schema";

const PdfPreview = lazy(() => import("@/components/PdfPreview"));

// ── Time utilities ────────────────────────────────────────────────────────────

function parseTimeToMinutes(str: string): number | null {
  if (!str || !str.trim()) return null;
  const clean = str.trim().toUpperCase();
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24 && !clean.includes("AM") && !clean.includes("PM")) {
    const hours = parseInt(match24[1]);
    const minutes = parseInt(match24[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) return hours * 60 + minutes;
  }
  const match = clean.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM|A|P)?$/);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const period = match[3];
  if (period === "PM" || period === "P") { if (hours !== 12) hours += 12; }
  else if (period === "AM" || period === "A") { if (hours === 12) hours = 0; }
  return hours * 60 + minutes;
}

function punchTimeToHHMM(ts: string | Date | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts as string);
  if (isNaN(d.getTime())) return "";
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function timeTo24(str: string): string {
  if (!str || !str.trim()) return "";
  const minutes = parseTimeToMinutes(str);
  if (minutes === null) return str;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function calcTotalHours(timeIn: string, timeOut: string, mealOut: string, mealIn: string, paidBreak: boolean): string {
  const tIn = parseTimeToMinutes(timeIn);
  const tOut = parseTimeToMinutes(timeOut);
  if (tIn === null || tOut === null) return "";
  let totalMinutes = tOut >= tIn ? tOut - tIn : (1440 - tIn) + tOut;
  if (!paidBreak) {
    const mOut = parseTimeToMinutes(mealOut);
    const mIn = parseTimeToMinutes(mealIn);
    if (mOut !== null && mIn !== null) {
      const breakMinutes = mIn >= mOut ? mIn - mOut : (1440 - mOut) + mIn;
      totalMinutes -= breakMinutes;
    }
  }
  if (totalMinutes <= 0) return "0";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// ── TimesheetRow ──────────────────────────────────────────────────────────────

function TimesheetRow({
  entry,
  onUpdate,
  onDelete,
  readOnly,
  initialsOnly,
}: {
  entry: TimesheetEntry;
  onUpdate: (entry: TimesheetEntry, field: string, value: string | boolean) => void;
  onDelete: () => void;
  readOnly?: boolean;
  initialsOnly?: boolean;
}) {
  const [local, setLocal] = useState({
    employeeName: entry.employeeName,
    position: entry.position || "",
    timeIn: timeTo24(entry.timeIn || ""),
    mealBreakOut: timeTo24(entry.mealBreakOut || ""),
    mealBreakIn: timeTo24(entry.mealBreakIn || ""),
    timeOut: timeTo24(entry.timeOut || ""),
    initials: entry.initials || "",
  });

  useEffect(() => {
    setLocal({
      employeeName: entry.employeeName,
      position: entry.position || "",
      timeIn: timeTo24(entry.timeIn || ""),
      mealBreakOut: timeTo24(entry.mealBreakOut || ""),
      mealBreakIn: timeTo24(entry.mealBreakIn || ""),
      timeOut: timeTo24(entry.timeOut || ""),
      initials: entry.initials || "",
    });
  }, [entry.id, entry.employeeName, entry.position, entry.timeIn, entry.mealBreakOut, entry.mealBreakIn, entry.timeOut, entry.initials]);

  const handleChange = (field: string, value: string) => {
    setLocal(prev => ({ ...prev, [field]: value }));
    onUpdate({ ...entry, ...local, [field]: value }, field, value);
  };

  const totalDisplay = calcTotalHours(local.timeIn, local.timeOut, local.mealBreakOut, local.mealBreakIn, entry.paidMealBreak !== false);

  const cellClass = "p-1";
  const roText = "px-2 py-1.5 text-sm text-muted-foreground";

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className={cellClass}>
        {readOnly
          ? <span className={roText}>{local.employeeName}</span>
          : <Input className="h-8 text-sm" value={local.employeeName} onChange={e => handleChange("employeeName", e.target.value)} placeholder="Name" />}
      </td>
      <td className={cellClass}>
        {readOnly
          ? <span className={roText}>{local.position || "—"}</span>
          : <Input className="h-8 text-sm" value={local.position} onChange={e => handleChange("position", e.target.value)} placeholder="Position" />}
      </td>
      <td className={cellClass}>
        {readOnly
          ? <span className={cn(roText, "block text-center")}>{local.timeIn || "—"}</span>
          : <TimePicker compact value={local.timeIn} onChange={v => handleChange("timeIn", v)} />}
      </td>
      <td className={cellClass}>
        {readOnly
          ? <span className={cn(roText, "block text-center")}>{local.mealBreakOut || "—"}</span>
          : <TimePicker compact clearable value={local.mealBreakOut} onChange={v => handleChange("mealBreakOut", v)} />}
      </td>
      <td className={cellClass}>
        {readOnly
          ? <span className={cn(roText, "block text-center")}>{local.mealBreakIn || "—"}</span>
          : <TimePicker compact clearable value={local.mealBreakIn} onChange={v => handleChange("mealBreakIn", v)} />}
      </td>
      <td className={cellClass}>
        {readOnly
          ? <span className={cn(roText, "block text-center")}>{local.timeOut || "—"}</span>
          : <TimePicker compact value={local.timeOut} onChange={v => handleChange("timeOut", v)} />}
      </td>
      <td className={`${cellClass} text-center`}>
        {readOnly
          ? <span className={cn("text-xs font-medium", entry.paidMealBreak !== false ? "text-green-600" : "text-orange-500")}>{entry.paidMealBreak !== false ? "Paid" : "Unpaid"}</span>
          : <Button variant="ghost" size="sm" className={cn("h-8 text-xs font-medium", entry.paidMealBreak !== false ? "text-green-600" : "text-orange-500")} onClick={() => onUpdate(entry, "paidMealBreak", entry.paidMealBreak === false)}>
              {entry.paidMealBreak !== false ? "Paid" : "Unpaid"}
            </Button>}
      </td>
      <td className={`${cellClass} text-center`}>
        <span className="text-sm font-medium">{totalDisplay || "—"}</span>
      </td>
      <td className={cellClass}>
        {/* Crew can always sign their own initials */}
        <Input
          className="h-8 text-sm text-center"
          value={local.initials}
          onChange={e => handleChange("initials", e.target.value)}
          placeholder="—"
          disabled={readOnly && !initialsOnly}
        />
      </td>
      {!readOnly && (
        <td className={cellClass}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </td>
      )}
    </tr>
  );
}

// ── Main TimesheetTab ─────────────────────────────────────────────────────────

interface TimesheetTabProps {
  eventId: number;
  eventName: string;
  date: string;
  isAdmin: boolean;
  currentUserName?: string; // "First Last" — for crew row filtering
}

export function TimesheetTab({ eventId, eventName, date, isAdmin, currentUserName }: TimesheetTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: contacts = [] } = useContacts();
  const { data: allEventAssignments = [] } = useQuery<any[]>({ queryKey: ["/api/event-assignments"] });

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendEmails, setSendEmails] = useState("");
  const [pdfToken, setPdfToken] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const { data: entries = [], isLoading } = useQuery<TimesheetEntry[]>({
    queryKey: ["/api/timesheet-entries", eventId, date],
    queryFn: async () => {
      const params = new URLSearchParams({ eventId: String(eventId), date });
      const res = await fetch(`/api/timesheet-entries?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!eventId && !!date,
  });

  const { data: punchRecords = [] } = useQuery<DailyCheckin[]>({
    queryKey: ["/api/daily-checkins", eventName, date],
    queryFn: async () => {
      const params = new URLSearchParams({ eventName, date });
      const res = await fetch(`/api/daily-checkins?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!eventName && !!date && isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/timesheet-entries", data); return res.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/timesheet-entries", eventId, date] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await apiRequest("PATCH", `/api/timesheet-entries/${id}`, data); return res.json(); },
    onSuccess: (updated: TimesheetEntry) => {
      queryClient.setQueryData(
        ["/api/timesheet-entries", eventId, date],
        (old: TimesheetEntry[] | undefined) => old ? old.map(e => e.id === updated.id ? updated : e) : old
      );
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/timesheet-entries/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/timesheet-entries", eventId, date] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const debouncedUpdate = useCallback((() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    return (id: number, field: string, updates: any) => {
      const key = `${id}-${field}`;
      const existing = timers.get(key);
      if (existing) clearTimeout(existing);
      timers.set(key, setTimeout(() => { updateMutation.mutate({ id, data: updates }); timers.delete(key); }, 500));
    };
  })(), [updateMutation]);

  const handleFieldChange = (entry: TimesheetEntry, field: string, value: string | boolean) => {
    const updates: any = { [field]: value };
    const updatedEntry = { ...entry, [field]: value };
    const total = calcTotalHours(updatedEntry.timeIn || "", updatedEntry.timeOut || "", updatedEntry.mealBreakOut || "", updatedEntry.mealBreakIn || "", updatedEntry.paidMealBreak !== false);
    updates.totalHours = total;
    if (typeof value === "boolean") updateMutation.mutate({ id: entry.id, data: updates });
    else debouncedUpdate(entry.id, field, updates);
  };

  const handleAutoPopulate = () => {
    const assignedUserIds = allEventAssignments.filter((a: any) => a.eventName === eventName).map((a: any) => a.userId);
    const existingNames = new Set(entries.map(e => e.employeeName.toLowerCase()));
    const crewToAdd = (contacts as Contact[])
      .filter(c => c.userId && assignedUserIds.includes(c.userId))
      .filter(c => { const name = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase(); return !existingNames.has(name); });

    crewToAdd.forEach(c => {
      const assignment = allEventAssignments.find((a: any) => a.eventName === eventName && a.userId === c.userId);
      const punch = (punchRecords as DailyCheckin[]).find(p => p.userId === c.userId);
      const timeIn = punchTimeToHHMM(punch?.checkedInAt);
      const mealBreakOut = punchTimeToHHMM(punch?.lunchOutAt);
      const mealBreakIn = punchTimeToHHMM(punch?.lunchInAt);
      const timeOut = punchTimeToHHMM(punch?.checkedOutAt);
      const totalHours = calcTotalHours(timeIn, timeOut, mealBreakOut, mealBreakIn, true);
      createMutation.mutate({
        eventId, date,
        employeeName: [c.firstName, c.lastName].filter(Boolean).join(" "),
        position: assignment?.position || "",
        ...(timeIn && { timeIn }), ...(mealBreakOut && { mealBreakOut }),
        ...(mealBreakIn && { mealBreakIn }), ...(timeOut && { timeOut }),
        ...(totalHours && { totalHours }),
      });
    });

    if (crewToAdd.length === 0) {
      toast({ title: "No new crew", description: "All assigned crew are already on the sheet." });
    } else {
      const punchCount = crewToAdd.filter(c => (punchRecords as DailyCheckin[]).some(p => p.userId === c.userId)).length;
      toast({ title: "Crew Added", description: punchCount > 0 ? `Added ${crewToAdd.length} crew, ${punchCount} with punch times.` : `Added ${crewToAdd.length} crew member(s).` });
    }
  };

  const handleFillFromPunches = () => {
    if ((punchRecords as DailyCheckin[]).length === 0) {
      toast({ title: "No punch data", description: "No punch records found for this show and date.", variant: "destructive" });
      return;
    }
    const contactsByName = new Map<string, Contact>();
    (contacts as Contact[]).forEach(c => { const name = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase(); if (c.userId) contactsByName.set(name, c); });
    let filled = 0;
    entries.forEach(entry => {
      const contact = contactsByName.get(entry.employeeName.toLowerCase());
      if (!contact?.userId) return;
      const punch = (punchRecords as DailyCheckin[]).find(p => p.userId === contact.userId);
      if (!punch) return;
      const updates: any = {};
      if (!entry.timeIn && punch.checkedInAt) updates.timeIn = punchTimeToHHMM(punch.checkedInAt);
      if (!entry.mealBreakOut && punch.lunchOutAt) updates.mealBreakOut = punchTimeToHHMM(punch.lunchOutAt);
      if (!entry.mealBreakIn && punch.lunchInAt) updates.mealBreakIn = punchTimeToHHMM(punch.lunchInAt);
      if (!entry.timeOut && punch.checkedOutAt) updates.timeOut = punchTimeToHHMM(punch.checkedOutAt);
      if (Object.keys(updates).length === 0) return;
      const total = calcTotalHours(updates.timeIn ?? entry.timeIn ?? "", updates.timeOut ?? entry.timeOut ?? "", updates.mealBreakOut ?? entry.mealBreakOut ?? "", updates.mealBreakIn ?? entry.mealBreakIn ?? "", entry.paidMealBreak !== false);
      if (total) updates.totalHours = total;
      updateMutation.mutate({ id: entry.id, data: updates });
      filled++;
    });
    if (filled === 0) toast({ title: "Nothing to fill", description: "All rows already have times, or no punch records matched." });
    else toast({ title: "Times Filled", description: `Updated ${filled} row(s) from punch records.` });
  };

  const handleAddRow = () => {
    createMutation.mutate({ eventId, date, employeeName: "", position: "" });
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setPdfToken(null);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
    try {
      const res = await apiRequest("POST", "/api/timesheet/preview", { eventId, date });
      const data = await res.json();
      setPdfToken(data.pdfToken);
      const pdfRes = await fetch(`/api/timesheet/pdf/${data.pdfToken}`);
      if (pdfRes.ok) { const blob = await pdfRes.blob(); setPdfBlobUrl(URL.createObjectURL(blob)); }
      setSendDialogOpen(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    const emailList = sendEmails.split(/[,;\s]+/).filter(e => e.includes("@"));
    if (emailList.length === 0) { toast({ title: "No emails", description: "Enter at least one email address.", variant: "destructive" }); return; }
    setSending(true);
    try {
      await apiRequest("POST", "/api/timesheet/send", { eventId, date, emails: emailList });
      toast({ title: "Sent", description: `Time sheet sent to ${emailList.length} recipient(s).` });
      setSendDialogOpen(false);
      setSendEmails("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // For crew: only show their own row
  const userNameLower = currentUserName?.toLowerCase();
  const visibleEntries = isAdmin
    ? entries
    : entries.filter(e => e.employeeName.toLowerCase() === userNameLower);

  return (
    <div className="space-y-4">
      {/* Action bar — admin only */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleAutoPopulate} data-testid="button-ts-auto-populate">
            <Users className="w-3.5 h-3.5 mr-1.5" /> Auto-Populate Crew
          </Button>
          <Button size="sm" variant="outline" onClick={handleFillFromPunches} disabled={entries.length === 0} data-testid="button-ts-fill-punches">
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Fill from Punches
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddRow} data-testid="button-ts-add-row">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Row
          </Button>
          <Button size="sm" onClick={handlePreview} disabled={previewing || entries.length === 0} data-testid="button-ts-preview">
            {previewing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            Preview & Send
          </Button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">
          <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />
          Loading...
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {isAdmin
              ? `No time entries yet. Click "Auto-Populate Crew" to add assigned crew or "Add Row" for a blank entry.`
              : "No time sheet entry found for you on this show and date."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 font-medium text-xs uppercase tracking-wide w-[160px]">Employee</th>
                <th className="text-left p-2 font-medium text-xs uppercase tracking-wide w-[120px]">Position</th>
                <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Time In</th>
                <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Meal Out</th>
                <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Meal In</th>
                <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[90px]">Time Out</th>
                <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[70px]">Break</th>
                <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[70px]">Total</th>
                <th className="text-center p-2 font-medium text-xs uppercase tracking-wide w-[70px]">Initials</th>
                {isAdmin && <th className="w-[40px]" />}
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map(entry => (
                <TimesheetRow
                  key={entry.id}
                  entry={entry}
                  onUpdate={handleFieldChange}
                  onDelete={() => deleteMutation.mutate(entry.id)}
                  readOnly={!isAdmin}
                  initialsOnly={!isAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview & Send dialog — admin only */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide text-primary">Time Sheet PDF</DialogTitle>
            <DialogDescription>Preview and send the time sheet via email.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {pdfToken && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PDF Preview</h4>
                  <Button variant="outline" size="sm" asChild>
                    <a href={pdfBlobUrl || `/api/timesheet/pdf/${pdfToken}`} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3 mr-1" /> Open PDF
                    </a>
                  </Button>
                </div>
                <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
                  <PdfPreview url={pdfBlobUrl || `/api/timesheet/pdf/${pdfToken}`} />
                </Suspense>
              </div>
            )}
          </div>
          <div className="space-y-3 flex-shrink-0">
            <div>
              <label className="text-sm font-medium">Send to (comma-separated emails)</label>
              <Input value={sendEmails} onChange={e => setSendEmails(e.target.value)} placeholder="email@example.com, another@example.com" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Close</Button>
              <Button onClick={handleSend} disabled={sending || !sendEmails.trim()}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
