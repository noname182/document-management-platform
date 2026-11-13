/**
 * Tipos de datos estrictos para el módulo de Administración de Infraestructura y Tenants.
 * Alineados con SystemController.php y TenantController.php del Core API.
 */

export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export interface SystemServicesOverview {
  core_api: NodeStatus;
  database: NodeStatus;
  doc_processor: NodeStatus;
  minio_storage: NodeStatus;
}

export interface SystemStatsOverview {
  tenants_total: number;
  tenants_active: number;
  users_total: number;
  documents_total: number;
  versions_total: number;
  storage_bytes: number;
  locked_documents: number;
}

export interface SystemOverviewData {
  services: SystemServicesOverview;
  stats: SystemStatsOverview;
}

export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
  users_count?: number;
  departments_count?: number;
  documents_count?: number;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface CreateTenantAdminInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface CreateTenantResponseData {
  tenant: TenantItem;
  admin: CreateTenantAdminInfo;
}

export interface UpdateTenantStatusPayload {
  status: 'ACTIVE' | 'SUSPENDED';
}
