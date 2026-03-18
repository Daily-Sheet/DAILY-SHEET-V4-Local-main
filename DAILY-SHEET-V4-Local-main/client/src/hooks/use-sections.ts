import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Section, InsertSection } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useSections() {
  return useQuery<Section[]>({
    queryKey: ["/api/sections"],
  });
}

export function useSectionsByEvent(eventId: number | null) {
  return useQuery<Section[]>({
    queryKey: ["/api/sections", "event", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const res = await fetch(`/api/events/${eventId}/sections`);
      if (!res.ok) throw new Error("Failed to fetch sections");
      return res.json();
    },
    enabled: !!eventId,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSection) => {
      const res = await apiRequest("POST", "/api/sections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSection> }) => {
      const res = await apiRequest("PATCH", `/api/sections/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
    },
  });
}
