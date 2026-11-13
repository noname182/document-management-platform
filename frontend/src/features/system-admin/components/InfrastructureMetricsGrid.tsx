"use client";

import React from "react";
import { SystemOverviewData } from "../types/system.types";
import { ClusterNodeInfo, ClusterStatusBar, KpiCard } from "@/shared";

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

export const InfrastructureMetricsGrid: React.FC<InfrastructureMetricsGridProps> = ({
  overview,
  onRefresh,
  isRefreshing = false,
}) => {
  const stats = overview?.stats;

  const clusterNodes: ClusterNodeInfo[] = [
    {
      id: "core_api",
      name: "Core API",
      detail: ":8000",
      status: overview?.services.core_api === "ONLINE" ? "ONLINE" : "OFFLINE",
    },
    {
      id: "database",
      name: "PostgreSQL",
      detail: ":5433",
      status: overview?.services.database === "ONLINE" ? "ONLINE" : "OFFLINE",
    },
    {
      id: "doc_processor",
      name: "Doc-Processor",
      detail: ":3001",
      status: overview?.services.doc_processor === "ONLINE" ? "ONLINE" : "OFFLINE",
    },
    {
      id: "minio_storage",
      name: "MinIO S3",
      detail: ":9000",
      status: overview?.services.minio_storage === "ONLINE" ? "ONLINE" : "OFFLINE",
    },
  ];

  const tenantProgress =
    stats && stats.tenants_total > 0
      ? Math.round((stats.tenants_active / stats.tenants_total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Barra de Estado Compacta Horizontal del Cluster */}
      <ClusterStatusBar
        title="Infraestructura & Nodos"
        nodes={clusterNodes}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Grid de KPIs Parametrizados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Tenants Activos"
          value={stats?.tenants_active ?? 0}
          sublabel={`de ${stats?.tenants_total ?? 0} organizaciones`}
          badge={`${tenantProgress}%`}
          accentColor="indigo"
          progress={tenantProgress}
        />

        <KpiCard
          label="Usuarios Totales"
          value={stats?.users_total ?? 0}
          sublabel="En todas las organizaciones"
          badge="Global"
          accentColor="indigo"
        />

        <KpiCard
          label="Expedientes"
          value={stats?.documents_total ?? 0}
          sublabel={`${stats?.versions_total ?? 0} versiones inmutables`}
          badge="SHA-256"
          accentColor="slate"
        />

        <KpiCard
          label="Almacenamiento S3"
          value={formatBytes(stats?.storage_bytes ?? 0)}
          sublabel="Cálculo SHA-256 verificado"
          badge="MinIO"
          accentColor="emerald"
        />

        <KpiCard
          label="Candados en Edición"
          value={stats?.locked_documents ?? 0}
          sublabel="Bloqueo pesimista activo"
          badge="Checkout"
          accentColor={(stats?.locked_documents ?? 0) > 0 ? "amber" : "slate"}
        />
      </div>
    </div>
  );
};
