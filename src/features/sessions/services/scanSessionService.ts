import { apiClient } from "../../../core/api/client";

export interface InvigilationSessionListQuery {
  page?: number;
  limit?: number;
  search?: string;
  schoolId?: string;
  classroomId?: string;
  userId?: string;
  phoneNumber?: string;
  invigilatorName?: string;
  checkedInAt?: string;
  checkedInFrom?: string;
  checkedInTo?: string;
  sortBy?: "checkedInAt" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface InvigilationSessionResponseDto {
  id: string;
  sessionId: string;
  userId: string;
  schoolId: string;
  classroomId: string;
  invigilatorName: string;
  phoneNumber?: string;
  invigilator: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email?: string;
    phone?: string;
  };
  school: {
    id: string;
    schoolId: string;
    schoolName: string;
    email?: string;
    phone?: string;
  };
  classroom: {
    id: string;
    classroomId: number;
    name: string;
  };
  checkedInAt: string;
  sessionStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedInvigilationSessionResponseDto {
  items: InvigilationSessionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ItemScanSessionQuery {
  page?: number;
  limit?: number;
  schoolId: string; // School UUID is marked as required in the API
  userId?: string;
  itemId?: string;
  sortBy?: "scannedAt" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ItemScanSessionResponseDto {
  id: string;
  userId: string;
  schoolId: string;
  itemId: string;
  scannedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email?: string;
    phone?: string;
  };
  school: {
    id: string;
    schoolId: string;
    schoolName: string;
    email?: string;
    phone?: string;
  };
  item: {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    isActive: boolean;
    category?: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedItemScanResponseDto {
  items: ItemScanSessionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const scanSessionService = {
  /**
   * Retrieves a paginated and filtered list of classroom invigilation session check-ins.
   */
  findInvigilationSessions: (query?: InvigilationSessionListQuery): Promise<PaginatedInvigilationSessionResponseDto> => {
    return apiClient.get<PaginatedInvigilationSessionResponseDto>("/admin/invigilation-sessions", { params: query });
  },

  /**
   * Fetches specific invigilation session details.
   */
  findInvigilationSession: (id: string): Promise<InvigilationSessionResponseDto> => {
    return apiClient.get<InvigilationSessionResponseDto>(`/admin/invigilation-sessions/${id}`);
  },

  /**
   * Lists item scan logs with pagination and filters.
   */
  findItemScanSessions: (query: ItemScanSessionQuery): Promise<PaginatedItemScanResponseDto> => {
    return apiClient.get<PaginatedItemScanResponseDto>("/admin/sessions", { params: query });
  },

  /**
   * Fetches specific item scan log details.
   */
  findItemScanSession: (id: string): Promise<ItemScanSessionResponseDto> => {
    return apiClient.get<ItemScanSessionResponseDto>(`/admin/sessions/${id}`);
  },
};
