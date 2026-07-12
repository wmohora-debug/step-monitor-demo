import { apiClient } from "../../../core/api/client";

export interface SessionWeekListQuery {
  page?: number;
  limit?: number;
  sortBy?: "weekNumber" | "startDate" | "endDate" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface SessionWeekResponseDto {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSessionWeekResponseDto {
  items: SessionWeekResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSessionWeeksDto {
  startDate: string; // ISO date format, e.g., '2026-07-10'
  totalWeeks: number; // e.g., 5
}

export interface UpdateSessionWeekDto {
  description: string | null;
}

export const sessionWeekService = {
  /**
   * Retrieves a paginated list of session weeks.
   */
  findSessionWeeks: (query?: SessionWeekListQuery): Promise<PaginatedSessionWeekResponseDto> => {
    return apiClient.get<PaginatedSessionWeekResponseDto>("/admin/session-weeks", { params: query });
  },

  /**
   * Fetches specific session week details.
   */
  findSessionWeek: (id: string): Promise<SessionWeekResponseDto> => {
    return apiClient.get<SessionWeekResponseDto>(`/admin/session-weeks/${id}`);
  },

  /**
   * Automatically generates a block of consecutive session weeks.
   */
  createSessionWeeks: (data: CreateSessionWeeksDto): Promise<SessionWeekResponseDto[]> => {
    return apiClient.post<SessionWeekResponseDto[]>("/admin/session-weeks", data);
  },

  /**
   * Updates the text description of a specific session week.
   */
  updateSessionWeekDescription: (id: string, data: UpdateSessionWeekDto): Promise<SessionWeekResponseDto> => {
    return apiClient.patch<SessionWeekResponseDto>(`/admin/session-weeks/${id}`, data);
  },
};
