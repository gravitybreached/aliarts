"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Flag,
  CheckCircle,
  Eye,
  XCircle,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  targetType: string;
  targetId: string;
  reporterId: string;
  reporter: { id: string; name: string | null; email: string; username: string | null };
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  REVIEWED: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-gray-100 text-gray-800",
};

const targetColors: Record<string, string> = {
  POST: "bg-blue-50 text-blue-700",
  COMMENT: "bg-purple-50 text-purple-700",
  ARTWORK: "bg-amber-50 text-amber-700",
  COURSE: "bg-green-50 text-green-700",
  USER: "bg-red-50 text-red-700",
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewReport, setViewReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: statusFilter,
        targetType: typeFilter,
      });
      const res = await fetch(`/api/v1/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReports(data.data.items || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function updateReportStatus(report: Report, newStatus: string) {
    try {
      const res = await fetch("/api/v1/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, status: newStatus }),
      });
      if (res.ok) {
        toast({ title: `Report ${newStatus.toLowerCase()}` });
        fetchReports();
        setViewReport(null);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update report", variant: "destructive" });
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Review and resolve content reports</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter || "ALL"} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter || "ALL"} onValueChange={(v) => { setTypeFilter(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Target Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="POST">Post</SelectItem>
                <SelectItem value="COMMENT">Comment</SelectItem>
                <SelectItem value="ARTWORK">Artwork</SelectItem>
                <SelectItem value="COURSE">Course</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No reports found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-sm">
                      {report.reporter?.name || report.reporter?.email || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={targetColors[report.targetType] || ""}>
                        {report.targetType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {report.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[report.status] || ""}>{report.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(report.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewReport(report)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {report.status === "PENDING" && (
                          <Button variant="ghost" size="sm" onClick={() => updateReportStatus(report, "REVIEWED")}>
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {(report.status === "PENDING" || report.status === "REVIEWED") && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => updateReportStatus(report, "RESOLVED")}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateReportStatus(report, "DISMISSED")}>
                              <XCircle className="h-4 w-4 text-gray-600" />
                            </Button>
                          </>
                        )}
                      </div>
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

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Reporter</p>
                  <p className="text-sm font-medium">{viewReport.reporter?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{viewReport.reporter?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="secondary" className={statusColors[viewReport.status] || ""}>{viewReport.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Type</p>
                  <Badge variant="outline" className={targetColors[viewReport.targetType] || ""}>{viewReport.targetType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target ID</p>
                  <code className="text-xs bg-muted px-2 py-0.5 rounded">{viewReport.targetId}</code>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="text-sm font-medium mt-1">{viewReport.reason}</p>
              </div>
              {viewReport.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{viewReport.description}</p>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Reported: {formatDate(viewReport.createdAt)}</span>
                {viewReport.resolvedAt && <span>Resolved: {formatDate(viewReport.resolvedAt)}</span>}
              </div>
              {(viewReport.status === "PENDING" || viewReport.status === "REVIEWED") && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => updateReportStatus(viewReport, "RESOLVED")}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Resolve
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => updateReportStatus(viewReport, "REVIEWED")}>
                    <Eye className="mr-2 h-4 w-4" /> Mark Reviewed
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => updateReportStatus(viewReport, "DISMISSED")}>
                    <XCircle className="mr-2 h-4 w-4" /> Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
