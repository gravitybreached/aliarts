import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

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
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const admin = await isAdmin();

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their own orders
    if (!admin) {
      where.userId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, username: true } },
          items: true,
          coupon: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, couponCode } = body as {
      items: { itemType: "COURSE" | "ARTWORK"; itemId: string; title: string; price: number; quantity?: number }[];
      couponCode?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order items are required" },
        { status: 400 }
      );
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      total += item.price * (item.quantity || 1);
    }

    // Validate and apply coupon
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (!coupon || !coupon.active) {
        return NextResponse.json(
          { success: false, error: "Invalid or inactive coupon" },
          { status: 400 }
        );
      }

      const now = new Date();
      if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        return NextResponse.json(
          { success: false, error: "Coupon is not yet active" },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        return NextResponse.json(
          { success: false, error: "Coupon has expired" },
          { status: 400 }
        );
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json(
          { success: false, error: "Coupon has reached maximum uses" },
          { status: 400 }
        );
      }

      if (coupon.minAmount && total < coupon.minAmount) {
        return NextResponse.json(
          { success: false, error: `Minimum order amount is ${coupon.minAmount}` },
          { status: 400 }
        );
      }

      // Apply discount
      if (coupon.type === "PERCENTAGE") {
        total = total - (total * coupon.value) / 100;
      } else {
        total = total - coupon.value;
      }

      total = Math.max(0, total);
      couponId = coupon.id;
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        total,
        currency: "USD",
        userId: user.id,
        couponId,
        items: {
          create: items.map((item) => ({
            itemType: item.itemType,
            itemId: item.itemId,
            title: item.title,
            price: item.price,
            quantity: item.quantity || 1,
          })),
        },
      },
      include: {
        items: true,
        coupon: true,
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        title: "Order Created",
        message: `Your order ${orderNumber} has been created successfully.`,
        type: "ORDER",
        userId: user.id,
        link: `/orders/${order.id}`,
      },
    });

    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ORDERS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
