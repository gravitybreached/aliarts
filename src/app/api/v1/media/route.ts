import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteFromS3 } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "";
    const folder = searchParams.get("folder") || "";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their own uploads
    const admin = await isAdmin();
    if (!admin) {
      where.uploaderId = user.id;
    }

    if (type) {
      where.type = type;
    }

    if (folder) {
      where.folder = folder;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [media, total] = await Promise.all([
      db.mediaAsset.findMany({
        where,
        include: {
          uploader: { select: { id: true, name: true, username: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.mediaAsset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: media,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[MEDIA_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Media asset ID is required" },
        { status: 400 }
      );
    }

    const media = await db.mediaAsset.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media asset not found" },
        { status: 404 }
      );
    }

    // Only admin or the uploader can delete
    const admin = await isAdmin();
    if (!admin && media.uploaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized to delete this media" },
        { status: 403 }
      );
    }

    // Delete from S3
    try {
      await deleteFromS3(media.key);
    } catch (s3Error) {
      console.error("[MEDIA_DELETE_S3]", s3Error);
      // Continue with DB deletion even if S3 deletion fails
    }

    // Delete from database
    await db.mediaAsset.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Media asset deleted successfully" },
    });
  } catch (error) {
    console.error("[MEDIA_DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
