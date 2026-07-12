import { apiClient } from "../../../core/api/client";
import {
  UserResponseDto as AdminResponseDto,
  CreateUserDto as CreateAdminDto,
  UpdateUserDto as UpdateAdminDto,
  ChangeUserStatusDto as ChangeAdminStatusDto,
  UserListQuery as AdminListQuery,
  PaginatedUserResponseDto as PaginatedAdminResponseDto,
} from "../../../core/types";

export const adminService = {
  /**
   * Retrieves a paginated and filtered list of Super Administrator accounts.
   */
  findAll: (query?: AdminListQuery): Promise<PaginatedAdminResponseDto> => {
    return apiClient.get<PaginatedAdminResponseDto>("/admin/admins", { params: query });
  },

  /**
   * Fetches specific Super Administrator details.
   */
  findOne: (id: string): Promise<AdminResponseDto> => {
    return apiClient.get<AdminResponseDto>(`/admin/admins/${id}`);
  },

  /**
   * Creates a new Super Administrator account.
   */
  create: (data: CreateAdminDto): Promise<AdminResponseDto> => {
    return apiClient.post<AdminResponseDto>("/admin/admins", data);
  },

  /**
   * Updates an existing Super Administrator's details.
   */
  update: (id: string, data: UpdateAdminDto): Promise<AdminResponseDto> => {
    return apiClient.put<AdminResponseDto>(`/admin/admins/${id}`, data);
  },

  /**
   * Soft deletes a Super Administrator.
   */
  remove: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/admins/${id}`);
  },

  /**
   * Toggles a Super Administrator's active status.
   */
  changeStatus: (id: string, status: ChangeAdminStatusDto): Promise<AdminResponseDto> => {
    return apiClient.patch<AdminResponseDto>(`/admin/admins/${id}/status`, status);
  },
};
