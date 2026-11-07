<?php

namespace App\Models;

class Tenant extends BaseModel
{
    protected $table = 'tenants';
    protected $fillable = ['name', 'slug', 'status'];
}