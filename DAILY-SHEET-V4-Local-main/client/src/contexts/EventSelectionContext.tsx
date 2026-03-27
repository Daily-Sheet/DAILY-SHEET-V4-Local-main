import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface EventSelectionContextType {
  selectedEvents: string[];
  selectedEventIds: number[];
  setSelectedEvents: (events: string[]) => void;
  setSelectedEventIds: (ids: number[]) => void;
  toggleEvent: (name: string) => void;
  toggleEventById: (id: number) => void;
  singleSelect: (name: string) => void;
  singleSelectById: (id: number) => void;
  selectAll: (events: string[]) => void;
  selectAllByIds: (ids: number[]) => void;
  setWorkspaceScope: (workspaceId: number) => void;
  /** Register the current events list so name⇄ID sync works automatically. */
  setEventResolver: (events: { id: number; name: string }[]) => void;
}

const STORAGE_PREFIX = "dailysheet_selected_events";
const STORAGE_PREFIX_IDS = "dailysheet_selected_event_ids";

const EventSelectionContext = createContext<EventSelectionContextType | null>(null);

function getStorageKey(workspaceId: number | null): string {
  return workspaceId ? `${STORAGE_PREFIX}_ws${workspaceId}` : STORAGE_PREFIX;
}

function getStorageKeyIds(workspaceId: number | null): string {
  return workspaceId ? `${STORAGE_PREFIX_IDS}_ws${workspaceId}` : STORAGE_PREFIX_IDS;
}

function loadFromStorage(workspaceId: number | null): string[] {
  try {
    const stored = localStorage.getItem(getStorageKey(workspaceId));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function loadIdsFromStorage(workspaceId: number | null): number[] {
  try {
    const stored = localStorage.getItem(getStorageKeyIds(workspaceId));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveToStorage(events: string[], workspaceId: number | null) {
  try {
    localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(events));
  } catch {}
}

function saveIdsToStorage(ids: number[], workspaceId: number | null) {
  try {
    localStorage.setItem(getStorageKeyIds(workspaceId), JSON.stringify(ids));
  } catch {}
}

export function EventSelectionProvider({ children }: { children: ReactNode }) {
  const workspaceIdRef = useRef<number | null>(null);
  const [selectedEvents, setSelectedEventsRaw] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIdsRaw] = useState<number[]>([]);

  // Resolver maps for name⇄ID sync. Updated externally via setEventResolver.
  const nameToIdRef = useRef<Map<string, number>>(new Map());
  const idToNameRef = useRef<Map<number, string>>(new Map());

  const setEventResolver = useCallback((events: { id: number; name: string }[]) => {
    const n2i = new Map<string, number>();
    const i2n = new Map<number, string>();
    for (const e of events) {
      n2i.set(e.name, e.id);
      i2n.set(e.id, e.name);
    }
    nameToIdRef.current = n2i;
    idToNameRef.current = i2n;
  }, []);

  /** Given names, resolve matching IDs and update both states + storage */
  const syncFromNames = useCallback((names: string[]) => {
    setSelectedEventsRaw(names);
    saveToStorage(names, workspaceIdRef.current);
    const ids = names.map(n => nameToIdRef.current.get(n)).filter((id): id is number => id != null);
    setSelectedEventIdsRaw(ids);
    saveIdsToStorage(ids, workspaceIdRef.current);
  }, []);

  /** Given IDs, resolve matching names and update both states + storage */
  const syncFromIds = useCallback((ids: number[]) => {
    setSelectedEventIdsRaw(ids);
    saveIdsToStorage(ids, workspaceIdRef.current);
    const names = ids.map(id => idToNameRef.current.get(id)).filter((n): n is string => n != null);
    setSelectedEventsRaw(names);
    saveToStorage(names, workspaceIdRef.current);
  }, []);

  const setWorkspaceScope = useCallback((workspaceId: number) => {
    if (workspaceIdRef.current !== workspaceId) {
      workspaceIdRef.current = workspaceId;
      setSelectedEventsRaw(loadFromStorage(workspaceId));
      setSelectedEventIdsRaw(loadIdsFromStorage(workspaceId));
    }
  }, []);

  const setSelectedEvents = useCallback((events: string[]) => {
    syncFromNames(events);
  }, [syncFromNames]);

  const setSelectedEventIds = useCallback((ids: number[]) => {
    syncFromIds(ids);
  }, [syncFromIds]);

  const toggleEvent = useCallback((name: string) => {
    setSelectedEventsRaw(prev => {
      const isSelected = prev.includes(name);
      const next = isSelected ? prev.filter(n => n !== name) : [...prev, name];
      // Use syncFromNames logic inline to avoid stale closure
      saveToStorage(next, workspaceIdRef.current);
      const ids = next.map(n => nameToIdRef.current.get(n)).filter((id): id is number => id != null);
      setSelectedEventIdsRaw(ids);
      saveIdsToStorage(ids, workspaceIdRef.current);
      return next;
    });
  }, []);

  const toggleEventById = useCallback((id: number) => {
    setSelectedEventIdsRaw(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(i => i !== id) : [...prev, id];
      saveIdsToStorage(next, workspaceIdRef.current);
      const names = next.map(i => idToNameRef.current.get(i)).filter((n): n is string => n != null);
      setSelectedEventsRaw(names);
      saveToStorage(names, workspaceIdRef.current);
      return next;
    });
  }, []);

  const singleSelect = useCallback((name: string) => {
    syncFromNames([name]);
  }, [syncFromNames]);

  const singleSelectById = useCallback((id: number) => {
    syncFromIds([id]);
  }, [syncFromIds]);

  const selectAll = useCallback((events: string[]) => {
    syncFromNames(events);
  }, [syncFromNames]);

  const selectAllByIds = useCallback((ids: number[]) => {
    syncFromIds(ids);
  }, [syncFromIds]);

  return (
    <EventSelectionContext.Provider value={{
      selectedEvents,
      selectedEventIds,
      setSelectedEvents,
      setSelectedEventIds,
      toggleEvent,
      toggleEventById,
      singleSelect,
      singleSelectById,
      selectAll,
      selectAllByIds,
      setWorkspaceScope,
      setEventResolver,
    }}>
      {children}
    </EventSelectionContext.Provider>
  );
}

export function useEventSelection() {
  const ctx = useContext(EventSelectionContext);
  if (!ctx) throw new Error("useEventSelection must be used within EventSelectionProvider");
  return ctx;
}
