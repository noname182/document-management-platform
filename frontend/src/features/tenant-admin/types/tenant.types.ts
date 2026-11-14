/**
 * Tipos de datos e interfaces para el dominio TENANT_ADMIN.
 * Plataforma Documental Multi-Tenant de Grado Corporativo.
 */

// ==========================================
// 1. Departamentos
// ==========================================
export interface DepartmentItem {
  id: string;
  tenant_id: string;
  name: string;
  users_count?: number;
  categories_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDepartmentPayload {
  name: string;
}

export interface UpdateDepartmentPayload {
  name: string;
}

// ==========================================
// 2. Categorías Documentales
// ==========================================
export interface DocumentCategoryItem {
  id: string;
  tenant_id: string;
  department_id: string;
  name: string;
  description?: string | null;
  department?: {
    id: string;
    name: string;
  };
  documents_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryPayload {
  name: string;
  department_id: string;
  description?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  department_id?: string;
  description?: string | null;
}

// ==========================================
// 3. Usuarios y Roles del Tenant
// ==========================================
export type TenantUserRole = "TENANT_ADMIN" | "APPROVER" | "EDITOR" | "VIEWER";

export interface TenantUserRoleInfo {
  id: string;
  name: string;
}

export interface TenantUserItem {
  id: string;
  tenant_id: string;
  department_id?: string | null;
  full_name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED";
  department?: {
    id: string;
    name: string;
  } | null;
  roles?: TenantUserRoleInfo[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password: string;
  role_id: TenantUserRole;
  department_id?: string | null;
}

export interface UpdateUserPayload {
  full_name?: string;
  status?: "ACTIVE" | "SUSPENDED";
  role_id?: TenantUserRole;
  department_id?: string | null;
}

// ==========================================
// 4. Documentos y Gobernanza de Candados
// ==========================================
export interface DocumentVersionInfo {
  id: string;
  version_number: number;
  original_filename: string;
  file_size_bytes: number;
  sha256_hash: string;
  mime_type?: string;
  status?: string;
  created_at?: string;
}

export interface LockerUserInfo {
  id: string;
  full_name: string;
  email: string;
}

export interface TenantDocumentItem {
  id: string;
  tenant_id: string;
  category_id: string;
  title: string;
  is_locked: boolean;
  locked_at?: string | null;
  locked_by_user_id?: string | null;
  current_version_id?: string | null;
  category?: {
    id: string;
    name: string;
  };
  current_version?: DocumentVersionInfo | null;
  locked_by?: LockerUserInfo | null;
  created_at?: string;
  updated_at?: string;
}

export interface ForceUnlockPayload {
  reason: string;
}

// ==========================================
// 5. Bitácora Forense Inmutable
// ==========================================
export interface AuditLogItem {
  id: string;
  tenant_id: string;
  document_id?: string | null;
  version_id?: string | null;
  user_id?: string | null;
  action: string;
  sha256_hash?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  document?: {
    id: string;
    title: string;
  } | null;
}

export interface AuditLogQueryParams {
  action?: string;
  document_id?: string;
  page?: number;
}

// ==========================================
// 6. Respuestas Paginadas y Métricas
// ==========================================
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface TenantDashboardSummary {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  totalCategories: number;
  totalDocuments: number;
  lockedDocuments: number;
}
