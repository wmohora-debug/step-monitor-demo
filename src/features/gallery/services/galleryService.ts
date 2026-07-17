import { apiClient } from "../../../core/api/client";
import {
  GalleryResponseDto,
  GalleryListQuery,
  PaginatedGalleryResponseDto,
  CreateGalleryPayload,
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

  /**
   * Creates a new gallery entry with multi-image upload (Super Admin only).
   */
  create: (payload: CreateGalleryPayload): Promise<GalleryResponseDto> => {
    const formData = new FormData();
    formData.append("schoolId", payload.schoolId);
    formData.append("title", payload.title);
    if (payload.description) {
      formData.append("description", payload.description);
    }
    payload.images.forEach((image) => {
      formData.append("images", image);
    });

    return apiClient.upload<GalleryResponseDto>("/admin/gallery", formData);
  },
};
