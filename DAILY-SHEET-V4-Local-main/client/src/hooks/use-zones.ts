import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Zone, InsertZone } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useZones() {
  return useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });
}

export function useZonesByVenue(venueId: number | null) {
  return useQuery<Zone[]>({
    queryKey: ["/api/zones", "venue", venueId],
    queryFn: async () => {
      if (!venueId) return [];
      const res = await fetch(`/api/venues/${venueId}/zones`);
      if (!res.ok) throw new Error("Failed to fetch zones");
      return res.json();
    },
    enabled: !!venueId,
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertZone) => {
      const res = await apiRequest("POST", "/api/zones", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertZone> }) => {
      const res = await apiRequest("PATCH", `/api/zones/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
    },
  });
}
