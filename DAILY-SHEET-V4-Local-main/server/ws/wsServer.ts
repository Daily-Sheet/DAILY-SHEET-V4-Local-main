import { WebSocketServer, WebSocket } from "ws";
import type { Server, IncomingMessage } from "http";
import type { Duplex } from "stream";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { authStorage } from "../replit_integrations/auth/storage";
import { eventBus } from "./eventBus";
import { presenceManager } from "./presenceManager";
import type { WSClientMessage, WSServerMessage, DomainEvent, PresenceInfo } from "./types";
import { log } from "../index";

/** Simple cookie parser — avoids external dependency */
function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const key = pair.substring(0, eq).trim();
    let val = pair.substring(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    try { result[key] = decodeURIComponent(val); } catch { result[key] = val; }
  }
  return result;
}

// ── Extended WebSocket with metadata ────────────────────────────────────────

interface AppWebSocket extends WebSocket {
  userId: string;
  userName: string;
  profileImageUrl?: string;
  workspaceId: number;
  subscribedRooms: Set<string>;
  isAlive: boolean;
}

// ── Room management ─────────────────────────────────────────────────────────

const rooms = new Map<string, Set<AppWebSocket>>();

function joinRoom(ws: AppWebSocket, room: string) {
  ws.subscribedRooms.add(room);
  let members = rooms.get(room);
  if (!members) {
    members = new Set();
    rooms.set(room, members);
  }
  members.add(ws);
}

function leaveRoom(ws: AppWebSocket, room: string) {
  ws.subscribedRooms.delete(room);
  const members = rooms.get(room);
  if (members) {
    members.delete(ws);
    if (members.size === 0) rooms.delete(room);
  }
}

function leaveAllRooms(ws: AppWebSocket) {
  ws.subscribedRooms.forEach((room) => {
    const members = rooms.get(room);
    if (members) {
      members.delete(ws);
      if (members.size === 0) rooms.delete(room);
    }
  });
  ws.subscribedRooms.clear();
}

function broadcastToRoom(room: string, msg: WSServerMessage, excludeUserId?: string) {
  const members = rooms.get(room);
  if (!members) return;
  const data = JSON.stringify(msg);
  members.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && ws.userId !== excludeUserId) {
      ws.send(data);
    }
  });
}

// ── Session loading (reuse connect-pg-simple store) ─────────────────────────

function loadSessionUser(
  req: IncomingMessage
): Promise<{ userId: string; user: any; workspaceId: number } | null> {
  return new Promise((resolve) => {
    try {
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) return resolve(null);

      const cookies = parseCookies(cookieHeader);
      // express-session stores the sid in connect.sid, signed with "s:"
      let rawSid = cookies["connect.sid"];
      if (!rawSid) return resolve(null);

      // Unsign: express-session signs cookies as "s:<value>.<sig>"
      if (rawSid.startsWith("s:") || rawSid.startsWith("s%3A")) {
        rawSid = rawSid.replace(/^s(%3A|:)/, "");
        rawSid = rawSid.split(".")[0]; // strip signature
      }

      const pgStore = connectPg(session);
      const store = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        tableName: "sessions",
      });

      store.get(rawSid, async (err, sess) => {
        store.close?.();
        if (err || !sess) return resolve(null);
        const userId = (sess as any).userId;
        if (!userId) return resolve(null);

        try {
          const user = await authStorage.getUser(userId);
          if (!user || !user.workspaceId) return resolve(null);
          resolve({ userId: user.id, user, workspaceId: user.workspaceId });
        } catch {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

// ── Presence broadcast helper ───────────────────────────────────────────────

function broadcastPresence(workspaceId: number) {
  const users = presenceManager.getPresence(workspaceId);
  const msg: WSServerMessage = {
    type: "presence:update",
    room: `workspace:${workspaceId}`,
    payload: { users },
    meta: {
      actorId: "system",
      actorName: "system",
      timestamp: Date.now(),
    },
  };
  broadcastToRoom(`workspace:${workspaceId}`, msg);
}

// ── Init ────────────────────────────────────────────────────────────────────

let wss: WebSocketServer;

export function initWebSocketServer(httpServer: Server) {
  wss = new WebSocketServer({ noServer: true });

  // Handle upgrade manually to filter out Vite HMR
  httpServer.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname !== "/ws") return; // let Vite or others handle non-/ws upgrades

    loadSessionUser(request).then((session) => {
      if (!session) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const appWs = ws as AppWebSocket;
        appWs.userId = session.userId;
        appWs.userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.email || "Unknown";
        appWs.profileImageUrl = session.user.profileImageUrl || undefined;
        appWs.workspaceId = session.workspaceId;
        appWs.subscribedRooms = new Set();
        appWs.isAlive = true;

        wss.emit("connection", appWs, request);
      });
    });
  });

  // Connection handling
  wss.on("connection", (ws: AppWebSocket) => {
    log(`WS connected: ${ws.userName} (workspace ${ws.workspaceId})`, "ws");

    // Auto-join workspace room
    joinRoom(ws, `workspace:${ws.workspaceId}`);

    // Register presence
    const now = Date.now();
    presenceManager.join(ws.workspaceId, {
      userId: ws.userId,
      name: ws.userName,
      profileImageUrl: ws.profileImageUrl,
      connectedAt: now,
      lastHeartbeat: now,
    });
    broadcastPresence(ws.workspaceId);

    // Pong handler for ping/pong keepalive
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Message handler
    ws.on("message", (raw) => {
      try {
        const msg: WSClientMessage = JSON.parse(raw.toString());
        handleClientMessage(ws, msg);
      } catch {
        // ignore malformed messages
      }
    });

    // Cleanup on close
    ws.on("close", () => {
      log(`WS disconnected: ${ws.userName}`, "ws");
      leaveAllRooms(ws);
      presenceManager.leave(ws.workspaceId, ws.userId);
      broadcastPresence(ws.workspaceId);
    });
  });

  // Ping/pong interval: detect dead connections
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AppWebSocket;
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  // Presence eviction interval
  const evictInterval = setInterval(() => {
    const evicted = presenceManager.evictStale();
    evicted.forEach((_userIds, workspaceId) => {
      broadcastPresence(workspaceId);
    });
  }, 30_000);

  // Subscribe to domain events from route handlers
  eventBus.onDomain((event: DomainEvent) => {
    const workspaceRoom = `workspace:${event.workspaceId}`;
    const msg: WSServerMessage = {
      type: event.type,
      room: workspaceRoom,
      payload: event.payload,
      meta: {
        actorId: event.actorId,
        actorName: event.actorName,
        timestamp: Date.now(),
      },
    };

    // Broadcast to workspace room (all users in that workspace)
    broadcastToRoom(workspaceRoom, msg);

    // Also broadcast to event-specific room if applicable
    if (event.eventName) {
      const eventRoom = `event:${event.workspaceId}:${event.eventName}`;
      broadcastToRoom(eventRoom, msg);
    }
  });

  // Cleanup on server close
  httpServer.on("close", () => {
    clearInterval(pingInterval);
    clearInterval(evictInterval);
    wss.close();
  });

  log("WebSocket server initialized on /ws", "ws");
}

// ── Client message handler ──────────────────────────────────────────────────

function handleClientMessage(ws: AppWebSocket, msg: WSClientMessage) {
  switch (msg.type) {
    case "subscribe": {
      const room = msg.payload.room as string;
      if (!room) return;
      // Only allow subscribing to rooms within own workspace
      if (!room.startsWith(`workspace:${ws.workspaceId}`) && !room.startsWith(`event:${ws.workspaceId}:`)) return;
      joinRoom(ws, room);
      break;
    }

    case "unsubscribe": {
      const room = msg.payload.room as string;
      if (!room) return;
      leaveRoom(ws, room);
      break;
    }

    case "presence:heartbeat": {
      presenceManager.heartbeat(ws.workspaceId, ws.userId);
      break;
    }

    case "presence:viewing": {
      const eventName = (msg.payload.eventName as string) || null;
      const changed = presenceManager.setViewing(ws.workspaceId, ws.userId, eventName);
      if (changed) broadcastPresence(ws.workspaceId);
      break;
    }
  }
}
