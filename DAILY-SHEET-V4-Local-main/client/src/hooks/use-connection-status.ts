import { useState, useEffect } from "react";
import { wsClient, type ConnectionState } from "@/lib/wsClient";

/** Returns the current WebSocket connection state */
export function useConnectionStatus(): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>("disconnected");

  useEffect(() => {
    return wsClient.onConnectionChange(setStatus);
  }, []);

  return status;
}
