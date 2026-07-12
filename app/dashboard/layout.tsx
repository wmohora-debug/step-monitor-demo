"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../src/core/context/AuthContext";
import { useTheme } from "../../src/core/context/ThemeContext";
import { usePathname } from "next/navigation";
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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
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
            S
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-200">
              <span className="font-bold text-sm leading-tight tracking-tight">SuperAdmin</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Registry Console</span>
            </div>
          )}
        </div>

        {/* Navigation Groups list */}
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          {navigationGroups.map((group) => (
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
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "" : "text-muted-foreground/85"
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
                <Link href="/dashboard/profile" className="w-full">
                  <DropdownItem>
                    <User className="h-4 w-4" /> Profile Info
                  </DropdownItem>
                </Link>
                <DropdownDivider />
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
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight tracking-tight">SuperAdmin</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Console</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
              {navigationGroups.map((group) => (
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
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          )}
                        >
                          <item.icon className="h-4.5 w-4.5 shrink-0" />
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
                  <Search className="h-3.5 w-3.5" /> Search registry...
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
                    <span className="opacity-50">/</span>
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all border border-border/40 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

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
              
              <Link href="/dashboard/profile" className="w-full">
                <DropdownItem>
                  <User className="h-4 w-4 text-muted-foreground" /> My Profile
                </DropdownItem>
              </Link>

              <DropdownItem disabled>
                <Settings className="h-4 w-4 text-muted-foreground" /> Settings
              </DropdownItem>
              
              <DropdownDivider />
              
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
            <span>&copy; {new Date().getFullYear()} SuperAdmin Control Console</span>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-[8px] tracking-widest">v1.0.0-PROD</Badge>
              <span className="opacity-50">|</span>
              <span>Secure Connection Verified</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
