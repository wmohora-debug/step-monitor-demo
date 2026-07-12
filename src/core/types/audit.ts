/**
 * Supported Audit Action types.
 */
export type AuditActionType = "create" | "update" | "delete" | "login" | "logout" | "permission_change";

/**
 * Standard Audit Log entry schema.
 */
export interface AuditLogResponseDto {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditActionType;
  entity: string;
  entityId: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  device: string | null;
  status: "success" | "failure";
  createdAt: string;
}

/**
 * Query filter parameters for listing Audit Logs.
 */
export interface AuditLogListQuery {
  page?: number;
  limit?: number;
  search?: string;
  action?: AuditActionType;
  entity?: string;
  status?: "success" | "failure";
  userId?: string;
  roleSlug?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "action" | "entity" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response container for Audit Logs.
 */
export interface PaginatedAuditLogResponseDto {
  items: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
