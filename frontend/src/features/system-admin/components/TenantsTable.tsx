"use client";

import React, { useState } from "react";
import { TenantItem } from "../types/system.types";

interface TenantsTableProps {
  tenants: TenantItem[];
  isLoading?: boolean;
  onToggleStatus: (id: string, currentStatus: "ACTIVE" | "SUSPENDED") => Promise<void>;
  isActionLoading?: string | null;
  onCreateClick?: () => void;
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
  tenants,
  isLoading = false,
  onToggleStatus,
  isActionLoading = null,
  onCreateClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ? true : tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-4">
      {/* Controles de la Tabla: Búsqueda, Filtro y Botón de Crear */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
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
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por organización o slug..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "ALL"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todos ({tenants.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-300 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("SUSPENDED")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "SUSPENDED"
                  ? "bg-amber-500/20 text-amber-300 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Suspendidos
            </button>
          </div>
        </div>

        {onCreateClick && (
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Nueva Organización</span>
          </button>
        )}
      </div>

      {/* Tabla de Organizaciones */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800/80">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Organización & Slug
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Estado
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Estructura (Usuarios / Deptos)
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Expedientes
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Fecha Registro
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Cargando organizaciones...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-300">No se encontraron organizaciones</p>
                    <p className="text-xs text-slate-500 mt-1">Pruebe ajustando los filtros de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isRootTenant = tenant.slug === "platform-system";
                  const isProcessing = isActionLoading === tenant.id;

                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Nombre y Slug */}
                      <td className="px-5 py-4">
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
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4">
                        {tenant.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            SUSPENDIDO
                          </span>
                        )}
                      </td>

                      {/* Usuarios y Deptos */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-200 font-medium">
                            {tenant.users_count ?? 0} usuarios
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">
                            {tenant.departments_count ?? 0} deptos
                          </span>
                        </div>
                      </td>

                      {/* Documentos */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800">
                          {tenant.documents_count ?? 0} archivos
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {formatDate(tenant.created_at)}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 text-right">
                        {isRootTenant ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 text-slate-500 border border-slate-800/80 text-[11px] font-medium select-none cursor-not-allowed">
                            <svg className="w-3.5 h-3.5 text-amber-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Protegido</span>
                          </span>
                        ) : (
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
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : tenant.status === "ACTIVE" ? (
                              <span>Suspender</span>
                            ) : (
                              <span>Reactivar</span>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
