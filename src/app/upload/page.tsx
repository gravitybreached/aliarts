"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PublicLayout } from "@/components/public/public-layout";
import { useToast } from "@/hooks/use-toast";

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

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    salePrice: "",
    category: "",
    medium: "",
    dimensions: "",
    year: "",
    isForSale: true,
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload images first
      const uploadedUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("folder", "artworks");

        const uploadRes = await fetch("/api/v1/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedUrls.push(uploadData.data.url);
        }
      }

      // Create artwork
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const artworkRes = await fetch("/api/v1/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug,
          description: form.description || undefined,
          price: parseFloat(form.price) || 0,
          salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
          category: form.category || undefined,
          medium: form.medium || undefined,
          dimensions: form.dimensions || undefined,
          year: form.year ? parseInt(form.year) : undefined,
          status: "DRAFT",
          isForSale: form.isForSale,
          featured: false,
        }),
      });

      const artworkData = await artworkRes.json();
      if (artworkData.success) {
        toast({ title: "Artwork uploaded successfully!" });
        router.push("/dashboard");
      } else {
        toast({ title: artworkData.error || "Failed to create artwork", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error uploading artwork", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading") {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse max-w-2xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!session) return null;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Upload Artwork</h1>
            <p className="text-muted-foreground mt-1">Share your creation with the world</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previews.map((preview, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(i)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50">
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload up to 8 images. Max 10MB each. Supported: JPEG, PNG, GIF, WebP
                </p>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Give your artwork a title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your artwork, inspiration, technique..."
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medium">Medium</Label>
                    <Input
                      id="medium"
                      value={form.medium}
                      onChange={(e) => setForm({ ...form, medium: e.target.value })}
                      placeholder="e.g., Oil on canvas"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={form.dimensions}
                      onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                      placeholder="e.g., 24 x 36 inches"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      placeholder="e.g., 2024"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Switch
                    id="forSale"
                    checked={form.isForSale}
                    onCheckedChange={(v) => setForm({ ...form, isForSale: v })}
                  />
                  <Label htmlFor="forSale">Available for sale</Label>
                </div>

                {form.isForSale && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Sale Price (optional)</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.salePrice}
                        onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                {!form.isForSale && (
                  <p className="text-sm text-muted-foreground">
                    This artwork will be displayed as not for sale. You can change this later.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button type="submit" size="lg" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Artwork
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
