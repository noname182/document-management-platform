<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentAuditLog extends BaseModel
{
    use BelongsToTenant;

    protected $table = 'document_audit_logs';

    public $timestamps = false; // Solo maneja created_at por defecto en la BD

    protected $fillable = [
        'id',
        'tenant_id',
        'document_id',
        'version_id',
        'user_id',
        'action',
        'sha256_hash',
        'ip_address',
        'user_agent',
        'details',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'details'    => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(DocumentVersion::class, 'version_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}