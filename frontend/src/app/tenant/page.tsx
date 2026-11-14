"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/features/auth";
import { AuthUser } from "@/features/auth/types/auth.types";
import { AdminLayout, KpiCard, NavItem } from "@/shared";
import {
  DepartmentItem,
  DocumentCategoryItem,
  TenantUserItem,
  TenantDocumentItem,
  AuditLogItem,
  CreateUserPayload,
  UpdateUserPayload,
  tenantService,
  TenantError,
  OrganizationManager,
  TenantUsersTable,
  UserFormModal,
  DocumentsGovernanceTable,
  ForceUnlockModal,
  AuditLogsViewer,
} from "@/features/tenant-admin";

type ActiveTab = "ORGANIZATION" | "USERS" | "DOCUMENTS" | "AUDIT";

export default function TenantAdminDashboardPage() {
  const router = useRouter();

  // Control de Acceso y Sesión
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Pestaña Principal Activa
  const [activeTab, setActiveTab] = useState<ActiveTab>("ORGANIZATION");

  // Estados de Datos
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [categories, setCategories] = useState<DocumentCategoryItem[]>([]);
  const [users, setUsers] = useState<TenantUserItem[]>([]);
  const [documents, setDocuments] = useState<TenantDocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Estados de Carga
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modales y Acciones
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUserItem | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockingDoc, setUnlockingDoc] = useState<TenantDocumentItem | null>(
    null
  );
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false);

  // Feedback Notification Banner
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Carga completa de datos del Tenant
  const reloadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [deptRes, catRes, usersRes, docsRes, auditRes] =
        await Promise.all([
          tenantService.getDepartments().catch((err) => {
            console.error("Error al obtener departamentos:", err);
            return [] as DepartmentItem[];
          }),
          tenantService.getCategories().catch((err) => {
            console.error("Error al obtener categorías:", err);
            return [] as DocumentCategoryItem[];
          }),
          tenantService.getUsers().catch((err) => {
            console.error("Error al obtener usuarios:", err);
            return { data: [] as TenantUserItem[] };
          }),
          tenantService.getDocuments().catch((err) => {
            console.error("Error al obtener documentos:", err);
            return { data: [] as TenantDocumentItem[] };
          }),
          tenantService.getAuditLogs().catch((err) => {
            console.error("Error al obtener bitácora forense:", err);
            return { data: [] as AuditLogItem[] };
          }),
        ]);

      setDepartments(deptRes);
      setCategories(catRes);
      setUsers(usersRes.data || []);
      setDocuments(docsRes.data || []);
      setAuditLogs(auditRes.data || []);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 1. Inicialización y Validación RBAC
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      const token = tokenStorage.getToken();
      const user = tokenStorage.getUser();

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      setCurrentUser(user);

      const hasTenantAdminRole =
        user.roles.includes("TENANT_ADMIN") ||
        user.roles.includes("SYSTEM_ADMIN") ||
        user.permissions.includes("dept:manage") ||
        user.permissions.includes("user:manage");

      if (!hasTenantAdminRole) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);

      try {
        const [deptRes, catRes, usersRes, docsRes, auditRes] =
          await Promise.all([
            tenantService.getDepartments().catch(() => [] as DepartmentItem[]),
            tenantService.getCategories().catch(() => [] as DocumentCategoryItem[]),
            tenantService.getUsers().catch(() => ({ data: [] as TenantUserItem[] })),
            tenantService.getDocuments().catch(() => ({ data: [] as TenantDocumentItem[] })),
            tenantService.getAuditLogs().catch(() => ({ data: [] as AuditLogItem[] })),
          ]);

        if (isMounted) {
          setDepartments(deptRes);
          setCategories(catRes);
          setUsers(usersRes.data || []);
          setDocuments(docsRes.data || []);
          setAuditLogs(auditRes.data || []);
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

  // Manejadores de Gestión de Usuarios
  const handleCreateUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: TenantUserItem) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleSubmitCreateUser = async (payload: CreateUserPayload) => {
    setIsSubmittingUser(true);
    try {
      const created = await tenantService.createUser(payload);
      setFeedback({
        message: `Usuario "${created.full_name}" registrado exitosamente.`,
        type: "success",
      });
      await reloadData();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al registrar el usuario.";
      setFeedback({ message: msg, type: "error" });
      throw err;
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleSubmitUpdateUser = async (
    id: string,
    payload: UpdateUserPayload
  ) => {
    setIsSubmittingUser(true);
    try {
      const updated = await tenantService.updateUser(id, payload);
      setFeedback({
        message: `Usuario "${updated.full_name}" actualizado correctamente.`,
        type: "success",
      });
      await reloadData();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al actualizar el usuario.";
      setFeedback({ message: msg, type: "error" });
      throw err;
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleToggleUserStatus = async (user: TenantUserItem) => {
    if (user.id === currentUser?.id) {
      setFeedback({
        message: "No puedes desactivar tu propia cuenta de administrador.",
        type: "error",
      });
      return;
    }

    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoadingId(user.id);
    setFeedback(null);

    try {
      if (newStatus === "SUSPENDED") {
        await tenantService.deleteUser(user.id);
        setFeedback({
          message: `Usuario "${user.full_name}" suspendido y sus sesiones revocadas.`,
          type: "success",
        });
      } else {
        await tenantService.updateUser(user.id, { status: "ACTIVE" });
        setFeedback({
          message: `Usuario "${user.full_name}" reactivado exitosamente.`,
          type: "success",
        });
      }
      await reloadData();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al cambiar el estado del usuario.";
      setFeedback({ message: msg, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Manejador de Liberación Forzada de Candados
  const handleOpenForceUnlock = (doc: TenantDocumentItem) => {
    setUnlockingDoc(doc);
    setIsUnlockModalOpen(true);
  };

  const handleConfirmForceUnlock = async (
    documentId: string,
    reason: string
  ) => {
    setIsSubmittingUnlock(true);
    try {
      await tenantService.forceUnlockDocument(documentId, { reason });
      setFeedback({
        message:
          "Candado liberado forzosamente y registrado en la bitácora forense.",
        type: "success",
      });
      await reloadData();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al liberar el candado del documento.";
      setFeedback({ message: msg, type: "error" });
      throw err;
    } finally {
      setIsSubmittingUnlock(false);
    }
  };

  // Cálculo de KPIs
  const activeUsersCount = useMemo(
    () => users.filter((u) => u.status === "ACTIVE").length,
    [users]
  );
  const lockedDocsCount = useMemo(
    () => documents.filter((d) => d.is_locked).length,
    [documents]
  );
  const activePercentage = useMemo(
    () =>
      users.length > 0
        ? Math.round((activeUsersCount / users.length) * 100)
        : 100,
    [activeUsersCount, users.length]
  );

  // Navegación de barra lateral personalizada para TENANT_ADMIN
  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      {
        label: "Administración Organizacional",
        href: "/tenant",
        requiredPermission: "dept:manage",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
            />
          </svg>
        ),
      },
      {
        label: "Bóveda Documental",
        href: "/documents",
        requiredPermission: "doc:read",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
        ),
      },
    ];

    if (currentUser?.roles?.includes("SYSTEM_ADMIN")) {
      items.unshift({
        label: "Infraestructura Global",
        href: "/admin",
        requiredPermission: "tenant:manage",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
        ),
      });
    }

    return items;
  }, [currentUser]);

  // Pantalla de Carga
  if (isAuthorized === null || (isAuthorized && isLoading)) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 animate-spin text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">
            Cargando consola organizacional...
          </span>
        </div>
      </div>
    );
  }

  // Pantalla de Acceso Restringido
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">
            Acceso Restringido a la Organización
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Se requiere el rol de{" "}
            <span className="font-mono text-indigo-400">TENANT_ADMIN</span> con
            permisos de gestión departamental y usuarios para operar esta
            consola.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/30"
          >
            Regresar al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  const tenantDisplayName =
    currentUser?.tenant?.slug?.replace(/-/g, " ").toUpperCase() ||
    "Organización";

  return (
    <AdminLayout
      brandName="Doc"
      brandAccent="Platform"
      consoleSubtitle={tenantDisplayName}
      sectionTitle="Gobernanza de Tenant"
      pageTitle="Consola de Administración Organizacional"
      navItems={navItems}
    >
      {/* Banner de Feedback Global */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-xs font-medium border transition-all animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                feedback.type === "success" ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Grid Superior de KPIs Corporativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="USUARIOS ACTIVOS"
          value={activeUsersCount}
          sublabel={`${users.length} usuarios registrados`}
          badge={`${activePercentage}% activos`}
          accentColor="indigo"
          progress={activePercentage}
        />
        <KpiCard
          label="DEPARTAMENTOS"
          value={departments.length}
          sublabel={`${categories.length} categorías documentales`}
          badge="Estructura"
          accentColor="slate"
        />
        <KpiCard
          label="EXPEDIENTES EN BÓVEDA"
          value={documents.length}
          sublabel={`${documents.filter((d) => !d.is_locked).length} disponibles`}
          badge="Bóveda"
          accentColor="emerald"
        />
        <KpiCard
          label="CANDADOS ACTIVOS"
          value={lockedDocsCount}
          sublabel="En edición concurrente"
          badge={lockedDocsCount > 0 ? "Atención" : "Estable"}
          accentColor="amber"
          progress={
            documents.length > 0
              ? Math.round((lockedDocsCount / documents.length) * 100)
              : 0
          }
        />
      </div>

      {/* Navegación por Pestañas Principales del Tenant */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pestaña 1: Estructura Organizacional */}
            <button
              type="button"
              onClick={() => setActiveTab("ORGANIZATION")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "ORGANIZATION"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
              <span>Estructura Organizacional</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "ORGANIZATION"
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {departments.length + categories.length}
              </span>
            </button>

            {/* Pestaña 2: Personal y Roles */}
            <button
              type="button"
              onClick={() => setActiveTab("USERS")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "USERS"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <span>Personal y Roles</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "USERS"
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {users.length}
              </span>
            </button>

            {/* Pestaña 3: Documentos y Candados */}
            <button
              type="button"
              onClick={() => setActiveTab("DOCUMENTS")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "DOCUMENTS"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <span>Documentos y Candados</span>
              {lockedDocsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium">
                  {lockedDocsCount} bloqueados
                </span>
              )}
            </button>

            {/* Pestaña 4: Bitácora Forense */}
            <button
              type="button"
              onClick={() => setActiveTab("AUDIT")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "AUDIT"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span>Bitácora Forense</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "AUDIT"
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {auditLogs.length}
              </span>
            </button>
          </div>

          {/* Botón Refrescar Datos */}
          <button
            type="button"
            onClick={reloadData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span>{isRefreshing ? "Sincronizando..." : "Actualizar"}</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* Renderizado de Vistas según Pestaña Activa */}
        {/* ============================================================== */}

        {/* 1. Estructura Organizacional */}
        {activeTab === "ORGANIZATION" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Gobernanza de Departamentos y Categorías
              </h3>
              <p className="text-xs text-slate-400">
                Configure las divisiones internas y los tipos de documentos
                clasificados para su organización.
              </p>
            </div>
            <OrganizationManager
              departments={departments}
              categories={categories}
              isLoading={isLoading}
              onRefresh={reloadData}
            />
          </div>
        )}

        {/* 2. Personal y Roles */}
        {activeTab === "USERS" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Directorio de Personal y Control de Acceso
              </h3>
              <p className="text-xs text-slate-400">
                Administre credenciales, roles operativos y la pertenencia
                departamental de sus usuarios.
              </p>
            </div>
            <TenantUsersTable
              users={users}
              currentUserId={currentUser?.id ? String(currentUser.id) : undefined}
              isLoading={isLoading}
              onEditUser={handleEditUser}
              onToggleStatus={handleToggleUserStatus}
              onCreateUser={handleCreateUser}
              actionLoadingId={actionLoadingId}
            />
          </div>
        )}

        {/* 3. Documentos y Candados */}
        {activeTab === "DOCUMENTS" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Gobernanza Concurrente de Expedientes
              </h3>
              <p className="text-xs text-slate-400">
                Monitoree el estado de candados de edición (checkout) y libere
                bloqueos forzosamente cuando sea requerido.
              </p>
            </div>
            <DocumentsGovernanceTable
              documents={documents}
              isLoading={isLoading}
              onForceUnlockClick={handleOpenForceUnlock}
            />
          </div>
        )}

        {/* 4. Bitácora Forense */}
        {activeTab === "AUDIT" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Registro de Auditoría Forense Inmutable
              </h3>
              <p className="text-xs text-slate-400">
                Trazabilidad completa de operaciones criptográficas, cambios de
                versión y accesos administrativos.
              </p>
            </div>
            <AuditLogsViewer logs={auditLogs} isLoading={isLoading} />
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Modales Desacoplados */}
      {/* ============================================================== */}

      {/* Modal: Crear / Editar Usuario */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        departments={departments}
        initialData={editingUser}
        onSubmit={handleSubmitCreateUser}
        onUpdate={handleSubmitUpdateUser}
        isLoading={isSubmittingUser}
      />

      {/* Modal: Forzar Desbloqueo de Candado */}
      <ForceUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setUnlockingDoc(null);
        }}
        document={unlockingDoc}
        onConfirmUnlock={handleConfirmForceUnlock}
        isLoading={isSubmittingUnlock}
      />
    </AdminLayout>
  );
}
