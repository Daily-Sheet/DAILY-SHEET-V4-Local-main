/** Project type color system: Tours=blue, Festivals=purple, One-offs=red */

export type ProjectTypeColors = {
  bg: string;
  bgSubtle: string;
  border: string;
  text: string;
  darkText: string;
  dot: string;
};

const TOUR_COLORS: ProjectTypeColors = {
  bg: "bg-blue-500/10",
  bgSubtle: "bg-blue-500/5",
  border: "border-blue-500/20",
  text: "text-blue-600",
  darkText: "dark:text-blue-400",
  dot: "bg-blue-500",
};

const FESTIVAL_COLORS: ProjectTypeColors = {
  bg: "bg-purple-500/10",
  bgSubtle: "bg-purple-500/5",
  border: "border-purple-500/20",
  text: "text-purple-600",
  darkText: "dark:text-purple-400",
  dot: "bg-purple-500",
};

const ONEOFF_COLORS: ProjectTypeColors = {
  bg: "bg-red-500/10",
  bgSubtle: "bg-red-500/5",
  border: "border-red-500/20",
  text: "text-red-600",
  darkText: "dark:text-red-400",
  dot: "bg-red-500",
};

export function getProjectTypeColors(project: { isTour?: boolean | null; isFestival?: boolean | null } | null | undefined): ProjectTypeColors {
  if (!project) return ONEOFF_COLORS;
  if (project.isTour) return TOUR_COLORS;
  if (project.isFestival) return FESTIVAL_COLORS;
  return ONEOFF_COLORS;
}

export function getProjectTypeLabel(project: { isTour?: boolean | null; isFestival?: boolean | null } | null | undefined): string {
  if (!project) return "Show";
  if (project.isTour) return "Tour";
  if (project.isFestival) return "Festival";
  return "Show";
}
