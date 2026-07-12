"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, ApiError } from "../../api/client";
import { useToast } from "../../../components/ui/Toast";
import { PaginatedResponseDto, BaseQueryDto } from "../../types/dto";

/**
 * Hook for standard GET requests.
 */
export interface UseFetchOptions<T> {
  enabled?: boolean;
  params?: Record<string, any>;
  skipAuth?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (err: ApiError) => void;
}

export function useFetch<T>(endpoint: string, options: UseFetchOptions<T> = {}) {
  const { enabled = true, params, skipAuth, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOptionsRef = useRef(options);
  fetchOptionsRef.current = options;

  const execute = useCallback(
    async (overrideParams?: Record<string, any>) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<T>(endpoint, {
          params: overrideParams || params,
          skipAuth,
        });
        setData(response);
        if (fetchOptionsRef.current.onSuccess) {
          fetchOptionsRef.current.onSuccess(response);
        }
        return response;
      } catch (err: any) {
        const apiError = err instanceof ApiError ? err : new ApiError(err.message || "Request failed", 500, "REQUEST_FAILED");
        setError(apiError);
        if (fetchOptionsRef.current.onError) {
          fetchOptionsRef.current.onError(apiError);
        }
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, params, skipAuth]
  );

  useEffect(() => {
    if (enabled) {
      execute();
    } else {
      setIsLoading(false);
    }
  }, [enabled, execute]);

  return { data, isLoading, error, refetch: execute, setData };
}

/**
 * Hook for coordinating pagination, sorting, search, and filters.
 */
export interface UsePaginatedDataOptions<T> {
  enabled?: boolean;
  skipAuth?: boolean;
  onSuccess?: (data: PaginatedResponseDto<T>) => void;
  onError?: (err: ApiError) => void;
}

export function usePaginatedData<T>(
  endpoint: string,
  query: BaseQueryDto = { page: 1, limit: 10 },
  options: UsePaginatedDataOptions<T> = {}
) {
  const { enabled = true, skipAuth, onSuccess, onError } = options;
  const [data, setData] = useState<PaginatedResponseDto<T>>({
    items: [],
    total: 0,
    page: query.page || 1,
    limit: query.limit || 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<PaginatedResponseDto<T>>(endpoint, {
        params: query,
        skipAuth,
      });
      
      // Standarize response validation
      const items = response.items || [];
      const total = response.total !== undefined ? response.total : items.length;
      const limit = response.limit || query.limit || 10;
      const page = response.page || query.page || 1;
      const totalPages = response.totalPages || Math.ceil(total / limit) || 1;

      const validatedData: PaginatedResponseDto<T> = {
        items,
        total,
        page,
        limit,
        totalPages,
        meta: response.meta || { total, page, limit, totalPages },
      };

      setData(validatedData);
      if (optionsRef.current.onSuccess) {
        optionsRef.current.onSuccess(validatedData);
      }
      return validatedData;
    } catch (err: any) {
      const apiError = err instanceof ApiError ? err : new ApiError(err.message || "Request failed", 500, "REQUEST_FAILED");
      setError(apiError);
      if (optionsRef.current.onError) {
        optionsRef.current.onError(apiError);
      }
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, JSON.stringify(query), skipAuth]);

  useEffect(() => {
    if (enabled) {
      execute();
    } else {
      setIsLoading(false);
    }
  }, [enabled, execute]);

  return {
    items: data.items,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    meta: data.meta,
    isLoading,
    error,
    refetch: execute,
  };
}

/**
 * Hook for modifying data (POST, PUT, PATCH, DELETE).
 */
export interface UseMutationOptions<TResponse, TVariables> {
  onSuccess?: (data: TResponse, variables: TVariables) => void | Promise<void>;
  onError?: (err: ApiError, variables: TVariables) => void | Promise<void>;
  onSettled?: (data: TResponse | null, err: ApiError | null, variables: TVariables) => void | Promise<void>;
}

export function useMutation<TResponse, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TResponse>,
  options: UseMutationOptions<TResponse, TVariables> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      try {
        const response = await mutationFn(variables);
        setIsSuccess(true);
        if (optionsRef.current.onSuccess) {
          await optionsRef.current.onSuccess(response, variables);
        }
        if (optionsRef.current.onSettled) {
          await optionsRef.current.onSettled(response, null, variables);
        }
        return response;
      } catch (err: any) {
        const apiError = err instanceof ApiError ? err : new ApiError(err.message || "Mutation failed", 500, "MUTATION_FAILED");
        setError(apiError);
        if (optionsRef.current.onError) {
          await optionsRef.current.onError(apiError, variables);
        }
        if (optionsRef.current.onSettled) {
          await optionsRef.current.onSettled(null, apiError, variables);
        }
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn]
  );

  return { mutate, isLoading, error, isSuccess };
}

/**
 * Pre-built mutation hook wrappers.
 */
export function useCreate<TBody, TResponse>(endpoint: string, options?: UseMutationOptions<TResponse, TBody>) {
  return useMutation<TResponse, TBody>(
    (body) => apiClient.post<TResponse>(endpoint, body),
    options
  );
}

export function useUpdate<TBody, TResponse>(endpoint: string, options?: UseMutationOptions<TResponse, { id: string; body: TBody }>) {
  return useMutation<TResponse, { id: string; body: TBody }>(
    ({ id, body }) => apiClient.put<TResponse>(`${endpoint}/${id}`, body),
    options
  );
}

export function useDelete<TResponse = void>(endpoint: string, options?: UseMutationOptions<TResponse, string>) {
  return useMutation<TResponse, string>(
    (id) => apiClient.delete<TResponse>(`${endpoint}/${id}`),
    options
  );
}

/**
 * Search hook with inline query inputs.
 */
export function useApiSearch<T>(endpoint: string, queryKey: string, queryParams: Record<string, any> = {}) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setData([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<T[]>(endpoint, {
        params: { ...queryParams, [queryKey]: searchQuery },
      });
      setData(response || []);
    } catch (err: any) {
      setError(err instanceof ApiError ? err : new ApiError(err.message, 500, "SEARCH_FAILED"));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, queryKey, JSON.stringify(queryParams)]);

  return { query, setQuery, data, isLoading, error, refetch: () => fetchResults(query) };
}

/**
 * Future-ready Infinite Scroll query loader.
 */
export function useInfiniteScroll<T>(endpoint: string, limit: number = 10, options: UseFetchOptions<T[]> = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isLoading, refetch } = useFetch<PaginatedResponseDto<T>>(endpoint, {
    ...options,
    params: { ...options.params, page, limit },
    onSuccess: (res) => {
      const newItems = res.items || [];
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length >= limit);
    },
  });

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore]);

  const resetScroll = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return { items, isLoading, hasMore, loadMore, resetScroll, refetch };
}
