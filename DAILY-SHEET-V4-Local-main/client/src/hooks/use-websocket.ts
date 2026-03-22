import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { wsClient } from "@/lib/wsClient";

/** Maps WS event types to React Query keys that should be invalidated */
function getInvalidations(type: string): string[][] {
  switch (type) {
    case "schedule:created":
    case "schedule:updated":
    case "schedule:deleted":
    case "schedule:reordered":
    case "schedule:completed":
    case "schedule:day-cleared":
      return [["/api/schedules"]];

    case "comment:created":
    case "comment:pinned":
    case "comment:deleted":
      return [["/api/schedules"]]; // comments are fetched via schedule sub-queries

    case "checkin:created":
    case "checkin:checkout":
      return [["/api/daily-checkins"]];

    case "notification:new":
      return [["/api/notifications"], ["/api/notifications/unread-count"]];

    case "activity:new":
      return [["/api/activity"]];

    default:
      return [];
  }
}

/**
 * Connects to the WebSocket server when the user is authenticated.
 * Listens for domain events and invalidates the appropriate React Query caches.
 * Call this once in the authenticated app shell.
 */
export function useWebSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    const userId = user?.id;
    const workspaceId = user?.workspaceId;
    if (!userId || !workspaceId) return;

    // Connect and subscribe to workspace room
    wsClient.connect();
    wsClient.subscribe(`workspace:${workspaceId}`);
    connectedRef.current = true;

    // Listen for all domain events and invalidate queries
    const unsub = wsClient.on("*", (msg) => {
      // Skip invalidation for own actions (React Query already handles via mutation onSuccess)
      if (msg.meta.actorId === userId) return;
      // Skip presence events (handled separately)
      if (msg.type.startsWith("presence:")) return;

      const keys = getInvalidations(msg.type);
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    });

    // On reconnect, invalidate everything to catch up on missed events
    wsClient.onReconnect = () => {
      queryClient.invalidateQueries();
    };

    return () => {
      unsub();
      wsClient.onReconnect = null;
      wsClient.disconnect();
      connectedRef.current = false;
    };
  }, [user?.id, user?.workspaceId, queryClient]);
}
