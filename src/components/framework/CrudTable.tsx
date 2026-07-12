"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Dropdown,
  DropdownItem,
  Checkbox,
  TableSkeleton,
  EmptyState,
  Badge,
} from "../ui";
import {
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  Trash2,
  MoreHorizontal,
  FolderOpen,
} from "lucide-react";
import { cn } from "../../core/utils/cn";

export interface CrudColumnDef<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface BulkAction<T> {
  label: string;
  onClick: (selectedIds: string[]) => void;
  icon?: React.ComponentType<any>;
  variant?: "default" | "destructive";
}

export interface CrudTableProps<T> {
  columns: CrudColumnDef<T>[];
  data: T[];
  idKey: keyof T;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  
  // Pagination
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  
  // Selection
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  onClearSelection?: () => void;
  
  // Sorting
  sortBy?: string | null;
  sortOrder?: "asc" | "desc";
  onSort?: (columnId: string) => void;
  
  // Refresh / Actions
  onRefresh?: () => void;
  bulkActions?: BulkAction<T>[];
  rowActions?: (row: T) => React.ReactNode;
}

export function CrudTable<T>({
  columns,
  data = [],
  idKey,
  isLoading = false,
  error = null,
  emptyMessage,
  
  page,
  pageSize,
  totalPages,
  onPageChange,
  
  selectedIds = new Set(),
  onToggleSelection,
  onToggleAll,
  onClearSelection,
  
  sortBy,
  sortOrder,
  onSort,
  
  onRefresh,
  bulkActions = [],
  rowActions,
}: CrudTableProps<T>) {
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );

  const toggleColumnVisibility = (colId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  const activeColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns[col.id]);
  }, [columns, visibleColumns]);

  // Extract string IDs from visible rows
  const visibleRowIds = useMemo(() => {
    return data.map((row) => String(row[idKey]));
  }, [data, idKey]);

  const allSelected = useMemo(() => {
    if (visibleRowIds.length === 0) return false;
    return visibleRowIds.every((id) => selectedIds.has(id));
  }, [visibleRowIds, selectedIds]);

  const someSelected = useMemo(() => {
    if (visibleRowIds.length === 0) return false;
    const hasSome = visibleRowIds.some((id) => selectedIds.has(id));
    return hasSome && !allSelected;
  }, [visibleRowIds, selectedIds, allSelected]);

  return (
    <div className="space-y-4 relative">
      {/* 1. TABLE TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/10 p-3 rounded-xl border border-border/40">
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2 h-9 rounded-lg"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
          {selectedIds.size > 0 && onClearSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear selection ({selectedIds.size})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Column visibility dropdown */}
          <Dropdown
            align="right"
            trigger={
              <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Columns
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            }
          >
            <div className="px-3 py-2 border-b border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Toggle Columns
              </span>
            </div>
            <div className="p-1.5 space-y-1">
              {columns.map((col) => (
                <div
                  key={col.id}
                  onClick={() => toggleColumnVisibility(col.id)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-secondary cursor-pointer"
                >
                  <Checkbox
                    checked={visibleColumns[col.id]}
                    onChange={() => {}} // Controlled via container div onClick
                  />
                  <span>{col.header}</span>
                </div>
              ))}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                {/* Checkbox Header */}
                {onToggleAll && (
                  <TableHead className="w-12 px-4">
                    <Checkbox
                      checked={allSelected}
                      onChange={() => onToggleAll(visibleRowIds)}
                    />
                  </TableHead>
                )}

                {/* Visible headers */}
                {activeColumns.map((col) => {
                  const isSorted = sortBy === col.id;
                  return (
                    <TableHead key={col.id} className={cn("py-3", col.className)}>
                      {col.sortable && onSort ? (
                        <button
                          onClick={() => onSort(col.id)}
                          className="flex items-center gap-1.5 font-bold hover:text-foreground transition-colors group text-xs tracking-tight"
                        >
                          {col.header}
                          <span className="text-muted-foreground group-hover:text-foreground">
                            {isSorted ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-55" />
                            )}
                          </span>
                        </button>
                      ) : (
                        <span className="font-bold text-xs tracking-tight text-muted-foreground/80">
                          {col.header}
                        </span>
                      )}
                    </TableHead>
                  );
                })}

                {/* Actions cell placeholder */}
                {rowActions && <TableHead className="w-16 text-right px-6" />}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                // Table Skeletons
                Array.from({ length: pageSize || 5 }).map((_, rIdx) => (
                  <TableRow key={`skeleton-row-${rIdx}`}>
                    {onToggleAll && (
                      <TableCell className="px-4">
                        <Checkbox checked={false} disabled />
                      </TableCell>
                    )}
                    {activeColumns.map((col) => (
                      <TableCell key={`skeleton-cell-${col.id}`} className={col.className}>
                        <div className="h-4.5 bg-muted rounded animate-pulse w-4/5" />
                      </TableCell>
                    ))}
                    {rowActions && <TableCell className="px-6" />}
                  </TableRow>
                ))
              ) : error ? (
                // Error state
                <TableRow>
                  <TableCell
                    colSpan={activeColumns.length + (onToggleAll ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="p-0"
                  >
                    <EmptyState
                      variant="server-error"
                      description={error}
                      action={
                        onRefresh && (
                          <Button size="sm" onClick={onRefresh} className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Try Again
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell
                    colSpan={activeColumns.length + (onToggleAll ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="p-0"
                  >
                    <EmptyState
                      variant="no-data"
                      description={emptyMessage}
                      action={
                        onRefresh && (
                          <Button size="sm" onClick={onRefresh} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Refresh List
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                data.map((row) => {
                  const rowId = String(row[idKey]);
                  const isRowSelected = selectedIds.has(rowId);
                  return (
                    <TableRow
                      key={rowId}
                      className={cn(
                        "group transition-colors duration-150",
                        isRowSelected && "bg-primary/5 hover:bg-primary/8"
                      )}
                    >
                      {/* Checkbox cell */}
                      {onToggleSelection && (
                        <TableCell className="px-4">
                          <Checkbox
                            checked={isRowSelected}
                            onChange={() => onToggleSelection(rowId)}
                          />
                        </TableCell>
                      )}

                      {/* Data cells */}
                      {activeColumns.map((col) => (
                        <TableCell key={col.id} className={cn("py-3", col.className)}>
                          {col.cell(row)}
                        </TableCell>
                      ))}

                      {/* Action Menu button */}
                      {rowActions && (
                        <TableCell className="text-right px-6">
                          <Dropdown
                            align="right"
                            trigger={
                              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors border border-transparent hover:border-border/30">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            }
                          >
                            {rowActions(row)}
                          </Dropdown>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 3. PAGINATION FOOTER */}
        {!isLoading && !error && data.length > 0 && page && totalPages && onPageChange && (
          <div className="border-t border-border px-6 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/5">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing page <strong className="text-foreground">{page}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="h-8 text-xs rounded-lg"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                // Paginate window calculation
                let pageNum = idx + 1;
                if (page > 3 && totalPages > 5) {
                  pageNum = page + idx - 2;
                  if (pageNum + (4 - idx) > totalPages) {
                    pageNum = totalPages - 4 + idx;
                  }
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "primary" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="h-8 w-8 text-xs p-0 rounded-lg"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="h-8 text-xs rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. FLOATING BULK ACTIONS BAR */}
      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900 shadow-xl border border-slate-800 dark:border-slate-200 px-4.5 py-3 rounded-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom duration-250">
          <span className="text-xs font-bold whitespace-nowrap">
            {selectedIds.size} Selected
          </span>
          <div className="h-4 w-px bg-slate-800 dark:bg-slate-200" />
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant === "destructive" ? "destructive" : "primary"}
                onClick={() => action.onClick(Array.from(selectedIds))}
                className="h-8 text-xs font-bold px-3 rounded-xl"
              >
                {action.icon && <action.icon className="h-3.5 w-3.5 mr-1 shrink-0" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
