import { useState, useCallback } from "react";

export interface UseSelectionResult<T> {
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
  toggleAll: (allIds: string[]) => void;
  clearSelection: () => void;
  isAllSelected: (allIds: string[]) => boolean;
  isSomeSelected: (allIds: string[]) => boolean;
}

export function useSelection<T>(idKey: keyof T): UseSelectionResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = allIds.every((id) => next.has(id));
      if (allSelected) {
        // Unselect all in active list
        allIds.forEach((id) => next.delete(id));
      } else {
        // Select all in active list
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useCallback((allIds: string[]) => {
    if (allIds.length === 0) return false;
    return allIds.every((id) => selectedIds.has(id));
  }, [selectedIds]);

  const isSomeSelected = useCallback((allIds: string[]) => {
    if (allIds.length === 0) return false;
    const hasSome = allIds.some((id) => selectedIds.has(id));
    const allSelected = allIds.every((id) => selectedIds.has(id));
    return hasSome && !allSelected;
  }, [selectedIds]);

  return {
    selectedIds,
    setSelectedIds,
    isSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  };
}
