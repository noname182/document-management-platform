"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/features/auth";
import { AdminLayout } from "@/shared/components/AdminLayout";
import { systemService } from "@/features/system-admin/services/system.service";
import {
  CreateTenantPayload,
  SystemOverviewData,
  TenantItem,
  UpdateTenantPayload,
} from "@/features/system-admin/types/system.types";
import { InfrastructureMetricsGrid } from "@/features/system-admin/components/InfrastructureMetricsGrid";
import { TenantsTable } from "@/features/system-admin/components/TenantsTable";
import { CreateTenantModal } from "@/features/system-admin/components/CreateTenantModal";

export default function AdminDashboardPage() {
  const router = useRouter();

  // Estados de control de acceso
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Estados de datos
  const [overview, setOverview] = useState<SystemOverviewData | null>(null);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Estados de acciones
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [isCreatingTenant, setIsCreatingTenant] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Carga de telemetría y organizaciones
  const reloadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [overviewData, tenantsData] = await Promise.all([
        systemService.getOverview().catch((err) => {
          console.error("Error al obtener telemetría:", err);
          return null;
        }),
        systemService.getTenants().catch((err) => {
          console.error("Error al obtener tenants:", err);
          return [];
        }),
      ]);

      if (overviewData) setOverview(overviewData);
      setTenants(tenantsData);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 1. Inicialización, validación RBAC y carga de datos inicial
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      // Liberar el hilo de render sincrónico del effect
      await Promise.resolve();
      if (!isMounted) return;

      const token = tokenStorage.getToken();
      const user = tokenStorage.getUser();

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      const hasAdminRole =
        user.roles.includes("SYSTEM_ADMIN") ||
        user.permissions.includes("tenant:manage") ||
        user.permissions.includes("system:metrics");

      if (!hasAdminRole) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);

      try {
        const [overviewData, tenantsData] = await Promise.all([
          systemService.getOverview().catch((err) => {
            console.error("Error al obtener telemetría:", err);
            return null;
          }),
          systemService.getTenants().catch((err) => {
            console.error("Error al obtener tenants:", err);
            return [];
          }),
        ]);

        if (isMounted) {
          if (overviewData) setOverview(overviewData);
          setTenants(tenantsData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Manejo de Aprovisionamiento Atómico de Tenant
  const handleCreateTenant = async (payload: CreateTenantPayload) => {
    setIsCreatingTenant(true);
    try {
      const result = await systemService.createTenant(payload);
      setFeedback({
        message: `Organización "${result.tenant.name}" y administrador "${result.admin.full_name}" aprovisionados correctamente.`,
        type: "success",
      });
      // Recargar datos para actualizar contadores y tabla
      await reloadData();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Error al aprovisionar la organización.";
      setFeedback({ message: msg, type: "error" });
      throw error; // Propagar al modal para mostrar error en sus inputs
    } finally {
      setIsCreatingTenant(false);
    }
  };

  // 3. Manejo de Edición de Organización (PATCH /api/v1/tenants/{id})
  const handleUpdateTenant = async (
    id: string,
    payload: UpdateTenantPayload
  ) => {
    setActionLoadingId(id);
    try {
      const updatedTenant = await systemService.updateTenant(id, payload);
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updatedTenant } : t))
      );
      setFeedback({
        message: `Organización "${updatedTenant.name}" actualizada correctamente.`,
        type: "success",
      });
      // Recargar datos para actualizar contadores
      await reloadData();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Error al actualizar la organización.";
      setFeedback({ message: msg, type: "error" });
      throw error;
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Manejo de Cambio de Estado (ACTIVE / SUSPENDED)
  const handleToggleStatus = async (
    id: string,
    currentStatus: "ACTIVE" | "SUSPENDED"
  ) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoadingId(id);

    try {
      const updatedTenant = await systemService.updateTenantStatus(id, newStatus);
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: updatedTenant.status } : t))
      );
      setFeedback({
        message: `Estado de la organización actualizado a ${newStatus}.`,
        type: "success",
      });
      // Refrescar telemetría silenciosamente para actualizar tenants_active
      await reloadData();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado de la organización.";
      setFeedback({ message: msg, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Pantalla de carga mientras se valida sesión
  if (isAuthorized === null || (isAuthorized && isLoading)) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Cargando consola de infraestructura...</span>
        </div>
      </div>
    );
  }

  // Pantalla de Acceso Restringido si no tiene rol de SYSTEM_ADMIN
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Acceso Restringido a Infraestructura</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Se requiere el rol de <span className="font-mono text-indigo-400">SYSTEM_ADMIN</span> para operar esta consola.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/30"
          >
            Regresar al Visor de Documentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Banner de Notificación / Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-xs font-medium border transition-all animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${feedback.type === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Grid de Estado de Infraestructura y Métricas Globales */}
      <InfrastructureMetricsGrid
        overview={overview}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={reloadData}
      />

      {/* Tabla de Gestión de Organizaciones (Tenants) */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Directorio de Organizaciones (Tenants)
            </h3>
            <p className="text-xs text-slate-400">
              Gobernanza de inquilinos, cuotas documentales y control de acceso global.
            </p>
          </div>
        </div>

        <TenantsTable
          tenants={tenants}
          isLoading={isLoading}
          onToggleStatus={handleToggleStatus}
          onEditClick={(tenant) => {
            setEditingTenant(tenant);
            setIsModalOpen(true);
          }}
          isActionLoading={actionLoadingId}
          onCreateClick={() => {
            setEditingTenant(null);
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Modal Desacoplado para Aprovisionar / Editar Tenant */}
      <CreateTenantModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTenant(null);
        }}
        onSubmit={handleCreateTenant}
        onUpdate={handleUpdateTenant}
        initialData={editingTenant}
        isLoading={isCreatingTenant || Boolean(actionLoadingId)}
      />
    </AdminLayout>
  );
}
