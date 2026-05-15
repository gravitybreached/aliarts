import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const tags = await db.tag.findMany({
      where,
      include: {
        _count: { select: { courses: true, artworks: true, posts: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("[TAGS_GET]", error);
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
    const validated = Z.tagSchema.parse(body);

    // Check slug uniqueness
    const existingSlug = await db.tag.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: "A tag with this slug already exists" },
        { status: 409 }
      );
    }

    // Check name uniqueness
    const existingName = await db.tag.findUnique({
      where: { name: validated.name },
    });

    if (existingName) {
      return NextResponse.json(
        { success: false, error: "A tag with this name already exists" },
        { status: 409 }
      );
    }

    const tag = await db.tag.create({
      data: {
        name: validated.name,
        slug: validated.slug,
      },
    });

    return NextResponse.json(
      { success: true, data: tag },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[TAGS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
