"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  Filter,
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

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  thumbnail: string | null;
  level: string;
  status: string;
  featured: boolean;
  _count: { enrollments: number; lessons: number };
  author: { id: string; name: string | null };
  categories: Array<{ category: { id: string; name: string } }>;
  tags: Array<{ tag: { id: string; name: string } }>;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-yellow-100 text-yellow-700",
};

const levelColors: Record<string, string> = {
  BEGINNER: "bg-blue-100 text-blue-700",
  INTERMEDIATE: "bg-amber-100 text-amber-700",
  ADVANCED: "bg-red-100 text-red-700",
};

export default function CoursesPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    salePrice: 0,
    level: "BEGINNER" as string,
    status: "DRAFT" as string,
    featured: false,
    thumbnail: "",
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
        level: levelFilter,
        search,
      });
      const res = await fetch(`/api/v1/courses?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCourses(data.data.items || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, levelFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  function openCreate() {
    setEditingCourse(null);
    setForm({
      title: "",
      slug: "",
      description: "",
      price: 0,
      salePrice: 0,
      level: "BEGINNER",
      status: "DRAFT",
      featured: false,
      thumbnail: "",
    });
    setDialogOpen(true);
  }

  function openEdit(course: Course) {
    setEditingCourse(course);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description || "",
      price: course.price,
      salePrice: course.salePrice || 0,
      level: course.level,
      status: course.status,
      featured: course.featured,
      thumbnail: course.thumbnail || "",
    });
    setDialogOpen(true);
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      };

      const url = editingCourse
        ? `/api/v1/courses/${editingCourse.id}`
        : "/api/v1/courses";
      const method = editingCourse ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: editingCourse ? "Course updated" : "Course created",
          description: `${form.title} has been ${editingCourse ? "updated" : "created"} successfully.`,
        });
        setDialogOpen(false);
        fetchCourses();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save course", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    try {
      const res = await fetch(`/api/v1/courses/${course.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Course deleted", description: `${course.title} has been deleted.` });
        fetchCourses();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete course", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  async function toggleStatus(course: Course) {
    const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/v1/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({
          title: "Status updated",
          description: `Course is now ${newStatus.toLowerCase()}.`,
        });
        fetchCourses();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage your art courses</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No courses found</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first course
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Enrollments</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          /{course.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {course.salePrice ? (
                          <>
                            <span className="font-medium">
                              ${course.salePrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              ${course.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium">
                            {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className={levelColors[course.level] || ""}>
                        {course.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[course.status] || ""}
                      >
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {course._count.enrollments}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(course)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(course)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialog(course)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Edit Course" : "Create Course"}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Update course information"
                : "Add a new course to your platform"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) });
                }}
                placeholder="Course title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="course-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salePrice">Sale Price ($)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice || ""}
                  onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.featured}
                onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
              />
              <Label>Featured</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingCourse ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.title}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
