/**
 * Core Pagination Metadata.
 */
export interface PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Standard envelope for paginated collections from the API.
 */
export interface PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta?: PaginationMetaDto; // Backup metadata field
}

/**
 * Standard API Single Response wrapper.
 */
export interface BaseResponseDto<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Standard query parameters for filtering, sorting, searching, and pagination.
 */
export interface BaseQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [filterKey: string]: any; // Allow arbitrary filter options
}

/**
 * Base representation of database entities.
 */
export interface BaseEntityDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}
