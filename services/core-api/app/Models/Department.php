<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends BaseModel
{
    use BelongsToTenant;

    protected $table = 'departments';
    protected $fillable = ['tenant_id', 'name'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_departments', 'department_id', 'user_id')
            ->withPivot(['is_primary', 'assigned_at']);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(DocumentCategory::class, 'department_id');
    }
}