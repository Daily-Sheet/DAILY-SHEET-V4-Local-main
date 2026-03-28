import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Navigation, Plane, Hotel, CarFront, PlaneTakeoff } from "lucide-react";
import { Link } from "wouter";
import { projectPath } from "@/lib/slugs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery, useQueries } from "@tanstack/react-query";
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

type TourInfoItem = {
  project: Project;
  currentStop: { event: Event; venue: Venue | null };
  nextStop: { event: Event; venue: Venue | null } | null;
};

function OnTourCard({ info, selectedDate, travelDays }: {
  info: TourInfoItem; selectedDate: string; travelDays: TravelDay[];
}) {
  const upcomingTravel = useMemo(() => {
    if (travelDays.length === 0) return null;
    const todayTravel = travelDays.find(td => td.date === selectedDate);
    if (todayTravel) return todayTravel;
    const future = travelDays
      .filter(td => td.date > selectedDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    return future[0] || null;
  }, [travelDays, selectedDate]);

  const displayStop = info.currentStop;

  return (
    <Card className="bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Navigation className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-xs font-display uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">On Tour · {info.project.name}</span>
          </div>
          <Link href={projectPath(info.project.id, info.project.name)}>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700" data-testid={`button-view-itinerary-${info.project.id}`}>
              View Itinerary
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayStop.event.name}</p>
            {displayStop.venue && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{displayStop.venue.name}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">Today's stop</p>
          </div>
        </div>
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
        {info.nextStop && (
          <div className="mt-2 pt-2 border-t border-blue-500/10 flex items-center gap-1 text-xs text-muted-foreground">
            <span>Next:</span>
            <span className="font-medium">{info.nextStop.event.name}</span>
            {info.nextStop.venue && <span>· {info.nextStop.venue.name}</span>}
            {info.nextStop.event.startDate && <span>· {format(parseISO(info.nextStop.event.startDate), "MMM d")}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OnTourWidget({ events, projects, venues, allDayVenues, selectedDate }: {
  events: Event[]; projects: Project[]; venues: Venue[]; allDayVenues: EventDayVenue[]; selectedDate: string;
}) {
  const activeProjects = useMemo(() => projects.filter(p => !p.archived), [projects]);

  const activeTours = useMemo(() => {
    const results: TourInfoItem[] = [];
    for (const tp of activeProjects) {
      const tourEvents = events
        .filter(e => e.projectId === tp.id)
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

      if (tourEvents.length === 0) continue;

      let currentStop: { event: Event; venue: Venue | null } | null = null;
      let nextStop: { event: Event; venue: Venue | null } | null = null;

      for (const ev of tourEvents) {
        const dayVenue = allDayVenues.find(dv => dv.eventId === ev.id && dv.date === ev.startDate);
        const venueId = dayVenue?.venueId ?? null;
        const venue = venueId ? venues.find(v => v.id === venueId) || null : null;

        if (ev.startDate && ev.startDate <= selectedDate && (!ev.endDate || ev.endDate >= selectedDate)) {
          currentStop = { event: ev, venue };
        } else if (ev.startDate && ev.startDate > selectedDate && !nextStop) {
          nextStop = { event: ev, venue };
        }
      }

      if (currentStop) {
        results.push({ project: tp, currentStop, nextStop });
      }
    }
    return results;
  }, [activeProjects, events, venues, allDayVenues, selectedDate]);

  const travelDayQueries = useQueries({
    queries: activeTours.map(t => ({
      queryKey: ["/api/projects", t.project.id, "travel-days"],
      enabled: true,
    })),
  });

  if (activeTours.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3" data-testid="on-tour-widget">
      {activeTours.map((info, idx) => (
        <OnTourCard
          key={info.project.id}
          info={info}
          selectedDate={selectedDate}
          travelDays={(travelDayQueries[idx]?.data as TravelDay[]) || []}
        />
      ))}
    </motion.div>
  );
}
