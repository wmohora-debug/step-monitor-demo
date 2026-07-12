import { apiClient } from "../../../core/api/client";
import {
  GradeResponseDto,
  CreateGradeDto,
  UpdateGradeDto,
  ChangeGradeStatusDto,
  GradeListQuery,
  PaginatedGradeResponseDto,
} from "../../../core/types";

export const gradeService = {
  /**
   * Retrieves a paginated and filtered list of grades.
   */
  findAll: (query?: GradeListQuery): Promise<PaginatedGradeResponseDto> => {
    return apiClient.get<PaginatedGradeResponseDto>("/admin/grades", { params: query });
  },

  /**
   * Fetches specific grade details.
   */
  findOne: (id: string): Promise<GradeResponseDto> => {
    return apiClient.get<GradeResponseDto>(`/admin/grades/${id}`);
  },

  /**
   * Creates a new grade level.
   */
  create: (data: CreateGradeDto): Promise<GradeResponseDto> => {
    return apiClient.post<GradeResponseDto>("/admin/grades", data);
  },

  /**
   * Updates an existing grade's description or value.
   */
  update: (id: string, data: UpdateGradeDto): Promise<GradeResponseDto> => {
    return apiClient.put<GradeResponseDto>(`/admin/grades/${id}`, data);
  },

  /**
   * Soft deletes a grade.
   */
  remove: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/grades/${id}`);
  },

  /**
   * Toggles a grade's active status.
   */
  changeStatus: (id: string, status: ChangeGradeStatusDto): Promise<GradeResponseDto> => {
    return apiClient.patch<GradeResponseDto>(`/admin/grades/${id}/status`, status);
  },
};
