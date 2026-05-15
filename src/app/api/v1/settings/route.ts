import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group") || "";

    const where: Record<string, unknown> = {};

    // Only return public settings for non-admin users
    const admin = await isAdmin();
    if (!admin) {
      where.group = "public";
    } else if (group) {
      where.group = group;
    }

    const settings = await db.setting.findMany({
      where,
      orderBy: { group: "asc" },
    });

    // Convert to key-value object
    const settingsMap: Record<string, Record<string, string>> = {};
    for (const setting of settings) {
      if (!settingsMap[setting.group]) {
        settingsMap[setting.group] = {};
      }
      settingsMap[setting.group][setting.key] = setting.value;
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body as {
      settings: { key: string; value: string; group?: string }[];
    };

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: "Settings array is required" },
        { status: 400 }
      );
    }

    // Validate each setting
    for (const setting of settings) {
      Z.settingSchema.parse(setting);
    }

    // Upsert each setting
    const results = await Promise.all(
      settings.map((setting) =>
        db.setting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            group: setting.group || "general",
          },
          create: {
            key: setting.key,
            value: setting.value,
            group: setting.group || "general",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[SETTINGS_PUT]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
