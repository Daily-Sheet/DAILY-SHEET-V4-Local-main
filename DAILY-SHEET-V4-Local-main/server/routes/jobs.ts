import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { checkAchievements } from "../achievements/engine";
import { emitDomainEvent } from "../ws/eventBus";

export function registerJobRoutes(app: Express, _upload: multer.Multer) {
  // List jobs: public + own workspace private
  app.get("/api/jobs", isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const all = await storage.getJobListings();
    const visible = all.filter(j =>
      j.visibility === "public" || j.workspaceId === workspaceId
    );
    // Enrich with application counts for own workspace jobs
    const enriched = await Promise.all(visible.map(async (j) => {
      const apps = await storage.getJobApplications(j.id);
      return {
        ...j,
        applicationCount: apps.length,
        myApplication: apps.find(a => a.userId === req.user.id) || null,
      };
    }));
    res.json(enriched);
  });

  // Get single job
  app.get("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const job = await storage.getJobListing(id);
    if (!job) return res.status(404).json({ message: "Not found" });
    if (job.visibility !== "public" && job.workspaceId !== req.user.workspaceId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const apps = await storage.getJobApplications(id);
    res.json({
      ...job,
      applicationCount: apps.length,
      myApplication: apps.find(a => a.userId === req.user.id) || null,
    });
  });

  // Create job (owner/manager/admin)
  app.post("/api/jobs", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Only owners, managers, or admins can post jobs" });
    }
    const { title, position, description, eventId, projectId, location, dates, startDate, endDate, payRate, payType, visibility } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    if (!position?.trim()) return res.status(400).json({ message: "Position is required" });

    const userName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Anonymous";
    const job = await storage.createJobListing({
      workspaceId: req.user.workspaceId,
      postedBy: req.user.id,
      postedByName: userName,
      title: title.trim(),
      position: position.trim(),
      description: description || null,
      eventId: eventId || null,
      projectId: projectId || null,
      location: location || null,
      dates: dates || null,
      startDate: startDate || null,
      endDate: endDate || null,
      payRate: payRate || null,
      payType: payType || null,
      visibility: visibility || "public",
      status: "open",
    });

    checkAchievements(req.user.id, "job:posted", {
      workspaceId: req.user.workspaceId,
      actorName: userName,
    }).catch(() => {});

    res.status(201).json(job);
  });

  // Update job (owner/manager/admin, owning workspace)
  app.patch("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const id = parseInt(req.params.id);
    const job = await storage.getJobListing(id);
    if (!job) return res.status(404).json({ message: "Not found" });
    if (job.workspaceId !== req.user.workspaceId) return res.status(403).json({ message: "Forbidden" });

    const { title, position, description, eventId, projectId, location, dates, startDate, endDate, payRate, payType, visibility, status } = req.body;
    const updated = await storage.updateJobListing(id, {
      ...(title !== undefined && { title: title.trim() }),
      ...(position !== undefined && { position: position.trim() }),
      ...(description !== undefined && { description }),
      ...(eventId !== undefined && { eventId }),
      ...(projectId !== undefined && { projectId }),
      ...(location !== undefined && { location }),
      ...(dates !== undefined && { dates }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(payRate !== undefined && { payRate }),
      ...(payType !== undefined && { payType }),
      ...(visibility !== undefined && { visibility }),
      ...(status !== undefined && { status }),
    });
    res.json(updated);
  });

  // Delete job (owner/manager/admin, owning workspace)
  app.delete("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const id = parseInt(req.params.id);
    const job = await storage.getJobListing(id);
    if (!job) return res.status(404).json({ message: "Not found" });
    if (job.workspaceId !== req.user.workspaceId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteJobListing(id);
    res.sendStatus(204);
  });

  // Apply to a job
  app.post("/api/jobs/:id/apply", isAuthenticated, async (req: any, res) => {
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobListing(jobId);
    if (!job) return res.status(404).json({ message: "Not found" });
    if (job.status !== "open") return res.status(400).json({ message: "This job is no longer accepting applications" });

    // Check if already applied
    const existing = await storage.getJobApplications(jobId);
    if (existing.find(a => a.userId === req.user.id)) {
      return res.status(400).json({ message: "Already applied" });
    }

    const userName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Anonymous";
    const application = await storage.createJobApplication({
      jobId,
      userId: req.user.id,
      userName,
      message: req.body.message || null,
      status: "pending",
    });

    checkAchievements(req.user.id, "job:applied", {
      workspaceId: req.user.workspaceId,
      actorName: userName,
    }).catch(() => {});

    res.status(201).json(application);
  });

  // Withdraw application
  app.delete("/api/jobs/:id/apply", isAuthenticated, async (req: any, res) => {
    const jobId = parseInt(req.params.id);
    const apps = await storage.getJobApplications(jobId);
    const mine = apps.find(a => a.userId === req.user.id);
    if (!mine) return res.status(404).json({ message: "No application found" });
    if (mine.status !== "pending") return res.status(400).json({ message: "Cannot withdraw a reviewed application" });
    await storage.deleteJobApplication(mine.id);
    res.sendStatus(204);
  });

  // Get applications for a job (owner/manager/admin of owning workspace)
  app.get("/api/jobs/:id/applications", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobListing(jobId);
    if (!job) return res.status(404).json({ message: "Not found" });
    if (job.workspaceId !== req.user.workspaceId) return res.status(403).json({ message: "Forbidden" });
    const apps = await storage.getJobApplications(jobId);
    res.json(apps);
  });

  // Review application (approve/reject)
  app.patch("/api/jobs/:id/applications/:appId", isAuthenticated, async (req: any, res) => {
    const role = req.user.role;
    if (!["owner", "manager", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const jobId = parseInt(req.params.id);
    const appId = parseInt(req.params.appId);
    const job = await storage.getJobListing(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.workspaceId !== req.user.workspaceId) return res.status(403).json({ message: "Forbidden" });

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const updated = await storage.updateJobApplication(appId, {
      status,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });

    const reviewerName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email || "Anonymous";

    // On approval: trigger achievement + auto-create event assignment if job has eventId
    if (status === "approved") {
      checkAchievements(updated.userId, "job:approved", {
        workspaceId: req.user.workspaceId,
        actorName: updated.userName || "Crew",
      }).catch(() => {});

      // Auto-assign to event if the job listing references one
      if (job.eventId) {
        try {
          const event = await storage.getEvent(job.eventId);
          if (event) {
            await storage.createAssignment({
              userId: updated.userId,
              eventName: event.name,
              workspaceId: job.workspaceId,
              position: job.position || null,
            });

            emitDomainEvent({
              type: "crew:assigned",
              workspaceId: job.workspaceId,
              actorId: req.user.id,
              actorName: reviewerName,
              payload: { userId: updated.userId, eventName: event.name },
            });

            // Trigger show achievements for the newly assigned crew member
            checkAchievements(updated.userId, "assignment:created", {
              workspaceId: job.workspaceId,
              actorName: updated.userName || "Crew",
            }).catch(() => {});
          }
        } catch (err) {
          console.error("Auto-assignment from job approval failed (non-fatal):", err);
        }
      }

      // Create notification for the applicant
      try {
        await storage.createNotification({
          userId: updated.userId,
          workspaceId: job.workspaceId,
          type: "job:approved",
          title: "Application Approved!",
          message: `You've been approved for "${job.title}"${job.eventId ? " and assigned to the show" : ""}`,
        });
      } catch { /* non-critical */ }
    }

    if (status === "rejected") {
      try {
        await storage.createNotification({
          userId: updated.userId,
          workspaceId: job.workspaceId,
          type: "job:rejected",
          title: "Application Update",
          message: `Your application for "${job.title}" was not selected`,
        });
      } catch { /* non-critical */ }
    }

    res.json(updated);
  });

  // My applications
  app.get("/api/jobs/my-applications", isAuthenticated, async (req: any, res) => {
    const apps = await storage.getJobApplicationsByUser(req.user.id);
    res.json(apps);
  });
}
