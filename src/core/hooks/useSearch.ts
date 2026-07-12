import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "./useDebounce";

export interface UseSearchResult {
  searchQuery: string;
  debouncedQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

export function useSearch(initialQuery: string = "", delay: number = 300): UseSearchResult {
  const [searchQuery, setSearchQueryInternal] = useState(initialQuery);
  const debouncedQuery = useDebounce(searchQuery, delay);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryInternal(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQueryInternal("");
  }, []);

  return {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    clearSearch,
  };
}
