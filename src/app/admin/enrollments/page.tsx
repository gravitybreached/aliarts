"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  UserCheck,
  GraduationCap,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  user: { id: string; name: string | null; email: string; username: string | null };
  course: { id: string; title: string; slug: string; author: { name: string | null }; _count: { lessons: number } };
}

export default function EnrollmentsPage() {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [completedFilter, setCompletedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Enrollment | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: "", courseId: "" });

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        completed: completedFilter,
        admin: "true",
      });
      const res = await fetch(`/api/v1/enrollments?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEnrollments(data.data.items || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, completedFilter]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  async function handleAdd() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: form.userId, courseId: form.courseId }),
      });
      if (res.ok) {
        toast({ title: "Enrollment added" });
        setAddDialog(false);
        setForm({ userId: "", courseId: "" });
        fetchEnrollments();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add enrollment", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(enrollment: Enrollment) {
    try {
      const res = await fetch(`/api/v1/enrollments/${enrollment.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Enrollment removed" });
        fetchEnrollments();
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove enrollment", variant: "destructive" });
    }
    setDeleteDialog(null);
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
          <h1 className="text-2xl font-bold tracking-tight">Enrollments</h1>
          <p className="text-muted-foreground">Manage course enrollments</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Enrollment
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search enrollments..." className="pl-9" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={completedFilter || "ALL"} onValueChange={(v) => { setCompletedFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="true">Completed</SelectItem>
                <SelectItem value="false">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No enrollments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Enrolled</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{enrollment.user?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{enrollment.course?.title}</p>
                        <p className="text-xs text-muted-foreground">by {enrollment.course?.author?.name || "Unknown"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={enrollment.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{Math.round(enrollment.progress)}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {enrollment.completed ? (
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(enrollment.enrolledAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteDialog(enrollment)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Enrollment Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Enrollment</DialogTitle>
            <DialogDescription>Manually enroll a user in a course</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">User ID</Label>
              <Input id="userId" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="Enter user ID" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courseId">Course ID</Label>
              <Input id="courseId" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} placeholder="Enter course ID" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.userId || !form.courseId}>{saving ? "Adding..." : "Add Enrollment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this enrollment? The user will lose access to the course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog && handleDelete(deleteDialog)} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
