<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('department_id')->constrained('departments')->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->timestamp('assigned_at')->useCurrent();

            $table->unique(['user_id', 'department_id']);
        });

        // Migrar asignaciones existentes de users.department_id -> user_departments
        $existingUsers = DB::table('users')
            ->whereNotNull('department_id')
            ->select('id', 'department_id')
            ->get();

        foreach ($existingUsers as $user) {
            DB::table('user_departments')->insert([
                'id'            => Str::uuid()->toString(),
                'user_id'       => $user->id,
                'department_id' => $user->department_id,
                'is_primary'    => true,
                'assigned_at'   => now(),
            ]);
        }

        // Eliminar columna legacy 1:N
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('department_id')
                ->nullable()
                ->after('tenant_id')
                ->constrained('departments')
                ->nullOnDelete();
        });

        $pivots = DB::table('user_departments')
            ->orderByDesc('is_primary')
            ->get()
            ->unique('user_id');

        foreach ($pivots as $pivot) {
            DB::table('users')
                ->where('id', $pivot->user_id)
                ->update(['department_id' => $pivot->department_id]);
        }

        Schema::dropIfExists('user_departments');
    }
};