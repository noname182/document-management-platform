"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/shared";
import { VaultCategory, VaultDepartment } from "../types/documents.types";
import { DocumentVaultError } from "../services/documents.service";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDepartments: VaultDepartment[];
  categories: VaultCategory[];
  isAdmin: boolean;
  onSubmit: (payload: {
    title: string;
    category_id: string;
    file?: File | null;
    change_summary?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  userDepartments,
  categories,
  isAdmin,
  onSubmit,
  isLoading = false,
}) => {
  const allowedCategories = useMemo(() => {
    if (isAdmin) return categories;
    const allowedIds = new Set(userDepartments.map((d) => d.id));
    return categories.filter((c) => allowedIds.has(c.department_id));
  }, [categories, userDepartments, isAdmin]);

  const primaryDeptId = useMemo(
    () => userDepartments.find((d) => d.is_primary)?.id || userDepartments[0]?.id,
    [userDepartments]
  );

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState("Carga inicial v1");
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setTitle("");
      const defaultCat =
        allowedCategories.find((c) => c.department_id === primaryDeptId) ||
        allowedCategories[0];
      setCategoryId(defaultCat?.id || "");
      setFile(null);
      setChangeSummary("Carga inicial v1");
      setError(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Seleccione una categoría documental autorizada.");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        category_id: categoryId,
        file,
        change_summary: changeSummary.trim() || "Carga inicial v1",
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof DocumentVaultError || err instanceof Error
          ? err.message
          : "Error al crear el expediente."
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Expediente Documental"
      subtitle="El archivo se inspeccionará en cuarentena (SHA-256) y se promoverá a MinIO."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Título del Expediente <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={255}
            placeholder="Ej. Informe Quirúrgico Paciente #512"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Categoría / Área Destino <span className="text-red-400">*</span>
          </label>
          {allowedCategories.length === 0 ? (
            <p className="text-xs text-amber-300 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              No existen categorías documentales creadas para tus departamentos asignados. Solicita al Administrador Organizacional crear una categoría primero.
            </p>
          ) : (
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {allowedCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  [{cat.department?.name || "Área"}] — {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Archivo Inicial (v1) — PDF / DOCX / Imagen{" "}
            <span className="text-slate-500">(Opcional, puede subirlo luego vía Check-in)</span>
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 bg-slate-950 border border-slate-800 rounded-xl p-2"
          />
          {file && (
            <p className="mt-1.5 text-[11px] text-emerald-300 font-mono">
              Seleccionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {file && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nota de Versión Inicial
            </label>
            <input
              type="text"
              maxLength={500}
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim() || allowedCategories.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Procesando en MinIO..." : "Crear Expediente"}
          </button>
        </div>
      </form>
    </Modal>
  );
};