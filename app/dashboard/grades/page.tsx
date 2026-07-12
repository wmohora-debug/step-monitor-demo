"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { gradeService } from "../../../src/features/grades/services/gradeService";
import { GradeResponseDto, CreateGradeDto, UpdateGradeDto } from "../../../src/core/types";
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
  CrudColumnDef,
} from "../../../src/components/framework";
import {
  Plus,
  GraduationCap,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useSelection, useDebounce, useFilters } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";

function GradesPageContent() {
  const { success, error: toastError, warning } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Table states
  const [data, setData] = useState<GradeResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Stats states
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { filters, setFilter, clearFilters } = useFilters({ status: null });

  // Sorting
  const [sortBy, setSortBy] = useState<string | null>("grade");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection
  const { selectedIds, toggleSelection, toggleAll, clearSelection } = useSelection<GradeResponseDto>("id");

  // 2. Form/Action Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<GradeResponseDto | null>(null);

  // Form Fields state
  const [formFields, setFormFields] = useState({
    grade: 1,
    description: "",
    status: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 3. Fetch data from backend
  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const response = await gradeService.findAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: (filters.status as "active" | "inactive") || undefined,
        sortBy: (sortBy as any) || undefined,
        sortOrder: sortOrder || undefined,
      });

      setData(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorState(err.message || "Failed to load academic grades registry.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, filters.status, sortBy, sortOrder]);

  // Fetch full stats using status-filtered query totals
  const fetchStatsData = useCallback(async () => {
    try {
      const [totalRes, activeRes, inactiveRes] = await Promise.all([
        gradeService.findAll({ page: 1, limit: 1 }),
        gradeService.findAll({ page: 1, limit: 1, status: "active" }),
        gradeService.findAll({ page: 1, limit: 1, status: "inactive" }),
      ]);
      setStats({
        total: totalRes.total || 0,
        active: activeRes.total || 0,
        inactive: inactiveRes.total || 0,
      });
    } catch (err) {
      console.error("Failed to compile grade statistics:", err);
    }
  }, []);

  // Initial and reactive loading hook
  useEffect(() => {
    fetchGrades();
    fetchStatsData();
  }, [fetchGrades, fetchStatsData]);

  // Command palette action / deep link integration hook
  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action === "create") {
      handleOpenCreate();
      router.replace("/dashboard/grades");
    } else if (action === "view" && id) {
      gradeService.findOne(id).then((grade) => {
        handleOpenView(grade);
        router.replace("/dashboard/grades");
      }).catch(() => {
        toastError("Grade details could not be retrieved.", "Registry Lookup Failed");
      });
    }
  }, [searchParams, router]);

  // 4. Action Handlers
  const handleOpenCreate = () => {
    setFormFields({
      grade: 1,
      description: "",
      status: true,
    });
    setFormErrors({});
    setModalMode("create");
  };

  const handleOpenEdit = (grade: GradeResponseDto) => {
    setSelectedGrade(grade);
    setFormFields({
      grade: grade.grade || 1,
      description: grade.description || "",
      status: grade.status ?? true,
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const handleOpenView = (grade: GradeResponseDto) => {
    setSelectedGrade(grade);
    setModalMode("view");
  };

  const handleOpenDelete = (grade: GradeResponseDto) => {
    setGradeToDelete(grade);
    setIsDeleting(true);
  };

  const handleConfirmDelete = async () => {
    if (!gradeToDelete) return;
    try {
      await gradeService.remove(gradeToDelete.id);
      success(`Grade level ${gradeToDelete.grade} deleted successfully.`, "Grade Removed");
      setIsDeleting(false);
      setGradeToDelete(null);
      fetchGrades();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to delete grade.", "Delete Failure");
    }
  };

  const handleToggleStatus = async (grade: GradeResponseDto) => {
    try {
      const targetState = !grade.status;
      await gradeService.changeStatus(grade.id, { status: targetState });
      success(
        `Grade level ${grade.grade} is now ${targetState ? "Active" : "Inactive"}.`,
        "Status Updated"
      );
      fetchGrades();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to update grade status.", "Status Error");
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => gradeService.remove(id)));
      success(`Successfully deleted ${selectedIds.size} grade levels.`, "Bulk Operations Complete");
      clearSelection();
      fetchGrades();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to execute bulk deletion.", "Bulk Operation Error");
    }
  };

  const handleBulkStatusChange = async (targetActive: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          gradeService.changeStatus(id, { status: targetActive })
        )
      );
      success(
        `Successfully updated ${selectedIds.size} grades to ${targetActive ? "Active" : "Inactive"}.`,
        "Bulk Status Update Complete"
      );
      clearSelection();
      fetchGrades();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to execute bulk status toggle.", "Bulk Operation Error");
    }
  };

  // Sorting columns
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // 5. Form Submissions
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (formFields.grade === undefined || formFields.grade === null || isNaN(formFields.grade)) {
      errors.grade = "Grade level value is required";
    } else if (formFields.grade < 0) {
      errors.grade = "Grade level cannot be a negative value";
    }
    if (!formFields.description.trim()) {
      errors.description = "Grade description is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: CreateGradeDto = {
          grade: Number(formFields.grade),
          description: formFields.description,
          status: formFields.status,
        };
        await gradeService.create(payload);
        success(`Grade level ${formFields.grade} created successfully.`, "Grade Created");
      } else if (modalMode === "edit" && selectedGrade) {
        const payload: UpdateGradeDto = {};
        if (Number(formFields.grade) !== selectedGrade.grade) payload.grade = Number(formFields.grade);
        if (formFields.description !== selectedGrade.description) payload.description = formFields.description;
        if (formFields.status !== selectedGrade.status) payload.status = formFields.status;

        if (Object.keys(payload).length === 0) {
          warning("No changes detected in grade configuration.", "No Updates Detected");
          setModalMode(null);
          return;
        }

        await gradeService.update(selectedGrade.id, payload);
        success(`Grade level ${formFields.grade} updated successfully.`, "Grade Updated");
      }

      setModalMode(null);
      fetchGrades();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Form submission failed.", "Submit Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Table Columns configuration
  const columns: CrudColumnDef<GradeResponseDto>[] = useMemo(
    () => [
      {
        id: "grade",
        header: "Grade Level",
        sortable: true,
        cell: (row: GradeResponseDto) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-xs leading-none">Grade {row.grade}</span>
              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
                ID: {row.id.substring(0, 8)}...
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "description",
        header: "Description Details",
        cell: (row: GradeResponseDto) => (
          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] font-semibold">
            {row.description || "—"}
          </p>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (row: GradeResponseDto) => (
          <StatusBadge status={row.status ? "active" : "inactive"} />
        ),
      },
      {
        id: "createdAt",
        header: "Created Date",
        sortable: true,
        cell: (row: GradeResponseDto) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {new Date(row.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
    ],
    []
  );

  // 7. Active filter chips
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
    <div className="space-y-6">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Academic Grades"
          value={stats.total}
          description="Consolidated academic class levels mapped"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Active Grades"
          value={stats.active}
          description="Enabled and open for student enrollments"
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="Inactive Grades"
          value={stats.inactive}
          description="Deactivated and archived grade settings"
          icon={<XCircle className="h-5 w-5 text-rose-500" />}
        />
      </div>

      {/* 2. Main CRUD Template Wrapper */}
      <CrudPageTemplate
        title="Grades Management"
        description="Structure and manage academic grade levels, student divisions, and classroom course filters."
        primaryAction={{
          label: "Create Grade Level",
          onClick: handleOpenCreate,
          icon: Plus,
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search grade description..."
        filters={
          <FilterDropdown
            label="Status"
            selected={filters.status as any}
            onChange={(val) => setFilter("status", val)}
            options={[
              { label: "Active Grades", value: "active" },
              { label: "Inactive Grades", value: "inactive" },
            ]}
          />
        }
        filterChips={
          <FilterChips
            chips={filterChips}
            onRemove={(key) => setFilter(key as any, null)}
            onClear={clearFilters}
          />
        }
      >
        <CrudTable<GradeResponseDto>
          idKey="id"
          data={data}
          columns={columns}
          page={page}
          pageSize={limit}
          totalPages={Math.ceil(total / limit)}
          onPageChange={setPage}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAll}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
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
              <PermissionGate permission="grades.update">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Grade
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2"
                >
                  {row.status ? <XCircle className="h-3.5 w-3.5 text-rose-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                  {row.status ? "Deactivate" : "Activate"}
                </Button>
              </PermissionGate>
              <PermissionGate permission="grades.delete">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDelete(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Grade
                </Button>
              </PermissionGate>
            </>
          )}
          bulkActions={[
            {
              label: "Activate Selected",
              onClick: () => handleBulkStatusChange(true),
            },
            {
              label: "Deactivate Selected",
              onClick: () => handleBulkStatusChange(false),
            },
            {
              label: "Delete Selected",
              onClick: handleBulkDelete,
              variant: "destructive",
            },
          ]}
        />
      </CrudPageTemplate>

      {/* 3. Create / Edit Form Modal */}
      <FormModalWrapper
        isOpen={modalMode === "create" || modalMode === "edit"}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Create Grade Level" : "Edit Grade Configuration"}
        description={
          modalMode === "create"
            ? "Create a new academic grade registry to class classrooms and student records."
            : "Update configuration settings for this grade level."
        }
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <Input
            id="grade-num"
            type="number"
            label="Grade Level (Numeric value)"
            value={formFields.grade}
            onChange={(e) => setFormFields((prev) => ({ ...prev, grade: parseInt(e.target.value) || 0 }))}
            placeholder="e.g. 5"
            error={formErrors.grade}
            disabled={isSubmitting}
            required
          />

          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Grade Description
            </label>
            <textarea
              id="grade-description"
              value={formFields.description}
              onChange={(e) => setFormFields((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Primary School Grade 5 students..."
              className="w-full text-xs font-semibold p-3 border border-border bg-card rounded-lg focus:outline-none focus:border-primary/50 text-foreground resize-none h-24"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              id="grade-status"
              type="checkbox"
              checked={formFields.status}
              onChange={(e) => setFormFields((prev) => ({ ...prev, status: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary bg-card focus:outline-none cursor-pointer"
              disabled={isSubmitting}
            />
            <label htmlFor="grade-status" className="text-xs font-bold text-foreground cursor-pointer select-none">
              Mark as Active (Available for Classroom/Course Mapping)
            </label>
          </div>
        </div>
      </FormModalWrapper>

      {/* 4. Details View Modal */}
      <Modal
        isOpen={modalMode === "view"}
        onClose={() => setModalMode(null)}
        title="Grade Configuration Details"
        size="sm"
        footer={
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalMode(null)} className="flex-1">
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedGrade) handleOpenEdit(selectedGrade);
              }}
              className="flex-1"
            >
              Edit Grade
            </Button>
          </div>
        }
      >
        {selectedGrade && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4.5 p-4.5 bg-secondary/30 border border-border/30 rounded-2xl">
              <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center border border-border/20 shadow-md">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-extrabold text-foreground truncate">
                  Grade Level {selectedGrade.grade}
                </h4>
                <p className="text-[10px] font-semibold text-muted-foreground font-mono mt-1">
                  ID: {selectedGrade.id}
                </p>
              </div>
              <StatusBadge status={selectedGrade.status ? "active" : "inactive"} />
            </div>

            <div className="space-y-3 px-1 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Description Details
                </span>
                <p className="text-foreground leading-normal font-semibold p-3 bg-card border border-border/40 rounded-xl">
                  {selectedGrade.description || "No description details provided for this grade level."}
                </p>
              </div>

              <div className="pt-2.5 border-t border-border/40 space-y-1.5 text-[10px] font-bold text-muted-foreground/80">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Initial Mapping Date:
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedGrade.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Last Modified:
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedGrade.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleting}
        onClose={() => {
          setIsDeleting(false);
          setGradeToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Grade Level Deletion"
        itemName={`Grade ${gradeToDelete?.grade || "this grade level"}`}
      />
    </div>
  );
}

export default function GradesPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <GradesPageContent />
    </React.Suspense>
  );
}
