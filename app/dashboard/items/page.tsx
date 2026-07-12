"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { itemService } from "../../../src/features/items/services/itemService";
import { categoryService } from "../../../src/features/categories/services/categoryService";
import { ItemResponseDto, CategoryResponseDto, CreateItemDto, UpdateItemDto } from "../../../src/core/types";
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
  Package,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  QrCode,
  Tag,
  Download,
  Info,
  Calendar,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useSelection, useDebounce, useFilters } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";

function ItemsPageContent() {
  const { success, error: toastError, warning } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Table states
  const [data, setData] = useState<ItemResponseDto[]>([]);
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
    consumables: 0,
  });

  // preloaded categories for selectors/filters
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { filters, setFilter, clearFilters } = useFilters({ status: null, categoryId: null });

  // Sorting
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection
  const { selectedIds, toggleSelection, toggleAll, clearSelection } = useSelection<ItemResponseDto>("id");

  // 2. Form/Action Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemResponseDto | null>(null);

  // Form Fields state
  const [formFields, setFormFields] = useState({
    name: "",
    categoryId: "",
    sku: "",
    description: "",
    manufacturer: "",
    modelNumber: "",
    unit: "",
    isConsumable: false,
    image: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 3. Fetch data from backend
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const response = await itemService.findAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: (filters.status as "active" | "inactive") || undefined,
        categoryId: (filters.categoryId as string) || undefined,
        sortBy: (sortBy as any) || undefined,
        sortOrder: sortOrder || undefined,
      });

      setData(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorState(err.message || "Failed to load inventory items.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, filters.status, filters.categoryId, sortBy, sortOrder]);

  // Fetch full stats using status-filtered query totals
  const fetchStatsData = useCallback(async () => {
    try {
      const [totalRes, activeRes, inactiveRes] = await Promise.all([
        itemService.findAll({ page: 1, limit: 1 }),
        itemService.findAll({ page: 1, limit: 1, status: "active" }),
        itemService.findAll({ page: 1, limit: 1, status: "inactive" }),
      ]);

      // Calculate consumables from loaded page or mock logic (since backend doesn't filter consumable directly in dto queries)
      // We can fetch a quick list or display a percentage calculation
      const consumableRes = await itemService.findAll({ page: 1, limit: 100 });
      const consumablesCount = (consumableRes.items || []).filter(item => item.isConsumable).length;

      setStats({
        total: totalRes.total || 0,
        active: activeRes.total || 0,
        inactive: inactiveRes.total || 0,
        consumables: consumablesCount,
      });
    } catch (err) {
      console.error("Failed to compile item statistics:", err);
    }
  }, []);

  // Preload categories list
  const fetchCategoriesList = useCallback(async () => {
    try {
      const response = await categoryService.findAll({ page: 1, limit: 100 });
      setCategories(response.items || []);
    } catch (err) {
      console.error("Failed to load categories list:", err);
    }
  }, []);

  // Initial and reactive loading hook
  useEffect(() => {
    fetchItems();
    fetchStatsData();
    fetchCategoriesList();
  }, [fetchItems, fetchStatsData, fetchCategoriesList]);

  // Command palette action / deep link integration hook
  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action === "create") {
      handleOpenCreate();
      router.replace("/dashboard/items");
    } else if (action === "view" && id) {
      itemService.findOne(id).then((item) => {
        handleOpenView(item);
        router.replace("/dashboard/items");
      }).catch(() => {
        toastError("Item details could not be retrieved.", "Registry Lookup Failed");
      });
    }
  }, [searchParams, router]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.categoryId]);

  // 4. Action Handlers
  const handleOpenCreate = () => {
    setFormFields({
      name: "",
      categoryId: "",
      sku: "",
      description: "",
      manufacturer: "",
      modelNumber: "",
      unit: "",
      isConsumable: false,
      image: "",
    });
    setFormErrors({});
    setModalMode("create");
  };

  const handleOpenEdit = (item: ItemResponseDto) => {
    setSelectedItem(item);
    setFormFields({
      name: item.name || "",
      categoryId: item.category?.id || "",
      sku: item.sku || "",
      description: item.description || "",
      manufacturer: item.manufacturer || "",
      modelNumber: item.modelNumber || "",
      unit: item.unit || "",
      isConsumable: !!item.isConsumable,
      image: item.image || "",
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const handleOpenView = (item: ItemResponseDto) => {
    setSelectedItem(item);
    setModalMode("view");
  };

  const handleOpenDelete = (item: ItemResponseDto) => {
    setItemToDelete(item);
    setIsDeleting(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await itemService.remove(itemToDelete.id);
      success(`Item "${itemToDelete.name}" deleted successfully.`, "Item Removed");
      setIsDeleting(false);
      setItemToDelete(null);
      fetchItems();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to delete item.", "Delete Failure");
    }
  };

  const handleToggleStatus = async (item: ItemResponseDto) => {
    try {
      const targetState = !item.isActive;
      await itemService.changeStatus(item.id, { isActive: targetState });
      success(
        `Item "${item.name}" status updated to ${targetState ? "Active" : "Inactive"}.`,
        "Status Synchronized"
      );
      fetchItems();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to update item status.", "Status Error");
    }
  };

  const handleDownloadQr = async () => {
    if (!selectedItem) return;
    try {
      const blob = await itemService.getQrBlob(selectedItem.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode-${selectedItem.slug}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (selectedItem.qrCode) {
        const link = document.createElement("a");
        link.href = selectedItem.qrCode;
        link.download = `qrcode-${selectedItem.slug}.png`;
        link.click();
      }
    }
  };

  const handleRegenerateQr = async () => {
    if (!selectedItem) return;
    setIsRegeneratingQr(true);
    try {
      const updated = await itemService.regenerateQr(selectedItem.id);
      setSelectedItem(updated);
      setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      success("Item QR Code successfully regenerated.", "QR Synchronized");
    } catch (err: any) {
      toastError(err.message || "Failed to regenerate QR code.", "Action Failed");
    } finally {
      setIsRegeneratingQr(false);
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsLoading(true);
      await Promise.all(Array.from(selectedIds).map((id) => itemService.remove(id)));
      success(`Successfully deleted ${selectedIds.size} items.`, "Bulk Operations Complete");
      clearSelection();
      fetchItems();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to execute bulk deletion.", "Bulk Operation Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusChange = async (targetActive: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      setIsLoading(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          itemService.changeStatus(id, { isActive: targetActive })
        )
      );
      success(
        `Successfully updated ${selectedIds.size} items to ${targetActive ? "Active" : "Inactive"}.`,
        "Bulk Status Update Complete"
      );
      clearSelection();
      fetchItems();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to execute bulk status toggle.", "Bulk Operation Error");
    } finally {
      setIsLoading(false);
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
    if (!formFields.name.trim()) errors.name = "Item name is required.";
    if (!formFields.categoryId) errors.categoryId = "Category selection is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: CreateItemDto = {
          name: formFields.name,
          categoryId: formFields.categoryId,
          sku: formFields.sku || null,
          description: formFields.description || null,
          manufacturer: formFields.manufacturer || null,
          modelNumber: formFields.modelNumber || null,
          unit: formFields.unit || null,
          isConsumable: formFields.isConsumable,
          image: formFields.image || null,
        };
        await itemService.create(payload);
        success(`Item "${formFields.name}" created successfully.`, "Item Created");
      } else if (modalMode === "edit" && selectedItem) {
        // Detect unchanged fields & only submit modified values
        const payload: UpdateItemDto = {};
        if (formFields.name !== selectedItem.name) payload.name = formFields.name;
        if (formFields.categoryId !== (selectedItem.category?.id || "")) payload.categoryId = formFields.categoryId;
        if (formFields.sku !== (selectedItem.sku || "")) payload.sku = formFields.sku || null;
        if (formFields.description !== (selectedItem.description || "")) payload.description = formFields.description || null;
        if (formFields.manufacturer !== (selectedItem.manufacturer || "")) payload.manufacturer = formFields.manufacturer || null;
        if (formFields.modelNumber !== (selectedItem.modelNumber || "")) payload.modelNumber = formFields.modelNumber || null;
        if (formFields.unit !== (selectedItem.unit || "")) payload.unit = formFields.unit || null;
        if (formFields.isConsumable !== !!selectedItem.isConsumable) payload.isConsumable = formFields.isConsumable;
        if (formFields.image !== (selectedItem.image || "")) payload.image = formFields.image || null;

        if (Object.keys(payload).length === 0) {
          warning("No changes detected in item configuration.", "No Updates Detected");
          setModalMode(null);
          return;
        }

        await itemService.update(selectedItem.id, payload);
        success(`Item "${formFields.name}" updated successfully.`, "Item Updated");
      }

      setModalMode(null);
      fetchItems();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Form submission failed.", "Submit Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Table Columns configuration
  const columns: CrudColumnDef<ItemResponseDto>[] = useMemo(
    () => [
      {
        id: "image",
        header: "Preview",
        cell: (row: ItemResponseDto) => (
          <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center border border-border/40 shrink-0 overflow-hidden">
            {row.image ? (
              <img src={row.image} alt={row.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground/60" />
            )}
          </div>
        ),
      },
      {
        id: "name",
        header: "Item Name",
        sortable: true,
        cell: (row: ItemResponseDto) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-xs leading-none">{row.name}</span>
            <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
              ID: {row.id.substring(0, 8)}...
            </span>
          </div>
        ),
      },
      {
        id: "sku",
        header: "SKU / Code",
        sortable: true,
        cell: (row: ItemResponseDto) => (
          <span className="text-xs font-semibold text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded border border-border/20">
            {row.sku || "—"}
          </span>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: (row: ItemResponseDto) => (
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-primary/70" />
            {row.category?.name || "Uncategorized"}
          </span>
        ),
      },
      {
        id: "isConsumable",
        header: "Type",
        cell: (row: ItemResponseDto) => (
          <Badge variant={row.isConsumable ? "secondary" : "outline"} className="text-[10px] font-bold py-0.5 px-2">
            {row.isConsumable ? "Consumable" : "Non-Consumable"}
          </Badge>
        ),
      },
      {
        id: "isActive",
        header: "Status",
        sortable: true,
        cell: (row: ItemResponseDto) => (
          <StatusBadge status={row.isActive ? "active" : "inactive"} />
        ),
      },
      {
        id: "createdAt",
        header: "Created Date",
        sortable: true,
        cell: (row: ItemResponseDto) => (
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
    if (filters.categoryId) {
      const match = categories.find(c => c.id === filters.categoryId);
      chips.push({
        key: "categoryId",
        label: "Category",
        displayValue: match ? match.name : "Selected Category",
      });
    }
    return chips;
  }, [filters, categories]);

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={stats.total}
          description="Total inventory assets"
          icon={<Package className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Active Assets"
          value={stats.active}
          description="Operational inventory items"
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
          className="border-l-emerald-500/30"
        />
        <StatCard
          title="Inactive Assets"
          value={stats.inactive}
          description="Decommissioned/Disabled items"
          icon={<XCircle className="h-5 w-5 text-rose-500" />}
          className="border-l-rose-500/30"
        />
        <StatCard
          title="Consumables"
          value={stats.consumables}
          description="Short-cycle items tracked"
          icon={<Tag className="h-5 w-5 text-amber-500" />}
          className="border-l-amber-500/30"
        />
      </div>

      {/* 2. Main CRUD Template Wrapper */}
      <CrudPageTemplate
        title="Inventory Items Registry"
        description="Catalog, track, and generate QR code identifiers for institutional assets and consumable resources."
        primaryAction={{
          label: "Register Item",
          onClick: handleOpenCreate,
          icon: Plus,
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search items by name, SKU, manufacturer..."
        filters={
          <>
            <FilterDropdown
              label="Status"
              selected={filters.status as any}
              onChange={(val) => setFilter("status", val)}
              options={[
                { label: "Active Status", value: "active" },
                { label: "Inactive Status", value: "inactive" },
              ]}
            />
            <FilterDropdown
              label="Category"
              selected={filters.categoryId as any}
              onChange={(val) => setFilter("categoryId", val)}
              options={categories.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
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
      >
        <CrudTable
          columns={columns}
          data={data}
          idKey="id"
          isLoading={isLoading}
          error={errorState}
          emptyMessage="No items registered inside the catalog index matches these filter standards."
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
          onRefresh={fetchItems}
          rowActions={(row) => (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenView(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Registry
              </Button>
              <PermissionGate permission="items.update">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Item
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
              <PermissionGate permission="items.delete">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDelete(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove Item
                </Button>
              </PermissionGate>
            </>
          )}
          bulkActions={[
            {
              label: "Set Active Status",
              onClick: () => handleBulkStatusChange(true),
              icon: CheckCircle,
            },
            {
              label: "Set Inactive Status",
              onClick: () => handleBulkStatusChange(false),
              icon: XCircle,
            },
            {
              label: "Delete Selected",
              onClick: handleBulkDelete,
              icon: Trash2,
              variant: "destructive",
            },
          ]}
        />
      </CrudPageTemplate>

      {/* 3. Create / Edit Modal Form */}
      {(modalMode === "create" || modalMode === "edit") && (
        <FormModalWrapper
          isOpen={true}
          onClose={() => setModalMode(null)}
          onSubmit={handleSubmit}
          title={modalMode === "create" ? "Register Inventory Item" : "Edit Asset Specifications"}
          description={modalMode === "create" ? "Catalog a new trackable asset and automatically prepare its QR code profile." : "Modify description details, image, or classification options."}
          size="md"
          isSubmitting={isSubmitting}
          submitLabel={modalMode === "create" ? "Register Item" : "Save Changes"}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-foreground">Item Name <strong className="text-destructive">*</strong></span>
                <Input
                  placeholder="E.g., High-Speed Printer"
                  value={formFields.name}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, name: e.target.value }))}
                  error={formErrors.name}
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-foreground">Category <strong className="text-destructive">*</strong></span>
                <select
                  value={formFields.categoryId}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="text-[10px] font-semibold text-rose-500">{formErrors.categoryId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-foreground">SKU / Reference Code</span>
                <Input
                  placeholder="E.g., PRN-102-X"
                  value={formFields.sku}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, sku: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-foreground">Unit of Measure</span>
                <Input
                  placeholder="E.g., Pieces, Litres, Packs"
                  value={formFields.unit}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-foreground">Manufacturer</span>
                <Input
                  placeholder="E.g., HP, Canon, Dell"
                  value={formFields.manufacturer}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, manufacturer: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-foreground">Model Number</span>
                <Input
                  placeholder="E.g., LaserJet Pro M404"
                  value={formFields.modelNumber}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, modelNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Description</span>
              <textarea
                placeholder="Enter detailed description of the trackable asset..."
                value={formFields.description}
                onChange={(e) => setFormFields((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[70px] rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Image URL</span>
              <Input
                placeholder="https://example.com/item-image.jpg"
                value={formFields.image}
                onChange={(e) => setFormFields((prev) => ({ ...prev, image: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-1.5">
              <input
                type="checkbox"
                id="isConsumable"
                checked={formFields.isConsumable}
                onChange={(e) => setFormFields((prev) => ({ ...prev, isConsumable: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isConsumable" className="text-xs font-bold text-foreground cursor-pointer select-none">
                This item is consumable (e.g. paper, ink, chalk)
              </label>
            </div>
          </div>
        </FormModalWrapper>
      )}

      {/* 4. Detail View Modal */}
      {modalMode === "view" && selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          size="md"
          title="Item Registry details"
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalMode(null)}>
                Close
              </Button>
              <PermissionGate permission="items.update">
                <Button size="sm" onClick={() => handleOpenEdit(selectedItem)} className="gap-1.5">
                  <Edit2 className="h-3.5 w-3.5" /> Edit Specifications
                </Button>
              </PermissionGate>
            </div>
          }
        >
          <div className="space-y-6 py-2">
            {/* Visual Header: Image & QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/35 p-4 rounded-xl border border-border/40">
              <div className="flex flex-col items-center justify-center p-2 border border-dashed border-border/60 bg-card rounded-lg relative min-h-[160px]">
                <span className="absolute top-2 left-2 text-[9px] font-bold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded uppercase">
                  Item Image
                </span>
                {selectedItem.image ? (
                  <img src={selectedItem.image} alt={selectedItem.name} className="max-h-[130px] w-auto object-contain rounded" />
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <span className="text-[10px] font-semibold text-muted-foreground">No media available</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center p-2 border border-dashed border-border/60 bg-card rounded-lg relative min-h-[160px]">
                <span className="absolute top-2 left-2 text-[9px] font-bold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded uppercase">
                  System QR Code
                </span>
                {selectedItem.qrCode ? (
                  <div className="flex flex-col items-center">
                    <img src={selectedItem.qrCode} alt="Item QR Code" className="h-[120px] w-[120px] object-contain" />
                    <div className="flex gap-1.5 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadQr}
                        className="h-7 text-[10px] font-bold text-primary gap-1 px-2 cursor-pointer"
                      >
                        <Download className="h-3 w-3" /> Download
                      </Button>
                      <PermissionGate permission="items.update">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isRegeneratingQr}
                          onClick={handleRegenerateQr}
                          className="h-7 text-[10px] font-bold text-primary gap-1 px-2 cursor-pointer"
                        >
                          <RefreshCw className={`h-3 w-3 ${isRegeneratingQr ? "animate-spin" : ""}`} />
                          {isRegeneratingQr ? "Regenerating..." : "Regenerate"}
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <QrCode className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <span className="text-[10px] font-semibold text-muted-foreground">QR not generated</span>
                  </div>
                )}
              </div>
            </div>

            {/* General Specs */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> General Asset Information
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-secondary/20 p-3 rounded-lg border border-border/20 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-semibold text-[10px]">Item Name</span>
                    <span className="font-bold text-foreground mt-0.5">{selectedItem.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-semibold text-[10px]">URL Slug</span>
                    <span className="font-mono font-bold text-muted-foreground mt-0.5">{selectedItem.slug}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-semibold text-[10px]">SKU Code</span>
                    <span className="font-mono font-bold text-foreground mt-0.5">{selectedItem.sku || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-semibold text-[10px]">Category Classification</span>
                    <span className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Tag className="h-3 w-3 text-primary/70" />
                      {selectedItem.category?.name || "Uncategorized"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-semibold text-[10px]">Resource Type</span>
                    <span className="font-bold text-foreground mt-0.5">
                      {selectedItem.isConsumable ? "Consumable Asset" : "Non-Consumable Property"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-semibold text-[10px]">Operational Status</span>
                    <div className="mt-0.5">
                      <StatusBadge status={selectedItem.isActive ? "active" : "inactive"} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              {(selectedItem.manufacturer || selectedItem.modelNumber || selectedItem.unit) && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Technical Specifications
                  </h4>
                  <div className="grid grid-cols-3 gap-3 bg-secondary/20 p-3 rounded-lg border border-border/20 text-xs">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground font-semibold text-[10px]">Manufacturer</span>
                      <span className="font-bold text-foreground mt-0.5">{selectedItem.manufacturer || "—"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground font-semibold text-[10px]">Model Number</span>
                      <span className="font-bold text-foreground mt-0.5">{selectedItem.modelNumber || "—"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground font-semibold text-[10px]">Unit Of Measure</span>
                      <span className="font-bold text-foreground mt-0.5">{selectedItem.unit || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Asset Description
                </h4>
                <p className="text-xs text-foreground font-medium bg-secondary/15 p-2.5 rounded-lg border border-border/10 leading-relaxed min-h-[50px]">
                  {selectedItem.description || "No description coordinates recorded for this item entry."}
                </p>
              </div>

              {/* Metadata */}
              <div className="border-t border-border/40 pt-3 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Registered: {new Date(selectedItem.createdAt).toLocaleString()}
                </span>
                <span>
                  Last Updated: {new Date(selectedItem.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleting}
        onClose={() => {
          setIsDeleting(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Item Registry Removal"
        itemName={itemToDelete?.name || "this inventory item"}
      />
    </div>
  );
}

export default function ItemsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <ItemsPageContent />
    </React.Suspense>
  );
}
