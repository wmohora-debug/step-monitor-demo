import { apiClient } from "../../../core/api/client";
import {
  UserResponseDto,
  CreateUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
  UserListQuery,
  PaginatedUserResponseDto,
} from "../../../core/types";

export const userService = {
  /**
   * Retrieves a paginated and filtered list of user and admin accounts.
   */
  findAll: (query?: UserListQuery): Promise<PaginatedUserResponseDto> => {
    return apiClient.get<PaginatedUserResponseDto>("/admin/users", { params: query });
  },

  /**
   * Fetches specific user account details.
   */
  findOne: (id: string): Promise<UserResponseDto> => {
    return apiClient.get<UserResponseDto>(`/admin/users/${id}`);
  },

  /**
   * Creates a new user or administrator account.
   */
  create: (data: CreateUserDto): Promise<UserResponseDto> => {
    return apiClient.post<UserResponseDto>("/admin/users", data);
  },

  /**
   * Updates an existing user or administrator account details.
   */
  update: (id: string, data: UpdateUserDto): Promise<UserResponseDto> => {
    return apiClient.put<UserResponseDto>(`/admin/users/${id}`, data);
  },

  /**
   * Soft deletes a user account.
   */
  remove: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/users/${id}`);
  },

  /**
   * Toggles a user's active status.
   */
  changeStatus: (id: string, status: ChangeUserStatusDto): Promise<UserResponseDto> => {
    return apiClient.patch<UserResponseDto>(`/admin/users/${id}/status`, status);
  },
};
