import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl } from "@/lib/api";
import type { JobListing, JobApplication } from "@shared/schema";

export type JobWithApplicationInfo = JobListing & {
  applicationCount: number;
  myApplication: JobApplication | null;
};

export function useJobs() {
  return useQuery<JobWithApplicationInfo[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/jobs"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });
}

export function useMyApplications() {
  return useQuery<JobApplication[]>({
    queryKey: ["/api/jobs/my-applications"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/jobs/my-applications"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });
}

export function useJobApplications(jobId: number | null) {
  return useQuery<JobApplication[]>({
    queryKey: ["/api/jobs", jobId, "applications"],
    enabled: jobId !== null,
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/jobs/${jobId}/applications`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<JobListing>) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<JobListing> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/jobs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, message }: { jobId: number; message?: string }) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`, { message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/my-applications"] });
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest("DELETE", `/api/jobs/${jobId}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/my-applications"] });
    },
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, appId, status }: { jobId: number; appId: number; status: "approved" | "rejected" }) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}/applications/${appId}`, { status });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", vars.jobId, "applications"] });
    },
  });
}
