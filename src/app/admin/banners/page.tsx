"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ImagePlus,
  ExternalLink,
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  linkText: string | null;
  position: number;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function BannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    linkText: "",
    position: 0,
    active: true,
    startsAt: "",
    expiresAt: "",
  });

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/banners?admin=true");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setBanners(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  function openCreate() {
    setEditingBanner(null);
    setForm({ title: "", subtitle: "", image: "", link: "", linkText: "", position: banners.length, active: true, startsAt: "", expiresAt: "" });
    setDialogOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      link: banner.link || "",
      linkText: banner.linkText || "",
      position: banner.position,
      active: banner.active,
      startsAt: banner.startsAt ? new Date(banner.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: banner.expiresAt ? new Date(banner.expiresAt).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
      };

      const url = editingBanner ? `/api/v1/banners/${editingBanner.id}` : "/api/v1/banners";
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: editingBanner ? "Banner updated" : "Banner created" });
        setDialogOpen(false);
        fetchBanners();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save banner", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(banner: Banner) {
    try {
      const res = await fetch(`/api/v1/banners/${banner.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Banner deleted" });
        fetchBanners();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete banner", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  async function moveBanner(banner: Banner, direction: "up" | "down") {
    const currentIndex = banners.findIndex((b) => b.id === banner.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= banners.length) return;

    const updated = [...banners];
    [updated[currentIndex], updated[swapIndex]] = [updated[swapIndex], updated[currentIndex]];

    try {
      await Promise.all(
        updated.map((b, i) =>
          fetch(`/api/v1/banners/${b.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: i }),
          })
        )
      );
      fetchBanners();
    } catch {
      toast({ title: "Error", description: "Failed to reorder", variant: "destructive" });
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">Manage homepage banners</p>
        </div>
        <Button onClick={openCreate}>
          <ImagePlus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No banners yet</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>Create your first banner</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <Card key={banner.id} className={!banner.active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0}
                      onClick={() => moveBanner(banner, "up")}>
                      <GripVertical className="h-4 w-4 rotate-180" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === banners.length - 1}
                      onClick={() => moveBanner(banner, "down")}>
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  {banner.image && (
                    <img src={banner.image} alt={banner.title} className="h-16 w-24 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{banner.title}</h3>
                      {banner.active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {banner.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{banner.subtitle}</p>}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Position: {banner.position}</span>
                      {banner.link && <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" />{banner.linkText || banner.link}</span>}
                      <span>Starts: {formatDate(banner.startsAt)}</span>
                      <span>Expires: {formatDate(banner.expiresAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialog(banner)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Create Banner"}</DialogTitle>
            <DialogDescription>{editingBanner ? "Update banner details" : "Add a new homepage banner"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="link">Link URL</Label>
                <Input id="link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkText">Link Text</Label>
                <Input id="linkText" value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Starts At</Label>
                <Input id="startsAt" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input id="expiresAt" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingBanner ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.title}&quot;?
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
