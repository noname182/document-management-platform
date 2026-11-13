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

        $users = User::with(['department:id,name', 'roles:id,name'])
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->success($users, 'Usuarios recuperados exitosamente.');
    }

    /**
     * Crea un nuevo usuario en el tenant actual y le asigna su rol.
     */
    public function store(Request $request): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'full_name'     => 'required|string|max:150',
            'email'         => 'required|email|max:255|unique:users,email',
            'password'      => 'required|string|min:8',
            'role_id'       => ['required', 'string', Rule::in(['VIEWER', 'EDITOR', 'APPROVER', 'TENANT_ADMIN'])],
            'department_id' => [
                'nullable',
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $admin->tenant_id),
            ],
        ]);

        if (in_array($validated['role_id'], ['EDITOR', 'VIEWER']) && empty($validated['department_id'])) {
            return $this->error(
                'Los roles EDITOR y VIEWER requieren obligatoriamente un departamento asignado.',
                422
            );
        }

        return DB::transaction(function () use ($admin, $validated) {
            $user = User::create([
                'id'            => Str::uuid()->toString(),
                'tenant_id'     => $admin->tenant_id,
                'department_id' => $validated['department_id'] ?? null,
                'email'         => $validated['email'],
                'full_name'     => $validated['full_name'],
                'password'      => Hash::make($validated['password']),
                'status'        => 'ACTIVE',
            ]);

            DB::table('user_roles')->insert([
                'id'          => Str::uuid()->toString(),
                'user_id'     => $user->id,
                'role_id'     => $validated['role_id'],
                'tenant_id'   => $admin->tenant_id,
                'assigned_by' => $admin->id,
                'assigned_at' => now(),
            ]);

            return $this->success(
                $user->load(['department:id,name', 'roles:id,name']),
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
        $user = User::with(['department:id,name', 'roles:id,name'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        return $this->success($user, 'Detalle de usuario recuperado.');
    }

    /**
     * Actualiza datos, departamento, rol o estado (ACTIVE / SUSPENDED) de un usuario.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();
        $user = User::where('tenant_id', $admin->tenant_id)->findOrFail($id);

        $validated = $request->validate([
            'full_name'     => 'sometimes|string|max:150',
            'status'        => ['sometimes', Rule::in(['ACTIVE', 'SUSPENDED'])],
            'role_id'       => ['sometimes', 'string', Rule::in(['VIEWER', 'EDITOR', 'APPROVER', 'TENANT_ADMIN'])],
            'department_id' => [
                'nullable',
                'uuid',
                Rule::exists('departments', 'id')->where('tenant_id', $admin->tenant_id),
            ],
        ]);

        return DB::transaction(function () use ($admin, $user, $validated) {
            $user->update(collect($validated)->except('role_id')->toArray());

            if (isset($validated['role_id'])) {
                DB::table('user_roles')
                    ->where('user_id', $user->id)
                    ->where('tenant_id', $admin->tenant_id)
                    ->update([
                        'role_id'     => $validated['role_id'],
                        'assigned_by' => $admin->id,
                        'assigned_at' => now(),
                    ]);
            }

            return $this->success(
                $user->fresh()->load(['department:id,name', 'roles:id,name']),
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