"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Play,
  Star,
  User,
  Users,
  Lock,
  CheckCircle,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { PublicLayout } from "@/components/public/public-layout";
import { CourseCard } from "@/components/public/course-card";
import { VideoEmbed } from "@/components/public/video-embed";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const courseId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/courses?limit=100`);
      const json = await res.json();
      const course = json.data?.items?.find((c: any) => c.id === courseId);
      if (!course) throw new Error("Course not found");
      return course;
    },
    enabled: !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to enroll");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Enrolled successfully!" });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const { data: relatedData } = useQuery({
    queryKey: ["related-courses", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/courses?limit=4&status=PUBLISHED`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="aspect-video bg-muted rounded-lg" />
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
              <div className="h-96 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!data) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">The course you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const course = data;
  const isFree = course.price === 0;
  const hasDiscount = course.salePrice !== null && course.salePrice !== undefined && course.salePrice < course.price;
  const displayPrice = hasDiscount ? course.salePrice : course.price;
  const relatedCourses = relatedData?.data?.items?.filter((c: any) => c.id !== courseId) || [];

  const levelColors: Record<string, string> = {
    BEGINNER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    ADVANCED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={levelColors[course.level] || ""}>{course.level}</Badge>
                {course.featured && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{course.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {course.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {course.author.name || course.author.username || "Instructor"}
                  </span>
                )}
                {course._count && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {course._count.enrollments} students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      {course._count.lessons} lessons
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail/Video */}
            <div className="rounded-xl overflow-hidden bg-muted">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen className="h-20 w-20 text-primary/40" />
                </div>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                {course.description ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{course.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No description available yet.</p>
                )}
                {course.content && (
                  <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: course.content }} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lessons */}
            {course.lessons && course.lessons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Course Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {course.lessons
                      .sort((a: any, b: any) => a.order - b.order)
                      .map((lesson: any, index: number) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {lesson.isFree ? (
                              <Play className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{lesson.title}</p>
                            {lesson.duration > 0 && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, "0")}
                              </p>
                            )}
                          </div>
                          {lesson.isFree && (
                            <Badge variant="secondary" className="text-xs">Free Preview</Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price & Enroll Card */}
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-baseline gap-2">
                  {isFree ? (
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-primary">${Number(displayPrice).toFixed(2)}</span>
                      {hasDiscount && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${course.price.toFixed(2)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (!session) {
                      router.push("/login");
                      return;
                    }
                    enrollMutation.mutate();
                  }}
                  disabled={enrollMutation.isPending}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {enrollMutation.isPending
                    ? "Enrolling..."
                    : isFree
                    ? "Enroll for Free"
                    : "Enroll Now"}
                </Button>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{course.level}</span>
                  </div>
                  {course._count && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-medium">{course._count.lessons}</span>
                    </div>
                  )}
                  {course._count && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Students</span>
                      <span className="font-medium">{course._count.enrollments}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Access</span>
                    <span className="font-medium">Lifetime</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructor */}
            {course.author && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Instructor</h3>
                  <div className="flex items-center gap-3">
                    {course.author.image ? (
                      <img
                        src={course.author.image}
                        alt={course.author.name || ""}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{course.author.name || course.author.username}</p>
                      <p className="text-sm text-muted-foreground">Course Instructor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCourses.slice(0, 4).map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
