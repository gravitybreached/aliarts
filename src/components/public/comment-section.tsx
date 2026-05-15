"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Reply, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
  } | null;
  _count?: {
    likes: number;
    replies: number;
  } | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded?: () => void;
}

export function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, postId }),
      });
      if (res.ok) {
        setNewComment("");
        onCommentAdded?.();
        toast({ title: "Comment posted!" });
      } else {
        toast({ title: "Failed to post comment", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error posting comment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId, postId }),
      });
      if (res.ok) {
        setReplyContent("");
        setReplyingTo(null);
        onCommentAdded?.();
        toast({ title: "Reply posted!" });
      }
    } catch {
      toast({ title: "Error posting reply", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment input */}
      {session && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user?.image || ""} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              size="sm"
              className="mt-2"
            >
              Post Comment
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <CommentItem
              comment={comment}
              onReply={() => setReplyingTo(comment.id)}
              isReplyingTo={replyingTo === comment.id}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onSubmitReply={() => handleSubmitReply(comment.id)}
              submitting={submitting}
              session={session}
            />

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-8 space-y-3 border-l-2 border-border pl-4">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    session={session}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  isReplyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  submitting,
  session,
}: {
  comment: Comment;
  onReply?: () => void;
  isReplyingTo?: boolean;
  replyContent?: string;
  onReplyContentChange?: (val: string) => void;
  onSubmitReply?: () => void;
  submitting?: boolean;
  session?: any;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author?.image || ""} />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.author?.name || comment.author?.username || "User"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          {comment._count && comment._count.likes > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              {comment._count.likes}
            </span>
          )}
          {onReply && session && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={onReply}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>

        {isReplyingTo && (
          <div className="mt-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent || ""}
              onChange={(e) => onReplyContentChange?.(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            <div className="flex gap-2 mt-1">
              <Button
                onClick={onSubmitReply}
                disabled={submitting || !replyContent?.trim()}
                size="sm"
              >
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReplyContentChange?.("")}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
