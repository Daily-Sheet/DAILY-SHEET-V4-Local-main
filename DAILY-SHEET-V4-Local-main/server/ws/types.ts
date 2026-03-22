// ── WebSocket message protocol ──────────────────────────────────────────────

/** Client → Server */
export interface WSClientMessage {
  type: "subscribe" | "unsubscribe" | "presence:heartbeat" | "presence:viewing";
  payload: Record<string, unknown>;
}

/** Server → Client */
export interface WSServerMessage {
  type: string;
  room: string;
  payload: Record<string, unknown>;
  meta: {
    actorId: string;
    actorName: string;
    timestamp: number;
    eventId?: string;
  };
}

/** Presence entry for a connected user */
export interface PresenceInfo {
  userId: string;
  name: string;
  profileImageUrl?: string;
  viewingEvent?: string;
  connectedAt: number;
  lastHeartbeat: number;
}

/** Domain event emitted by route handlers */
export interface DomainEvent {
  type: string;
  workspaceId: number;
  eventName?: string;
  actorId: string;
  actorName: string;
  payload: Record<string, unknown>;
}
