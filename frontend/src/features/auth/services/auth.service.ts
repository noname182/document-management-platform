import {
  ApiResponse,
  AuthUser,
  LoginCredentials,
  LoginResponseData,
} from "../types/auth.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "auth_user",
} as const;

export class AuthError extends Error {
  public status?: number;
  public errors?: Record<string, string[]> | null;

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]> | null
  ) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Capa de almacenamiento local seguro para tokens y sesión (SSR friendly).
 */
export const tokenStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },

  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};

/**
 * Servicio desacoplado para interactuar con los endpoints de autenticación de Laravel Core API.
 */
export const authService = {
  /**
   * Inicia sesión contra POST /api/v1/auth/login.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const result: ApiResponse<LoginResponseData> = await response.json().catch(
        () => ({
          success: false,
          message: "Error de formato en la respuesta del servidor.",
        })
      );

      if (!response.ok || !result.success || !result.data) {
        // Manejo de errores de validación de Laravel (422) o throttling (429) o credenciales (401)
        const errorMsg =
          result.message ||
          (result.errors
            ? Object.values(result.errors).flat().join(" ")
            : "No fue posible iniciar sesión. Verifique sus credenciales.");

        throw new AuthError(errorMsg, response.status, result.errors);
      }

      // Persistir token y datos de usuario
      tokenStorage.setToken(result.data.access_token);
      tokenStorage.setUser(result.data.user);

      return result.data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      // Errores de red u orígenes cruzados (CORS / Servidor apagado)
      throw new AuthError(
        "No se pudo conectar con el servidor de autenticación. Verifique su conexión.",
        0
      );
    }
  },

  /**
   * Obtiene la información del usuario autenticado (GET /api/v1/auth/me).
   */
  async getMe(): Promise<AuthUser> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AuthError("No existe un token de sesión activo.", 401);
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const result: ApiResponse<AuthUser> = await response.json().catch(() => ({
      success: false,
      message: "Respuesta inválida del servidor.",
    }));

    if (!response.ok || !result.success || !result.data) {
      throw new AuthError(
        result.message || "Error al obtener datos del usuario.",
        response.status
      );
    }

    tokenStorage.setUser(result.data);
    return result.data;
  },

  /**
   * Cierra la sesión activa revocando el token en el backend (POST /api/v1/auth/logout).
   */
  async logout(): Promise<void> {
    const token = tokenStorage.getToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      }
    } finally {
      tokenStorage.clear();
    }
  },
};
