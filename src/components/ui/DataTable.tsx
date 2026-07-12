"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./Table";
import { Skeleton } from "./Skeleton";
import { Pagination } from "./Pagination";
import { FolderOpen } from "lucide-react";

export interface ColumnDef<T> {
  header: string | React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  data = [],
  isLoading = false,
  emptyMessage = "No records found.",
  currentPage,
  totalPages,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead key={idx} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 5 }).map((_, rIdx) => (
              <TableRow key={`skeleton-row-${rIdx}`}>
                {columns.map((col, cIdx) => (
                  <TableCell key={`skeleton-cell-${cIdx}`} className={col.className}>
                    <Skeleton className="h-4 w-4/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            // Empty State Row
            <TableRow>
              <TableCell colSpan={columns.length} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 opacity-60" />
                  <p className="text-sm font-semibold">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // Data Rows
            data.map((row, rIdx) => (
              <TableRow key={rIdx}>
                {columns.map((col, cIdx) => (
                  <TableCell key={cIdx} className={col.className}>
                    {col.cell(row, rIdx)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {currentPage !== undefined && totalPages !== undefined && onPageChange !== undefined && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
export type { ColumnDef as UI_ColumnDef };
