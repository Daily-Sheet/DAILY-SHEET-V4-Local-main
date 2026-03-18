import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UrgencyStatus } from "@/lib/timeUtils";

let urgencyTick = 0;
const urgencyListeners = new Set<() => void>();
setInterval(() => { urgencyTick++; urgencyListeners.forEach(l => l()); }, 30000);
export function useUrgencyTick() {
  return useSyncExternalStore(
    (cb) => { urgencyListeners.add(cb); return () => urgencyListeners.delete(cb); },
    () => urgencyTick
  );
}

export const URGENCY_STYLES: Record<UrgencyStatus, string> = {
  none: "",
  warning: "bg-yellow-400/15 dark:bg-yellow-500/15 border-l-2 border-l-yellow-500",
  urgent: "bg-orange-400/20 dark:bg-orange-500/20 border-l-2 border-l-orange-500",
  overdue: "bg-red-400/20 dark:bg-red-500/20 border-l-2 border-l-red-500",
  complete: "bg-green-400/15 dark:bg-green-500/15 border-l-2 border-l-green-500",
};

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return fields.some(f => f && f.toLowerCase().includes(q));
}

export const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;

export function useUserActivity() {
  const { data: activity = [] } = useQuery<{ userId: string; lastActiveAt: string | null }[]>({
    queryKey: ["/api/user-activity"],
    refetchInterval: 60_000,
  });
  const activityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    const now = Date.now();
    for (const a of activity) {
      if (a.lastActiveAt) {
        map.set(a.userId, now - new Date(a.lastActiveAt).getTime() < ACTIVE_THRESHOLD_MS);
      }
    }
    return map;
  }, [activity]);
  return activityMap;
}

export function ActiveDot({ userId, activityMap }: { userId: string | null | undefined; activityMap: Map<string, boolean> }) {
  if (!userId) return null;
  const isActive = activityMap.get(userId);
  if (!isActive) return null;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0"
      title="Active now"
      data-testid={`indicator-active-${userId}`}
    />
  );
}
