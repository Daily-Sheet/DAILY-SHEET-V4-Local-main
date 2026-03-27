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

  const setWorkspaceScope = useCallback((workspaceId: number) => {
    if (workspaceIdRef.current !== workspaceId) {
      workspaceIdRef.current = workspaceId;
      setSelectedEventsRaw(loadFromStorage(workspaceId));
      setSelectedEventIdsRaw(loadIdsFromStorage(workspaceId));
    }
  }, []);

  const setSelectedEvents = useCallback((events: string[]) => {
    setSelectedEventsRaw(events);
    saveToStorage(events, workspaceIdRef.current);
  }, []);

  const setSelectedEventIds = useCallback((ids: number[]) => {
    setSelectedEventIdsRaw(ids);
    saveIdsToStorage(ids, workspaceIdRef.current);
  }, []);

  const toggleEvent = useCallback((name: string) => {
    setSelectedEventsRaw(prev => {
      const isSelected = prev.includes(name);
      const next = isSelected ? prev.filter(n => n !== name) : [...prev, name];
      saveToStorage(next, workspaceIdRef.current);
      return next;
    });
  }, []);

  const toggleEventById = useCallback((id: number) => {
    setSelectedEventIdsRaw(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(i => i !== id) : [...prev, id];
      saveIdsToStorage(next, workspaceIdRef.current);
      return next;
    });
  }, []);

  const singleSelect = useCallback((name: string) => {
    const next = [name];
    setSelectedEventsRaw(next);
    saveToStorage(next, workspaceIdRef.current);
  }, []);

  const singleSelectById = useCallback((id: number) => {
    const next = [id];
    setSelectedEventIdsRaw(next);
    saveIdsToStorage(next, workspaceIdRef.current);
  }, []);

  const selectAll = useCallback((events: string[]) => {
    setSelectedEventsRaw(events);
    saveToStorage(events, workspaceIdRef.current);
  }, []);

  const selectAllByIds = useCallback((ids: number[]) => {
    setSelectedEventIdsRaw(ids);
    saveIdsToStorage(ids, workspaceIdRef.current);
  }, []);

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
