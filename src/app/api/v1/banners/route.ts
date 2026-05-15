import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();

    const banners = await db.banner.findMany({
      where: {
        active: true,
        OR: [
          { startsAt: null, expiresAt: null },
          { startsAt: { lte: now }, expiresAt: null },
          { startsAt: null, expiresAt: { gte: now } },
          { startsAt: { lte: now }, expiresAt: { gte: now } },
        ],
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("[BANNERS_GET]", error);
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
    const validated = Z.bannerSchema.parse(body);

    const banner = await db.banner.create({
      data: {
        title: validated.title,
        subtitle: validated.subtitle || null,
        image: validated.image,
        link: validated.link || null,
        linkText: validated.linkText || null,
        position: validated.position,
        active: validated.active,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: banner },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[BANNERS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
