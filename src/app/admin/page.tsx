"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  Palette,
  DollarSign,
  ShoppingCart,
  UserCheck,
  Plus,
  Ticket,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Flag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalEnrollments: number;
    totalCourses: number;
    totalArtworks: number;
    totalPosts: number;
  };
  trends: {
    recentUsers: number;
    recentOrders: number;
    recentRevenue: number;
  };
  breakdown: {
    ordersByStatus: { status: string; count: number }[];
    usersByRole: { role: string; count: number }[];
  };
  topCourses: Array<{
    id: string;
    title: string;
    _count: { enrollments: number };
  }>;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  role: string;
}

// Generate mock chart data
const revenueData = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: Math.floor(Math.random() * 2000) + 500,
    orders: Math.floor(Math.random() * 20) + 5,
  };
});

const enrollmentData = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    enrollments: Math.floor(Math.random() * 30) + 10,
  };
});

const statsConfig = [
  {
    title: "Total Users",
    key: "totalUsers" as const,
    icon: Users,
    trend: "recentUsers" as const,
    trendLabel: "last 7 days",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Total Courses",
    key: "totalCourses" as const,
    icon: GraduationCap,
    trend: null,
    trendLabel: "published",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Total Artworks",
    key: "totalArtworks" as const,
    icon: Palette,
    trend: null,
    trendLabel: "published",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Total Revenue",
    key: "totalRevenue" as const,
    icon: DollarSign,
    trend: "recentRevenue" as const,
    trendLabel: "last 30 days",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Total Orders",
    key: "totalOrders" as const,
    icon: ShoppingCart,
    trend: "recentOrders" as const,
    trendLabel: "last 7 days",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Total Enrollments",
    key: "totalEnrollments" as const,
    icon: UserCheck,
    trend: null,
    trendLabel: "active",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, ordersRes] = await Promise.all([
          fetch("/api/v1/analytics"),
          fetch("/api/v1/orders?limit=5"),
        ]);

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          if (analyticsData.success) setAnalytics(analyticsData.data);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success) {
            setRecentOrders(ordersData.data.items || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const overview = analytics?.overview;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your AliArts platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/admin/courses">
              <Plus className="mr-1 h-4 w-4" />
              Add Course
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/artworks">
              <Palette className="mr-1 h-4 w-4" />
              Add Artwork
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/coupons">
              <Ticket className="mr-1 h-4 w-4" />
              Create Coupon
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsConfig.map((stat) => {
          const value = overview?.[stat.key] ?? 0;
          const trendValue =
            stat.trend && analytics?.trends?.[stat.trend]
              ? analytics.trends[stat.trend]
              : null;

          return (
            <Card key={stat.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`rounded-md p-2 ${stat.bg}`}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  {trendValue !== null && (
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="h-3 w-3" />
                      {trendValue}
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">
                    {stat.key === "totalRevenue"
                      ? `$${value.toLocaleString()}`
                      : value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="oklch(0.55 0.18 45)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.55 0.18 45)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.91 0.015 75)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.55 0.18 45)"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment Trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.91 0.015 75)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="oklch(0.65 0.15 55)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(0.65 0.15 55)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/orders">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No orders yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.orderNumber.slice(0, 12)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.user?.name || order.user?.email}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[order.status] || ""}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Courses</CardTitle>
            <CardDescription>By enrollment count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            ) : !analytics?.topCourses?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No courses yet
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.topCourses.map((course, i) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {course.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <UserCheck className="h-3 w-3" />
                      {course._count.enrollments}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/courses">
                <GraduationCap className="h-5 w-5 text-amber-600" />
                <span className="text-xs">Manage Courses</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/artworks">
                <Palette className="h-5 w-5 text-purple-600" />
                <span className="text-xs">Manage Artworks</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/moderation">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Moderation Queue</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/reports">
                <Flag className="h-5 w-5 text-red-600" />
                <span className="text-xs">View Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
