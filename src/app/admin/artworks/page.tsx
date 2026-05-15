"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Filter,
  Star,
  ShoppingBag,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Artwork {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string | null;
  images: string | null;
  category: string | null;
  medium: string | null;
  dimensions: string | null;
  year: number | null;
  status: string;
  featured: boolean;
  isForSale: boolean;
  isDownloadable: boolean;
  artist: { id: string; name: string | null; username: string | null };
  _count: { favorites: number };
  tags: Array<{ tag: { id: string; name: string } }>;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-yellow-100 text-yellow-700",
};

export default function ArtworksPage() {
  const { toast } = useToast();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Artwork | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    salePrice: 0,
    category: "",
    medium: "",
    dimensions: "",
    year: new Date().getFullYear(),
    status: "DRAFT",
    featured: false,
    isForSale: true,
    isDownloadable: false,
  });

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/v1/artworks?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setArtworks(data.data.items || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  function openCreate() {
    setEditingArtwork(null);
    setForm({
      title: "", slug: "", description: "", price: 0, salePrice: 0,
      category: "", medium: "", dimensions: "", year: new Date().getFullYear(),
      status: "DRAFT", featured: false, isForSale: true, isDownloadable: false,
    });
    setDialogOpen(true);
  }

  function openEdit(artwork: Artwork) {
    setEditingArtwork(artwork);
    setForm({
      title: artwork.title,
      slug: artwork.slug,
      description: artwork.description || "",
      price: artwork.price,
      salePrice: artwork.salePrice || 0,
      category: artwork.category || "",
      medium: artwork.medium || "",
      dimensions: artwork.dimensions || "",
      year: artwork.year || new Date().getFullYear(),
      status: artwork.status,
      featured: artwork.featured,
      isForSale: artwork.isForSale,
      isDownloadable: artwork.isDownloadable,
    });
    setDialogOpen(true);
  }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        year: form.year || undefined,
      };

      const url = editingArtwork ? `/api/v1/artworks/${editingArtwork.id}` : "/api/v1/artworks";
      const method = editingArtwork ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: editingArtwork ? "Artwork updated" : "Artwork created" });
        setDialogOpen(false);
        fetchArtworks();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save artwork", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(artwork: Artwork) {
    try {
      const res = await fetch(`/api/v1/artworks/${artwork.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Artwork deleted" });
        fetchArtworks();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artworks</h1>
          <p className="text-muted-foreground">Manage your art collection</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Artwork
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search artworks..." className="pl-9" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9"
                onClick={() => setViewMode("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-9 w-9"
                onClick={() => setViewMode("table")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><Skeleton className="h-48 w-full" /><CardContent className="p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2 mt-2" /></CardContent></Card>
            ))
          ) : artworks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No artworks found</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>Create your first artwork</Button>
            </div>
          ) : (
            artworks.map((artwork) => (
              <Card key={artwork.id} className="group overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  {artwork.image ? (
                    <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Filter className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {artwork.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <Badge variant="secondary" className={`absolute bottom-2 left-2 ${statusColors[artwork.status] || ""}`}>
                    {artwork.status}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{artwork.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold">
                      {artwork.price === 0 ? "Free" : `$${artwork.price.toFixed(2)}`}
                    </span>
                    <div className="flex items-center gap-1">
                      {artwork.isForSale && <ShoppingBag className="h-3 w-3 text-green-600" />}
                      {artwork.isDownloadable && <Download className="h-3 w-3 text-blue-600" />}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => openEdit(artwork)}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteDialog(artwork)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : artworks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No artworks found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Flags</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artworks.map((artwork) => (
                    <TableRow key={artwork.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {artwork.image && (
                            <img src={artwork.image} alt="" className="h-10 w-10 rounded object-cover" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{artwork.title}</p>
                            <p className="text-xs text-muted-foreground">{artwork.artist?.name || "Unknown"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {artwork.price === 0 ? "Free" : `$${artwork.price.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{artwork.category || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[artwork.status] || ""}>{artwork.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-1">
                          {artwork.featured && <Badge variant="outline" className="text-xs">Featured</Badge>}
                          {artwork.isForSale && <Badge variant="outline" className="text-xs">For Sale</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(artwork)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog(artwork)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArtwork ? "Edit Artwork" : "Create Artwork"}</DialogTitle>
            <DialogDescription>
              {editingArtwork ? "Update artwork information" : "Add a new artwork to your collection"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salePrice">Sale Price ($)</Label>
                <Input id="salePrice" type="number" min="0" step="0.01" value={form.salePrice || ""} onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="medium">Medium</Label>
                <Input id="medium" value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input id="dimensions" value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="e.g. 24x36 in" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.featured} onCheckedChange={(c) => setForm({ ...form, featured: c })} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isForSale} onCheckedChange={(c) => setForm({ ...form, isForSale: c })} />
                <Label>For Sale</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isDownloadable} onCheckedChange={(c) => setForm({ ...form, isDownloadable: c })} />
                <Label>Downloadable</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingArtwork ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artwork</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog && handleDelete(deleteDialog)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
