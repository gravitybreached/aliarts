"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Upload,
  Trash2,
  Folder,
  Image as ImageIcon,
  File,
  HardDrive,
  Grid,
  List,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface MediaAsset {
  id: string;
  url: string;
  key: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  thumbnail: string | null;
  alt: string | null;
  folder: string | null;
  uploader: { id: string; name: string | null; username: string | null };
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const folders = ["", "admin", "users", "courses", "artworks"];

export default function MediaPage() {
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<MediaAsset | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        folder: currentFolder,
      });
      const res = await fetch(`/api/v1/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const items = data.data.items || [];
          setMedia(items);
          setTotalSize(items.reduce((sum: number, m: MediaAsset) => sum + m.size, 0));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", currentFolder || "admin");

        const res = await fetch("/api/v1/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          toast({ title: "File uploaded", description: file.name });
        }
      } catch {
        toast({ title: "Upload failed", description: file.name, variant: "destructive" });
      }
    }
    fetchMedia();
  }

  async function handleDelete(mediaAsset: MediaAsset) {
    try {
      const res = await fetch(`/api/v1/media?id=${mediaAsset.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "File deleted" });
        fetchMedia();
        if (selectedMedia?.id === mediaAsset.id) setSelectedMedia(null);
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  function isImage(mimeType: string) {
    return mimeType.startsWith("image/");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Manager</h1>
          <p className="text-muted-foreground">Upload and manage media files</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9"
              onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9"
              onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <label>
            <Button asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Upload
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-amber-50 p-2"><HardDrive className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-lg font-bold">{media.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-blue-50 p-2"><ImageIcon className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-lg font-bold">{formatSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-green-50 p-2"><Folder className="h-4 w-4 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Current Folder</p>
              <p className="text-lg font-bold">{currentFolder || "root"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Folder Navigation */}
      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2 flex-wrap">
            {folders.map((folder) => (
              <Button
                key={folder}
                variant={currentFolder === folder ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentFolder(folder)}
                className="gap-2"
              >
                <Folder className="h-4 w-4" />
                {folder || "All Files"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Drag and drop files here, or click Upload</p>
      </div>

      {/* Media Grid / List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={selectedMedia ? "lg:col-span-2" : "lg:col-span-3"}>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-md" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No media files found</p>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {media.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer group overflow-hidden ${selectedMedia?.id === item.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedMedia(item)}
                >
                  <div className="aspect-square bg-muted relative">
                    {isImage(item.mimeType) ? (
                      <img src={item.url} alt={item.alt || item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <File className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="secondary" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedMedia(item); }}>
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setDeleteDialog(item); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(item.size)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer ${selectedMedia?.id === item.id ? "bg-muted" : ""}`}
                      onClick={() => setSelectedMedia(item)}
                    >
                      {isImage(item.mimeType) ? (
                        <img src={item.url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <File className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(item.size)} &middot; {formatDate(item.createdAt)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog(item); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* File Info Panel */}
        {selectedMedia && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">File Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isImage(selectedMedia.mimeType) && (
                <img src={selectedMedia.url} alt={selectedMedia.name} className="w-full rounded-md" />
              )}
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedMedia.name}</span></div>
                <div><span className="text-muted-foreground">Type:</span> {selectedMedia.mimeType}</div>
                <div><span className="text-muted-foreground">Size:</span> {formatSize(selectedMedia.size)}</div>
                <div><span className="text-muted-foreground">Folder:</span> {selectedMedia.folder || "root"}</div>
                <div><span className="text-muted-foreground">Uploaded:</span> {formatDate(selectedMedia.createdAt)}</div>
                <div><span className="text-muted-foreground">Uploader:</span> {selectedMedia.uploader?.name || "Unknown"}</div>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground break-all">{selectedMedia.url}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigator.clipboard.writeText(selectedMedia.url); toast({ title: "URL copied" }); }}>
                  Copy URL
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(selectedMedia)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;? This action cannot be undone.
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
