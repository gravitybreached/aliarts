import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.notification.count({ where }),
    ]);

    // Get unread count
    const unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });

      return NextResponse.json({
        success: true,
        data: { message: "All notifications marked as read" },
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Provide ids array or set markAll to true" },
        { status: 400 }
      );
    }

    await db.notification.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      data: { message: `${ids.length} notification(s) marked as read` },
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
