<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignUuid('version_id')->nullable()->constrained('document_versions')->nullOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50); // LOCK_ACQUIRED, LOCK_RELEASED, FORCE_UNLOCK, VERSION_UPLOADED, etc.
            $table->char('sha256_hash', 64)->nullable();
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->jsonb('details')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_audit_logs');
    }
};