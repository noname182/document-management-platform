import { apiClient, ApiHttpError } from "@/shared/lib/apiClient";
import {
  AuditLogItem,
  AuditLogQueryParams,
  CreateCategoryPayload,
  CreateDepartmentPayload,
  CreateUserPayload,
  DepartmentItem,
  DocumentCategoryItem,
  ForceUnlockPayload,
  PaginatedResponse,
  TenantDocumentItem,
  TenantUserItem,
  UpdateCategoryPayload,
  UpdateDepartmentPayload,
  UpdateUserPayload,
} from "../types/tenant.types";

export { ApiHttpError as TenantError };

/**
 * Servicio HTTP aislado para el rol TENANT_ADMIN.
 * Gestiona catálogos de organización, usuarios, gobernanza de candados y auditoría forense.
 */
export const tenantService = {
  // =========================================================================
  // 1. Departamentos
  // =========================================================================

  /**
   * Obtiene la lista completa de departamentos del tenant con conteos de usuarios y categorías.
   */
  async getDepartments(): Promise<DepartmentItem[]> {
    return apiClient.get<DepartmentItem[]>("/departments");
  },

  /**
   * Crea un nuevo departamento en el tenant.
   */
  async createDepartment(
    payload: CreateDepartmentPayload
  ): Promise<DepartmentItem> {
    return apiClient.post<DepartmentItem>("/departments", payload);
  },

  /**
   * Actualiza el nombre de un departamento.
   */
  async updateDepartment(
    id: string,
    payload: UpdateDepartmentPayload
  ): Promise<DepartmentItem> {
    return apiClient.patch<DepartmentItem>(`/departments/${id}`, payload);
  },

  /**
   * Elimina un departamento si no tiene categorías documentales vinculadas.
   */
  async deleteDepartment(id: string): Promise<void> {
    return apiClient.delete<void>(`/departments/${id}`);
  },

  // =========================================================================
  // 2. Categorías Documentales
  // =========================================================================

  /**
   * Obtiene las categorías documentales del tenant con su departamento y conteo de documentos.
   */
  async getCategories(): Promise<DocumentCategoryItem[]> {
    return apiClient.get<DocumentCategoryItem[]>("/categories");
  },

  /**
   * Crea una nueva categoría documental asociada a un departamento.
   */
  async createCategory(
    payload: CreateCategoryPayload
  ): Promise<DocumentCategoryItem> {
    return apiClient.post<DocumentCategoryItem>("/categories", payload);
  },

  /**
   * Actualiza una categoría documental existente.
   */
  async updateCategory(
    id: string,
    payload: UpdateCategoryPayload
  ): Promise<DocumentCategoryItem> {
    return apiClient.patch<DocumentCategoryItem>(`/categories/${id}`, payload);
  },

  /**
   * Elimina una categoría si no contiene documentos registrados.
   */
  async deleteCategory(id: string): Promise<void> {
    return apiClient.delete<void>(`/categories/${id}`);
  },

  // =========================================================================
  // 3. Usuarios y Roles del Tenant
  // =========================================================================

  /**
   * Obtiene los usuarios pertenecientes al tenant paginados.
   */
  async getUsers(page = 1): Promise<PaginatedResponse<TenantUserItem>> {
    return apiClient.get<PaginatedResponse<TenantUserItem>>("/users", {
      params: { page },
    });
  },

  /**
   * Crea un nuevo usuario en el tenant y asigna su rol.
   */
  async createUser(payload: CreateUserPayload): Promise<TenantUserItem> {
    return apiClient.post<TenantUserItem>("/users", payload);
  },

  /**
   * Actualiza nombre, departamento, rol o estado (ACTIVE/SUSPENDED) de un usuario.
   */
  async updateUser(
    id: string,
    payload: UpdateUserPayload
  ): Promise<TenantUserItem> {
    return apiClient.patch<TenantUserItem>(`/users/${id}`, payload);
  },

  /**
   * Suspende a un usuario y revoca sus tokens activos (baja lógica segura).
   */
  async deleteUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  },

  // =========================================================================
  // 4. Documentos y Gobernanza de Candados
  // =========================================================================

  /**
   * Obtiene la lista paginada de documentos del tenant con sus versiones y estado de candado.
   */
  async getDocuments(
    page = 1
  ): Promise<PaginatedResponse<TenantDocumentItem>> {
    return apiClient.get<PaginatedResponse<TenantDocumentItem>>("/documents", {
      params: { page },
    });
  },

  /**
   * Libera forzosamente el candado de edición de un documento bloqueado (exclusivo TENANT_ADMIN).
   */
  async forceUnlockDocument(
    id: string,
    payload: ForceUnlockPayload
  ): Promise<TenantDocumentItem> {
    return apiClient.post<TenantDocumentItem>(
      `/documents/${id}/force-unlock`,
      payload
    );
  },

  // =========================================================================
  // 5. Bitácora Forense
  // =========================================================================

  /**
   * Obtiene los registros de auditoría forense inmutable del tenant con filtros opcionales.
   */
  async getAuditLogs(
    params?: AuditLogQueryParams
  ): Promise<PaginatedResponse<AuditLogItem>> {
    return apiClient.get<PaginatedResponse<AuditLogItem>>("/audit-logs", {
      params: {
        action: params?.action,
        document_id: params?.document_id,
        page: params?.page,
      },
    });
  },
};
