import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const active = searchParams.get("active");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (active === "true") {
      where.active = true;
    } else if (active === "false") {
      where.active = false;
    }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.coupon.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: coupons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[COUPONS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this is a validate request
    if (body.validate) {
      const { code, amount } = body as { code: string; amount?: number };

      const coupon = await db.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return NextResponse.json(
          { success: false, error: "Invalid coupon code" },
          { status: 404 }
        );
      }

      if (!coupon.active) {
        return NextResponse.json(
          { success: false, error: "Coupon is not active" },
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

      if (coupon.minAmount && amount && amount < coupon.minAmount) {
        return NextResponse.json(
          { success: false, error: `Minimum order amount is ${coupon.minAmount}` },
          { status: 400 }
        );
      }

      // Calculate discount
      let discount = 0;
      if (coupon.type === "PERCENTAGE") {
        discount = amount ? (amount * coupon.value) / 100 : 0;
      } else {
        discount = coupon.value;
      }

      return NextResponse.json({
        success: true,
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minAmount: coupon.minAmount,
          },
          discount,
        },
      });
    }

    // Create coupon
    const validated = Z.couponSchema.parse(body);

    // Check code uniqueness
    const existingCoupon = await db.coupon.findUnique({
      where: { code: validated.code.toUpperCase() },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: validated.code.toUpperCase(),
        type: validated.type,
        value: validated.value,
        minAmount: validated.minAmount || null,
        maxUses: validated.maxUses || null,
        startsAt: validated.startsAt ? new Date(validated.startsAt) : null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        active: validated.active,
      },
    });

    return NextResponse.json(
      { success: true, data: coupon },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[COUPONS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
