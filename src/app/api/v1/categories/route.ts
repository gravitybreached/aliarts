import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";

    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }

    const categories = await db.category.findMany({
      where,
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
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
    const validated = Z.categorySchema.parse(body);

    // Check slug uniqueness
    const existingSlug = await db.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    // Check name uniqueness
    const existingName = await db.category.findUnique({
      where: { name: validated.name },
    });

    if (existingName) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await db.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
        icon: validated.icon || null,
        type: validated.type,
      },
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[CATEGORIES_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
