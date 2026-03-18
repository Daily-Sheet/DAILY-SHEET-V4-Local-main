import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ children, className }: PullToRefreshProps) {
  const queryClient = useQueryClient();
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    setPullDistance(Math.min(delta * 0.5, 120));
  }, [pulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      await queryClient.invalidateQueries();
      await new Promise(r => setTimeout(r, 500));
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, refreshing, queryClient, threshold]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={className}
    >
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden transition-all duration-200",
          pullDistance > 0 || refreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ height: refreshing ? 48 : pullDistance }}
        data-testid="pull-to-refresh-indicator"
      >
        <Loader2 className={cn(
          "w-5 h-5 text-muted-foreground transition-transform",
          refreshing && "animate-spin",
          pullDistance >= threshold && !refreshing && "text-primary"
        )} />
      </div>
      {children}
    </div>
  );
}
