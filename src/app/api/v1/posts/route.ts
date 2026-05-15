import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "APPROVED";
    const authorId = searchParams.get("authorId") || "";
    const pinned = searchParams.get("pinned");
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
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (pinned === "true") {
      where.pinned = true;
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, image: true, username: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true } },
        },
        skip,
        take: limit,
        orderBy: [
          ...(pinned === "true" ? [{ pinned: "desc" as const }] : []),
          { [sortBy]: sortOrder === "desc" ? "desc" : "asc" },
        ],
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[POSTS_GET]", error);
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
    const validated = Z.postSchema.parse(body);

    const post = await db.post.create({
      data: {
        title: validated.title,
        content: validated.content || null,
        type: validated.type,
        status: "PENDING",
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true, username: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[POSTS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
