export interface VaultDepartment {
  id: string;
  name: string;
  is_primary?: boolean;
}

export interface VaultCategory {
  id: string;
  tenant_id: string;
  department_id: string;
  name: string;
  description?: string | null;
  department?: {
    id: string;
    name: string;
  };
}

export interface DocumentUserRef {
  id: string;
  full_name: string;
  email: string;
}

export interface DocumentVersionItem {
  id: string;
  document_id: string;
  version_number: number;
  status: "UPLOADING" | "ACTIVE" | "DEPRECATED" | string;
  storage_bucket: string;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  change_summary?: string | null;
  created_by: string;
  created_at: string;
  creator?: DocumentUserRef | null;
}

export interface VaultDocumentItem {
  id: string;
  tenant_id: string;
  category_id: string;
  title: string;
  current_version_id?: string | null;
  is_locked: boolean;
  locked_by_user_id?: string | null;
  locked_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
    department_id?: string;
    department?: {
      id: string;
      name: string;
    };
  };
  current_version?: DocumentVersionItem | null;
  locked_by?: DocumentUserRef | null;
  creator?: DocumentUserRef | null;
}

export interface VaultAuditLogItem {
  id: string;
  tenant_id: string;
  document_id?: string | null;
  version_id?: string | null;
  user_id?: string | null;
  action: string;
  sha256_hash?: string | null;
  ip_address?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  user?: DocumentUserRef | null;
  document?: {
    id: string;
    title: string;
  } | null;
}

export interface ProcessorUploadResult {
  hashSha256: string;
  mimeType: string;
  quarantineLocation: string;
  storageLocation: string;
  auditLogRecord: string;
}

export interface PaginatedVaultResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}