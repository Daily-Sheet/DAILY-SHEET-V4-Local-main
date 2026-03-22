import { useState, useEffect, useRef } from "react";
import { WifiOff, Loader2 } from "lucide-react";
import { useConnectionStatus } from "@/hooks/use-connection-status";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const wsStatus = useConnectionStatus();
  const hadConnection = useRef(false);

  // Track if we ever had a successful connection
  useEffect(() => {
    if (wsStatus === "connected") {
      hadConnection.current = true;
    }
  }, [wsStatus]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[200] bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2"
        data-testid="offline-indicator"
      >
        <WifiOff className="w-4 h-4" />
        You're offline. Some features may be unavailable.
      </div>
    );
  }

  // Only show reconnecting bar if we previously had a connection and lost it
  if (hadConnection.current && wsStatus === "connecting") {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white px-4 py-1.5 text-center text-xs font-medium flex items-center justify-center gap-2">
        <Loader2 className="w-3 h-3 animate-spin" />
        Reconnecting to live updates...
      </div>
    );
  }

  return null;
}
