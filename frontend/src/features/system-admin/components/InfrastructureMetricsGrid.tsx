"use client";

import React from "react";
import {
  NodeStatus,
  SystemOverviewData,
} from "../types/system.types";

interface InfrastructureMetricsGridProps {
  overview: SystemOverviewData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getStatusBadge = (status: NodeStatus) => {
  switch (status) {
    case "ONLINE":
      return {
        text: "ONLINE",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dotClass: "bg-emerald-400",
      };
    case "DEGRADED":
      return {
        text: "DEGRADED",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dotClass: "bg-amber-400",
      };
    case "OFFLINE":
    default:
      return {
        text: "OFFLINE",
        badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
        dotClass: "bg-red-400",
      };
  }
};

export const InfrastructureMetricsGrid: React.FC<InfrastructureMetricsGridProps> = ({
  overview,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
}) => {

  const stats = overview?.stats;

  return (
    <div className="space-y-6">
      {/* Barra de Encabezado de Infraestructura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Estado de Infraestructura y Nodos</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Cluster Local Docker
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo en tiempo real de servicios desacoplados y telemetría de almacenamiento.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : "text-slate-400"}`}
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
            <span>{isRefreshing ? "Actualizando..." : "Refrescar Telemetría"}</span>
          </button>
        )}
      </div>
      
      {/* KPIs Globales de la Plataforma */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI: Organizaciones */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs font-medium text-slate-400">Tenants Activos</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.tenants_active ?? 0}
            </span>
            <span className="text-xs text-slate-400">
              de {stats?.tenants_total ?? 0}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full"
              style={{
                width: `${
                  stats && stats.tenants_total > 0
                    ? Math.round((stats.tenants_active / stats.tenants_total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* KPI: Usuarios Totales */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs font-medium text-slate-400">Usuarios Totales</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.users_total ?? 0}
            </span>
            <span className="text-xs text-indigo-400 font-medium">Global</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            En todas las organizaciones
          </p>
        </div>

        {/* KPI: Documentos y Versiones */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs font-medium text-slate-400">Expedientes / Versiones</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.documents_total ?? 0}
            </span>
            <span className="text-xs text-slate-400">
              ({stats?.versions_total ?? 0} v.)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Inmutabilidad garantizada
          </p>
        </div>

        {/* KPI: Almacenamiento Utilizado */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs font-medium text-slate-400">Almacenamiento MinIO</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {formatBytes(stats?.storage_bytes ?? 0)}
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Cálculo SHA-256 verificado
          </p>
        </div>

        {/* KPI: Candados Concurrentes Activos */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs font-medium text-slate-400">Candados en Edición</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                (stats?.locked_documents ?? 0) > 0
                  ? "text-amber-400"
                  : "text-slate-300"
              }`}
            >
              {stats?.locked_documents ?? 0}
            </span>
            <span className="text-xs text-slate-400">Checkout</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Bloqueo pesimista activo
          </p>
        </div>
      </div>
    </div>
  );
};
