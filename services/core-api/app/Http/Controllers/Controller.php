<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;

abstract class Controller
{
    use ApiResponse;

    /**
     * Obtiene el ID del tenant del usuario autenticado.
     */
    protected function currentTenantId(): ?string
    {
        return request()->user()?->tenant_id;
    }

    /**
     * Obtiene el ID del usuario en sesión.
     */
    protected function currentUserId(): ?string
    {
        return request()->user()?->id;
    }
}