import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Run all stats queries in parallel
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      totalEnrollments,
      totalCourses,
      totalArtworks,
      totalPosts,
      recentUsers,
      recentOrders,
      ordersByStatus,
      usersByRole,
      topCourses,
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Total orders
      db.order.count(),

      // Total revenue from paid orders
      db.order.aggregate({
        where: { status: "PAID" },
        _sum: { total: true },
      }),

      // Total enrollments
      db.enrollment.count(),

      // Total published courses
      db.course.count({ where: { status: "PUBLISHED" } }),

      // Total published artworks
      db.artwork.count({ where: { status: "PUBLISHED" } }),

      // Total approved posts
      db.post.count({ where: { status: "APPROVED" } }),

      // Recent users (last 7 days)
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Recent orders (last 7 days)
      db.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Orders by status
      db.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // Users by role
      db.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),

      // Top courses by enrollment
      db.course.findMany({
        where: { status: "PUBLISHED" },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { enrollments: { _count: "desc" } },
        take: 5,
      }),
    ]);

    // Recent revenue (last 30 days)
    const recentRevenue = await db.order.aggregate({
      where: {
        status: "PAID",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { total: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          totalEnrollments,
          totalCourses,
          totalArtworks,
          totalPosts,
        },
        trends: {
          recentUsers,
          recentOrders,
          recentRevenue: recentRevenue._sum.total || 0,
        },
        breakdown: {
          ordersByStatus: ordersByStatus.map((o) => ({
            status: o.status,
            count: o._count.status,
          })),
          usersByRole: usersByRole.map((u) => ({
            role: u.role,
            count: u._count.role,
          })),
        },
        topCourses,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
