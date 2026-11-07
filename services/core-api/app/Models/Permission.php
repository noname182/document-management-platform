<?php

namespace App\Models;

class Permission extends BaseModel
{
    protected $table = 'permissions';
    protected $fillable = ['permission_key', 'name', 'description'];
}