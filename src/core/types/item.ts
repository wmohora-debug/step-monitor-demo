import { CategoryResponseDto } from "./category";

/**
 * Payload encoded inside an item's QR Code.
 */
export interface ItemQrPayloadDto {
  type: "ITEM" | string;
  categoryId: string;
  categorySlug: string;
  itemId: string;
  itemSlug: string;
  sku: string | null;
  name: string;
  version: number;
}

/**
 * Standard Item representation.
 */
export interface ItemResponseDto {
  id: string;
  category: CategoryResponseDto;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sku: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  unit: string | null;
  isConsumable: boolean;
  qrCode: string | null; // Base64 encoded PNG data URI
  qrCodeData: ItemQrPayloadDto | null;
  qrGeneratedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new item.
 */
export interface CreateItemDto {
  categoryId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sku?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  unit?: string | null;
  isConsumable?: boolean;
}

/**
 * DTO for updating an existing item.
 */
export interface UpdateItemDto {
  categoryId?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  sku?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  unit?: string | null;
  isConsumable?: boolean;
}

/**
 * DTO for toggling an item's active status.
 */
export interface ChangeItemStatusDto {
  isActive: boolean;
}

/**
 * Query filters and pagination settings for listing items.
 */
export interface ItemListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: "active" | "inactive";
  sortBy?: "name" | "slug" | "sku" | "manufacturer" | "modelNumber" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response structure containing items.
 */
export interface PaginatedItemResponseDto {
  items: ItemResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
