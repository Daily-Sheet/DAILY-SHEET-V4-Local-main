import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Comment } from "@shared/schema";

export function useComments(scheduleId: number) {
  return useQuery<Comment[]>({
    queryKey: ["/api/schedules", scheduleId, "comments"],
    enabled: scheduleId > 0,
  });
}

export function useCreateComment(scheduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await apiRequest("POST", `/api/schedules/${scheduleId}/comments`, { body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", scheduleId, "comments"] });
    },
  });
}

export function useDeleteComment(scheduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", scheduleId, "comments"] });
    },
  });
}

export function useToggleCommentPin(scheduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest("PATCH", `/api/comments/${commentId}/pin`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", scheduleId, "comments"] });
    },
  });
}
