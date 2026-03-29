import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { wsClient } from "@/lib/wsClient";
import { toast } from "@/hooks/use-toast";

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

    case "crew:assigned":
    case "crew:unassigned":
    case "crew:updated":
    case "crew:checkin":
    case "crew:checkout":
      return [["/api/event-assignments"]];

    case "contact:created":
    case "contact:updated":
    case "contact:deleted":
      return [["/api/contacts"]];

    case "project:crew-assigned":
    case "project:crew-updated":
    case "project:crew-unassigned":
      return [["/api/project-assignments"], ["/api/event-assignments"]];

    case "notification:new":
      return [["/api/notifications"], ["/api/notifications/unread-count"]];

    case "achievement:unlocked":
      return [["/api/achievements/catalog"], ["/api/achievements/my"]];

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
      // Skip presence events (handled separately)
      if (msg.type.startsWith("presence:")) return;

      // Activity and notification events are server-side side effects —
      // always invalidate them even for own actions since no client mutation handles it
      const alwaysInvalidate = msg.type === "activity:new" || msg.type === "notification:new" || msg.type === "achievement:unlocked";

      // Show celebratory toast when YOU unlock an achievement
      if (msg.type === "achievement:unlocked" && msg.payload.targetUserId === userId) {
        toast({
          title: `${msg.payload.icon} ${msg.payload.name}`,
          description: String(msg.payload.description),
        });
      }

      // Skip invalidation for own actions on direct mutations (React Query handles via onSuccess)
      if (msg.meta.actorId === userId && !alwaysInvalidate) return;

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
