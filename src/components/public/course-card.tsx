"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Star, User } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    thumbnail?: string | null;
    level: string;
    featured?: boolean;
    author?: {
      id: string;
      name?: string | null;
      image?: string | null;
      username?: string | null;
    } | null;
    _count?: {
      enrollments: number;
      lessons: number;
    } | null;
  };
}

const levelColors: Record<string, string> = {
  BEGINNER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ADVANCED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export function CourseCard({ course }: CourseCardProps) {
  const hasDiscount = course.salePrice !== null && course.salePrice !== undefined && course.salePrice < course.price;
  const displayPrice = hasDiscount ? course.salePrice! : course.price;
  const isFree = course.price === 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/courses/${course.id}`}>
        <Card className="overflow-hidden group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <BookOpen className="h-12 w-12 text-primary/40" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={levelColors[course.level] || ""}>
                {course.level}
              </Badge>
              {course.featured && (
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            {hasDiscount && (
              <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                Sale
              </Badge>
            )}
          </div>

          <CardContent className="p-4 flex-1">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                {course.description}
              </p>
            )}

            {course.author && (
              <div className="flex items-center gap-2 mt-3">
                {course.author.image ? (
                  <img
                    src={course.author.image}
                    alt={course.author.name || ""}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {course.author.name || course.author.username || "Instructor"}
                </span>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isFree ? (
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Free</span>
              ) : (
                <>
                  <span className="text-lg font-bold text-primary">${displayPrice.toFixed(2)}</span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${course.price.toFixed(2)}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {course._count && (
                <>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {course._count.lessons}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {course._count.enrollments}
                  </span>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
