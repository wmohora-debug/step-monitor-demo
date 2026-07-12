import { useState, useCallback } from "react";

export type SortOrder = "asc" | "desc";

export interface SortState {
  columnId: string | null;
  order: SortOrder;
}

export interface UseSortingResult {
  sortState: SortState;
  sortBy: string | null;
  sortOrder: SortOrder;
  handleSort: (columnId: string) => void;
  setSortState: (state: SortState) => void;
  resetSorting: () => void;
}

export function useSorting(initialColumn: string | null = null, initialOrder: SortOrder = "asc"): UseSortingResult {
  const [sortState, setSortStateInternal] = useState<SortState>({
    columnId: initialColumn,
    order: initialOrder,
  });

  const handleSort = useCallback((columnId: string) => {
    setSortStateInternal((prev) => {
      if (prev.columnId === columnId) {
        // Toggle direction if clicking same column
        return {
          columnId,
          order: prev.order === "asc" ? "desc" : "asc",
        };
      }
      // Default to asc on new column
      return {
        columnId,
        order: "asc",
      };
    });
  }, []);

  const setSortState = useCallback((state: SortState) => {
    setSortStateInternal(state);
  }, []);

  const resetSorting = useCallback(() => {
    setSortStateInternal({
      columnId: initialColumn,
      order: initialOrder,
    });
  }, [initialColumn, initialOrder]);

  return {
    sortState,
    sortBy: sortState.columnId,
    sortOrder: sortState.order,
    handleSort,
    setSortState,
    resetSorting,
  };
}
