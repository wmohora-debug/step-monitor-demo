import { useState, useCallback } from "react";

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetPagination: () => void;
}

export function usePagination(initialPage: number = 1, initialPageSize: number = 10): UsePaginationResult {
  const [page, setPageInternal] = useState(initialPage);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);

  const setPage = useCallback((newPage: number) => {
    setPageInternal(Math.max(1, newPage));
  }, []);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeInternal(newPageSize);
    setPageInternal(1); // Reset to page 1 on page size change
  }, []);

  const resetPagination = useCallback(() => {
    setPageInternal(initialPage);
    setPageSizeInternal(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
  };
}
