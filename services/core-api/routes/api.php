<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\TenantController;

Route::prefix('v1')->group(function () {
    // Rutas públicas
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Rutas protegidas por Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::prefix('documents')->group(function () {
            // Lectura
            Route::get('/', [DocumentController::class, 'index'])->middleware('abac:doc:read');
            Route::get('/{id}', [DocumentController::class, 'show'])->middleware('abac:doc:read');
            Route::get('/{id}/versions', [DocumentController::class, 'versions'])->middleware('abac:doc:read');

            // Creación
            Route::post('/', [DocumentController::class, 'store'])->middleware('abac:doc:create');

            // Concurrencia y Control de Candados
            Route::post('/{id}/checkout', [DocumentController::class, 'checkout'])->middleware('abac:doc:checkout');
            Route::post('/{id}/discard-checkout', [DocumentController::class, 'discardCheckout'])->middleware('abac:doc:discard_checkout');

            // Gobernanza Forense: Forward-Rollback
            Route::post('/{id}/rollback', [DocumentController::class, 'rollback'])->middleware('abac:doc:rollback');

            Route::post('/{id}/checkin', [DocumentController::class, 'checkin'])->middleware('abac:doc:checkin');
        });

        Route::middleware('abac:user:manage')->prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::post('/', [UserController::class, 'store']);
            Route::get('/{id}', [UserController::class, 'show']);
            Route::patch('/{id}', [UserController::class, 'update']);
            Route::delete('/{id}', [UserController::class, 'destroy']);
        });

        // Rutas exclusivas de SYSTEM_ADMIN (Gestión de Plataforma y Tenants)
        Route::middleware('abac:tenant:manage')->prefix('tenants')->group(function () {
            Route::get('/', [TenantController::class, 'index']);
            Route::post('/', [TenantController::class, 'store']);
            Route::patch('/{id}', [TenantController::class, 'update']);
            Route::patch('/{id}/status', [TenantController::class, 'updateStatus']);
        });

        Route::middleware('abac:system:metrics')->get('/system/overview', [SystemController::class, 'overview']);
    });
});