<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

class Department extends BaseModel
{
    use BelongsToTenant;

    protected $table = 'departments';
    protected $fillable = ['tenant_id', 'name', 'code'];
}