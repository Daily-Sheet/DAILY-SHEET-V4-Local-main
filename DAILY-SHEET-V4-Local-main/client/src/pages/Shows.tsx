import { useMemo, useState } from "react";
import { useLocation } from "wouter";
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
import { cn } from "@/lib/utils";
import { getProjectTypeColors } from "@/lib/projectColors";

export default function Shows() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const eventSelection = useEventSelection();
  const { data: venuesList = [] } = useVenues();
  const { data: allProjects = [] } = useProjects();
  const { data: eventsList = [] } = useQuery<Event[]>({ queryKey: ["/api/events"], refetchInterval: 15_000, refetchOnWindowFocus: true });


  // Show archived toggle
  const [showArchived, setShowArchived] = useState(false);

  // Compute accessible events (commenter, moderator, admin, or assigned)
  const accessibleEvents = useMemo((): Event[] => {
    if (!user) return [];
    // Example: roles could be in user.roles or user.eventRoles[eventName] etc.
    // For now, include all events if user is admin/moderator/commenter, else assigned
    const isAdmin = user.role === 'admin' || user.role === 'owner' || user.role === 'manager';
    const isModerator = user.role === 'moderator';
    const isCommenter = user.role === 'commenter';
    if (isAdmin || isModerator || isCommenter) {
      return eventsList;
    }
    // fallback: assigned events
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

  // Filter for archived
  const filteredEvents = useMemo(() => {
    if (showArchived) return accessibleEvents;
    return accessibleEvents.filter(ev => !ev.archived);
  }, [accessibleEvents, showArchived]);

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

  if (filteredEvents.length === 0) {
    return (
      <div className="min-h-screen bg-background font-body flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display uppercase tracking-wide text-foreground">No Shows Available</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              There are no shows available for your account. If you believe this is an error, contact your production manager or admin.
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display uppercase tracking-wide text-foreground">Shows</h2>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(v => !v)}
            className="ml-2"
          >
            {showArchived ? "Hide Archived Shows" : "Show Archived Shows"}
          </Button>
        </div>
        <div className="space-y-3">
          {filteredEvents.map((event: Event) => {
            // ShowTile: internal reference for show selection button
            const eventVenue = event.venueId ? venuesList.find((v: Venue) => v.id === event.venueId) : null;
            const eventProject = event.projectId ? allProjects.find((p: Project) => p.id === event.projectId) : null;
            const isFestival = eventProject?.isFestival;
            const isTour = eventProject?.isTour;
            const dateRange = event.startDate && event.endDate
              ? `${format(new Date(event.startDate + "T00:00:00"), "MMM d")} – ${format(new Date(event.endDate + "T00:00:00"), "MMM d, yyyy")}`
              : event.startDate
                ? format(new Date(event.startDate + "T00:00:00"), "MMM d, yyyy")
                : null;
            // ShowTile element
            return (
              <button
                key={event.id}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover-elevate active-elevate-2 transition-all"
                onClick={() => {
                  eventSelection.singleSelect(event.name);
                  if (event.startDate) {
                    localStorage.setItem("activeDate", event.startDate);
                  }
                  setLocation("/dashboard");
                }}
                data-testid={`show-tile-${event.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold uppercase tracking-wide text-foreground truncate">
                        {event.name}
                      </h3>
                      {isTour && (() => {
                        const pc = getProjectTypeColors(eventProject);
                        return <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0", pc.bg, pc.text, pc.darkText, pc.border)}>All Shows</span>;
                      })()}
                    </div>
                    {isFestival && eventProject && (() => {
                      const pc = getProjectTypeColors(eventProject);
                      return (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", pc.bg, pc.text, pc.darkText, pc.border)}>Stage</span>
                          <span className="text-xs text-muted-foreground">{eventProject.name}</span>
                        </div>
                      );
                    })()}
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
