import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "PUBLISHED";
    const featured = searchParams.get("featured");
    const isForSale = searchParams.get("isForSale");
    const artistId = searchParams.get("artistId") || "";
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

    if (category) {
      where.category = category;
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (isForSale === "true") {
      where.isForSale = true;
    }

    if (artistId) {
      where.artistId = artistId;
    }

    const [artworks, total] = await Promise.all([
      db.artwork.findMany({
        where,
        include: {
          artist: { select: { id: true, name: true, image: true, username: true } },
          tags: { include: { tag: true } },
          _count: { select: { favorites: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder === "desc" ? "desc" : "asc" },
      }),
      db.artwork.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: artworks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ARTWORKS_GET]", error);
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
    const validated = Z.artworkSchema.parse(body);

    // Check slug uniqueness
    const existingSlug = await db.artwork.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: "An artwork with this slug already exists" },
        { status: 409 }
      );
    }

    const artwork = await db.artwork.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        description: validated.description || null,
        price: validated.price,
        salePrice: validated.salePrice || null,
        category: validated.category || null,
        medium: validated.medium || null,
        dimensions: validated.dimensions || null,
        year: validated.year || null,
        status: validated.status,
        featured: validated.featured,
        isForSale: validated.isForSale,
        isDownloadable: validated.isDownloadable,
        publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
        artistId: user.id,
      },
      include: {
        artist: { select: { id: true, name: true, image: true, username: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: artwork },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[ARTWORKS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
