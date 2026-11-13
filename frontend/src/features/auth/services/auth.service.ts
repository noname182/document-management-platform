import { apiClient, ApiHttpError, tokenStorage } from "@/shared/lib/apiClient";
import {
  AuthUser,
  LoginCredentials,
  LoginResponseData,
} from "../types/auth.types";

export { ApiHttpError as AuthError, tokenStorage };

/**
 * Servicio de autenticación desacoplado que utiliza apiClient compartido.
 */
export const authService = {
  /**
   * Inicia sesión contra POST /api/v1/auth/login.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    try {
      const data = await apiClient.post<LoginResponseData>(
        "/auth/login",
        credentials,
        { requiresAuth: false }
      );

      // Persistir token y datos de usuario en almacenamiento local
      tokenStorage.setToken(data.access_token);
      tokenStorage.setUser(data.user);

      return data;
    } catch (error) {
      if (error instanceof ApiHttpError) {
        throw error;
      }
      throw new ApiHttpError(
        "No se pudo conectar con el servidor de autenticación.",
        0
      );
    }
  },

  /**
   * Obtiene la información del usuario autenticado (GET /api/v1/auth/me).
   */
  async getMe(): Promise<AuthUser> {
    const user = await apiClient.get<AuthUser>("/auth/me");
    tokenStorage.setUser(user);
    return user;
  },

  /**
   * Cierra la sesión activa revocando el token en el backend (POST /api/v1/auth/logout).
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<void>("/auth/logout");
    } finally {
      tokenStorage.clear();
    }
  },
};
