import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl } from "@/lib/api";
import type { Vendor, VendorRating } from "@shared/schema";

export type VendorWithRating = Vendor & { avgRating: number | null; ratingCount: number };

export function useVendors() {
  return useQuery<VendorWithRating[]>({
    queryKey: ["/api/vendor-list"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/vendor-list"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });
}

export function useCommunityVendors() {
  return useQuery<VendorWithRating[]>({
    queryKey: ["/api/vendor-list/community"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/vendor-list/community"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch community vendors");
      return res.json();
    },
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      const res = await apiRequest("POST", "/api/vendor-list", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-list"] });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Vendor> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/vendor-list/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-list"] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vendor-list/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-list"] });
    },
  });
}

export function useImportVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/vendor-list/${id}/import`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-list"] });
    },
  });
}

export function useRateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vendorId, rating, review }: { vendorId: number; rating: number; review?: string }) => {
      const res = await apiRequest("POST", `/api/vendor-list/${vendorId}/rate`, { rating, review });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-list/community"] });
    },
  });
}

export function useVendorRatings(vendorId: number | null) {
  return useQuery<VendorRating[]>({
    queryKey: ["/api/vendor-list", vendorId, "ratings"],
    enabled: vendorId !== null,
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/vendor-list/${vendorId}/ratings`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ratings");
      return res.json();
    },
  });
}
