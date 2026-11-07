<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['id' => 'VIEWER', 'name' => 'Lector', 'description' => 'Consulta y descarga documentos.'],
            ['id' => 'EDITOR', 'name' => 'Editor / Creador', 'description' => 'Crea, bloquea y sube nuevas versiones.'],
            ['id' => 'APPROVER', 'name' => 'Revisor / Auditor', 'description' => 'Aprueba, rechaza y consulta auditoría.'],
            ['id' => 'TENANT_ADMIN', 'name' => 'Admin Organización', 'description' => 'Administra tenant, categorías y usuarios.'],
            ['id' => 'SYSTEM_ADMIN', 'name' => 'Super Admin', 'description' => 'Infraestructura, MinIO y métricas.'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(['id' => $role['id']], array_merge($role, [
                'is_system_role' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $matrix = [
            'VIEWER' => ['doc:read', 'doc:download'],
            'EDITOR' => ['doc:read', 'doc:download', 'doc:create', 'doc:checkout', 'doc:checkin', 'doc:discard_checkout', 'doc:rollback'],
            'APPROVER' => ['doc:read', 'doc:download', 'doc:approve', 'doc:reject', 'doc:rollback', 'audit:read'],
            'TENANT_ADMIN' => [
                'doc:read', 'doc:download', 'doc:create', 'doc:checkout', 'doc:checkin',
                'doc:discard_checkout', 'doc:approve', 'doc:reject', 'doc:rollback',
                'doc:force_unlock', 'user:manage', 'dept:manage', 'audit:read'
            ],
            'SYSTEM_ADMIN' => [
                'doc:read', 'doc:download', 'doc:create', 'doc:checkout', 'doc:checkin',
                'doc:discard_checkout', 'doc:approve', 'doc:reject', 'doc:rollback',
                'doc:force_unlock', 'user:manage', 'dept:manage', 'audit:read',
                'quarantine:manage', 'system:metrics', 'tenant:manage'
            ],
        ];

        foreach ($matrix as $roleId => $permissions) {
            foreach ($permissions as $permissionKey) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_key' => $permissionKey],
                    ['id' => Str::uuid()]
                );
            }
        }
    }
}

/**
 * ============================================================================
 * GUÍA DE REFERENCIA TÉCNICA: ROLES Y PERMISOS DEL SISTEMA
 * ============================================================================
 *
 * 1. DEFINICIÓN DE ROLES UNIVERSALES ($roles):
 * ----------------------------------------------------------------------------
 * - VIEWER:
 *   Usuario con acceso de solo lectura. Consulta y descarga copias de archivos
 *   ya aprobados. No altera estados ni sube información al almacenamiento.
 *
 * - EDITOR:
 *   Personal operativo que produce contenido. Crea nuevos expedientes,
 *   toma el candado de edición (check-out), sube revisiones (check-in)
 *   o cancela el bloqueo. Puede revertir versiones si son borradores propios.
 *
 * - APPROVER:
 *   Revisor o auditor de negocio/calidad. No redacta documentos; evalúa las
 *   versiones de los editores para aprobarlas o rechazarlas. Puede ejecutar
 *   rollback de versiones no conformes y leer bitácoras de auditoría.
 *
 * - TENANT_ADMIN:
 *   Administrador de la empresa o inquilino. Administra la estructura interna
 *   (usuarios, departamentos, categorías) y puede forzar el desbloqueo
 *   de archivos retenidos por otros usuarios.
 *
 * - SYSTEM_ADMIN:
 *   Administrador global de la plataforma SaaS / Infraestructura. Supervisa
 *   el cluster de MinIO, cuotas de inquilinos, monitoreo y purga de virus.
 *
 * ----------------------------------------------------------------------------
 * 2. CATÁLOGO DE PERMISOS ATÓMICOS ($matrix / permission_key):
 * ----------------------------------------------------------------------------
 * - doc:read
 *   Consultar metadatos, detalles y listados de documentos en la base de datos.
 *
 * - doc:download
 *   Obtener URL de descarga o streaming del binario físico almacenado en MinIO.
 *
 * - doc:create
 *   Registrar un nuevo expediente maestro (document_id inicial) en el sistema.
 *
 * - doc:checkout
 *   Bloquear temporalmente un archivo (is_locked = TRUE) para edición exclusiva,
 *   impidiendo que otros usuarios pisen los cambios concurrentemente.
 *
 * - doc:checkin
 *   Cargar un archivo modificado como nueva versión secuencial (v2, v3...)
 *   y liberar automáticamente el candado de bloqueo.
 *
 * - doc:discard_checkout
 *   Cancelar el candado de edición activa sin guardar cambios ni generar
 *   versiones fantasma en el sistema de archivos.
 *
 * - doc:approve
 *   Validar formalmente una versión en estado borrador/pendiente y marcarla
 *   como la versión oficial activa ante la organización.
 *
 * - doc:reject
 *   Rechazar una versión presentada por un editor, enviándola a estado
 *   REJECTED con observaciones técnicas o de negocio.
 *
 * - doc:rollback
 *   Reactivar una versión histórica anterior creando un nuevo registro de
 *   versión hacia adelante (Forward-Rollback) sin destruir la trazabilidad.
 *
 * - doc:force_unlock
 *   Romper a la fuerza el bloqueo de edición de cualquier usuario cuando
 *   un documento quedó retenido accidentalmente (exclusivo administradores).
 *
 * - user:manage
 *   Crear, actualizar, desactivar y asignar roles a los usuarios del tenant.
 *
 * - dept:manage
 *   Crear y administrar los departamentos de la empresa y sus categorías documentales.
 *
 * - audit:read
 *   Consultar la tabla de auditoría forense inmutable (document_audit_logs)
 *   para inspección de eventos, direcciones IP y hashes SHA-256.
 *
 * - quarantine:manage
 *   Inspeccionar, liberar excepciones o purgar archivos infectados con malware
 *   retenidos en el bucket 'quarantine-vault'.
 *
 * - system:metrics
 *   Visualizar telemetría de rendimiento del servidor, latencias y consumo
 *   de almacenamiento en los depósitos de MinIO.
 *
 * - tenant:manage
 *   Crear, suspender o modificar empresas/inquilinos en la plataforma global.
 * ============================================================================
 */