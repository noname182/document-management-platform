<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends BaseModel
{
    use BelongsToTenant;

    protected $table = 'departments';
    protected $fillable = ['tenant_id', 'name'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'department_id');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(DocumentCategory::class, 'department_id');
    }
}