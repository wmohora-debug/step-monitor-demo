/**
 * Gallery response data structure representing an individual gallery record.
 */
export interface GalleryResponseDto {
  id: string;
  schoolId: string;
  schoolName: string;
  images: string[];
  title: string;
  description: any; // Typed as any to handle Swagger's description object safely
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated response envelope for Gallery listing.
 */
export interface PaginatedGalleryResponseDto {
  items: GalleryResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Query parameters for filtering, searching, and sorting galleries.
 */
export interface GalleryListQuery {
  page?: number;
  limit?: number;
  schoolId?: string;
  search?: string;
  sortBy?: "title" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
