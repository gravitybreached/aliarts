"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  MessageSquare,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  content: string | null;
  image: string | null;
  type: string;
  status: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string | null; username: string | null; image: string | null };
  _count: { comments: number; likes: number };
  tags: Array<{ tag: { id: string; name: string } }>;
}

interface Comment {
  id: string;
  content: string;
  hidden: boolean;
  createdAt: string;
  author: { id: string; name: string | null; username: string | null };
  post: { id: string; title: string } | null;
  _count: { likes: number; replies: number };
}

const postStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  HIDDEN: "bg-gray-100 text-gray-800",
};

const typeColors: Record<string, string> = {
  DISCUSSION: "bg-blue-100 text-blue-800",
  CHALLENGE: "bg-purple-100 text-purple-800",
  SHOWCASE: "bg-amber-100 text-amber-800",
  ANNOUNCEMENT: "bg-red-100 text-red-800",
  FEEDBACK: "bg-green-100 text-green-800",
};

export default function ModerationPage() {
  const { toast } = useToast();
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPost, setViewPost] = useState<Post | null>(null);

  const fetchPendingPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/posts?status=PENDING&limit=50");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPendingPosts(data.data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/comments?admin=true&limit=50");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setComments(data.data?.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchPendingPosts(), fetchComments()]);
      setLoading(false);
    }
    load();
  }, [fetchPendingPosts, fetchComments]);

  async function approvePost(post: Post) {
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (res.ok) {
        toast({ title: "Post approved" });
        fetchPendingPosts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to approve post", variant: "destructive" });
    }
  }

  async function rejectPost(post: Post) {
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) {
        toast({ title: "Post rejected" });
        fetchPendingPosts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to reject post", variant: "destructive" });
    }
  }

  async function togglePin(post: Post) {
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !post.pinned }),
      });
      if (res.ok) {
        toast({ title: post.pinned ? "Post unpinned" : "Post pinned" });
        fetchPendingPosts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to toggle pin", variant: "destructive" });
    }
  }

  async function toggleCommentHidden(comment: Comment) {
    try {
      const res = await fetch(`/api/v1/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !comment.hidden }),
      });
      if (res.ok) {
        toast({ title: comment.hidden ? "Comment unhidden" : "Comment hidden" });
        fetchComments();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update comment", variant: "destructive" });
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Community & Moderation</h1>
        <p className="text-muted-foreground">Moderate posts and comments</p>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Pending Posts
            {pendingPosts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{pendingPosts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <Shield className="h-4 w-4" />
            Comment Moderation
          </TabsTrigger>
          <TabsTrigger value="spam" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Spam Detection
          </TabsTrigger>
        </TabsList>

        {/* Pending Posts */}
        <TabsContent value="posts" className="mt-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-muted-foreground">All caught up! No pending posts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={typeColors[post.type] || ""}>{post.type}</Badge>
                          <Badge variant="secondary" className={postStatusColors[post.status] || ""}>{post.status}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm">{post.title}</h3>
                        {post.content && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>by {post.author?.name || "Unknown"}</span>
                          <span>{formatDate(post.createdAt)}</span>
                          <span>{post._count.comments} comments</span>
                          <span>{post._count.likes} likes</span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewPost(post)}>
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                        <Button size="sm" onClick={() => approvePost(post)}>
                          <CheckCircle className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectPost(post)}>
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Comments */}
        <TabsContent value="comments" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No comments to moderate</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comment</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="hidden md:table-cell">Post</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="max-w-[250px]">
                          <p className="text-sm truncate">{comment.content}</p>
                        </TableCell>
                        <TableCell className="text-sm">{comment.author?.name || "Unknown"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[150px]">
                          {comment.post?.title || "—"}
                        </TableCell>
                        <TableCell>
                          {comment.hidden ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">Hidden</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">Visible</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleCommentHidden(comment)}>
                            {comment.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spam Detection */}
        <TabsContent value="spam" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold">Spam Detection</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Automated spam detection will appear here. Posts flagged as potential spam will be quarantined for review.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Post Dialog */}
      <Dialog open={!!viewPost} onOpenChange={() => setViewPost(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewPost?.title}</DialogTitle>
          </DialogHeader>
          {viewPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={typeColors[viewPost.type] || ""}>{viewPost.type}</Badge>
                <Badge variant="secondary" className={postStatusColors[viewPost.status] || ""}>{viewPost.status}</Badge>
                {viewPost.pinned && <Badge className="bg-amber-100 text-amber-800">Pinned</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                by {viewPost.author?.name || "Unknown"} &middot; {formatDate(viewPost.createdAt)}
              </div>
              {viewPost.image && (
                <img src={viewPost.image} alt="" className="w-full rounded-md" />
              )}
              <div className="text-sm whitespace-pre-wrap">{viewPost.content || "No content"}</div>
              <Separator />
              <div className="flex gap-2">
                <Button onClick={() => { approvePost(viewPost); setViewPost(null); }} className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button variant="destructive" onClick={() => { rejectPost(viewPost); setViewPost(null); }} className="flex-1">
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button variant="outline" onClick={() => { togglePin(viewPost); setViewPost(null); }}>
                  {viewPost.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
