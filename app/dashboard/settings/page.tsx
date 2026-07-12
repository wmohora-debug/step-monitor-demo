"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../src/core/context/AuthContext";
import { useTheme } from "../../../src/core/context/ThemeContext";
import { userService } from "../../../src/features/users/services/userService";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import { SchoolResponseDto } from "../../../src/core/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Avatar,
} from "../../../src/components/ui";
import { PermissionGate } from "../../../src/components/framework/PermissionGate";
import { useToast } from "../../../src/components/ui/Toast";
import {
  Settings,
  User,
  Shield,
  Bell,
  Monitor,
  Layout,
  Clock,
  Laptop,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

type SettingsTab = "general" | "profile" | "appearance" | "security" | "notifications";

function SettingsPageContent() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error: toastError, info, warning } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // School reference data if applicable
  const [userSchool, setUserSchool] = useState<SchoolResponseDto | null>(null);

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Application Settings States
  const [appName, setAppName] = useState("SuperStep Console");
  const [appLogo, setAppLogo] = useState("https://picsum.photos/80/80");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [pageLimit, setPageLimit] = useState(10);
  const [isSavingApp, setIsSavingApp] = useState(false);

  // Appearance Settings States
  const [compactMode, setCompactMode] = useState(false);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [dashboardStyle, setDashboardStyle] = useState("grid");

  // Security Settings States
  const [reqUppercase, setReqUppercase] = useState(true);
  const [reqNumbers, setReqNumbers] = useState(true);
  const [reqSymbols, setReqSymbols] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60"); // minutes

  // Notifications Settings States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);

  // Initialize values from AuthContext
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");

      if (user.schoolId) {
        schoolService.findOne(user.schoolId)
          .then((s) => setUserSchool(s))
          .catch((e) => console.error("Failed to load user school:", e));
      }
    }
  }, [user]);

  // Handle URL Deep-linking parameters
  useEffect(() => {
    const tab = searchParams.get("tab") as SettingsTab;
    if (tab && ["general", "profile", "appearance", "security", "notifications"].includes(tab)) {
      setActiveTab(tab);
      router.replace("/dashboard/settings");
    }
  }, [searchParams, router]);

  // Load local storage appearance preferences on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCompactMode(localStorage.getItem("super_admin_compact") === "true");
      setCollapsedSidebar(localStorage.getItem("sidebar_collapsed") === "true");
      setDashboardStyle(localStorage.getItem("super_admin_dashboard_style") || "grid");
    }
  }, []);

  // Update Profile details in the backend database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await userService.update(user.id, {
        firstName,
        lastName,
        phone: phone || null,
      });
      await refreshUser();
      success("Profile details updated successfully.", "Registry Synced");
    } catch (err: any) {
      console.error(err);
      toastError(err.message || "Failed to update profile details.", "Update Error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password simulated handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError("New password and confirmation do not match.", "Validation Error");
      return;
    }
    if (newPassword.length < 8) {
      toastError("Password must be at least 8 characters long.", "Validation Error");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulate endpoint request
      await new Promise((res) => setTimeout(res, 800));
      success("Password credentials updated successfully.", "Security Active");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toastError("Password mutation failed.", "Security Error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Application Settings saving
  const handleSaveApp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingApp(true);
    setTimeout(() => {
      setIsSavingApp(false);
      success("Application settings written successfully.", "Configuration Saved");
    }, 500);
  };

  // Appearance saving
  const handleSaveAppearance = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("super_admin_compact", String(compactMode));
      localStorage.setItem("sidebar_collapsed", String(collapsedSidebar));
      localStorage.setItem("super_admin_dashboard_style", dashboardStyle);
      success("Appearance settings synchronized successfully.", "Interface Updated");
    }
  };

  // Security Policy saving
  const handleSaveSecurity = () => {
    success("System security parameters updated.", "Security Policy Saved");
  };

  // Notification toggles saving
  const handleSaveNotifications = () => {
    success("Notification delivery preferences registered.", "Toggles Synced");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Settings className="h-6.5 w-6.5 text-primary" /> System Settings Console
        </h1>
        <p className="text-xs font-medium text-muted-foreground max-w-2xl leading-relaxed">
          Configure security policies, user profile credentials, notification alerts, and general console appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side Tab Navigation */}
        <aside className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible border-b lg:border-b-0 lg:border-r border-border/40 pb-4 lg:pb-0 lg:pr-6 gap-1 shrink-0">
          {[
            { id: "profile", label: "My Profile", icon: User },
            { id: "general", label: "General & App", icon: Laptop },
            { id: "appearance", label: "Appearance", icon: Monitor },
            { id: "security", label: "Security & Policy", icon: Shield },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Right Side Settings Forms Card */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Overview Card */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                    Profile Overview
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Current user access permissions and school bindings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <Avatar
                    src={null}
                    fallback={user?.firstName || "S"}
                    size="lg"
                    className="h-16 w-16 border-2 border-primary/20 shadow-md shadow-primary/5"
                  />
                  <div className="flex-1 space-y-2 text-center sm:text-left text-xs font-semibold">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-sm font-black text-foreground">
                        {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                      </h2>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-black py-0.5 px-2">
                        {user?.role?.name || "Admin"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{user?.email || "No email registered"}</p>
                    <p className="text-muted-foreground">Phone: {user?.phone || "No phone registered"}</p>
                    {userSchool && (
                      <p className="text-primary font-bold text-[11px] flex items-center gap-1 justify-center sm:justify-start">
                        School: {userSchool.schoolName} ({userSchool.schoolId})
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Edit Details Form */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                    Modify Details
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Update first name, last name, and telephone mappings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          First Name
                        </label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Last Name
                        </label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Phone Number
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1234567890"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full sm:w-fit px-6 cursor-pointer text-xs font-bold uppercase tracking-wider"
                    >
                      {isSavingProfile ? "Saving..." : "Save Details"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Change Password Form */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                    Update Password
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Change your dashboard access passphrase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          New Password
                        </label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      variant="outline"
                      className="w-full sm:w-fit px-6 cursor-pointer text-xs font-bold uppercase tracking-wider border-primary text-primary hover:bg-primary/5"
                    >
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: GENERAL APPLICATION SETTINGS */}
          {activeTab === "general" && (
            <PermissionGate permission="settings.edit" fallback={
              <Card className="border border-destructive/20 bg-destructive/5">
                <CardContent className="p-5 flex items-center gap-3.5 text-xs">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="font-semibold text-muted-foreground">
                    Your active role does not have authorization clearances to edit application-wide settings.
                  </p>
                </CardContent>
              </Card>
            }>
              <Card className="border border-border/60 bg-card animate-in fade-in duration-200">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                    Application Configuration
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Customize console descriptors, default page counts, and localized format values.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleSaveApp} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Application Name
                        </label>
                        <Input
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Application Logo (URL)
                        </label>
                        <Input
                          value={appLogo}
                          onChange={(e) => setAppLogo(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5 text-xs font-semibold">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          System Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full h-10 px-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="UTC">UTC (Coordinated Universal)</option>
                          <option value="EST">EST (Eastern Standard Time)</option>
                          <option value="IST">IST (India Standard Time)</option>
                          <option value="GMT">GMT (Greenwich Mean Time)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-xs font-semibold">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          System Language
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full h-10 px-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="en">English (US)</option>
                          <option value="es">Español (ES)</option>
                          <option value="fr">Français (FR)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-xs font-semibold">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Date Format
                        </label>
                        <select
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                          className="w-full h-10 px-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-semibold">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Default Table Pagination Limit
                      </label>
                      <select
                        value={pageLimit}
                        onChange={(e) => setPageLimit(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value={5}>5 Rows per page</option>
                        <option value={10}>10 Rows per page</option>
                        <option value={20}>20 Rows per page</option>
                        <option value={50}>50 Rows per page</option>
                        <option value={100}>100 Rows per page (Max)</option>
                      </select>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSavingApp}
                      className="w-full sm:w-fit px-6 cursor-pointer text-xs font-bold uppercase tracking-wider"
                    >
                      {isSavingApp ? "Saving..." : "Save App Settings"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </PermissionGate>
          )}

          {/* TAB 3: APPEARANCE SETTINGS */}
          {activeTab === "appearance" && (
            <Card className="border border-border/60 bg-card animate-in fade-in duration-200">
              <CardHeader className="p-5 border-b border-border/40">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                  Appearance Preferences
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Configure dark themes, layout densities, and sidebar collapse preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Console Mode Theme
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 cursor-pointer transition-all ${
                        theme === "light" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-amber-500 shadow">
                        ☀️
                      </div>
                      <span className="text-xs font-bold">Light mode</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 cursor-pointer transition-all ${
                        theme === "dark" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-950 flex items-center justify-center text-blue-400 shadow">
                        🌙
                      </div>
                      <span className="text-xs font-bold">Dark mode</span>
                    </button>
                  </div>
                </div>

                {/* Compact Mode & Sidebar Switches */}
                <div className="space-y-4 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-foreground">Compact Mode</span>
                      <p className="text-muted-foreground text-[11px] font-semibold">
                        Reduces padding and cell spacing to fit more info.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                      className="h-4.5 w-4.5 accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/20 pt-4">
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-foreground">Sidebar Collapsed</span>
                      <p className="text-muted-foreground text-[11px] font-semibold">
                        Collapse sidebar by default to maximize work workspace.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={collapsedSidebar}
                      onChange={(e) => setCollapsedSidebar(e.target.checked)}
                      className="h-4.5 w-4.5 accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/20 pt-4 text-xs font-semibold">
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-foreground">Dashboard Grid Layout</span>
                      <p className="text-muted-foreground text-[11px] font-semibold">
                        Select default alignment structure for main overview metrics.
                      </p>
                    </div>
                    <select
                      value={dashboardStyle}
                      onChange={(e) => setDashboardStyle(e.target.value)}
                      className="h-9 px-2 bg-background border border-input rounded-lg focus:outline-none"
                    >
                      <option value="grid">Responsive Grid</option>
                      <option value="list">Detailed list Rows</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleSaveAppearance}
                  className="w-full sm:w-fit px-6 cursor-pointer text-xs font-bold uppercase tracking-wider mt-4"
                >
                  Save Appearance
                </Button>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: SECURITY SETTINGS */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card className="border border-border/60 bg-card">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                    Password Security Policy
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Configure administrative passphrase validation requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-foreground">Require Uppercase character</span>
                      <p className="text-muted-foreground text-[11px] font-semibold">Passphrases must contain at least 1 uppercase letter.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reqUppercase}
                      onChange={(e) => setReqUppercase(e.target.checked)}
                      className="h-4.5 w-4.5 accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/20 pt-4">
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-foreground">Require Numbers</span>
                      <p className="text-muted-foreground text-[11px] font-semibold">Passphrases must contain at least 1 numeric digit.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reqNumbers}
                      onChange={(e) => setReqNumbers(e.target.checked)}
                      className="h-4.5 w-4.5 accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/20 pt-4">
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-foreground">Require Special Symbols</span>
                      <p className="text-muted-foreground text-[11px] font-semibold">Passphrases must contain at least 1 special character.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reqSymbols}
                      onChange={(e) => setReqSymbols(e.target.checked)}
                      className="h-4.5 w-4.5 accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/20 pt-4 text-xs font-semibold">
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-foreground">Session Timeout duration</span>
                      <p className="text-muted-foreground text-[11px] font-semibold">Force logout inactive connections after designated interval.</p>
                    </div>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="h-9 px-2 bg-background border border-input rounded-lg focus:outline-none"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="1440">24 Hours</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleSaveSecurity}
                    className="w-full sm:w-fit px-6 cursor-pointer text-xs font-bold uppercase tracking-wider mt-4"
                  >
                    Save Security Policy
                  </Button>
                </CardContent>
              </Card>

              {/* Device Sessions Placeholder */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                    Active Device Sessions
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Current logged-in client connections.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground">
                          <th className="py-2.5">Device</th>
                          <th className="py-2.5">IP Address</th>
                          <th className="py-2.5">Location</th>
                          <th className="py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/20 text-foreground font-semibold">
                          <td className="py-3 flex items-center gap-2">
                            <Laptop className="h-4 w-4 text-primary" /> Chrome on Windows (Current)
                          </td>
                          <td className="py-3 font-mono">192.168.1.104</td>
                          <td className="py-3">New Delhi, IN</td>
                          <td className="py-3 text-emerald-500 font-bold">Active</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS SETTINGS */}
          {activeTab === "notifications" && (
            <Card className="border border-border/60 bg-card animate-in fade-in duration-200">
              <CardHeader className="p-5 border-b border-border/40">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                  Notification Delivery Alerts
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Choose how and when alerts are delivered.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-foreground">Email Notifications</span>
                    <p className="text-muted-foreground text-[11px] font-semibold">Send profile audit logs and registry validation alerts to your email.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4.5 w-4.5 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/20 pt-4">
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-foreground">System Notifications</span>
                    <p className="text-muted-foreground text-[11px] font-semibold">Display banner alerts in the top notifications tray center.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemAlerts}
                    onChange={(e) => setSystemAlerts(e.target.checked)}
                    className="h-4.5 w-4.5 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/20 pt-4">
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-foreground">Browser Push Notifications</span>
                    <p className="text-muted-foreground text-[11px] font-semibold">Display native browser prompts for high severity alerts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="h-4.5 w-4.5 accent-primary cursor-pointer"
                  />
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  className="w-full sm:w-fit px-6 cursor-pointer text-xs font-bold uppercase tracking-wider mt-4"
                >
                  Save Alerts Preferences
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <PermissionGate permission="settings.view" fallback={
      <div className="flex flex-col items-center justify-center p-12 py-24 text-center border border-dashed border-border/80 rounded-2xl bg-secondary/10">
        <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground mb-1">
          Permission clearance Denied
        </h3>
        <p className="text-xs text-muted-foreground font-semibold max-w-sm">
          Your active role profile does not have authorization clearances to review or edit system configuration settings.
        </p>
      </div>
    }>
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }>
        <SettingsPageContent />
      </React.Suspense>
    </PermissionGate>
  );
}
