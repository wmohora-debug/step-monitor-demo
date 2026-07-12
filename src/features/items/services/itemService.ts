import { apiClient } from "../../../core/api/client";
import {
  ItemResponseDto,
  CreateItemDto,
  UpdateItemDto,
  ChangeItemStatusDto,
  ItemListQuery,
  PaginatedItemResponseDto,
} from "../../../core/types";

export const itemService = {
  /**
   * Lists items with pagination, search, and category filtering.
   */
  findAll: (query?: ItemListQuery): Promise<PaginatedItemResponseDto> => {
    return apiClient.get<PaginatedItemResponseDto>("/admin/items", { params: query });
  },

  /**
   * Fetches details of a specific item.
   */
  findOne: (id: string): Promise<ItemResponseDto> => {
    return apiClient.get<ItemResponseDto>(`/admin/items/${id}`);
  },

  /**
   * Creates a new item and automatically triggers its QR Code generation.
   */
  create: (data: CreateItemDto): Promise<ItemResponseDto> => {
    return apiClient.post<ItemResponseDto>("/admin/items", data);
  },

  /**
   * Updates an item's description, SKU, manufacturer, etc.
   */
  update: (id: string, data: UpdateItemDto): Promise<ItemResponseDto> => {
    return apiClient.put<ItemResponseDto>(`/admin/items/${id}`, data);
  },

  /**
   * Soft deletes an item.
   */
  remove: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/items/${id}`);
  },

  /**
   * Toggles an item's active/inactive status.
   */
  changeStatus: (id: string, status: ChangeItemStatusDto): Promise<ItemResponseDto> => {
    return apiClient.patch<ItemResponseDto>(`/admin/items/${id}/status`, status);
  },

  /**
   * Triggers the regeneration of the QR code for an item.
   */
  regenerateQr: (id: string): Promise<ItemResponseDto> => {
    return apiClient.post<ItemResponseDto>(`/admin/items/${id}/regenerate-qr`, {});
  },

  /**
   * Downloads the raw QR image file as a Blob.
   */
  getQrBlob: (id: string): Promise<Blob> => {
    return apiClient.get<Blob>(`/admin/items/${id}/qr`, { responseType: "blob" });
  },
};
