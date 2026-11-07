<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TestScenarioSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tenants
        $tenantClinicaId = Str::uuid()->toString();
        $tenantBufeteId = Str::uuid()->toString();

        DB::table('tenants')->insert([
            ['id' => $tenantClinicaId, 'name' => 'CLINICA DE LOS OLIVOS', 'slug' => 'clinica-olivos', 'status' => 'ACTIVE', 'created_at' => now()],
            ['id' => $tenantBufeteId, 'name' => 'BUFETE BALDIVIESO', 'slug' => 'bufete-baldivieso', 'status' => 'ACTIVE', 'created_at' => now()],
        ]);

        // 2. Departamentos (Clínica)
        $deptCirugiaId = Str::uuid()->toString();
        $deptFinanzasId = Str::uuid()->toString();

        DB::table('departments')->insert([
            ['id' => $deptCirugiaId, 'tenant_id' => $tenantClinicaId, 'name' => 'Cirugía', 'created_at' => now()],
            ['id' => $deptFinanzasId, 'tenant_id' => $tenantClinicaId, 'name' => 'Finanzas', 'created_at' => now()],
        ]);

        // 3. Usuarios de prueba
        $userAdminId = Str::uuid()->toString();
        $userEditorId = Str::uuid()->toString();
        $userApproverId = Str::uuid()->toString();

        DB::table('users')->insert([
            [
                'id' => $userAdminId,
                'tenant_id' => $tenantClinicaId,
                'department_id' => $deptFinanzasId,
                'email' => 'admin@olivos.test',
                'full_name' => 'Admin Olivos',
                'password' => Hash::make('password123'),
                'status' => 'ACTIVE',
                'created_at' => now(),
            ],
            [
                'id' => $userEditorId,
                'tenant_id' => $tenantClinicaId,
                'department_id' => $deptCirugiaId,
                'email' => 'editor@olivos.test',
                'full_name' => 'Dr. Carlos Mendoza',
                'password' => Hash::make('password123'),
                'status' => 'ACTIVE',
                'created_at' => now(),
            ],
            [
                'id' => $userApproverId,
                'tenant_id' => $tenantClinicaId,
                'department_id' => $deptCirugiaId,
                'email' => 'revisor@olivos.test',
                'full_name' => 'Dra. Ana Baldivieso',
                'password' => Hash::make('password123'),
                'status' => 'ACTIVE',
                'created_at' => now(),
            ],
        ]);

        // 4. Asignación de Roles
        DB::table('user_roles')->insert([
            ['id' => Str::uuid(), 'user_id' => $userAdminId, 'role_id' => 'TENANT_ADMIN', 'tenant_id' => $tenantClinicaId, 'assigned_at' => now()],
            ['id' => Str::uuid(), 'user_id' => $userEditorId, 'role_id' => 'EDITOR', 'tenant_id' => $tenantClinicaId, 'assigned_at' => now()],
            ['id' => Str::uuid(), 'user_id' => $userApproverId, 'role_id' => 'APPROVER', 'tenant_id' => $tenantClinicaId, 'assigned_at' => now()],
        ]);

        // 5. Categoría
        $catCirugiaId = Str::uuid()->toString();
        DB::table('document_categories')->insert([
            'id' => $catCirugiaId,
            'tenant_id' => $tenantClinicaId,
            'department_id' => $deptCirugiaId,
            'name' => 'Reportes Quirúrgicos',
            'description' => 'Informes clínicos y videos de quirófano',
            'created_at' => now(),
        ]);

        // 6. Documento y Versiones (Simulando v1 inicial y v2 recién subida)
        $docId = Str::uuid()->toString();
        $v1Id = Str::uuid()->toString();
        $v2Id = Str::uuid()->toString();

        DB::table('documents')->insert([
            'id' => $docId,
            'tenant_id' => $tenantClinicaId,
            'category_id' => $catCirugiaId,
            'title' => 'Reporte Cirugía Paciente 401',
            'current_version_id' => null,
            'is_locked' => false,
            'created_by' => $userEditorId,
            'created_at' => now(),
        ]);

        DB::table('document_versions')->insert([
            [
                'id' => $v1Id,
                'document_id' => $docId,
                'version_number' => 1,
                'status' => 'DEPRECATED',
                'storage_bucket' => 'documents-vault',
                'storage_key' => "clinica-olivos/docs/{$docId}/v1/e3b0c44298fc1c149afbf4c8996fb924.docx",
                'original_filename' => 'reporte_inicial.docx',
                'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'file_size_bytes' => 45200,
                'sha256_hash' => 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                'change_summary' => 'Creación del documento base',
                'created_by' => $userEditorId,
                'created_at' => now()->subHours(2),
            ],
            [
                'id' => $v2Id,
                'document_id' => $docId,
                'version_number' => 2,
                'status' => 'ACTIVE',
                'storage_bucket' => 'documents-vault',
                'storage_key' => "clinica-olivos/docs/{$docId}/v2/4f53cda18c2baa0c0354bb5f9a3ecbe5.pdf",
                'original_filename' => 'reporte_corregido.pdf',
                'mime_type' => 'application/pdf',
                'file_size_bytes' => 88120,
                'sha256_hash' => '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
                'change_summary' => 'Corrección de diagnósticos y exportación a PDF',
                'created_by' => $userEditorId,
                'created_at' => now(),
            ],
        ]);

        DB::table('documents')->where('id', $docId)->update(['current_version_id' => $v2Id]);

        // 7. Registro de Auditoría
        DB::table('document_audit_logs')->insert([
            [
                'id' => Str::uuid(),
                'tenant_id' => $tenantClinicaId,
                'document_id' => $docId,
                'version_id' => $v1Id,
                'user_id' => $userEditorId,
                'action' => 'VERSION_UPLOADED',
                'sha256_hash' => 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit Integration Test',
                'details' => json_encode(['version' => 1]),
                'created_at' => now()->subHours(2),
            ],
            [
                'id' => Str::uuid(),
                'tenant_id' => $tenantClinicaId,
                'document_id' => $docId,
                'version_id' => $v2Id,
                'user_id' => $userEditorId,
                'action' => 'VERSION_UPLOADED',
                'sha256_hash' => '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit Integration Test',
                'details' => json_encode(['version' => 2]),
                'created_at' => now(),
            ],
        ]);
    }
}