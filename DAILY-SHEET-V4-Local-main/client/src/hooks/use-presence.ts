import { useState, useEffect } from "react";
import { wsClient } from "@/lib/wsClient";

export interface PresenceUser {
  userId: string;
  name: string;
  profileImageUrl?: string;
  viewingEvent?: string;
  connectedAt: number;
  lastHeartbeat: number;
}

/**
 * Returns the list of currently online users in the workspace.
 * Optionally filters to users viewing a specific event.
 * Also notifies the server what event this user is viewing.
 */
export function usePresence(eventName?: string) {
  const [presenceList, setPresenceList] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const unsub = wsClient.on("presence:update", (msg) => {
      setPresenceList((msg.payload.users as PresenceUser[]) || []);
    });
    return unsub;
  }, []);

  // Tell server what we're viewing
  useEffect(() => {
    wsClient.setViewing(eventName ?? null);
  }, [eventName]);

  // If filtering by event, return only users viewing that event
  if (eventName) {
    return presenceList.filter((u) => u.viewingEvent === eventName);
  }
  return presenceList;
}
