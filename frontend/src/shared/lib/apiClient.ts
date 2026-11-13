import { tokenStorage } from "./tokenStorage";
import { ApiResponse } from "@/features/auth/types/auth.types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

export class ApiHttpError extends Error {
  public status?: number;
  public errors?: Record<string, string[]> | null;

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]> | null
  ) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.errors = errors;
  }
}

export interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Cliente HTTP centralizado, fuertemente tipado y parametrizado.
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, params, headers, ...restOptions } = options;

    const requestHeaders = new Headers(headers);
    requestHeaders.set("Accept", "application/json");

    // Inyección automática de token de autorización
    if (requiresAuth) {
      const token = tokenStorage.getToken();
      if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
      }
    }

    // Formato de cuerpo JSON
    if (
      restOptions.body &&
      !(restOptions.body instanceof FormData) &&
      !requestHeaders.has("Content-Type")
    ) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const url = this.buildUrl(endpoint, params);

    let response: Response;
    try {
      response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
      });
    } catch {
      throw new ApiHttpError(
        "No se pudo conectar con el servidor. Verifique su conexión de red.",
        0
      );
    }

    // Manejo de expiración o ausencia de sesión (401)
    if (response.status === 401) {
      tokenStorage.clear();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
      throw new ApiHttpError("Sesión expirada o no autorizada.", 401);
    }

    // Parseo de respuesta
    const json: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      message: "Respuesta del servidor no válida.",
    }));

    if (!response.ok || json.success === false) {
      const errorMsg =
        json.message ||
        (json.errors
          ? Object.values(json.errors).flat().join(" ")
          : `Error HTTP ${response.status}`);

      throw new ApiHttpError(errorMsg, response.status, json.errors);
    }

    // Si la respuesta envuelve los datos en 'data', lo extraemos; de lo contrario, retornamos el payload
    return (json.data !== undefined ? json.data : (json as unknown)) as T;
  }

  public get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { tokenStorage };
