<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\Tenant;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SystemController extends Controller
{
    use ApiResponse;

    /**
     * Devuelve métricas globales de infraestructura y estado de salud de los nodos.
     */
    public function overview(): JsonResponse
    {
        // 1. Verificar salud de PostgreSQL
        $dbStatus = 'ONLINE';
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $dbStatus = 'OFFLINE';
        }

        // 2. Verificar salud del microservicio NestJS (doc-processor en red interna Docker)
        $processorStatus = 'OFFLINE';
        $processorUrl = rtrim(env('DOC_PROCESSOR_URL', 'http://doc-processor:3001'), '/');
        try {
            $res = Http::timeout(2)->get($processorUrl);
            if ($res->successful() || $res->status() === 404) {
                $processorStatus = 'ONLINE';
            }
        } catch (\Throwable $e) {
            $processorStatus = 'OFFLINE';
        }

        // 3. Métricas reales globales omitiendo el global scope del tenant del sysadmin
        $totalStorageBytes = (int) DocumentVersion::withoutGlobalScopes()->sum('file_size_bytes');

        $metrics = [
            'services' => [
                'core_api'      => 'ONLINE',
                'database'      => $dbStatus,
                'doc_processor' => $processorStatus,
                'minio_storage' => $processorStatus === 'ONLINE' ? 'ONLINE' : 'DEGRADED',
            ],
            'stats' => [
                'tenants_total'    => Tenant::where('slug', '!=', 'platform-system')->count(),
                'tenants_active'   => Tenant::where('slug', '!=', 'platform-system')->where('status', 'ACTIVE')->count(),
                'users_total'      => User::withoutGlobalScopes()->count(),
                'documents_total'  => Document::withoutGlobalScopes()->count(),
                'versions_total'   => DocumentVersion::withoutGlobalScopes()->count(),
                'storage_bytes'    => $totalStorageBytes,
                'locked_documents' => Document::withoutGlobalScopes()->where('is_locked', true)->count(),
            ],
        ];

        return $this->success($metrics, 'Métricas del sistema recuperadas.');
    }
}