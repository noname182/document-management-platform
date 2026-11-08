<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

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
    });
});