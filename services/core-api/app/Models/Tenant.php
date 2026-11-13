<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends BaseModel
{
    protected $table = 'tenants';

    protected $fillable = ['name', 'slug', 'status'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'tenant_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'tenant_id');
    }
}