"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Heart,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicLayout } from "@/components/public/public-layout";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const { data: enrollmentsData } = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => {
      const res = await fetch("/api/v1/enrollments?limit=10");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!session,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/v1/orders?limit=5");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!session,
  });

  const { data: favoritesData } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/v1/favorites?limit=1");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!session,
  });

  if (status === "loading") {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!session) return null;

  const enrollments = enrollmentsData?.data?.items || [];
  const orders = ordersData?.data?.items || [];
  const favoritesCount = favoritesData?.data?.pagination?.total || 0;

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back, {session.user?.name || "User"}!
            </h1>
            <p className="text-muted-foreground mt-1">Here&apos;s an overview of your activity</p>
          </div>
          <Link href="/upload">
            <Button>
              Upload Artwork
            </Button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                    <p className="text-3xl font-bold mt-1">{enrollments.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-3xl font-bold mt-1">{orders.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                    <p className="text-3xl font-bold mt-1">{favoritesCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enrolled Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Enrolled Courses
              </CardTitle>
              <Link href="/courses">
                <Button variant="ghost" size="sm">
                  Browse <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {enrollments.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                  {enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {enrollment.course?.thumbnail ? (
                          <img src={enrollment.course.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{enrollment.course?.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {Math.round(enrollment.progress)}%
                          </span>
                        </div>
                      </div>
                      <Link href={`/courses/${enrollment.courseId}`}>
                        <Button variant="ghost" size="sm">Continue</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No enrollments yet</p>
                  <Link href="/courses">
                    <Button variant="outline" size="sm" className="mt-3">
                      Browse Courses
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">${order.total.toFixed(2)}</span>
                        <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { href: "/courses", icon: BookOpen, label: "Browse Courses" },
                  { href: "/artworks", icon: Heart, label: "Explore Art" },
                  { href: "/community", icon: TrendingUp, label: "Community" },
                  { href: "/profile", icon: Clock, label: "My Profile" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <link.icon className="h-5 w-5" />
                      <span className="text-xs">{link.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
