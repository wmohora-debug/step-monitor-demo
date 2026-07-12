"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import { SchoolResponseDto, CreateSchoolDto, UpdateSchoolDto } from "../../../src/core/types";
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
  Textarea,
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
  School as SchoolIcon,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  QrCode,
  Download,
  CheckCircle,
  XCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useSelection, useDebounce, useFilters } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";

export default function SchoolsPage() {
  const { success, error: toastError, warning } = useToast();

  // 1. Table states
  const [data, setData] = useState<SchoolResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { filters, setFilter, clearFilters } = useFilters({ status: null });

  // Sorting
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection
  const { selectedIds, toggleSelection, toggleAll, clearSelection } = useSelection<SchoolResponseDto>("id");

  // 2. Form/Action Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolResponseDto | null>(null);

  // Form Fields state
  const [formFields, setFormFields] = useState({
    schoolId: "",
    schoolName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    website: "",
    logo: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 3. Fetch data from backend
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const response = await schoolService.findAll({
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
      setErrorState(err.message || "Unable to retrieve schools directory.");
      toastError(err.message || "Failed to load schools.", "API Error");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, filters.status, sortBy, sortOrder, toastError]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Reset pagination when search/filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status]);

  // 4. Statistics values calculated from active table
  const statsSummary = useMemo(() => {
    const activeCount = data.filter((s) => s.isActive).length;
    const inactiveCount = data.filter((s) => !s.isActive).length;
    return {
      total: total,
      active: activeCount,
      inactive: inactiveCount,
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
      schoolId: "",
      schoolName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      website: "",
      logo: "",
    });
    setFormErrors({});
    setModalMode("create");
  };

  const handleOpenEdit = (school: SchoolResponseDto) => {
    setSelectedSchool(school);
    setFormFields({
      schoolId: school.schoolId || "",
      schoolName: school.schoolName,
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      country: school.country || "India",
      postalCode: school.postalCode || "",
      website: school.website || "",
      logo: school.logo || "",
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const handleOpenView = (school: SchoolResponseDto) => {
    setSelectedSchool(school);
    setModalMode("view");
  };

  const handleOpenDelete = (school: SchoolResponseDto) => {
    setSchoolToDelete(school);
  };

  const handleToggleStatus = async (school: SchoolResponseDto) => {
    try {
      const nextActive = !school.isActive;
      await schoolService.changeStatus(school.id, { isActive: nextActive });
      success(`School "${school.schoolName}" is now ${nextActive ? "Active" : "Inactive"}.`, "Status Updated");
      fetchSchools();
    } catch (err: any) {
      toastError(err.message || "Failed to update school status.", "Status Change Error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    setIsDeleting(true);
    try {
      await schoolService.remove(schoolToDelete.id);
      success(`School "${schoolToDelete.schoolName}" removed from registries.`, "Registry Deleted");
      setSchoolToDelete(null);
      clearSelection();
      fetchSchools();
    } catch (err: any) {
      toastError(err.message || "Failed to remove school.", "Deletion Error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    warning(`Initiating bulk delete request for ${ids.length} records. Please confirm action.`, "Bulk Action");
    setIsLoading(true);
    try {
      // Execute deletions sequentially
      for (const id of ids) {
        await schoolService.remove(id);
      }
      success(`Successfully deleted ${ids.length} schools.`, "Bulk Operations Complete");
      clearSelection();
      fetchSchools();
    } catch (err: any) {
      toastError(err.message || "Failed to complete bulk operations.", "Bulk Error");
      fetchSchools();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkToggleStatus = async (ids: string[]) => {
    setIsLoading(true);
    try {
      for (const id of ids) {
        const item = data.find((s) => s.id === id);
        if (item) {
          await schoolService.changeStatus(id, { isActive: !item.isActive });
        }
      }
      success(`Toggled active status for ${ids.length} schools.`, "Bulk Status Complete");
      clearSelection();
      fetchSchools();
    } catch (err: any) {
      toastError(err.message || "Failed to complete status toggling.", "Bulk Error");
      fetchSchools();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!formFields.schoolName.trim()) {
      errors.schoolName = "School name is required.";
    }
    if (formFields.schoolId && !/^[A-Z0-9]{8}$/.test(formFields.schoolId)) {
      errors.schoolId = "School ID must be exactly 8 uppercase alphanumeric characters.";
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
        const payload: CreateSchoolDto = {
          schoolName: formFields.schoolName,
          schoolId: formFields.schoolId || undefined,
          email: formFields.email || null,
          phone: formFields.phone || null,
          address: formFields.address || null,
          city: formFields.city || null,
          state: formFields.state || null,
          country: formFields.country || null,
          postalCode: formFields.postalCode || null,
          website: formFields.website || null,
          logo: formFields.logo || null,
        };
        await schoolService.create(payload);
        success(`School "${formFields.schoolName}" registered successfully.`, "School Registered");
      } else if (modalMode === "edit" && selectedSchool) {
        const payload: UpdateSchoolDto = {
          schoolName: formFields.schoolName,
          schoolId: formFields.schoolId || undefined,
          email: formFields.email || null,
          phone: formFields.phone || null,
          address: formFields.address || null,
          city: formFields.city || null,
          state: formFields.state || null,
          country: formFields.country || null,
          postalCode: formFields.postalCode || null,
          website: formFields.website || null,
          logo: formFields.logo || null,
        };
        await schoolService.update(selectedSchool.id, payload);
        success(`School profile "${formFields.schoolName}" updated successfully.`, "Profile Synchronized");
      }

      setModalMode(null);
      fetchSchools();
    } catch (err: any) {
      toastError(err.message || "Form submission failed.", "Submit Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQr = (school: SchoolResponseDto) => {
    if (!school.qrCode) return;
    const link = document.createElement("a");
    link.href = school.qrCode;
    link.download = `QR_School_${school.schoolId || school.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`QR Code download initiated for school: ${school.schoolName}.`, "Download Started");
  };

  // 6. Table Columns configuration
  const columns = useMemo(() => [
    {
      id: "logo",
      header: "Logo",
      cell: (row: SchoolResponseDto) => (
        <Avatar src={row.logo || ""} fallback={row.schoolName.substring(0, 2).toUpperCase()} size="sm" />
      ),
    },
    {
      id: "schoolName",
      header: "School Name",
      sortable: true,
      cell: (row: SchoolResponseDto) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs leading-none">{row.schoolName}</span>
          {row.website && (
            <a
              href={row.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground hover:text-primary hover:underline mt-1 inline-flex items-center gap-0.5"
            >
              Website <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      ),
    },
    {
      id: "schoolId",
      header: "School ID",
      sortable: true,
      cell: (row: SchoolResponseDto) => (
        <code className="text-xs px-2 py-0.5 bg-muted rounded font-bold text-foreground">
          {row.schoolId || "N/A"}
        </code>
      ),
    },
    {
      id: "email",
      header: "Contact Email",
      sortable: true,
      cell: (row: SchoolResponseDto) => (
        <span className="text-xs font-semibold text-muted-foreground">{row.email || "N/A"}</span>
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
    return chips;
  }, [filters]);

  return (
    <CrudPageTemplate
      title="Schools Registry"
      description="Manage educational partner institutions, system deployment codes, and generated login QR cards."
      primaryAction={{
        label: "Register School",
        onClick: handleOpenCreate,
        icon: Plus,
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by school name, ID or email..."
      filters={
        <FilterDropdown
          label="Status"
          selected={filters.status as any}
          onChange={(val) => setFilter("status", val)}
          options={[
            { label: "Active Only", value: "active" },
            { label: "Inactive Only", value: "inactive" },
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
          <StatCard title="Registered Schools" value={statsSummary.total} description="Total directory registry count" icon={<SchoolIcon className="h-5 w-5 text-primary" />} />
          <StatCard title="Active Centers" value={statsSummary.active} description="Currently operational deployments" icon={<CheckCircle className="h-5 w-5 text-emerald-500" />} className="border-l-emerald-500/30" />
          <StatCard title="Pending Review" value={statsSummary.inactive} description="Deactivated or review pending profiles" icon={<XCircle className="h-5 w-5 text-rose-500" />} className="border-l-rose-500/30" />
          <StatCard title="Registry Status" value="Nominal" description="All systems healthy" icon={<RefreshCw className="h-5 w-5 text-blue-500" />} />
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
        emptyMessage="No schools match the registry query parameter guidelines."
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
        onRefresh={fetchSchools}
        rowActions={(row) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenView(row)}
              className="w-full justify-start gap-2 text-xs font-semibold px-2"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Details
            </Button>
            <PermissionGate permission="schools.update">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2"
              >
                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit School
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
            <PermissionGate permission="schools.delete">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDelete(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete School
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
          title={modalMode === "create" ? "Register New School" : "Modify School Profile"}
          description={modalMode === "create" ? "Add a new institutional profile to generate QR credentials." : "Modify registration and website coordinates."}
          size="lg"
          isSubmitting={isSubmitting}
          submitLabel={modalMode === "create" ? "Add to Registry" : "Save Changes"}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">School Name <strong className="text-destructive">*</strong></span>
              <Input
                placeholder="E.g. St. Xavier International"
                value={formFields.schoolName}
                onChange={(e) => setFormFields((prev) => ({ ...prev, schoolName: e.target.value }))}
                error={formErrors.schoolName}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">School ID (8-char uppercase alphanumeric)</span>
              <Input
                placeholder="E.g. STXAV123"
                value={formFields.schoolId}
                onChange={(e) => setFormFields((prev) => ({ ...prev, schoolId: e.target.value.toUpperCase() }))}
                error={formErrors.schoolId}
                maxLength={8}
                disabled={modalMode === "edit"} // Immutable on edit
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Contact Email</span>
              <Input
                type="email"
                placeholder="E.g. contact@school.edu"
                value={formFields.email}
                onChange={(e) => setFormFields((prev) => ({ ...prev, email: e.target.value }))}
                error={formErrors.email}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Contact Phone</span>
              <Input
                placeholder="E.g. +91 98765 43210"
                value={formFields.phone}
                onChange={(e) => setFormFields((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Website URL</span>
              <Input
                placeholder="E.g. https://school.edu"
                value={formFields.website}
                onChange={(e) => setFormFields((prev) => ({ ...prev, website: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Logo URL</span>
              <Input
                placeholder="E.g. https://cdn.com/logo.png"
                value={formFields.logo}
                onChange={(e) => setFormFields((prev) => ({ ...prev, logo: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <span className="text-xs font-bold text-foreground">Street Address</span>
              <Textarea
                placeholder="E.g. 12, Park Street Road"
                value={formFields.address}
                onChange={(e) => setFormFields((prev) => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">City</span>
              <Input
                placeholder="E.g. Kolkata"
                value={formFields.city}
                onChange={(e) => setFormFields((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">State</span>
              <Input
                placeholder="E.g. West Bengal"
                value={formFields.state}
                onChange={(e) => setFormFields((prev) => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Postal Code</span>
              <Input
                placeholder="E.g. 700016"
                value={formFields.postalCode}
                onChange={(e) => setFormFields((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Country</span>
              <Input
                placeholder="E.g. India"
                value={formFields.country}
                onChange={(e) => setFormFields((prev) => ({ ...prev, country: e.target.value }))}
              />
            </div>
          </div>
        </FormModalWrapper>
      )}

      {/* DETAIL MODAL / DRAWER */}
      {modalMode === "view" && selectedSchool && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          size="md"
          title="School Deployment Specifications"
          footer={
            <div className="flex w-full justify-between items-center gap-2">
              {selectedSchool.qrCode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadQr(selectedSchool)}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Download className="h-4 w-4" /> Download QR
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalMode(null)}>
                  Close
                </Button>
                <PermissionGate permission="schools.update">
                  <Button size="sm" onClick={() => handleOpenEdit(selectedSchool)} className="gap-1.5">
                    <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                </PermissionGate>
              </div>
            </div>
          }
        >
          <div className="space-y-6 py-1">
            {/* Header info */}
            <div className="flex items-center gap-4 border-b border-border/40 pb-4">
              <Avatar
                src={selectedSchool.logo || ""}
                fallback={selectedSchool.schoolName.substring(0, 2).toUpperCase()}
                size="lg"
                className="h-16 w-16 text-lg font-bold rounded-2xl"
              />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground leading-tight">{selectedSchool.schoolName}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-bold">{selectedSchool.schoolId}</code>
                  <StatusBadge status={selectedSchool.isActive ? "active" : "inactive"} />
                </div>
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-muted-foreground">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Coordinates</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span className="truncate">{selectedSchool.email || "No Email listed"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>{selectedSchool.phone || "No Phone listed"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    {selectedSchool.website ? (
                      <a
                        href={selectedSchool.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {selectedSchool.website}
                      </a>
                    ) : (
                      <span>No Website listed</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Postal Coordinates</h4>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-snug">
                    <p className="text-foreground">{selectedSchool.address || "No address details"}</p>
                    {(selectedSchool.city || selectedSchool.state) && (
                      <p>
                        {selectedSchool.city}
                        {selectedSchool.city && selectedSchool.state ? ", " : ""}
                        {selectedSchool.state}
                      </p>
                    )}
                    {(selectedSchool.postalCode || selectedSchool.country) && (
                      <p>
                        {selectedSchool.postalCode} {selectedSchool.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            {selectedSchool.qrCode && (
              <div className="flex flex-col items-center justify-center p-5 bg-muted/20 border border-border/40 rounded-2xl gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <QrCode className="h-4 w-4 text-primary animate-pulse" />
                  <span>Deployment QR Code Identification Card</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedSchool.qrCode}
                  alt={`QR code for ${selectedSchool.schoolName}`}
                  className="h-40 w-40 border border-border bg-white rounded-xl p-1.5 shadow-inner transition-transform hover:scale-105"
                />
                <span className="text-[9px] text-muted-foreground font-semibold">
                  Last generated on {selectedSchool.qrGeneratedAt ? new Date(selectedSchool.qrGeneratedAt).toLocaleString() : "Initialization"}
                </span>
              </div>
            )}

            {/* Audit log dates */}
            <div className="border-t border-border/40 pt-4 flex justify-between text-[10px] font-bold text-muted-foreground/75">
              <span>Created: {new Date(selectedSchool.createdAt).toLocaleString()}</span>
              <span>Updated: {new Date(selectedSchool.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      {schoolToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setSchoolToDelete(null)}
          onConfirm={handleConfirmDelete}
          itemName={schoolToDelete.schoolName}
          isLoading={isDeleting}
        />
      )}
    </CrudPageTemplate>
  );
}
