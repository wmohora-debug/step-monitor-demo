"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "../../../src/components/ui/Toast";
import { roleService } from "../../../src/features/roles/services/roleService";
import { userService } from "../../../src/features/users/services/userService";
import { RoleResponseDto, PermissionGroupDto } from "../../../src/core/types/role";
import { UserResponseDto } from "../../../src/core/types/user";
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
  PermissionGate,
  CrudTable,
  CrudColumnDef,
} from "../../../src/components/framework";
import {
  Shield,
  Search,
  Plus,
  Copy,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  UserCheck,
  UserMinus,
  CheckSquare,
  Square,
  Lock,
  RefreshCw,
} from "lucide-react";

// Standard Permission Modules list for the Matrix
const SYSTEM_PERMISSION_GROUPS: PermissionGroupDto[] = [
  {
    moduleName: "Dashboard Overview",
    permissions: [
      { slug: "dashboard.view", name: "View Dashboard Overview", description: "Clearance to view main dashboard graphs and summary widgets." }
    ]
  },
  {
    moduleName: "Schools Manager",
    permissions: [
      { slug: "schools.view", name: "View Schools List", description: "View registered schools and configuration details." },
      { slug: "schools.create", name: "Create School", description: "Register new schools inside the workspace." },
      { slug: "schools.update", name: "Update School", description: "Modify existing school parameters or details." },
      { slug: "schools.delete", name: "Delete School", description: "Remove school registry entries." },
      { slug: "schools.approve", name: "Approve Activation", description: "Approve or defer school registration requests." }
    ]
  },
  {
    moduleName: "Users & Accounts",
    permissions: [
      { slug: "users.view", name: "View User List", description: "View details of administrative and operator profiles." },
      { slug: "users.create", name: "Register User", description: "Create new user profiles or role bindings." },
      { slug: "users.update", name: "Modify User Details", description: "Edit names, phones, or profile images of accounts." },
      { slug: "users.delete", name: "Delete User", description: "Remove user credentials from standard database entries." },
      { slug: "users.reset_password", name: "Reset User Password", description: "Force passkey resets for specific users." }
    ]
  },
  {
    moduleName: "Categories Inventory",
    permissions: [
      { slug: "categories.view", name: "View Categories", description: "View list of active item catalogs." },
      { slug: "categories.create", name: "Create Category", description: "Add new inventory categories." },
      { slug: "categories.update", name: "Update Category", description: "Modify active item category tags." },
      { slug: "categories.delete", name: "Delete Category", description: "Remove categories from registry index." }
    ]
  },
  {
    moduleName: "Inventory Items",
    permissions: [
      { slug: "items.view", name: "View Inventory Items", description: "View list of registered inventory assets." },
      { slug: "items.create", name: "Register Item", description: "Create new equipment or stock items." },
      { slug: "items.update", name: "Update Item Details", description: "Modify catalog values, serial numbers, or stock flags." },
      { slug: "items.delete", name: "Delete Item", description: "Remove asset records from catalog." },
      { slug: "items.export", name: "Export Items List", description: "Download CSV spreadsheet reports of inventory items." }
    ]
  },
  {
    moduleName: "Reports & System Analytics",
    permissions: [
      { slug: "reports.view", name: "View Analytics Console", description: "Clearance to review registration trends and inventory distributions." },
      { slug: "reports.export", name: "Export Report Data", description: "Clearance to export spreadsheet audit data." }
    ]
  },
  {
    moduleName: "Configuration Settings",
    permissions: [
      { slug: "settings.view", name: "View Settings", description: "Clearance to review timezone, localization, and compact modes." },
      { slug: "settings.edit", name: "Configure App Parameters", description: "Modify general application names, session timeouts, and security policies." }
    ]
  },
  {
    moduleName: "Security Audit Logs",
    permissions: [
      { slug: "audit.view", name: "View Audit Center", description: "Access vertical activity streams and logs database." },
      { slug: "audit.export", name: "Export Audit Records", description: "Download CSV files of security action logs." }
    ]
  }
];

// Sandbox mock roles for initial validation
const SANDBOX_ROLES: RoleResponseDto[] = [
  {
    id: "r-1",
    name: "Super Admin",
    slug: "admin",
    description: "Full workspace administrative clearances. Inherits all security permissions by default.",
    permissions: SYSTEM_PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.slug)),
    assignedUsersCount: 1,
    createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
  },
  {
    id: "r-2",
    name: "School Administrator",
    slug: "school_admin",
    description: "Manage users and catalog items corresponding directly to their localized school context.",
    permissions: [
      "dashboard.view",
      "schools.view",
      "users.view",
      "users.create",
      "users.update",
      "categories.view",
      "items.view",
      "items.create",
      "items.update",
      "reports.view",
    ],
    assignedUsersCount: 3,
    createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
  {
    id: "r-3",
    name: "Guest Observer",
    slug: "guest_observer",
    description: "Read-only access to review dashboards, metrics, and inventories without permission to modify.",
    permissions: [
      "dashboard.view",
      "schools.view",
      "users.view",
      "categories.view",
      "items.view",
      "reports.view",
    ],
    assignedUsersCount: 5,
    createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
  }
];

// Mock Users for sandbox role assignment
const SANDBOX_USERS: UserResponseDto[] = [
  {
    id: "u-101",
    firstName: "Amit",
    lastName: "Sharma",
    email: "amit.sharma@delhiacademy.in",
    phone: "+91 98765 43210",
    profileImage: null,
    role: { id: "r-2", name: "School Administrator", slug: "school_admin" },
    schoolId: "s-1",
    selectedClassroomId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u-102",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya.nair@smarttech.edu",
    phone: "+91 88888 77777",
    profileImage: null,
    role: { id: "r-3", name: "Guest Observer", slug: "guest_observer" },
    schoolId: null,
    selectedClassroomId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u-103",
    firstName: "Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@mumbaihs.in",
    phone: "+91 99999 88888",
    profileImage: null,
    role: { id: "r-3", name: "Guest Observer", slug: "guest_observer" },
    schoolId: "s-2",
    selectedClassroomId: null,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function RolesPermissionsPage() {
  const { success, error: toastError, info, warning } = useToast();

  // Mode: "list" | "create" | "edit" | "inspect"
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "inspect">("list");

  // Roles states
  const [roles, setRoles] = useState<RoleResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sandbox Mode settings
  const [sandboxMode, setSandboxMode] = useState(false);
  const [showSandboxBanner, setShowSandboxBanner] = useState(false);

  // Active Role Form details
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Permission Matrix details
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Dashboard Overview": true,
    "Schools Manager": true,
    "Users & Accounts": true,
  });

  // User Assignment states (for Inspect Mode)
  const [assignedUsers, setAssignedUsers] = useState<UserResponseDto[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserResponseDto[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Fetch Roles List from API
  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);

    if (sandboxMode) {
      setTimeout(() => {
        let filtered = [...SANDBOX_ROLES];
        if (searchQuery) {
          filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.slug.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setRoles(filtered);
        setIsLoading(false);
      }, 300);
      return;
    }

    try {
      const list = await roleService.findAll();
      setRoles(list || []);
      setShowSandboxBanner(false);
    } catch (err: any) {
      console.error(err);
      setErrorState("Endpoint not found. The server is not exposing '/admin/roles'.");
      setRoles([]);
      setShowSandboxBanner(true);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxMode, searchQuery]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Load User bindings when inspecting a specific role
  const fetchRoleDetails = useCallback(async (roleId: string) => {
    setIsLoading(true);
    if (sandboxMode) {
      setTimeout(() => {
        const found = SANDBOX_ROLES.find(r => r.id === roleId);
        if (found) {
          setRoleName(found.name);
          setRoleSlug(found.slug);
          setRoleDescription(found.description);
          setRolePermissions(found.permissions);

          // Get users bound to this role slug
          const assigned = SANDBOX_USERS.filter(u => u.role.slug === found.slug);
          const available = SANDBOX_USERS.filter(u => u.role.slug !== found.slug);

          setAssignedUsers(assigned);
          setAvailableUsers(available);
        }
        setIsLoading(false);
      }, 250);
      return;
    }

    try {
      const details = await roleService.findOne(roleId);
      setRoleName(details.name);
      setRoleSlug(details.slug);
      setRoleDescription(details.description);
      setRolePermissions(details.permissions || []);

      // Load assigned users
      const users = await roleService.getAssignedUsers(roleId);
      setAssignedUsers(users || []);

      // Load all workspace users to build available list
      const allUsers = await userService.findAll({ limit: 100 });
      const activeIds = new Set(users.map(u => u.id));
      setAvailableUsers((allUsers.items || []).filter(u => !activeIds.has(u.id)));
    } catch {
      // API fallback
      toastError("Failed to fetch full role details.", "Connection Error");
      setViewMode("list");
    } finally {
      setIsLoading(false);
    }
  }, [sandboxMode, toastError]);

  // Expand / Collapse Permission Group
  const toggleGroupExpand = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Toggle single permission inside array
  const handleTogglePermission = (slug: string) => {
    setRolePermissions(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  // Toggle entire Permission Group (Module Select All)
  const handleToggleGroupPermissions = (group: PermissionGroupDto) => {
    const slugs = group.permissions.map(p => p.slug);
    const hasAll = slugs.every(s => rolePermissions.includes(s));

    if (hasAll) {
      // Remove all permissions in this group
      setRolePermissions(prev => prev.filter(s => !slugs.includes(s)));
    } else {
      // Add all missing permissions in this group
      setRolePermissions(prev => Array.from(new Set([...prev, ...slugs])));
    }
  };

  // Toggle all system permissions (Global Select All)
  const handleToggleAllPermissions = () => {
    const allSlugs = SYSTEM_PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.slug));
    const hasAll = allSlugs.every(s => rolePermissions.includes(s));

    if (hasAll) {
      setRolePermissions([]);
    } else {
      setRolePermissions(allSlugs);
    }
  };

  // Save Role submit handler
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || !roleSlug) {
      toastError("Please complete required Name and Slug identifiers.", "Validation Error");
      return;
    }

    setIsSavingRole(true);
    if (sandboxMode) {
      setTimeout(() => {
        if (viewMode === "create") {
          const newRole: RoleResponseDto = {
            id: `r-${Date.now()}`,
            name: roleName,
            slug: roleSlug.toLowerCase().replace(/\s+/g, "_"),
            description: roleDescription,
            permissions: rolePermissions,
            assignedUsersCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          SANDBOX_ROLES.push(newRole);
          success("Role created successfully in Sandbox memory.", "Role Created");
        } else if (viewMode === "edit" && selectedRoleId) {
          const index = SANDBOX_ROLES.findIndex(r => r.id === selectedRoleId);
          if (index !== -1) {
            SANDBOX_ROLES[index] = {
              ...SANDBOX_ROLES[index],
              name: roleName,
              description: roleDescription,
              permissions: rolePermissions,
              updatedAt: new Date().toISOString()
            };
            success("Role details updated inside Sandbox memory.", "Role Saved");
          }
        }
        setIsSavingRole(false);
        setViewMode("list");
        fetchRoles();
      }, 300);
      return;
    }

    try {
      if (viewMode === "create") {
        await roleService.create({
          name: roleName,
          slug: roleSlug,
          description: roleDescription,
          permissions: rolePermissions
        });
        success("Role registered successfully.", "Role Active");
      } else if (viewMode === "edit" && selectedRoleId) {
        await roleService.update(selectedRoleId, {
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions
        });
        success("Role permissions updated.", "Role Saved");
      }
      setViewMode("list");
      fetchRoles();
    } catch (err: any) {
      toastError(err.message || "Failed to commit role transactions.", "Registry Error");
    } finally {
      setIsSavingRole(false);
    }
  };

  // Clone existing Role structure into form builder
  const handleCloneRole = (role: RoleResponseDto) => {
    setRoleName(`${role.name} Copy`);
    setRoleSlug(`${role.slug}_copy`);
    setRoleDescription(`Cloned parameters from ${role.name}. ${role.description}`);
    setRolePermissions([...role.permissions]);
    setSelectedRoleId(null);
    setViewMode("create");
    info("Cloned role template structure.", "Role Builder Active");
  };

  // Delete Role configuration
  const handleDeleteRole = async (roleId: string) => {
    if (sandboxMode) {
      const index = SANDBOX_ROLES.findIndex(r => r.id === roleId);
      if (index !== -1) {
        if (SANDBOX_ROLES[index].assignedUsersCount > 0) {
          toastError("Cannot delete role while active operators remain bound to it.", "Access Restricted");
          return;
        }
        SANDBOX_ROLES.splice(index, 1);
        success("Role removed from sandbox memory.", "Role Deleted");
        fetchRoles();
      }
      return;
    }

    try {
      await roleService.delete(roleId);
      success("Role deleted successfully.", "Role Removed");
      fetchRoles();
    } catch (err: any) {
      toastError(err.message || "Failed to delete role configurations.", "Deletion Restricted");
    }
  };

  // Add user assignment
  const handleAssignUser = async (userId: string) => {
    if (!selectedRoleId) return;
    if (sandboxMode) {
      const userIndex = SANDBOX_USERS.findIndex(u => u.id === userId);
      const roleIndex = SANDBOX_ROLES.findIndex(r => r.id === selectedRoleId);
      if (userIndex !== -1 && roleIndex !== -1) {
        // Change user role binding
        SANDBOX_USERS[userIndex].role = {
          id: selectedRoleId,
          name: SANDBOX_ROLES[roleIndex].name,
          slug: SANDBOX_ROLES[roleIndex].slug
        };
        // Increment count
        SANDBOX_ROLES[roleIndex].assignedUsersCount += 1;
        success("User assigned to role successfully.", "Operator Synced");
        fetchRoleDetails(selectedRoleId);
        fetchRoles();
      }
      return;
    }

    try {
      await roleService.assignUser(selectedRoleId, userId);
      success("Operator mapped to role successfully.", "User Assigned");
      fetchRoleDetails(selectedRoleId);
    } catch {
      toastError("Failed to map user credentials to role.", "Assignment Error");
    }
  };

  // Remove user assignment
  const handleUnassignUser = async (userId: string) => {
    if (!selectedRoleId) return;
    if (sandboxMode) {
      const userIndex = SANDBOX_USERS.findIndex(u => u.id === userId);
      const roleIndex = SANDBOX_ROLES.findIndex(r => r.id === selectedRoleId);
      if (userIndex !== -1 && roleIndex !== -1) {
        // Reset role to observer
        SANDBOX_USERS[userIndex].role = {
          id: "r-3",
          name: "Guest Observer",
          slug: "guest_observer"
        };
        // Decrement count
        SANDBOX_ROLES[roleIndex].assignedUsersCount = Math.max(0, SANDBOX_ROLES[roleIndex].assignedUsersCount - 1);
        success("User mapping revoked.", "Operator Removed");
        fetchRoleDetails(selectedRoleId);
        fetchRoles();
      }
      return;
    }

    try {
      await roleService.unassignUser(selectedRoleId, userId);
      success("Revoked operator role access.", "User Unassigned");
      fetchRoleDetails(selectedRoleId);
    } catch {
      toastError("Failed to revoke user role mapping.", "Revocation Error");
    }
  };

  // Helper: check if all permissions inside matrix are active
  const isGlobalAllSelected = useMemo(() => {
    const allSlugs = SYSTEM_PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.slug));
    return allSlugs.length > 0 && allSlugs.every(s => rolePermissions.includes(s));
  }, [rolePermissions]);

  // Available users filtered by search query
  const filteredAvailableUsers = useMemo(() => {
    if (!userSearchQuery) return availableUsers;
    return availableUsers.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [availableUsers, userSearchQuery]);

  // Table columns for list view
  const columns: CrudColumnDef<RoleResponseDto>[] = [
    {
      id: "name",
      header: "Role Descriptor",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs">{row.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{row.slug}</span>
        </div>
      )
    },
    {
      id: "description",
      header: "Access Description",
      cell: (row) => (
        <span className="text-xs text-muted-foreground block max-w-sm truncate leading-relaxed">
          {row.description || "No description set"}
        </span>
      )
    },
    {
      id: "permissions",
      header: "Permissions Count",
      cell: (row) => (
        <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
          {row.permissions.length} Auth Codes
        </Badge>
      )
    },
    {
      id: "assignedUsersCount",
      header: "Active Operators",
      cell: (row) => (
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {row.assignedUsersCount}
        </span>
      )
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (row) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  return (
    <PermissionGate permission="roles.view" fallback={
      <div className="flex flex-col items-center justify-center p-12 py-24 text-center border border-dashed border-border/80 rounded-2xl bg-secondary/10">
        <Lock className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground mb-1">
          Permission clearance Denied
        </h3>
        <p className="text-xs text-muted-foreground font-semibold max-w-sm">
          Your active role profile does not have authorization clearances to review access control roles and matrix.
        </p>
      </div>
    }>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Shield className="h-6.5 w-6.5 text-primary" /> Roles & Permissions Console
            </h1>
            <p className="text-xs font-medium text-muted-foreground max-w-2xl leading-relaxed">
              Design access control matrices, map security tokens, and bind user roles to system permissions.
            </p>
          </div>
          {viewMode === "list" && (
            <PermissionGate permission="roles.create">
              <Button
                onClick={() => {
                  setRoleName("");
                  setRoleSlug("");
                  setRoleDescription("");
                  setRolePermissions([]);
                  setSelectedRoleId(null);
                  setViewMode("create");
                }}
                className="h-9.5 text-xs font-bold uppercase tracking-wider gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Custom Role
              </Button>
            </PermissionGate>
          )}
        </div>

        {/* API connection alerts */}
        {showSandboxBanner && (
          <Card className="border border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-xs">
              <div className="flex items-start sm:items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">RBAC Connection Deferred</p>
                  <p className="text-muted-foreground font-semibold text-[11px]">
                    The `/admin/roles` endpoint is not active on this backend build. Enable the sandbox environment to audit components.
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

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search filter pane */}
            <Card className="border border-border/50 bg-secondary/15 backdrop-blur-md">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search roles by descriptor or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRoles}
                  className="h-9 px-3 gap-1.5 cursor-pointer text-xs font-semibold"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh List
                </Button>
              </CardContent>
            </Card>

            {/* Roles Table */}
            <CrudTable
              columns={columns}
              data={roles}
              idKey="id"
              isLoading={isLoading}
              error={errorState}
              emptyMessage="No security roles registered inside workspace index."
              onRefresh={fetchRoles}
              rowActions={(row) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoleId(row.id);
                      setViewMode("inspect");
                      fetchRoleDetails(row.id);
                    }}
                    className="h-7 text-[8px] font-extrabold uppercase tracking-wider px-2 cursor-pointer"
                  >
                    Inspect
                  </Button>
                  <PermissionGate permission="roles.update">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRoleId(row.id);
                        setViewMode("edit");
                        fetchRoleDetails(row.id);
                      }}
                      className="h-7 text-[8px] font-extrabold uppercase tracking-wider px-2 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                  </PermissionGate>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloneRole(row)}
                    className="h-7 text-[8px] font-extrabold uppercase tracking-wider px-2 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Clone
                  </Button>
                  <PermissionGate permission="roles.delete">
                    {row.slug !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Confirm deletion of custom role configuration for ${row.name}?`)) {
                            handleDeleteRole(row.id);
                          }
                        }}
                        className="h-7 text-[8px] font-extrabold uppercase tracking-wider px-2 cursor-pointer text-rose-500 border-rose-500/20 hover:bg-rose-500/5"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    )}
                  </PermissionGate>
                </div>
              )}
            />
          </div>
        )}

        {/* CREATE / EDIT VIEW */}
        {(viewMode === "create" || viewMode === "edit") && (
          <form onSubmit={handleSaveRole} className="space-y-6 animate-in fade-in duration-200">
            {/* Metadata Fields */}
            <Card className="border border-border/60 bg-card">
              <CardHeader className="p-5 border-b border-border/40">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                  Role Definitions
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Provide identifiers and authorization boundaries.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Role Name
                    </label>
                    <Input
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g. Registrar Officer"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Role Slug Identifier
                    </label>
                    <Input
                      value={roleSlug}
                      onChange={(e) => setRoleSlug(e.target.value)}
                      placeholder="e.g. registrar_officer"
                      disabled={viewMode === "edit"}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Access Scope Description
                  </label>
                  <Input
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Clear description explaining workspace clearances."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Permission Matrix */}
            <Card className="border border-border/60 bg-card">
              <CardHeader className="p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                    Permissions authorization Matrix
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Select authorized permissions mapped to system modules.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-primary bg-primary/5 border border-primary/20 px-3 py-1 rounded-xl">
                    {rolePermissions.length} / {SYSTEM_PERMISSION_GROUPS.flatMap(g => g.permissions).length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleAllPermissions}
                    className="h-8.5 px-3 border border-border/50 text-[10px] uppercase font-bold rounded-lg cursor-pointer hover:bg-secondary/40 text-foreground transition-all"
                  >
                    {isGlobalAllSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {SYSTEM_PERMISSION_GROUPS.map((group) => {
                  const isExpanded = !!expandedGroups[group.moduleName];
                  const slugs = group.permissions.map(p => p.slug);
                  const hasAll = slugs.every(s => rolePermissions.includes(s));
                  const hasSome = slugs.some(s => rolePermissions.includes(s)) && !hasAll;

                  return (
                    <div key={group.moduleName} className="border border-border/40 rounded-2xl overflow-hidden bg-secondary/5">
                      {/* Group Header */}
                      <div className="flex items-center justify-between p-3.5 bg-secondary/20 border-b border-border/20">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleGroupExpand(group.moduleName)}
                            className="h-6 w-6 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <span className="text-xs font-black text-foreground uppercase tracking-wide">
                            {group.moduleName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleGroupPermissions(group)}
                          className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-primary hover:underline cursor-pointer"
                        >
                          {hasAll ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              Deselect Module
                            </>
                          ) : (
                            <>
                              <div className="h-3.5 w-3.5 rounded-full border border-primary/40 flex items-center justify-center">
                                {hasSome && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              </div>
                              Authorize Module
                            </>
                          )}
                        </button>
                      </div>

                      {/* Group Permissions List */}
                      {isExpanded && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.permissions.map((p) => {
                            const isChecked = rolePermissions.includes(p.slug);
                            return (
                              <button
                                key={p.slug}
                                type="button"
                                onClick={() => handleTogglePermission(p.slug)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-primary/[0.02] border-primary/30"
                                    : "bg-background border-border/40 hover:bg-secondary/40"
                                }`}
                              >
                                <div className="mt-0.5 text-primary shrink-0">
                                  {isChecked ? (
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Square className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="space-y-0.5 text-xs font-semibold">
                                  <span className="text-foreground block">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground leading-normal font-medium block">
                                    {p.description}
                                  </span>
                                  <span className="text-[9px] text-primary/80 font-mono mt-1 block">
                                    Code: {p.slug}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={isSavingRole}
                className="h-10 px-6 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                {isSavingRole ? "Saving..." : "Commit Role"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode("list")}
                className="h-10 px-6 cursor-pointer text-xs font-bold uppercase tracking-wider border-border/60"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* INSPECT DETAIL VIEW */}
        {viewMode === "inspect" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Action Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setViewMode("list")}
                className="h-9 text-xs font-semibold border-border/60"
              >
                ← Back to Roles
              </Button>
              <PermissionGate permission="roles.update">
                <Button
                  onClick={() => setViewMode("edit")}
                  className="h-9 text-xs font-semibold gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Permissions
                </Button>
              </PermissionGate>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Role General Info Summary */}
              <div className="space-y-6">
                <Card className="border border-border/60 bg-card">
                  <CardHeader className="p-5 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                      Role Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wide">Role Name</span>
                      <p className="text-foreground text-sm font-black">{roleName}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wide">Slug Identifier</span>
                      <p className="text-foreground font-mono">{roleSlug}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wide">Description Scope</span>
                      <p className="text-muted-foreground leading-relaxed font-medium">{roleDescription || "No description provided."}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-4 text-center">
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">Auth Codes</span>
                        <p className="text-foreground text-lg font-black">{rolePermissions.length}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">Assigned Users</span>
                        <p className="text-foreground text-lg font-black">{assignedUsers.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Assignment Management */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-border/60 bg-card">
                  <CardHeader className="p-5 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                      Assigned Operators
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      View and manage workspace users mapped to the {roleName} role.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {assignedUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-semibold py-4 text-center">
                        No operators are currently assigned to this role scope.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {assignedUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-secondary/10 text-xs font-semibold">
                            <div className="space-y-0.5">
                              <p className="text-foreground font-bold">{user.firstName} {user.lastName}</p>
                              <p className="text-muted-foreground text-[10px] font-medium">{user.email}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnassignUser(user.id)}
                              className="h-8 text-[9px] font-bold text-rose-500 border-rose-500/20 hover:bg-rose-500/5 cursor-pointer gap-1"
                            >
                              <UserMinus className="h-3.5 w-3.5" /> Revoke
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Users assignment board */}
                <Card className="border border-border/60 bg-card">
                  <CardHeader className="p-5 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                      Assign Operators
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      Map other workspace operators to the {roleName} clearance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search operator list by name..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>

                    {filteredAvailableUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-semibold py-4 text-center">
                        No additional available operators found.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {filteredAvailableUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-secondary/5 text-xs font-semibold">
                            <div className="space-y-0.5">
                              <p className="text-foreground font-bold">{user.firstName} {user.lastName}</p>
                              <p className="text-muted-foreground text-[10px] font-medium">{user.email}</p>
                              <p className="text-primary text-[9px] font-mono">Current role: {user.role.name}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignUser(user.id)}
                              className="h-8 text-[9px] font-bold text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/5 cursor-pointer gap-1"
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
