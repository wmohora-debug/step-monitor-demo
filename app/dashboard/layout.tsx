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
  Landmark,
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
      { name: "Gallery", href: "/dashboard/gallery", icon: Image },
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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const role = user?.role?.slug?.toLowerCase();
  const email = user?.email;
  const isSuper = role === "superadmin" || role === "super_admin" || email === "superstep@yopmail.com";
  const isDeptAdmin = role === "admin";

  const brandName = isSuper ? "SuperAdmin" : "Department Admin";
  const consoleLabel = isSuper ? "Registry Console" : "Education Operations";

  // Dynamically set document title based on role
  useEffect(() => {
    if (user) {
      if (isSuper) {
        document.title = "Super Admin Panel";
      } else if (isDeptAdmin) {
        document.title = "Department Admin | Operations Portal";
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
            { name: "School Scores", href: "/dashboard/school-scores", icon: Trophy },
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
        pathname.startsWith("/dashboard/school-scores") ||
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

  return (
    <div className={cn(
      "h-screen w-screen overflow-hidden flex font-sans antialiased transition-colors duration-200",
      isDeptAdmin ? "bg-[#f5f7fa] text-[#1e293b] dept-admin-theme" : "bg-background text-foreground"
    )}>
      <ProductivitySuite />
      
      {/* 1. DESKTOP SIDEBAR - PERSISTENT & COLLAPSIBLE */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-full bg-[#0b0f19] text-slate-200 border-r border-slate-800/80 flex-shrink-0 z-35 transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand Logo header */}
        <div className={cn(
          "h-16 flex items-center border-b border-slate-800/80 overflow-hidden flex-shrink-0",
          isCollapsed ? "justify-center px-2" : "gap-3 px-3.5"
        )}>
          <div className="h-9 w-9 rounded-xl bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/5">
            {isSuper ? (
              <Shield className="h-5 w-5" />
            ) : (
              <Landmark className="h-5 w-5" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
              <span className="font-semibold text-xs text-slate-100 leading-tight tracking-tight truncate">
                {brandName}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                {consoleLabel}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Groups list */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {filteredNavigationGroups.map((group) => (
            <div key={group.groupName} className="space-y-1.5">
              {!isCollapsed && (
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500/70 px-3 py-1 truncate">
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
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 group relative",
                        isActive
                          ? "bg-slate-800/60 text-white border-l-2 border-indigo-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-355"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                      
                      {/* Collapsed Tooltip Indicator */}
                      {isCollapsed && (
                        <div className="absolute left-14 scale-0 group-hover:scale-100 bg-slate-950 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none transition-all duration-150 z-50 whitespace-nowrap border border-slate-800">
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
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-800 bg-[#0b0f19] text-slate-400 hover:text-white flex items-center justify-center shadow-md hover:bg-slate-800 transition-all duration-200 z-40 hidden lg:flex cursor-pointer"
          aria-label="Toggle sidebar width"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Footer Profile panel */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070a12] flex-shrink-0">
          {!isCollapsed ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <Avatar
                  src={null}
                  fallback={user?.firstName ? user.firstName[0].toUpperCase() : (isSuper ? "S" : "D")}
                  size="sm"
                  className="border border-slate-850 shadow-sm shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-100 truncate leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : (isSuper ? "Super Admin" : "Dept Admin")}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate mt-1">
                    {user?.email || (isSuper ? "superstep@yopmail.com" : "")}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full justify-start text-slate-450 hover:text-red-400 hover:bg-red-500/10 text-xs h-8 rounded-md"
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
                    fallback={user?.firstName ? user.firstName[0].toUpperCase() : (isSuper ? "S" : "D")}
                    size="sm"
                    className="border border-slate-850 cursor-pointer hover:opacity-85 transition-opacity"
                  />
                }
              >
                <div className="px-4 py-2 border-b border-border/40 min-w-[180px]">
                  <p className="text-xs font-bold truncate">
                    {user ? `${user.firstName} ${user.lastName}` : (isSuper ? "Super Admin" : "Dept Admin")}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {user?.email || (isSuper ? "superstep@yopmail.com" : "")}
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
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200">
          <div className="relative flex flex-col w-64 bg-[#0b0f19] border-r border-slate-800 text-slate-200 animate-in slide-in-from-left duration-250 h-full">
            {/* Close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800/40 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Brand Logo header */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 flex-shrink-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-lg shrink-0">
                {isSuper ? <Shield className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-slate-100 leading-tight tracking-tight truncate">
                  {brandName}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                  {consoleLabel}
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
              {filteredNavigationGroups.map((group) => (
                <div key={group.groupName} className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500/70 px-3 py-1">
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
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group",
                            isActive
                              ? "bg-slate-800/80 text-white border-l-2 border-indigo-500"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive ? "text-indigo-400" : "text-slate-500"
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
            <div className="p-4 border-t border-slate-800 bg-[#070a12] flex-shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={null}
                  fallback={user?.firstName ? user.firstName[0].toUpperCase() : (isSuper ? "S" : "D")}
                  size="sm"
                  className="border border-slate-850 shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-100 truncate leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : (isSuper ? "Super Admin" : "Dept Admin")}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate mt-1">
                    {user?.email || (isSuper ? "superstep@yopmail.com" : "")}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full justify-start text-slate-450 hover:text-red-400 hover:bg-red-500/10 text-xs h-8 rounded-md"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT LAYER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header navbar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-20">
          
          {/* Left panel: mobile Hamburger toggle, context label, search, breadcrumbs */}
          <div className="flex items-center gap-4 flex-1 max-w-lg min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Context indicator */}
            {isDeptAdmin && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e2e8f0]/60 dark:bg-slate-800 text-[#0f172a] dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-[#cbd5e1] dark:border-slate-700">
                Department Operations
              </span>
            )}

            {/* Search Input Trigger */}
            {isSuper && (
              <div className="hidden md:block w-64">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                  className="w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground/80 hover:text-foreground hover:bg-secondary/50 transition-all flex items-center justify-between font-semibold shadow-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5" /> Search registry...
                  </span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[9px] font-bold">⌘K</kbd>
                </button>
              </div>
            )}

            {/* Responsive Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Link href="/dashboard" className="hover:text-foreground transition-colors font-medium shrink-0">
                Dashboard
              </Link>
              {breadcrumbs.map((crumb) => {
                if (crumb.name === "Dashboard") return null;
                return (
                  <React.Fragment key={crumb.href}>
                    <span className="opacity-55 shrink-0">/</span>
                    {crumb.active ? (
                      <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-foreground transition-colors truncate max-w-[120px] font-medium">
                        {crumb.name}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Right panel: Theme selector, notifications, profile dropdown */}
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
                <button className="flex items-center gap-1.5 p-1 rounded-full hover:bg-secondary/75 transition-colors border border-border/40 cursor-pointer">
                  <Avatar
                    src={null}
                    fallback={user?.firstName ? user.firstName[0].toUpperCase() : (isSuper ? "S" : "D")}
                    size="sm"
                    className="border border-border/20 shadow-sm"
                  />
                  <ChevronDown className="h-3 w-3 opacity-60 mr-1" />
                </button>
              }
            >
              <div className="px-4 py-2 border-b border-border/40 min-w-[180px]">
                <p className="text-xs font-bold truncate">
                  {user ? `${user.firstName} ${user.lastName}` : (isSuper ? "Super Admin" : "Dept Admin")}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {user?.email || (isSuper ? "superstep@yopmail.com" : "")}
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
          <div className="max-w-[1600px] w-full mx-auto flex-1 pb-12">
            {children}
          </div>

          {/* Footer Section */}
          <footer className="border-t border-border/50 pt-4 pb-1 text-center flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span>
              &copy; {new Date().getFullYear()}{" "}
              {isSuper ? "SuperAdmin Control Console" : "Department Administration • Operations workspace"}
            </span>
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
