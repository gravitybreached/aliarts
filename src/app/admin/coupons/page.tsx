"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Ticket,
  MoreHorizontal,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  _count: { orders: number };
}

export default function CouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE" as string,
    value: 10,
    minAmount: 0,
    maxUses: 0,
    startsAt: "",
    expiresAt: "",
    active: true,
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "10" });
      const res = await fetch(`/api/v1/coupons?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCoupons(data.data.items || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  function openCreate() {
    setEditingCoupon(null);
    setForm({ code: "", type: "PERCENTAGE", value: 10, minAmount: 0, maxUses: 0, startsAt: "", expiresAt: "", active: true });
    setDialogOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount || 0,
      maxUses: coupon.maxUses || 0,
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      active: coupon.active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        value: Number(form.value),
        minAmount: form.minAmount ? Number(form.minAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
      };

      const url = editingCoupon ? `/api/v1/coupons/${editingCoupon.id}` : "/api/v1/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: editingCoupon ? "Coupon updated" : "Coupon created" });
        setDialogOpen(false);
        fetchCoupons();
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

  async function handleDelete(coupon: Coupon) {
    try {
      const res = await fetch(`/api/v1/coupons/${coupon.id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Coupon deleted" }); fetchCoupons(); }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
    setDeleteDialog(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Coupon code "${code}" copied to clipboard` });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons</p>
        </div>
        <Button onClick={openCreate}>
          <Ticket className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No coupons yet</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>Create your first coupon</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="hidden sm:table-cell">Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Dates</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{coupon.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(coupon.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={coupon.type === "PERCENTAGE" ? "text-blue-700" : "text-green-700"}>
                        {coupon.type === "PERCENTAGE" ? "%" : "$"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">{coupon.usedCount}</span>
                      {coupon.maxUses && <span className="text-xs text-muted-foreground"> / {coupon.maxUses}</span>}
                    </TableCell>
                    <TableCell>
                      {coupon.active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      <div>Starts: {formatDate(coupon.startsAt)}</div>
                      <div>Expires: {formatDate(coupon.expiresAt)}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(coupon)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog(coupon)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
            <DialogDescription>{editingCoupon ? "Update coupon details" : "Create a new discount coupon"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER2024" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Value</Label>
                <Input id="value" type="number" min="0" step={form.type === "PERCENTAGE" ? "1" : "0.01"}
                  value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minAmount">Min Amount ($)</Label>
                <Input id="minAmount" type="number" min="0" step="0.01" value={form.minAmount || ""}
                  onChange={(e) => setForm({ ...form, minAmount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input id="maxUses" type="number" min="0" value={form.maxUses || ""}
                  onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} />
              </div>
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
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingCoupon ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete coupon &quot;{deleteDialog?.code}&quot;?
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
