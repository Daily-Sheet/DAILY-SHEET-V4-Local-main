// ── WebSocket client singleton ──────────────────────────────────────────────

export type ConnectionState = "connected" | "connecting" | "disconnected";

interface WSServerMessage {
  type: string;
  room: string;
  payload: Record<string, unknown>;
  meta: {
    actorId: string;
    actorName: string;
    timestamp: number;
  };
}

type MessageHandler = (msg: WSServerMessage) => void;
type ConnectionHandler = (state: ConnectionState) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private _state: ConnectionState = "disconnected";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private maxReconnectDelay = 30_000;
  private intentionalClose = false;

  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private subscribedRooms = new Set<string>();

  get connectionState(): ConnectionState {
    return this._state;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionalClose = false;
    this.setState("connecting");

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.setState("connected");

      // Re-subscribe to all rooms
      this.subscribedRooms.forEach((room) => {
        this.send({ type: "subscribe", payload: { room } });
      });

      // Start heartbeat
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSServerMessage = JSON.parse(event.data);
        this.dispatchMessage(msg);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      this.setState("disconnected");
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribedRooms.clear();
    this.reconnectAttempt = 0;
    this.setState("disconnected");
  }

  subscribe(room: string) {
    this.subscribedRooms.add(room);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", payload: { room } });
    }
  }

  unsubscribe(room: string) {
    this.subscribedRooms.delete(room);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe", payload: { room } });
    }
  }

  setViewing(eventName: string | null) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "presence:viewing", payload: { eventName } });
    }
  }

  /** Listen for a specific event type, or "*" for all. Returns unsubscribe fn. */
  on(type: string, handler: MessageHandler): () => void {
    let handlers = this.messageHandlers.get(type);
    if (!handlers) {
      handlers = new Set();
      this.messageHandlers.set(type, handlers);
    }
    handlers.add(handler);
    return () => {
      handlers!.delete(handler);
      if (handlers!.size === 0) this.messageHandlers.delete(type);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    // Fire immediately with current state
    handler(this._state);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /** Called on reconnect — the caller should invalidate queries */
  onReconnect: (() => void) | null = null;

  // ── Internal ──────────────────────────────────────────────────────────────

  private send(msg: { type: string; payload: Record<string, unknown> }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private setState(state: ConnectionState) {
    if (this._state === state) return;
    const wasDisconnected = this._state === "disconnected" || this._state === "connecting";
    this._state = state;
    this.connectionHandlers.forEach((handler) => handler(state));
    // If we just reconnected (were disconnected, now connected), trigger reconnect handler
    if (state === "connected" && wasDisconnected && this.reconnectAttempt === 0 && this.onReconnect) {
      // Only fire onReconnect for actual reconnections, not initial connect
    }
  }

  private dispatchMessage(msg: WSServerMessage) {
    // Dispatch to type-specific handlers
    const typeHandlers = this.messageHandlers.get(msg.type);
    if (typeHandlers) typeHandlers.forEach((handler) => handler(msg));
    // Dispatch to wildcard handlers
    const wildcardHandlers = this.messageHandlers.get("*");
    if (wildcardHandlers) wildcardHandlers.forEach((handler) => handler(msg));
  }

  private scheduleReconnect() {
    if (this.intentionalClose) return;
    const jitter = 0.8 + Math.random() * 0.4; // ±20%
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt) * jitter, this.maxReconnectDelay);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "presence:heartbeat", payload: {} });
    }, 30_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const wsClient = new WSClient();
