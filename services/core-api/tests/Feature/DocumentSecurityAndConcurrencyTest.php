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

    private Tenant $tenantClinica;
    private Tenant $tenantBufete;
    private Department $deptCirugia;
    private Department $deptRadiologia;
    private DocumentCategory $catCirugia;
    private Document $documentoCirugia;
    private User $adminClinica;
    private User $cirujano1;
    private User $cirujano2;
    private User $radiologo;
    private User $viewerClinica;
    private User $abogadoBufete;

    protected function setUp(): void
    {
        parent::setUp();

        // Tomar directamente los usuarios y datos creados por TestScenarioSeeder
        $this->adminClinica  = User::where('email', 'jhoel.admin.clinica@gmail.com')->firstOrFail();
        $this->cirujano1     = User::where('email', 'carlos.mendoza.cir@gmail.com')->firstOrFail();
        $this->cirujano2     = User::where('email', 'mariana.quispe.cir@gmail.com')->firstOrFail();
        $this->radiologo     = User::where('email', 'rodrigo.vargas.rad@gmail.com')->firstOrFail();
        $this->viewerClinica = User::where('email', 'victor.pinto.view@gmail.com')->firstOrFail();
        $this->abogadoBufete = User::where('email', 'elena.ramos.lit@gmail.com')->firstOrFail();

        // Tomar el documento médico ya sembrado en el seeder
        $this->documentoCirugia = Document::where('title', 'Reporte Cirugía Paciente 401')->firstOrFail();
    }

    private function crearUsuario(string $tenantId, ?string $deptId, string $email, string $role): User
    {
        $user = User::create([
            'tenant_id'     => $tenantId,
            'department_id' => $deptId,
            'email'         => $email,
            'full_name'     => 'Usuario ' . $role,
            'password'      => Hash::make('password123'),
            'status'        => 'ACTIVE',
        ]);

        DB::table('user_roles')->insert([
            'id'          => Str::uuid()->toString(),
            'user_id'     => $user->id,
            'role_id'     => $role,
            'tenant_id'   => $tenantId,
            'assigned_at' => now(),
        ]);

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
}