---
name: laravel-abac-vault
description: Reglas de arquitectura, multi-tenancy, control de versiones, flujo de aprobación/rechazo y auditoría forense para el backend Core API en Laravel (services/core-api) y su integración con frontend.
---

# Convenciones del Proyecto (doc-platform)

1. **Aislamiento Multi-Tenant (`BelongsToTenant`):**
   - Todos los modelos de negocio (`User`, `Department`, `DocumentCategory`, `Document`, `DocumentVersion`, `AuditLog`) aplican el global scope `BelongsToTenant` filtrado por `tenant_id`.
   - Solo `SystemController` y `TenantController` (rol `SYSTEM_ADMIN`) pueden usar `withoutGlobalScopes()`.

2. **Formato de Respuestas (`ApiResponse`):**
   - Todos los controladores en `services/core-api/app/Http/Controllers` deben usar el trait `App\Traits\ApiResponse` (`$this->success($data, $message, $code)` y `$this->error($message, $code)`).

3. **Inmutabilidad Documental, Concurrencia y Aprobaciones:**
   - Ninguna versión (`DocumentVersion`) se sobrescribe ni se borra físicamente. Toda modificación crea una nueva versión incremental (`v1`, `v2`, `v3`...) tras adquirir candado pesimista (`checkout` -> `checkin`).
   - El rollback es **Forward-Rollback**: crea una nueva versión (`vN+1`) apuntando al binario histórico seleccionado.
   - El rol `APPROVER` aprueba (`APPROVED`) o rechaza (`REJECTED` con motivo obligatorio) versiones sin sobrescribir el historial.

4. **Bitácora Forense (`audit_logs`):**
   - Toda mutación de estado (subida, check-out, check-in, aprobación, rechazo, rollback, descarga) debe insertar un registro en `audit_logs` con `user_id`, `tenant_id`, `document_id`, `action`, `ip_address` y `metadata` (JSON).

5. **Almacenamiento MinIO (`doc-processor`):**
   - Todo binario se procesa primero en `services/doc-processor` (`:3001`), se valida por magic bytes + SHA-256, y se guarda aislado bajo `<tenantSlug>/<año>/<timestamp>-<filename>` en `processed-documents`.