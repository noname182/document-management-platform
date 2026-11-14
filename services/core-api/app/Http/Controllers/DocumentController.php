<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentAuditLog;
use App\Models\DocumentVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * Listado paginado de documentos del tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $documents = Document::with(['category', 'currentVersion', 'lockedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->success($documents);
    }

    /**
     * Detalle de un documento específico.
     */
    public function show(string $id): JsonResponse
    {
        $document = Document::with(['category', 'currentVersion', 'lockedBy', 'creator'])
            ->findOrFail($id);

        return $this->success($document);
    }

    /**
     * Historial inmutable de versiones de un documento.
     */
    public function versions(string $id): JsonResponse
    {
        $document = Document::findOrFail($id);

        $versions = $document->versions()
            ->with('creator:id,full_name,email')
            ->get();

        return $this->success($versions);
    }

    /**
     * Creación de metadatos de un nuevo documento.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|uuid|exists:document_categories,id',
            'title'       => 'required|string|max:255',
        ]);

        $document = Document::create([
            'tenant_id'          => $this->currentTenantId(),
            'category_id'        => $validated['category_id'],
            'title'              => $validated['title'],
            'current_version_id' => null,
            'is_locked'          => false,
            'created_by'         => $this->currentUserId(),
        ]);

        return $this->success($document, 'Documento registrado exitosamente.', 201);
    }

    /**
     * Check-out: Activa candado pesimista sobre el documento (HTTP 423 si ya está tomado).
     */
    public function checkout(Request $request, string $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            // Candado pesimista a nivel de fila en PostgreSQL
            $document = Document::lockForUpdate()->findOrFail($id);

            if ($document->is_locked) {
                return $this->error(
                    "El documento está bloqueado por otro usuario desde {$document->locked_at}.",
                    423 // Locked
                );
            }

            $user = $request->user();

            $document->update([
                'is_locked'         => true,
                'locked_by_user_id' => $user->id,
                'locked_at'         => now(),
            ]);

            // Auditoría inmutable de adquisición de candado
            DocumentAuditLog::create([
                'id'          => Str::uuid()->toString(),
                'tenant_id'   => $document->tenant_id,
                'document_id' => $document->id,
                'version_id'  => $document->current_version_id,
                'user_id'     => $user->id,
                'action'      => 'LOCK_ACQUIRED',
                'sha256_hash' => null,
                'ip_address'  => $request->ip() ?? '127.0.0.1',
                'user_agent'  => $request->userAgent(),
                'details'     => ['reason' => $request->input('reason', 'Edición solicitada')],
                'created_at'  => now(),
            ]);

            return $this->success($document, 'Candado de edición adquirido exitosamente.');
        });
    }

    /**
     * Discard Check-out / Force Unlock: Libera el candado del documento.
     */
    public function discardCheckout(Request $request, string $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $document = Document::lockForUpdate()->findOrFail($id);

            if (! $document->is_locked) {
                return $this->error('El documento no se encuentra bloqueado.', 400);
            }

            $user = $request->user();
            $isOwner = $document->locked_by_user_id === $user->id;
            $hasForceUnlock = $user->hasRole('TENANT_ADMIN') || $user->hasRole('SYSTEM_ADMIN');

            if (! $isOwner && ! $hasForceUnlock) {
                return $this->error('No tiene autorización para liberar un candado ajeno.', 403);
            }

            $action = $isOwner ? 'LOCK_RELEASED' : 'FORCE_UNLOCK';

            $document->update([
                'is_locked'         => false,
                'locked_by_user_id' => null,
                'locked_at'         => null,
            ]);

            DocumentAuditLog::create([
                'id'          => Str::uuid()->toString(),
                'tenant_id'   => $document->tenant_id,
                'document_id' => $document->id,
                'version_id'  => $document->current_version_id,
                'user_id'     => $user->id,
                'action'      => $action,
                'sha256_hash' => null,
                'ip_address'  => $request->ip() ?? '127.0.0.1',
                'user_agent'  => $request->userAgent(),
                'details'     => ['liberado_por' => $user->email],
                'created_at'  => now(),
            ]);

            return $this->success(null, "Documento liberado exitosamente ({$action}).");
        });
    }

    /**
     * Forward-Rollback: Restaura una versión histórica creando una nueva versión Vn+1
     * reutilizando el SHA-256 original sin duplicar espacio en MinIO.
     */
    public function rollback(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'target_version_id' => 'required|uuid|exists:document_versions,id',
            'reason'            => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $document = Document::lockForUpdate()->findOrFail($id);

            if ($document->is_locked && $document->locked_by_user_id !== $this->currentUserId()) {
                return $this->error('No se puede revertir un documento bloqueado por otro usuario.', 423);
            }

            // Versión histórica que se desea restaurar
            $targetVersion = DocumentVersion::where('document_id', $document->id)
                ->where('id', $validated['target_version_id'])
                ->firstOrFail();

            // Siguiente número de versión
            $nextVersionNumber = ($document->versions()->max('version_number') ?? 0) + 1;

            // Marcar la versión actual previa como DEPRECATED
            if ($document->current_version_id) {
                DocumentVersion::where('id', $document->current_version_id)
                    ->update(['status' => 'DEPRECATED']);
            }

            // Generar versión Vn+1 reutilizando el mismo binario S3 (sha256_hash)
            $newVersion = DocumentVersion::create([
                'id'                => Str::uuid()->toString(),
                'document_id'       => $document->id,
                'version_number'    => $nextVersionNumber,
                'status'            => 'ACTIVE',
                'storage_bucket'    => $targetVersion->storage_bucket,
                'storage_key'       => $targetVersion->storage_key,
                'original_filename' => $targetVersion->original_filename,
                'mime_type'         => $targetVersion->mime_type,
                'file_size_bytes'   => $targetVersion->file_size_bytes,
                'sha256_hash'       => $targetVersion->sha256_hash,
                'change_summary'    => "Rollback hacia versión v{$targetVersion->version_number}: {$validated['reason']}",
                'created_by'        => $this->currentUserId(),
                'created_at'        => now(),
            ]);

            // Actualizar documento con la nueva versión y liberar candado si correspondía
            $document->update([
                'current_version_id' => $newVersion->id,
                'is_locked'          => false,
                'locked_by_user_id'  => null,
                'locked_at'          => null,
            ]);

            // Auditoría forense inmutable
            DocumentAuditLog::create([
                'id'          => Str::uuid()->toString(),
                'tenant_id'   => $document->tenant_id,
                'document_id' => $document->id,
                'version_id'  => $newVersion->id,
                'user_id'     => $this->currentUserId(),
                'action'      => 'FORWARD_ROLLBACK',
                'sha256_hash' => $newVersion->sha256_hash,
                'ip_address'  => $request->ip() ?? '127.0.0.1',
                'user_agent'  => $request->userAgent(),
                'details'     => [
                    'version_origen'  => $targetVersion->version_number,
                    'version_creada'  => $nextVersionNumber,
                    'motivo'          => $validated['reason'],
                ],
                'created_at'  => now(),
            ]);

            return $this->success($newVersion, "Reversión exitosa. Versión v{$nextVersionNumber} creada y activa.", 201);
        });
    }

    /**
     * Check-in: Registra una nueva versión física tras el procesamiento en NestJS/MinIO,
     * actualiza la versión activa, libera el candado pesimista y audita.
     */
    public function checkin(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'storage_key'       => 'required|string|max:500',
            'storage_bucket'    => 'nullable|string|max:50',
            'original_filename' => 'required|string|max:255',
            'mime_type'         => 'required|string|max:100',
            'file_size_bytes'   => 'required|integer|min:1',
            'sha256_hash'       => 'required|string|size:64',
            'change_summary'    => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $document = Document::lockForUpdate()->findOrFail($id);
            $userId = $this->currentUserId();

            // Solo el dueño del candado puede consolidar la nueva versión
            if ($document->is_locked && $document->locked_by_user_id !== $userId) {
                return $this->error(
                    'No puede consolidar cambios sobre un documento bloqueado por otro usuario.',
                    423
                );
            }

            // Calcular siguiente número de versión
            $nextVersionNumber = ($document->versions()->max('version_number') ?? 0) + 1;

            // Marcar versión anterior como DEPRECATED
            if ($document->current_version_id) {
                DocumentVersion::where('id', $document->current_version_id)
                    ->update(['status' => 'DEPRECATED']);
            }

            // Crear el registro de la nueva versión física
            $newVersion = DocumentVersion::create([
                'id'                => Str::uuid()->toString(),
                'document_id'       => $document->id,
                'version_number'    => $nextVersionNumber,
                'status'            => 'ACTIVE',
                'storage_bucket'    => $validated['storage_bucket'] ?? 'documents-vault',
                'storage_key'       => $validated['storage_key'],
                'original_filename' => $validated['original_filename'],
                'mime_type'         => $validated['mime_type'],
                'file_size_bytes'   => $validated['file_size_bytes'],
                'sha256_hash'       => $validated['sha256_hash'],
                'change_summary'    => $validated['change_summary'] ?? "Subida de versión v{$nextVersionNumber}",
                'created_by'        => $userId,
                'created_at'        => now(),
            ]);

            // Actualizar documento base y liberar el candado
            $document->update([
                'current_version_id' => $newVersion->id,
                'is_locked'          => false,
                'locked_by_user_id'  => null,
                'locked_at'          => null,
            ]);

            // Auditoría forense
            DocumentAuditLog::create([
                'id'          => Str::uuid()->toString(),
                'tenant_id'   => $document->tenant_id,
                'document_id' => $document->id,
                'version_id'  => $newVersion->id,
                'user_id'     => $userId,
                'action'      => 'VERSION_UPLOADED',
                'sha256_hash' => $newVersion->sha256_hash,
                'ip_address'  => $request->ip() ?? '127.0.0.1',
                'user_agent'  => $request->userAgent(),
                'details'     => [
                    'version_number'    => $nextVersionNumber,
                    'original_filename' => $validated['original_filename'],
                    'storage_key'       => $validated['storage_key'],
                ],
                'created_at'  => now(),
            ]);

            return $this->success(
                $newVersion->load('creator:id,full_name,email'),
                "Versión v{$nextVersionNumber} consolidada y candado liberado exitosamente.",
                201
            );
        });
    }

    /**
     * Rompe a la fuerza el bloqueo de edición de un documento (exclusivo TENANT_ADMIN / SYSTEM_ADMIN).
     */
    public function forceUnlock(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();
        $document = Document::where('tenant_id', $admin->tenant_id)->findOrFail($id);

        if (!$document->is_locked) {
            return $this->error('El documento no se encuentra bloqueado actualmente.', 422);
        }

        $previousLockerId = $document->locked_by_user_id;

        DB::transaction(function () use ($request, $admin, $document, $previousLockerId) {
            $document->update([
                'is_locked'         => false,
                'locked_by_user_id' => null,
                'locked_at'         => null,
            ]);

            DocumentAuditLog::create([
                'id'          => Str::uuid()->toString(),
                'tenant_id'   => $admin->tenant_id,
                'document_id' => $document->id,
                'version_id'  => $document->current_version_id,
                'user_id'     => $admin->id,
                'action'      => 'FORCE_UNLOCKED',
                'ip_address'  => $request->ip() ?? '127.0.0.1',
                'user_agent'  => $request->userAgent(),
                'details'     => [
                    'previous_locked_by' => $previousLockerId,
                    'reason'             => $request->input('reason', 'Desbloqueo administrativo forzado'),
                ],
                'created_at'  => now(),
            ]);
        });

        return $this->success(
            $document->fresh(),
            'Candado de edición liberado forzosamente y registrado en auditoría.'
        );
    }

}