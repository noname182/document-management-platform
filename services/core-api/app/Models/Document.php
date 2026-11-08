<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends BaseModel
{
    use BelongsToTenant;

    protected $table = 'documents';

    protected $fillable = [
        'tenant_id',
        'category_id',
        'title',
        'current_version_id',
        'is_locked',
        'locked_by_user_id',
        'locked_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_locked'  => 'boolean',
            'locked_at'   => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DocumentCategory::class, 'category_id');
    }

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(DocumentVersion::class, 'current_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class, 'document_id')->orderBy('version_number', 'desc');
    }

    public function lockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(DocumentAuditLog::class, 'document_id')->orderBy('created_at', 'desc');
    }
}