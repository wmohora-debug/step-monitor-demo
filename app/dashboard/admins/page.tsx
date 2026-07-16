"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { adminService } from "../../../src/features/users/services/adminService";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import { authService } from "../../../src/features/auth/services/authService";
import { UserResponseDto as AdminResponseDto, CreateUserDto as CreateAdminDto, UpdateUserDto as UpdateAdminDto, SchoolResponseDto } from "../../../src/core/types";
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
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useSelection, useDebounce, useFilters } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";

export default function AdminsPage() {
  const { success, error: toastError, warning } = useToast();

  // 1. Table states
  const [data, setData] = useState<AdminResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Schools list for schoolId dropdown selection if needed
  const [schools, setSchools] = useState<SchoolResponseDto[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { filters, setFilter, clearFilters } = useFilters({ status: null });

  // Sorting
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection
  const { selectedIds, toggleSelection, toggleAll, clearSelection } = useSelection<AdminResponseDto>("id");

  // 2. Form/Action Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminResponseDto | null>(null);

  // Form Fields state
  const [formFields, setFormFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleSlug: "admin" as "admin" | "user",
    schoolId: "",
    profileImage: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 3. Fetch data from backend
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const response = await adminService.findAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: filters.status === "active" ? "active" : filters.status === "inactive" ? "inactive" : undefined,
        sortBy: sortBy as any,
        sortOrder,
      });

      setData(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setErrorState(err.message || "Unable to retrieve Super Administrators registry.");
      toastError(err.message || "Failed to load super administrators.", "API Error");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, filters.status, sortBy, sortOrder, toastError]);

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
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    fetchSchoolsList();
  }, [fetchSchoolsList]);

  // Reset pagination when search/filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status]);

  // 4. Statistics values calculated from active table
  const statsSummary = useMemo(() => {
    const activeCount = data.filter((u) => u.isActive).length;
    return {
      total: total,
      active: activeCount,
      inactive: total - activeCount,
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
      roleSlug: "admin",
      schoolId: "",
      profileImage: "",
    });
    setFormErrors({});
    setModalMode("create");
  };

  const handleOpenEdit = (admin: AdminResponseDto) => {
    setSelectedAdmin(admin);
    setFormFields({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email || "",
      phone: admin.phone || "",
      roleSlug: "admin",
      schoolId: admin.schoolId || "",
      profileImage: admin.profileImage || "",
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const handleOpenView = (admin: AdminResponseDto) => {
    setSelectedAdmin(admin);
    setModalMode("view");
  };

  const handleOpenDelete = (admin: AdminResponseDto) => {
    setAdminToDelete(admin);
  };

  const handleToggleStatus = async (admin: AdminResponseDto) => {
    try {
      const nextActive = !admin.isActive;
      await adminService.changeStatus(admin.id, { isActive: nextActive });
      success(`Administrator "${admin.firstName} ${admin.lastName}" is now ${nextActive ? "Active" : "Inactive"}.`, "Status Updated");
      fetchAdmins();
    } catch (err: any) {
      toastError(err.message || "Failed to update administrator status.", "Status Change Error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.remove(adminToDelete.id);
      success(`Administrator "${adminToDelete.firstName} ${adminToDelete.lastName}" removed.`, "Registry Deleted");
      setAdminToDelete(null);
      clearSelection();
      fetchAdmins();
    } catch (err: any) {
      toastError(err.message || "Failed to remove administrator account.", "Deletion Error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    setIsRevoking(true);
    try {
      await authService.revokeSessions(userId);
      success("All active login sessions for this administrator have been successfully revoked.", "Sessions Terminated");
    } catch (err: any) {
      console.error(err);
      toastError(err.message || "Failed to revoke active sessions.", "Revocation Failed");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    warning(`Initiating bulk delete request for ${ids.length} administrator accounts.`, "Bulk Action");
    setIsLoading(true);
    try {
      for (const id of ids) {
        await adminService.remove(id);
      }
      success(`Successfully deleted ${ids.length} administrators.`, "Bulk Operations Complete");
      clearSelection();
      fetchAdmins();
    } catch (err: any) {
      toastError(err.message || "Failed to complete bulk operations.", "Bulk Error");
      fetchAdmins();
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
          await adminService.changeStatus(id, { isActive: !item.isActive });
        }
      }
      success(`Toggled active status for ${ids.length} administrators.`, "Bulk Status Complete");
      clearSelection();
      fetchAdmins();
    } catch (err: any) {
      toastError(err.message || "Failed to complete status toggling.", "Bulk Error");
      fetchAdmins();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!formFields.firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!formFields.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }
    if (formFields.email && !/\S+@\S+\.\S+/.test(formFields.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: CreateAdminDto = {
          firstName: formFields.firstName,
          lastName: formFields.lastName,
          email: formFields.email,
          phone: formFields.phone || null,
          roleSlug: "admin",
          schoolId: formFields.schoolId || null,
          profileImage: formFields.profileImage || null,
          isActive: true,
        };
        await adminService.create(payload);
        success(`Administrator "${formFields.firstName} ${formFields.lastName}" created successfully.`, "Admin Created");
      } else if (modalMode === "edit" && selectedAdmin) {
        const payload: UpdateAdminDto = {};
        if (formFields.firstName !== selectedAdmin.firstName) payload.firstName = formFields.firstName;
        if (formFields.lastName !== selectedAdmin.lastName) payload.lastName = formFields.lastName;
        if (formFields.email !== (selectedAdmin.email || "")) payload.email = formFields.email;
        if (formFields.phone !== (selectedAdmin.phone || "")) payload.phone = formFields.phone || null;
        if (formFields.schoolId !== (selectedAdmin.schoolId || "")) payload.schoolId = formFields.schoolId || null;
        if (formFields.profileImage !== (selectedAdmin.profileImage || "")) payload.profileImage = formFields.profileImage || null;

        if (Object.keys(payload).length === 0) {
          warning("No changes detected. Action aborted.", "Update Interrupted");
          setModalMode(null);
          return;
        }

        await adminService.update(selectedAdmin.id, payload);
        success(`Administrator profile "${formFields.firstName} ${formFields.lastName}" updated successfully.`, "Admin Updated");
      }
      setModalMode(null);
      fetchAdmins();
    } catch (err: any) {
      toastError(err.message || "Failed to submit administrator credentials.", "Form Action Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table Columns configuration
  const columns = useMemo(() => [
    {
      id: "avatar",
      header: "Avatar",
      cell: (row: AdminResponseDto) => (
        <Avatar src={row.profileImage || ""} fallback={(row.firstName[0] + row.lastName[0]).toUpperCase()} size="sm" />
      ),
    },
    {
      id: "fullName",
      header: "Full Name",
      sortable: true,
      cell: (row: AdminResponseDto) => (
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
      cell: (row: AdminResponseDto) => (
        <span className="text-xs font-semibold text-muted-foreground">{row.email || "N/A"}</span>
      ),
    },
    {
      id: "role",
      header: "Role Clearance",
      cell: (row: AdminResponseDto) => (
        <Badge variant="danger" className="text-[10px] font-bold uppercase tracking-wider">
          {row.role?.name || "Super Admin"}
        </Badge>
      ),
    },
    {
      id: "isActive",
      header: "Status",
      sortable: true,
      cell: (row: AdminResponseDto) => (
        <StatusBadge status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "createdAt",
      header: "Registered Date",
      sortable: true,
      cell: (row: AdminResponseDto) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
  ], []);

  const filterChips = useMemo(() => {
    const chips = [];
    if (filters.status) {
      chips.push({
        key: "status",
        label: "Status",
        displayValue: filters.status === "active" ? "Active" : "Inactive",
      });
    }
    return chips;
  }, [filters]);

  return (
    <CrudPageTemplate
      title="Super Administrators"
      description="Manage top-tier system administrative operators and revoke credential keys."
      primaryAction={{
        label: "Create Admin",
        onClick: handleOpenCreate,
        icon: Plus,
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search admin name or email..."
      filters={
        <FilterDropdown
          label="Status"
          selected={filters.status as any}
          onChange={(val) => setFilter("status", val)}
          options={[
            { label: "Active Admins", value: "active" },
            { label: "Inactive Admins", value: "inactive" },
          ]}
        />
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
          <StatCard title="Total Super Admins" value={statsSummary.total} description="Total directory operators" icon={<UsersIcon className="h-5 w-5 text-primary" />} />
          <StatCard title="Active Operators" value={statsSummary.active} description="Currently active administrators" icon={<CheckCircle className="h-5 w-5 text-emerald-500" />} className="border-l-emerald-500/30" />
          <StatCard title="Inactive Keys" value={statsSummary.inactive} description="Suspended administrative logins" icon={<XCircle className="h-5 w-5 text-rose-500" />} className="border-l-rose-500/30" />
          <StatCard title="Security Level" value="Level 1" description="Maximum access authority" icon={<ShieldAlert className="h-5 w-5 text-blue-500" />} />
        </>
      }
    >
      <CrudTable
        columns={columns}
        data={data}
        idKey="id"
        isLoading={isLoading}
        error={errorState}
        emptyMessage="No administrators match your query."
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
        onRefresh={fetchAdmins}
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
                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Profile
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
          title={modalMode === "create" ? "Create Administrator credentials" : "Modify Administrator Profile"}
          description={modalMode === "create" ? "Add a new Super Administrator to the security directory." : "Modify access roles, email notifications, and school associations."}
          size="md"
          isSubmitting={isSubmitting}
          submitLabel={modalMode === "create" ? "Register Admin" : "Save Changes"}
        >
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">First Name</span>
                <Input
                  placeholder="John"
                  value={formFields.firstName}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, firstName: e.target.value }))}
                  error={formErrors.firstName}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">Last Name</span>
                <Input
                  placeholder="Doe"
                  value={formFields.lastName}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, lastName: e.target.value }))}
                  error={formErrors.lastName}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Email Address</span>
              <Input
                type="email"
                placeholder="admin@superstep.com"
                value={formFields.email}
                onChange={(e) => setFormFields((prev) => ({ ...prev, email: e.target.value }))}
                error={formErrors.email}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Phone Number</span>
              <Input
                placeholder="+1234567890"
                value={formFields.phone}
                onChange={(e) => setFormFields((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Institutional Association (Optional)</span>
              <select
                value={formFields.schoolId}
                onChange={(e) => setFormFields((prev) => ({ ...prev, schoolId: e.target.value }))}
                className="w-full h-10 px-3 text-xs font-semibold bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Global System Operator (No School restriction)</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Profile Image Link</span>
              <Input
                placeholder="https://cdn.com/avatar.jpg"
                value={formFields.profileImage}
                onChange={(e) => setFormFields((prev) => ({ ...prev, profileImage: e.target.value }))}
              />
            </div>
          </div>
        </FormModalWrapper>
      )}

      {/* DETAIL MODAL / PROFILE CARD */}
      {modalMode === "view" && selectedAdmin && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          size="md"
          title="Super Administrator Profile"
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
                  onClick={() => handleRevokeSessions(selectedAdmin.id)}
                  className="gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/5 cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {isRevoking ? "Revoking..." : "Revoke Sessions"}
                </Button>
                <Button size="sm" onClick={() => handleOpenEdit(selectedAdmin)} className="gap-1.5 ml-2">
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </PermissionGate>
            </div>
          }
        >
          <div className="space-y-6 py-1">
            <div className="flex items-center gap-4 border-b border-border/40 pb-4">
              <Avatar
                src={selectedAdmin.profileImage || ""}
                fallback={(selectedAdmin.firstName[0] + selectedAdmin.lastName[0]).toUpperCase()}
                size="lg"
                className="h-16 w-16 text-lg font-bold rounded-2xl"
              />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground leading-tight">
                  {selectedAdmin.firstName} {selectedAdmin.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="danger" className="text-[9px] font-extrabold uppercase tracking-wider">
                    Super Admin
                  </Badge>
                  <StatusBadge status={selectedAdmin.isActive ? "active" : "inactive"} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-muted-foreground">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Communication Keys</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span className="truncate">{selectedAdmin.email || "No Email listed"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>{selectedAdmin.phone || "No Phone listed"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Assigned Deployments</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <School className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>
                      {selectedAdmin.schoolId
                        ? schools.find((s) => s.id === selectedAdmin.schoolId)?.schoolName || "Institutional Partner"
                        : "Global System Operator"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>Registered on {new Date(selectedAdmin.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-2 text-[10px] font-bold text-muted-foreground/75">
              <div className="flex justify-between">
                <span>Account Unique Reference:</span>
                <span className="font-mono text-foreground">{selectedAdmin.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated Profile Settings:</span>
                <span className="text-foreground">{new Date(selectedAdmin.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      {adminToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setAdminToDelete(null)}
          onConfirm={handleConfirmDelete}
          itemName={`${adminToDelete.firstName} ${adminToDelete.lastName}`}
          isLoading={isDeleting}
        />
      )}
    </CrudPageTemplate>
  );
}
