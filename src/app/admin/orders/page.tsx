"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Eye,
  RefreshCw,
  XCircle,
  CheckCircle,
  MoreHorizontal,
  Filter,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  currency: string;
  paymentMethod: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; username: string | null };
  items: OrderItem[];
  coupon: { id: string; code: string; type: string; value: number } | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
      });
      const res = await fetch(`/api/v1/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrders(data.data.items || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(order: Order, newStatus: string) {
    try {
      const res = await fetch(`/api/v1/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: "Order updated", description: `Order ${order.orderNumber} is now ${newStatus}` });
        fetchOrders();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by order number..." className="pl-9" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={statusFilter || "ALL"} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{order.user?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[order.status] || ""}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          {order.status === "PENDING" && (
                            <DropdownMenuItem onClick={() => updateStatus(order, "PAID")}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {(order.status === "PAID" || order.status === "PENDING") && (
                            <DropdownMenuItem onClick={() => updateStatus(order, "REFUNDED")}>
                              <RefreshCw className="mr-2 h-4 w-4" /> Refund
                            </DropdownMenuItem>
                          )}
                          {(order.status === "PENDING" || order.status === "PAID") && (
                            <DropdownMenuItem onClick={() => updateStatus(order, "CANCELLED")}>
                              <XCircle className="mr-2 h-4 w-4" /> Cancel
                            </DropdownMenuItem>
                          )}
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

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>{detailOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{detailOrder.user?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{detailOrder.user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="secondary" className={statusColors[detailOrder.status] || ""}>{detailOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm">{formatDate(detailOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm">{detailOrder.paymentMethod || "N/A"}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {detailOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.title}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{item.itemType}</Badge>
                      </div>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {detailOrder.coupon && (
                <div className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                  <span>Coupon: {detailOrder.coupon.code}</span>
                  <span>-{detailOrder.coupon.type === "PERCENTAGE" ? `${detailOrder.coupon.value}%` : `$${detailOrder.coupon.value}`}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>${detailOrder.total.toFixed(2)} {detailOrder.currency}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
