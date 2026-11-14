"use client";

import React, { useState } from "react";
import { Modal } from "@/shared";
import { TenantDocumentItem } from "../types/tenant.types";

interface ForceUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: TenantDocumentItem | null;
  onConfirmUnlock: (documentId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const ForceUnlockModal: React.FC<ForceUnlockModalProps> = ({
  isOpen,
  onClose,
  document,
  onConfirmUnlock,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }

  if (!document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Debe proporcionar un motivo justificado para el desbloqueo forzado.");
      return;
    }

    try {
      setError(null);
      await onConfirmUnlock(document.id, reason.trim());
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al liberar el candado del documento.";
      setError(msg);
    }
  };

  const lockedDateStr = document.locked_at
    ? new Date(document.locked_at).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Fecha no disponible";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Liberación Forzada de Candado Concurrente"
      badge="Gobernanza Crítica"
      subtitle="Rompe administrativamente el bloqueo exclusivo de edición sobre este expediente."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Banner de Advertencia de Auditoría */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <svg
              className="w-4 h-4 text-amber-400 shrink-0"
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
            <span>ADVERTENCIA DE INTEGRIDAD CONCURRENTE</span>
          </div>
          <p className="leading-relaxed text-amber-300/90">
            Forzar el desbloqueo anulará la sesión de edición activa del usuario asignado.
            Esta intervención administrativa generará una entrada inmutable en la bitácora
            forense (<span className="font-mono text-amber-200">FORCE_UNLOCKED</span>) con su
            identidad, dirección IP y justificación.
          </p>
        </div>

        {/* Ficha del Documento y Bloqueo Actual */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-slate-400 block text-[11px]">Expediente</span>
              <span className="text-white font-semibold text-sm">
                {document.title}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
              {document.category?.name || "Categoría"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-slate-400 text-[11px] block">
                Candado adquirido por:
              </span>
              <span className="text-slate-200 font-medium">
                {document.locked_by?.full_name || "Usuario Desconocido"}
              </span>
              <span className="text-slate-400 font-mono text-[10px] block">
                {document.locked_by?.email}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">
                Fecha de adquisición:
              </span>
              <span className="text-slate-200 font-mono">{lockedDateStr}</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Motivo Justificado */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Motivo / Justificación Administrativa <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describa la causa legal u operativa para liberar el candado (ej. Usuario ausente en licencia médica, proceso de licitación con plazo de vencimiento inminente)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? "Liberando Candado..." : "Liberar Candado Forzosamente"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
