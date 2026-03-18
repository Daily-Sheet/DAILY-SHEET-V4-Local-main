import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { api } from "@shared/routes";
import { queryClient as globalQueryClient } from "@/lib/queryClient";

export type AuthUser = User & { eventAssignments?: string[]; projectAssignments?: { projectId: number; position?: string | null }[]; workspaceRole?: string; workspaceCount?: number };

interface BootstrapResponse {
  user: AuthUser;
  workspaceCount?: number;
  schedules: any[];
  contacts: any[];
  venues: any[];
  events: any[];
  zones: any[];
  sections: any[];
  projects: any[];
  eventAssignments: any[];
  projectAssignments: any[];
  taskTypes: any[];
  eventDayVenues: any[];
  files: any[];
  fileFolders: any[];
  userActivity: any[];
  departments: any[];
  crewPositions: any[];
}

let needsBootstrap = true;

export function resetBootstrap() {
  needsBootstrap = true;
}

function seedQueryCaches(data: BootstrapResponse) {
  globalQueryClient.setQueryData([api.schedules.list.path], data.schedules);
  globalQueryClient.setQueryData([api.contacts.list.path], data.contacts);
  globalQueryClient.setQueryData([api.venues.list.path], data.venues);
  globalQueryClient.setQueryData([api.files.list.path], data.files);
  globalQueryClient.setQueryData(["/api/events"], data.events);
  globalQueryClient.setQueryData(["/api/zones"], data.zones);
  globalQueryClient.setQueryData(["/api/sections"], data.sections);
  globalQueryClient.setQueryData(["/api/projects"], data.projects);
  globalQueryClient.setQueryData(["/api/event-assignments"], data.eventAssignments);
  globalQueryClient.setQueryData(["/api/project-assignments"], data.projectAssignments || []);
  globalQueryClient.setQueryData(["/api/task-types"], data.taskTypes);
  globalQueryClient.setQueryData(["/api/event-day-venues"], data.eventDayVenues);
  globalQueryClient.setQueryData(["/api/file-folders"], data.fileFolders);
  globalQueryClient.setQueryData(["/api/user-activity"], data.userActivity);
  globalQueryClient.setQueryData(["/api/departments"], data.departments);
  globalQueryClient.setQueryData(["/api/crew-positions"], data.crewPositions);
}

async function fetchWithBootstrap(): Promise<AuthUser | null> {
  if (!needsBootstrap) {
    const response = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/auth/user", { credentials: "include" });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return response.json();
  }

  const response = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/bootstrap", { credentials: "include" });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const data: BootstrapResponse = await response.json();
  needsBootstrap = false;
  seedQueryCaches(data);
  const user = data.user;
  if (data.workspaceCount !== undefined) {
    user.workspaceCount = data.workspaceCount;
  }
  return user;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchWithBootstrap,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      needsBootstrap = true;
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
