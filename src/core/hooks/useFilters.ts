import { useState, useCallback } from "react";

export type FilterValue = string | number | boolean | string[] | [Date | null, Date | null] | null;
export type FilterState = Record<string, FilterValue>;

export interface UseFiltersResult {
  filters: FilterState;
  setFilter: (key: string, value: FilterValue) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  isFilterActive: boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
}

export function useFilters(initialFilters: FilterState = {}): UseFiltersResult {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const setFilter = useCallback((key: string, value: FilterValue) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const isFilterActive = Object.values(filters).some((val) => {
    if (val === null || val === undefined || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  return {
    filters,
    setFilter,
    setFilters,
    removeFilter,
    clearFilters,
    isFilterActive,
    isDrawerOpen,
    setDrawerOpen,
    toggleDrawer,
  };
}
