"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Pin,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  pinned: boolean;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
  WARNING: "bg-amber-100 text-amber-800",
  ERROR: "bg-red-100 text-red-800",
  ENROLLMENT: "bg-purple-100 text-purple-800",
  ORDER: "bg-teal-100 text-teal-800",
  COMMENT: "bg-indigo-100 text-indigo-800",
  LIKE: "bg-pink-100 text-pink-800",
};

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "INFO",
    pinned: false,
    active: true,
    startsAt: "",
    expiresAt: "",
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/announcements?admin=true");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAnnouncements(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  function openCreate() {
    setEditingItem(null);
    setForm({ title: "", content: "", type: "INFO", pinned: false, active: true, startsAt: "", expiresAt: "" });
    setDialogOpen(true);
  }

  function openEdit(item: Announcement) {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      pinned: item.pinned,
      active: item.active,
      startsAt: item.startsAt ? new Date(item.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, startsAt: form.startsAt || undefined, expiresAt: form.expiresAt || undefined };
      const url = editingItem ? `/api/v1/announcements/${editingItem.id}` : "/api/v1/announcements";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: editingItem ? "Announcement updated" : "Announcement created" });
        setDialogOpen(false);
        fetchAnnouncements();
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

  async function handleDelete(item: Announcement) {
    try {
      const res = await fetch(`/api/v1/announcements/${item.id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Announcement deleted" }); fetchAnnouncements(); }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  async function togglePin(item: Announcement) {
    try {
      const res = await fetch(`/api/v1/announcements/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !item.pinned }),
      });
      if (res.ok) { fetchAnnouncements(); toast({ title: item.pinned ? "Unpinned" : "Pinned" }); }
    } catch {
      toast({ title: "Error", variant: "destructive" });
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
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Manage platform announcements</p>
        </div>
        <Button onClick={openCreate}>
          <Megaphone className="mr-2 h-4 w-4" />
          Add Announcement
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No announcements yet</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>Create announcement</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <Card key={item.id} className={!item.active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={typeColors[item.type] || ""}>{item.type}</Badge>
                      {item.pinned && <Badge className="bg-amber-100 text-amber-800">Pinned</Badge>}
                      {!item.active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Starts: {formatDate(item.startsAt)}</span>
                      <span>Expires: {formatDate(item.expiresAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => togglePin(item)}>
                      {item.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialog(item)}>
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
            <DialogTitle>{editingItem ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update announcement" : "Post a new announcement"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.pinned} onCheckedChange={(c) => setForm({ ...form, pinned: c })} />
                <Label>Pinned</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingItem ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
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
