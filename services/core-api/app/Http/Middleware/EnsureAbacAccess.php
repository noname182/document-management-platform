<?php

namespace App\Http\Middleware;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAbacAccess
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->error('No autenticado.', 401);
        }

        // 1. Verificación RBAC (Permiso atómico)
        $userPermissions = $user->getAllPermissions();

        if (! in_array($permission, $userPermissions, true)) {
            return $this->error("Permiso denegado: se requiere '{$permission}'.", 403);
        }

        // SYSTEM_ADMIN y TENANT_ADMIN tienen acceso administrativo transversal
        if ($user->hasRole('SYSTEM_ADMIN') || $user->hasRole('TENANT_ADMIN')) {
            return $next($request);
        }

        // 2. Verificación Contextual ABAC N:M (user_departments):
        // Si el usuario tiene departamentos asignados, el recurso debe pertenecer a alguno de ellos.
        // (Los APPROVER transversales sin departamentos asignados operan sobre toda la organización).
        $userDepartmentIds = $user->departments()->pluck('departments.id')->toArray();

        if ($user->hasRole('APPROVER') && empty($userDepartmentIds)) {
            return $next($request);
        }

        $departmentIdTarget = null;

        // Caso A: Creación de documento (el payload incluye category_id)
        if ($request->has('category_id')) {
            $category = DocumentCategory::find($request->input('category_id'));
            $departmentIdTarget = $category?->department_id;
        }

        // Caso B: Operación sobre documento existente (ruta contiene el ID del documento)
        $documentRouteParam = $request->route('document') ?? $request->route('id');
        if ($documentRouteParam) {
            $doc = $documentRouteParam instanceof Document
                ? $documentRouteParam
                : Document::with('category')->find($documentRouteParam);

            $departmentIdTarget = $doc?->category?->department_id;
        }

        // Si el recurso tiene departamento asignado y el usuario no pertenece a él
        if ($departmentIdTarget && ! in_array($departmentIdTarget, $userDepartmentIds, true)) {
            return $this->error(
                'Violación de política ABAC: No tiene autorización sobre recursos de este departamento.',
                403
            );
        }

        return $next($request);
    }
}