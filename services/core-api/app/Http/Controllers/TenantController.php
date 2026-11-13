<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    use ApiResponse;

    /**
     * Lista todas las organizaciones (Tenants) con conteo de usuarios, departamentos y documentos.
     */
    public function index(): JsonResponse
    {
        $tenants = Tenant::withCount(['users', 'departments', 'documents'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success($tenants, 'Organizaciones recuperadas exitosamente.');
    }

    /**
     * Crea una nueva organización (Tenant) y aprovisiona su primer TENANT_ADMIN de forma atómica.
     */
    public function store(Request $request): JsonResponse
    {
        $sysAdmin = $request->user();

        $request->merge([
            'name' => mb_strtoupper(trim((string) $request->input('name')), 'UTF-8'),
            'slug' => strtolower(trim((string) $request->input('slug'))),
        ]);

        $validated = $request->validate([
            'name'           => 'required|string|max:150|unique:tenants,name',
            'slug'           => 'required|string|max:100|alpha_dash|unique:tenants,slug',
            'admin_name'     => 'required|string|max:150',
            'admin_email'    => 'required|email|max:255|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        return DB::transaction(function () use ($sysAdmin, $validated) {
            // 1. Crear el Tenant
            $tenant = Tenant::create([
                'id'     => Str::uuid()->toString(),
                'name'   => $validated['name'],
                'slug'   => $validated['slug'],
                'status' => 'ACTIVE',
            ]);

            // 2. Crear el usuario Administrador de la Organización
            $tenantAdmin = User::create([
                'id'            => Str::uuid()->toString(),
                'tenant_id'     => $tenant->id,
                'department_id' => null,
                'email'         => $validated['admin_email'],
                'full_name'     => $validated['admin_name'],
                'password'      => Hash::make($validated['admin_password']),
                'status'        => 'ACTIVE',
            ]);

            // 3. Asignar el rol TENANT_ADMIN en la tabla pivote
            DB::table('user_roles')->insert([
                'id'          => Str::uuid()->toString(),
                'user_id'     => $tenantAdmin->id,
                'role_id'     => 'TENANT_ADMIN',
                'tenant_id'   => $tenant->id,
                'assigned_by' => $sysAdmin->id,
                'assigned_at' => now(),
            ]);

            return $this->success([
                'tenant' => $tenant,
                'admin'  => [
                    'id'        => $tenantAdmin->id,
                    'full_name' => $tenantAdmin->full_name,
                    'email'     => $tenantAdmin->email,
                    'role'      => 'TENANT_ADMIN',
                ],
            ], 'Organización y administrador aprovisionados exitosamente.', 201);
        });
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        if ($tenant->slug === 'platform-system') {
            return $this->error('No se puede modificar la organización raíz del sistema.', 403);
        }

        $request->merge([
            'name' => mb_strtoupper(trim((string) $request->input('name')), 'UTF-8'),
            'slug' => strtolower(trim((string) $request->input('slug'))),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('tenants', 'name')->ignore($tenant->id)],
            'slug' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('tenants', 'slug')->ignore($tenant->id)],
        ]);

        $tenant->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
        ]);

        return $this->success(
            $tenant->loadCount(['users', 'departments', 'documents']),
            'Organización actualizada correctamente.'
        );
    }

    /**
     * Cambia el estado de una organización (ACTIVE / SUSPENDED) y revoca tokens si se suspende.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        if ($tenant->slug === 'platform-system') {
            return $this->error('No se puede suspender el tenant raíz de la plataforma.', 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['ACTIVE', 'SUSPENDED'])],
        ]);

        DB::transaction(function () use ($tenant, $validated) {
            $tenant->update(['status' => $validated['status']]);

            // Si se da de baja (SUSPENDED), revocamos todas las sesiones activas de sus usuarios
            if ($validated['status'] === 'SUSPENDED') {
                $userIds = User::withoutGlobalScopes()
                    ->where('tenant_id', $tenant->id)
                    ->pluck('id');

                DB::table('personal_access_tokens')
                    ->whereIn('tokenable_id', $userIds)
                    ->delete();
            }
        });

        return $this->success($tenant->fresh(), "Estado de la organización actualizado a {$validated['status']}.");
    }
}