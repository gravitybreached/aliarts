import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    const limit = parseInt(searchParams.get("limit") || "12");

    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      db.favorite.findMany({
        where: { userId: user.id },
        include: {
          artwork: {
            include: {
              artist: { select: { id: true, name: true, image: true, username: true } },
              tags: { include: { tag: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.favorite.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: favorites,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[FAVORITES_GET]", error);
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
    const { artworkId } = body as { artworkId: string };

    if (!artworkId) {
      return NextResponse.json(
        { success: false, error: "Artwork ID is required" },
        { status: 400 }
      );
    }

    // Check if artwork exists
    const artwork = await db.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      return NextResponse.json(
        { success: false, error: "Artwork not found" },
        { status: 404 }
      );
    }

    // Toggle favorite
    const existing = await db.favorite.findUnique({
      where: {
        userId_artworkId: {
          userId: user.id,
          artworkId,
        },
      },
    });

    if (existing) {
      // Remove favorite (toggle off)
      await db.favorite.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        success: true,
        data: { favorited: false, message: "Removed from favorites" },
      });
    } else {
      // Add favorite (toggle on)
      const favorite = await db.favorite.create({
        data: {
          userId: user.id,
          artworkId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: { favorited: true, favorite, message: "Added to favorites" },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("[FAVORITES_POST]", error);
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
    const artworkId = searchParams.get("artworkId") || "";
    const id = searchParams.get("id") || "";

    if (!artworkId && !id) {
      return NextResponse.json(
        { success: false, error: "Artwork ID or favorite ID is required" },
        { status: 400 }
      );
    }

    let where: { id: string } | { userId_artworkId: { userId: string; artworkId: string } };

    if (id) {
      where = { id };
    } else {
      where = {
        userId_artworkId: {
          userId: user.id,
          artworkId,
        },
      };
    }

    const existing = await db.favorite.findUnique({ where });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Favorite not found" },
        { status: 404 }
      );
    }

    // Ensure user owns this favorite
    if (existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized" },
        { status: 403 }
      );
    }

    await db.favorite.delete({ where });

    return NextResponse.json({
      success: true,
      data: { message: "Removed from favorites" },
    });
  } catch (error) {
    console.error("[FAVORITES_DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
