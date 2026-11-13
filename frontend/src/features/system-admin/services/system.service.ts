import { apiClient, ApiHttpError } from "@/shared/lib/apiClient";
import {
  CreateTenantPayload,
  CreateTenantResponseData,
  SystemOverviewData,
  TenantItem,
  UpdateTenantPayload,
  UpdateTenantStatusPayload,
} from "../types/system.types";

export { ApiHttpError as SystemError };

/**
 * Cliente HTTP para la Consola de Plataforma y Gestión de Tenants utilizando apiClient compartido.
 */
export const systemService = {
  /**
   * Obtiene la telemetría global del sistema y estado de nodos.
   */
  async getOverview(): Promise<SystemOverviewData> {
    return apiClient.get<SystemOverviewData>("/system/overview");
  },

  /**
   * Lista todas las organizaciones (Tenants) registradas con sus agregados.
   */
  async getTenants(): Promise<TenantItem[]> {
    return apiClient.get<TenantItem[]>("/tenants");
  },

  /**
   * Aprovisiona atómicamente una nueva organización y su administrador inicial.
   */
  async createTenant(
    payload: CreateTenantPayload
  ): Promise<CreateTenantResponseData> {
    return apiClient.post<CreateTenantResponseData>("/tenants", payload);
  },

  /**
   * Actualiza el estado de una organización (ACTIVE o SUSPENDED).
   */
  async updateTenantStatus(
    id: string,
    status: "ACTIVE" | "SUSPENDED"
  ): Promise<TenantItem> {
    const payload: UpdateTenantStatusPayload = { status };
    return apiClient.patch<TenantItem>(`/tenants/${id}/status`, payload);
  },

  /**
   * Actualiza los datos de una organización (Tenant).
   */
  async updateTenant(
    id: string,
    payload: UpdateTenantPayload
  ): Promise<TenantItem> {
    return apiClient.patch<TenantItem>(`/tenants/${id}`, payload);
  },
};
