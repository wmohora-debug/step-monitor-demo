import { apiClient } from "../../../core/api/client";
import {
  RoleResponseDto,
  CreateRoleDto,
  UpdateRoleDto,
  RoleListQuery,
  PermissionGroupDto,
} from "../../../core/types/role";
import { UserResponseDto } from "../../../core/types/user";

export const roleService = {
  /**
   * Retrieves a list of active dashboard security roles.
   */
  findAll: (query?: RoleListQuery): Promise<RoleResponseDto[]> => {
    return apiClient.get<RoleResponseDto[]>("/admin/roles", {
      params: query,
      suppressErrorLogging: true,
    });
  },

  /**
   * Fetches the detailed permission definitions and metadata for a single role.
   */
  findOne: (id: string): Promise<RoleResponseDto> => {
    return apiClient.get<RoleResponseDto>(`/admin/roles/${id}`, {
      suppressErrorLogging: true,
    });
  },

  /**
   * Registers a new access control role with defined permission associations.
   */
  create: (dto: CreateRoleDto): Promise<RoleResponseDto> => {
    return apiClient.post<RoleResponseDto>("/admin/roles", dto, {
      suppressErrorLogging: true,
    });
  },

  /**
   * Updates an existing role's name, description, and permission mappings.
   */
  update: (id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> => {
    return apiClient.patch<RoleResponseDto>(`/admin/roles/${id}`, dto, {
      suppressErrorLogging: true,
    });
  },

  /**
   * Deletes a role definition if no users remain assigned to it.
   */
  delete: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/roles/${id}`, {
      suppressErrorLogging: true,
    });
  },

  /**
   * Retrieves all system-wide permissions grouped by their respective functional modules.
   */
  getPermissionGroups: (): Promise<PermissionGroupDto[]> => {
    return apiClient.get<PermissionGroupDto[]>("/admin/roles/permissions", {
      suppressErrorLogging: true,
    });
  },

  /**
   * Retrieves all users assigned to a specific role.
   */
  getAssignedUsers: (roleId: string): Promise<UserResponseDto[]> => {
    return apiClient.get<UserResponseDto[]>(`/admin/roles/${roleId}/users`, {
      suppressErrorLogging: true,
    });
  },

  /**
   * Assigns a user to a specific security role.
   */
  assignUser: (roleId: string, userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/roles/${roleId}/users/${userId}`, {}, {
      suppressErrorLogging: true,
    });
  },

  /**
   * Unassigns a user from a specific role.
   */
  unassignUser: (roleId: string, userId: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/roles/${roleId}/users/${userId}`, {
      suppressErrorLogging: true,
    });
  }
};
