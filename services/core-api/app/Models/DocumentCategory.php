<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentCategory extends BaseModel
{
    use BelongsToTenant;

    protected $table = 'document_categories';

    protected $fillable = [
        'tenant_id',
        'department_id',
        'name',
        'description',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'category_id');
    }
}