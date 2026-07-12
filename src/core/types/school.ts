/**
 * Schema payload embedded within a school's generated QR code.
 */
export interface SchoolQrPayloadDto {
  schoolId: string;
  schoolCode: string;
}

/**
 * Standard School Profile representation.
 */
export interface SchoolResponseDto {
  id: string;
  schoolId: string; // alphanumeric identifier (e.g. AB123XYZ)
  schoolName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  website: string | null;
  logo: string | null;
  qrCode: string | null; // Base64 encoded PNG data URI
  qrCodeData: SchoolQrPayloadDto | null;
  qrGeneratedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new school.
 */
export interface CreateSchoolDto {
  schoolId?: string; // Optional 8-character uppercase alphanumeric identifier
  schoolName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  website?: string | null;
  logo?: string | null;
}

/**
 * DTO for updating a school profile.
 */
export interface UpdateSchoolDto {
  schoolId?: string;
  schoolName?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  website?: string | null;
  logo?: string | null;
}

/**
 * DTO for toggling a school's active status.
 */
export interface ChangeSchoolStatusDto {
  isActive: boolean;
}

/**
 * Query filters and pagination settings for listing schools.
 */
export interface SchoolListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
  sortBy?: "schoolName" | "schoolId" | "email" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response structure containing school items.
 */
export interface PaginatedSchoolResponseDto {
  items: SchoolResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
