"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "../../../src/components/ui/Toast";
import { auditService } from "../../../src/features/audit/services/auditService";
import { AuditLogResponseDto, AuditActionType } from "../../../src/core/types/audit";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
} from "../../../src/components/ui";
import {
  CrudTable,
  FilterDropdown,
  PermissionGate,
  CrudColumnDef,
} from "../../../src/components/framework";
import {
  Activity,
  Calendar,
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Layers,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Terminal,
  Trash2,
  User,
  Users,
} from "lucide-react";

// Local sandbox preview items for testing & demonstration
const SANDBOX_AUDIT_LOGS: AuditLogResponseDto[] = [
  {
    id: "audit-1",
    userId: "u-991",
    userEmail: "superadmin@smarttech.edu",
    userRole: "Super Admin",
    action: "permission_change",
    entity: "users",
    entityId: "u-504",
    oldValue: { role: "user", permissions: ["schools.view"] },
    newValue: { role: "admin", permissions: ["schools.view", "schools.create", "users.view"] },
    ipAddress: "182.74.91.22",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    browser: "Chrome 122.0",
    device: "Desktop",
    status: "success",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
  },
  {
    id: "audit-2",
    userId: "u-991",
    userEmail: "superadmin@smarttech.edu",
    userRole: "Super Admin",
    action: "create",
    entity: "items",
    entityId: "item-880",
    oldValue: null,
    newValue: { name: "Laboratory Microscope", sku: "MIC-LAB-01", isConsumable: false, isActive: true },
    ipAddress: "182.74.91.22",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    browser: "Chrome 122.0",
    device: "Desktop",
    status: "success",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
  },
  {
    id: "audit-3",
    userId: "u-204",
    userEmail: "inventory_manager@schools.net",
    userRole: "School Admin",
    action: "update",
    entity: "items",
    entityId: "item-115",
    oldValue: { isActive: true, sku: "OLD-SKU-99" },
    newValue: { isActive: false, sku: "NEW-SKU-100" },
    ipAddress: "203.0.113.88",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    browser: "Safari 17.3",
    device: "Desktop",
    status: "success",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: "audit-4",
    userId: "u-105",
    userEmail: "registrar@delhiacademy.in",
    userRole: "School Registrar",
    action: "delete",
    entity: "categories",
    entityId: "cat-404",
    oldValue: { id: "cat-404", name: "Expired Catalog Items", displayOrder: 99 },
    newValue: null,
    ipAddress: "14.139.45.10",
    userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
    browser: "Chrome Mobile 120.0",
    device: "Mobile",
    status: "success",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: "audit-5",
    userId: "u-991",
    userEmail: "superadmin@smarttech.edu",
    userRole: "Super Admin",
    action: "login",
    entity: "auth",
    entityId: "session-991",
    oldValue: null,
    newValue: { sessionExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
    ipAddress: "182.74.91.22",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    browser: "Chrome 122.0",
    device: "Desktop",
    status: "success",
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), // 8 hours ago
  },
  {
    id: "audit-6",
    userId: "u-772",
    userEmail: "attacker@malicious.com",
    userRole: "Guest",
    action: "login",
    entity: "auth",
    entityId: "failed-attempt",
    oldValue: null,
    newValue: { reason: "Incorrect credentials provided" },
    ipAddress: "198.51.100.12",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
    browser: "Unknown",
    device: "Desktop",
    status: "failure",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
  }
];

function AuditPageContent() {
  const { success, error: toastError, warning } = useToast();
  
  // Tab View state: "timeline" or "table"
  const [viewType, setViewType] = useState<"timeline" | "table">("timeline");

  // API logs data vs local sandbox preview
  const [logs, setLogs] = useState<AuditLogResponseDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Filter params
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditActionType | null>(null);
  const [statusFilter, setStatusFilter] = useState<"success" | "failure" | null>(null);
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sandbox mode indicator (to distinguish mock visual previews from real empty tables)
  const [sandboxMode, setSandboxMode] = useState(false);
  const [showSandboxBanner, setShowSandboxBanner] = useState(false);

  // Details Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogResponseDto | null>(null);

  // Fetch from real backend
  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);

    // If sandbox mode is checked, load local mock database items
    if (sandboxMode) {
      setTimeout(() => {
        let filtered = [...SANDBOX_AUDIT_LOGS];
        
        // Apply filters locally for the sandbox experience
        if (searchQuery) {
          filtered = filtered.filter(l => 
            l.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) || 
            l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.entityId.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (actionFilter) {
          filtered = filtered.filter(l => l.action === actionFilter);
        }
        if (statusFilter) {
          filtered = filtered.filter(l => l.status === statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const fieldA = a[sortBy as keyof AuditLogResponseDto] || "";
          const fieldB = b[sortBy as keyof AuditLogResponseDto] || "";
          if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
          if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });

        setLogs(filtered);
        setTotalCount(filtered.length);
        setIsLoading(false);
      }, 300);
      return;
    }

    try {
      const response = await auditService.findAll({
        page,
        limit,
        search: searchQuery || undefined,
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder || undefined,
      });

      setLogs(response.items || []);
      setTotalCount(response.total || 0);
      setShowSandboxBanner(false);
    } catch (err: any) {
      console.error(err);
      // Backend doesn't support audit endpoints yet, set error state and prompt Sandbox preview option
      setErrorState("Endpoint not found. The server is not exposing '/admin/audit-logs'.");
      setLogs([]);
      setTotalCount(0);
      setShowSandboxBanner(true);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxMode, page, limit, searchQuery, actionFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Handle Sort Callback
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Helper: Action color mapper
  const getActionStyles = (action: AuditActionType) => {
    switch (action) {
      case "create":
        return { bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "CREATE" };
      case "update":
        return { bg: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "UPDATE" };
      case "delete":
        return { bg: "bg-rose-500/10 text-rose-500 border-rose-500/20", label: "DELETE" };
      case "login":
        return { bg: "bg-teal-500/10 text-teal-500 border-teal-500/20", label: "LOGIN" };
      case "logout":
        return { bg: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "LOGOUT" };
      case "permission_change":
        return { bg: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "PERM_CHANGE" };
      default:
        return { bg: "bg-slate-500/10 text-slate-500 border-slate-500/20", label: "EVENT" };
    }
  };

  // Client-Side CSV Exporter
  const handleExportCsv = () => {
    const headers = ["Log ID", "Actor Email", "Role Clearance", "Action", "Target Entity", "Entity ID", "Status", "IP Coordinate", "Browser", "Timestamp"];
    const rows = logs.map(l => [
      l.id,
      l.userEmail,
      l.userRole,
      l.action,
      l.entity,
      l.entityId,
      l.status.toUpperCase(),
      l.ipAddress || "",
      l.browser || "",
      l.createdAt
    ]);

    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `audit_logs_${sandboxMode ? "sandbox_" : ""}export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success("Audit logs exported to CSV successfully.", "Export Complete");
    } catch {
      toastError("Failed to build and export CSV document.", "Export Failure");
    }
  };

  const handleExportPlaceholder = (type: "excel" | "pdf") => {
    warning(
      `Direct ${type.toUpperCase()} file formatting requires a server-side audit logs export hook. Please download CSV.`,
      "Export Deferred"
    );
  };

  // Table Columns Definition
  const columns: CrudColumnDef<AuditLogResponseDto>[] = [
    {
      id: "userEmail",
      header: "Operator / Actor",
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs">{row.userEmail}</span>
          <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{row.userRole}</span>
        </div>
      ),
    },
    {
      id: "action",
      header: "Action Type",
      sortable: true,
      cell: (row) => {
        const styles = getActionStyles(row.action);
        return (
          <Badge variant="outline" className={`text-[9px] font-extrabold uppercase px-2 py-0.5 ${styles.bg}`}>
            {styles.label}
          </Badge>
        );
      },
    },
    {
      id: "entity",
      header: "Target Entity",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Database className="h-3 w-3 text-muted-foreground" />
            {row.entity}
          </span>
          <span className="text-[9px] text-muted-foreground font-mono mt-0.5">ID: {row.entityId}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className={`text-[9px] font-bold ${
          row.status === "success" 
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
        }`}>
          {row.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      id: "ipAddress",
      header: "IP Coordinate",
      cell: (row) => (
        <span className="text-xs font-mono text-muted-foreground">{row.ipAddress || "—"}</span>
      ),
    },
    {
      id: "createdAt",
      header: "Event Timestamp",
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  // Render Difference mapping side-by-side
  const renderValueDiff = (oldVal: any, newVal: any) => {
    const keys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]));
    if (keys.length === 0) return <p className="text-xs font-semibold text-muted-foreground">No property changes recorded.</p>;

    return (
      <div className="border border-border/40 rounded-xl overflow-hidden text-xs">
        <div className="grid grid-cols-3 bg-secondary/30 p-2.5 font-bold border-b border-border/40 uppercase tracking-wider text-[9px] text-muted-foreground">
          <div>Property</div>
          <div>Before (Old)</div>
          <div>After (New)</div>
        </div>
        {keys.map((key) => {
          const prev = oldVal?.[key];
          const next = newVal?.[key];
          const isChanged = JSON.stringify(prev) !== JSON.stringify(next);

          return (
            <div 
              key={key} 
              className={`grid grid-cols-3 p-2 border-b border-border/20 ${
                isChanged ? "bg-primary/[0.01]" : ""
              }`}
            >
              <div className="font-mono text-[10px] font-bold text-muted-foreground">{key}</div>
              <div className="font-semibold text-rose-500 truncate pr-2">
                {prev !== undefined ? String(JSON.stringify(prev)) : "—"}
              </div>
              <div className="font-semibold text-emerald-500 truncate">
                {next !== undefined ? String(JSON.stringify(next)) : "—"}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Activity className="h-6.5 w-6.5 text-primary" /> Enterprise Audit Log center
        </h1>
        <p className="text-xs font-medium text-muted-foreground max-w-2xl leading-relaxed">
          Review operator actions, database mutations, role permission allocations, and access logs.
        </p>
      </div>

      {/* API Connection Sandbox fall-back Alert */}
      {showSandboxBanner && (
        <Card className="border border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">API Connection Deferred</p>
                <p className="text-muted-foreground font-semibold text-[11px]">
                  The `/admin/audit-logs` endpoint is not active on this backend build. Enable the sandbox environment to audit components.
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setSandboxMode(true);
                setShowSandboxBanner(false);
                success("Local Sandbox sandbox environment activated.", "Sandbox Loaded");
              }}
              className="h-8.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0 cursor-pointer"
            >
              Load Sandbox Preview
            </Button>
          </CardContent>
        </Card>
      )}

      {sandboxMode && (
        <Card className="border border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Local Sandbox Sandbox Enabled
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSandboxMode(false);
                success("Switched to backend registry interface.", "Environment Swapped");
              }}
              className="h-7 text-[9px] font-bold uppercase tracking-wider text-rose-500 border-rose-500/20 hover:bg-rose-500/5 cursor-pointer"
            >
              Disconnect Sandbox
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Layout selector tabs + Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-3 gap-3">
        <div className="flex gap-1">
          <button
            onClick={() => setViewType("timeline")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewType === "timeline"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            Timeline Stream
          </button>
          <button
            onClick={() => setViewType("table")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewType === "table"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            Logs Data Table
          </button>
        </div>

        <PermissionGate permission="audit.export" fallback={
          <span className="text-[10px] text-muted-foreground font-semibold">Export clearance Restricted</span>
        }>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-[10px] font-bold gap-1 px-2.5 cursor-pointer uppercase tracking-wider"
              disabled={isLoading || logs.length === 0}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportPlaceholder("excel")}
              className="h-8 text-[10px] font-bold gap-1 px-2.5 cursor-pointer uppercase tracking-wider"
            >
              <Download className="h-3.5 w-3.5 text-blue-500" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportPlaceholder("pdf")}
              className="h-8 text-[10px] font-bold gap-1 px-2.5 cursor-pointer uppercase tracking-wider"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" /> PDF
            </Button>
          </div>
        </PermissionGate>
      </div>

      {/* Filter panel */}
      <Card className="border border-border/50 bg-secondary/15 backdrop-blur-md">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operator email or targets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <FilterDropdown
              label="Action"
              selected={actionFilter}
              onChange={(val) => setActionFilter(val as any)}
              options={[
                { label: "Create Action", value: "create" },
                { label: "Update Action", value: "update" },
                { label: "Delete Action", value: "delete" },
                { label: "Login Event", value: "login" },
                { label: "Logout Event", value: "logout" },
                { label: "Permission Change", value: "permission_change" },
              ]}
            />
            <FilterDropdown
              label="Status"
              selected={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { label: "Success Status", value: "success" },
                { label: "Failure Status", value: "failure" },
              ]}
            />
          </div>
          {(searchQuery || actionFilter || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setActionFilter(null);
                setStatusFilter(null);
              }}
              className="h-8 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 px-2.5 uppercase tracking-wide cursor-pointer"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* TIMELINE LAYOUT */}
      {viewType === "timeline" && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/80 rounded-2xl bg-secondary/10">
              <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-xs font-bold text-foreground">No operations recorded.</p>
              <p className="text-[10px] text-muted-foreground mt-1">Waiting for server audit log streaming events.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-border/50 ml-3 space-y-8 animate-in fade-in duration-300">
              {logs.map((log) => {
                const actionData = getActionStyles(log.action);
                return (
                  <div key={log.id} className="relative group">
                    {/* Color-coded timeline node dot */}
                    <div className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-background bg-card flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                      log.status === "failure" ? "ring-2 ring-rose-500/20" : ""
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        log.action === "create" ? "bg-emerald-500" :
                        log.action === "update" ? "bg-blue-500" :
                        log.action === "delete" ? "bg-rose-500" :
                        log.action === "login" ? "bg-teal-500" :
                        log.action === "logout" ? "bg-amber-500" : "bg-purple-500"
                      }`} />
                    </div>

                    <Card className="border border-border/55 bg-card hover:border-primary/20 transition-all">
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span className="font-extrabold text-foreground">{log.userEmail}</span>
                            <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 ${actionData.bg}`}>
                              {actionData.label}
                            </Badge>
                            {log.status === "failure" && (
                              <Badge variant="danger" className="text-[8px] font-black tracking-wider py-0 px-1.5">
                                FAILED
                              </Badge>
                            )}                          </div>
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            Performed operations on <span className="text-foreground font-bold">{log.entity}</span> (ID: <span className="font-mono">{log.entityId}</span>)
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(log.createdAt).toLocaleString()}</span>
                            {log.ipAddress && <span className="font-mono">IP: {log.ipAddress}</span>}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8.5 text-[9px] font-black uppercase tracking-wider px-3.5 self-start md:self-center cursor-pointer border-border/60 hover:bg-secondary/40"
                        >
                          Compare Diff
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DATA TABLE LAYOUT */}
      {viewType === "table" && (
        <div className="space-y-4">
          <CrudTable
            columns={columns}
            data={logs}
            idKey="id"
            isLoading={isLoading}
            error={errorState}
            emptyMessage="No audit logs recorded matching selected filter criteria."
            page={page}
            pageSize={limit}
            totalPages={Math.ceil(totalCount / limit)}
            onPageChange={setPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRefresh={fetchAuditLogs}
            rowActions={(row) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(row)}
                className="h-7 text-[8px] font-extrabold uppercase tracking-wider px-2 cursor-pointer"
              >
                Inspect
              </Button>
            )}
          />
        </div>
      )}

      {/* DETAIL VIEW DIFF MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Audit Transaction inspect
                </h3>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Metadata diff comparisons mapping property modifications.
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="h-8 w-8 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-secondary/20 rounded-xl p-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wide">Operator Details</span>
                  <p className="text-foreground">{selectedLog.userEmail}</p>
                  <p className="text-muted-foreground text-[10px]">{selectedLog.userRole}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wide">Device Coordinates</span>
                  <p className="text-foreground">{selectedLog.browser || "Unknown Browser"} on {selectedLog.device || "Unknown Device"}</p>
                  <p className="text-muted-foreground text-[10px] font-mono">IP: {selectedLog.ipAddress || "—"}</p>
                </div>
              </div>

              {/* Before / After comparison */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground block">
                  Property Mutation Map (Before / After)
                </span>
                {renderValueDiff(selectedLog.oldValue, selectedLog.newValue)}
              </div>

              {/* Raw JSON payload viewer */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground block">
                  Raw JSON Metadata Payload
                </span>
                <div className="bg-secondary/40 border border-border/25 rounded-xl p-4 font-mono text-[10px] text-muted-foreground overflow-x-auto select-all max-h-40">
                  <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-secondary/10 border-t border-border/40 flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                className="h-8.5 px-5 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <PermissionGate permission="audit.view" fallback={
      <div className="flex flex-col items-center justify-center p-12 py-24 text-center border border-dashed border-border/80 rounded-2xl bg-secondary/10">
        <ShieldAlert className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground mb-1">
          Permission clearance Denied
        </h3>
        <p className="text-xs text-muted-foreground font-semibold max-w-sm">
          Your active role profile does not have authorization clearances to review general system security audit logs.
        </p>
      </div>
    }>
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }>
        <AuditPageContent />
      </React.Suspense>
    </PermissionGate>
  );
}
