import { apiClient } from "../../../core/api/client";
import {
  SchoolScoreResponseDto,
  CreateSchoolScoreDto,
  UpdateSchoolScoreDto,
  PaginatedSchoolScoreResponseDto,
  SchoolScoreListQuery,
} from "../../../core/types";

export const schoolScoreService = {
  /**
   * Lists school scores with pagination and search.
   */
  findAll: (query?: SchoolScoreListQuery): Promise<PaginatedSchoolScoreResponseDto> => {
    return apiClient.get<PaginatedSchoolScoreResponseDto>("/admin/school-scores", { params: query });
  },

  /**
   * Fetches a specific school's score.
   */
  findOne: (schoolId: string): Promise<SchoolScoreResponseDto> => {
    return apiClient.get<SchoolScoreResponseDto>(`/admin/school-scores/${schoolId}`);
  },

  /**
   * Creates a new school score record.
   */
  create: (data: CreateSchoolScoreDto): Promise<SchoolScoreResponseDto> => {
    return apiClient.post<SchoolScoreResponseDto>("/admin/school-scores", data);
  },

  /**
   * Updates an existing school score.
   */
  update: (schoolId: string, data: UpdateSchoolScoreDto): Promise<SchoolScoreResponseDto> => {
    return apiClient.put<SchoolScoreResponseDto>(`/admin/school-scores/${schoolId}`, data);
  },

  /**
   * Soft deletes a school score.
   */
  remove: (schoolId: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/school-scores/${schoolId}`);
  },
};
