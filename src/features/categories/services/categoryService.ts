import { apiClient } from "../../../core/api/client";
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ChangeCategoryStatusDto,
  CategoryListQuery,
  PaginatedCategoryResponseDto,
} from "../../../core/types";

export const categoryService = {
  /**
   * Lists categories with pagination and filtering.
   */
  findAll: (query?: CategoryListQuery): Promise<PaginatedCategoryResponseDto> => {
    return apiClient.get<PaginatedCategoryResponseDto>("/admin/categories", { params: query });
  },

  /**
   * Fetches specific category details.
   */
  findOne: (id: string): Promise<CategoryResponseDto> => {
    return apiClient.get<CategoryResponseDto>(`/admin/categories/${id}`);
  },

  /**
   * Creates a new item category.
   */
  create: (data: CreateCategoryDto): Promise<CategoryResponseDto> => {
    return apiClient.post<CategoryResponseDto>("/admin/categories", data);
  },

  /**
   * Updates an existing category.
   */
  update: (id: string, data: UpdateCategoryDto): Promise<CategoryResponseDto> => {
    return apiClient.put<CategoryResponseDto>(`/admin/categories/${id}`, data);
  },

  /**
   * Soft deletes a category.
   */
  remove: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/categories/${id}`);
  },

  /**
   * Toggles active status of a category.
   */
  changeStatus: (id: string, status: ChangeCategoryStatusDto): Promise<CategoryResponseDto> => {
    return apiClient.patch<CategoryResponseDto>(`/admin/categories/${id}/status`, status);
  },
};
