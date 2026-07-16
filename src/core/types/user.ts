/**
 * User Role DTO representation.
 */
export interface UserRoleResponseDto {
  id: string;
  name: string;
  slug: "admin" | "user" | string;
}

/**
 * Standard User Account representation.
 */
export interface UserResponseDto {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  role: UserRoleResponseDto;
  schoolId: string | null;
  selectedClassroomId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new user or administrator.
 */
export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  password?: string;
  profileImage?: string | null;
  isActive?: boolean;
  roleSlug: "superadmin" | "admin" | "user";
  schoolId?: string | null;
}

/**
 * DTO for updating an existing user.
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  profileImage?: string | null;
  roleSlug?: "superadmin" | "admin" | "user";
  schoolId?: string | null;
}

/**
 * DTO for modifying a user's active status.
 */
export interface ChangeUserStatusDto {
  isActive: boolean;
}

/**
 * Query parameters for fetching and filtering users.
 */
export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
  roleSlug?: "superadmin" | "admin" | "user";
  sortBy?: "firstName" | "lastName" | "email" | "phone" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response structure for users list.
 */
export interface PaginatedUserResponseDto {
  items: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
