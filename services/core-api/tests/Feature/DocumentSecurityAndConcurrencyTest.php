<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DocumentSecurityAndConcurrencyTest extends TestCase
{
    use DatabaseTransactions;

    private Document $documentoCirugia;
    private User $adminClinica;
    private User $cirujano1;
    private User $cirujano2;
    private User $radiologo;
    private User $viewerClinica;
    private User $viewerAdmisiones;
    private User $abogadoBufete;

    protected function setUp(): void
    {
        parent::setUp();

        // Tomar directamente los usuarios y datos creados por TestScenarioSeeder
        $this->adminClinica     = User::where('email', 'jhoel.admin.clinica@gmail.com')->firstOrFail();
        $this->cirujano1        = User::where('email', 'carlos.mendoza.cir@gmail.com')->firstOrFail();
        $this->cirujano2        = User::where('email', 'mariana.quispe.cir@gmail.com')->firstOrFail();
        $this->radiologo        = User::where('email', 'rodrigo.vargas.rad@gmail.com')->firstOrFail();
        $this->viewerClinica    = User::where('email', 'victor.pinto.view@gmail.com')->firstOrFail();
        $this->viewerAdmisiones = User::where('email', 'edgar.chavez.view@gmail.com')->firstOrFail();
        $this->abogadoBufete    = User::where('email', 'elena.ramos.lit@gmail.com')->firstOrFail();

        // Tomar el documento médico ya sembrado en el seeder
        $this->documentoCirugia = Document::where('title', 'Reporte Cirugía Paciente 401')->firstOrFail();
    }

    private function crearUsuario(string $tenantId, array $deptIds, string $email, string $role): User
    {
        $user = User::create([
            'tenant_id' => $tenantId,
            'email'     => $email,
            'full_name' => 'Usuario ' . $role,
            'password'  => Hash::make('password123'),
            'status'    => 'ACTIVE',
        ]);

        DB::table('user_roles')->insert([
            'id'          => Str::uuid()->toString(),
            'user_id'     => $user->id,
            'role_id'     => $role,
            'tenant_id'   => $tenantId,
            'assigned_at' => now(),
        ]);

        if (! empty($deptIds)) {
            $syncData = [];
            foreach ($deptIds as $index => $deptId) {
                $syncData[$deptId] = [
                    'id'          => Str::uuid()->toString(),
                    'is_primary'  => $index === 0,
                    'assigned_at' => now(),
                ];
            }
            $user->departments()->sync($syncData);
        }

        return $user;
    }

    #[Test]
    public function un_usuario_no_puede_ver_documentos_de_otro_tenant(): void
    {
        Sanctum::actingAs($this->abogadoBufete);

        $response = $this->getJson('/api/v1/documents');

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data.data'));
    }

    #[Test]
    public function abac_un_editor_no_puede_operar_sobre_un_documento_de_otro_departamento(): void
    {
        Sanctum::actingAs($this->radiologo);

        $response = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/checkout", [
            'reason' => 'Intento indebido de acceso departamental',
        ]);

        $response->assertStatus(403)
                 ->assertJsonFragment(['success' => false]);
    }

    #[Test]
    public function abac_un_viewer_no_ve_documentos_de_departamentos_no_asignados(): void
    {
        // Edgar pertenece solo a Admisiones; el documento es de Cirugía
        Sanctum::actingAs($this->viewerAdmisiones);

        $response = $this->getJson('/api/v1/documents');

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data.data'));
    }

    #[Test]
    public function abac_nm_un_viewer_multi_departamento_accede_a_documentos_de_sus_areas(): void
    {
        // Victor tiene asignados Cirugía, Radiología y Laboratorio
        Sanctum::actingAs($this->viewerClinica);

        $response = $this->getJson('/api/v1/documents');

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($response->json('data.data')));
    }

    #[Test]
    public function rbac_un_viewer_no_puede_adquirir_candados_de_edicion(): void
    {
        Sanctum::actingAs($this->viewerClinica);

        $response = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/checkout");

        $response->assertStatus(403);
    }

    #[Test]
    public function concurrencia_un_segundo_editor_recibe_423_si_el_documento_ya_esta_bloqueado(): void
    {
        Sanctum::actingAs($this->cirujano1);
        $res1 = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/checkout", ['reason' => 'Editando']);
        $res1->assertStatus(200);

        Sanctum::actingAs($this->cirujano2);
        $res2 = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/checkout", ['reason' => 'Conflicto']);
        
        $res2->assertStatus(423);
    }

    #[Test]
    public function concurrencia_un_editor_no_puede_liberar_el_candado_adquirido_por_otro(): void
    {
        $this->documentoCirugia->update([
            'is_locked'         => true,
            'locked_by_user_id' => $this->cirujano1->id,
            'locked_at'         => now(),
        ]);

        Sanctum::actingAs($this->cirujano2);
        $response = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/discard-checkout");

        $response->assertStatus(403);
    }

    #[Test]
    public function un_tenant_admin_puede_forzar_el_desbloqueo_de_cualquier_documento(): void
    {
        $this->documentoCirugia->update([
            'is_locked'         => true,
            'locked_by_user_id' => $this->cirujano1->id,
            'locked_at'         => now(),
        ]);

        Sanctum::actingAs($this->adminClinica);
        $response = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/discard-checkout");

        $response->assertStatus(200);
        $this->assertFalse($this->documentoCirugia->fresh()->is_locked);
    }

    #[Test]
    public function multi_rol_y_nm_login_devuelve_todos_los_roles_y_departamentos_del_usuario(): void
    {
        // Dr. Carlos Mendoza: EDITOR + APPROVER en Cirugía y Consultas
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'carlos.mendoza.cir@gmail.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['email' => 'carlos.mendoza.cir@gmail.com']);

        $roles = $response->json('data.user.roles');
        $deptIds = $response->json('data.user.department_ids');

        $this->assertContains('EDITOR', $roles);
        $this->assertContains('APPROVER', $roles);
        $this->assertCount(2, $deptIds);
    }

    #[Test]
    public function abac_un_usuario_no_puede_ver_detalle_ni_versiones_de_un_departamento_no_asignado(): void
    {
        // Edgar pertenece solo a Admisiones; el documento es de Cirugía
        Sanctum::actingAs($this->viewerAdmisiones);

        $this->getJson("/api/v1/documents/{$this->documentoCirugia->id}")
             ->assertStatus(403);

        $this->getJson("/api/v1/documents/{$this->documentoCirugia->id}/versions")
             ->assertStatus(403);
    }

    #[Test]
    public function filtro_por_departamento_en_listado_de_documentos_funciona_para_usuario_nm(): void
    {
        $deptRadiologia = Department::where('tenant_id', $this->viewerClinica->tenant_id)
            ->where('name', 'Radiología')
            ->firstOrFail();

        Sanctum::actingAs($this->viewerClinica);

        // Filtrar por Radiología (Víctor tiene acceso, pero no hay documentos ahí aún) -> 0 resultados
        $resRad = $this->getJson("/api/v1/documents?department_id={$deptRadiologia->id}");
        $resRad->assertStatus(200);
        $this->assertCount(0, $resRad->json('data.data'));

        // Filtrar por Cirugía -> devuelve el expediente de Cirugía
        $deptCirugia = Department::where('tenant_id', $this->viewerClinica->tenant_id)
            ->where('name', 'Cirugía')
            ->firstOrFail();

        $resCir = $this->getJson("/api/v1/documents?department_id={$deptCirugia->id}");
        $resCir->assertStatus(200);
        $this->assertCount(1, $resCir->json('data.data'));
    }

    #[Test]
    public function ciclo_completo_checkin_y_forward_rollback_mantiene_integridad_sha256(): void
    {
        // 1. Editor bloquea el documento
        Sanctum::actingAs($this->cirujano1);
        $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/checkout")
             ->assertStatus(200);

        // 2. Editor consolida v3 mediante check-in
        $hashV3 = hash('sha256', 'contenido-version-3-firmado');
        $checkinRes = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/checkin", [
            'storage_key'       => "clinica-olivos/docs/{$this->documentoCirugia->id}/v3/reporte_v3.pdf",
            'original_filename' => 'reporte_v3.pdf',
            'mime_type'         => 'application/pdf',
            'file_size_bytes'   => 95400,
            'sha256_hash'       => $hashV3,
            'change_summary'    => 'Firma digital postoperatoria',
        ]);

        $checkinRes->assertStatus(201)
                   ->assertJsonFragment(['version_number' => 3]);

        $this->assertFalse($this->documentoCirugia->fresh()->is_locked);

        // 3. Approver ejecuta forward-rollback hacia la v1 creando v4 con el SHA-256 original
        $approver = User::where('email', 'patricia.revisora.med@gmail.com')->firstOrFail();
        $v1 = $this->documentoCirugia->versions()->where('version_number', 1)->firstOrFail();

        Sanctum::actingAs($approver);
        $rollbackRes = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/rollback", [
            'target_version_id' => $v1->id,
            'reason'            => 'Revertir a plantilla base aprobada',
        ]);

        $rollbackRes->assertStatus(201)
                    ->assertJsonFragment([
                        'version_number' => 4,
                        'sha256_hash'    => $v1->sha256_hash,
                    ]);
    }

    #[Test]
    public function revocar_departamento_a_usuario_bloquea_su_acceso_abac_inmediatamente(): void
    {
        $deptRadiologia = Department::where('tenant_id', $this->adminClinica->tenant_id)
            ->where('name', 'Radiología')
            ->firstOrFail();

        // Admin deja a Víctor únicamente en Radiología (le quita Cirugía)
        Sanctum::actingAs($this->adminClinica);
        $this->patchJson("/api/v1/users/{$this->viewerClinica->id}", [
            'department_ids' => [$deptRadiologia->id],
        ])->assertStatus(200);

        // Víctor ya no puede ver ni consultar el expediente de Cirugía
        Sanctum::actingAs($this->viewerClinica->fresh());
        $listRes = $this->getJson('/api/v1/documents');
        $this->assertCount(0, $listRes->json('data.data'));

        $this->getJson("/api/v1/documents/{$this->documentoCirugia->id}")
             ->assertStatus(403);
    }
}