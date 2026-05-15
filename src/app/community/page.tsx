"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Plus, MessageSquare, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicLayout } from "@/components/public/public-layout";
import { PostCard } from "@/components/public/post-card";
import { SearchBar } from "@/components/public/search-bar";
import { PostCardSkeleton } from "@/components/public/loading-skeleton";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Create post form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("DISCUSSION");

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "12",
    status: "APPROVED",
    ...(search && { search }),
    ...(type && { type }),
    sortBy: "createdAt",
    sortOrder: "desc",
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["posts", search, type, page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/posts?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          type: newType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create post");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Post created! It will appear after approval." });
      setNewTitle("");
      setNewContent("");
      setNewType("DISCUSSION");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const posts = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const postTypes = [
    { value: "", label: "All" },
    { value: "DISCUSSION", label: "Discussion" },
    { value: "CHALLENGE", label: "Challenge" },
    { value: "SHOWCASE", label: "Showcase" },
    { value: "FEEDBACK", label: "Feedback" },
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3">
                <Users className="h-3 w-3 mr-1" />
                Community
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold">Community Hub</h1>
              <p className="text-muted-foreground mt-2">
                Share, discuss, and grow with fellow artists
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                </DialogHeader>
                {!session ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">You need to be logged in to create a post.</p>
                    <Button onClick={() => router.push("/login")}>Log In</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="post-type">Type</Label>
                      <Select value={newType} onValueChange={setNewType}>
                        <SelectTrigger id="post-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DISCUSSION">Discussion</SelectItem>
                          <SelectItem value="CHALLENGE">Challenge</SelectItem>
                          <SelectItem value="SHOWCASE">Showcase</SelectItem>
                          <SelectItem value="FEEDBACK">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="post-title">Title</Label>
                      <Input
                        id="post-title"
                        placeholder="What's on your mind?"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="post-content">Content</Label>
                      <Textarea
                        id="post-content"
                        placeholder="Share your thoughts, ideas, or work..."
                        className="min-h-[120px] resize-none"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={() => createPostMutation.mutate()}
                        disabled={createPostMutation.isPending || !newTitle.trim()}
                      >
                        {createPostMutation.isPending ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <SearchBar
            placeholder="Search posts..."
            onSearch={setSearch}
            className="flex-1 max-w-md"
          />
          <Tabs value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <TabsList>
              {postTypes.map((pt) => (
                <TabsTrigger key={pt.value} value={pt.value}>
                  {pt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              {search || type
                ? "Try adjusting your search or filters."
                : "Be the first to start a conversation!"}
            </p>
            {(search || type) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setType("");
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card>
        )}
      </section>
    </PublicLayout>
  );
}
