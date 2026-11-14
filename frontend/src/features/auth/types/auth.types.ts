/**
 * Tipos de datos para el módulo de autenticación.
 * Alineados con el contrato del backend (Laravel Sanctum + Core API).
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TenantInfo {
  id: string | number;
  slug: string;
}


export interface UserDepartmentSummary {
  id: string;
  name: string;
  is_primary?: boolean;
}

export interface AuthUser {
  id: string | number;
  email: string;
  full_name: string;
  tenant: TenantInfo | null;
  departments: UserDepartmentSummary[];
  department_ids: string[];
  roles: (number | string)[];
  permissions: string[];
}

export interface LoginResponseData {
  token_type: string;
  access_token: string;
  user: AuthUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]> | null;
}

export interface FormValidationErrors {
  email?: string;
  password?: string;
}

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string | null;
  initialValues?: Partial<LoginCredentials>;
  forgotPasswordHref?: string;
  registerHref?: string;
}
