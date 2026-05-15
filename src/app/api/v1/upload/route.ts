import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || undefined;
    const alt = (formData.get("alt") as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File type not allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop() || "bin";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const { url, key } = await uploadToS3(
      buffer,
      uniqueFileName,
      file.type,
      user.role,
      folder
    );

    // Determine media type category
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "document";

    const mediaAsset = await db.mediaAsset.create({
      data: {
        url,
        key,
        name: file.name,
        type,
        size: file.size,
        mimeType: file.type,
        alt,
        folder: folder || null,
        uploaderId: user.id,
      },
    });

    return NextResponse.json(
      { success: true, data: mediaAsset },
      { status: 201 }
    );
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
