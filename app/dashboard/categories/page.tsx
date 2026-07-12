"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { categoryService } from "../../../src/features/categories/services/categoryService";
import { CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto } from "../../../src/core/types";
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
  FolderTree,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Archive,
  Layers,
  Box,
  Settings,
  Calendar,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useSelection, useDebounce, useFilters } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";

// Helper to render dynamic icon based on saved icon slug
const getCategoryIcon = (iconSlug: string | null) => {
  switch (iconSlug?.toLowerCase()) {
    case "tag":
      return <Tag className="h-4 w-4" />;
    case "archive":
      return <Archive className="h-4 w-4" />;
    case "layers":
      return <Layers className="h-4 w-4" />;
    case "box":
      return <Box className="h-4 w-4" />;
    case "settings":
      return <Settings className="h-4 w-4" />;
    default:
      return <FolderTree className="h-4 w-4" />;
  }
};

function CategoriesPageContent() {
  const { success, error: toastError, warning } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Table states
  const [data, setData] = useState<CategoryResponseDto[]>([]);
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
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection
  const { selectedIds, toggleSelection, toggleAll, clearSelection } = useSelection<CategoryResponseDto>("id");

  // 2. Form/Action Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryResponseDto | null>(null);

  // Form Fields state
  const [formFields, setFormFields] = useState({
    name: "",
    description: "",
    icon: "folder",
    displayOrder: 1,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 3. Fetch data from backend
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const response = await categoryService.findAll({
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
      setErrorState(err.message || "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, filters.status, sortBy, sortOrder]);

  // Fetch full stats using status-filtered query totals
  const fetchStatsData = useCallback(async () => {
    try {
      const [totalRes, activeRes, inactiveRes] = await Promise.all([
        categoryService.findAll({ page: 1, limit: 1 }),
        categoryService.findAll({ page: 1, limit: 1, status: "active" }),
        categoryService.findAll({ page: 1, limit: 1, status: "inactive" }),
      ]);
      setStats({
        total: totalRes.total || 0,
        active: activeRes.total || 0,
        inactive: inactiveRes.total || 0,
      });
    } catch (err) {
      console.error("Failed to compile category statistics:", err);
    }
  }, []);

  // Initial and reactive loading hook
  useEffect(() => {
    fetchCategories();
    fetchStatsData();
  }, [fetchCategories, fetchStatsData]);

  // Command palette action / deep link integration hook
  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action === "create") {
      handleOpenCreate();
      router.replace("/dashboard/categories");
    } else if (action === "view" && id) {
      categoryService.findOne(id).then((cat) => {
        handleOpenView(cat);
        router.replace("/dashboard/categories");
      }).catch(() => {
        toastError("Category details could not be retrieved.", "Registry Lookup Failed");
      });
    }
  }, [searchParams, router]);

  // 4. Action Handlers
  const handleOpenCreate = () => {
    setFormFields({
      name: "",
      description: "",
      icon: "folder",
      displayOrder: 1,
    });
    setFormErrors({});
    setModalMode("create");
  };

  const handleOpenEdit = (category: CategoryResponseDto) => {
    setSelectedCategory(category);
    setFormFields({
      name: category.name || "",
      description: category.description || "",
      icon: category.icon || "folder",
      displayOrder: category.displayOrder || 1,
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const handleOpenView = (category: CategoryResponseDto) => {
    setSelectedCategory(category);
    setModalMode("view");
  };

  const handleOpenDelete = (category: CategoryResponseDto) => {
    setCategoryToDelete(category);
    setIsDeleting(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryService.remove(categoryToDelete.id);
      success(`Category "${categoryToDelete.name}" deleted successfully.`, "Category Removed");
      setIsDeleting(false);
      setCategoryToDelete(null);
      fetchCategories();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to delete category.", "Delete Failure");
    }
  };

  const handleToggleStatus = async (category: CategoryResponseDto) => {
    try {
      const targetState = !category.isActive;
      await categoryService.changeStatus(category.id, { isActive: targetState });
      success(
        `Category "${category.name}" is now ${targetState ? "Active" : "Inactive"}.`,
        "Status Updated"
      );
      fetchCategories();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to update category status.", "Status Error");
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => categoryService.remove(id)));
      success(`Successfully deleted ${selectedIds.size} categories.`, "Bulk Operations Complete");
      clearSelection();
      fetchCategories();
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
          categoryService.changeStatus(id, { isActive: targetActive })
        )
      );
      success(
        `Successfully updated ${selectedIds.size} categories to ${targetActive ? "Active" : "Inactive"}.`,
        "Bulk Status Update Complete"
      );
      clearSelection();
      fetchCategories();
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
    if (!formFields.name.trim()) errors.name = "Category name is required";
    if (formFields.displayOrder < 1) errors.displayOrder = "Display order must be 1 or higher";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: CreateCategoryDto = {
          name: formFields.name,
          description: formFields.description || null,
          icon: formFields.icon || null,
          displayOrder: formFields.displayOrder,
        };
        await categoryService.create(payload);
        success(`Category "${formFields.name}" created successfully.`, "Category Created");
      } else if (modalMode === "edit" && selectedCategory) {
        const payload: UpdateCategoryDto = {};
        if (formFields.name !== selectedCategory.name) payload.name = formFields.name;
        if (formFields.description !== (selectedCategory.description || "")) {
          payload.description = formFields.description || null;
        }
        if (formFields.icon !== (selectedCategory.icon || "folder")) {
          payload.icon = formFields.icon || null;
        }
        if (formFields.displayOrder !== selectedCategory.displayOrder) {
          payload.displayOrder = formFields.displayOrder;
        }

        if (Object.keys(payload).length === 0) {
          warning("No changes detected in category configuration.", "No Updates Detected");
          setModalMode(null);
          return;
        }

        await categoryService.update(selectedCategory.id, payload);
        success(`Category "${formFields.name}" updated successfully.`, "Category Updated");
      }

      setModalMode(null);
      fetchCategories();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Form submission failed.", "Submit Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Table Columns configuration
  const columns: CrudColumnDef<CategoryResponseDto>[] = useMemo(
    () => [
      {
        id: "icon",
        header: "Icon",
        cell: (row: CategoryResponseDto) => (
          <div className="h-8 w-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center border border-border/40 shrink-0">
            {getCategoryIcon(row.icon)}
          </div>
        ),
      },
      {
        id: "name",
        header: "Category Name",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-xs leading-none">{row.name}</span>
            <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
              ID: {row.id.substring(0, 8)}...
            </span>
          </div>
        ),
      },
      {
        id: "slug",
        header: "Slug URL",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <span className="text-xs font-semibold text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded border border-border/20">
            {row.slug}
          </span>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: (row: CategoryResponseDto) => (
          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] font-semibold">
            {row.description || "—"}
          </p>
        ),
      },
      {
        id: "displayOrder",
        header: "Order Weight",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <span className="text-xs font-bold text-muted-foreground">{row.displayOrder}</span>
        ),
      },
      {
        id: "isActive",
        header: "Status",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
          <StatusBadge status={row.isActive ? "active" : "inactive"} />
        ),
      },
      {
        id: "createdAt",
        header: "Created Date",
        sortable: true,
        cell: (row: CategoryResponseDto) => (
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
          title="Total Registered Categories"
          value={stats.total}
          description="Consolidated category directories mapped"
          icon={<FolderTree className="h-5 w-5" />}
        />
        <StatCard
          title="Active Categories"
          value={stats.active}
          description="Enabled and indexable in inventory module"
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="Inactive Categories"
          value={stats.inactive}
          description="Deactivated categories currently archived"
          icon={<XCircle className="h-5 w-5 text-rose-500" />}
        />
      </div>

      {/* 2. Main CRUD Template Wrapper */}
      <CrudPageTemplate
        title="Item Categories"
        description="Organize and structure inventory collections, school properties, and equipment classifications."
        primaryAction={{
          label: "Create Category",
          onClick: handleOpenCreate,
          icon: Plus,
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search category name or slug..."
        filters={
          <FilterDropdown
            label="Status"
            selected={filters.status as any}
            onChange={(val) => setFilter("status", val)}
            options={[
              { label: "Active Categories", value: "active" },
              { label: "Inactive Categories", value: "inactive" },
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
        <CrudTable<CategoryResponseDto>
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
              <PermissionGate permission="categories.update">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Category
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
              <PermissionGate permission="categories.delete">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDelete(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Category
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
        title={modalMode === "create" ? "Register Category" : "Edit Category Configuration"}
        description={
          modalMode === "create"
            ? "Create a new catalog category to class inventory items."
            : "Update configuration settings for this category directory."
        }
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <Input
            id="cat-name"
            label="Category Name"
            value={formFields.name}
            onChange={(e) => setFormFields((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Laboratory Equipment"
            error={formErrors.name}
            disabled={isSubmitting}
            required
          />

          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Description
            </label>
            <textarea
              id="cat-description"
              value={formFields.description}
              onChange={(e) => setFormFields((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a description matching inventory items cataloged here..."
              className="w-full text-xs font-semibold p-3 border border-border bg-card rounded-lg focus:outline-none focus:border-primary/50 text-foreground resize-none h-20"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Category Icon Slug
              </label>
              <select
                id="cat-icon"
                value={formFields.icon}
                onChange={(e) => setFormFields((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full text-xs font-semibold p-2.5 border border-border bg-card rounded-lg focus:outline-none focus:border-primary/50 text-foreground"
                disabled={isSubmitting}
              >
                <option value="folder">Folder</option>
                <option value="tag">Tag</option>
                <option value="archive">Archive</option>
                <option value="layers">Layers</option>
                <option value="box">Box</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            <Input
              id="cat-display-order"
              type="number"
              label="Display Order weight"
              value={formFields.displayOrder}
              onChange={(e) =>
                setFormFields((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))
              }
              error={formErrors.displayOrder}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>
      </FormModalWrapper>

      {/* 4. Details View Modal */}
      <Modal
        isOpen={modalMode === "view"}
        onClose={() => setModalMode(null)}
        title="Category Directory Card"
        size="sm"
        footer={
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalMode(null)} className="flex-1">
              Close Card
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedCategory) handleOpenEdit(selectedCategory);
              }}
              className="flex-1"
            >
              Edit Category
            </Button>
          </div>
        }
      >
        {selectedCategory && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4.5 p-4.5 bg-secondary/30 border border-border/30 rounded-2xl">
              <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center border border-border/20 shadow-md">
                {getCategoryIcon(selectedCategory.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-extrabold text-foreground truncate">
                  {selectedCategory.name}
                </h4>
                <p className="text-[10px] font-semibold text-muted-foreground font-mono mt-1">
                  Slug: {selectedCategory.slug}
                </p>
              </div>
              <StatusBadge status={selectedCategory.isActive ? "active" : "inactive"} />
            </div>

            <div className="space-y-3 px-1 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Description Details
                </span>
                <p className="text-foreground leading-normal font-semibold p-3 bg-card border border-border/40 rounded-xl">
                  {selectedCategory.description || "No description provided for this category."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-card border border-border/30 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Display Order weight
                  </span>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">
                    {selectedCategory.displayOrder}
                  </p>
                </div>
                <div className="space-y-1 bg-card border border-border/30 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Status Mapping
                  </span>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {selectedCategory.isActive ? "Active Index" : "Inactive / Archived"}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-border/40 space-y-1.5 text-[10px] font-bold text-muted-foreground/80">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Initial Mapping Date:
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedCategory.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Last Modified:
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedCategory.updatedAt).toLocaleString()}
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
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Category Deletion"
        itemName={categoryToDelete?.name || "this category"}
      />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <CategoriesPageContent />
    </React.Suspense>
  );
}
