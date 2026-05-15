"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-6 w-20" />
      </CardFooter>
    </Card>
  );
}

export function ArtworkCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[60vh] bg-muted animate-pulse" />
  );
}

export function BannerSkeleton() {
  return (
    <div className="w-full h-[400px] bg-muted animate-pulse rounded-xl" />
  );
}
