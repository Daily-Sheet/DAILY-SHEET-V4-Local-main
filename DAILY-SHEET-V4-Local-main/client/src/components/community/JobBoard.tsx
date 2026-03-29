import { useState, useMemo } from "react";
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob, useApplyToJob, useWithdrawApplication, useJobApplications, useReviewApplication, type JobWithApplicationInfo } from "@/hooks/use-jobs";
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
import { cn } from "@/lib/utils";
import {
  Search, Plus, Pencil, Briefcase, MapPin, Calendar, DollarSign, Users, Check, X, Clock, Send,
} from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import type { JobApplication } from "@shared/schema";

const PAY_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "hourly", label: "Hourly" },
  { value: "flat", label: "Flat Rate" },
  { value: "tbd", label: "TBD" },
];

function statusBadge(status: string) {
  switch (status) {
    case "open": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">Open</Badge>;
    case "closed": return <Badge variant="secondary" className="text-[10px]">Closed</Badge>;
    case "filled": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Filled</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function appStatusBadge(status: string) {
  switch (status) {
    case "pending": return <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-600">Pending</Badge>;
    case "approved": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">Approved</Badge>;
    case "rejected": return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">Rejected</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function JobCard({
  job, canManage, onEdit, onDelete, onApply, onViewApps,
}: {
  job: JobWithApplicationInfo;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onApply: () => void;
  onViewApps: () => void;
}) {
  const payLabel = job.payRate ? `${job.payRate}${job.payType && job.payType !== "tbd" ? `/${job.payType === "flat" ? "flat" : job.payType}` : ""}` : null;

  return (
    <Card className="group hover:border-primary/20 transition-all">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{job.title}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{job.position}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {statusBadge(job.status)}
          </div>
        </div>

        {job.postedByName && (
          <p className="text-[11px] text-muted-foreground">Posted by {job.postedByName}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
          )}
          {(job.dates || job.startDate) && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {job.dates || `${job.startDate}${job.endDate ? ` - ${job.endDate}` : ""}`}
            </span>
          )}
          {payLabel && (
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{payLabel}</span>
          )}
        </div>

        {job.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          {job.status === "open" && !job.myApplication && (
            <Button variant="default" size="sm" className="h-7 text-xs" onClick={onApply}>
              <Send className="w-3 h-3 mr-1" />Apply
            </Button>
          )}
          {job.myApplication && (
            <div className="flex items-center gap-1.5">
              {appStatusBadge(job.myApplication.status)}
              <span className="text-[10px] text-muted-foreground">Applied</span>
            </div>
          )}
          {canManage && (
            <>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onViewApps}>
                <Users className="w-3 h-3 mr-1" />{job.applicationCount} Apps
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={onEdit}>
                <Pencil className="w-3 h-3 mr-1" />Edit
              </Button>
              <ConfirmDelete
                onConfirm={onDelete}
                title="Delete job listing?"
                description={`Remove "${job.title}" and all applications?`}
                triggerClassName="opacity-0 group-hover:opacity-100 text-destructive transition-all"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function JobFormDialog({
  open, onOpenChange, job,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobWithApplicationInfo | null;
}) {
  const { toast } = useToast();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const isEdit = !!job;

  const [title, setTitle] = useState(job?.title || "");
  const [position, setPosition] = useState(job?.position || "");
  const [description, setDescription] = useState(job?.description || "");
  const [location, setLocation] = useState(job?.location || "");
  const [dates, setDates] = useState(job?.dates || "");
  const [payRate, setPayRate] = useState(job?.payRate || "");
  const [payType, setPayType] = useState(job?.payType || "daily");
  const [visibility, setVisibility] = useState(job?.visibility || "public");
  const [status, setStatus] = useState(job?.status || "open");

  function handleSubmit() {
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (!position.trim()) { toast({ title: "Position is required", variant: "destructive" }); return; }
    const data = {
      title, position, description: description || null, location: location || null,
      dates: dates || null, payRate: payRate || null, payType: payType || null,
      visibility, status,
    };
    if (isEdit && job) {
      updateJob.mutate({ id: job.id, ...data }, {
        onSuccess: () => { toast({ title: "Job updated" }); onOpenChange(false); },
        onError: () => toast({ title: "Error updating job", variant: "destructive" }),
      });
    } else {
      createJob.mutate(data, {
        onSuccess: () => { toast({ title: "Job posted" }); onOpenChange(false); },
        onError: () => toast({ title: "Error posting job", variant: "destructive" }),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] font-body max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">
            {isEdit ? "Edit Job" : "Post a Job"}
          </DialogTitle>
          <DialogDescription className="sr-only">{isEdit ? "Edit job listing" : "Post a new job listing"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-1 -m-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Stage Hand Needed — Ryman Auditorium" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Position *</Label>
              <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Stagehand / A1 / Lighting Tech" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Job details, requirements, what to bring..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Nashville, TN" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dates</Label>
              <Input value={dates} onChange={e => setDates(e.target.value)} placeholder="Mar 28-30, 2026" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pay Rate</Label>
              <Input value={payRate} onChange={e => setPayRate(e.target.value)} placeholder="$400" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pay Type</Label>
              <Select value={payType} onValueChange={setPayType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAY_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="workspace">Workspace Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={createJob.isPending || updateJob.isPending} className="w-full">
            {(createJob.isPending || updateJob.isPending) ? "Saving..." : isEdit ? "Save Changes" : "Post Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplyDialog({
  open, onOpenChange, job,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobWithApplicationInfo | null;
}) {
  const { toast } = useToast();
  const applyToJob = useApplyToJob();
  const withdrawApp = useWithdrawApplication();
  const [message, setMessage] = useState("");

  if (!job) return null;

  const hasApplied = !!job.myApplication;

  function handleApply() {
    applyToJob.mutate({ jobId: job!.id, message: message || undefined }, {
      onSuccess: () => { toast({ title: "Application submitted!" }); onOpenChange(false); setMessage(""); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleWithdraw() {
    withdrawApp.mutate(job!.id, {
      onSuccess: () => { toast({ title: "Application withdrawn" }); onOpenChange(false); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wide text-primary">
            {hasApplied ? "Your Application" : `Apply — ${job.title}`}
          </DialogTitle>
          <DialogDescription className="sr-only">Apply to this job</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm">
            <p className="font-medium">{job.title}</p>
            <p className="text-xs text-muted-foreground">{job.position}{job.location ? ` — ${job.location}` : ""}</p>
          </div>
          {hasApplied ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                {appStatusBadge(job.myApplication!.status)}
              </div>
              {job.myApplication!.message && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">{job.myApplication!.message}</p>
              )}
              {job.myApplication!.status === "pending" && (
                <Button variant="outline" onClick={handleWithdraw} disabled={withdrawApp.isPending} className="w-full">
                  {withdrawApp.isPending ? "Withdrawing..." : "Withdraw Application"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Optional message to the hiring manager..." rows={3} />
              <Button onClick={handleApply} disabled={applyToJob.isPending} className="w-full">
                {applyToJob.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationsDialog({
  open, onOpenChange, job,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobWithApplicationInfo | null;
}) {
  const { toast } = useToast();
  const { data: applications, isLoading } = useJobApplications(job?.id ?? null);
  const reviewApp = useReviewApplication();

  if (!job) return null;

  function handleReview(app: JobApplication, status: "approved" | "rejected") {
    reviewApp.mutate({ jobId: job!.id, appId: app.id, status }, {
      onSuccess: () => toast({ title: `Application ${status}` }),
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] font-body max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wide text-primary">
            Applications — {job.title}
          </DialogTitle>
          <DialogDescription className="sr-only">Review applications for this job</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : !applications?.length ? (
          <div className="p-4 text-center text-muted-foreground">No applications yet.</div>
        ) : (
          <div className="space-y-3 p-1 -m-1">
            {applications.map(app => (
              <div key={app.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-sm">{app.userName || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {appStatusBadge(app.status)}
                </div>
                {app.message && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{app.message}</p>
                )}
                {app.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleReview(app, "approved")} disabled={reviewApp.isPending}>
                      <Check className="w-3 h-3 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReview(app, "rejected")} disabled={reviewApp.isPending}>
                      <X className="w-3 h-3 mr-1" />Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function JobBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: jobs, isLoading } = useJobs();
  const deleteJob = useDeleteJob();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithApplicationInfo | null>(null);
  const [applyingJob, setApplyingJob] = useState<JobWithApplicationInfo | null>(null);
  const [viewingAppsJob, setViewingAppsJob] = useState<JobWithApplicationInfo | null>(null);

  const canManage = ["owner", "manager", "admin"].includes(user?.role || "");

  const filtered = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter(j => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return j.title.toLowerCase().includes(q) ||
          j.position.toLowerCase().includes(q) ||
          (j.location && j.location.toLowerCase().includes(q)) ||
          (j.postedByName && j.postedByName.toLowerCase().includes(q));
      }
      return true;
    });
  }, [jobs, search, statusFilter]);

  function handleDelete(id: number) {
    deleteJob.mutate(id, {
      onSuccess: () => toast({ title: "Job deleted" }),
      onError: () => toast({ title: "Error deleting job", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <span className="font-display text-lg uppercase tracking-wide">Job Board</span>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setEditingJob(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />Post Job
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading jobs...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          {jobs?.length === 0 ? "No jobs posted yet." : "No jobs match your search."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(j => (
            <JobCard
              key={j.id}
              job={j}
              canManage={canManage && j.workspaceId === user?.workspaceId}
              onEdit={() => { setEditingJob(j); setFormOpen(true); }}
              onDelete={() => handleDelete(j.id)}
              onApply={() => setApplyingJob(j)}
              onViewApps={() => setViewingAppsJob(j)}
            />
          ))}
        </div>
      )}

      <JobFormDialog
        key={editingJob?.id || "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        job={editingJob}
      />

      <ApplyDialog
        open={!!applyingJob}
        onOpenChange={(open) => { if (!open) setApplyingJob(null); }}
        job={applyingJob}
      />

      <ApplicationsDialog
        open={!!viewingAppsJob}
        onOpenChange={(open) => { if (!open) setViewingAppsJob(null); }}
        job={viewingAppsJob}
      />
    </div>
  );
}
