import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface EventSelectionContextType {
  selectedEvents: string[];
  setSelectedEvents: (events: string[]) => void;
  toggleEvent: (name: string) => void;
  singleSelect: (name: string) => void;
  selectAll: (events: string[]) => void;
  setWorkspaceScope: (workspaceId: number) => void;
}

const STORAGE_PREFIX = "dailysheet_selected_events";

const EventSelectionContext = createContext<EventSelectionContextType | null>(null);

function getStorageKey(workspaceId: number | null): string {
  return workspaceId ? `${STORAGE_PREFIX}_ws${workspaceId}` : STORAGE_PREFIX;
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

function saveToStorage(events: string[], workspaceId: number | null) {
  try {
    localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(events));
  } catch {}
}

export function EventSelectionProvider({ children }: { children: ReactNode }) {
  const workspaceIdRef = useRef<number | null>(null);
  const [selectedEvents, setSelectedEventsRaw] = useState<string[]>([]);

  const setWorkspaceScope = useCallback((workspaceId: number) => {
    if (workspaceIdRef.current !== workspaceId) {
      workspaceIdRef.current = workspaceId;
      setSelectedEventsRaw(loadFromStorage(workspaceId));
    }
  }, []);

  const setSelectedEvents = useCallback((events: string[]) => {
    setSelectedEventsRaw(events);
    saveToStorage(events, workspaceIdRef.current);
  }, []);

  const toggleEvent = useCallback((name: string) => {
    setSelectedEventsRaw(prev => {
      const isSelected = prev.includes(name);
      const next = isSelected ? prev.filter(n => n !== name) : [...prev, name];
      saveToStorage(next, workspaceIdRef.current);
      return next;
    });
  }, []);

  const singleSelect = useCallback((name: string) => {
    const next = [name];
    setSelectedEventsRaw(next);
    saveToStorage(next, workspaceIdRef.current);
  }, []);

  const selectAll = useCallback((events: string[]) => {
    setSelectedEventsRaw(events);
    saveToStorage(events, workspaceIdRef.current);
  }, []);

  return (
    <EventSelectionContext.Provider value={{
      selectedEvents,
      setSelectedEvents,
      toggleEvent,
      singleSelect,
      selectAll,
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
