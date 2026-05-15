"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Palette, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/public/public-layout";
import { ArtworkCard } from "@/components/public/artwork-card";
import { SearchBar } from "@/components/public/search-bar";
import { ArtworkCardSkeleton } from "@/components/public/loading-skeleton";
import { Card } from "@/components/ui/card";

async function fetchArtworks(params: string) {
  const res = await fetch(`/api/v1/artworks?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function ArtworksPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isForSale, setIsForSale] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "12",
    status: "PUBLISHED",
    ...(search && { search }),
    ...(category && { category }),
    ...(isForSale && { isForSale: "true" }),
    sortBy,
    sortOrder: "desc",
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["artworks", search, category, isForSale, sortBy, page],
    queryFn: () => fetchArtworks(queryParams),
  });

  const artworks = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const categories = [
    "Painting",
    "Digital Art",
    "Sculpture",
    "Photography",
    "Illustration",
    "Mixed Media",
    "Printmaking",
    "Textile Art",
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-3">
              <Palette className="h-3 w-3 mr-1" />
              Artworks
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold">Explore Artworks</h1>
            <p className="text-muted-foreground mt-2">
              Discover stunning original works from talented artists around the world
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <SearchBar
            placeholder="Search artworks..."
            onSearch={setSearch}
            className="flex-1 max-w-md"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Select value={category} onValueChange={(v) => { setCategory(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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

            <div className="flex items-center gap-2">
              <Switch
                id="for-sale"
                checked={isForSale}
                onCheckedChange={(v) => { setIsForSale(v); setPage(1); }}
              />
              <Label htmlFor="for-sale" className="text-sm whitespace-nowrap">For Sale</Label>
            </div>
          </div>
        </div>

        {/* Artwork Grid */}
        {isLoading ? (
          <div className="masonry-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <ArtworkCardSkeleton key={i} />
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <>
            <div className="masonry-grid">
              {artworks.map((artwork: any) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
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
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No artworks found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to discover more art.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setCategory("");
                setIsForSale(false);
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
