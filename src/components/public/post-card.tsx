"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Pin, User } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content?: string | null;
    image?: string | null;
    type: string;
    pinned?: boolean;
    createdAt: string;
    author?: {
      id: string;
      name?: string | null;
      image?: string | null;
      username?: string | null;
    } | null;
    _count?: {
      comments: number;
      likes: number;
    } | null;
  };
}

const typeConfig: Record<string, { label: string; color: string }> = {
  DISCUSSION: { label: "Discussion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  CHALLENGE: { label: "Challenge", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  SHOWCASE: { label: "Showcase", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ANNOUNCEMENT: { label: "Announcement", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  FEEDBACK: { label: "Feedback", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
};

export function PostCard({ post }: PostCardProps) {
  const config = typeConfig[post.type] || typeConfig.DISCUSSION;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/community?post=${post.id}`}>
        <Card className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 h-full flex flex-col">
          <CardContent className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={config.color}>
                {config.label}
              </Badge>
              {post.pinned && (
                <Pin className="h-3.5 w-3.5 text-primary" />
              )}
            </div>

            {post.author && (
              <div className="flex items-center gap-2 mb-3">
                {post.author.image ? (
                  <img
                    src={post.author.image}
                    alt={post.author.name || ""}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{post.author.name || post.author.username || "User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>

            {post.content && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                {post.content}
              </p>
            )}

            {post.image && (
              <div className="mt-3 rounded-lg overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0 flex items-center gap-4 text-muted-foreground">
            {post._count && (
              <>
                <span className="flex items-center gap-1.5 text-sm">
                  <Heart className="h-4 w-4" />
                  {post._count.likes}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <MessageCircle className="h-4 w-4" />
                  {post._count.comments}
                </span>
              </>
            )}
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
