<?php

namespace App\Http\Controllers;

use App\Models\DocumentAuditLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    use ApiResponse;

    /**
     * Lista la bitácora forense inmutable filtrada por el tenant del usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DocumentAuditLog::with([
            'user:id,full_name,email',
            'document:id,title',
        ])
            ->where('tenant_id', $request->user()->tenant_id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }

        if ($request->filled('document_id')) {
            $query->where('document_id', $request->string('document_id'));
        }

        return $this->success(
            $query->paginate(20),
            'Registros de auditoría forense recuperados.'
        );
    }
}