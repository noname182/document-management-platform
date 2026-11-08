<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentVersion extends BaseModel
{
    protected $table = 'document_versions';

    const UPDATED_AT = null; // La tabla solo registra created_at (inmutable)

    protected $fillable = [
        'document_id',
        'version_number',
        'status',
        'storage_bucket',
        'storage_key',
        'original_filename',
        'mime_type',
        'file_size_bytes',
        'sha256_hash',
        'change_summary',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'version_number'  => 'integer',
            'file_size_bytes' => 'integer',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}