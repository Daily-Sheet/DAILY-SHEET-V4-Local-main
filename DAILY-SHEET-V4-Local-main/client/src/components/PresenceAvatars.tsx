import { usePresence } from "@/hooks/use-presence";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Shows stacked avatar circles of users currently online.
 * If eventName is provided, only shows users viewing that event.
 */
export function PresenceAvatars({
  eventName,
  className,
}: {
  eventName?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const presenceList = usePresence(eventName);

  // Filter out self
  const others = presenceList.filter((p) => p.userId !== user?.id);

  if (others.length === 0) return null;

  const maxShow = 5;
  const shown = others.slice(0, maxShow);
  const overflow = others.length - maxShow;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((p) => {
        const initials = p.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <Tooltip key={p.userId}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={p.profileImageUrl} />
                  <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {p.name}
              {p.viewingEvent && <span className="text-muted-foreground ml-1">viewing {p.viewingEvent}</span>}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {overflow > 0 && (
        <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
          +{overflow}
        </div>
      )}
    </div>
  );
}
