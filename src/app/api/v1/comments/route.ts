import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId query parameter is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      postId,
      hidden: false,
    };

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, image: true, username: true } },
          _count: { select: { likes: true, replies: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder === "desc" ? "desc" : "asc" },
      }),
      db.comment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
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
    const validated = Z.commentSchema.parse(body);

    if (!validated.postId && !validated.parentId) {
      return NextResponse.json(
        { success: false, error: "Either postId or parentId is required" },
        { status: 400 }
      );
    }

    // If parentId is provided, get the postId from the parent comment
    let postId = validated.postId || null;
    if (validated.parentId && !postId) {
      const parentComment = await db.comment.findUnique({
        where: { id: validated.parentId },
        select: { postId: true },
      });
      if (parentComment) {
        postId = parentComment.postId;
      }
    }

    const comment = await db.comment.create({
      data: {
        content: validated.content,
        postId,
        parentId: validated.parentId || null,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true, username: true } },
      },
    });

    // Create notification for the post author if commenting on a post
    if (postId) {
      const post = await db.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
      if (post && post.authorId !== user.id) {
        await db.notification.create({
          data: {
            title: "New Comment",
            message: `${user.name || "Someone"} commented on your post`,
            type: "COMMENT",
            userId: post.authorId,
            link: `/community/post/${postId}`,
          },
        });
      }
    }

    return NextResponse.json(
      { success: true, data: comment },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[COMMENTS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
