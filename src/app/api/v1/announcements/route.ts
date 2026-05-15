import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";

    const now = new Date();

    const where: Record<string, unknown> = {
      active: true,
      OR: [
        { startsAt: null, expiresAt: null },
        { startsAt: { lte: now }, expiresAt: null },
        { startsAt: null, expiresAt: { gte: now } },
        { startsAt: { lte: now }, expiresAt: { gte: now } },
      ],
    };

    if (type) {
      where.type = type;
    }

    const announcements = await db.announcement.findMany({
      where,
      orderBy: [
        { pinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("[ANNOUNCEMENTS_GET]", error);
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
    const validated = Z.announcementSchema.parse(body);

    const announcement = await db.announcement.create({
      data: {
        title: validated.title,
        content: validated.content,
        type: validated.type,
        pinned: validated.pinned,
        active: validated.active,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: announcement },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[ANNOUNCEMENTS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
