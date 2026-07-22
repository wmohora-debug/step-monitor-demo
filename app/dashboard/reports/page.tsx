"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import { userService } from "../../../src/features/users/services/userService";
import { categoryService } from "../../../src/features/categories/services/categoryService";
import { itemService } from "../../../src/features/items/services/itemService";
import { SchoolResponseDto, UserResponseDto, CategoryResponseDto, ItemResponseDto } from "../../../src/core/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  StatusBadge,
  Input,
  StatCard,
} from "../../../src/components/ui";
import { DashboardChart } from "../../../src/components/ui/DashboardCharts";
import { cn } from "../../../src/core/utils/cn";
import {
  CrudPageTemplate,
  CrudTable,
  FilterDropdown,
  PermissionGate,
  CrudColumnDef,
} from "../../../src/components/framework";
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Layers,
  LineChart,
  Package,
  PieChart,
  RefreshCw,
  School,
  TrendingUp,
  Users,
  Tag,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useAuth } from "../../../src/core/context/AuthContext";

type ReportType = "users" | "schools" | "categories" | "items";

function ReportsPageContent() {
  const { success, error: toastError, warning } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = user?.role?.slug?.toLowerCase();
  const isSuper = role === "superadmin" || role === "super_admin" || user?.email === "superstep@yopmail.com";
  const isDeptAdmin = role === "admin";

  // 1. Navigation / Selection State
  const [activeReport, setActiveReport] = useState<ReportType>("items");

  // 2. Data Lists State for Drill Down
  const [itemsData, setItemsData] = useState<ItemResponseDto[]>([]);
  const [usersData, setUsersData] = useState<UserResponseDto[]>([]);
  const [schoolsData, setSchoolsData] = useState<SchoolResponseDto[]>([]);
  const [categoriesData, setCategoriesData] = useState<CategoryResponseDto[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryResponseDto[]>([]);
  const [allItemsList, setAllItemsList] = useState<ItemResponseDto[]>([]);

  // 3. Loading, counts, and filters
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Global aggregate metrics for report cards
  const [globalStats, setGlobalStats] = useState({
    users: 0,
    schools: 0,
    categories: 0,
    items: 0,
  });

  // Helper utility to stagger sequential API requests and avoid rate limits (ThrottlerException)
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Fetch preloaded categories list for dropdown
  const preloadCategories = useCallback(async () => {
    try {
      const response = await categoryService.findAll({ page: 1, limit: 100 });
      setCategoriesList(response.items || []);
    } catch (err) {
      console.error("Failed to preload categories:", err);
    }
  }, []);

  // Fetch preloaded items list for donut weighting chart
  const preloadItems = useCallback(async () => {
    try {
      const response = await itemService.findAll({ page: 1, limit: 100 });
      setAllItemsList(response.items || []);
    } catch (err) {
      console.error("Failed to preload items:", err);
    }
  }, []);

  // Fetch report overview stats
  const fetchGlobalStats = useCallback(async () => {
    try {
      let uRes = { total: 0 };
      if (!isDeptAdmin) {
        uRes = await userService.findAll({ page: 1, limit: 1 });
        await delay(100);
      }
      const sRes = await schoolService.findAll({ page: 1, limit: 1 });
      await delay(100);
      const cRes = await categoryService.findAll({ page: 1, limit: 1 });
      await delay(100);
      const iRes = await itemService.findAll({ page: 1, limit: 1 });

      setGlobalStats({
        users: uRes.total || 0,
        schools: sRes.total || 0,
        categories: cRes.total || 0,
        items: iRes.total || 0,
      });
    } catch (err) {
      console.error("Failed to fetch global reports stats:", err);
    }
  }, [isDeptAdmin]);

  // Fetch detailed drill-down report data based on selected report card
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const queryParams: any = {
        page,
        limit,
        status: statusFilter || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      };

      if (activeReport === "items") {
        if (categoryFilter) queryParams.categoryId = categoryFilter;
        const response = await itemService.findAll(queryParams);
        setItemsData(response.items || []);
        setTotalCount(response.total || 0);

        await delay(100);

        // Fetch counts for charts
        const totalCountForChart = statusFilter
          ? (await itemService.findAll({ page: 1, limit: 1, categoryId: categoryFilter || undefined })).total || 0
          : response.total || 0;

        if (statusFilter) {
          await delay(100);
        }

        const activeRes = await itemService.findAll({ page: 1, limit: 1, status: "active", categoryId: categoryFilter || undefined });
        setActiveCount(activeRes.total || 0);
        setInactiveCount(Math.max(0, totalCountForChart - (activeRes.total || 0)));
      } else if (activeReport === "users") {
        const response = await userService.findAll(queryParams);
        setUsersData(response.items || []);
        setTotalCount(response.total || 0);

        await delay(100);

        const totalCountForChart = statusFilter
          ? (await userService.findAll({ page: 1, limit: 1 })).total || 0
          : response.total || 0;

        if (statusFilter) {
          await delay(100);
        }

        const activeRes = await userService.findAll({ page: 1, limit: 1, status: "active" });
        setActiveCount(activeRes.total || 0);
        setInactiveCount(Math.max(0, totalCountForChart - (activeRes.total || 0)));
      } else if (activeReport === "schools") {
        const response = await schoolService.findAll(queryParams);
        setSchoolsData(response.items || []);
        setTotalCount(response.total || 0);

        await delay(100);

        const totalCountForChart = statusFilter
          ? (await schoolService.findAll({ page: 1, limit: 1 })).total || 0
          : response.total || 0;

        if (statusFilter) {
          await delay(100);
        }

        const activeRes = await schoolService.findAll({ page: 1, limit: 1, status: "active" });
        setActiveCount(activeRes.total || 0);
        setInactiveCount(Math.max(0, totalCountForChart - (activeRes.total || 0)));
      } else if (activeReport === "categories") {
        const response = await categoryService.findAll(queryParams);
        setCategoriesData(response.items || []);
        setTotalCount(response.total || 0);

        await delay(100);

        const totalCountForChart = statusFilter
          ? (await categoryService.findAll({ page: 1, limit: 1 })).total || 0
          : response.total || 0;

        if (statusFilter) {
          await delay(100);
        }

        const activeRes = await categoryService.findAll({ page: 1, limit: 1, status: "active" });
        setActiveCount(activeRes.total || 0);
        setInactiveCount(Math.max(0, totalCountForChart - (activeRes.total || 0)));
      }
    } catch (err: any) {
      console.error(err);
      setErrorState(err.message || "Failed to compile report drill down database.");
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, page, limit, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Sync data on change
  useEffect(() => {
    preloadCategories();
    preloadItems();
    fetchGlobalStats();
  }, [preloadCategories, preloadItems, fetchGlobalStats]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Reset pagination when active report type changes
  useEffect(() => {
    setPage(1);
    setStatusFilter(null);
    setCategoryFilter(null);
  }, [activeReport]);

  // Deep linking integration hook
  useEffect(() => {
    const type = searchParams.get("type") as ReportType;
    if (type && ["users", "schools", "categories", "items"].includes(type)) {
      if (type === "users" && isDeptAdmin) {
        setActiveReport("items");
      } else {
        setActiveReport(type);
      }
      router.replace("/dashboard/reports");
    }
  }, [searchParams, router, isDeptAdmin]);

  // Protective role check for active report state
  useEffect(() => {
    if (isDeptAdmin && activeReport === "users") {
      setActiveReport("items");
    }
  }, [activeReport, isDeptAdmin]);

  // Sort callback
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Dynamic Chart Parsers (100% Real Live Database Data)
  const registrationTrendPoints = useMemo(() => {
    let rawList: Array<{ createdAt: string }> = [];
    if (activeReport === "items") rawList = itemsData;
    else if (activeReport === "users") rawList = usersData;
    else if (activeReport === "schools") rawList = schoolsData;
    else if (activeReport === "categories") rawList = categoriesData;

    const counts: Record<string, number> = {};
    rawList.forEach((r) => {
      if (!r.createdAt) return;
      const date = new Date(r.createdAt);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      counts[label] = (counts[label] || 0) + 1;
    });

    const parsed = Object.entries(counts).map(([label, value]) => ({ label, value }));
    return parsed.length === 0 ? [{ label: "No Data", value: 0 }] : parsed;
  }, [activeReport, itemsData, usersData, schoolsData, categoriesData]);

  const categoryDistributionPoints = useMemo(() => {
    const counts: Record<string, number> = {};
    const sourceList = allItemsList.length > 0 ? allItemsList : itemsData;
    sourceList.forEach((item) => {
      const name = item.category?.name || "Uncategorized";
      counts[name] = (counts[name] || 0) + 1;
    });

    const parsed = Object.entries(counts).map(([label, value]) => ({ label, value }));
    return parsed.length === 0 ? [{ label: "No Items", value: 0 }] : parsed;
  }, [allItemsList, itemsData]);

  const statusDistributionPoints = useMemo(() => {
    return [
      { label: "Active", value: activeCount },
      { label: "Inactive", value: inactiveCount },
    ];
  }, [activeCount, inactiveCount]);

  // Client-Side CSV Exporter (Real live data downloader)
  const handleExportCsv = () => {
    if (activeReport === "items") {
      const headers = ["Item ID", "Item Name", "Slug URL", "SKU Code", "Category", "Consumable", "Status", "Date Registered"];
      const rows = itemsData.map(i => [
        i.id,
        i.name,
        i.slug,
        i.sku || "",
        i.category?.name || "Uncategorized",
        i.isConsumable ? "Yes" : "No",
        i.isActive ? "Active" : "Inactive",
        i.createdAt
      ]);
      triggerCsvDownload("items_report.csv", headers, rows);
    } else if (activeReport === "users") {
      const headers = ["User ID", "First Name", "Last Name", "Email Address", "Phone Number", "Role clearance", "Status", "Registration Date"];
      const rows = usersData.map(u => [
        u.id,
        u.firstName,
        u.lastName,
        u.email || "",
        u.phone || "",
        u.role?.name || "User",
        u.isActive ? "Active" : "Inactive",
        u.createdAt
      ]);
      triggerCsvDownload("users_report.csv", headers, rows);
    } else if (activeReport === "schools") {
      const headers = ["School ID", "School Code", "School Name", "Email Address", "City", "State", "Status", "Registration Date"];
      const rows = schoolsData.map(s => [
        s.id,
        s.schoolId,
        s.schoolName,
        s.email || "",
        s.city || "",
        s.state || "",
        s.isActive ? "Active" : "Inactive",
        s.createdAt
      ]);
      triggerCsvDownload("schools_report.csv", headers, rows);
    } else if (activeReport === "categories") {
      const headers = ["Category ID", "Category Name", "Slug", "Order Weight", "Status", "Creation Date"];
      const rows = categoriesData.map(c => [
        c.id,
        c.name,
        c.slug,
        String(c.displayOrder),
        c.isActive ? "Active" : "Inactive",
        c.createdAt
      ]);
      triggerCsvDownload("categories_report.csv", headers, rows);
    }
  };

  const triggerCsvDownload = (filename: string, headers: string[], rows: string[][]) => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success(`${filename} exported successfully.`, "Export Complete");
    } catch {
      toastError("Failed to build and export CSV document.", "Export Failure");
    }
  };

  const handleExportPlaceholder = (type: "excel" | "pdf") => {
    warning(
      `The direct ${type.toUpperCase()} compiler API is undergoing system optimization. Please download CSV instead.`,
      "Service Deferred"
    );
  };

  // Compile table columns dynamically based on selected report card type
  const columns = useMemo((): CrudColumnDef<any>[] => {
    if (activeReport === "items") {
      return [
        {
          id: "name",
          header: "Item Name",
          sortable: true,
          cell: (row: ItemResponseDto) => (
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-xs leading-none">{row.name}</span>
              <span className="text-[9px] text-muted-foreground mt-1 font-mono">{row.slug}</span>
            </div>
          ),
        },
        {
          id: "sku",
          header: "SKU / Code",
          sortable: true,
          cell: (row: ItemResponseDto) => (
            <span className="text-xs font-mono font-semibold text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded border border-border/20">
              {row.sku || "—"}
            </span>
          ),
        },
        {
          id: "category",
          header: "Category",
          cell: (row: ItemResponseDto) => (
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Tag className="h-3 w-3 text-primary/70" />
              {row.category?.name || "Uncategorized"}
            </span>
          ),
        },
        {
          id: "isConsumable",
          header: "Type",
          cell: (row: ItemResponseDto) => (
            <Badge variant={row.isConsumable ? "secondary" : "outline"} className="text-[10px] py-0.5 px-2">
              {row.isConsumable ? "Consumable" : "Asset"}
            </Badge>
          ),
        },
        {
          id: "isActive",
          header: "Status",
          sortable: true,
          cell: (row: ItemResponseDto) => (
            <StatusBadge status={row.isActive ? "active" : "inactive"} />
          ),
        },
        {
          id: "createdAt",
          header: "Registered Date",
          sortable: true,
          cell: (row: ItemResponseDto) => (
            <span className="text-xs font-semibold text-muted-foreground">
              {new Date(row.createdAt).toLocaleDateString()}
            </span>
          ),
        },
      ];
    }

    if (activeReport === "users") {
      return [
        {
          id: "name",
          header: "Full Name",
          sortable: true,
          cell: (row: UserResponseDto) => (
            <span className="font-bold text-foreground text-xs leading-none">
              {row.firstName} {row.lastName}
            </span>
          ),
        },
        {
          id: "email",
          header: "Email Address",
          sortable: true,
          cell: (row: UserResponseDto) => (
            <span className="text-xs text-muted-foreground font-semibold">{row.email || "—"}</span>
          ),
        },
        {
          id: "role",
          header: "Access clearance",
          cell: (row: UserResponseDto) => (
            <Badge variant="outline" className="text-[10px] py-0.5 px-2 uppercase tracking-wide font-extrabold">
              {row.role?.name || "User"}
            </Badge>
          ),
        },
        {
          id: "isActive",
          header: "Status",
          sortable: true,
          cell: (row: UserResponseDto) => (
            <StatusBadge status={row.isActive ? "active" : "inactive"} />
          ),
        },
        {
          id: "createdAt",
          header: "Registration Date",
          sortable: true,
          cell: (row: UserResponseDto) => (
            <span className="text-xs font-semibold text-muted-foreground">
              {new Date(row.createdAt).toLocaleDateString()}
            </span>
          ),
        },
      ];
    }

    if (activeReport === "schools") {
      return [
        {
          id: "schoolId",
          header: "Center Code",
          sortable: true,
          cell: (row: SchoolResponseDto) => (
            <span className="text-xs font-mono font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/20">
              {row.schoolId}
            </span>
          ),
        },
        {
          id: "schoolName",
          header: "School Name",
          sortable: true,
          cell: (row: SchoolResponseDto) => (
            <span className="font-bold text-foreground text-xs leading-none">{row.schoolName}</span>
          ),
        },
        {
          id: "location",
          header: "Location Coordinates",
          cell: (row: SchoolResponseDto) => (
            <span className="text-xs text-muted-foreground font-semibold">
              {row.city || "—"}{row.state ? `, ${row.state}` : ""}
            </span>
          ),
        },
        {
          id: "isActive",
          header: "Status",
          sortable: true,
          cell: (row: SchoolResponseDto) => (
            <StatusBadge status={row.isActive ? "active" : "inactive"} />
          ),
        },
        {
          id: "createdAt",
          header: "Registered Date",
          sortable: true,
          cell: (row: SchoolResponseDto) => (
            <span className="text-xs font-semibold text-muted-foreground">
              {new Date(row.createdAt).toLocaleDateString()}
            </span>
          ),
        },
      ];
    }

    // Default to categories columns
    return [
      {
        id: "name",
        header: "Category Name",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <span className="font-bold text-foreground text-xs leading-none">{row.name}</span>
        ),
      },
      {
        id: "slug",
        header: "Slug Reference",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <span className="text-xs font-mono font-semibold text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
            {row.slug}
          </span>
        ),
      },
      {
        id: "displayOrder",
        header: "Order Weight",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <span className="text-xs font-bold text-muted-foreground">{row.displayOrder}</span>
        ),
      },
      {
        id: "isActive",
        header: "Status",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <StatusBadge status={row.isActive ? "active" : "inactive"} />
        ),
      },
      {
        id: "createdAt",
        header: "Creation Date",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ];
  }, [activeReport]);

  const activeTableData = useMemo(() => {
    if (activeReport === "items") return itemsData;
    if (activeReport === "users") return usersData;
    if (activeReport === "schools") return schoolsData;
    return categoriesData;
  }, [activeReport, itemsData, usersData, schoolsData, categoriesData]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header Description & Selection Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Analytics Console
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {isDeptAdmin
              ? "Monitor registration trends, inventory category distributions, and classroom check-in activity."
              : "Monitor registration trends, inventory category distributions, center activation summaries, and access clearance records across the network."}
          </p>
        </div>

        {/* Horizontal segment control tabs on the right side */}
        <div className="flex items-center bg-secondary p-1 rounded-lg border border-border/40 shrink-0 self-start lg:self-center">
          {!isDeptAdmin && (
            <button
              onClick={() => setActiveReport("users")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeReport === "users"
                  ? "bg-card text-foreground shadow-xs border border-border/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Users
            </button>
          )}
          <button
            onClick={() => setActiveReport("schools")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
              activeReport === "schools"
                ? "bg-card text-foreground shadow-xs border border-border/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Registered Schools
          </button>
          <button
            onClick={() => setActiveReport("categories")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
              activeReport === "categories"
                ? "bg-card text-foreground shadow-xs border border-border/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Classifications
          </button>
          <button
            onClick={() => setActiveReport("items")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
              activeReport === "items"
                ? "bg-card text-foreground shadow-xs border border-border/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Item Registry
          </button>
        </div>
      </div>

      {/* 2. Compact Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {!isDeptAdmin && (
          <div className="border border-border/45 bg-secondary/35 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</span>
              <h4 className="text-xl font-bold text-foreground">{globalStats.users.toLocaleString()}</h4>
              <p className="text-[10px] text-muted-foreground">Administrative accounts</p>
            </div>
            <div className="p-2 bg-secondary border border-border/40 rounded text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
        )}
        <div className="border border-border/45 bg-secondary/35 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registered Schools</span>
            <h4 className="text-xl font-bold text-foreground">{globalStats.schools.toLocaleString()}</h4>
            <p className="text-[10px] text-muted-foreground">Active monitored schools</p>
          </div>
          <div className="p-2 bg-secondary border border-border/40 rounded text-indigo-400">
            <School className="h-4 w-4" />
          </div>
        </div>
        <div className="border border-border/45 bg-secondary/35 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Classifications</span>
            <h4 className="text-xl font-bold text-foreground">{globalStats.categories.toLocaleString()}</h4>
            <p className="text-[10px] text-muted-foreground">Asset category groups</p>
          </div>
          <div className="p-2 bg-secondary border border-border/40 rounded text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="border border-border/45 bg-secondary/35 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Catalog Inventory</span>
            <h4 className="text-xl font-bold text-foreground">{globalStats.items.toLocaleString()}</h4>
            <p className="text-[10px] text-muted-foreground">Trackable assets registry</p>
          </div>
          <div className="p-2 bg-secondary border border-border/40 rounded text-indigo-400">
            <Package className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 3. Filtering Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-r border-border/40 pr-3 h-5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" /> Filters
          </span>
          <FilterDropdown
            label="Status"
            selected={statusFilter as any}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { label: "Active Status", value: "active" },
              { label: "Inactive Status", value: "inactive" },
            ]}
          />
          {activeReport === "items" && (
            <FilterDropdown
              label="Category"
              selected={categoryFilter}
              onChange={(val) => setCategoryFilter(val ? String(val) : null)}
              options={categoriesList.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
            />
          )}
          {(statusFilter || categoryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter(null);
                setCategoryFilter(null);
              }}
              className="h-7 text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 px-2 rounded-lg cursor-pointer"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* 4. Graphical Charts Display Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart (Line/Area representation) */}
        <DashboardChart
          type="area"
          data={registrationTrendPoints}
          title={`Registration Trend (${activeReport.charAt(0).toUpperCase() + activeReport.slice(1)})`}
          height={220}
          className="bg-secondary/35 border border-border/45 rounded-xl shadow-sm p-5"
        />

        {/* Balance Chart (Pie/Donut representation) */}
        {activeReport === "items" || activeReport === "categories" ? (
          <DashboardChart
            type="donut"
            data={categoryDistributionPoints}
            title="Category Weighting Distribution"
            height={220}
            className="bg-secondary/35 border border-border/45 rounded-xl shadow-sm p-5"
          />
        ) : (
          <DashboardChart
            type="pie"
            data={statusDistributionPoints}
            title="Operational Activation Balance"
            height={220}
            className="bg-secondary/35 border border-border/45 rounded-xl shadow-sm p-5"
          />
        )}
      </div>

      {/* 5. Drill Down detailed Data Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
              Drill-down Data Registry
            </h3>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Detailed metadata mapping matches filtered query results.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PermissionGate permission="reports.export">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                className="h-8 text-[10px] font-bold gap-1 px-2.5 cursor-pointer uppercase tracking-wider"
                disabled={isLoading || activeTableData.length === 0}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> Export CSV
              </Button>
            </PermissionGate>

            {!isDeptAdmin && (
              <PermissionGate permission="reports.export">
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
              </PermissionGate>
            )}
          </div>
        </div>

        <CrudTable
          columns={columns}
          data={activeTableData}
          idKey="id"
          isLoading={isLoading}
          error={errorState}
          emptyMessage="No audit logs or registry parameters found matching filters."
          page={page}
          pageSize={limit}
          totalPages={Math.ceil(totalCount / limit)}
          onPageChange={setPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRefresh={fetchReportData}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PermissionGate permission="reports.view" fallback={
      <div className="flex flex-col items-center justify-center p-12 py-24 text-center border border-dashed border-border/80 rounded-2xl bg-secondary/10">
        <Info className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground mb-1">
          Permission clearance Denied
        </h3>
        <p className="text-xs text-muted-foreground font-semibold max-w-sm">
          Your active role profile does not have authorization clearances to review general system analytics audit logs.
        </p>
      </div>
    }>
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }>
        <ReportsPageContent />
      </React.Suspense>
    </PermissionGate>
  );
}
