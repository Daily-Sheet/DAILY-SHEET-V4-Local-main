import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar as CalendarIcon, Clock, MapPin, Phone, Wifi, Car, Truck,
  UtensilsCrossed, Loader2, AlertTriangle, Lock, ShieldAlert, LogIn, LogOut
} from "lucide-react";
import type { Schedule, Venue, DailyCheckin } from "@shared/schema";

interface EventAssignmentData {
  id: number;
  userId: string;
  eventName: string;
  position: string | null;
  checkedInAt: string | null;
  date: string | null;
}

interface AccessData {
  eventName: string | null;
  projectId: number | null;
  expiresAt: string;
  contact: { id: number; firstName: string; lastName: string; role: string; userId: string | null } | null;
  events: Array<{ id: number; name: string; startDate: string | null; endDate: string | null; venueId: number | null }>;
  event: { name: string; startDate: string | null; endDate: string | null; venueId: number | null } | null;
  schedules: Schedule[];
  venue: Venue | null;
  dayVenues: Array<{ date: string; venueId: number; venue: Venue | null }>;
  assignments: EventAssignmentData[];
  checkins: DailyCheckin[];
}

function formatTime(t: string | Date | null): string {
  if (!t) return "";
  const d = typeof t === "string" ? new Date(t) : t;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function AccessPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<AccessData>({
    queryKey: ["/api/access", token],
    queryFn: async () => {
      const res = await fetch(`/api/access/${token}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Link unavailable" }));
        throw new Error(body.message || "Failed to load");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ eventName, date }: { eventName: string; date: string }) => {
      const res = await fetch(`/api/access/${token}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, date }),
      });
      if (!res.ok) throw new Error("Failed to check in");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/access", token] }),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (checkinId: number) => {
      const res = await fetch(`/api/access/${token}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkinId }),
      });
      if (!res.ok) throw new Error("Failed to check out");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/access", token] }),
  });

  const eventDates = useMemo(() => {
    const dateSet = new Set<string>();
    if (data?.events && data.events.length > 0) {
      for (const ev of data.events) {
        if (ev.startDate && ev.endDate) {
          const start = new Date(ev.startDate + "T12:00:00");
          const end = new Date(ev.endDate + "T12:00:00");
          const cur = new Date(start);
          while (cur <= end) {
            dateSet.add(cur.toISOString().split("T")[0]);
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
    }
    if (dateSet.size === 0 && data?.schedules?.length) {
      for (const s of data.schedules) {
        if (s.eventDate) dateSet.add(s.eventDate);
      }
    }
    return Array.from(dateSet).sort();
  }, [data?.events, data?.schedules]);

  const effectiveDate = selectedDate || (eventDates.length > 0 ? eventDates[0] : null);

  const daySchedules = useMemo(() => {
    if (!data?.schedules) return [];
    if (!effectiveDate) {
      return data.schedules.sort((a, b) => {
        if (a.startTime && b.startTime) return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
    }
    return data.schedules
      .filter(s => s.eventDate === effectiveDate)
      .sort((a, b) => {
        if (a.startTime && b.startTime) return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
  }, [data?.schedules, effectiveDate]);

  const dayVenue = useMemo(() => {
    if (!data?.dayVenues || !effectiveDate) return data?.venue || null;
    const dv = data.dayVenues.find(d => d.date === effectiveDate);
    return dv?.venue || data.venue || null;
  }, [data?.dayVenues, data?.venue, effectiveDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-slate-400">Loading daily sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const msg = (error as Error).message;
    const isExpired = msg.includes("expired");
    const isRevoked = msg.includes("revoked");

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            {isExpired ? (
              <Clock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            ) : isRevoked ? (
              <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-4" />
            ) : (
              <Lock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            )}
            <h2 className="text-xl font-bold text-white mb-2" data-testid="text-access-error-title">
              {isExpired ? "Link Expired" : isRevoked ? "Link Revoked" : "Link Unavailable"}
            </h2>
            <p className="text-slate-400" data-testid="text-access-error-message">{msg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" data-testid="text-access-event-name">{data.projectId && data.events?.length > 1 ? `${data.events.length} Shows` : data.eventName}</h1>
              {data.contact && (
                <p className="text-sm text-slate-400" data-testid="text-access-contact">
                  {data.contact.firstName} {data.contact.lastName} · {data.contact.role}
                </p>
              )}
            </div>
            <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs" data-testid="badge-access-readonly">
              Read Only
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {eventDates.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {eventDates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  effectiveDate === date
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
                data-testid={`button-access-date-${date}`}
              >
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </button>
            ))}
          </div>
        )}

        {effectiveDate && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <CalendarIcon className="h-4 w-4" />
            <span data-testid="text-access-selected-date">{formatDate(effectiveDate)}</span>
          </div>
        )}

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {daySchedules.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-4" data-testid="text-access-no-schedule">No schedule items for this date.</p>
            ) : (
              daySchedules.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-slate-700/50 last:border-0" data-testid={`access-schedule-item-${item.id}`}>
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="text-sm font-medium text-blue-300">{item.startTime ? formatTime(item.startTime) : ""}</span>
                    {item.endTime && (
                      <span className="block text-xs text-slate-500">{formatTime(item.endTime)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{item.title}</span>
                      {item.category && (
                        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{item.category}</Badge>
                      )}
                    </div>
                    {item.description && <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {data.contact?.userId && data.assignments && data.assignments.length > 0 && effectiveDate && (() => {
          const dayAssignments = data.assignments.filter(a => !a.date || a.date === effectiveDate);
          if (dayAssignments.length === 0) return null;
          const dayEventName = dayAssignments[0]?.eventName || data.eventName || "";
          const existingCheckin = data.checkins?.find(c => c.eventName === dayEventName && c.date === effectiveDate);
          const isCheckedIn = !!existingCheckin?.checkedInAt;
          const isCheckedOut = !!existingCheckin?.checkedOutAt;
          return (
            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-access-checkin">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-amber-400" /> Check-In
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayAssignments.map(a => (
                  <div key={a.id} className="text-sm text-slate-300">
                    Assigned as <span className="font-medium text-white">{a.position || "Crew"}</span> for {a.eventName}
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  {!isCheckedIn ? (
                    <Button
                      onClick={() => checkinMutation.mutate({ eventName: dayEventName, date: effectiveDate })}
                      disabled={checkinMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-access-checkin"
                    >
                      {checkinMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                      Check In
                    </Button>
                  ) : !isCheckedOut ? (
                    <>
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/40" data-testid="badge-checked-in">
                        Checked in at {formatTime(existingCheckin.checkedInAt)}
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={() => checkoutMutation.mutate(existingCheckin.id)}
                        disabled={checkoutMutation.isPending}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        data-testid="button-access-checkout"
                      >
                        {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                        Check Out
                      </Button>
                    </>
                  ) : (
                    <Badge className="bg-slate-600/20 text-slate-400 border-slate-600/40" data-testid="badge-checked-out">
                      Checked out at {formatTime(existingCheckin.checkedOutAt)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {dayVenue && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" /> Venue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-white" data-testid="text-access-venue-name">{dayVenue.name}</h3>
                {dayVenue.address && <p className="text-sm text-slate-400">{dayVenue.address}</p>}
              </div>

              {(dayVenue.contactName || dayVenue.contactPhone) && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>{[dayVenue.contactName, dayVenue.contactPhone].filter(Boolean).join(" · ")}</span>
                </div>
              )}

              {(dayVenue.wifiSsid || dayVenue.wifiPassword) && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Wifi className="h-4 w-4 text-slate-500" />
                  <span>WiFi: {dayVenue.wifiSsid} {dayVenue.wifiPassword && `(${dayVenue.wifiPassword})`}</span>
                </div>
              )}

              {dayVenue.parking && (
                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <Car className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <span>{dayVenue.parking}</span>
                </div>
              )}

              {dayVenue.loadIn && (
                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <Truck className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <span>{dayVenue.loadIn}</span>
                </div>
              )}

              {dayVenue.mealsNotes && (
                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <UtensilsCrossed className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <span>{dayVenue.mealsNotes}</span>
                </div>
              )}

              {dayVenue.notes && (
                <>
                  <Separator className="bg-slate-700" />
                  <p className="text-sm text-slate-400">{dayVenue.notes}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-slate-600 py-4" data-testid="text-access-expiry">
          This link expires {new Date(data.expiresAt).toLocaleString()}
        </div>
      </main>
    </div>
  );
}
