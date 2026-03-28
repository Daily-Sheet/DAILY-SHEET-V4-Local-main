import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Calendar, Users, MessageSquare, Mail, Check, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

function getRelativeTime(dateStr: string | Date): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "schedule_change":
      return <Calendar className="h-4 w-4 text-blue-500 shrink-0" />;
    case "assignment_change":
      return <Users className="h-4 w-4 text-green-500 shrink-0" />;
    case "comment":
      return <MessageSquare className="h-4 w-4 text-orange-500 shrink-0" />;
    case "daily_sheet_sent":
      return <Mail className="h-4 w-4 text-purple-500 shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold" data-testid="text-notifications-title">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground" data-testid="text-no-notifications">
              <Bell className="mb-2 h-8 w-8 opacity-50" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                    !notif.read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => {
                    if (!notif.read) markReadMutation.mutate(notif.id);
                  }}
                  data-testid={`notification-item-${notif.id}`}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${!notif.read ? "font-semibold" : "font-normal text-muted-foreground"}`}>
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                      {notif.createdAt ? getRelativeTime(notif.createdAt) : ""}
                    </span>
                  </div>
                  {!notif.read && (
                    <Check className="h-3.5 w-3.5 text-muted-foreground/50 mt-1 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
