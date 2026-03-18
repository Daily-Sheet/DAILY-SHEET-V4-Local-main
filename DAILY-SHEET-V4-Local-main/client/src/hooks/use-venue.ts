import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertVenue, Venue } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useVenues() {
  return useQuery<Venue[]>({
    queryKey: [api.venues.list.path],
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVenue) => {
      const res = await apiRequest("POST", api.venues.create.path, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.venues.list.path] }),
  });
}

export function useUpdateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVenue> }) => {
      const res = await apiRequest("PATCH", `/api/venues/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.venues.list.path] }),
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/venues/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.venues.list.path] }),
  });
}
