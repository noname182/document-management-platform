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
        $tenantSystemId  = Str::uuid()->toString();
        // 1. Tenants
        $tenantClinicaId = Str::uuid()->toString();
        $tenantBufeteId = Str::uuid()->toString();
        $tenantBancoId = Str::uuid()->toString();

        DB::table('tenants')->insert([
            ['id' => $tenantSystemId,  'name' => 'PLATFORM SYSTEM ROOT',    'slug' => 'platform-system',  'status' => 'ACTIVE', 'created_at' => now()],
            ['id' => $tenantClinicaId, 'name' => 'CLINICA DE LOS OLIVOS', 'slug' => 'clinica-olivos', 'status' => 'ACTIVE', 'created_at' => now()],
            ['id' => $tenantBufeteId, 'name' => 'BUFETE BALDIVIESO', 'slug' => 'bufete-baldivieso', 'status' => 'ACTIVE', 'created_at' => now()],
            ['id' => $tenantBancoId, 'name' => 'BANCO SOL', 'slug' => 'banco-sol', 'status' => 'ACTIVE', 'created_at' => now()],
        ]);

        // 2.1. Departamentos (Clínica)
        $deptCirugiaId = Str::uuid()->toString();
        $deptRadiologíaId = Str::uuid()->toString();
        $deptLaboratorioId = Str::uuid()->toString();
        $deptAdmisionesId = Str::uuid()->toString();
        $deptConsultasId = Str::uuid()->toString();

        DB::table('departments')->insert([
            ['id' => $deptCirugiaId, 'tenant_id' => $tenantClinicaId, 'name' => 'Cirugía', 'created_at' => now()],
            ['id' => $deptRadiologíaId, 'tenant_id' => $tenantClinicaId, 'name' => 'Radiología', 'created_at' => now()],
            ['id' => $deptLaboratorioId, 'tenant_id' => $tenantClinicaId, 'name' => 'Laboratorio', 'created_at' => now()],
            ['id' => $deptAdmisionesId, 'tenant_id' => $tenantClinicaId, 'name' => 'Admisiones', 'created_at' => now()],
            ['id' => $deptConsultasId, 'tenant_id' => $tenantClinicaId, 'name' => 'Consultas', 'created_at' => now()],
        ]);

        // 2.2. Departamentos (Bufete)
        $deptLitigioId = Str::uuid()->toString();
        $deptCorporativoId = Str::uuid()->toString();
        $deptNotaríaId = Str::uuid()->toString();

        DB::table('departments')->insert([
            ['id' => $deptLitigioId, 'tenant_id' => $tenantBufeteId, 'name' => 'Litigio', 'created_at' => now()],
            ['id' => $deptCorporativoId, 'tenant_id' => $tenantBufeteId, 'name' => 'Corporativo', 'created_at' => now()],
            ['id' => $deptNotaríaId, 'tenant_id' => $tenantBufeteId, 'name' => 'Notoría', 'created_at' => now()],
        ]);

        // 2.3. Departamentos (Banco)
        $deptRiesgosId = Str::uuid()->toString();
        $deptOperacionesId = Str::uuid()->toString();
        $deptCumplimientoId = Str::uuid()->toString();
        $deptRecursosHumanosId = Str::uuid()->toString();

        DB::table('departments')->insert([
            ['id' => $deptRiesgosId, 'tenant_id' => $tenantBancoId, 'name' => 'Riesgos y Créditos', 'created_at' => now()],
            ['id' => $deptOperacionesId, 'tenant_id' => $tenantBancoId, 'name' => 'Operaciones y Cuentas', 'created_at' => now()],
            ['id' => $deptCumplimientoId, 'tenant_id' => $tenantBancoId, 'name' => 'Cumplimiento / Legal', 'created_at' => now()],
            ['id' => $deptRecursosHumanosId, 'tenant_id' => $tenantBancoId, 'name' => 'Recursos Humanos', 'created_at' => now()],
        ]);

        // 3. Usuarios
        $userAdminId1 = Str::uuid()->toString();
        $userAdminId2 = Str::uuid()->toString();
        $userAdminId3 = Str::uuid()->toString();

        $userApproverId1 = Str::uuid()->toString();
        $userApproverId2 = Str::uuid()->toString();
        $userApproverId3 = Str::uuid()->toString();
        $userApproverId4 = Str::uuid()->toString();

        $userEditorId1 = Str::uuid()->toString();    
        $userEditorId2 = Str::uuid()->toString();
        $userEditorId3 = Str::uuid()->toString();
        $userEditorId4 = Str::uuid()->toString();    
        $userEditorId5 = Str::uuid()->toString();
        $userEditorId6 = Str::uuid()->toString();
        $userEditorId7 = Str::uuid()->toString();    
        $userEditorId8 = Str::uuid()->toString();
        $userEditorId9 = Str::uuid()->toString();
        $userEditorId10 = Str::uuid()->toString();
        $userEditorId11 = Str::uuid()->toString();
        $userEditorId12 = Str::uuid()->toString();
        $userEditorId13 = Str::uuid()->toString();    
        $userEditorId14 = Str::uuid()->toString();
        $userEditorId15 = Str::uuid()->toString();
        $userEditorId16 = Str::uuid()->toString();    
        $userEditorId17 = Str::uuid()->toString();
        $userEditorId18 = Str::uuid()->toString();
        $userEditorId19 = Str::uuid()->toString();
        $userEditorId20 = Str::uuid()->toString();
        $userEditorId21 = Str::uuid()->toString();
        $userEditorId22 = Str::uuid()->toString();
        $userEditorId23 = Str::uuid()->toString();
        $userEditorId24 = Str::uuid()->toString();


        $userViewerId1 = Str::uuid()->toString();
        $userViewerId2 = Str::uuid()->toString();
        $userViewerId3 = Str::uuid()->toString();
        $userViewerId4 = Str::uuid()->toString();
        $userViewerId5 = Str::uuid()->toString();
        $userViewerId6 = Str::uuid()->toString();
        $userViewerId7 = Str::uuid()->toString();
        $userViewerId8 = Str::uuid()->toString();
        $userViewerId9 = Str::uuid()->toString();
        $userViewerId10 = Str::uuid()->toString();
        $userViewerId11 = Str::uuid()->toString();
        $userViewerId12 = Str::uuid()->toString();
        $userViewerId13 = Str::uuid()->toString();
        $userViewerId14 = Str::uuid()->toString();
        $userViewerId15 = Str::uuid()->toString();
        $userViewerId16 = Str::uuid()->toString();
        $userViewerId17 = Str::uuid()->toString();
        $userViewerId18 = Str::uuid()->toString();
        $userViewerId19 = Str::uuid()->toString();
        $userViewerId20 = Str::uuid()->toString();
        $userViewerId21 = Str::uuid()->toString();
        $userViewerId22 = Str::uuid()->toString();
        $userViewerId23 = Str::uuid()->toString();
        $userViewerId24 = Str::uuid()->toString();

        $defaultPassword = Hash::make('password123');
        $userSystemAdminId = Str::uuid()->toString();
        // Mapeo estructurado de Usuarios (3 Admins + 3 Approvers + 24 Editors + 24 Viewers = 54 usuarios)
        $usersData = [
            [
                'id'        => $userSystemAdminId,
                'tenant_id' => $tenantSystemId,
                'dept'      => null,
                'email'     => 'sysadmin@platform.local',
                'name'      => 'System Root Admin',
                'role'      => 'SYSTEM_ADMIN'
            ],

            // ==========================================
            // ADMINS (3) - department_id = null
            // ==========================================
            ['id' => $userAdminId1, 'tenant_id' => $tenantClinicaId, 'dept' => null, 'email' => 'jhoel.admin.clinica@gmail.com', 'name' => 'Jhoel Paredes Pava', 'role' => 'TENANT_ADMIN'],
            ['id' => $userAdminId2, 'tenant_id' => $tenantBufeteId,  'dept' => null, 'email' => 'roberto.admin.bufete@gmail.com',  'name' => 'Roberto Baldivieso Guzman', 'role' => 'TENANT_ADMIN'],
            ['id' => $userAdminId3, 'tenant_id' => $tenantBancoId,   'dept' => null, 'email' => 'fernando.admin.banco@gmail.com',   'name' => 'Fernando Soliz Mercado', 'role' => 'TENANT_ADMIN'],

            // ==========================================
            // APPROVERS (3) - department_id = null
            // ==========================================
            ['id' => $userApproverId1, 'tenant_id' => $tenantClinicaId, 'dept' => null, 'email' => 'patricia.revisora.med@gmail.com', 'name' => 'Dra. Patricia Soliz Claros', 'role' => 'APPROVER'],
            ['id' => $userApproverId2, 'tenant_id' => $tenantBufeteId,  'dept' => null, 'email' => 'andres.revisor.legal@gmail.com',  'name' => 'Dr. Andres Torrico Baldivieso', 'role' => 'APPROVER'],
            ['id' => $userApproverId3, 'tenant_id' => $tenantBancoId,   'dept' => null, 'email' => 'clara.revisora.fin@gmail.com',    'name' => 'Lic. Clara Montesinos Siles', 'role' => 'APPROVER'],

            // ==========================================
            // EDITORES CLÍNICA (8) - Cirugía, Radiología, Lab, Admisiones, Consultas
            // ==========================================
            ['id' => $userEditorId1, 'tenant_id' => $tenantClinicaId, 'dept' => $deptCirugiaId,    'email' => 'carlos.mendoza.cir@gmail.com',   'name' => 'Dr. Carlos Mendoza Rojas', 'role' => 'EDITOR'],
            ['id' => $userEditorId2, 'tenant_id' => $tenantClinicaId, 'dept' => $deptCirugiaId,    'email' => 'mariana.quispe.cir@gmail.com',   'name' => 'Dra. Mariana Quispe Flores', 'role' => 'EDITOR'],
            ['id' => $userEditorId3, 'tenant_id' => $tenantClinicaId, 'dept' => $deptRadiologíaId, 'email' => 'rodrigo.vargas.rad@gmail.com',   'name' => 'Dr. Rodrigo Vargas Rocha', 'role' => 'EDITOR'],
            ['id' => $userEditorId4, 'tenant_id' => $tenantClinicaId, 'dept' => $deptRadiologíaId, 'email' => 'camila.navarro.rad@gmail.com',   'name' => 'Dra. Camila Navarro Pinto', 'role' => 'EDITOR'],
            ['id' => $userEditorId5, 'tenant_id' => $tenantClinicaId, 'dept' => $deptLaboratorioId,'email' => 'sergio.arce.lab@gmail.com',      'name' => 'Lic. Sergio Arce Beltran', 'role' => 'EDITOR'],
            ['id' => $userEditorId6, 'tenant_id' => $tenantClinicaId, 'dept' => $deptLaboratorioId,'email' => 'lucia.ticona.lab@gmail.com',     'name' => 'Lic. Lucia Ticona Morales', 'role' => 'EDITOR'],
            ['id' => $userEditorId7, 'tenant_id' => $tenantClinicaId, 'dept' => $deptAdmisionesId,  'email' => 'alvaro.choque.adm@gmail.com',   'name' => 'Alvaro Choque Guaman', 'role' => 'EDITOR'],
            ['id' => $userEditorId8, 'tenant_id' => $tenantClinicaId, 'dept' => $deptConsultasId,   'email' => 'valeria.rios.med@gmail.com',    'name' => 'Dra. Valeria Rios Cabrera', 'role' => 'EDITOR'],

            // ==========================================
            // EDITORES BUFETE (8) - Litigio, Corporativo, Notaría
            // ==========================================
            ['id' => $userEditorId9,  'tenant_id' => $tenantBufeteId, 'dept' => $deptLitigioId,     'email' => 'elena.ramos.lit@gmail.com',      'name' => 'Dra. Elena Ramos Zeballos', 'role' => 'EDITOR'],
            ['id' => $userEditorId10, 'tenant_id' => $tenantBufeteId, 'dept' => $deptLitigioId,     'email' => 'gonzalo.prieto.lit@gmail.com',   'name' => 'Dr. Gonzalo Prieto Teran', 'role' => 'EDITOR'],
            ['id' => $userEditorId11, 'tenant_id' => $tenantBufeteId, 'dept' => $deptLitigioId,     'email' => 'miriam.escalera.lit@gmail.com', 'name' => 'Dra. Miriam Escalera Cruz', 'role' => 'EDITOR'],
            ['id' => $userEditorId12, 'tenant_id' => $tenantBufeteId, 'dept' => $deptCorporativoId, 'email' => 'javier.montano.corp@gmail.com',  'name' => 'Dr. Javier Montano Orellana', 'role' => 'EDITOR'],
            ['id' => $userEditorId13, 'tenant_id' => $tenantBufeteId, 'dept' => $deptCorporativoId, 'email' => 'daniela.suarez.corp@gmail.com',  'name' => 'Dra. Daniela Suarez Peñaranda', 'role' => 'EDITOR'],
            ['id' => $userEditorId14, 'tenant_id' => $tenantBufeteId, 'dept' => $deptCorporativoId, 'email' => 'hector.calle.corp@gmail.com',    'name' => 'Dr. Hector Calle Camacho', 'role' => 'EDITOR'],
            ['id' => $userEditorId15, 'tenant_id' => $tenantBufeteId, 'dept' => $deptNotaríaId,     'email' => 'paola.morales.not@gmail.com',    'name' => 'Dra. Paola Morales Villarroel', 'role' => 'EDITOR'],
            ['id' => $userEditorId16, 'tenant_id' => $tenantBufeteId, 'dept' => $deptNotaríaId,     'email' => 'marcelo.castro.not@gmail.com',   'name' => 'Dr. Marcelo Castro Alarcon', 'role' => 'EDITOR'],

            // ==========================================
            // EDITORES BANCO (8) - Riesgos, Operaciones, Cumplimiento, RRHH
            // ==========================================
            ['id' => $userEditorId17, 'tenant_id' => $tenantBancoId, 'dept' => $deptRiesgosId,          'email' => 'diego.ayala.riesgo@gmail.com',     'name' => 'Lic. Diego Ayala Guzman', 'role' => 'EDITOR'],
            ['id' => $userEditorId18, 'tenant_id' => $tenantBancoId, 'dept' => $deptRiesgosId,          'email' => 'natalia.zambrana.riesgo@gmail.com','name' => 'Lic. Natalia Zambrana Ponce', 'role' => 'EDITOR'],
            ['id' => $userEditorId19, 'tenant_id' => $tenantBancoId, 'dept' => $deptOperacionesId,      'email' => 'oscar.coronel.ops@gmail.com',      'name' => 'Ing. Oscar Coronel Iriarte', 'role' => 'EDITOR'],
            ['id' => $userEditorId20, 'tenant_id' => $tenantBancoId, 'dept' => $deptOperacionesId,      'email' => 'gabriela.paz.ops@gmail.com',       'name' => 'Lic. Gabriela Paz Cordero', 'role' => 'EDITOR'],
            ['id' => $userEditorId21, 'tenant_id' => $tenantBancoId, 'dept' => $deptCumplimientoId,     'email' => 'raul.salazar.legal@gmail.com',     'name' => 'Dr. Raul Salazar Barrientos', 'role' => 'EDITOR'],
            ['id' => $userEditorId22, 'tenant_id' => $tenantBancoId, 'dept' => $deptCumplimientoId,     'email' => 'monica.duran.legal@gmail.com',     'name' => 'Dra. Monica Duran Meneses', 'role' => 'EDITOR'],
            ['id' => $userEditorId23, 'tenant_id' => $tenantBancoId, 'dept' => $deptRecursosHumanosId, 'email' => 'hugo.villazon.rrhh@gmail.com',     'name' => 'Lic. Hugo Villazon Claros', 'role' => 'EDITOR'],
            ['id' => $userEditorId24, 'tenant_id' => $tenantBancoId, 'dept' => $deptRecursosHumanosId, 'email' => 'claudia.loza.rrhh@gmail.com',     'name' => 'Lic. Claudia Loza Cardona', 'role' => 'EDITOR'],

            // ==========================================
            // VIEWERS CLÍNICA (8)
            // ==========================================
            ['id' => $userViewerId1, 'tenant_id' => $tenantClinicaId, 'dept' => $deptCirugiaId,    'email' => 'victor.pinto.view@gmail.com',     'name' => 'Victor Pinto Aguilar', 'role' => 'VIEWER'],
            ['id' => $userViewerId2, 'tenant_id' => $tenantClinicaId, 'dept' => $deptCirugiaId,    'email' => 'lorena.medina.view@gmail.com',    'name' => 'Lorena Medina Caceres', 'role' => 'VIEWER'],
            ['id' => $userViewerId3, 'tenant_id' => $tenantClinicaId, 'dept' => $deptRadiologíaId, 'email' => 'jorge.miranda.view@gmail.com',   'name' => 'Jorge Miranda Bravo', 'role' => 'VIEWER'],
            ['id' => $userViewerId4, 'tenant_id' => $tenantClinicaId, 'dept' => $deptRadiologíaId, 'email' => 'silvia.heredia.view@gmail.com',   'name' => 'Silvia Heredia Salinas', 'role' => 'VIEWER'],
            ['id' => $userViewerId5, 'tenant_id' => $tenantClinicaId, 'dept' => $deptLaboratorioId,'email' => 'ruben.salvatierra.view@gmail.com','name' => 'Ruben Salvatierra Soliz', 'role' => 'VIEWER'],
            ['id' => $userViewerId6, 'tenant_id' => $tenantClinicaId, 'dept' => $deptLaboratorioId,'email' => 'carla.sandoval.view@gmail.com',   'name' => 'Carla Sandoval Justiniano', 'role' => 'VIEWER'],
            ['id' => $userViewerId7, 'tenant_id' => $tenantClinicaId, 'dept' => $deptAdmisionesId,  'email' => 'edgar.chavez.view@gmail.com',     'name' => 'Edgar Chavez Torrico', 'role' => 'VIEWER'],
            ['id' => $userViewerId8, 'tenant_id' => $tenantClinicaId, 'dept' => $deptConsultasId,   'email' => 'sonia.fuentes.view@gmail.com',    'name' => 'Sonia Fuentes Murillo', 'role' => 'VIEWER'],

            // ==========================================
            // VIEWERS BUFETE (8)
            // ==========================================
            ['id' => $userViewerId9,  'tenant_id' => $tenantBufeteId, 'dept' => $deptLitigioId,     'email' => 'gustavo.aguirre.view@gmail.com',  'name' => 'Gustavo Aguirre Mercado', 'role' => 'VIEWER'],
            ['id' => $userViewerId10, 'tenant_id' => $tenantBufeteId, 'dept' => $deptLitigioId,     'email' => 'adriana.velasco.view@gmail.com',  'name' => 'Adriana Velasco Quiroga', 'role' => 'VIEWER'],
            ['id' => $userViewerId11, 'tenant_id' => $tenantBufeteId, 'dept' => $deptLitigioId,     'email' => 'felipe.monasterio.view@gmail.com','name' => 'Felipe Monasterio Saucedo', 'role' => 'VIEWER'],
            ['id' => $userViewerId12, 'tenant_id' => $tenantBufeteId, 'dept' => $deptCorporativoId, 'email' => 'tatiana.bejarano.view@gmail.com', 'name' => 'Tatiana Bejarano Antelo', 'role' => 'VIEWER'],
            ['id' => $userViewerId13, 'tenant_id' => $tenantBufeteId, 'dept' => $deptCorporativoId, 'email' => 'mario.cardona.view@gmail.com',    'name' => 'Mario Cardona Guzman', 'role' => 'VIEWER'],
            ['id' => $userViewerId14, 'tenant_id' => $tenantBufeteId, 'dept' => $deptCorporativoId, 'email' => 'veronica.soliz.view@gmail.com',   'name' => 'Veronica Soliz Rocha', 'role' => 'VIEWER'],
            ['id' => $userViewerId15, 'tenant_id' => $tenantBufeteId, 'dept' => $deptNotaríaId,     'email' => 'luis.tellez.view@gmail.com',      'name' => 'Luis Alberto Tellez', 'role' => 'VIEWER'],
            ['id' => $userViewerId16, 'tenant_id' => $tenantBufeteId, 'dept' => $deptNotaríaId,     'email' => 'gisela.borda.view@gmail.com',     'name' => 'Gisela Borda Carranza', 'role' => 'VIEWER'],

            // ==========================================
            // VIEWERS BANCO (8)
            // ==========================================
            ['id' => $userViewerId17, 'tenant_id' => $tenantBancoId, 'dept' => $deptRiesgosId,          'email' => 'christian.reyes.view@gmail.com',  'name' => 'Christian Reyes Camacho', 'role' => 'VIEWER'],
            ['id' => $userViewerId18, 'tenant_id' => $tenantBancoId, 'dept' => $deptRiesgosId,          'email' => 'teresa.alvarez.view@gmail.com',   'name' => 'Teresa Alvarez Mendizabal', 'role' => 'VIEWER'],
            ['id' => $userViewerId19, 'tenant_id' => $tenantBancoId, 'dept' => $deptOperacionesId,      'email' => 'pablo.ortega.view@gmail.com',     'name' => 'Pablo Ortega Claure', 'role' => 'VIEWER'],
            ['id' => $userViewerId20, 'tenant_id' => $tenantBancoId, 'dept' => $deptOperacionesId,      'email' => 'marina.villena.view@gmail.com',   'name' => 'Marina Villena Barba', 'role' => 'VIEWER'],
            ['id' => $userViewerId21, 'tenant_id' => $tenantBancoId, 'dept' => $deptCumplimientoId,     'email' => 'boris.zegarra.view@gmail.com',    'name' => 'Boris Zegarra Siles', 'role' => 'VIEWER'],
            ['id' => $userViewerId22, 'tenant_id' => $tenantBancoId, 'dept' => $deptCumplimientoId,     'email' => 'elizabeth.calvo.view@gmail.com',  'name' => 'Elizabeth Calvo Hurtado', 'role' => 'VIEWER'],
            ['id' => $userViewerId23, 'tenant_id' => $tenantBancoId, 'dept' => $deptRecursosHumanosId, 'email' => 'guido.anaya.view@gmail.com',      'name' => 'Guido Anaya Ferrufino', 'role' => 'VIEWER'],
            ['id' => $userViewerId24, 'tenant_id' => $tenantBancoId, 'dept' => $deptRecursosHumanosId, 'email' => 'mirtha.escalante.view@gmail.com', 'name' => 'Mirtha Escalante Vallejos', 'role' => 'VIEWER'],
        ];

        // 3. Inserción Masiva de Usuarios (sin department_id)
        $usersInsert = array_map(function ($u) use ($defaultPassword) {
            return [
                'id'         => $u['id'],
                'tenant_id'  => $u['tenant_id'],
                'email'      => $u['email'],
                'full_name'  => $u['name'],
                'password'   => $defaultPassword,
                'status'     => 'ACTIVE',
                'created_at' => now(),
            ];
        }, $usersData);

        DB::table('users')->insert($usersInsert);

        // 3.1. Inserción Masiva de Departamentos Asignados (N:M user_departments)
        $userDepartmentsInsert = [];
        foreach ($usersData as $u) {
            if (!empty($u['dept'])) {
                $userDepartmentsInsert[] = [
                    'id'            => Str::uuid()->toString(),
                    'user_id'       => $u['id'],
                    'department_id' => $u['dept'],
                    'is_primary'    => true,
                    'assigned_at'   => now(),
                ];
            }
        }

        // Escenarios Multi-Departamento para validación N:M
        $extraDepartments = [
            ['user_id' => $userViewerId1, 'department_id' => $deptRadiologíaId,  'is_primary' => false],
            ['user_id' => $userViewerId1, 'department_id' => $deptLaboratorioId, 'is_primary' => false],
            ['user_id' => $userEditorId1, 'department_id' => $deptConsultasId,   'is_primary' => false],
            ['user_id' => $userViewerId9, 'department_id' => $deptCorporativoId, 'is_primary' => false],
        ];

        foreach ($extraDepartments as $extra) {
            $userDepartmentsInsert[] = [
                'id'            => Str::uuid()->toString(),
                'user_id'       => $extra['user_id'],
                'department_id' => $extra['department_id'],
                'is_primary'    => $extra['is_primary'],
                'assigned_at'   => now(),
            ];
        }

        if (!empty($userDepartmentsInsert)) {
            DB::table('user_departments')->insert($userDepartmentsInsert);
        }

        // 4. Inserción Masiva de Roles (user_roles)
        $rolesInsert = array_map(function ($u) {
            return [
                'id'          => Str::uuid()->toString(),
                'user_id'     => $u['id'],
                'role_id'     => $u['role'],
                'tenant_id'   => $u['tenant_id'],
                'assigned_by' => null,
                'assigned_at' => now(),
            ];
        }, $usersData);

        // Escenario Multi-Rol: Dr. Carlos Mendoza también es APPROVER en la Clínica
        $rolesInsert[] = [
            'id'          => Str::uuid()->toString(),
            'user_id'     => $userEditorId1,
            'role_id'     => 'APPROVER',
            'tenant_id'   => $tenantClinicaId,
            'assigned_by' => null,
            'assigned_at' => now(),
        ];

        DB::table('user_roles')->insert($rolesInsert);

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
            'created_by' => $userEditorId1,
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
                'created_by' => $userEditorId1,
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
                'created_by' => $userEditorId1,
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
                'user_id' => $userEditorId1,
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
                'user_id' => $userEditorId1,
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