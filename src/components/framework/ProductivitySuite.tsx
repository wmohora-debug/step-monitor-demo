"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../core/context/AuthContext";
import { useTheme } from "../../core/context/ThemeContext";
import { schoolService } from "../../features/schools/services/schoolService";
import { userService } from "../../features/users/services/userService";
import { categoryService } from "../../features/categories/services/categoryService";
import { itemService } from "../../features/items/services/itemService";
import { gradeService } from "../../features/grades/services/gradeService";
import { SchoolResponseDto, UserResponseDto, CategoryResponseDto, ItemResponseDto, GradeResponseDto } from "../../core/types";
import {
  Search,
  User,
  LogOut,
  Moon,
  Sun,
  School as SchoolIcon,
  Users as UsersIcon,
  FolderTree,
  Package,
  Command,
  HelpCircle,
  AlertTriangle,
  Bell,
  X,
  CheckCircle,
  ChevronRight,
  Plus,
  RefreshCw,
  BarChart3,
  Settings,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { cn } from "../../core/utils/cn";
import { Button, Badge, Modal } from "../ui";
import { PermissionGate } from "./PermissionGate";

// ============================================================================
// 1. GLOBAL LOADER (Top Loading Bar)
// ============================================================================
export function TopProgressBar() {
  const [progress, setProgress] = useState(0);
  const [activeRequests, setActiveRequests] = useState(0);
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate progress growth
  const startProgress = () => {
    setProgress(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + (90 - prev) * 0.15;
      });
    }, 150);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setProgress(0);
    }, 300);
  };

  // Listen to path changes
  useEffect(() => {
    startProgress();
    const timeout = setTimeout(() => {
      completeProgress();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pathname]);

  // Intercept fetch calls and listen to API requests
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStart = () => {
      setActiveRequests((prev) => {
        const next = prev + 1;
        if (next === 1) startProgress();
        return next;
      });
    };

    const handleEnd = () => {
      setActiveRequests((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) completeProgress();
        return next;
      });
    };

    window.addEventListener("fetch-start", handleStart);
    window.addEventListener("fetch-end", handleEnd);

    // Override fetch globally to dispatch events
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      window.dispatchEvent(new CustomEvent("fetch-start"));
      try {
        const response = await originalFetch(...args);
        window.dispatchEvent(new CustomEvent("fetch-end"));
        if (!response.ok && response.status >= 500) {
          window.dispatchEvent(
            new CustomEvent("api-error", {
              detail: {
                message: `Server Error ${response.status}: ${response.statusText || "Internal failure"}`,
              },
            })
          );
        }
        return response;
      } catch (err: any) {
        window.dispatchEvent(new CustomEvent("fetch-end"));
        window.dispatchEvent(
          new CustomEvent("api-error", {
            detail: { message: err.message || "Network disconnect or gateway timeout." },
          })
        );
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("fetch-start", handleStart);
      window.removeEventListener("fetch-end", handleEnd);
    };
  }, []);

  if (progress === 0) return null;

  return (
    <div
      style={{ width: `${progress}%` }}
      className="fixed top-0 left-0 h-[3px] bg-primary z-[99999] shadow-[0_1px_8px_rgba(var(--color-primary),0.5)] transition-all duration-300 ease-out"
    />
  );
}

// ============================================================================
// 2. GLOBAL NOTIFICATION CENTER (DRAWER / OVERLAY)
// ============================================================================
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  isRead: boolean;
  time: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  setNotifications,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === "unread") return !item.isRead;
      if (filter === "high") return item.priority === "high";
      return true;
    });
  }, [notifications, filter]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-card border-l border-border text-card-foreground shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
        role="dialog"
      >
        <div className="p-4.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Alert Center</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between text-xs font-bold gap-2">
          <div className="flex gap-1.5">
            {(["all", "unread", "high"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={cn(
                  "px-2.5 py-1 rounded-md capitalize cursor-pointer",
                  filter === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            onClick={markAllRead}
            className="text-[10px] text-primary hover:underline uppercase tracking-wider cursor-pointer"
          >
            Mark All Read
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle className="h-10 w-10 text-muted-foreground/35 mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">Clear skies! No active notifications.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-all relative group flex gap-3.5",
                  item.isRead ? "bg-card border-border/40 opacity-75" : "bg-primary/[0.01] border-primary/25 shadow-sm"
                )}
              >
                {/* Priority Indicator */}
                <span
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                    item.priority === "high" && "bg-rose-500",
                    item.priority === "medium" && "bg-amber-500",
                    item.priority === "low" && "bg-blue-500"
                  )}
                />
                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground truncate">{item.title}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0 font-semibold">{item.time}</span>
                  </div>
                  <p className="text-muted-foreground leading-normal font-semibold text-[11px]">
                    {item.message}
                  </p>
                  <div className="flex gap-2.5 pt-1 text-[9px] font-extrabold uppercase tracking-wider">
                    <button
                      onClick={() => toggleRead(item.id)}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      {item.isRead ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button
                      onClick={() => deleteNotification(item.id)}
                      className="text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. GLOBAL COMMAND PALETTE & SEARCH (Ctrl+K)
// ============================================================================
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeToggle: () => void;
}

export function CommandPalette({ isOpen, onClose, onThemeToggle }: CommandPaletteProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search results states
  const [schoolsResult, setSchoolsResult] = useState<SchoolResponseDto[]>([]);
  const [usersResult, setUsersResult] = useState<UserResponseDto[]>([]);
  const [categoriesResult, setCategoriesResult] = useState<CategoryResponseDto[]>([]);
  const [itemsResult, setItemsResult] = useState<ItemResponseDto[]>([]);
  const [gradesResult, setGradesResult] = useState<GradeResponseDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Debounced live global search
  useEffect(() => {
    if (!query.trim()) {
      setSchoolsResult([]);
      setUsersResult([]);
      setCategoriesResult([]);
      setItemsResult([]);
      setGradesResult([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [schoolsRes, usersRes, categoriesRes, itemsRes, gradesRes] = await Promise.all([
          schoolService.findAll({ page: 1, limit: 5, search: query }),
          userService.findAll({ page: 1, limit: 5, search: query }),
          categoryService.findAll({ page: 1, limit: 5, search: query }),
          itemService.findAll({ page: 1, limit: 5, search: query }),
          gradeService.findAll({ page: 1, limit: 5, search: query }),
        ]);
        setSchoolsResult(schoolsRes.items || []);
        setUsersResult(usersRes.items || []);
        setCategoriesResult(categoriesRes.items || []);
        setItemsResult(itemsRes.items || []);
        setGradesResult(gradesRes.items || []);
      } catch (err) {
        console.error("Live global search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Define static commands
  const staticCommands = useMemo(() => [
    { id: "nav-dash", label: "Go to Overview Dashboard", category: "Navigation", icon: FolderTree, action: () => router.push("/dashboard") },
    { id: "nav-schools", label: "Go to Schools Manager", category: "Navigation", icon: SchoolIcon, action: () => router.push("/dashboard/schools") },
    { id: "nav-users", label: "Go to Users & Admins", category: "Navigation", icon: UsersIcon, action: () => router.push("/dashboard/users") },
    { id: "nav-categories", label: "Go to Categories", category: "Navigation", icon: FolderTree, action: () => router.push("/dashboard/categories") },
    { id: "nav-items", label: "Go to Inventory Items", category: "Navigation", icon: Package, action: () => router.push("/dashboard/items") },
    { id: "nav-grades", label: "Go to Grades Management", category: "Navigation", icon: GraduationCap, action: () => router.push("/dashboard/grades") },
    { id: "nav-reports", label: "Go to Reports & System Analytics", category: "Navigation", icon: BarChart3, action: () => router.push("/dashboard/reports") },
    { id: "nav-settings", label: "Go to System Settings Config", category: "Navigation", icon: Settings, action: () => router.push("/dashboard/settings") },
    { id: "nav-audit", label: "Go to System Security Audit Logs", category: "Navigation", icon: ShieldCheck, action: () => router.push("/dashboard/audit") },
    { id: "nav-profile", label: "Go to My Profile", category: "Navigation", icon: User, action: () => router.push("/dashboard/profile") },
    { id: "act-school", label: "Register New School", category: "Actions", icon: Plus, permission: "schools.create", action: () => router.push("/dashboard/schools?action=create") },
    { id: "act-user", label: "Register New User Account", category: "Actions", icon: Plus, permission: "users.create", action: () => router.push("/dashboard/users?action=create") },
    { id: "act-category", label: "Register New Category", category: "Actions", icon: Plus, permission: "categories.create", action: () => router.push("/dashboard/categories?action=create") },
    { id: "act-item", label: "Register New Inventory Item", category: "Actions", icon: Plus, permission: "items.create", action: () => router.push("/dashboard/items?action=create") },
    { id: "act-grade", label: "Create New Grade Level", category: "Actions", icon: Plus, permission: "grades.create", action: () => router.push("/dashboard/grades?action=create") },
    { id: "rep-users", label: "View Users Audit Report", category: "Reports", icon: BarChart3, action: () => router.push("/dashboard/reports?type=users") },
    { id: "rep-schools", label: "View Schools Registry Report", category: "Reports", icon: BarChart3, action: () => router.push("/dashboard/reports?type=schools") },
    { id: "rep-categories", label: "View Categories Inventory Report", category: "Reports", icon: BarChart3, action: () => router.push("/dashboard/reports?type=categories") },
    { id: "rep-items", label: "View Inventory Items Report", category: "Reports", icon: BarChart3, action: () => router.push("/dashboard/reports?type=items") },
    { id: "rep-grades", label: "View Grades Registry Report", category: "Reports", icon: BarChart3, action: () => router.push("/dashboard/reports?type=grades") },
    { id: "cfg-general", label: "Configure General Settings", category: "Settings", icon: Settings, action: () => router.push("/dashboard/settings?tab=general") },
    { id: "cfg-profile", label: "Configure Profile Info Settings", category: "Settings", icon: Settings, action: () => router.push("/dashboard/settings?tab=profile") },
    { id: "cfg-security", label: "Configure Security Policy settings", category: "Settings", icon: Settings, action: () => router.push("/dashboard/settings?tab=security") },
    { id: "cfg-notifications", label: "Configure Notifications Alert toggles", category: "Settings", icon: Settings, action: () => router.push("/dashboard/settings?tab=notifications") },
    { id: "theme-toggle", label: "Toggle Theme Mode (Light / Dark)", category: "System", icon: Moon, action: onThemeToggle },
    { id: "sys-logout", label: "Sign Out Registry Console", category: "System", icon: LogOut, action: logout },
  ], [router, logout, onThemeToggle]);

  // Flattened list of available commands / results
  const itemsList = useMemo(() => {
    const list: Array<{ id: string; label: string; subtext?: string; icon: any; action: () => void }> = [];

    // 1. Add matching static commands
    staticCommands.forEach((cmd) => {
      if (cmd.label.toLowerCase().includes(query.toLowerCase())) {
        list.push({
          id: cmd.id,
          label: cmd.label,
          icon: cmd.icon,
          action: () => {
            cmd.action();
            onClose();
          },
        });
      }
    });

    // 2. Add school search results
    schoolsResult.forEach((school) => {
      list.push({
        id: `school-${school.id}`,
        label: school.schoolName,
        subtext: `School ID: ${school.schoolId || "N/A"} • ${school.email || ""}`,
        icon: SchoolIcon,
        action: () => {
          router.push(`/dashboard/schools?action=view&id=${school.id}`);
          onClose();
        },
      });
    });

    // 3. Add user search results
    usersResult.forEach((usr) => {
      list.push({
        id: `user-${usr.id}`,
        label: `${usr.firstName} ${usr.lastName}`,
        subtext: `${usr.email} • Role: ${usr.role?.name || "User"}`,
        icon: User,
        action: () => {
          router.push(`/dashboard/users?action=view&id=${usr.id}`);
          onClose();
        },
      });
    });

    // 4. Add category search results
    categoriesResult.forEach((cat) => {
      list.push({
        id: `category-${cat.id}`,
        label: cat.name,
        subtext: `Category Slug: ${cat.slug} • Order: ${cat.displayOrder}`,
        icon: FolderTree,
        action: () => {
          router.push(`/dashboard/categories?action=view&id=${cat.id}`);
          onClose();
        },
      });
    });

    // 5. Add item search results
    itemsResult.forEach((item) => {
      list.push({
        id: `item-${item.id}`,
        label: item.name,
        subtext: `SKU: ${item.sku || "N/A"} • Category: ${item.category?.name || "Uncategorized"}`,
        icon: Package,
        action: () => {
          router.push(`/dashboard/items?action=view&id=${item.id}`);
          onClose();
        },
      });
    });

    // 6. Add grade search results
    gradesResult.forEach((grade) => {
      list.push({
        id: `grade-${grade.id}`,
        label: `Grade Level ${grade.grade}`,
        subtext: `Description: ${grade.description}`,
        icon: GraduationCap,
        action: () => {
          router.push(`/dashboard/grades?action=view&id=${grade.id}`);
          onClose();
        },
      });
    });

    return list;
  }, [staticCommands, schoolsResult, usersResult, categoriesResult, itemsResult, gradesResult, query, router, onClose]);

  // Keyboard navigation inside command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % itemsList.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + itemsList.length) % itemsList.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (itemsList[selectedIndex]) {
          itemsList[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, itemsList, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-card border border-border text-card-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[50vh] animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Search header box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Type a command or query partners & accounts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/80 font-semibold"
            autoFocus
          />
          <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0.5 rounded-md gap-0.5">
            <Command className="h-2.5 w-2.5" /> K
          </Badge>
        </div>

        {/* Results / Navigation body */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {isSearching && (
            <div className="text-center py-6 text-xs text-muted-foreground font-semibold flex items-center justify-center gap-2">
              <RefreshCw className="h-4.5 w-4.5 animate-spin text-primary" /> Searching modules...
            </div>
          )}

          {!isSearching && itemsList.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No navigation commands or query matches found.
            </div>
          )}

          {!isSearching && itemsList.map((item, index) => {
            const Icon = item.icon;
            const isSelected = selectedIndex === index;
            return (
              <div
                key={item.id}
                onClick={() => {
                  item.action();
                }}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border border-transparent",
                  isSelected ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary/75"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={cn("h-4.5 w-4.5 shrink-0", isSelected ? "text-current" : "text-muted-foreground")} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate leading-none">{item.label}</span>
                    {item.subtext && (
                      <span className={cn("text-[9px] truncate mt-1 leading-none font-semibold", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {item.subtext}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <ChevronRight className="h-4 w-4 text-current animate-in slide-in-from-left-2 duration-100" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4.5 py-2.5 border-t border-border bg-muted/10 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↑↓</kbd> Navigate
            <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Enter</kbd> Select
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">ESC</kbd> Close
            <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Ctrl+/</kbd> Help
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. GLOBAL SHORTCUTS HELP MODAL (Ctrl+/)
// ============================================================================
interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  const shortcuts = [
    { keys: ["Ctrl", "K"], desc: "Toggle Global Command Palette & Unified Search" },
    { keys: ["Ctrl", "/"], desc: "Show this Keyboard Shortcuts Guideline Menu" },
    { keys: ["Esc"], desc: "Close any overlay dialog, command palette or form modal" },
    { keys: ["Arrow Up", "Down"], desc: "Navigate lists, dropdowns and command palette rows" },
    { keys: ["Enter"], desc: "Trigger action on highlighted item or submit active modal" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="System Keyboard Shortcuts"
      footer={
        <Button onClick={onClose} className="w-full">
          Acknowledge
        </Button>
      }
    >
      <div className="space-y-4 py-1 text-xs">
        <div className="flex gap-3 items-start p-3 bg-primary/5 border border-primary/10 rounded-xl mb-3 text-muted-foreground leading-normal font-semibold">
          <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p>Optimize your administrative speed with hotkeys designed to navigate and trigger operations globally.</p>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 font-semibold">
              <span className="text-muted-foreground">{shortcut.desc}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, kIdx) => (
                  <React.Fragment key={kIdx}>
                    {kIdx > 0 && <span className="text-[10px] text-muted-foreground/60 self-center">+</span>}
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[10px] font-extrabold uppercase shadow-sm">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// 5. GLOBAL ERROR HANDLING DIALOG
// ============================================================================
export function GlobalErrorDialog() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleApiError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      setErrorMsg(customEvent.detail?.message || "An unexpected communication error occurred.");
    };

    window.addEventListener("api-error", handleApiError);
    return () => window.removeEventListener("api-error", handleApiError);
  }, []);

  const handleRetry = () => {
    setErrorMsg(null);
    window.location.reload();
  };

  if (!errorMsg) return null;

  return (
    <Modal
      isOpen={true}
      onClose={() => setErrorMsg(null)}
      size="sm"
      title="System Communication Failure"
      footer={
        <div className="flex w-full gap-2">
          <Button variant="outline" size="sm" onClick={() => setErrorMsg(null)} className="flex-1">
            Dismiss
          </Button>
          <Button size="sm" onClick={handleRetry} className="flex-1 gap-1.5">
            <RefreshCw className="h-4 w-4" /> Retry Connection
          </Button>
        </div>
      }
    >
      <div className="flex gap-4 py-2">
        <div className="p-3 h-11 w-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-foreground">API Communication Interrupted</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {errorMsg}
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// 6. MAIN PRODUCTIVITY SUITE PROVIDER / COORDINATOR
// ============================================================================
export function ProductivitySuite() {
  const { toggleTheme } = useTheme();

  // Dialog open triggers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Mock API ready notifications list
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "School Registration Verification",
      message: "St. Xavier International registered deployment code pending activation.",
      priority: "medium",
      isRead: false,
      time: "2 mins ago",
    },
    {
      id: "2",
      title: "High API Latency Alert",
      message: "Database ping latencies exceeded 450ms. Restructuring index allocations.",
      priority: "high",
      isRead: false,
      time: "10 mins ago",
    },
    {
      id: "3",
      title: "Credential Update Sync",
      message: "Administrator user accounts credentials refresh completed successfully.",
      priority: "low",
      isRead: true,
      time: "1 hr ago",
    },
  ]);

  // Global keyboard shortcuts listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Ctrl+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Toggle Help Shortcuts Modal (Ctrl+/)
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      }
      // Close overlay dialogs on Escape
      if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsHelpOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Custom window events to trigger drawers
    const handleOpenCommand = () => setIsCommandPaletteOpen(true);
    const handleOpenNotifications = () => setIsNotificationsOpen(true);

    window.addEventListener("open-command-palette", handleOpenCommand);
    window.addEventListener("open-notifications", handleOpenNotifications);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenCommand);
      window.removeEventListener("open-notifications", handleOpenNotifications);
    };
  }, []);

  return (
    <>
      {/* 1. Sleek top progress loading bar */}
      <TopProgressBar />

      {/* 2. Global command palette & unified search (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onThemeToggle={toggleTheme}
      />

      {/* 3. Global shortcuts help guide (Ctrl+/) */}
      <ShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* 4. Global notification center drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
      />

      {/* 5. Centralized api error dialog */}
      <GlobalErrorDialog />
    </>
  );
}
