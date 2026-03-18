import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type { Schedule, InsertSchedule } from "@shared/schema";

export function useSchedules() {
  return useQuery<Schedule[]>({
    queryKey: [api.schedules.list.path],
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSchedule) => {
      const res = await apiRequest("POST", api.schedules.create.path, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.schedules.list.path] }),
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSchedule> }) => {
      const res = await apiRequest("PATCH", buildUrl(api.schedules.update.path, { id }), data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.schedules.list.path] }),
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.schedules.delete.path, { id }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.schedules.list.path] }),
  });
}

export function useReorderSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ids: number[]; timeUpdates?: { id: number; startTime: string; endTime: string | null }[] }) => {
      await apiRequest("PATCH", "/api/schedules/reorder", data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.schedules.list.path] }),
  });
}
