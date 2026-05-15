"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicLayout } from "@/components/public/public-layout";
import { CourseCard } from "@/components/public/course-card";
import { SearchBar } from "@/components/public/search-bar";
import { CourseCardSkeleton } from "@/components/public/loading-skeleton";
import { Card } from "@/components/ui/card";

async function fetchCourses(params: string) {
  const res = await fetch(`/api/v1/courses?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchCategories() {
  const res = await fetch("/api/v1/categories?type=COURSE");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "12",
    status: "PUBLISHED",
    ...(search && { search }),
    ...(level && { level }),
    ...(categoryId && { categoryId }),
    sortBy,
    sortOrder: "desc",
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["courses", search, level, categoryId, sortBy, page],
    queryFn: () => fetchCourses(queryParams),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["course-categories"],
    queryFn: fetchCategories,
  });

  const courses = data?.data?.items || [];
  const pagination = data?.data?.pagination;
  const categories = categoriesData?.data || [];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-3">
              <BookOpen className="h-3 w-3 mr-1" />
              Courses
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold">Explore Courses</h1>
            <p className="text-muted-foreground mt-2">
              Find the perfect course to develop your artistic skills and creativity
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <SearchBar
            placeholder="Search courses..."
            onSearch={setSearch}
            className="flex-1 max-w-md"
          />
          <div className="flex flex-wrap gap-3">
            <Select value={level} onValueChange={(v) => { setLevel(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Newest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setLevel("");
                setCategoryId("");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </section>
    </PublicLayout>
  );
}
