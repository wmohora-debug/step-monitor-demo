"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { userService } from "../../../src/features/users/services/userService";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import { authService } from "../../../src/features/auth/services/authService";
import { UserResponseDto, CreateUserDto, UpdateUserDto, SchoolResponseDto } from "../../../src/core/types";
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
  Avatar,
  StatCard,
} from "../../../src/components/ui";
import {
  CrudPageTemplate,
  CrudTable,
  ConfirmDeleteModal,
  FormModalWrapper,
  FilterDropdown,
  FilterChips,
  PermissionGate,
} from "../../../src/components/framework";
import {
  Plus,
  Users as UsersIcon,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  ShieldAlert,
  Calendar,
  School,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useSelection, useDebounce, useFilters } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";

export default function UsersPage() {
  const { success, error: toastError, warning } = useToast();

  // 1. Table states
  const [data, setData] = useState<UserResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Schools list for schoolId dropdown selection
  const [schools, setSchools] = useState<SchoolResponseDto[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { filters, setFilter, clearFilters } = useFilters({ status: null, roleSlug: null });

  // Sorting
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection
  const { selectedIds, toggleSelection, toggleAll, clearSelection } = useSelection<UserResponseDto>("id");

  // 2. Form/Action Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponseDto | null>(null);

  // Form Fields state
  const [formFields, setFormFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    roleSlug: "user" as "superadmin" | "admin" | "user",
    schoolId: "",
    profileImage: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 3. Fetch data from backend
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const response = await userService.findAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: filters.status === "active" ? "active" : filters.status === "inactive" ? "inactive" : undefined,
        roleSlug: filters.roleSlug === "superadmin" ? "superadmin" : filters.roleSlug === "admin" ? "admin" : filters.roleSlug === "user" ? "user" : undefined,
        sortBy: sortBy as any,
        sortOrder,
      });

      setData(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setErrorState(err.message || "Unable to retrieve administrative users directory.");
      toastError(err.message || "Failed to load users.", "API Error");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, filters.status, filters.roleSlug, sortBy, sortOrder, toastError]);

  // Fetch school list for forms
  const fetchSchoolsList = useCallback(async () => {
    try {
      const response = await schoolService.findAll({ page: 1, limit: 100 });
      setSchools(response.items || []);
    } catch (err) {
      console.error("Unable to preload school list:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchSchoolsList();
  }, [fetchSchoolsList]);

  // Reset pagination when search/filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.roleSlug]);

  // 4. Statistics values calculated from active table
  const statsSummary = useMemo(() => {
    const activeCount = data.filter((u) => u.isActive).length;
    const adminCount = data.filter((u) => u.role?.slug === "admin" || u.role?.slug === "superadmin").length;
    return {
      total: total,
      active: activeCount,
      admins: adminCount,
    };
  }, [data, total]);

  // 5. Handlers
  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnId);
      setSortOrder("desc");
    }
  };

  const handleOpenCreate = () => {
    setFormFields({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      roleSlug: "user",
      schoolId: "",
      profileImage: "",
    });
    setFormErrors({});
    setModalMode("create");
  };

  const handleOpenEdit = (user: UserResponseDto) => {
    setSelectedUser(user);
    setFormFields({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      roleSlug: (user.role?.slug === "superadmin" ? "superadmin" : user.role?.slug === "admin" ? "admin" : "user") as "superadmin" | "admin" | "user",
      schoolId: user.schoolId || "",
      profileImage: user.profileImage || "",
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const handleOpenView = (user: UserResponseDto) => {
    setSelectedUser(user);
    setModalMode("view");
  };

  const handleOpenDelete = (user: UserResponseDto) => {
    setUserToDelete(user);
  };

  const handleToggleStatus = async (user: UserResponseDto) => {
    try {
      const nextActive = !user.isActive;
      await userService.changeStatus(user.id, { isActive: nextActive });
      success(`User "${user.firstName} ${user.lastName}" is now ${nextActive ? "Active" : "Inactive"}.`, "Status Updated");
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Failed to update user status.", "Status Change Error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await userService.remove(userToDelete.id);
      success(`Account "${userToDelete.firstName} ${userToDelete.lastName}" removed from directories.`, "Registry Deleted");
      setUserToDelete(null);
      clearSelection();
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Failed to remove user account.", "Deletion Error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    setIsRevoking(true);
    try {
      await authService.revokeSessions(userId);
      success("All active login sessions for this user have been successfully revoked.", "Sessions Terminated");
    } catch (err: any) {
      console.error(err);
      toastError(err.message || "Failed to revoke active user sessions.", "Revocation Failed");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    warning(`Initiating bulk delete request for ${ids.length} user accounts.`, "Bulk Action");
    setIsLoading(true);
    try {
      for (const id of ids) {
        await userService.remove(id);
      }
      success(`Successfully deleted ${ids.length} users.`, "Bulk Operations Complete");
      clearSelection();
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Failed to complete bulk operations.", "Bulk Error");
      fetchUsers();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkToggleStatus = async (ids: string[]) => {
    setIsLoading(true);
    try {
      for (const id of ids) {
        const item = data.find((u) => u.id === id);
        if (item) {
          await userService.changeStatus(id, { isActive: !item.isActive });
        }
      }
      success(`Toggled active status for ${ids.length} users.`, "Bulk Status Complete");
      clearSelection();
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Failed to complete status toggling.", "Bulk Error");
      fetchUsers();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validations based on latest Swagger role requirements
    const errors: Record<string, string> = {};
    if (!formFields.firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!formFields.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }
    if (!formFields.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(formFields.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (formFields.roleSlug === "superadmin") {
      if (modalMode === "create" && !formFields.password) {
        errors.password = "Password is required for super admin accounts.";
      }
    } else if (formFields.roleSlug === "admin") {
      if (!formFields.phone.trim()) {
        errors.phone = "Phone number is required for administrators.";
      }
      if (modalMode === "create" && !formFields.password) {
        errors.password = "Password is required for administrators.";
      }
    } else if (formFields.roleSlug === "user") {
      if (!formFields.phone.trim()) {
        errors.phone = "Phone number is required for invigilators.";
      }
      if (!formFields.schoolId) {
        errors.schoolId = "Associated center/school is required for invigilators.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        let payload: CreateUserDto;
        if (formFields.roleSlug === "superadmin") {
          payload = {
            firstName: formFields.firstName,
            lastName: formFields.lastName,
            email: formFields.email,
            password: formFields.password,
            roleSlug: "superadmin",
          };
        } else if (formFields.roleSlug === "admin") {
          payload = {
            firstName: formFields.firstName,
            lastName: formFields.lastName,
            email: formFields.email,
            phone: formFields.phone,
            password: formFields.password,
            roleSlug: "admin",
          };
        } else {
          payload = {
            firstName: formFields.firstName,
            lastName: formFields.lastName,
            email: formFields.email,
            phone: formFields.phone,
            profileImage: formFields.profileImage.trim() || null,
            isActive: true,
            roleSlug: "user",
            schoolId: formFields.schoolId,
          };
        }
        await userService.create(payload);
        success(`User "${formFields.firstName} ${formFields.lastName}" created successfully.`, "User Created");
      } else if (modalMode === "edit" && selectedUser) {
        // Detect unchanged fields & only submit modified values
        const payload: UpdateUserDto = {};
        if (formFields.firstName !== selectedUser.firstName) payload.firstName = formFields.firstName;
        if (formFields.lastName !== selectedUser.lastName) payload.lastName = formFields.lastName;
        if (formFields.email !== (selectedUser.email || "")) payload.email = formFields.email;
        if (formFields.phone !== (selectedUser.phone || "")) payload.phone = formFields.phone || null;
        if (formFields.roleSlug !== (selectedUser.role?.slug || "user")) payload.roleSlug = formFields.roleSlug;
        if (formFields.schoolId !== (selectedUser.schoolId || "")) payload.schoolId = formFields.schoolId || null;
        if (formFields.profileImage !== (selectedUser.profileImage || "")) payload.profileImage = formFields.profileImage || null;

        if (Object.keys(payload).length === 0) {
          warning("No changes detected in profile parameters.", "No Updates Detected");
          setModalMode(null);
          return;
        }

        await userService.update(selectedUser.id, payload);
        success(`User profile "${formFields.firstName} ${formFields.lastName}" updated.`, "Profile Synchronized");
      }

      setModalMode(null);
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Form submission failed.", "Submit Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Table Columns configuration
  const columns = useMemo(() => [
    {
      id: "avatar",
      header: "Avatar",
      cell: (row: UserResponseDto) => (
        <Avatar src={row.profileImage || ""} fallback={(row.firstName[0] + row.lastName[0]).toUpperCase()} size="sm" />
      ),
    },
    {
      id: "fullName",
      header: "Full Name",
      sortable: true,
      cell: (row: UserResponseDto) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs leading-none">{row.firstName} {row.lastName}</span>
          <span className="text-[10px] text-muted-foreground mt-1 font-semibold">ID: {row.id.substring(0, 8)}...</span>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email Address",
      sortable: true,
      cell: (row: UserResponseDto) => (
        <span className="text-xs font-semibold text-muted-foreground">{row.email || "N/A"}</span>
      ),
    },
    {
      id: "role",
      header: "Role Clearance",
      cell: (row: UserResponseDto) => {
        const isSuper = row.role?.slug === "superadmin";
        const isAdmin = row.role?.slug === "admin";
        return (
          <Badge variant={isSuper || isAdmin ? "danger" : "secondary"} className="text-[10px] font-bold uppercase tracking-wider">
            {row.role?.name || row.role?.slug || "User"}
          </Badge>
        );
      },
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
      header: "Registered Date",
      sortable: true,
      cell: (row: UserResponseDto) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
  ], []);

  // 7. Active filter representation
  const filterChips = useMemo(() => {
    const chips = [];
    if (filters.status) {
      chips.push({
        key: "status",
        label: "Status",
        displayValue: filters.status === "active" ? "Active" : "Inactive",
      });
    }
    if (filters.roleSlug) {
      chips.push({
        key: "roleSlug",
        label: "Role",
        displayValue: filters.roleSlug === "superadmin" ? "Super Admin" : filters.roleSlug === "admin" ? "Administrator" : "Standard User",
      });
    }
    return chips;
  }, [filters]);

  return (
    <CrudPageTemplate
      title="Users & Accounts"
      description="Manage administrative accounts, access clearance roles, and coordinate center user permissions."
      primaryAction={{
        label: "Create User",
        onClick: handleOpenCreate,
        icon: Plus,
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search user name or email..."
      filters={
        <>
          <FilterDropdown
            label="Status"
            selected={filters.status as any}
            onChange={(val) => setFilter("status", val)}
            options={[
              { label: "Active Accounts", value: "active" },
              { label: "Inactive Accounts", value: "inactive" },
            ]}
          />
          <FilterDropdown
            label="Role"
            selected={filters.roleSlug as any}
            onChange={(val) => setFilter("roleSlug", val)}
            options={[
              { label: "Super Admins", value: "superadmin" },
              { label: "Administrators", value: "admin" },
              { label: "Standard Users", value: "user" },
            ]}
          />
        </>
      }
      filterChips={
        <FilterChips
          chips={filterChips}
          onRemove={(key) => setFilter(key, null)}
          onClear={clearFilters}
        />
      }
      stats={
        <>
          <StatCard title="Directory Accounts" value={statsSummary.total} description="Total administrative users" icon={<UsersIcon className="h-5 w-5 text-primary" />} />
          <StatCard title="Active Logins" value={statsSummary.active} description="Operational credential keys" icon={<CheckCircle className="h-5 w-5 text-emerald-500" />} className="border-l-emerald-500/30" />
          <StatCard title="Admins Gate" value={statsSummary.admins} description="Total dashboard administrators" icon={<ShieldAlert className="h-5 w-5 text-rose-500" />} className="border-l-rose-500/30" />
          <StatCard title="Auth Sync" value="Nominal" description="All credentials validated" icon={<RefreshCw className="h-5 w-5 text-blue-500" />} />
        </>
      }
    >
      {/* CRUD Data Table */}
      <CrudTable
        columns={columns}
        data={data}
        idKey="id"
        isLoading={isLoading}
        error={errorState}
        emptyMessage="No administrative users match the parameter guidelines."
        page={page}
        pageSize={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onToggleAll={toggleAll}
        onClearSelection={clearSelection}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRefresh={fetchUsers}
        rowActions={(row) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenView(row)}
              className="w-full justify-start gap-2 text-xs font-semibold px-2"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Profile
            </Button>
            <PermissionGate permission="users.update">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2"
              >
                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit User
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleStatus(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2"
              >
                {row.isActive ? <XCircle className="h-3.5 w-3.5 text-rose-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                {row.isActive ? "Deactivate" : "Activate"}
              </Button>
            </PermissionGate>
            <PermissionGate permission="users.delete">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDelete(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Account
              </Button>
            </PermissionGate>
          </>
        )}
        bulkActions={[
          {
            label: "Toggle Active State",
            onClick: handleBulkToggleStatus,
            icon: RefreshCw,
          },
          {
            label: "Delete Selected",
            onClick: handleBulkDelete,
            icon: Trash2,
            variant: "destructive",
          },
        ]}
      />

      {/* CREATE & EDIT FORM MODAL */}
      {(modalMode === "create" || modalMode === "edit") && (
        <FormModalWrapper
          isOpen={true}
          onClose={() => setModalMode(null)}
          onSubmit={handleFormSubmit}
          title={modalMode === "create" ? "Create Account Credentials" : "Modify User Profile"}
          description={modalMode === "create" ? "Add a new user to the administrative control panel directory." : "Modify access roles, email notifications, and school associations."}
          size="md"
          isSubmitting={isSubmitting}
          submitLabel={modalMode === "create" ? "Register User" : "Save Changes"}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">First Name <strong className="text-destructive">*</strong></span>
                <Input
                  placeholder="John"
                  value={formFields.firstName}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, firstName: e.target.value }))}
                  error={formErrors.firstName}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">Last Name <strong className="text-destructive">*</strong></span>
                <Input
                  placeholder="Doe"
                  value={formFields.lastName}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, lastName: e.target.value }))}
                  error={formErrors.lastName}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Email Address <strong className="text-destructive">*</strong></span>
              <Input
                type="email"
                placeholder="john.doe@enterprise.com"
                value={formFields.email}
                onChange={(e) => setFormFields((prev) => ({ ...prev, email: e.target.value }))}
                error={formErrors.email}
              />
            </div>

            {modalMode === "create" && (formFields.roleSlug === "superadmin" || formFields.roleSlug === "admin") && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">Password <strong className="text-destructive">*</strong></span>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formFields.password}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, password: e.target.value }))}
                  error={formErrors.password}
                />
              </div>
            )}

            {(formFields.roleSlug !== "superadmin" || modalMode === "edit") && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">
                  Phone Number
                  {(formFields.roleSlug === "admin" || formFields.roleSlug === "user") && <strong className="text-destructive"> *</strong>}
                </span>
                <Input
                  placeholder="+91 98765 43210"
                  value={formFields.phone}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, phone: e.target.value }))}
                  error={formErrors.phone}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Role Clearance <strong className="text-destructive">*</strong></span>
              <select
                value={formFields.roleSlug}
                onChange={(e) => setFormFields((prev) => ({ ...prev, roleSlug: e.target.value as any }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="user">Standard User / Invigilator</option>
                <option value="admin">Administrator</option>
                <option value="superadmin">Super Administrator</option>
              </select>
            </div>

            {(formFields.roleSlug === "user" || modalMode === "edit") && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">
                  Associated Center / School
                  {formFields.roleSlug === "user" && <strong className="text-destructive"> *</strong>}
                </span>
                <select
                  value={formFields.schoolId}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, schoolId: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No School Association (Global Admin)</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.schoolName} ({school.schoolId || "Global"})
                    </option>
                  ))}
                </select>
                {formErrors.schoolId && <span className="text-[10px] text-destructive font-semibold">{formErrors.schoolId}</span>}
              </div>
            )}

            {(formFields.roleSlug === "user" || modalMode === "edit") && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">Profile Image Link</span>
                <Input
                  placeholder="https://cdn.com/avatar.jpg"
                  value={formFields.profileImage}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, profileImage: e.target.value }))}
                  error={formErrors.profileImage}
                />
              </div>
            )}
          </div>
        </FormModalWrapper>
      )}

      {/* DETAIL MODAL / PROFILE CARD */}
      {modalMode === "view" && selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          size="md"
          title="Account Profile Coordinates"
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalMode(null)}>
                Close
              </Button>
              <PermissionGate permission="users.update">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isRevoking}
                  onClick={() => handleRevokeSessions(selectedUser.id)}
                  className="gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/5 cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {isRevoking ? "Revoking..." : "Revoke Sessions"}
                </Button>
                <Button size="sm" onClick={() => handleOpenEdit(selectedUser)} className="gap-1.5 ml-2">
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </PermissionGate>
            </div>
          }
        >
          <div className="space-y-6 py-1">
            {/* Header info */}
            <div className="flex items-center gap-4 border-b border-border/40 pb-4">
              <Avatar
                src={selectedUser.profileImage || ""}
                fallback={(selectedUser.firstName[0] + selectedUser.lastName[0]).toUpperCase()}
                size="lg"
                className="h-16 w-16 text-lg font-bold rounded-2xl"
              />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground leading-tight">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={selectedUser.role?.slug === "admin" ? "danger" : "secondary"} className="text-[9px] font-extrabold uppercase tracking-wider">
                    {selectedUser.role?.name || "User"}
                  </Badge>
                  <StatusBadge status={selectedUser.isActive ? "active" : "inactive"} />
                </div>
              </div>
            </div>

            {/* General Info Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-muted-foreground">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Communication Keys</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span className="truncate">{selectedUser.email || "No Email listed"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>{selectedUser.phone || "No Phone listed"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Assigned Deployments</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <School className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>
                      {selectedUser.schoolId
                        ? schools.find((s) => s.id === selectedUser.schoolId)?.schoolName || "Institutional Partner"
                        : "Global Operator"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>Registered on {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata and security logs */}
            <div className="border-t border-border/40 pt-4 space-y-2 text-[10px] font-bold text-muted-foreground/75">
              <div className="flex justify-between">
                <span>Account Unique Reference:</span>
                <span className="font-mono text-foreground">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated Profile Settings:</span>
                <span className="text-foreground">{new Date(selectedUser.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      {userToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          itemName={`${userToDelete.firstName} ${userToDelete.lastName}`}
          isLoading={isDeleting}
        />
      )}
    </CrudPageTemplate>
  );
}
