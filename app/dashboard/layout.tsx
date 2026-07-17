"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../src/core/context/AuthContext";
import { useTheme } from "../../src/core/context/ThemeContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  School,
  Users,
  FolderTree,
  Package,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  User,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Shield,
  Settings,
  BarChart3,
  Activity,
  Calendar,
  GraduationCap,
  Trophy,
  Image,
} from "lucide-react";
import { cn } from "../../src/core/utils/cn";
import { Button } from "../../src/components/ui/Button";
import { Dropdown, DropdownItem, DropdownDivider } from "../../src/components/ui/Dropdown";
import { Avatar } from "../../src/components/ui/Avatar";
import { Badge } from "../../src/components/ui/Badge";
import { ProductivitySuite } from "../../src/components/framework";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    groupName: "Analytics",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart3 },
      { name: "Activity Scan Logs", href: "/dashboard/sessions", icon: Activity },
    ],
  },
  {
    groupName: "Registry",
    items: [
      { name: "Schools Manager", href: "/dashboard/schools", icon: School },
      { name: "School Scores", href: "/dashboard/school-scores", icon: Trophy },
      { name: "Standard Users", href: "/dashboard/users", icon: Users },
      { name: "Super Admins", href: "/dashboard/admins", icon: Shield },
      { name: "Grades Management", href: "/dashboard/grades", icon: GraduationCap },
    ],
  },

  {
    groupName: "Inventory",
    items: [
      { name: "Categories", href: "/dashboard/categories", icon: FolderTree },
      { name: "Inventory Items", href: "/dashboard/items", icon: Package },
    ],
  },
  {
    groupName: "Configuration",
    items: [
      { name: "System Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Audit Logs", href: "/dashboard/audit", icon: ShieldCheck },
      { name: "Roles & Permissions", href: "/dashboard/roles", icon: Shield },
      { name: "Session Weeks", href: "/dashboard/session-weeks", icon: Calendar },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const role = user?.role?.slug?.toLowerCase();
  const email = user?.email;
  const isSuper = role === "superadmin" || role === "super_admin" || email === "superstep@yopmail.com";
  const isDeptAdmin = role === "admin";

  const brandName = isSuper ? "SuperAdmin" : "Department Administration";
  const consoleLabel = isSuper ? "Registry Console" : "Operations Portal";
  const logoChar = isSuper ? "S" : "D";

  // Dynamically set document title based on role
  useEffect(() => {
    if (user) {
      if (isSuper) {
        document.title = "Super Admin Panel";
      } else if (isDeptAdmin) {
        document.title = "Department Admin Console";
      }
    }
  }, [user, isSuper, isDeptAdmin]);

  const filteredNavigationGroups = React.useMemo(() => {
    if (isSuper) {
      return navigationGroups;
    }
    if (isDeptAdmin) {
      return [
        {
          groupName: "Analytics & Operations",
          items: [
            { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { name: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart3 },
            { name: "Activity Scan Logs", href: "/dashboard/sessions", icon: Activity },
            { name: "Gallery", href: "/dashboard/gallery", icon: Image },
          ],
        },
      ];
    }
    return [];
  }, [isSuper, isDeptAdmin]);

  // Route protection logic
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (isSuper) {
      setIsAuthorized(true);
      setCheckingAuth(false);
    } else if (isDeptAdmin) {
      const isAllowed =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/reports") ||
        pathname.startsWith("/dashboard/sessions") ||
        pathname.startsWith("/dashboard/gallery");

      if (isAllowed) {
        setIsAuthorized(true);
        setCheckingAuth(false);
      } else {
        setIsAuthorized(false);
        setCheckingAuth(true); // Keep spinner active during navigation redirect
        router.replace("/403");
      }
    } else {
      setIsAuthorized(false);
      setCheckingAuth(true);
      router.replace("/403");
    }
  }, [user, authLoading, pathname, router, isSuper, isDeptAdmin]);

  // Load and apply persistent collapsed state
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar_collapsed");
    if (savedCollapsed === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", String(nextState));
  };

  // Close sidebar on pathname transitions
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    return paths.map((path, idx) => {
      const name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
      const href = "/" + paths.slice(0, idx + 1).join("/");
      return { name, href, active: idx === paths.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  // Enforce light mode on document root for Department Admin
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDeptAdmin) {
      root.classList.remove("dark");
      root.classList.add("light");
      document.body.style.backgroundColor = "#f5f7fa";
      document.body.style.color = "#1e293b";
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    }
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    };
  }, [isDeptAdmin]);

  if (authLoading || checkingAuth || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="space-y-4 text-center max-w-sm w-full">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 animate-pulse">
            S
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wide text-foreground animate-pulse">
              Verifying credentials and clearance...
            </h2>
            <div className="h-1.5 w-full max-w-[200px] mx-auto rounded-full bg-primary/10 overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-primary w-1/2 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isDeptAdmin) {
    return (
      <div className="min-h-screen flex bg-[#f5f7fa] text-[#1e293b] font-sans antialiased dept-admin-theme">
        <ProductivitySuite />
        
        {/* 1. DESKTOP SIDEBAR */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r border-slate-200 bg-white flex-shrink-0 z-30 transition-all duration-300 relative",
            isCollapsed ? "w-16" : "w-60"
          )}
        >
          {/* Brand Logo header */}
          <div className="h-14 flex items-center gap-3 px-4 border-b border-slate-200 overflow-hidden bg-white">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0">
              D
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800 leading-tight">Department Admin</span>
                <span className="text-[9px] text-slate-500 font-medium tracking-wide">Operations Portal</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto bg-white">
            {filteredNavigationGroups[0].items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all relative group",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-12 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-md pointer-events-none transition-all duration-150 z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse Trigger Button (Floating on sidebar border) */}
          <button
            onClick={handleToggleCollapse}
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors z-40 hidden lg:flex"
            aria-label="Toggle sidebar width"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          {/* Footer profile panel */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50">
            {!isCollapsed ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={null}
                    fallback={user?.firstName || "D"}
                    size="sm"
                    className="border border-slate-200 shadow-sm animate-in fade-in duration-200"
                  />
                  <div className="flex flex-col min-w-0 flex-1 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-slate-800 truncate leading-none">
                      {user ? `${user.firstName} ${user.lastName}` : "Dept Admin"}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs h-8 rounded-md"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Dropdown
                  align="left"
                  trigger={
                    <Avatar
                      src={null}
                      fallback={user?.firstName || "D"}
                      size="sm"
                      className="border border-slate-200 cursor-pointer hover:opacity-85 transition-opacity"
                    />
                  }
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {user ? `${user.firstName} ${user.lastName}` : "Dept Admin"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownItem onClick={logout} className="text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownItem>
                </Dropdown>
              </div>
            )}
          </div>
        </aside>

        {/* 2. MOBILE SIDEBAR DRAWER */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200">
            <div className="relative flex flex-col w-60 bg-white border-r border-slate-200 text-slate-700 animate-in slide-in-from-left duration-250">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="h-14 flex items-center gap-3 px-6 border-b border-slate-200 bg-white">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">
                  D
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-800 leading-tight">Department Admin</span>
                  <span className="text-[9px] text-slate-500 font-medium tracking-wide">Operations Portal</span>
                </div>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto bg-white">
                {filteredNavigationGroups[0].items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all group",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-blue-600" : "text-slate-400"
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Avatar src={null} fallback={user?.firstName || "D"} size="sm" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 truncate leading-none">
                      {user ? `${user.firstName} ${user.lastName}` : "Dept Admin"}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs h-8 rounded-md"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 3. MAIN LAYER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f5f7fa]">
          {/* Top Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
                  Dashboard
                </Link>
                {breadcrumbs.map((crumb) => {
                  if (crumb.name === "Dashboard") return null;
                  return (
                    <React.Fragment key={crumb.href}>
                      <span className="opacity-55">/</span>
                      {crumb.active ? (
                        <span className="font-semibold text-slate-800 truncate">
                          {crumb.name}
                        </span>
                      ) : (
                        <Link href={crumb.href} className="hover:text-slate-800 transition-colors truncate">
                          {crumb.name}
                        </Link>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-notifications"))}
                className="relative p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
              </button>

              {/* Profile Dropdown */}
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 p-1.5 rounded-md text-xs font-semibold hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer text-slate-700">
                    <Avatar
                      src={null}
                      fallback={user?.firstName || "D"}
                      size="sm"
                      className="border border-slate-200 shadow-xs"
                    />
                    <span className="hidden md:inline font-semibold truncate max-w-[80px]">
                      {user?.firstName || "Admin"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                }
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "Dept Admin"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>
                <DropdownItem
                  onClick={logout}
                  className="text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownItem>
              </Dropdown>
            </div>
          </header>

          {/* Main content viewport */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between bg-[#f5f7fa]">
            <div className="flex-1 pb-10">
              {children}
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200/80 pt-4 pb-1 text-center flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] text-slate-400 font-semibold tracking-wide">
              <span>&copy; {new Date().getFullYear()} Operations Console</span>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-[8px] bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-bold">v1.0.0-PROD</Badge>
                <span className="opacity-55">|</span>
                <span>Secure Connection</span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex bg-background text-foreground transition-colors duration-200",
      isDeptAdmin && "dept-admin-theme"
    )}>
      <ProductivitySuite />
      
      {/* 1. DESKTOP SIDEBAR - PERSISTENT & COLLAPSIBLE */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card text-card-foreground flex-shrink-0 z-30 transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand Logo header */}
        <div className="h-16 flex items-center gap-3 px-3.5 border-b border-border overflow-hidden">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-md shadow-primary/20 shrink-0">
            {logoChar}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-200">
              <span className="font-bold text-sm leading-tight tracking-tight">{brandName}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{consoleLabel}</span>
            </div>
          )}
        </div>

        {/* Navigation Groups list */}
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          {filteredNavigationGroups.map((group) => (
            <div key={group.groupName} className="space-y-1.5">
              {!isCollapsed && (
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 py-1 animate-in fade-in duration-200">
                  {group.groupName}
                </h4>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group relative",
                        isActive
                          ? isDeptAdmin
                            ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                            : "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                          isActive
                            ? isDeptAdmin
                              ? "text-blue-700 dark:text-blue-400"
                              : ""
                            : "text-muted-foreground/85"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="animate-in fade-in duration-200">{item.name}</span>
                      )}
                      
                      {/* Collapsed Tooltip Indicator */}
                      {isCollapsed && (
                        <div className="absolute left-14 scale-0 group-hover:scale-100 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 text-xs font-semibold px-2 py-1 rounded shadow-md pointer-events-none transition-all duration-150 z-50">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Trigger Button (Floating on sidebar border) */}
        <button
          onClick={handleToggleCollapse}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center shadow-md hover:bg-secondary transition-colors z-40 hidden lg:flex"
          aria-label="Toggle sidebar width"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Footer Admin profile panel */}
        <div className="p-3 border-t border-border bg-muted/20">
          {!isCollapsed ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <Avatar
                  src={null}
                  fallback={user?.firstName || "S"}
                  size="sm"
                  className="border border-border shadow-sm"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold truncate leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {user?.email || "superstep@yopmail.com"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-xs h-9 rounded-lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Dropdown
                align="left"
                trigger={
                  <Avatar
                    src={null}
                    fallback={user?.firstName || "S"}
                    size="sm"
                    className="border border-border cursor-pointer hover:opacity-85 transition-opacity"
                  />
                }
              >
                <div className="px-4 py-2 border-b border-border/40">
                  <p className="text-xs font-bold truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {user?.email || "superstep@yopmail.com"}
                  </p>
                </div>
                {!isDeptAdmin && (
                  <Link href="/dashboard/profile" className="w-full">
                    <DropdownItem>
                      <User className="h-4 w-4" /> Profile Info
                    </DropdownItem>
                  </Link>
                )}
                {!isDeptAdmin && <DropdownDivider />}
                <DropdownItem onClick={logout} className="text-destructive hover:bg-destructive/5">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownItem>
              </Dropdown>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER - OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/40 backdrop-blur-sm transition-opacity duration-200">
          <div className="relative flex flex-col w-64 bg-card border-r border-border text-card-foreground animate-in slide-in-from-left duration-250">
            {/* Close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Brand Logo header */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
                {logoChar}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight tracking-tight">{brandName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{consoleLabel}</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
              {filteredNavigationGroups.map((group) => (
                <div key={group.groupName} className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 py-1">
                    {group.groupName}
                  </h4>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                            isActive
                              ? isDeptAdmin
                                ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                                : "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4.5 w-4.5 shrink-0",
                              isActive && isDeptAdmin && "text-blue-700 dark:text-blue-400"
                            )}
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer Profile panel */}
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={null} fallback={user?.firstName || "S"} size="sm" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold truncate leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {user?.email || "superstep@yopmail.com"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT LAYER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-20">
          
          {/* Left panel: mobile Hamburger toggle and Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>

            {/* Search Input Trigger */}
            <div className="hidden md:block w-64">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground/80 hover:text-foreground hover:bg-secondary/50 transition-all flex items-center justify-between font-semibold shadow-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" /> {isSuper ? "Search registry..." : "Search console..."}
                </span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[9px] font-bold">⌘K</kbd>
              </button>
            </div>

            {/* Responsive Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              {breadcrumbs.map((crumb) => {
                if (crumb.name === "Dashboard") return null;
                return (
                  <React.Fragment key={crumb.href}>
                    <span className="opacity-55">/</span>
                    {crumb.active ? (
                      <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-foreground transition-colors truncate max-w-[120px]">
                        {crumb.name}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Right panel: Theme selector, notifications dropdown, and user profile dropdown */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            {!isDeptAdmin && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all border border-border/40 cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
              </button>
            )}

            {/* Notification bell trigger */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-notifications"))}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all border border-border/40 cursor-pointer"
              aria-label="Open notifications drawer"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </button>

            {/* Profile Dropdown */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1.5 rounded-lg text-sm font-semibold hover:bg-secondary/75 transition-colors border border-border/40 cursor-pointer">
                  <Avatar
                    src={null}
                    fallback={user?.firstName || "S"}
                    size="sm"
                    className="border border-border/20 shadow-sm"
                  />
                  <span className="hidden md:inline text-xs font-semibold max-w-[80px] truncate">
                    {user?.firstName || "Admin"}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              }
            >
              <div className="px-4 py-2 border-b border-border/40">
                <p className="text-xs font-bold truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {user?.email || "superstep@yopmail.com"}
                </p>
              </div>
              
              {!isDeptAdmin && (
                <Link href="/dashboard/profile" className="w-full">
                  <DropdownItem>
                    <User className="h-4 w-4 text-muted-foreground" /> My Profile
                  </DropdownItem>
                </Link>
              )}

              {!isDeptAdmin && (
                <DropdownItem disabled>
                  <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                </DropdownItem>
              )}
              
              {!isDeptAdmin && <DropdownDivider />}
              
              <DropdownItem
                onClick={logout}
                className="text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        {/* Scrollable Viewport main content page */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          <div className="flex-1 pb-12">
            {children}
          </div>

          {/* Footer Section */}
          <footer className="border-t border-border/50 pt-4 pb-1 text-center flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span>&copy; {new Date().getFullYear()} {isSuper ? "SuperAdmin Control Console" : "Operations Console"}</span>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-[8px] tracking-widest">v1.0.0-PROD</Badge>
              <span className="opacity-55">|</span>
              <span>Secure Connection Verified</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
