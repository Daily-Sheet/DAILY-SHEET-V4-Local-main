import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl } from "@/lib/api";
import type { AchievementCategory } from "@shared/achievements";

export type CatalogAchievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  secret: boolean;
  threshold: number;
  metricKey: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
};

export function useAchievementCatalog() {
  return useQuery<CatalogAchievement[]>({
    queryKey: ["/api/achievements/catalog"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/achievements/catalog"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });
}

export function useMyAchievements() {
  return useQuery<{
    unlocked: { id: number; userId: string; achievementKey: string; unlockedAt: string; metadata: any }[];
    progress: { id: number; userId: string; metricKey: string; value: number; details: any }[];
    displayPrefs: { pinnedAchievements: string[] | null; showOnCrewCard: boolean } | null;
  }>({
    queryKey: ["/api/achievements/my"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/achievements/my"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });
}

export function useCheckAchievements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/achievements/check");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/catalog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/my"] });
    },
  });
}

export function useUpdateAchievementPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pinnedAchievements?: string[]; showOnCrewCard?: boolean }) => {
      const res = await apiRequest("PATCH", "/api/achievements/display-prefs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/my"] });
    },
  });
}
