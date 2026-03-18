const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function getUserTimezone(): string {
  return tz;
}

export function getLocalTimeOfDay(isoString: string | Date): { hour: number; minute: number } {
  const d = typeof isoString === "string" ? new Date(isoString) : isoString;
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: tz,
  });
  const parts = fmt.formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { hour, minute };
}

export function getLocalTimeMinutes(isoString: string | Date): number {
  const { hour, minute } = getLocalTimeOfDay(isoString);
  return hour * 60 + minute;
}

export function formatTime(isoString: string | Date): string {
  const d = typeof isoString === "string" ? new Date(isoString) : isoString;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

export function toTimeInputValue(value: unknown): string {
  if (!value) return "";
  try {
    const d = new Date(value as string | number | Date);
    if (isNaN(d.getTime())) return "";
    const { hour, minute } = getLocalTimeOfDay(d);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export type UrgencyStatus = "none" | "warning" | "urgent" | "overdue" | "complete";

export function getUrgencyStatus(item: {
  startTime: string | Date;
  endTime?: string | Date | null;
  completed?: boolean | null;
  eventDate?: string | null;
}): UrgencyStatus {
  if (item.completed) return "complete";
  if (!item.endTime || !item.eventDate) return "none";

  const now = new Date();
  const todayLocal = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  if (item.eventDate < todayLocal) return "overdue";
  if (item.eventDate > todayLocal) return "none";

  const nowTime = getLocalTimeOfDay(now);
  const nowMin = nowTime.hour * 60 + nowTime.minute;

  const startMin = getLocalTimeMinutes(item.startTime);
  if (startMin > nowMin) return "none";

  let endMin = getLocalTimeMinutes(item.endTime);
  if (endMin < startMin) endMin += 24 * 60;
  let adjustedNow = nowMin;
  if (nowMin < startMin) adjustedNow += 24 * 60;
  const minLeft = endMin - adjustedNow;

  if (minLeft <= 0) return "overdue";
  if (minLeft <= 5) return "urgent";
  if (minLeft <= 15) return "warning";
  return "none";
}
