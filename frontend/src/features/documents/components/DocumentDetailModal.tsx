"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/shared";
import {
  VaultDocumentItem,
  DocumentVersionItem,
} from "../types/documents.types";
import {
  documentsService,
  DocumentVaultError,
} from "../services/documents.service";

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: VaultDocumentItem | null;
  currentUserId: string;
  canCheckin: boolean;
  canRollback: boolean;
  canDownload: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  onSuccessAction: (message: string) => Promise<void>;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document,
  currentUserId,
  canCheckin,
  canRollback,
  canApprove = false,
  canReject = false,
  onSuccessAction,
}) => {
  const [versions, setVersions] = useState<DocumentVersionItem[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Estado Check-in (EDITOR)
  const [file, setFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  // Estado Forward-Rollback (APPROVER)
  const [rollbackTarget, setRollbackTarget] =
    useState<DocumentVersionItem | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [submittingRollback, setSubmittingRollback] = useState(false);

  // Estado Dictamen Aprobar / Rechazar (APPROVER)
  const [reviewAction, setReviewAction] = useState<{
    type: "approve" | "reject";
    version: DocumentVersionItem;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !document) return;

    let active = true;
    setLoadingVersions(true);
    setError(null);
    setFile(null);
    setChangeSummary("");
    setRollbackTarget(null);
    setRollbackReason("");
    setReviewAction(null);
    setReviewNote("");

    documentsService
      .getDocumentVersions(document.id)
      .then((list) => {
        if (active) setVersions(list);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "Error cargando versiones."
          );
      })
      .finally(() => {
        if (active) setLoadingVersions(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, document]);

  if (!document) return null;

  const isLockedByMe =
    document.is_locked && document.locked_by_user_id === currentUserId;
  const canUploadNewVersion =
    canCheckin && (isLockedByMe || !document.is_locked);

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Seleccione un archivo para consolidar la nueva versión.");
      return;
    }

    setSubmittingCheckin(true);
    setError(null);

    try {
      const processed = await documentsService.uploadToProcessor(file);
      const createdVersion = await documentsService.checkin(document.id, {
        storage_key: processed.storageLocation,
        storage_bucket: "processed-documents",
        original_filename: file.name,
        mime_type:
          processed.mimeType || file.type || "application/octet-stream",
        file_size_bytes: file.size,
        sha256_hash: processed.hashSha256,
        change_summary:
          changeSummary.trim() || `Actualización de archivo (${file.name})`,
      });

      await onSuccessAction(
        `Versión v${createdVersion.version_number} consolidada y candado liberado.`
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof DocumentVaultError || err instanceof Error
          ? err.message
          : "Error al consolidar el check-in."
      );
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const handleConfirmRollback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollbackTarget || !rollbackReason.trim()) return;

    setSubmittingRollback(true);
    setError(null);

    try {
      const newVer = await documentsService.rollback(
        document.id,
        rollbackTarget.id,
        rollbackReason.trim()
      );
      await onSuccessAction(
        `Forward-Rollback completado: se creó la versión v${newVer.version_number} a partir de v${rollbackTarget.version_number}.`
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof DocumentVaultError || err instanceof Error
          ? err.message
          : "Error al ejecutar el Forward-Rollback."
      );
    } finally {
      setSubmittingRollback(false);
    }
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAction) return;

    if (reviewAction.type === "reject" && reviewNote.trim().length < 5) {
      setError("El motivo de rechazo debe tener al menos 5 caracteres.");
      return;
    }

    setSubmittingReview(true);
    setError(null);

    try {
      if (reviewAction.type === "approve") {
        await documentsService.approveVersion(
          document.id,
          reviewAction.version.id,
          reviewNote
        );
        await onSuccessAction(
          `Versión v${reviewAction.version.version_number} aprobada y registrada en auditoría.`
        );
      } else {
        await documentsService.rejectVersion(
          document.id,
          reviewAction.version.id,
          reviewNote.trim()
        );
        await onSuccessAction(
          `Versión v${reviewAction.version.version_number} rechazada y registrada en auditoría.`
        );
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof DocumentVaultError || err instanceof Error
          ? err.message
          : "Error al registrar el dictamen."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
      case "ACTIVE":
        return "bg-sky-500/15 text-sky-300 border border-sky-500/30";
      case "REJECTED":
        return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={`Área: ${document.category?.department?.name || "General"} • Categoría: ${
        document.category?.name || "N/A"
      }`}
      maxWidth="xl"
    >
      <div className="space-y-5 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* ZONA EDITOR: Subida de nueva versión (Check-in) */}
        {canUploadNewVersion && (
          <form
            onSubmit={handleCheckinSubmit}
            className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {isLockedByMe
                  ? "Tienes el candado activo — Consolidar Nueva Versión (Check-in)"
                  : "Subir Nueva Versión Documental"}
              </h4>
              <span className="text-[11px] text-slate-400">
                Inspección SHA-256 + MinIO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white bg-slate-950 border border-slate-800 rounded-xl p-1.5"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Resumen de cambios (Ej. Firma de autorización)"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingCheckin || !file}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md disabled:opacity-50"
              >
                {submittingCheckin
                  ? "Verificando hash y guardando..."
                  : "Consolidar Versión y Liberar Candado"}
              </button>
            </div>
          </form>
        )}

        {/* ZONA APPROVER: Dictamen de Aprobación / Rechazo */}
        {reviewAction && (
          <form
            onSubmit={handleConfirmReview}
            className={`p-4 rounded-xl border space-y-3 ${
              reviewAction.type === "approve"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-rose-500/10 border-rose-500/30"
            }`}
          >
            <div
              className={`text-xs font-semibold ${
                reviewAction.type === "approve"
                  ? "text-emerald-200"
                  : "text-rose-200"
              }`}
            >
              {reviewAction.type === "approve"
                ? `Aprobar versión v${reviewAction.version.version_number} (${reviewAction.version.original_filename})`
                : `Rechazar versión v${reviewAction.version.version_number} (${reviewAction.version.original_filename})`}
            </div>
            <p className="text-[11px] text-slate-300">
              {reviewAction.type === "approve"
                ? "La versión quedará marcada como APPROVED y consolidada como vigente en la bitácora forense."
                : "El rechazo no borra el archivo ni el historial; se requiere un motivo explícito para auditoría."}
            </p>
            <input
              type="text"
              required={reviewAction.type === "reject"}
              maxLength={500}
              placeholder={
                reviewAction.type === "approve"
                  ? "Observación de aprobación (opcional)..."
                  : "Motivo obligatorio del rechazo (mín. 5 caracteres)..."
              }
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReviewAction(null);
                  setReviewNote("");
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  submittingReview ||
                  (reviewAction.type === "reject" &&
                    reviewNote.trim().length < 5)
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 ${
                  reviewAction.type === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {submittingReview
                  ? "Guardando dictamen..."
                  : reviewAction.type === "approve"
                    ? "Confirmar Aprobación"
                    : "Confirmar Rechazo"}
              </button>
            </div>
          </form>
        )}

        {/* ZONA APPROVER: Formulario de confirmación de Forward-Rollback */}
        {rollbackTarget && canRollback && (
          <form
            onSubmit={handleConfirmRollback}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3"
          >
            <div className="text-xs font-semibold text-amber-200">
              Restaurar versión v{rollbackTarget.version_number} (
              {rollbackTarget.original_filename}) mediante Forward-Rollback
            </div>
            <p className="text-[11px] text-slate-300">
              Se creará una nueva versión activa reutilizando el hash SHA-256 original sin borrar el historial forense.
            </p>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="Motivo obligatorio de la reversión..."
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-slate-100 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingRollback || !rollbackReason.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
              >
                {submittingRollback
                  ? "Revirtiendo..."
                  : "Confirmar Forward-Rollback"}
              </button>
            </div>
          </form>
        )}

        {/* HISTORIAL INMUTABLE DE VERSIONES */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cadena Inmutable de Versiones ({versions.length})
          </h4>

          {loadingVersions ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              Cargando historial criptográfico...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center bg-slate-950/60 rounded-xl border border-slate-800">
              Este expediente aún no tiene versiones cargadas.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {versions.map((ver) => {
                const isCurrent =
                  ver.id === document.current_version_id ||
                  ver.status === "ACTIVE" ||
                  ver.status === "APPROVED";
                const canDictaminate =
                  !document.is_locked &&
                  ver.status !== "APPROVED" &&
                  ver.status !== "REJECTED";

                return (
                  <div
                    key={ver.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      ver.status === "APPROVED"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : ver.status === "REJECTED"
                          ? "bg-rose-500/5 border-rose-500/20"
                          : ver.status === "ACTIVE"
                            ? "bg-sky-500/5 border-sky-500/30"
                            : "bg-slate-950/70 border-slate-800"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                            isCurrent
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          v{ver.version_number}
                        </span>
                        <span className="text-xs font-semibold text-slate-100">
                          {ver.original_filename}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${getStatusBadgeStyle(
                            ver.status
                          )}`}
                        >
                          {ver.status}
                        </span>
                      </div>

                      {ver.change_summary && (
                        <p className="text-xs text-slate-300">
                          {ver.change_summary}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>
                          Subido por:{" "}
                          <strong className="text-slate-300">
                            {ver.creator?.full_name || "Sistema"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(ver.created_at).toLocaleString("es-ES")}
                        </span>
                      </div>

                      <div className="font-mono text-[10px] text-slate-500 break-all">
                        SHA-256: {ver.sha256_hash}
                      </div>
                    </div>

                    {/* Acciones APPROVER sobre la versión */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {canApprove && canDictaminate && (
                        <button
                          type="button"
                          onClick={() => {
                            setRollbackTarget(null);
                            setReviewAction({ type: "approve", version: ver });
                            setReviewNote("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
                        >
                          Aprobar
                        </button>
                      )}

                      {canReject && canDictaminate && (
                        <button
                          type="button"
                          onClick={() => {
                            setRollbackTarget(null);
                            setReviewAction({ type: "reject", version: ver });
                            setReviewNote("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors"
                        >
                          Rechazar
                        </button>
                      )}

                      {canRollback && !isCurrent && !document.is_locked && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewAction(null);
                            setRollbackTarget(ver);
                            setRollbackReason("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                        >
                          Restaurar v{ver.version_number}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};