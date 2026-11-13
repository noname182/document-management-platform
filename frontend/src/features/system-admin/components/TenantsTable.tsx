"use client";

import React, { useMemo } from "react";
import { TenantItem } from "../types/system.types";
import { ColumnDef, DataTable, DataTableTab } from "@/shared";

interface TenantsTableProps {
  tenants: TenantItem[];
  isLoading?: boolean;
  onToggleStatus: (id: string, currentStatus: "ACTIVE" | "SUSPENDED") => Promise<void>;
  onEditClick?: (tenant: TenantItem) => void;
  isActionLoading?: string | null;
  onCreateClick?: () => void;
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
  tenants,
  isLoading = false,
  onToggleStatus,
  onEditClick,
  isActionLoading = null,
  onCreateClick,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const columns: ColumnDef<TenantItem>[] = useMemo(
    () => [
      {
        header: "Organización & Slug",
        render: (tenant) => {
          const isRootTenant = tenant.slug === "platform-system";
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white tracking-tight flex items-center gap-2">
                  <span>{tenant.name}</span>
                  {isRootTenant && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      ROOT
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  slug: {tenant.slug}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Estado",
        render: (tenant) =>
          tenant.status === "ACTIVE" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              SUSPENDIDO
            </span>
          ),
      },
      {
        header: "Estructura (Usuarios / Deptos)",
        render: (tenant) => (
          <div className="flex items-center gap-3">
            <span className="text-slate-200 font-medium">
              {tenant.users_count ?? 0} usuarios
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              {tenant.departments_count ?? 0} deptos
            </span>
          </div>
        ),
      },
      {
        header: "Expedientes",
        render: (tenant) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800">
            {tenant.documents_count ?? 0} archivos
          </span>
        ),
      },
      {
        header: "Fecha Registro",
        render: (tenant) => (
          <span className="text-slate-400 text-xs">
            {formatDate(tenant.created_at)}
          </span>
        ),
      },
      {
        header: "Acciones",
        align: "right",
        render: (tenant) => {
          const isRootTenant = tenant.slug === "platform-system";
          const isProcessing = isActionLoading === tenant.id;

          if (isRootTenant) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 text-slate-500 border border-slate-800/80 text-[11px] font-medium select-none cursor-not-allowed">
                <svg
                  className="w-3.5 h-3.5 text-amber-500/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Protegido</span>
              </span>
            );
          }

          return (
            <div className="flex items-center justify-end gap-2">
              {onEditClick && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onEditClick(tenant)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all disabled:opacity-50"
                  title="Editar Organización"
                >
                  <svg
                    className="w-3.5 h-3.5 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  <span>Editar</span>
                </button>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onToggleStatus(tenant.id, tenant.status)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border disabled:opacity-50 ${
                  tenant.status === "ACTIVE"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-200"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-200"
                }`}
              >
                {isProcessing ? (
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
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
                ) : tenant.status === "ACTIVE" ? (
                  <span>Suspender</span>
                ) : (
                  <span>Reactivar</span>
                )}
              </button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isActionLoading, onEditClick]
  );

  const tabs: DataTableTab<TenantItem>[] = useMemo(
    () => [
      {
        id: "ALL",
        label: "Todos",
        count: tenants.length,
        filter: () => true,
      },
      {
        id: "ACTIVE",
        label: "Activos",
        count: tenants.filter((t) => t.status === "ACTIVE").length,
        filter: (t: TenantItem) => t.status === "ACTIVE",
      },
      {
        id: "SUSPENDED",
        label: "Suspendidos",
        count: tenants.filter((t) => t.status === "SUSPENDED").length,
        filter: (t: TenantItem) => t.status === "SUSPENDED",
      },
    ],
    [tenants]
  );

  const headerActions = onCreateClick ? (
    <button
      type="button"
      onClick={onCreateClick}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all shrink-0"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
      <span>Nueva Organización</span>
    </button>
  ) : null;

  return (
    <DataTable<TenantItem>
      columns={columns}
      data={tenants}
      keyExtractor={(item) => item.id}
      searchPlaceholder="Buscar por organización o slug..."
      searchPredicate={(tenant, query) =>
        tenant.name.toLowerCase().includes(query) ||
        tenant.slug.toLowerCase().includes(query)
      }
      tabs={tabs}
      headerActions={headerActions}
      isLoading={isLoading}
      emptyMessage="No se encontraron organizaciones registradas"
    />
  );
};
