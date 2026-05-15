"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  GraduationCap,
  ShoppingCart,
  MessageSquare,
  Heart,
  Check,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/public/public-layout";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const typeConfig: Record<string, { icon: any; color: string }> = {
  INFO: { icon: Info, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  SUCCESS: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
  WARNING: { icon: AlertTriangle, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
  ERROR: { icon: XCircle, color: "text-red-500 bg-red-100 dark:bg-red-900/30" },
  ENROLLMENT: { icon: GraduationCap, color: "text-primary bg-primary/10" },
  ORDER: { icon: ShoppingCart, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
  COMMENT: { icon: MessageSquare, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
  LIKE: { icon: Heart, color: "text-red-500 bg-red-100 dark:bg-red-900/30" },
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/v1/notifications?limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!session,
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "All notifications marked as read" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.data?.items || [];
  const unreadCount = data?.data?.unreadCount || 0;

  if (status === "loading") {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!session) return null;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification: any) => {
                const config = typeConfig[notification.type] || typeConfig.INFO;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className={`transition-colors cursor-pointer hover:shadow-sm ${
                        !notification.read ? "border-primary/30 bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markReadMutation.mutate([notification.id]);
                        }
                        if (notification.link) {
                          router.push(notification.link);
                        }
                      }}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{notification.title}</p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate([notification.id]);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                When you receive notifications, they&apos;ll appear here.
              </p>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
