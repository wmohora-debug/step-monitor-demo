import { apiClient } from "../../../core/api/client";
import {
  GalleryResponseDto,
  GalleryListQuery,
  PaginatedGalleryResponseDto,
} from "../../../core/types";

export const galleryService = {
  /**
   * Lists galleries with pagination, search, and sorting (Admin & Super Admin).
   */
  findAll: (query?: GalleryListQuery): Promise<PaginatedGalleryResponseDto> => {
    return apiClient.get<PaginatedGalleryResponseDto>("/admin/gallery", { params: query });
  },

  /**
   * Fetches specific gallery details (Admin & Super Admin).
   */
  findOne: (id: string): Promise<GalleryResponseDto> => {
    return apiClient.get<GalleryResponseDto>(`/admin/gallery/${id}`);
  },

  /**
   * Deletes a gallery record (Super Admin only).
   */
  remove: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/gallery/${id}`);
  },
};
