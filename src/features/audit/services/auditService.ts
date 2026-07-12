import { apiClient } from "../../../core/api/client";
import { AuditLogListQuery, PaginatedAuditLogResponseDto, AuditLogResponseDto } from "../../../core/types/audit";

export const auditService = {
  /**
   * Retrieves a paginated and filtered registry of system audit logs.
   */
  findAll: (query?: AuditLogListQuery): Promise<PaginatedAuditLogResponseDto> => {
    return apiClient.get<PaginatedAuditLogResponseDto>("/admin/audit-logs", { 
      params: query,
      suppressErrorLogging: true // suppress console pollution if endpoint is 404
    });
  },

  /**
   * Fetches full metadata details for a specific log entry.
   */
  findOne: (id: string): Promise<AuditLogResponseDto> => {
    return apiClient.get<AuditLogResponseDto>(`/admin/audit-logs/${id}`, {
      suppressErrorLogging: true
    });
  }
};
