"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, User } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

interface ArtworkCardProps {
  artwork: {
    id: string;
    title: string;
    slug: string;
    image?: string | null;
    price: number;
    salePrice?: number | null;
    category?: string | null;
    isForSale: boolean;
    artist?: {
      id: string;
      name?: string | null;
      image?: string | null;
      username?: string | null;
    } | null;
    _count?: {
      favorites: number;
    } | null;
  };
  isFavorited?: boolean;
  onFavoriteToggle?: (artworkId: string) => void;
}

export function ArtworkCard({ artwork, isFavorited = false, onFavoriteToggle }: ArtworkCardProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const hasDiscount = artwork.salePrice !== null && artwork.salePrice !== undefined && artwork.salePrice < artwork.price;
  const displayPrice = hasDiscount ? artwork.salePrice! : artwork.price;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorited(!favorited);
    onFavoriteToggle?.(artwork.id);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="masonry-item"
    >
      <Link href={`/artworks/${artwork.id}`}>
        <Card className="overflow-hidden group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
          <div className="relative overflow-hidden bg-muted">
            {artwork.image ? (
              <img
                src={artwork.image}
                alt={artwork.title}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-4xl">🎨</span>
              </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Favorite button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleFavorite}
            >
              <Heart
                className={`h-4 w-4 ${
                  favorited
                    ? "fill-red-500 text-red-500"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              />
            </Button>

            {/* Category badge */}
            {artwork.category && (
              <Badge
                variant="secondary"
                className="absolute bottom-2 left-2 bg-white/80 dark:bg-black/50 text-xs"
              >
                {artwork.category}
              </Badge>
            )}

            {artwork.isForSale && hasDiscount && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                Sale
              </Badge>
            )}
          </div>

          <CardContent className="p-3">
            <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {artwork.title}
            </h3>

            <div className="flex items-center justify-between mt-2">
              {artwork.artist && (
                <div className="flex items-center gap-1.5">
                  {artwork.artist.image ? (
                    <img
                      src={artwork.artist.image}
                      alt={artwork.artist.name || ""}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-2.5 w-2.5 text-primary" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {artwork.artist.name || artwork.artist.username || "Artist"}
                  </span>
                </div>
              )}

              {artwork.isForSale && artwork.price > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-primary">
                    ${displayPrice.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${artwork.price.toFixed(2)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Not for sale
                </span>
              )}
            </div>

            {artwork._count && artwork._count.favorites > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <Heart className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {artwork._count.favorites}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
