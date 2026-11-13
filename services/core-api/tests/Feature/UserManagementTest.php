<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use DatabaseTransactions;

    private User $adminClinica;
    private User $cirujanoClinica;
    private User $adminBufete;
    private Department $deptCirugia;
    private Department $deptLitigio;

    protected function setUp(): void
    {
        parent::setUp();

        // Tomar usuarios reales sembrados por TestScenarioSeeder
        $this->adminClinica    = User::where('email', 'jhoel.admin.clinica@gmail.com')->firstOrFail();
        $this->cirujanoClinica = User::where('email', 'carlos.mendoza.cir@gmail.com')->firstOrFail();
        $this->adminBufete     = User::where('email', 'roberto.admin.bufete@gmail.com')->firstOrFail();

        // Departamentos reales de cada organización
        $this->deptCirugia = Department::where('tenant_id', $this->adminClinica->tenant_id)
            ->where('name', 'Cirugía')
            ->firstOrFail();

        $this->deptLitigio = Department::where('tenant_id', $this->adminBufete->tenant_id)
            ->where('name', 'Litigio')
            ->firstOrFail();
    }

    #[Test]
    public function un_tenant_admin_puede_listar_solo_usuarios_de_su_propio_tenant(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200)
                 ->assertJsonFragment(['success' => true]);

        $usuarios = $response->json('data.data');
        $this->assertNotEmpty($usuarios);

        foreach ($usuarios as $usuario) {
            $this->assertEquals($this->adminClinica->tenant_id, $usuario['tenant_id']);
        }
    }

    #[Test]
    public function rbac_un_editor_no_puede_listar_ni_crear_usuarios(): void
    {
        Sanctum::actingAs($this->cirujanoClinica);

        $this->getJson('/api/v1/users')->assertStatus(403);

        $this->postJson('/api/v1/users', [
            'full_name'     => 'Usuario No Autorizado',
            'email'         => 'noauth@clinica.test',
            'password'      => 'password123',
            'role_id'       => 'VIEWER',
            'department_id' => $this->deptCirugia->id,
        ])->assertStatus(403);
    }

    #[Test]
    public function un_tenant_admin_puede_crear_un_editor_con_departamento_valido(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $payload = [
            'full_name'     => 'Dr. Mateo Siles Prueba',
            'email'         => 'mateo.siles.test@clinica.com',
            'password'      => 'password123',
            'role_id'       => 'EDITOR',
            'department_id' => $this->deptCirugia->id,
        ];

        $response = $this->postJson('/api/v1/users', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'email'     => 'mateo.siles.test@clinica.com',
                     'tenant_id' => $this->adminClinica->tenant_id,
                     'status'    => 'ACTIVE',
                 ]);

        $this->assertDatabaseHas('users', [
            'email'         => 'mateo.siles.test@clinica.com',
            'tenant_id'     => $this->adminClinica->tenant_id,
            'department_id' => $this->deptCirugia->id,
        ]);

        $userId = $response->json('data.id');
        $this->assertDatabaseHas('user_roles', [
            'user_id'   => $userId,
            'role_id'   => 'EDITOR',
            'tenant_id' => $this->adminClinica->tenant_id,
        ]);
    }

    #[Test]
    public function falla_validacion_al_crear_editor_o_viewer_sin_departamento(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $response = $this->postJson('/api/v1/users', [
            'full_name' => 'Editor Sin Area',
            'email'     => 'sin.area@clinica.com',
            'password'  => 'password123',
            'role_id'   => 'EDITOR',
        ]);

        $response->assertStatus(422)
                 ->assertJsonFragment(['success' => false]);
    }

    #[Test]
    public function aislamiento_tenant_no_permite_asignar_departamento_de_otra_organizacion(): void
    {
        Sanctum::actingAs($this->adminClinica);

        // Intenta asignar el departamento 'Litigio' que pertenece al Bufete Baldivieso
        $response = $this->postJson('/api/v1/users', [
            'full_name'     => 'Usuario Cruzado',
            'email'         => 'cruzado@clinica.com',
            'password'      => 'password123',
            'role_id'       => 'EDITOR',
            'department_id' => $this->deptLitigio->id,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['department_id']);
    }

    #[Test]
    public function no_permite_escalar_privilegios_creando_un_system_admin(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $response = $this->postJson('/api/v1/users', [
            'full_name' => 'Intento Super Admin',
            'email'     => 'hacker@clinica.com',
            'password'  => 'password123',
            'role_id'   => 'SYSTEM_ADMIN',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['role_id']);
    }

    #[Test]
    public function un_tenant_admin_puede_actualizar_rol_y_suspender_un_usuario_de_su_tenant(): void
    {
        Sanctum::actingAs($this->adminClinica);

        // Actualizar rol de cirujano a APPROVER
        $updateRes = $this->patchJson("/api/v1/users/{$this->cirujanoClinica->id}", [
            'role_id' => 'APPROVER',
        ]);

        $updateRes->assertStatus(200);
        $this->assertDatabaseHas('user_roles', [
            'user_id' => $this->cirujanoClinica->id,
            'role_id' => 'APPROVER',
        ]);

        // Baja lógica (suspensión)
        $deleteRes = $this->deleteJson("/api/v1/users/{$this->cirujanoClinica->id}");
        $deleteRes->assertStatus(200);

        $this->assertEquals('SUSPENDED', $this->cirujanoClinica->fresh()->status);
    }

    #[Test]
    public function un_tenant_admin_no_puede_desactivar_su_propia_cuenta(): void
    {
        Sanctum::actingAs($this->adminClinica);

        $response = $this->deleteJson("/api/v1/users/{$this->adminClinica->id}");

        $response->assertStatus(422)
                 ->assertJsonFragment(['success' => false]);
    }

    #[Test]
    public function aislamiento_tenant_no_permite_ver_ni_modificar_usuarios_de_otro_tenant(): void
    {
        // Admin del Bufete intenta ver o suspender al Cirujano de la Clínica
        Sanctum::actingAs($this->adminBufete);

        $this->getJson("/api/v1/users/{$this->cirujanoClinica->id}")->assertStatus(404);
        $this->deleteJson("/api/v1/users/{$this->cirujanoClinica->id}")->assertStatus(404);
    }
}