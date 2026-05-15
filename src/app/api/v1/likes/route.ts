import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    const { type, postId, commentId } = body as {
      type?: "LIKE" | "LOVE" | "INSPIRE" | "AMAZING";
      postId?: string;
      commentId?: string;
    };

    if (!postId && !commentId) {
      return NextResponse.json(
        { success: false, error: "Either postId or commentId is required" },
        { status: 400 }
      );
    }

    if (postId && commentId) {
      return NextResponse.json(
        { success: false, error: "Provide either postId or commentId, not both" },
        { status: 400 }
      );
    }

    const likeType = type || "LIKE";

    // Toggle like on post
    if (postId) {
      // Verify post exists
      const post = await db.post.findUnique({ where: { id: postId } });
      if (!post) {
        return NextResponse.json(
          { success: false, error: "Post not found" },
          { status: 404 }
        );
      }

      const existing = await db.like.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      });

      if (existing) {
        // Toggle off — remove like
        await db.like.delete({ where: { id: existing.id } });

        return NextResponse.json({
          success: true,
          data: { liked: false, message: "Like removed" },
        });
      } else {
        // Toggle on — add like
        const like = await db.like.create({
          data: {
            type: likeType,
            userId: user.id,
            postId,
          },
        });

        // Create notification for post author
        if (post.authorId !== user.id) {
          await db.notification.create({
            data: {
              title: "New Like",
              message: `${user.name || "Someone"} liked your post`,
              type: "LIKE",
              userId: post.authorId,
              link: `/community/post/${postId}`,
            },
          });
        }

        return NextResponse.json(
          { success: true, data: { liked: true, like, message: "Like added" } },
          { status: 201 }
        );
      }
    }

    // Toggle like on comment
    if (commentId) {
      // Verify comment exists
      const comment = await db.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        return NextResponse.json(
          { success: false, error: "Comment not found" },
          { status: 404 }
        );
      }

      const existing = await db.like.findUnique({
        where: { userId_commentId: { userId: user.id, commentId } },
      });

      if (existing) {
        // Toggle off — remove like
        await db.like.delete({ where: { id: existing.id } });

        return NextResponse.json({
          success: true,
          data: { liked: false, message: "Like removed" },
        });
      } else {
        // Toggle on — add like
        const like = await db.like.create({
          data: {
            type: likeType,
            userId: user.id,
            commentId,
          },
        });

        // Create notification for comment author
        if (comment.authorId !== user.id) {
          await db.notification.create({
            data: {
              title: "New Like",
              message: `${user.name || "Someone"} liked your comment`,
              type: "LIKE",
              userId: comment.authorId,
            },
          });
        }

        return NextResponse.json(
          { success: true, data: { liked: true, like, message: "Like added" } },
          { status: 201 }
        );
      }
    }

    // This should never be reached due to earlier validation
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[LIKES_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
