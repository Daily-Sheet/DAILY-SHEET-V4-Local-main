import { useEffect } from "react";

/**
 * Global keyboard shortcuts that work from any page.
 * Page-specific shortcuts (arrows, tab numbers, etc.) stay in their respective pages.
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      if (tag === "BUTTON" || (e.target as HTMLElement)?.getAttribute("role") === "tab") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "c" || e.key === "C") {
        if (window.location.pathname !== "/calendar") {
          window.location.href = "/calendar";
        }
        return;
      }
      if (e.key === "d" || e.key === "D") {
        if (window.location.pathname !== "/dashboard") {
          window.location.href = "/dashboard";
        }
        return;
      }
      if (e.key === "a" || e.key === "A") {
        if (window.location.pathname !== "/admin") {
          window.location.href = "/admin";
        }
        return;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
