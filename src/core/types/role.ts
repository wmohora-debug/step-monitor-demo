/**
 * Individual permission node descriptor.
 */
export interface PermissionDto {
  slug: string;
  name: string;
  description: string;
}

/**
 * Module grouping of permissions (e.g. Dashboard, Schools, Users).
 */
export interface PermissionGroupDto {
  moduleName: string;
  permissions: PermissionDto[];
}

/**
 * Enterprise Access Role representation.
 */
export interface RoleResponseDto {
  id: string;
  name: string;
  description: string;
  slug: string;
  permissions: string[]; // List of authorized permission slugs
  assignedUsersCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new role.
 */
export interface CreateRoleDto {
  name: string;
  description: string;
  slug: string;
  permissions: string[];
}

/**
 * DTO for updating an existing role.
 */
export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * Query filter parameters for listing Roles.
 */
export interface RoleListQuery {
  search?: string;
  status?: string;
  sortBy?: "name" | "slug" | "createdAt";
  sortOrder?: "asc" | "desc";
}
