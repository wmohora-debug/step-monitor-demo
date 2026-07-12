/**
 * Standard Grade representation.
 */
export interface GradeResponseDto {
  id: string;
  grade: number;
  description: string;
  status: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new grade.
 */
export interface CreateGradeDto {
  grade: number;
  description: string;
  status?: boolean;
}

/**
 * DTO for updating an existing grade.
 */
export interface UpdateGradeDto {
  grade?: number;
  description?: string;
  status?: boolean;
}

/**
 * DTO for toggling a grade status.
 */
export interface ChangeGradeStatusDto {
  status: boolean;
}

/**
 * Query filters and pagination settings for listing grades.
 */
export interface GradeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
  sortBy?: "grade" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response structure containing grades.
 */
export interface PaginatedGradeResponseDto {
  items: GradeResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
