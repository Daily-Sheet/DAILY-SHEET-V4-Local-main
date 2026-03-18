import { useState } from "react";
import { format } from "date-fns";
import { Pin, MessageSquare, Send, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useComments, useCreateComment, useDeleteComment, useToggleCommentPin } from "@/hooks/use-comments";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export function ScheduleCommentsDialog({ scheduleId, itemTitle }: { scheduleId: number; itemTitle: string }) {
  const { user } = useAuth();
  const { data: commentsList = [], isLoading } = useComments(scheduleId);
  const { mutate: createComment, isPending } = useCreateComment(scheduleId);
  const { mutate: deleteComment } = useDeleteComment(scheduleId);
  const { mutate: togglePin } = useToggleCommentPin(scheduleId);
  const [newComment, setNewComment] = useState("");

  const canComment = ["owner", "manager", "admin", "commenter", "client", "viewer"].includes(user?.role || "");
  const canEdit = ["owner", "manager", "admin"].includes(user?.role || "");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment(newComment.trim(), {
      onSuccess: () => setNewComment(""),
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover-elevate px-1.5 py-0.5 rounded-md flex-shrink-0"
          data-testid={`button-toggle-comments-${scheduleId}`}
        >
          <MessageSquare className="h-3 w-3" />
          {commentsList.length > 0 && <span>{commentsList.length}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Comments — {itemTitle}</DialogTitle>
          <DialogDescription className="sr-only">View and add comments for this schedule item</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : commentsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          ) : (
            commentsList.map((c) => (
              <div key={c.id} className={`flex items-start gap-2 group rounded-md px-2 py-1.5 ${c.pinned ? "bg-muted/50" : ""}`} data-testid={`comment-${c.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.pinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
                    <span className="text-xs font-medium text-foreground" data-testid={`text-comment-author-${c.id}`}>{c.authorName}</span>
                    <span className="text-xs text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), "MMM d, h:mm a") : ""}</span>
                  </div>
                  <p className="text-sm text-foreground" data-testid={`text-comment-body-${c.id}`}>{c.body}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-6 w-6 ${c.pinned ? "text-primary" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}
                      onClick={() => togglePin(c.id)}
                      data-testid={`button-pin-comment-${c.id}`}
                    >
                      <Pin className="h-3 w-3" />
                    </Button>
                  )}
                  {canEdit && (
                    <ConfirmDelete
                      onConfirm={() => deleteComment(c.id)}
                      title="Delete comment?"
                      description="This comment will be permanently removed."
                      triggerClassName="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-delete-comment-${c.id}`}
                      triggerLabel={<Trash2 className="h-3 w-3" />}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {canComment && (
          <div className="flex gap-2 items-center pt-2 border-t">
            <Input
              className="text-sm"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              data-testid={`input-comment-${scheduleId}`}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              disabled={isPending || !newComment.trim()}
              data-testid={`button-submit-comment-${scheduleId}`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function InlineComments({ scheduleId }: { scheduleId: number }) {
  const { data: commentsList = [] } = useComments(scheduleId);
  if (commentsList.length === 0) return null;

  const pinnedComments = commentsList.filter(c => c.pinned);
  const recentUnpinned = commentsList.filter(c => !c.pinned);

  return (
    <div className="mt-1 space-y-0.5" data-testid={`inline-comments-${scheduleId}`}>
      {pinnedComments.map(c => (
        <div key={c.id} className="text-[11px] text-primary flex items-start gap-0.5" data-testid={`pinned-comment-${c.id}`}>
          <Pin className="h-2.5 w-2.5 flex-shrink-0 mt-0.5" />
          <span><span className="font-medium">{c.authorName.split(" ")[0]}:</span> {c.body}</span>
        </div>
      ))}
      {recentUnpinned.map(c => (
        <div key={c.id} className="text-[11px] text-muted-foreground" data-testid={`inline-comment-${c.id}`}>
          <span className="font-medium">{c.authorName.split(" ")[0]}:</span> {c.body}
        </div>
      ))}
    </div>
  );
}
