import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import * as Z from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = Z.signupSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if username already exists (if provided)
    if (validated.username) {
      const existingUsername = await db.user.findUnique({
        where: { username: validated.username },
      });

      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await hashPassword(validated.password);

    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        username: validated.username || null,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    console.error("[AUTH_REGISTER]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
