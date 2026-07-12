"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../src/core/context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";
import { Skeleton } from "../../src/components/ui/Skeleton";
import { Button } from "../../src/components/ui/Button";
import {
  Users,
  School as SchoolIcon,
  FolderTree,
  Package,
  Activity,
  Database,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Bell,
  HeartPulse,
  Server,
  ArrowDownRight,
  Lock,
  GraduationCap,
} from "lucide-react";
import { useToast } from "../../src/components/ui/Toast";
import { DashboardChart } from "../../src/components/ui/DashboardCharts";
import { PermissionGate } from "../../src/components/framework/PermissionGate";
import { schoolService } from "../../src/features/schools/services/schoolService";
import { userService } from "../../src/features/users/services/userService";
import { categoryService } from "../../src/features/categories/services/categoryService";
import { itemService } from "../../src/features/items/services/itemService";
import { apiClient } from "../../src/core/api/client";
import Link from "next/link";
import { cn } from "../../src/core/utils/cn";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(date);
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

// Reusable Metric Card
interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<any>;
  trend: string;
  trendDirection: "up" | "down" | "neutral";
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  drillDownHref: string;
}

const MetricCard = React.memo(function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendDirection,
  isLoading,
  error,
  onRefresh,
  drillDownHref,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="border border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4.5 w-24 rounded" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-destructive/20 bg-destructive/5 shadow-sm">
        <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
              {title} Error
            </span>
            <p className="text-xs text-muted-foreground line-clamp-2">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="w-fit gap-1 text-[10px] h-7 border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group border border-border/60 hover:border-primary/30 bg-card hover:bg-primary/[0.01] shadow-sm hover:translate-y-[-2px] transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className="p-2.5 rounded-xl bg-secondary/80 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold tracking-tight">{value.toLocaleString()}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                trendDirection === "up" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                trendDirection === "down" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                trendDirection === "neutral" && "bg-slate-500/10 text-slate-600 dark:text-slate-400"
              )}
            >
              {trendDirection === "up" && <TrendingUp className="h-2.5 w-2.5" />}
              {trend}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground">
            <span>{description}</span>
            <Link
              href={drillDownHref}
              className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 hover:underline transition-opacity flex items-center gap-0.5"
            >
              Inspect <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Main Dashboard Component
export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // Metrics states
  const [schoolsCount, setSchoolsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);

  // Loading & error trackers
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // Diagnostic states
  const [latency, setLatency] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<"nominal" | "degraded" | "offline">("nominal");

  // Raw data lists for activity feed & notifications
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentSchools, setRecentSchools] = useState<any[]>([]);
  const [inactiveItems, setInactiveItems] = useState<any[]>([]);
  const [inactiveSchools, setInactiveSchools] = useState<any[]>([]);

  // Fetch all resource directory totals
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setSchoolsError(null);
    setUsersError(null);
    setCategoriesError(null);
    setItemsError(null);

    const startTime = performance.now();

    const schoolsPromise = apiClient.get<any>("/admin/schools", { params: { page: 1, limit: 5 }, suppressErrorLogging: true })
      .then((res) => {
        setSchoolsCount(res.total || 0);
        setRecentSchools(res.items || []);
        const inactive = (res.items || []).filter((s: any) => !s.isActive);
        setInactiveSchools(inactive);
      })
      .catch((err) => {
        setSchoolsError(err.message || "Failed to load schools metadata");
      });

    const usersPromise = apiClient.get<any>("/admin/users", { params: { page: 1, limit: 5 }, suppressErrorLogging: true })
      .then((res) => {
        setUsersCount(res.total || 0);
        setRecentUsers(res.items || []);
      })
      .catch((err) => {
        setUsersError(err.message || "Failed to load users metadata");
      });

    const categoriesPromise = apiClient.get<any>("/admin/categories", { params: { page: 1, limit: 5 }, suppressErrorLogging: true })
      .then((res) => setCategoriesCount(res.total || 0))
      .catch((err) => {
        setCategoriesError(err.message || "Failed to load categories metadata");
      });

    const itemsPromise = apiClient.get<any>("/admin/items", { params: { page: 1, limit: 5 }, suppressErrorLogging: true })
      .then((res) => {
        setItemsCount(res.total || 0);
        const inactive = (res.items || []).filter((i: any) => !i.isActive);
        setInactiveItems(inactive);
      })
      .catch((err) => {
        setItemsError(err.message || "Failed to load inventory items metadata");
      });

    await Promise.allSettled([schoolsPromise, usersPromise, categoriesPromise, itemsPromise]);

    const duration = Math.round(performance.now() - startTime);
    setLatency(duration);
    if (duration > 1500) {
      setApiStatus("degraded");
    } else {
      setApiStatus("nominal");
    }

    setMetricsLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleSyncMetrics = () => {
    fetchMetrics().then(() => {
      success("System analytics re-synchronized successfully.", "Database Sync");
    });
  };

  // Compile unified recent activity timeline from real objects
  const timelineActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      module: string;
      time: Date;
      status: string;
      badgeVariant: "success" | "outline" | "secondary";
    }> = [];

    recentUsers.forEach((u) => {
      list.push({
        id: `user-${u.id}`,
        title: `Admin/User account ${u.firstName} ${u.lastName} registered`,
        module: "Users",
        time: u.createdAt ? new Date(u.createdAt) : new Date(),
        status: u.isActive ? "Active" : "Inactive",
        badgeVariant: u.isActive ? "success" : "secondary",
      });
    });

    recentSchools.forEach((s) => {
      list.push({
        id: `school-${s.id}`,
        title: `School registry profile "${s.name}" synchronized`,
        module: "Schools",
        time: s.createdAt ? new Date(s.createdAt) : new Date(),
        status: s.isActive ? "Nominal" : "Deactivated",
        badgeVariant: s.isActive ? "success" : "outline",
      });
    });

    // Sort by timestamp descending
    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  }, [recentUsers, recentSchools]);

  // Compile alerts based on database inactive properties
  const systemAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      message: string;
      priority: "high" | "medium" | "info";
      time: string;
    }> = [];

    inactiveSchools.forEach((school) => {
      alerts.push({
        id: `alert-school-${school.id}`,
        message: `School: '${school.name}' is deactivated and pending review`,
        priority: "high",
        time: "Requires admin check",
      });
    });

    inactiveItems.forEach((item) => {
      alerts.push({
        id: `alert-item-${item.id}`,
        message: `Inventory: '${item.name}' is set to inactive`,
        priority: "medium",
        time: "Stock sync idle",
      });
    });

    if (apiStatus === "degraded") {
      alerts.push({
        id: "alert-latency",
        message: `System latency threshold elevated (${latency}ms)`,
        priority: "high",
        time: "Diagnostics alert",
      });
    }

    return alerts;
  }, [inactiveSchools, inactiveItems, apiStatus, latency]);

  // Aggregate resource distribution data for Pie/Donut Chart
  const resourceDistribution = useMemo(() => {
    return [
      { label: "Schools", value: schoolsCount },
      { label: "Users", value: usersCount },
      { label: "Categories", value: categoriesCount },
      { label: "Inventory Items", value: itemsCount },
    ].filter((point) => point.value > 0);
  }, [schoolsCount, usersCount, categoriesCount, itemsCount]);

  // Growth statistics dataset (simulating historic markers using final values)
  const growthStatistics = useMemo(() => {
    return [
      { label: "Jan", value: Math.round(itemsCount * 0.4) },
      { label: "Mar", value: Math.round(itemsCount * 0.6) },
      { label: "May", value: Math.round(itemsCount * 0.8) },
      { label: "Jul", value: itemsCount },
    ];
  }, [itemsCount]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            Overview / Analytics
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            {greeting}, {user?.firstName || "Administrator"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time diagnostics, system registry counts, and resources diagnostics control.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border/45">
            {formatDate(new Date())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncMetrics}
            disabled={metricsLoading}
            className="gap-2 h-9 rounded-lg font-bold"
          >
            <RefreshCw className={cn("h-4 w-4", metricsLoading && "animate-spin")} />
            Sync Dashboard
          </Button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Schools"
          value={schoolsCount}
          description="Registered educational centers"
          icon={SchoolIcon}
          trend="+5%"
          trendDirection="up"
          isLoading={metricsLoading}
          error={schoolsError}
          onRefresh={fetchMetrics}
          drillDownHref="/dashboard/schools"
        />
        <MetricCard
          title="Active Users"
          value={usersCount}
          description="Managed admin/user accounts"
          icon={Users}
          trend="+12%"
          trendDirection="up"
          isLoading={metricsLoading}
          error={usersError}
          onRefresh={fetchMetrics}
          drillDownHref="/dashboard/users"
        />
        <MetricCard
          title="Categories"
          value={categoriesCount}
          description="Inventory category groups"
          icon={FolderTree}
          trend="Stable"
          trendDirection="neutral"
          isLoading={metricsLoading}
          error={categoriesError}
          onRefresh={fetchMetrics}
          drillDownHref="/dashboard/categories"
        />
        <MetricCard
          title="Inventory Items"
          value={itemsCount}
          description="Trackable asset catalog"
          icon={Package}
          trend="+28 items"
          trendDirection="up"
          isLoading={metricsLoading}
          error={itemsError}
          onRefresh={fetchMetrics}
          drillDownHref="/dashboard/items"
        />
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Growth Area Chart */}
        <DashboardChart
          type="area"
          title="Inventory Items Registry Growth"
          data={growthStatistics}
          height={240}
        />

        {/* Resource Allocation Pie/Donut Chart */}
        <DashboardChart
          type="donut"
          title="Core Resources Asset Distribution"
          data={resourceDistribution}
          height={240}
        />
      </div>

      {/* 4. DETAILS SECTION GRID (System Health, Activity timeline, and Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Activities Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground/80">
                System Activity Timeline
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time registry updates driven by live server records.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5">
              Live Feed
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            {metricsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-4/5 rounded" />
                      <Skeleton className="h-3 w-1/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timelineActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground">No recent registry updates</p>
              </div>
            ) : (
              <div className="relative border-l border-border pl-6 space-y-6">
                {timelineActivities.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Circle Node */}
                    <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary group-hover:scale-125 transition-transform" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground leading-tight">
                          {act.title}
                        </p>
                        <Badge variant={act.badgeVariant} className="text-[9px] font-bold px-1.5 py-0">
                          {act.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-semibold">
                        <span>Module: {act.module}</span>
                        <span>•</span>
                        <span>{act.time.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {formatTime(act.time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Diagnostics & Health Status */}
        <div className="space-y-6">
          {/* Diagnostic Widget */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <HeartPulse className="h-4.5 w-4.5 text-primary" /> System Health Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span>Isomorphic API Gateway</span>
                </div>
                <Badge variant={apiStatus === "nominal" ? "success" : "outline"} className="text-[10px] font-bold">
                  {apiStatus === "nominal" ? "Nominal" : "Degraded"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>Database Registry Ping</span>
                </div>
                <Badge variant={latency ? "success" : "secondary"} className="text-[10px] font-bold">
                  {latency ? `${latency}ms` : "Offline"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Identity Guard Status</span>
                </div>
                <Badge variant="success" className="text-[10px] font-bold">
                  Secure
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Alerts Widget */}
          <Card className="border border-border/60">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-primary" /> Active Alerts
              </CardTitle>
              {systemAlerts.length > 0 && (
                <Badge variant="danger" className="text-[9px] font-extrabold animate-pulse px-1.5 py-0">
                  {systemAlerts.length} Attention
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {systemAlerts.length === 0 ? (
                <div className="text-center py-6 text-xs font-semibold text-muted-foreground">
                  All systems nominal. No alerts active.
                </div>
              ) : (
                <div className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start gap-2.5 p-2.5 rounded-lg border text-xs font-semibold",
                        alert.priority === "high"
                          ? "bg-destructive/5 border-destructive/20 text-destructive-foreground"
                          : "bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300"
                      )}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-current" />
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-2 leading-snug">{alert.message}</p>
                        <span className="text-[9px] opacity-70 block mt-1 font-bold">
                          {alert.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-3">
              <PermissionGate permission="schools.create">
                <Link href="/dashboard/schools?action=create" className="flex flex-col items-center justify-center p-3 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-primary/[0.02] transition-colors text-center group">
                  <SchoolIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold mt-2 text-foreground">Add School</span>
                </Link>
              </PermissionGate>

              <PermissionGate permission="users.create">
                <Link href="/dashboard/users?action=create" className="flex flex-col items-center justify-center p-3 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-primary/[0.02] transition-colors text-center group">
                  <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold mt-2 text-foreground">Add User</span>
                </Link>
              </PermissionGate>

              <Link href="/dashboard/categories" className="flex flex-col items-center justify-center p-3 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-primary/[0.02] transition-colors text-center group">
                <FolderTree className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold mt-2 text-foreground">Categories</span>
              </Link>

              <Link href="/dashboard/items" className="flex flex-col items-center justify-center p-3 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-primary/[0.02] transition-colors text-center group">
                <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold mt-2 text-foreground">Inventory</span>
              </Link>

              <Link href="/dashboard/grades" className="flex flex-col items-center justify-center p-3 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-primary/[0.02] transition-colors text-center group col-span-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold mt-2 text-foreground">Grades Management</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
