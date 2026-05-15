"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Tag as TagIcon,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count: { courses: number; artworks: number; posts: number };
  createdAt: string;
}

export default function TagsPage() {
  const { toast } = useToast();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<TagItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", slug: "" });

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search });
      const res = await fetch(`/api/v1/tags?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setTags(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  function openCreate() {
    setEditingTag(null);
    setForm({ name: "", slug: "" });
    setDialogOpen(true);
  }

  function openEdit(tag: TagItem) {
    setEditingTag(tag);
    setForm({ name: tag.name, slug: tag.slug });
    setDialogOpen(true);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form };
      const url = editingTag ? `/api/v1/tags/${editingTag.id}` : "/api/v1/tags";
      const method = editingTag ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: editingTag ? "Tag updated" : "Tag created" });
        setDialogOpen(false);
        fetchTags();
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

  async function handleDelete(tag: TagItem) {
    try {
      const res = await fetch(`/api/v1/tags/${tag.id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Tag deleted" }); fetchTags(); }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">Manage content tags</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tags..." className="pl-9" value={search}
              onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7"
                onClick={() => setSearch("")}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-wrap gap-2">{Array.from({length: 12}).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}</div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TagIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tags found</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>Create tag</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const total = tag._count.courses + tag._count.artworks + tag._count.posts;
            return (
              <div key={tag.id} className="group relative">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1.5 text-sm gap-1"
                  onClick={() => openEdit(tag)}
                >
                  {tag.name}
                  <span className="text-xs text-muted-foreground">({total})</span>
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-1 -top-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm text-destructive"
                  onClick={() => setDeleteDialog(tag)}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tag detail list */}
      {tags.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{tag.name}</p>
                      <p className="text-xs text-muted-foreground">/{tag.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{tag._count.courses} courses</Badge>
                      <Badge variant="outline">{tag._count.artworks} artworks</Badge>
                      <Badge variant="outline">{tag._count.posts} posts</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteDialog(tag)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
            <DialogDescription>{editingTag ? "Update tag" : "Add a new tag"}</DialogDescription>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingTag ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;?
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
