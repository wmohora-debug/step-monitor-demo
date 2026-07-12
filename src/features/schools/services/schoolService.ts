import { apiClient } from "../../../core/api/client";
import {
  SchoolResponseDto,
  CreateSchoolDto,
  UpdateSchoolDto,
  ChangeSchoolStatusDto,
  SchoolListQuery,
  PaginatedSchoolResponseDto,
} from "../../../core/types";

export const schoolService = {
  /**
   * Lists schools with pagination and filtering (Admin only).
   */
  findAll: (query?: SchoolListQuery): Promise<PaginatedSchoolResponseDto> => {
    return apiClient.get<PaginatedSchoolResponseDto>("/admin/schools", { params: query });
  },

  /**
   * Fetches specific school details (Admin only).
   */
  findOne: (id: string): Promise<SchoolResponseDto> => {
    return apiClient.get<SchoolResponseDto>(`/admin/schools/${id}`);
  },

  /**
   * Creates a new school profile (Admin only).
   */
  create: (data: CreateSchoolDto): Promise<SchoolResponseDto> => {
    return apiClient.post<SchoolResponseDto>("/admin/schools", data);
  },

  /**
   * Updates an existing school profile details (Admin only).
   */
  update: (id: string, data: UpdateSchoolDto): Promise<SchoolResponseDto> => {
    return apiClient.put<SchoolResponseDto>(`/admin/schools/${id}`, data);
  },

  /**
   * Soft deletes a school (Admin only).
   */
  remove: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/schools/${id}`);
  },

  /**
   * Toggles a school's active status (Admin only).
   */
  changeStatus: (id: string, status: ChangeSchoolStatusDto): Promise<SchoolResponseDto> => {
    return apiClient.patch<SchoolResponseDto>(`/admin/schools/${id}/status`, status);
  },
};
