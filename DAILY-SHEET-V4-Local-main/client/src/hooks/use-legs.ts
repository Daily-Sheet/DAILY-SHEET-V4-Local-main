import { useQuery } from "@tanstack/react-query";
import type { Leg } from "@shared/schema";

export function useLegs(projectId?: number) {
  return useQuery<Leg[]>({
    queryKey: ["/api/legs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/projects/${projectId}/legs`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!projectId,
  });
}
