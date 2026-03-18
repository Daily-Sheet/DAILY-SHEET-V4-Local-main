import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBulkImportContacts } from "@/hooks/use-contacts";
import type { InsertContact } from "@shared/schema";

const CONTACT_FIELDS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: false },
  { key: "role", label: "Role Group", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

type FieldKey = typeof CONTACT_FIELDS[number]["key"];

const SKIP_VALUE = "__skip__";

export function ImportContactsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "result">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { mutate: bulkImport, isPending } = useBulkImportContacts();

  function resetState() {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({ firstName: "", lastName: "", role: "", email: "", phone: "", notes: "" });
    setImportResult(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          toast({ title: "Empty File", description: "The spreadsheet has no data rows.", variant: "destructive" });
          return;
        }

        const columnHeaders = Object.keys(jsonData[0]);
        setHeaders(columnHeaders);
        setRows(jsonData);

        const autoMapping: Record<FieldKey, string> = { firstName: "", lastName: "", role: "", email: "", phone: "", notes: "" };
        for (const header of columnHeaders) {
          const lower = header.toLowerCase().trim();
          if ((lower === "first name" || lower === "firstname" || lower === "first") && !autoMapping.firstName) autoMapping.firstName = header;
          else if ((lower === "last name" || lower === "lastname" || lower === "last") && !autoMapping.lastName) autoMapping.lastName = header;
          else if ((lower === "name" || lower === "full name" || lower === "fullname") && !autoMapping.firstName) autoMapping.firstName = header;
          else if ((lower.includes("role") || lower.includes("group") || lower.includes("department") || lower.includes("title") || lower.includes("position")) && !autoMapping.role) autoMapping.role = header;
          else if ((lower.includes("email") || lower.includes("e-mail")) && !autoMapping.email) autoMapping.email = header;
          else if ((lower.includes("phone") || lower.includes("mobile") || lower.includes("cell") || lower.includes("tel")) && !autoMapping.phone) autoMapping.phone = header;
          else if ((lower.includes("note") || lower.includes("comment") || lower.includes("detail")) && !autoMapping.notes) autoMapping.notes = header;
        }
        setMapping(autoMapping);
        setStep("map");
      } catch {
        toast({ title: "Error", description: "Could not read this file. Please use an Excel (.xlsx) or CSV file.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function getMappedContacts(): InsertContact[] {
    return rows.map((row) => ({
      firstName: (mapping.firstName ? String(row[mapping.firstName] || "").trim() : "") || "Unknown",
      lastName: mapping.lastName && mapping.lastName !== SKIP_VALUE ? String(row[mapping.lastName] || "").trim() || null : null,
      role: (mapping.role ? String(row[mapping.role] || "").trim() : "") || "Crew",
      email: mapping.email && mapping.email !== SKIP_VALUE ? String(row[mapping.email] || "").trim() || null : null,
      phone: mapping.phone && mapping.phone !== SKIP_VALUE ? String(row[mapping.phone] || "").trim() || null : null,
      notes: mapping.notes && mapping.notes !== SKIP_VALUE ? String(row[mapping.notes] || "").trim() || null : null,
    }));
  }

  function handleImport() {
    const contacts = getMappedContacts();
    bulkImport(contacts, {
      onSuccess: (result) => {
        setImportResult(result);
        setStep("result");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to import contacts.", variant: "destructive" });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Contacts from Spreadsheet
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to bulk import your employee list.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="py-8">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Choose a file to upload</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()} data-testid="button-choose-import-file">
                <Upload className="mr-2 h-4 w-4" /> Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-import-file"
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p>Your spreadsheet should have columns for employee information like:</p>
              <p className="font-medium">First Name, Last Name, Role/Title, Email, Phone, Notes</p>
              <p>Column headers will be automatically matched to contact fields.</p>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Found {rows.length} rows with {headers.length} columns
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Map your spreadsheet columns to contact fields:</p>
              {CONTACT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3 flex-wrap">
                  <div className="w-24 text-sm font-medium flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </div>
                  <Select
                    value={mapping[field.key] || SKIP_VALUE}
                    onValueChange={(v) => setMapping((prev) => ({ ...prev, [field.key]: v === SKIP_VALUE ? "" : v }))}
                  >
                    <SelectTrigger className="flex-1" data-testid={`select-map-${field.key}`}>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP_VALUE}>{field.required ? "-- Select column --" : "-- Skip --"}</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="border rounded-lg overflow-hidden mt-4">
              <p className="text-sm font-medium p-3 bg-muted/50">Preview (first 5 rows)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {CONTACT_FIELDS.map((f) => (
                        <th key={f.key} className="text-left px-3 py-2 font-medium">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getMappedContacts().slice(0, 5).map((contact, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2">{contact.firstName}</td>
                        <td className="px-3 py-2">{contact.lastName || "—"}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">{contact.role}</Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{contact.email || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{contact.phone || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{contact.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-lg font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {importResult.imported} of {rows.length} contacts
                </p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="border border-destructive/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {importResult.errors.length} rows had issues:
                </div>
                <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground space-y-0.5">
                  {importResult.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")} data-testid="button-import-back">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!mapping.firstName || !mapping.role || isPending}
                data-testid="button-import-contacts"
              >
                {isPending ? "Importing..." : `Import ${rows.length} Contacts`}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => { resetState(); onOpenChange(false); }} data-testid="button-import-done">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
