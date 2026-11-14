<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OrganizationAndAuditManagementTest extends TestCase
{
    use DatabaseTransactions;

    private User $adminClinica;
    private User $cirujanoClinica;
    private User $viewerClinica;
    private User $adminBufete;
    private Department $deptCirugia;
    private Department $deptLitigio;
    private Document $documentoCirugia;

    protected function setUp(): void
    {
        parent::setUp();

        // Usuarios reales sembrados por TestScenarioSeeder
        $this->adminClinica    = User::where('email', 'jhoel.admin.clinica@gmail.com')->firstOrFail();
        $this->cirujanoClinica = User::where('email', 'carlos.mendoza.cir@gmail.com')->firstOrFail();
        $this->viewerClinica   = User::where('email', 'victor.pinto.view@gmail.com')->firstOrFail();
        $this->adminBufete     = User::where('email', 'roberto.admin.bufete@gmail.com')->firstOrFail();

        // Departamentos y documento base
        $this->deptCirugia = Department::where('tenant_id', $this->adminClinica->tenant_id)
            ->where('name', 'Cirugía')
            ->firstOrFail();

        $this->deptLitigio = Department::where('tenant_id', $this->adminBufete->tenant_id)
            ->where('name', 'Litigio')
            ->firstOrFail();

        $this->documentoCirugia = Document::where('title', 'Reporte Cirugía Paciente 401')->firstOrFail();
    }

    // =========================================================================
    // 1. GESTIÓN DE DEPARTAMENTOS (OrganizationController)
    // =========================================================================

    #[Test]
    public function un_tenant_admin_puede_listar_departamentos_solo_de_su_organizacion_con_conteos(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $response = $this->getJson('/api/v1/departments');

        $response->assertStatus(200)
                 ->assertJsonFragment(['success' => true])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         '*' => ['id', 'tenant_id', 'name', 'users_count', 'categories_count'],
                     ],
                 ]);

        foreach ($response->json('data') as $dept) {
            $this->assertEquals($this->adminClinica->tenant_id, $dept['tenant_id']);
        }
    }

    #[Test]
    public function rbac_un_editor_o_viewer_puede_leer_catalogos_pero_no_crear_ni_editar_departamentos(): void
    {
        Sanctum::actingAs($this->cirujanoClinica);

        // Lectura permitida
        $this->getJson('/api/v1/departments')->assertStatus(200);
        $this->getJson('/api/v1/categories')->assertStatus(200);

        // Escritura bloqueada por abac:dept:manage
        $this->postJson('/api/v1/departments', ['name' => 'Cardiología'])->assertStatus(403);
        $this->patchJson("/api/v1/departments/{$this->deptCirugia->id}", ['name' => 'Hack'])->assertStatus(403);
        $this->deleteJson("/api/v1/departments/{$this->deptCirugia->id}")->assertStatus(403);
    }

    #[Test]
    public function un_tenant_admin_puede_crear_y_actualizar_un_departamento_en_su_tenant(): void
    {
        Sanctum::actingAs($this->adminClinica);

        // Crear departamento
        $createRes = $this->postJson('/api/v1/departments', [
            'name' => 'Pediatría',
        ]);

        $createRes->assertStatus(201)
                  ->assertJsonFragment([
                      'success'   => true,
                      'name'      => 'Pediatría',
                      'tenant_id' => $this->adminClinica->tenant_id,
                  ]);

        $deptId = $createRes->json('data.id');

        // Actualizar nombre
        $updateRes = $this->patchJson("/api/v1/departments/{$deptId}", [
            'name' => 'Pediatría General',
        ]);

        $updateRes->assertStatus(200)
                  ->assertJsonFragment(['name' => 'Pediatría General']);

        $this->assertDatabaseHas('departments', [
            'id'        => $deptId,
            'tenant_id' => $this->adminClinica->tenant_id,
            'name'      => 'Pediatría General',
        ]);
    }

    #[Test]
    public function unicidad_por_tenant_no_permite_duplicar_departamento_en_el_mismo_tenant_pero_si_en_otro(): void
    {
        // 1. Mismo tenant -> Falla 422
        Sanctum::actingAs($this->adminClinica);
        $this->postJson('/api/v1/departments', ['name' => 'Cirugía'])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['name']);

        // 2. Otro tenant (Bufete) -> Permitido 201
        Sanctum::actingAs($this->adminBufete);
        $this->postJson('/api/v1/departments', ['name' => 'Cirugía'])
             ->assertStatus(201);
    }

    #[Test]
    public function no_permite_eliminar_un_departamento_que_tiene_usuarios_o_categorias_asignadas(): void
    {
        Sanctum::actingAs($this->adminClinica);

        // Cirugía ya tiene cirujanos y categorías en el seeder
        $response = $this->deleteJson("/api/v1/departments/{$this->deptCirugia->id}");

        $response->assertStatus(422)
                 ->assertJsonFragment(['success' => false]);

        $this->assertDatabaseHas('departments', ['id' => $this->deptCirugia->id]);
    }

    #[Test]
    public function un_tenant_admin_puede_eliminar_un_departamento_vacio(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $deptVacio = Department::create([
            'tenant_id' => $this->adminClinica->tenant_id,
            'name'      => 'Área Temporal',
        ]);

        $this->deleteJson("/api/v1/departments/{$deptVacio->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('departments', ['id' => $deptVacio->id]);
    }

    // =========================================================================
    // 2. GESTIÓN DE CATEGORÍAS DOCUMENTALES (OrganizationController)
    // =========================================================================

    #[Test]
    public function un_tenant_admin_puede_crear_editar_y_eliminar_una_categoria_vacia(): void
    {
        Sanctum::actingAs($this->adminClinica);

        // Crear categoría vinculada al departamento Cirugía
        $createRes = $this->postJson('/api/v1/categories', [
            'department_id' => $this->deptCirugia->id,
            'name'          => 'Protocolos Postoperatorios',
            'description'   => 'Guías de seguimiento tras intervención quirúrgica',
        ]);

        $createRes->assertStatus(201)
                  ->assertJsonFragment([
                      'name'          => 'Protocolos Postoperatorios',
                      'department_id' => $this->deptCirugia->id,
                  ]);

        $catId = $createRes->json('data.id');

        // Editar
        $this->patchJson("/api/v1/categories/{$catId}", [
            'name' => 'Protocolos Quirúrgicos',
        ])->assertStatus(200)
          ->assertJsonFragment(['name' => 'Protocolos Quirúrgicos']);

        // Eliminar (no tiene documentos aún)
        $this->deleteJson("/api/v1/categories/{$catId}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('document_categories', ['id' => $catId]);
    }

    #[Test]
    public function aislamiento_tenant_no_permite_crear_categoria_en_departamento_de_otro_tenant(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $response = $this->postJson('/api/v1/categories', [
            'department_id' => $this->deptLitigio->id, // Pertenece al Bufete
            'name'          => 'Categoría Cruzada',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['department_id']);
    }

    // =========================================================================
    // 3. BITÁCORA DE AUDITORÍA Y DESBLOQUEO FORZADO (AuditLog & DocumentController)
    // =========================================================================

    #[Test]
    public function un_tenant_admin_puede_consultar_bitacora_forense_solo_de_su_tenant(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $response = $this->getJson('/api/v1/audit-logs');

        $response->assertStatus(200)
                 ->assertJsonFragment(['success' => true]);

        foreach ($response->json('data.data') as $log) {
            $this->assertEquals($this->adminClinica->tenant_id, $log['tenant_id']);
        }

        // Un VIEWER no tiene audit:read
        Sanctum::actingAs($this->viewerClinica);
        $this->getJson('/api/v1/audit-logs')->assertStatus(403);
    }

    #[Test]
    public function un_tenant_admin_puede_ejecutar_force_unlock_con_motivo_y_registrar_auditoria(): void
    {
        $this->documentoCirugia->update([
            'is_locked'         => true,
            'locked_by_user_id' => $this->cirujanoClinica->id,
            'locked_at'         => now(),
        ]);

        Sanctum::actingAs($this->adminClinica);

        $response = $this->postJson("/api/v1/documents/{$this->documentoCirugia->id}/force-unlock", [
            'reason' => 'El cirujano salió de guardia sin liberar el expediente',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['success' => true]);

        $this->assertFalse($this->documentoCirugia->fresh()->is_locked);
        $this->assertNull($this->documentoCirugia->fresh()->locked_by_user_id);

        // Verificar que quedó registrado en la bitácora forense
       $this->assertDatabaseHas('document_audit_logs', [
            'tenant_id'   => $this->adminClinica->tenant_id,
            'user_id'     => $this->adminClinica->id,
            'document_id' => $this->documentoCirugia->id,
            'action'      => 'FORCE_UNLOCKED',
        ]);
    }
}