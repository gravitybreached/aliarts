import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level") || "";
    const status = searchParams.get("status") || "PUBLISHED";
    const featured = searchParams.get("featured");
    const categoryId = searchParams.get("categoryId") || "";
    const tagId = searchParams.get("tagId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (level) {
      where.level = level;
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    if (tagId) {
      where.tags = { some: { tagId } };
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, image: true, username: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          _count: { select: { enrollments: true, lessons: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder === "desc" ? "desc" : "asc" },
      }),
      db.course.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: courses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[COURSES_GET]", error);
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

    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = Z.courseSchema.parse(body);

    // Check slug uniqueness
    const existingSlug = await db.course.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: "A course with this slug already exists" },
        { status: 409 }
      );
    }

    const course = await db.course.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        description: validated.description || null,
        content: validated.content || null,
        price: validated.price,
        salePrice: validated.salePrice || null,
        thumbnail: validated.thumbnail || null,
        level: validated.level,
        status: validated.status,
        featured: validated.featured,
        publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true, username: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: course },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[COURSES_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
