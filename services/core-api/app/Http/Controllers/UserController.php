<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Lista los usuarios pertenecientes al tenant del administrador autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $users = User::with(['departments:id,name', 'roles:id,name'])
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->success($users, 'Usuarios recuperados exitosamente.');
    }

    /**
     * Crea un nuevo usuario en el tenant actual y le asigna sus roles y departamentos (N:M).
     */
    public function store(Request $request): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'full_name'        => 'required|string|max:150',
            'email'            => 'required|email|max:255|unique:users,email',
            'password'         => 'required|string|min:8',
            'role_id'          => ['sometimes', 'string', Rule::in(['VIEWER', 'EDITOR', 'APPROVER', 'TENANT_ADMIN'])],
            'role_ids'         => 'sometimes|array|min:1',
            'role_ids.*'       => ['string', Rule::in(['VIEWER', 'EDITOR', 'APPROVER', 'TENANT_ADMIN'])],
            'department_id'    => [
                'nullable',
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $admin->tenant_id),
            ],
            'department_ids'   => 'nullable|array',
            'department_ids.*' => [
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $admin->tenant_id),
            ],
        ]);

        // Normalizar roles (soporta role_ids[] o role_id singular)
        $roleIds = collect($validated['role_ids'] ?? (isset($validated['role_id']) ? [$validated['role_id']] : []))
            ->unique()
            ->values()
            ->toArray();

        if (empty($roleIds)) {
            return $this->error('Debe asignar al menos un rol al usuario.', 422);
        }

        // Normalizar departamentos (soporta department_ids[] o department_id singular)
        $departmentIds = collect($validated['department_ids'] ?? (! empty($validated['department_id']) ? [$validated['department_id']] : []))
            ->unique()
            ->values()
            ->toArray();

        if (! empty(array_intersect($roleIds, ['EDITOR', 'VIEWER'])) && empty($departmentIds)) {
            return $this->error(
                'Los roles EDITOR y VIEWER requieren obligatoriamente al menos un departamento asignado.',
                422
            );
        }

        return DB::transaction(function () use ($admin, $validated, $roleIds, $departmentIds) {
            $user = User::create([
                'id'        => Str::uuid()->toString(),
                'tenant_id' => $admin->tenant_id,
                'email'     => $validated['email'],
                'full_name' => $validated['full_name'],
                'password'  => Hash::make($validated['password']),
                'status'    => 'ACTIVE',
            ]);

            foreach ($roleIds as $roleId) {
                DB::table('user_roles')->insert([
                    'id'          => Str::uuid()->toString(),
                    'user_id'     => $user->id,
                    'role_id'     => $roleId,
                    'tenant_id'   => $admin->tenant_id,
                    'assigned_by' => $admin->id,
                    'assigned_at' => now(),
                ]);
            }

            if (! empty($departmentIds)) {
                $syncData = [];
                foreach ($departmentIds as $index => $deptId) {
                    $syncData[$deptId] = [
                        'id'          => Str::uuid()->toString(),
                        'is_primary'  => $index === 0,
                        'assigned_at' => now(),
                    ];
                }
                $user->departments()->sync($syncData);
            }

            return $this->success(
                $user->load(['departments:id,name', 'roles:id,name']),
                'Usuario registrado exitosamente.',
                201
            );
        });
    }

    /**
     * Muestra el detalle de un usuario específico del mismo tenant.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = User::with(['departments:id,name', 'roles:id,name'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        return $this->success($user, 'Detalle de usuario recuperado.');
    }

    /**
     * Actualiza datos, departamentos (N:M), roles o estado (ACTIVE / SUSPENDED) de un usuario.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();
        $user = User::where('tenant_id', $admin->tenant_id)->findOrFail($id);

        $validated = $request->validate([
            'full_name'        => 'sometimes|string|max:150',
            'status'           => ['sometimes', Rule::in(['ACTIVE', 'SUSPENDED'])],
            'role_id'          => ['sometimes', 'string', Rule::in(['VIEWER', 'EDITOR', 'APPROVER', 'TENANT_ADMIN'])],
            'role_ids'         => 'sometimes|array|min:1',
            'role_ids.*'       => ['string', Rule::in(['VIEWER', 'EDITOR', 'APPROVER', 'TENANT_ADMIN'])],
            'department_id'    => [
                'nullable',
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $admin->tenant_id),
            ],
            'department_ids'   => 'sometimes|array',
            'department_ids.*' => [
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $admin->tenant_id),
            ],
        ]);

        return DB::transaction(function () use ($admin, $user, $validated) {
            $user->update(collect($validated)->only(['full_name', 'status'])->toArray());

            // Sincronizar Roles si se enviaron
            if (isset($validated['role_ids']) || isset($validated['role_id'])) {
                $roleIds = collect($validated['role_ids'] ?? [$validated['role_id']])
                    ->unique()
                    ->values()
                    ->toArray();

                DB::table('user_roles')
                    ->where('user_id', $user->id)
                    ->where('tenant_id', $admin->tenant_id)
                    ->delete();

                foreach ($roleIds as $roleId) {
                    DB::table('user_roles')->insert([
                        'id'          => Str::uuid()->toString(),
                        'user_id'     => $user->id,
                        'role_id'     => $roleId,
                        'tenant_id'   => $admin->tenant_id,
                        'assigned_by' => $admin->id,
                        'assigned_at' => now(),
                    ]);
                }
            }

            // Sincronizar Departamentos si se enviaron
            if (array_key_exists('department_ids', $validated) || array_key_exists('department_id', $validated)) {
                $departmentIds = collect($validated['department_ids'] ?? (! empty($validated['department_id']) ? [$validated['department_id']] : []))
                    ->unique()
                    ->values()
                    ->toArray();

                $syncData = [];
                foreach ($departmentIds as $index => $deptId) {
                    $syncData[$deptId] = [
                        'id'          => Str::uuid()->toString(),
                        'is_primary'  => $index === 0,
                        'assigned_at' => now(),
                    ];
                }
                $user->departments()->sync($syncData);
            }

            return $this->success(
                $user->fresh()->load(['departments:id,name', 'roles:id,name']),
                'Usuario actualizado exitosamente.'
            );
        });
    }

    /**
     * Suspende la cuenta y revoca sus tokens activos (baja lógica segura).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();

        if ($admin->id === $id) {
            return $this->error('No puedes desactivar tu propia cuenta de administrador.', 422);
        }

        $user = User::where('tenant_id', $admin->tenant_id)->findOrFail($id);

        $user->update(['status' => 'SUSPENDED']);
        $user->tokens()->delete();

        return $this->success(null, 'Usuario suspendido y sesiones revocadas.');
    }
}