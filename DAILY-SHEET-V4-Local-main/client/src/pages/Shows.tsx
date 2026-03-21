
import { useMemo } from "react";
import { format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronRight, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEventSelection } from "@/contexts/EventSelectionContext";
import { useVenues } from "@/hooks/use-venue";
import { useProjects } from "@/hooks/use-projects";
import { useQuery } from "@tanstack/react-query";
import type { Event, Venue, Project } from "@shared/schema";

export default function Shows() {
  const { user } = useAuth();
  const eventSelection = useEventSelection();
  const { data: venuesList = [] } = useVenues();
  const { data: allProjects = [] } = useProjects();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"], refetchInterval: 15_000, refetchOnWindowFocus: true });

  // Compute assigned events
  const assignedEvents = useMemo((): Event[] => {
    if (!user) return [];
    const directAssigned = new Set(user.eventAssignments || []);
    const projAssignments = user.projectAssignments || [];
    if (projAssignments.length > 0) {
      const projIds = new Set(projAssignments.map((pa: any) => pa.projectId));
      for (const ev of eventsList) {
        if (ev.projectId && projIds.has(ev.projectId)) {
          directAssigned.add(ev.name);
        }
      }
    }
    return eventsList.filter((e: Event) => directAssigned.has(e.name));
  }, [user, eventsList]);

  if (!user?.workspaceId) {
    return (
      <div className="min-h-screen bg-background font-body flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="h-8 w-8 text-muted-foreground">🎟️</span>
            </div>
            <h2 className="text-xl font-display uppercase tracking-wide text-foreground">Waiting for an Invite</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You're not part of any organization yet. Ask an admin to invite you to their organization, then refresh this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (assignedEvents.length === 0) {
    return (
      <div className="min-h-screen bg-background font-body flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display uppercase tracking-wide text-foreground">No Shows Assigned</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You haven't been assigned to any shows yet. Contact your production manager to get added to a show.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <AppHeader />
      <div className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-display uppercase tracking-wide text-foreground mb-4">Shows</h2>
        <div className="space-y-3">
          {assignedEvents.map((event: Event) => {
            const eventVenue = event.venueId ? venuesList.find((v: Venue) => v.id === event.venueId) : null;
            const eventProject = event.projectId ? allProjects.find((p: Project) => p.id === event.projectId) : null;
            const isFestival = eventProject?.isFestival;
            const isTour = eventProject?.isTour;
            const dateRange = event.startDate && event.endDate
              ? `${format(new Date(event.startDate + "T00:00:00"), "MMM d")} – ${format(new Date(event.endDate + "T00:00:00"), "MMM d, yyyy")}`
              : event.startDate
                ? format(new Date(event.startDate + "T00:00:00"), "MMM d, yyyy")
                : null;
            return (
              <button
                key={event.id}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover-elevate active-elevate-2 transition-all"
                onClick={() => eventSelection.singleSelect(event.name)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold uppercase tracking-wide text-foreground truncate">
                        {event.name}
                      </h3>
                      {isTour && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap flex-shrink-0">All Shows</span>
                      )}
                    </div>
                    {isFestival && eventProject && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">Stage</Badge>
                        <span className="text-xs text-muted-foreground">{eventProject.name}</span>
                      </div>
                    )}
                    {dateRange && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{dateRange}</span>
                      </div>
                    )}
                    {eventVenue && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{eventVenue.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
