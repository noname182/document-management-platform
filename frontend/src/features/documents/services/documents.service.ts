import {
  apiClient,
  ApiHttpError,
  API_BASE_URL,
  tokenStorage,
} from "@/shared/lib/apiClient";
import {
  VaultDocumentItem,
  DocumentVersionItem,
  VaultCategory,
  VaultAuditLogItem,
  ProcessorUploadResult,
  PaginatedVaultResponse,
} from "../types/documents.types";

//solo de prueba, borrar despues
const resolveHost = () =>
  typeof window !== "undefined" ? window.location.hostname : "localhost";

//cexport const PROCESSOR_BASE_URL =
//  process.env.NEXT_PUBLIC_PROCESSOR_URL?.replace(/\/$/, "") ||
//  "http://localhost:3001";

export const PROCESSOR_BASE_URL =
  process.env.NEXT_PUBLIC_PROCESSOR_URL?.replace(/\/$/, "") ||
  `http://${resolveHost()}:3001`;

export class DocumentVaultError extends Error {
  public status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "DocumentVaultError";
    this.status = status;
  }
}

export const documentsService = {
  async getDocuments(params?: {
    department_id?: string;
    category_id?: string;
    page?: number;
  }): Promise<PaginatedVaultResponse<VaultDocumentItem>> {
    try {
      return await apiClient.get<PaginatedVaultResponse<VaultDocumentItem>>(
        "/documents",
        { params }
      );
    } catch (err) {
      throw this.mapError(err, "Error al cargar los expedientes de la bóveda.");
    }
  },

  async getDocumentDetail(id: string): Promise<VaultDocumentItem> {
    try {
      return await apiClient.get<VaultDocumentItem>(`/documents/${id}`);
    } catch (err) {
      throw this.mapError(err, "Error al obtener el detalle del documento.");
    }
  },

  async getDocumentVersions(id: string): Promise<DocumentVersionItem[]> {
    try {
      return await apiClient.get<DocumentVersionItem[]>(
        `/documents/${id}/versions`
      );
    } catch (err) {
      throw this.mapError(err, "Error al obtener el historial de versiones.");
    }
  },

  async getCategories(): Promise<VaultCategory[]> {
    try {
      return await apiClient.get<VaultCategory[]>("/categories");
    } catch (err) {
      throw this.mapError(err, "Error al cargar las categorías documentales.");
    }
  },

  async getAuditLogs(params?: {
    document_id?: string;
    page?: number;
  }): Promise<PaginatedVaultResponse<VaultAuditLogItem>> {
    try {
      return await apiClient.get<PaginatedVaultResponse<VaultAuditLogItem>>(
        "/audit-logs",
        { params }
      );
    } catch (err) {
      throw this.mapError(err, "Error al consultar la bitácora forense.");
    }
  },

  /**
   * Descarga auditada del binario físico desde MinIO a través de Laravel (ABAC + Bitácora).
   */
  async downloadVersion(
    documentId: string,
    versionId: string,
    fallbackFilename: string
  ): Promise<void> {
    const token = tokenStorage.getToken();
    const url = `${API_BASE_URL}/documents/${documentId}/versions/${versionId}/download`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      throw new DocumentVaultError(
        "No se pudo conectar con el servidor para descargar el archivo.",
        0
      );
    }

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new DocumentVaultError(
        json.message ||
          `No se pudo descargar el archivo (HTTP ${response.status}).`,
        response.status
      );
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fallbackFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * 1. Sube el archivo binario al microservicio NestJS (doc-processor) para cuarentena,
   *    validación de bytes reales, cálculo SHA-256 y promoción a MinIO.
   */
  async uploadToProcessor(file: File): Promise<ProcessorUploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    // un flag
    const tenantSlug = tokenStorage.getUser()?.tenant?.slug;
    if (tenantSlug) {
      formData.append("tenantSlug", tenantSlug);
    }

    let response: Response;
    try {
      response = await fetch(`${PROCESSOR_BASE_URL}/documents/process`, {
        method: "POST",
        body: formData,
      });
    } catch {
      throw new DocumentVaultError(
        "No se pudo conectar con el microservicio de procesamiento (doc-processor :3001).",
        0
      );
    }

    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.status !== "success") {
      throw new DocumentVaultError(
        json.message ||
          "El archivo fue rechazado por el inspector de seguridad.",
        response.status
      );
    }

    return json.data as ProcessorUploadResult;
  },

  /**
   * 2. Crea el expediente en Laravel y, si se adjuntó archivo inicial,
   *    lo procesa en NestJS y consolida automáticamente la v1 mediante check-in.
   */
  async createDocumentWithInitialFile(payload: {
    title: string;
    category_id: string;
    file?: File | null;
    change_summary?: string;
  }): Promise<VaultDocumentItem> {
    try {
      const created = await apiClient.post<VaultDocumentItem>("/documents", {
        title: payload.title,
        category_id: payload.category_id,
      });

      if (payload.file) {
        const processed = await this.uploadToProcessor(payload.file);
        await this.checkin(created.id, {
          storage_key: processed.storageLocation,
          storage_bucket: "processed-documents",
          original_filename: payload.file.name,
          mime_type:
            processed.mimeType ||
            payload.file.type ||
            "application/octet-stream",
          file_size_bytes: payload.file.size,
          sha256_hash: processed.hashSha256,
          change_summary: payload.change_summary || "Carga inicial v1",
        });
      }

      return created;
    } catch (err) {
      throw this.mapError(err, "Error al registrar el nuevo expediente.");
    }
  },

  async checkout(id: string, reason?: string): Promise<VaultDocumentItem> {
    try {
      return await apiClient.post<VaultDocumentItem>(
        `/documents/${id}/checkout`,
        { reason: reason || "Edición de documento" }
      );
    } catch (err) {
      throw this.mapError(
        err,
        "No se pudo adquirir el candado. Es posible que otro usuario lo haya bloqueado."
      );
    }
  },

  async discardCheckout(id: string): Promise<void> {
    try {
      await apiClient.post(`/documents/${id}/discard-checkout`);
    } catch (err) {
      throw this.mapError(err, "Error al liberar el candado de edición.");
    }
  },

  async checkin(
    id: string,
    payload: {
      storage_key: string;
      storage_bucket?: string;
      original_filename: string;
      mime_type: string;
      file_size_bytes: number;
      sha256_hash: string;
      change_summary?: string;
    }
  ): Promise<DocumentVersionItem> {
    try {
      return await apiClient.post<DocumentVersionItem>(
        `/documents/${id}/checkin`,
        payload
      );
    } catch (err) {
      throw this.mapError(err, "Error al consolidar la nueva versión.");
    }
  },

  async rollback(
    id: string,
    targetVersionId: string,
    reason: string
  ): Promise<DocumentVersionItem> {
    try {
      return await apiClient.post<DocumentVersionItem>(
        `/documents/${id}/rollback`,
        {
          target_version_id: targetVersionId,
          reason,
        }
      );
    } catch (err) {
      throw this.mapError(err, "Error al ejecutar el Forward-Rollback.");
    }
  },

  mapError(err: unknown, fallback: string): DocumentVaultError {
    if (err instanceof DocumentVaultError) return err;
    if (err instanceof ApiHttpError) {
      return new DocumentVaultError(err.message, err.status);
    }
    if (err instanceof Error) {
      return new DocumentVaultError(err.message);
    }
    return new DocumentVaultError(fallback);
  },
};