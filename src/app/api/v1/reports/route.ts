import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

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
    const { reason, description, targetType, targetId } = body as {
      reason: string;
      description?: string;
      targetType: string;
      targetId: string;
    };

    if (!reason || !targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: "reason, targetType, and targetId are required" },
        { status: 400 }
      );
    }

    // Validate target type
    const validTargetTypes = ["POST", "COMMENT", "ARTWORK", "COURSE", "USER"];
    if (!validTargetTypes.includes(targetType.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid target type" },
        { status: 400 }
      );
    }

    // Check for duplicate report by same user
    const existingReport = await db.report.findFirst({
      where: {
        reporterId: user.id,
        targetType: targetType.toUpperCase(),
        targetId,
        status: "PENDING",
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: "You have already reported this content" },
        { status: 409 }
      );
    }

    const report = await db.report.create({
      data: {
        reason,
        description: description || null,
        targetType: targetType.toUpperCase(),
        targetId,
        reporterId: user.id,
      },
    });

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REPORTS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const status = searchParams.get("status") || "";
    const targetType = searchParams.get("targetType") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (targetType) {
      where.targetType = targetType.toUpperCase();
    }

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, email: true, username: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.report.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status } = body as { id: string; status: string };

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Report ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["REVIEWED", "RESOLVED", "DISMISSED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be REVIEWED, RESOLVED, or DISMISSED" },
        { status: 400 }
      );
    }

    const existingReport = await db.report.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    const user = await getCurrentUser();

    const report = await db.report.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: user?.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("[REPORTS_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
