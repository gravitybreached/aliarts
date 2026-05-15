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
    const limit = parseInt(searchParams.get("limit") || "10");
    const completed = searchParams.get("completed");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (completed === "true") {
      where.completed = true;
    } else if (completed === "false") {
      where.completed = false;
    }

    const [enrollments, total] = await Promise.all([
      db.enrollment.findMany({
        where,
        include: {
          course: {
            include: {
              author: { select: { id: true, name: true, image: true, username: true } },
              _count: { select: { lessons: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { enrolledAt: "desc" },
      }),
      db.enrollment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: enrollments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ENROLLMENTS_GET]", error);
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
    const { courseId } = body as { courseId: string };

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Check if course exists and is published
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, error: "Course is not available for enrollment" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "Already enrolled in this course" },
        { status: 409 }
      );
    }

    // If course is free, enroll directly
    if (course.price === 0) {
      const enrollment = await db.enrollment.create({
        data: {
          userId: user.id,
          courseId,
        },
        include: {
          course: {
            select: { id: true, title: true, slug: true },
          },
        },
      });

      // Create notification
      await db.notification.create({
        data: {
          title: "Enrollment Successful",
          message: `You have been enrolled in "${course.title}"`,
          type: "ENROLLMENT",
          userId: user.id,
          link: `/courses/${course.slug}`,
        },
      });

      return NextResponse.json(
        { success: true, data: enrollment },
        { status: 201 }
      );
    }

    // For paid courses, return info that payment is needed
    return NextResponse.json({
      success: false,
      error: "Payment required for this course. Please create an order first.",
      data: {
        courseId: course.id,
        price: course.price,
        salePrice: course.salePrice,
      },
    }, { status: 402 });
  } catch (error) {
    console.error("[ENROLLMENTS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
