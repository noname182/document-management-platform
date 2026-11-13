import { ApiResponse } from "@/features/auth/types/auth.types";
import { tokenStorage } from "@/features/auth/services/auth.service";
import {
  CreateTenantPayload,
  CreateTenantResponseData,
  SystemOverviewData,
  TenantItem,
  UpdateTenantStatusPayload,
} from "../types/system.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

export class SystemError extends Error {
  public status?: number;
  public errors?: Record<string, string[]> | null;

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]> | null
  ) {
    super(message);
    this.name = "SystemError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Cliente HTTP aislado para la Consola de Plataforma y Gestión de Tenants.
 */
export const systemService = {
  /**
   * Obtiene la telemetría global del sistema y estado de nodos.
   */
  async getOverview(): Promise<SystemOverviewData> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new SystemError("No existe un token de sesión activo.", 401);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/system/overview`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result: ApiResponse<SystemOverviewData> = await response
        .json()
        .catch(() => ({
          success: false,
          message: "Formato de respuesta inválido del servidor.",
        }));

      if (!response.ok || !result.success || !result.data) {
        throw new SystemError(
          result.message || "Error al obtener las métricas del sistema.",
          response.status,
          result.errors
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof SystemError) throw error;
      throw new SystemError(
        "No se pudo conectar con el endpoint de métricas del sistema.",
        0
      );
    }
  },

  /**
   * Lista todas las organizaciones (Tenants) registradas con sus agregados.
   */
  async getTenants(): Promise<TenantItem[]> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new SystemError("No existe un token de sesión activo.", 401);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result: ApiResponse<TenantItem[]> = await response
        .json()
        .catch(() => ({
          success: false,
          message: "Formato de respuesta inválido del servidor.",
        }));

      if (!response.ok || !result.success || !result.data) {
        throw new SystemError(
          result.message || "Error al obtener el listado de organizaciones.",
          response.status,
          result.errors
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof SystemError) throw error;
      throw new SystemError(
        "No se pudo conectar con el endpoint de organizaciones.",
        0
      );
    }
  },

  /**
   * Aprovisiona atómicamente una nueva organización y su administrador inicial.
   */
  async createTenant(
    payload: CreateTenantPayload
  ): Promise<CreateTenantResponseData> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new SystemError("No existe un token de sesión activo.", 401);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<CreateTenantResponseData> = await response
        .json()
        .catch(() => ({
          success: false,
          message: "Formato de respuesta inválido del servidor.",
        }));

      if (!response.ok || !result.success || !result.data) {
        const errorMsg =
          result.message ||
          (result.errors
            ? Object.values(result.errors).flat().join(" ")
            : "Error al aprovisionar la organización.");

        throw new SystemError(errorMsg, response.status, result.errors);
      }

      return result.data;
    } catch (error) {
      if (error instanceof SystemError) throw error;
      throw new SystemError(
        "No se pudo completar el aprovisionamiento de la organización.",
        0
      );
    }
  },

  /**
   * Actualiza el estado de una organización (ACTIVE o SUSPENDED).
   */
  async updateTenantStatus(
    id: string,
    status: "ACTIVE" | "SUSPENDED"
  ): Promise<TenantItem> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new SystemError("No existe un token de sesión activo.", 401);
    }

    try {
      const payload: UpdateTenantStatusPayload = { status };
      const response = await fetch(`${API_BASE_URL}/tenants/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<TenantItem> = await response
        .json()
        .catch(() => ({
          success: false,
          message: "Formato de respuesta inválido del servidor.",
        }));

      if (!response.ok || !result.success || !result.data) {
        const errorMsg =
          result.message ||
          (result.errors
            ? Object.values(result.errors).flat().join(" ")
            : "No fue posible actualizar el estado de la organización.");

        throw new SystemError(errorMsg, response.status, result.errors);
      }

      return result.data;
    } catch (error) {
      if (error instanceof SystemError) throw error;
      throw new SystemError(
        "No se pudo comunicar con el servidor para actualizar el estado.",
        0
      );
    }
  },
};
