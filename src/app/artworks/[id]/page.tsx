"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Palette,
  Heart,
  User,
  ArrowLeft,
  ShoppingCart,
  Share2,
  Ruler,
  Calendar,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PublicLayout } from "@/components/public/public-layout";
import { ArtworkCard } from "@/components/public/artwork-card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ArtworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const artworkId = params.id as string;
  const [isFavorited, setIsFavorited] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["artwork", artworkId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/artworks?limit=100`);
      const json = await res.json();
      const artwork = json.data?.items?.find((a: any) => a.id === artworkId);
      if (!artwork) throw new Error("Artwork not found");
      return artwork;
    },
    enabled: !!artworkId,
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsFavorited(data.data?.favorited ?? !isFavorited);
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites!",
      });
    },
    onError: () => {
      toast({ title: "Failed to update favorite", variant: "destructive" });
    },
  });

  const { data: relatedData } = useQuery({
    queryKey: ["related-artworks", artworkId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/artworks?limit=5&status=PUBLISHED`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-40 bg-muted rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-muted rounded" />
                <div className="h-6 w-1/2 bg-muted rounded" />
                <div className="h-32 w-full bg-muted rounded" />
              </div>
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
          <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Artwork Not Found</h1>
          <p className="text-muted-foreground mb-6">This artwork doesn&apos;t exist or has been removed.</p>
          <Link href="/artworks">
            <Button>Browse Artworks</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const artwork = data;
  const hasDiscount = artwork.salePrice !== null && artwork.salePrice !== undefined && artwork.salePrice < artwork.price;
  const displayPrice = hasDiscount ? artwork.salePrice : artwork.price;
  const relatedArtworks = relatedData?.data?.items?.filter((a: any) => a.id !== artworkId) || [];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-muted">
              {artwork.image ? (
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="w-full object-contain max-h-[600px]"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Palette className="h-20 w-20 text-primary/40" />
                </div>
              )}
            </div>

            {/* Additional images placeholder */}
            {artwork.images && (
              <div className="grid grid-cols-4 gap-2">
                {[artwork.image, ...(artwork.images?.split(",") || [])].filter(Boolean).slice(0, 4).map((img: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-transparent hover:border-primary cursor-pointer transition-colors">
                    <img src={img.trim()} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              {artwork.category && (
                <Badge variant="secondary" className="mb-3">{artwork.category}</Badge>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold">{artwork.title}</h1>
              {artwork.artist && (
                <div className="flex items-center gap-2 mt-3">
                  {artwork.artist.image ? (
                    <img src={artwork.artist.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    by {artwork.artist.name || artwork.artist.username || "Unknown Artist"}
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            {artwork.isForSale && artwork.price > 0 && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">${Number(displayPrice).toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${artwork.price.toFixed(2)}
                  </span>
                )}
              </div>
            )}

            {artwork.isForSale && artwork.price === 0 && (
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Free</span>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {artwork.isForSale && artwork.price > 0 && (
                <Button size="lg" className="flex-1">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (!session) {
                    router.push("/login");
                    return;
                  }
                  favoriteMutation.mutate();
                }}
                disabled={favoriteMutation.isPending}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                {isFavorited ? "Favorited" : "Favorite"}
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Details grid */}
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                {artwork.medium && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Medium</p>
                      <p className="font-medium">{artwork.medium}</p>
                    </div>
                  </div>
                )}
                {artwork.dimensions && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Dimensions</p>
                      <p className="font-medium">{artwork.dimensions}</p>
                    </div>
                  </div>
                )}
                {artwork.year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{artwork.year}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Favorites</p>
                    <p className="font-medium">{artwork._count?.favorites || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {artwork.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About This Artwork</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {artwork.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Artworks */}
        {relatedArtworks.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">More Artworks</h2>
            <div className="masonry-grid">
              {relatedArtworks.slice(0, 4).map((artwork: any) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
