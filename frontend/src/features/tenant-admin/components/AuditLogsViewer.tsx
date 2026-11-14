"use client";

import React, { useState } from "react";
import { DataTable, ColumnDef, DataTableTab, Modal } from "@/shared";
import { AuditLogItem } from "../types/tenant.types";

interface AuditLogsViewerProps {
  logs: AuditLogItem[];
  isLoading?: boolean;
}

const getActionBadge = (action: string) => {
  switch (action) {
    case "FORCE_UNLOCKED":
      return {
        label: "DESBLOQUEO FORZADO",
        className: "bg-red-500/10 text-red-300 border-red-500/20",
        dot: "bg-red-400",
      };
    case "ROLLBACK":
      return {
        label: "FORWARD-ROLLBACK",
        className: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        dot: "bg-amber-400",
      };
    case "CHECKED_OUT":
      return {
        label: "CHECKOUT RESERVADO",
        className: "bg-amber-500/10 text-amber-200 border-amber-500/20",
        dot: "bg-amber-300",
      };
    case "CHECKED_IN":
      return {
        label: "CHECKIN VERSIÓN",
        className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        dot: "bg-emerald-400",
      };
    case "DISCARDED_CHECKOUT":
      return {
        label: "CHECKOUT DESCARTADO",
        className: "bg-slate-800 text-slate-300 border-slate-700",
        dot: "bg-slate-400",
      };
    case "APPROVED":
      return {
        label: "APROBADO",
        className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        dot: "bg-emerald-400",
      };
    case "REJECTED":
      return {
        label: "RECHAZADO",
        className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        dot: "bg-rose-400",
      };
    case "CREATED":
      return {
        label: "CREACIÓN",
        className: "bg-sky-500/10 text-sky-300 border-sky-500/20",
        dot: "bg-sky-400",
      };
    default:
      return {
        label: action,
        className: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
        dot: "bg-indigo-400",
      };
  }
};

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({
  logs,
  isLoading = false,
}) => {
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const tabs: DataTableTab<AuditLogItem>[] = [
    {
      id: "ALL",
      label: "Todos los Eventos",
      count: logs.length,
      filter: () => true,
    },
    {
      id: "FORCE_UNLOCKED",
      label: "Desbloqueos Forzados",
      count: logs.filter((l) => l.action === "FORCE_UNLOCKED").length,
      filter: (l: AuditLogItem) => l.action === "FORCE_UNLOCKED",
    },
    {
      id: "CONCURRENCY",
      label: "Checkouts & Checkins",
      count: logs.filter((l) =>
        ["CHECKED_OUT", "CHECKED_IN", "DISCARDED_CHECKOUT"].includes(l.action)
      ).length,
      filter: (l: AuditLogItem) =>
        ["CHECKED_OUT", "CHECKED_IN", "DISCARDED_CHECKOUT"].includes(l.action),
    },
    {
      id: "GOVERNANCE",
      label: "Gobernanza & Rollback",
      count: logs.filter((l) =>
        ["ROLLBACK", "APPROVED", "REJECTED"].includes(l.action)
      ).length,
      filter: (l: AuditLogItem) =>
        ["ROLLBACK", "APPROVED", "REJECTED"].includes(l.action),
    },
  ];

  const columns: ColumnDef<AuditLogItem>[] = [
    {
      header: "FECHA / HORA",
      render: (log) => {
        const d = new Date(log.created_at);
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs text-slate-200">
              {d.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {d.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "OPERACIÓN AUDITADA",
      render: (log) => {
        const badge = getActionBadge(log.action);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${badge.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        );
      },
    },
    {
      header: "EXPEDIENTE ASOCIADO",
      render: (log) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-100 text-sm">
            {log.document?.title || "Expediente no especificado"}
          </span>
          {log.document_id && (
            <span className="font-mono text-[10px] text-slate-500">
              DOC: {log.document_id.substring(0, 8)}...
            </span>
          )}
        </div>
      ),
    },
    {
      header: "OPERADOR / AUTOR",
      render: (log) => {
        if (!log.user) {
          return (
            <span className="text-xs text-slate-500 font-mono">
              Proceso del Sistema
            </span>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-200 text-xs">
              {log.user.full_name}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {log.user.email}
            </span>
          </div>
        );
      },
    },
    {
      header: "IP DE ORIGEN",
      render: (log) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs bg-slate-950 border border-slate-800 text-slate-400">
          <span className="w-1 h-1 rounded-full bg-slate-500" />
          {log.ip_address || "127.0.0.1"}
        </span>
      ),
    },
    {
      header: "DETALLES FORENSES",
      align: "center",
      render: (log) => {
        const reason = log.details && (log.details as Record<string, unknown>).reason;

        return (
          <div className="flex items-center justify-center gap-2">
            {Boolean(reason) && (
              <span
                className="text-[11px] text-slate-400 max-w-[120px] truncate"
                title={String(reason)}
              >
                &ldquo;{String(reason)}&rdquo;
              </span>
            )}
            <button
              onClick={() => setSelectedLog(log)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors border border-slate-700 hover:border-slate-600 flex items-center gap-1"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Payload</span>
            </button>
          </div>
        );
      },
    },
    {
      header: "FIRMA CRIPTOGRÁFICA",
      align: "right",
      render: (log) => {
        const hash = log.sha256_hash;
        if (!hash) {
          return <span className="text-slate-600 text-xs font-mono">Sin Hash</span>;
        }

        const isCopied = copiedHash === hash;

        return (
          <button
            type="button"
            onClick={() => handleCopyHash(hash)}
            title="Copiar hash SHA-256 inmutable"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition-colors group"
          >
            <span>{hash.substring(0, 8)}...</span>
            <svg
              className={`w-3.5 h-3.5 ${
                isCopied ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isCopied ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.849A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.599m9.666 0c.086.319.134.654.134 1.001v.75m-9.8 0c0-.347.048-.682.134-1.001M15.666 3.849c-.217.43-.654.75-1.166.75h-5c-.512 0-.949-.32-1.166-.75m12 3.75v11.25a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25z"
                />
              )}
            </svg>
          </button>
        );
      },
    },
  ];

  return (
    <>
      <DataTable<AuditLogItem>
        columns={columns}
        data={logs}
        keyExtractor={(l) => l.id}
        tabs={tabs}
        searchPlaceholder="Buscar eventos forenses por documento, operador o IP..."
        searchPredicate={(log, q) =>
          Boolean(log.document?.title?.toLowerCase().includes(q)) ||
          Boolean(log.user?.full_name?.toLowerCase().includes(q)) ||
          Boolean(log.user?.email?.toLowerCase().includes(q)) ||
          Boolean(log.action.toLowerCase().includes(q)) ||
          Boolean(log.ip_address?.toLowerCase().includes(q))
        }
        emptyMessage="No se registran eventos de auditoría forense en este Tenant."
        isLoading={isLoading}
      />

      {/* Modal de Detalle Forense Inmutable */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Detalle de Evento Forense Inmutable"
        badge={selectedLog?.action || "AUDIT"}
        subtitle="Registro criptográfico sellado en base de datos bajo estándar ISO/IEC 27001."
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 pt-2">
            {/* Cabecera del Evento */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">ID de Auditoría</span>
                <span className="font-mono text-slate-200 select-all">
                  {selectedLog.id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Fecha y Hora UTC</span>
                <span className="font-mono text-slate-200">
                  {new Date(selectedLog.created_at).toISOString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Operador</span>
                <span className="text-slate-200 font-medium">
                  {selectedLog.user?.full_name || "Sistema"}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  {selectedLog.user?.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">IP de Origen</span>
                <span className="font-mono text-slate-200">
                  {selectedLog.ip_address || "127.0.0.1"}
                </span>
              </div>
            </div>

            {/* Documento y Versión */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block text-[11px]">Expediente Documental</span>
              <span className="text-white font-semibold text-sm block">
                {selectedLog.document?.title || "N/A"}
              </span>
              {selectedLog.document_id && (
                <span className="font-mono text-[10px] text-slate-400 block">
                  Document ID: {selectedLog.document_id}
                </span>
              )}
              {selectedLog.version_id && (
                <span className="font-mono text-[10px] text-indigo-400 block">
                  Version ID: {selectedLog.version_id}
                </span>
              )}
            </div>

            {/* Agente de Usuario */}
            {selectedLog.user_agent && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 block text-[11px] mb-1">
                  Cliente / User-Agent
                </span>
                <span className="font-mono text-[11px] text-slate-300 break-all">
                  {selectedLog.user_agent}
                </span>
              </div>
            )}

            {/* Metadatos Forenses JSON */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Metadatos / Carga Forense Estructurada
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  FORMATO JSON
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
