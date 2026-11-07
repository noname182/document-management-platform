<?php

namespace App\Models;

class RolePermission extends BaseModel
{
    protected $table = 'role_permissions';
    public $timestamps = false;
    protected $fillable = ['id', 'role_id', 'permission_key'];
}