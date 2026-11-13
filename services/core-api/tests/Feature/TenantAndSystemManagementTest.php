<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TenantAndSystemManagementTest extends TestCase
{
    use DatabaseTransactions;

    private User $sysAdmin;
    private User $tenantAdminClinica;
    private User $editorClinica;
    private Tenant $tenantClinica;
    private Tenant $tenantRoot;

    protected function setUp(): void
    {
        parent::setUp();

        // Usuarios reales sembrados por TestScenarioSeeder
        $this->sysAdmin           = User::where('email', 'sysadmin@platform.local')->firstOrFail();
        $this->tenantAdminClinica = User::where('email', 'jhoel.admin.clinica@gmail.com')->firstOrFail();
        $this->editorClinica      = User::where('email', 'carlos.mendoza.cir@gmail.com')->firstOrFail();

        // Organizaciones sembradas
        $this->tenantClinica = Tenant::where('slug', 'clinica-olivos')->firstOrFail();
        $this->tenantRoot    = Tenant::where('slug', 'platform-system')->firstOrFail();
    }

    #[Test]
    public function sysadmin_puede_listar_todos_los_tenants_con_sus_conteos(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->getJson('/api/v1/tenants');

        $response->assertStatus(200)
                 ->assertJsonFragment(['success' => true])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         '*' => [
                             'id',
                             'name',
                             'slug',
                             'status',
                             'users_count',
                             'departments_count',
                             'documents_count',
                         ],
                     ],
                 ]);
    }

    #[Test]
    public function rbac_un_tenant_admin_o_editor_no_puede_gestionar_tenants_ni_ver_metricas_globales(): void
    {
        // 1. Probar con TENANT_ADMIN
        Sanctum::actingAs($this->tenantAdminClinica);
        $this->getJson('/api/v1/tenants')->assertStatus(403);
        $this->postJson('/api/v1/tenants', [
            'name'           => 'Hospital Intruso',
            'slug'           => 'hospital-intruso',
            'admin_name'     => 'Admin Intruso',
            'admin_email'    => 'intruso@hospital.test',
            'admin_password' => 'password123',
        ])->assertStatus(403);
        $this->getJson('/api/v1/system/overview')->assertStatus(403);

        // 2. Probar con EDITOR
        Sanctum::actingAs($this->editorClinica);
        $this->getJson('/api/v1/tenants')->assertStatus(403);
        $this->patchJson("/api/v1/tenants/{$this->tenantClinica->id}/status", [
            'status' => 'SUSPENDED',
        ])->assertStatus(403);
    }

    #[Test]
    public function sysadmin_puede_aprovisionar_un_nuevo_tenant_y_su_tenant_admin_atomico(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $payload = [
            'name'           => 'Farmacias Chavez Bolivia',
            'slug'           => 'farmacias-chavez',
            'admin_name'     => 'Lic. Alejandro Chavez',
            'admin_email'    => 'alejandro.admin@farmaciaschavez.bo',
            'admin_password' => 'password123',
        ];

        $response = $this->postJson('/api/v1/tenants', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'success' => true,
                     'slug'    => 'farmacias-chavez',
                     'email'   => 'alejandro.admin@farmaciaschavez.bo',
                     'role'    => 'TENANT_ADMIN',
                 ]);

        // Verificar persistencia en PostgreSQL
        $this->assertDatabaseHas('tenants', [
            'name'   => 'FARMACIAS CHAVEZ BOLIVIA',
            'slug'   => 'farmacias-chavez',
            'status' => 'ACTIVE',
        ]);

        $nuevoTenant = Tenant::where('slug', 'farmacias-chavez')->firstOrFail();
        $nuevoAdmin  = User::withoutGlobalScopes()
            ->where('email', 'alejandro.admin@farmaciaschavez.bo')
            ->firstOrFail();

        $this->assertEquals($nuevoTenant->id, $nuevoAdmin->tenant_id);
        $this->assertNull($nuevoAdmin->department_id);

        $this->assertDatabaseHas('user_roles', [
            'user_id'     => $nuevoAdmin->id,
            'role_id'     => 'TENANT_ADMIN',
            'tenant_id'   => $nuevoTenant->id,
            'assigned_by' => $this->sysAdmin->id,
        ]);
    }

    #[Test]
    public function falla_validacion_al_crear_tenant_con_slug_o_correo_duplicado(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->postJson('/api/v1/tenants', [
            'name'           => 'Clínica Duplicada',
            'slug'           => 'clinica-olivos', // Ya existe en seeder
            'admin_name'     => 'Otro Admin',
            'admin_email'    => 'jhoel.admin.clinica@gmail.com', // Ya existe en seeder
            'admin_password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['slug', 'admin_email']);
    }

    #[Test]
    public function sysadmin_puede_suspender_un_tenant_y_revocar_tokens_activos_de_sus_usuarios(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        // Generar un token activo real para un usuario de la Clínica
        $tokenModel = $this->tenantAdminClinica->createToken('test-session');
        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $tokenModel->accessToken->id,
        ]);

        // Suspender el tenant Clínica de los Olivos
        $response = $this->patchJson("/api/v1/tenants/{$this->tenantClinica->id}/status", [
            'status' => 'SUSPENDED',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['status' => 'SUSPENDED']);

        $this->assertEquals('SUSPENDED', $this->tenantClinica->fresh()->status);

        // Verificar que todos los tokens de los usuarios de esa organización fueron revocados
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $this->tenantAdminClinica->id,
        ]);
    }

    #[Test]
    public function no_permite_suspender_el_tenant_raiz_de_la_plataforma(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $response = $this->patchJson("/api/v1/tenants/{$this->tenantRoot->id}/status", [
            'status' => 'SUSPENDED',
        ]);

        $response->assertStatus(422)
                 ->assertJsonFragment(['success' => false]);

        $this->assertEquals('ACTIVE', $this->tenantRoot->fresh()->status);
    }

    #[Test]
    public function sysadmin_puede_consultar_metricas_globales_de_infraestructura(): void
    {
        // Simular respuesta saludable del microservicio NestJS (doc-processor)
        Http::fake([
            'http://doc-processor:3000*' => Http::response(['status' => 'ok'], 200),
        ]);

        Sanctum::actingAs($this->sysAdmin);

        $response = $this->getJson('/api/v1/system/overview');

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'core_api'      => 'ONLINE',
                     'database'      => 'ONLINE',
                     'doc_processor' => 'ONLINE',
                     'minio_storage' => 'ONLINE',
                 ])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'services' => ['core_api', 'database', 'doc_processor', 'minio_storage'],
                         'stats'    => [
                             'tenants_total',
                             'tenants_active',
                             'users_total',
                             'documents_total',
                             'versions_total',
                             'storage_bytes',
                             'locked_documents',
                         ],
                     ],
                 ]);
    }

    public function system_admin_puede_editar_el_nombre_de_una_organizacion_sin_alterar_su_slug(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $tenant = Tenant::where('slug', 'clinica-olivos')->firstOrFail();

        $response = $this->patchJson("/api/v1/tenants/{$tenant->id}", [
            'name' => 'Clínica de los Olivos Renovada',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'success' => true,
                     'name'    => 'CLÍNICA DE LOS OLIVOS RENOVADA',
                     'slug'    => 'clinica-olivos',
                 ]);

        $this->assertDatabaseHas('tenants', [
            'id'   => $tenant->id,
            'name' => 'CLÍNICA DE LOS OLIVOS RENOVADA',
            'slug' => 'clinica-olivos',
        ]);
    }

    #[Test]
    public function no_permite_editar_la_organizacion_raiz_platform_system(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $rootTenant = Tenant::where('slug', 'platform-system')->firstOrFail();

        $response = $this->patchJson("/api/v1/tenants/{$rootTenant->id}", [
            'name' => 'Intento Cambio Root',
        ]);

        $response->assertStatus(403)
                 ->assertJsonFragment([
                     'success' => false,
                 ]);
    }
    #[Test]
    public function rutas_de_plataforma_validan_bearer_token_real_de_sanctum(): void
    {
        $token = $this->sysAdmin->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
             ->getJson('/api/v1/system/overview')
             ->assertStatus(200)
             ->assertJsonFragment(['success' => true]);
    }

    #[Test]
    public function system_admin_puede_editar_el_nombre_y_slug_de_una_organizacion(): void
    {
        Sanctum::actingAs($this->sysAdmin);

        $tenant = Tenant::where('slug', 'clinica-olivos')->firstOrFail();

        $response = $this->patchJson("/api/v1/tenants/{$tenant->id}", [
            'name' => 'Clínica de los Olivos Renovada',
            'slug' => 'clinica-de-los-olivos-renovada',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'success' => true,
                     'name'    => 'CLÍNICA DE LOS OLIVOS RENOVADA',
                     'slug'    => 'clinica-de-los-olivos-renovada',
                 ]);

        $this->assertDatabaseHas('tenants', [
            'id'   => $tenant->id,
            'name' => 'CLÍNICA DE LOS OLIVOS RENOVADA',
            'slug' => 'clinica-de-los-olivos-renovada',
        ]);
    }
}