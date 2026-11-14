"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/features/auth";
import { AuthUser } from "@/features/auth/types/auth.types";
import { AdminLayout, KpiCard, NavItem } from "@/shared";
import { AuditLogsViewer, AuditLogItem } from "@/features/tenant-admin";
import {
  VaultDocumentItem,
  VaultCategory,
  VaultAuditLogItem,
  documentsService,
  DocumentVaultError,
  VaultDocumentsTable,
  CreateDocumentModal,
  DocumentDetailModal,
} from "@/features/documents";

type VaultTab = "VAULT" | "AUDIT";

export default function DocumentsVaultPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<VaultTab>("VAULT");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");

  const [documents, setDocuments] = useState<VaultDocumentItem[]>([]);
  const [categories, setCategories] = useState<VaultCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<VaultAuditLogItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [detailDoc, setDetailDoc] = useState<VaultDocumentItem | null>(null);

  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const permissions = useMemo(
    () => currentUser?.permissions || [],
    [currentUser]
  );
  const roles = useMemo(
    () => (currentUser?.roles || []).map(String),
    [currentUser]
  );

  const isAdmin =
    roles.includes("TENANT_ADMIN") || roles.includes("SYSTEM_ADMIN");
  const isGlobalApprover =
    roles.includes("APPROVER") &&
    (currentUser?.departments?.length || 0) === 0;
  const canCreate = permissions.includes("doc:create");
  const canCheckout = permissions.includes("doc:checkout");
  const canCheckin = permissions.includes("doc:checkin");
  const canRollback = permissions.includes("doc:rollback");
  const canDownload = permissions.includes("doc:download");
  const canReadAudit = permissions.includes("audit:read");

  const reloadVault = useCallback(
    async (
      deptFilter: string = selectedDeptId,
      includeAudit: boolean = canReadAudit
    ) => {
      setIsRefreshing(true);
      try {
        const params =
          deptFilter !== "ALL" ? { department_id: deptFilter } : undefined;

        const [docsRes, catsRes, auditRes] = await Promise.all([
          documentsService.getDocuments(params),
          documentsService.getCategories().catch(() => [] as VaultCategory[]),
          includeAudit
            ? documentsService
                .getAuditLogs()
                .catch(() => ({ data: [] as VaultAuditLogItem[] }))
            : Promise.resolve({ data: [] as VaultAuditLogItem[] }),
        ]);

        setDocuments(docsRes.data || []);
        setCategories(catsRes);
        setAuditLogs(auditRes.data || []);
      } catch (err) {
        setFeedback({
          message:
            err instanceof Error
              ? err.message
              : "Error al sincronizar la bóveda.",
          type: "error",
        });
      } finally {
        setIsRefreshing(false);
      }
    },
    [selectedDeptId, canReadAudit]
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      const token = tokenStorage.getToken();
      const user = tokenStorage.getUser();

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      if (!active) return;
      setCurrentUser(user);

      const hasDocRead =
        user.permissions?.includes("doc:read") ||
        user.roles?.includes("SYSTEM_ADMIN");

      if (!hasDocRead) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      const userCanAudit = Boolean(user.permissions?.includes("audit:read"));

      try {
        const [docsRes, catsRes, auditRes] = await Promise.all([
          documentsService.getDocuments(),
          documentsService.getCategories().catch(() => [] as VaultCategory[]),
          userCanAudit
            ? documentsService
                .getAuditLogs()
                .catch(() => ({ data: [] as VaultAuditLogItem[] }))
            : Promise.resolve({ data: [] as VaultAuditLogItem[] }),
        ]);

        if (active) {
          setDocuments(docsRes.data || []);
          setCategories(catsRes);
          setAuditLogs(auditRes.data || []);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [router]);

  const handleDepartmentFilterChange = async (deptId: string) => {
    setSelectedDeptId(deptId);
    await reloadVault(deptId, canReadAudit);
  };

  const handleCreateDocument = async (payload: {
    title: string;
    category_id: string;
    file?: File | null;
    change_summary?: string;
  }) => {
    setIsSubmittingCreate(true);
    try {
      const created = await documentsService.createDocumentWithInitialFile(
        payload
      );
      setFeedback({
        message: `Expediente "${created.title}" registrado correctamente.`,
        type: "success",
      });
      await reloadVault(selectedDeptId, canReadAudit);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDownloadActive = async (doc: VaultDocumentItem) => {
    if (!doc.current_version) return;
    setActionLoadingId(doc.id);
    setFeedback(null);
    try {
      await documentsService.downloadVersion(
        doc.id,
        doc.current_version.id,
        doc.current_version.original_filename
      );
    } catch (err) {
      setFeedback({
        message:
          err instanceof DocumentVaultError || err instanceof Error
            ? err.message
            : "Error al descargar el documento.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckout = async (doc: VaultDocumentItem) => {
    setActionLoadingId(doc.id);
    setFeedback(null);
    try {
      await documentsService.checkout(doc.id);
      setFeedback({
        message: `Candado adquirido sobre "${doc.title}". Ya puede subir una nueva versión.`,
        type: "success",
      });
      await reloadVault(selectedDeptId, canReadAudit);
    } catch (err) {
      setFeedback({
        message:
          err instanceof DocumentVaultError || err instanceof Error
            ? err.message
            : "Error al bloquear el documento.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDiscardCheckout = async (doc: VaultDocumentItem) => {
    setActionLoadingId(doc.id);
    setFeedback(null);
    try {
      await documentsService.discardCheckout(doc.id);
      setFeedback({
        message: `Candado liberado sobre "${doc.title}".`,
        type: "success",
      });
      await reloadVault(selectedDeptId, canReadAudit);
    } catch (err) {
      setFeedback({
        message:
          err instanceof DocumentVaultError || err instanceof Error
            ? err.message
            : "Error al liberar el candado.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
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

    if (
      currentUser?.permissions?.includes("dept:manage") ||
      currentUser?.roles?.includes("TENANT_ADMIN")
    ) {
      items.unshift({
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
      });
    }

    return items;
  }, [currentUser]);

  const userDepartments = useMemo(
    () => currentUser?.departments || [],
    [currentUser]
  );

  // Categorías acotadas estrictamente al perímetro ABAC del usuario
  const scopedCategories = useMemo(() => {
    if (isAdmin || isGlobalApprover) return categories;
    const allowedIds = new Set(userDepartments.map((d) => String(d.id)));
    return categories.filter(
      (cat) => !cat.department_id || allowedIds.has(String(cat.department_id))
    );
  }, [categories, isAdmin, isGlobalApprover, userDepartments]);

  if (isAuthorized === null || (isAuthorized && isLoading)) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400">
        <span className="text-sm font-medium">
          Cargando bóveda documental segura...
        </span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <h2 className="text-lg font-bold text-white">Acceso Denegado</h2>
          <p className="text-xs text-slate-400">
            Su perfil no cuenta con permisos de lectura documental (`doc:read`).
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
          >
            Volver al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  const myLocksCount = documents.filter(
    (d) => d.is_locked && d.locked_by_user_id === String(currentUser?.id)
  ).length;
  const availableCount = documents.filter((d) => !d.is_locked).length;

  const tenantDisplayName =
    currentUser?.tenant?.slug?.replace(/-/g, " ").toUpperCase() ||
    "Bóveda Corporativa";

  return (
    <AdminLayout
      brandName="Doc"
      brandAccent="Vault"
      consoleSubtitle={tenantDisplayName}
      sectionTitle="Repositorio ABAC"
      pageTitle="Bóveda Documental y Control de Versiones"
      navItems={navItems}
    >
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-xs font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Contexto de Roles y Departamentos Asignados (sin filtros redundantes) */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Áreas Autorizadas
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {isAdmin && userDepartments.length === 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
                Acceso Global de Organización
              </span>
            ) : isGlobalApprover ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-200">
                Auditoría Global (Todas las áreas)
              </span>
            ) : userDepartments.length === 0 ? (
              <span className="text-xs text-slate-500">
                Sin departamentos asignados
              </span>
            ) : userDepartments.length === 1 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600/20 border border-indigo-500/40 text-indigo-200">
                <span className="text-amber-400 text-[10px]">★</span>
                {userDepartments[0].name}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleDepartmentFilterChange("ALL")}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedDeptId === "ALL"
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todas mis áreas ({userDepartments.length})
                </button>
                {userDepartments.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => handleDepartmentFilterChange(dept.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedDeptId === dept.id
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {dept.is_primary && (
                      <span className="text-amber-400 text-[10px]">★</span>
                    )}
                    {dept.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {roles.map((r) => (
            <span
              key={r}
              className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-200"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* KPIs Adaptativos según el Perfil Operativo del Usuario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="EXPEDIENTES"
          value={documents.length}
          sublabel={`${availableCount} disponibles en tu perímetro`}
          badge="Perímetro"
          accentColor="indigo"
        />

        {canCheckout ? (
          <KpiCard
            label="MIS CANDADOS"
            value={myLocksCount}
            sublabel="Pendientes de Check-in o liberación"
            badge={myLocksCount > 0 ? "En curso" : "Libre"}
            accentColor="amber"
          />
        ) : canReadAudit ? (
          <KpiCard
            label="AUDITORÍA"
            value={auditLogs.length}
            sublabel="Eventos forenses registrados"
            badge="Inmutable"
            accentColor="amber"
          />
        ) : (
          <KpiCard
            label="MIS ÁREAS"
            value={userDepartments.length}
            sublabel="Departamentos con lectura y descarga"
            badge="Solo lectura"
            accentColor="amber"
          />
        )}

        <KpiCard
          label="CATEGORÍAS"
          value={scopedCategories.length}
          sublabel="Clasificación en tus áreas"
          badge="Catálogo"
          accentColor="emerald"
        />
      </div>

      {/* Pestañas */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("VAULT")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "VAULT"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            Expedientes Documentales
          </button>

          {canReadAudit && (
            <button
              type="button"
              onClick={() => setActiveTab("AUDIT")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "AUDIT"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              Auditoría Forense ({auditLogs.length})
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => reloadVault(selectedDeptId, canReadAudit)}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-50"
        >
          {isRefreshing ? "Sincronizando..." : "Actualizar"}
        </button>
      </div>

      {activeTab === "VAULT" && (
        <VaultDocumentsTable
          documents={documents}
          currentUserId={String(currentUser?.id || "")}
          canCreate={canCreate}
          canCheckout={canCheckout}
          canDownload={canDownload}
          isLoading={isLoading}
          actionLoadingId={actionLoadingId}
          onOpenCreate={() => setIsCreateOpen(true)}
          onOpenDetail={(doc) => setDetailDoc(doc)}
          onDownload={handleDownloadActive}
          onCheckout={handleCheckout}
          onDiscardCheckout={handleDiscardCheckout}
        />
      )}

      {activeTab === "AUDIT" && canReadAudit && (
        <AuditLogsViewer
          logs={auditLogs as unknown as AuditLogItem[]}
          isLoading={isLoading}
        />
      )}

      <CreateDocumentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        userDepartments={userDepartments}
        categories={scopedCategories}
        isAdmin={isAdmin}
        onSubmit={handleCreateDocument}
        isLoading={isSubmittingCreate}
      />

      <DocumentDetailModal
        isOpen={Boolean(detailDoc)}
        onClose={() => setDetailDoc(null)}
        document={detailDoc}
        currentUserId={String(currentUser?.id || "")}
        canCheckin={canCheckin}
        canRollback={canRollback}
        canDownload={canDownload}
        onSuccessAction={async (msg) => {
          setFeedback({ message: msg, type: "success" });
          await reloadVault(selectedDeptId, canReadAudit);
        }}
      />
    </AdminLayout>
  );
}