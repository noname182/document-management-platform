<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DocumentCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    use ApiResponse;

    /**
     * Lista departamentos del tenant con conteo de usuarios y categorías.
     */
    public function listDepartments(Request $request): JsonResponse
    {
        $departments = Department::where('tenant_id', $request->user()->tenant_id)
            ->withCount(['users', 'categories'])
            ->orderBy('name')
            ->get();

        return $this->success($departments, 'Departamentos recuperados exitosamente.');
    }

    /**
     * Crea un nuevo departamento en el tenant actual.
     */
    public function storeDepartment(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments', 'name')->where('tenant_id', $tenantId),
            ],
        ]);

        $department = Department::create([
            'id'        => Str::uuid()->toString(),
            'tenant_id' => $tenantId,
            'name'      => trim($validated['name']),
        ]);

        return $this->success($department, 'Departamento creado exitosamente.', 201);
    }

    /**
     * Actualiza el nombre de un departamento del tenant.
     */
    public function updateDepartment(Request $request, string $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $department = Department::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments', 'name')
                    ->where('tenant_id', $tenantId)
                    ->ignore($department->id),
            ],
        ]);

        $department->update(['name' => trim($validated['name'])]);

        return $this->success($department, 'Departamento actualizado exitosamente.');
    }

    /**
     * Elimina un departamento si no tiene categorías documentales vinculadas.
     */
    public function destroyDepartment(Request $request, string $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $department = Department::where('tenant_id', $tenantId)
            ->withCount('categories')
            ->findOrFail($id);

        if ($department->categories_count > 0) {
            return $this->error(
                'No se puede eliminar un departamento que tiene categorías documentales asociadas.',
                422
            );
        }

        $department->delete();

        return $this->success(null, 'Departamento eliminado exitosamente.');
    }

    /**
     * Lista categorías documentales del tenant con su departamento asignado.
     */
    public function listCategories(Request $request): JsonResponse
    {
        $categories = DocumentCategory::with('department:id,name')
            ->where('tenant_id', $request->user()->tenant_id)
            ->withCount('documents')
            ->orderBy('name')
            ->get();

        return $this->success($categories, 'Categorías documentales recuperadas exitosamente.');
    }

    /**
     * Crea una categoría documental vinculada a un departamento del mismo tenant.
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('document_categories', 'name')->where('tenant_id', $tenantId),
            ],
            'department_id' => [
                'required',
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $tenantId),
            ],
            'description' => 'nullable|string|max:500',
        ]);

        $category = DocumentCategory::create([
            'id'            => Str::uuid()->toString(),
            'tenant_id'     => $tenantId,
            'department_id' => $validated['department_id'],
            'name'          => trim($validated['name']),
            'description'   => $validated['description'] ?? null,
        ]);

        return $this->success(
            $category->load('department:id,name'),
            'Categoría documental creada exitosamente.',
            201
        );
    }

    /**
     * Actualiza una categoría documental del tenant.
     */
    public function updateCategory(Request $request, string $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $category = DocumentCategory::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('document_categories', 'name')
                    ->where('tenant_id', $tenantId)
                    ->ignore($category->id),
            ],
            'department_id' => [
                'sometimes',
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $tenantId),
            ],
            'description' => 'nullable|string|max:500',
        ]);

        $category->update($validated);

        return $this->success(
            $category->fresh()->load('department:id,name'),
            'Categoría documental actualizada exitosamente.'
        );
    }

    /**
     * Elimina una categoría si no contiene documentos registrados.
     */
    public function destroyCategory(Request $request, string $id): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $category = DocumentCategory::where('tenant_id', $tenantId)
            ->withCount('documents')
            ->findOrFail($id);

        if ($category->documents_count > 0) {
            return $this->error(
                'No se puede eliminar una categoría que ya tiene expedientes asociados.',
                422
            );
        }

        $category->delete();

        return $this->success(null, 'Categoría documental eliminada exitosamente.');
    }
}