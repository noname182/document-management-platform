import { AuthUser } from "@/features/auth/types/auth.types";

const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "auth_user",
} as const;

/**
 * Capa de almacenamiento seguro para tokens y sesión (SSR friendly).
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
