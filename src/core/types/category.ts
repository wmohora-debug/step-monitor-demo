/**
 * Standard Item Category representation.
 */
export interface CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new category.
 */
export interface CreateCategoryDto {
  name: string;
  description?: string | null;
  icon?: string | null;
  displayOrder?: number;
}

/**
 * DTO for updating an existing category.
 */
export interface UpdateCategoryDto {
  name?: string;
  description?: string | null;
  icon?: string | null;
  displayOrder?: number;
}

/**
 * DTO for updating active status of a category.
 */
export interface ChangeCategoryStatusDto {
  isActive: boolean;
}

/**
 * Query filters and pagination settings for listing categories.
 */
export interface CategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
  sortBy?: "name" | "slug" | "displayOrder" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response structure containing category items.
 */
export interface PaginatedCategoryResponseDto {
  items: CategoryResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
