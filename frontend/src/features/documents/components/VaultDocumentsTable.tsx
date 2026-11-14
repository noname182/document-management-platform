"use client";

import React from "react";
import { DataTable, ColumnDef, DataTableTab } from "@/shared";
import { VaultDocumentItem } from "../types/documents.types";

interface VaultDocumentsTableProps {
  documents: VaultDocumentItem[];
  currentUserId: string;
  canCreate: boolean;
  canCheckout: boolean;
  canDownload: boolean;
  isLoading?: boolean;
  actionLoadingId?: string | null;
  onOpenCreate: () => void;
  onOpenDetail: (doc: VaultDocumentItem) => void;
  onDownload: (doc: VaultDocumentItem) => void;
  onCheckout: (doc: VaultDocumentItem) => void;
  onDiscardCheckout: (doc: VaultDocumentItem) => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const VaultDocumentsTable: React.FC<VaultDocumentsTableProps> = ({
  documents,
  currentUserId,
  canCreate,
  canCheckout,
  canDownload,
  isLoading = false,
  actionLoadingId,
  onOpenCreate,
  onOpenDetail,
  onDownload,
  onCheckout,
  onDiscardCheckout,
}) => {
  const tabs: DataTableTab<VaultDocumentItem>[] = [
    {
      id: "ALL",
      label: "Todos",
      count: documents.length,
      filter: () => true,
    },
    {
      id: "AVAILABLE",
      label: "Disponibles",
      count: documents.filter((d) => !d.is_locked).length,
      filter: (d) => !d.is_locked,
    },
    {
      id: "MY_LOCKS",
      label: "Mis Candados",
      count: documents.filter(
        (d) => d.is_locked && d.locked_by_user_id === currentUserId
      ).length,
      filter: (d) => d.is_locked && d.locked_by_user_id === currentUserId,
    },
    {
      id: "LOCKED_OTHERS",
      label: "En Edición (Otros)",
      count: documents.filter(
        (d) => d.is_locked && d.locked_by_user_id !== currentUserId
      ).length,
      filter: (d) => d.is_locked && d.locked_by_user_id !== currentUserId,
    },
  ];

  const columns: ColumnDef<VaultDocumentItem>[] = [
    {
      header: "EXPEDIENTE / ARCHIVO ACTIVO",
      render: (doc) => (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onOpenDetail(doc)}
            className="text-left font-semibold text-sm text-slate-100 hover:text-indigo-300 transition-colors"
          >
            {doc.title}
          </button>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {doc.current_version ? (
              <>
                <span className="font-mono text-[11px] text-slate-300">
                  {doc.current_version.original_filename}
                </span>
                <span>•</span>
                <span>{formatBytes(doc.current_version.file_size_bytes)}</span>
              </>
            ) : (
              <span className="italic text-amber-400/80">
                Sin archivo binario cargado aún
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "ÁREA / CATEGORÍA",
      render: (doc) => (
        <div className="space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/25 text-indigo-200">
            {doc.category?.department?.name || "General"}
          </span>
          <div className="text-[11px] text-slate-400 pl-1">
            {doc.category?.name || "Sin categoría"}
          </div>
        </div>
      ),
    },
    {
      header: "VERSIÓN",
      align: "center",
      render: (doc) =>
        doc.current_version ? (
          <div className="inline-flex flex-col items-center">
            <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              v{doc.current_version.version_number}
            </span>
            <span
              title={doc.current_version.sha256_hash}
              className="mt-1 font-mono text-[10px] text-slate-500"
            >
              SHA256: {doc.current_version.sha256_hash.slice(0, 8)}…
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">v0</span>
        ),
    },
    {
      header: "ESTADO CONCURRENCIA",
      align: "center",
      render: (doc) => {
        if (!doc.is_locked) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Disponible
            </span>
          );
        }

        const isMine = doc.locked_by_user_id === currentUserId;

        return (
          <div className="inline-flex flex-col items-center gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isMine
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isMine ? "bg-indigo-400" : "bg-amber-400"
                }`}
              />
              {isMine ? "Bloqueado por ti" : "En edición"}
            </span>
            {!isMine && doc.locked_by && (
              <span className="text-[11px] text-slate-400">
                por {doc.locked_by.full_name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "ACCIONES",
      align: "right",
      render: (doc) => {
        const isMine = doc.is_locked && doc.locked_by_user_id === currentUserId;
        const lockedByOther =
          doc.is_locked && doc.locked_by_user_id !== currentUserId;
        const busy = actionLoadingId === doc.id;

        return (
          <div className="flex items-center justify-end gap-2">
            {/* Descarga directa de la versión activa (doc:download) */}
            {canDownload && doc.current_version && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDownload(doc)}
                title={`Descargar ${doc.current_version.original_filename}`}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors disabled:opacity-50"
              >
                Descargar
              </button>
            )}

            {/* Botón común para VIEWER / EDITOR / APPROVER */}
            <button
              type="button"
              onClick={() => onOpenDetail(doc)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {isMine ? "Subir Versión (Check-in)" : "Historial"}
            </button>

            {/* Controles de concurrencia exclusivos para EDITOR */}
            {canCheckout && !doc.is_locked && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCheckout(doc)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {busy ? "Bloqueando..." : "Check-out"}
              </button>
            )}

            {canCheckout && isMine && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDiscardCheckout(doc)}
                title="Liberar candado sin subir cambios"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Soltar"}
              </button>
            )}

            {canCheckout && lockedByOther && (
              <span
                title={`Bloqueado por ${doc.locked_by?.full_name || "otro editor"}`}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed"
              >
                Bloqueado
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable<VaultDocumentItem>
      columns={columns}
      data={documents}
      keyExtractor={(d) => d.id}
      tabs={tabs}
      searchPlaceholder="Buscar expediente por título, archivo, categoría o departamento..."
      searchPredicate={(doc, q) =>
        doc.title.toLowerCase().includes(q) ||
        Boolean(
          doc.current_version?.original_filename.toLowerCase().includes(q)
        ) ||
        Boolean(doc.category?.name.toLowerCase().includes(q)) ||
        Boolean(doc.category?.department?.name.toLowerCase().includes(q))
      }
      headerActions={
        canCreate ? (
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
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
            <span>Nuevo Expediente</span>
          </button>
        ) : undefined
      }
      emptyMessage="No hay expedientes registrados en los departamentos seleccionados."
      isLoading={isLoading}
    />
  );
};