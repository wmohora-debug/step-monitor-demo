import { env } from "../config/env";

/**
 * Standardized API Error class to wrap non-2xx responses.
 */
export class ApiError extends Error {
  status: number;
  code: string;
  data: any;

  constructor(message: string, status: number, code: string, data: any = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Maps HTTP status codes to standardized frontend error code keys.
 */
export function mapStatusToCode(status: number): string {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMIT_EXCEEDED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNEXPECTED_ERROR";
}

/**
 * Helper to get the access token from cookies (server-side next headers or client-side document.cookie).
 */
async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      return cookieStore.get(env.storageKeys.accessToken)?.value || null;
    } catch {
      return null;
    }
  } else {
    try {
      const match = document.cookie.match(new RegExp("(^| )" + env.storageKeys.accessToken + "=([^;]*)"));
      if (match) return decodeURIComponent(match[2]);
      return localStorage.getItem(env.storageKeys.accessToken);
    } catch {
      return null;
    }
  }
}

/**
 * Helper to build URL query strings.
 */
export function buildQueryString(params?: Record<string, any>): string {
  if (!params) return "";
  const cleanParams: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        cleanParams[key] = value.join(",");
      } else {
        cleanParams[key] = String(value);
      }
    }
  });

  if (Object.keys(cleanParams).length === 0) return "";
  return "?" + new URLSearchParams(cleanParams).toString();
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
  skipAuthRedirect?: boolean;
  timeout?: number; // In milliseconds
  retries?: number; // Number of retries on network failures/timeouts
  cancelKey?: string; // Optional custom key for canceling previous requests
  suppressErrorLogging?: boolean;
  responseType?: "json" | "text" | "blob";
}

// In-flight request trackers for deduplication and cancellation
const inFlightRequests = new Map<string, Promise<any>>();
const activeAbortControllers = new Map<string, AbortController>();

/**
 * Core isomorphic request wrapper.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    params,
    skipAuth,
    skipAuthRedirect,
    suppressErrorLogging,
    timeout = 15000,
    retries = options.method === "GET" ? 2 : 0,
    cancelKey,
    headers: customHeaders,
    ...restOptions
  } = options;

  const method = options.method || "GET";
  const queryStr = buildQueryString(params);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${env.apiBaseUrl}${env.apiPrefix}${cleanEndpoint}${queryStr}`;

  // Request Key for Deduplication (only for GET requests)
  const isGet = method.toUpperCase() === "GET";
  const dedupeKey = `${method}:${url}`;

  if (isGet && inFlightRequests.has(dedupeKey)) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[API Client] Deduplicated concurrent read: ${dedupeKey}`);
    }
    return inFlightRequests.get(dedupeKey) as Promise<T>;
  }

  // Cancel previous active request if a cancelKey is provided
  if (cancelKey) {
    if (activeAbortControllers.has(cancelKey)) {
      activeAbortControllers.get(cancelKey)?.abort();
      activeAbortControllers.delete(cancelKey);
    }
  }

  // Create AbortController for timeouts and cancellations
  const controller = new AbortController();
  if (cancelKey) {
    activeAbortControllers.set(cancelKey, controller);
  }

  const executeRequest = async (): Promise<T> => {
    let attempt = 0;
    const headers = new Headers(customHeaders);
    
    if (!headers.has("Content-Type") && !(restOptions.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Accept", "application/json");

    if (!skipAuth) {
      const token = await getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    while (attempt <= retries) {
      const startTime = performance.now();
      const attemptController = new AbortController();
      
      // Link the main abort signal
      const signalListener = () => attemptController.abort();
      controller.signal.addEventListener("abort", signalListener);

      const timeoutId = setTimeout(() => {
        attemptController.abort();
      }, timeout);

      try {
        if (process.env.NODE_ENV !== "production") {
          console.groupCollapsed(`%c[API Request] ${method} ${cleanEndpoint} (Attempt ${attempt + 1}/${retries + 1})`, "color: #3b82f6; font-weight: bold;");
          console.log("URL:", url);
          console.log("Headers:", Object.fromEntries(headers.entries()));
          if (restOptions.body) console.log("Body:", restOptions.body);
          console.groupEnd();
        }

        const response = await fetch(url, {
          ...restOptions,
          headers,
          signal: attemptController.signal,
        });

        clearTimeout(timeoutId);
        controller.signal.removeEventListener("abort", signalListener);

        const duration = Math.round(performance.now() - startTime);

        if (process.env.NODE_ENV !== "production") {
          console.groupCollapsed(`%c[API Response] ${response.status} ${cleanEndpoint} (${duration}ms)`, "color: #10b981; font-weight: bold;");
          console.log("Response headers:", Object.fromEntries(response.headers.entries()));
          console.groupEnd();
        }

        if (response.status === 204) {
          return {} as T;
        }

        let responseData: any = null;
        if (options.responseType === "blob") {
          responseData = await response.blob();
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              responseData = await response.json();
            } catch {
              throw new ApiError("Failed to parse JSON response body", response.status, "PARSING_ERROR");
            }
          } else {
            responseData = await response.text();
          }
        }

        if (!response.ok) {
          if (response.status === 401 && !skipAuthRedirect && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("unauthorized-api-call"));
          }
          
          const errorMsg = responseData?.message || responseData?.error || `HTTP error ${response.status}`;
          throw new ApiError(errorMsg, response.status, mapStatusToCode(response.status), responseData);
        }

        // Validate response structure (Unwrap standard response envelopes)
        if (responseData && typeof responseData === "object" && responseData !== null) {
          if ("data" in responseData) {
            return responseData.data as T;
          }
        }

        return responseData as T;
      } catch (err: any) {
        clearTimeout(timeoutId);
        controller.signal.removeEventListener("abort", signalListener);

        const duration = Math.round(performance.now() - startTime);
        const isTimeout = err.name === "AbortError" && !controller.signal.aborted;

        if (process.env.NODE_ENV !== "production" && !suppressErrorLogging) {
          console.group(`%c[API Error] ${cleanEndpoint} - ${err.message} (${duration}ms)`, "color: #ef4444; font-weight: bold;");
          console.warn(err);
          console.groupEnd();
        }

        // If it's a manual cancellation by user abort, do not retry
        if (controller.signal.aborted) {
          throw new ApiError("Request canceled by user", 499, "CANCELED");
        }

        // Retry on timeouts or network errors
        const isNetworkErr = err.message?.toLowerCase().includes("network") || err.message?.toLowerCase().includes("fetch");
        if ((isTimeout || isNetworkErr) && attempt < retries) {
          attempt++;
          // Exponential backoff delay (e.g. 500ms, 1000ms)
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }

        if (err instanceof ApiError) {
          throw err;
        }

        if (isTimeout) {
          throw new ApiError(`Request timeout after ${timeout}ms`, 408, "TIMEOUT");
        }

        throw new ApiError(err.message || "Network request failed", 500, "NETWORK_ERROR", err);
      }
    }
    throw new ApiError("Request execution exhausted", 500, "UNEXPECTED_ERROR");
  };

  const requestPromise = executeRequest().finally(() => {
    if (isGet) inFlightRequests.delete(dedupeKey);
    if (cancelKey) activeAbortControllers.delete(cancelKey);
  });

  if (isGet) {
    inFlightRequests.set(dedupeKey, requestPromise);
  }

  return requestPromise;
}

/**
 * Enterprise generic API client methods.
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) => {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) => {
    const fetchBody = body instanceof FormData ? body : JSON.stringify(body);
    return request<T>(endpoint, { ...options, method: "POST", body: fetchBody });
  },

  put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) => {
    const fetchBody = body instanceof FormData ? body : JSON.stringify(body);
    return request<T>(endpoint, { ...options, method: "PUT", body: fetchBody });
  },

  patch: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) => {
    const fetchBody = body instanceof FormData ? body : JSON.stringify(body);
    return request<T>(endpoint, { ...options, method: "PATCH", body: fetchBody });
  },

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) => {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },

  /**
   * Upload helper (supports cancellation keys, progress tracking configurations, etc.)
   */
  upload: <T>(
    endpoint: string,
    formData: FormData,
    options?: Omit<RequestOptions, "method" | "body">
  ) => {
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  },
};
export type { RequestOptions as UI_RequestOptions };
