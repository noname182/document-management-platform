<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->string('id', 30)->primary(); // VIEWER, EDITOR, APPROVER, TENANT_ADMIN, SYSTEM_ADMIN
            $table->string('name', 100);
            $table->text('description');
            $table->boolean('is_system_role')->default(true);
            $table->timestamps();
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role_id', 30);
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->useCurrent();

            $table->unique(['user_id', 'role_id', 'tenant_id']);
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('role_id', 30);
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->string('permission_key', 50);

            $table->unique(['role_id', 'permission_key']);
        });

        Schema::create('access_policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('target_resource', 50);
            $table->string('target_action', 50);
            $table->string('effect', 10); // ALLOW, DENY
            $table->jsonb('conditions');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_policies');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('roles');
    }
};