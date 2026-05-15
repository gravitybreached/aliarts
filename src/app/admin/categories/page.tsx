"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  type: string;
  _count: { courses: number };
  createdAt: string;
}

const typeColors: Record<string, string> = {
  COURSE: "bg-blue-100 text-blue-800",
  ARTWORK: "bg-purple-100 text-purple-800",
  POST: "bg-green-100 text-green-800",
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    type: "COURSE",
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: typeFilter });
      const res = await fetch(`/api/v1/categories?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setCategories(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openCreate() {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", icon: "", type: "COURSE" });
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      type: category.type,
    });
    setDialogOpen(true);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form };
      const url = editingCategory ? `/api/v1/categories/${editingCategory.id}` : "/api/v1/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: editingCategory ? "Category updated" : "Category created" });
        setDialogOpen(false);
        fetchCategories();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    try {
      const res = await fetch(`/api/v1/categories/${category.id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Category deleted" }); fetchCategories(); }
      else {
        const data = await res.json();
        toast({ title: "Cannot Delete", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  const grouped = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organize content with categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <Select value={typeFilter || "ALL"} onValueChange={(v) => setTypeFilter(v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="COURSE">Course</SelectItem>
              <SelectItem value="ARTWORK">Artwork</SelectItem>
              <SelectItem value="POST">Post</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No categories yet</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>Create category</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{type} Categories</CardTitle>
                  <Badge variant="secondary" className={typeColors[type] || ""}>{items.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {category.icon && <span className="text-lg">{category.icon}</span>}
                        <div>
                          <p className="text-sm font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">/{category.slug} &middot; {category._count.courses} items</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteDialog(category)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>{editingCategory ? "Update category" : "Add a new category"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <Input id="icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="emoji or icon name" />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COURSE">Course</SelectItem>
                    <SelectItem value="ARTWORK">Artwork</SelectItem>
                    <SelectItem value="POST">Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingCategory ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;?
              {deleteDialog && deleteDialog._count.courses > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This category has {deleteDialog._count.courses} associated item(s).
                </span>
              )}
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
