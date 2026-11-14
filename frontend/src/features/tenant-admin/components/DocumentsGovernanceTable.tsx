"use client";

import React, { useState } from "react";
import { DataTable, ColumnDef, DataTableTab } from "@/shared";
import { TenantDocumentItem } from "../types/tenant.types";

interface DocumentsGovernanceTableProps {
  documents: TenantDocumentItem[];
  isLoading?: boolean;
  onForceUnlockClick: (document: TenantDocumentItem) => void;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const DocumentsGovernanceTable: React.FC<
  DocumentsGovernanceTableProps
> = ({ documents, isLoading = false, onForceUnlockClick }) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const tabs: DataTableTab<TenantDocumentItem>[] = [
    {
      id: "ALL",
      label: "Todos",
      count: documents.length,
      filter: () => true,
    },
    {
      id: "LOCKED",
      label: "Bloqueados (En Edición)",
      count: documents.filter((d) => d.is_locked).length,
      filter: (d: TenantDocumentItem) => d.is_locked,
    },
    {
      id: "UNLOCKED",
      label: "Libres para Checkout",
      count: documents.filter((d) => !d.is_locked).length,
      filter: (d: TenantDocumentItem) => !d.is_locked,
    },
  ];

  const columns: ColumnDef<TenantDocumentItem>[] = [
    {
      header: "EXPEDIENTE / TÍTULO",
      render: (doc) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-100 text-sm block">
              {doc.title}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {doc.current_version?.original_filename || "Sin archivo subido"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "CATEGORÍA",
      render: (doc) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          {doc.category?.name || "Sin Categoría"}
        </span>
      ),
    },
    {
      header: "VERSIÓN ACTIVA",
      render: (doc) => {
        const v = doc.current_version;
        if (!v) {
          return <span className="text-xs text-slate-500 font-mono">v0.0</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              v{v.version_number}.0
            </span>
            <span className="text-xs text-slate-400">
              {formatFileSize(v.file_size_bytes)}
            </span>
          </div>
        );
      },
    },
    {
      header: "ESTADO DE CONCURRENCIA",
      render: (doc) => {
        if (doc.is_locked) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-500/10 text-amber-300 border-amber-500/20 w-fit">
                <svg
                  className="w-3.5 h-3.5 text-amber-400 shrink-0"
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
                <span>BLOQUEADO</span>
              </span>
              <span className="text-[11px] text-amber-400/90 pl-1 font-medium">
                por {doc.locked_by?.full_name || "Usuario"}
              </span>
            </div>
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
            <svg
              className="w-3.5 h-3.5 text-emerald-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span>LIBRE</span>
          </span>
        );
      },
    },
    {
      header: "FIRMA CRIPTOGRÁFICA (SHA-256)",
      render: (doc) => {
        const hash = doc.current_version?.sha256_hash;
        if (!hash) {
          return <span className="text-slate-500 text-xs font-mono">N/A</span>;
        }

        const isCopied = copiedHash === hash;

        return (
          <button
            type="button"
            onClick={() => handleCopyHash(hash)}
            title="Copiar hash SHA-256 completo"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition-colors group"
          >
            <span>{hash.substring(0, 10)}...{hash.substring(hash.length - 6)}</span>
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
    {
      header: "GOBERNANZA",
      align: "right",
      render: (doc) => {
        if (!doc.is_locked) {
          return (
            <span className="text-xs text-slate-500 font-medium">
              Sin bloqueo activo
            </span>
          );
        }

        return (
          <button
            onClick={() => onForceUnlockClick(doc)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/40 transition-all shadow-sm"
          >
            <svg
              className="w-3.5 h-3.5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span>Forzar Desbloqueo</span>
          </button>
        );
      },
    },
  ];

  return (
    <DataTable<TenantDocumentItem>
      columns={columns}
      data={documents}
      keyExtractor={(d) => d.id}
      tabs={tabs}
      searchPlaceholder="Buscar documentos por título, archivo, categoría o usuario..."
      searchPredicate={(doc, q) =>
        doc.title.toLowerCase().includes(q) ||
        Boolean(doc.category?.name.toLowerCase().includes(q)) ||
        Boolean(doc.locked_by?.full_name.toLowerCase().includes(q)) ||
        Boolean(doc.current_version?.original_filename.toLowerCase().includes(q))
      }
      emptyMessage="No se encontraron documentos en la bóveda de este Tenant."
      isLoading={isLoading}
    />
  );
};
