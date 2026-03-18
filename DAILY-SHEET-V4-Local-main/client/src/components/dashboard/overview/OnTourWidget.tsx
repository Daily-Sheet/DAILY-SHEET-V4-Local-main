import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Navigation, Plane, Hotel, CarFront, PlaneTakeoff } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Event, Venue, EventDayVenue, TravelDay } from "@shared/schema";
import type { Project } from "@shared/schema";
import type { Contact } from "@shared/schema";

export function TravelDayCrewSummary({ travelDayId, userId, contacts, hasTopLevelDetails }: {
  travelDayId: number; userId?: string; contacts: Contact[]; hasTopLevelDetails: boolean;
}) {
  const { data: crewTravel = [] } = useQuery<any[]>({
    queryKey: ["/api/travel-days", travelDayId, "crew"],
  });

  const myTravel = userId ? crewTravel.find(ct => ct.userId === userId) : null;
  const crewCount = crewTravel.length;


  if (crewCount === 0 && !hasTopLevelDetails) {
    return <p className="text-sm text-muted-foreground/70" data-testid="text-travel-no-details">No travel details added yet. Check the itinerary for more info.</p>;
  }

  return (
    <div className="space-y-2">
      {myTravel && (
        <div className="p-2 rounded-lg bg-background/50 border border-amber-400/20">
          <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1" data-testid="text-my-travel-label">Your Travel</p>
          <div className="space-y-1">
            {(myTravel.airline || myTravel.flightNumber) && (
              <div className="flex items-center gap-2 text-xs">
                <PlaneTakeoff className="w-3 h-3 text-muted-foreground" />
                {myTravel.airline && <span className="text-muted-foreground">{myTravel.airline}</span>}
                {myTravel.flightNumber && <span className="font-semibold">{myTravel.flightNumber}</span>}
                {myTravel.departureAirport && myTravel.arrivalAirport && (
                  <span className="text-muted-foreground">{myTravel.departureAirport} → {myTravel.arrivalAirport}</span>
                )}
                {myTravel.departureTime && <span className="text-muted-foreground ml-auto">{myTravel.departureTime}</span>}
              </div>
            )}
            {myTravel.hotelName && (
              <div className="flex items-center gap-2 text-xs">
                <Hotel className="w-3 h-3 text-muted-foreground" />
                <span>{myTravel.hotelName}</span>
              </div>
            )}
            {myTravel.groundTransport && (
              <div className="flex items-center gap-2 text-xs">
                <CarFront className="w-3 h-3 text-muted-foreground" />
                <span>{myTravel.groundTransport}</span>
              </div>
            )}
            {myTravel.notes && <p className="text-xs text-muted-foreground italic">{myTravel.notes}</p>}
            {!myTravel.airline && !myTravel.flightNumber && !myTravel.hotelName && !myTravel.groundTransport && !myTravel.notes && (
              <p className="text-xs text-muted-foreground/60">No details filled in yet.</p>
            )}
          </div>
        </div>
      )}
      {crewCount > 0 && (
        <p className="text-xs text-muted-foreground" data-testid="text-crew-travel-count">
          {crewCount} crew member{crewCount !== 1 ? "s" : ""} traveling
          {!myTravel && userId && " (you're not listed)"}
        </p>
      )}
    </div>
  );
}

export function OnTourWidget({ events, projects, venues, allDayVenues, selectedDate }: {
  events: Event[]; projects: Project[]; venues: Venue[]; allDayVenues: EventDayVenue[]; selectedDate: string;
}) {
  const tourProjects = useMemo(() => projects.filter(p => p.isTour && !p.archived), [projects]);

  const tourInfo = useMemo(() => {
    if (tourProjects.length === 0) return null;

    for (const tp of tourProjects) {
      const tourEvents = events
        .filter(e => e.projectId === tp.id)
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

      if (tourEvents.length === 0) continue;

      const tourStart = tourEvents[0]?.startDate;
      const tourEnd = tourEvents.reduce((latest, ev) => {
        const end = ev.endDate || ev.startDate || "";
        return end > latest ? end : latest;
      }, "");
      if (!tourStart || selectedDate < tourStart || selectedDate > tourEnd) continue;

      let currentStop: { event: Event; venue: Venue | null } | null = null;
      let nextStop: { event: Event; venue: Venue | null } | null = null;

      for (const ev of tourEvents) {
        const dayVenue = allDayVenues.find(dv => dv.eventId === ev.id && dv.date === ev.startDate);
        const venueId = dayVenue ? dayVenue.venueId : ev.venueId;
        const venue = venueId ? venues.find(v => v.id === venueId) || null : null;

        if (ev.startDate && ev.startDate <= selectedDate && (!ev.endDate || ev.endDate >= selectedDate)) {
          currentStop = { event: ev, venue };
        } else if (ev.startDate && ev.startDate > selectedDate && !nextStop) {
          nextStop = { event: ev, venue };
        }
      }

      if (currentStop || nextStop) {
        return { project: tp, currentStop, nextStop };
      }
    }
    return null;
  }, [tourProjects, events, venues, allDayVenues, selectedDate]);

  const activeProjectId = tourInfo?.project?.id;
  const { data: travelDays } = useQuery<TravelDay[]>({
    queryKey: ["/api/projects", activeProjectId, "travel-days"],
    enabled: !!activeProjectId,
  });

  const upcomingTravel = useMemo(() => {
    if (!travelDays || travelDays.length === 0) return null;
    const todayTravel = travelDays.find(td => td.date === selectedDate);
    if (todayTravel) return todayTravel;
    const future = travelDays
      .filter(td => td.date > selectedDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    return future[0] || null;
  }, [travelDays, selectedDate]);

  if (!tourInfo) return null;

  const displayStop = tourInfo.currentStop || tourInfo.nextStop;
  const isCurrent = !!tourInfo.currentStop;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="on-tour-widget">
      <Card className="bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Navigation className="w-3 h-3 text-blue-500" />
              </div>
              <span className="text-xs font-display uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">On Tour · {tourInfo.project.name}</span>
            </div>
            <Link href={`/project/${tourInfo.project.id}`}>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700" data-testid="button-view-itinerary">
                View Itinerary
              </Button>
            </Link>
          </div>
          {displayStop && (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayStop.event.name}</p>
                {displayStop.venue && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{displayStop.venue.name}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isCurrent ? "Today's stop" : `Next: ${displayStop.event.startDate ? format(parseISO(displayStop.event.startDate), "EEE, MMM d") : ""}`}
                </p>
              </div>
            </div>
          )}
          {upcomingTravel && (upcomingTravel.flightNumber || upcomingTravel.departureAirport) && (
            <div className="mt-2 pt-2 border-t border-blue-500/10">
              <div className="flex items-center gap-2">
                <Plane className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span className="text-[10px] uppercase tracking-wider font-medium text-amber-600 dark:text-amber-400">
                  {upcomingTravel.date === selectedDate ? "Travel Today" : `Travel ${format(parseISO(upcomingTravel.date), "EEE, MMM d")}`}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {upcomingTravel.airline && <span className="text-xs text-muted-foreground">{upcomingTravel.airline}</span>}
                {upcomingTravel.flightNumber && <span className="text-xs font-semibold">{upcomingTravel.flightNumber}</span>}
                {upcomingTravel.departureAirport && upcomingTravel.arrivalAirport && (
                  <span className="text-xs text-muted-foreground">
                    {upcomingTravel.departureAirport} → {upcomingTravel.arrivalAirport}
                  </span>
                )}
                {upcomingTravel.departureTime && (
                  <span className="text-[10px] text-muted-foreground ml-auto">{upcomingTravel.departureTime}</span>
                )}
              </div>
            </div>
          )}
          {tourInfo.currentStop && tourInfo.nextStop && (
            <div className="mt-2 pt-2 border-t border-blue-500/10 flex items-center gap-1 text-xs text-muted-foreground">
              <span>Next:</span>
              <span className="font-medium">{tourInfo.nextStop.event.name}</span>
              {tourInfo.nextStop.venue && <span>· {tourInfo.nextStop.venue.name}</span>}
              {tourInfo.nextStop.event.startDate && <span>· {format(parseISO(tourInfo.nextStop.event.startDate), "MMM d")}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
