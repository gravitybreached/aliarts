"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  Filter,
  Search,
  User,
  FileText,
  Activity,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userId: string;
  user: { id: string; name: string | null; email: string };
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        action: actionFilter,
        entity: entityFilter,
        search,
      });
      const res = await fetch(`/api/v1/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.data.items || data.data || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function getActionColor(action: string) {
    const upper = action.toUpperCase();
    for (const [key, color] of Object.entries(actionColors)) {
      if (upper.includes(key)) return color;
    }
    return "bg-gray-100 text-gray-800";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Track all administrative actions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={actionFilter || "ALL"} onValueChange={(v) => { setActionFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter || "ALL"} onValueChange={(v) => { setEntityFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entities</SelectItem>
                <SelectItem value="COURSE">Course</SelectItem>
                <SelectItem value="ARTWORK">Artwork</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ORDER">Order</SelectItem>
                <SelectItem value="POST">Post</SelectItem>
                <SelectItem value="COUPON">Coupon</SelectItem>
                <SelectItem value="BANNER">Banner</SelectItem>
                <SelectItem value="SETTING">Setting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-green-50 p-2"><Activity className="h-4 w-4 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Logs</p>
              <p className="text-lg font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-blue-50 p-2"><FileText className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Entities</p>
              <p className="text-lg font-bold">{new Set(logs.map((l) => l.entity)).size}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-purple-50 p-2"><User className="h-4 w-4 text-purple-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Users</p>
              <p className="text-lg font-bold">{new Set(logs.map((l) => l.userId)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                  <TableHead className="hidden xl:table-cell">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user?.name || log.user?.email || "System"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">{log.entity}</Badge>
                        {log.entityId && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{log.entityId.slice(0, 8)}...</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[250px]">
                      <p className="text-xs text-muted-foreground truncate">
                        {log.details || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground font-mono">
                      {log.ipAddress || "—"}
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
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
