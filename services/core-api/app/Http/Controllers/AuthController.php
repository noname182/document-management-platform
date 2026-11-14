<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return $this->error(
                "Demasiados intentos fallidos. Intente nuevamente en {$seconds} segundos.",
                429
            );
        }

        // Buscar el usuario sin filtrar por tenant global
        $user = User::withoutGlobalScope('tenant_isolation')
            ->with(['roles.permissions', 'tenant', 'departments:id,name'])
            ->where('email', $request->email)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password) || $user->status !== 'ACTIVE') {
            RateLimiter::hit($throttleKey, 60);
            return $this->error('Credenciales no válidas o usuario suspendido.', 401);
        }

        RateLimiter::clear($throttleKey);

        $token = $user->createToken('api-session')->plainTextToken;

        return $this->success([
            'token_type'   => 'Bearer',
            'access_token' => $token,
            'user' => [
                'id'             => $user->id,
                'email'          => $user->email,
                'full_name'      => $user->full_name,
                'tenant'         => $user->tenant ? ['id' => $user->tenant->id, 'slug' => $user->tenant->slug] : null,
                'departments'    => $user->departments->map(fn ($d) => [
                    'id'         => $d->id,
                    'name'       => $d->name,
                    'is_primary' => (bool) $d->pivot->is_primary,
                ])->values(),
                'department_ids' => $user->departments->pluck('id')->values(),
                'roles'          => $user->roles->pluck('id')->values(),
                'permissions'    => $user->getAllPermissions(),
            ],
        ], 'Sesión iniciada correctamente.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions', 'tenant', 'departments:id,name']);

        return $this->success([
            'id'             => $user->id,
            'email'          => $user->email,
            'full_name'      => $user->full_name,
            'tenant'         => $user->tenant ? ['id' => $user->tenant->id, 'slug' => $user->tenant->slug] : null,
            'departments'    => $user->departments->map(fn ($d) => [
                'id'         => $d->id,
                'name'       => $d->name,
                'is_primary' => (bool) $d->pivot->is_primary,
            ])->values(),
            'department_ids' => $user->departments->pluck('id')->values(),
            'roles'          => $user->roles->pluck('id')->values(),
            'permissions'    => $user->getAllPermissions(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, 'Sesión revocada exitosamente.');
    }
}