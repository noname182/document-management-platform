"use client";

import React, { useState } from "react";
import { DataTable, ColumnDef, Modal } from "@/shared";
import {
  DepartmentItem,
  DocumentCategoryItem,
  CreateDepartmentPayload,
  CreateCategoryPayload,
  UpdateDepartmentPayload,
  UpdateCategoryPayload,
} from "../types/tenant.types";
import { tenantService, TenantError } from "../services/tenant.service";

interface OrganizationManagerProps {
  departments: DepartmentItem[];
  categories: DocumentCategoryItem[];
  isLoading?: boolean;
  onRefresh: () => void | Promise<void>;
}

export const OrganizationManager: React.FC<OrganizationManagerProps> = ({
  departments,
  categories,
  isLoading = false,
  onRefresh,
}) => {
  // Pestaña activa: "DEPARTMENTS" | "CATEGORIES"
  const [activeTab, setActiveTab] = useState<"DEPARTMENTS" | "CATEGORIES">(
    "DEPARTMENTS"
  );

  // Estados de Modales y Edición
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptName, setDeptName] = useState("");

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<DocumentCategoryItem | null>(
    null
  );
  const [catName, setCatName] = useState("");
  const [catDeptId, setCatDeptId] = useState("");
  const [catDescription, setCatDescription] = useState("");

  // Estados de carga y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ==========================================
  // Manejadores de Departamentos
  // ==========================================
  const handleOpenCreateDept = () => {
    setEditingDept(null);
    setDeptName("");
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setIsDeptModalOpen(true);
  };

  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingDept) {
        const payload: UpdateDepartmentPayload = { name: deptName.trim() };
        await tenantService.updateDepartment(editingDept.id, payload);
        setFeedback({
          message: `Departamento "${deptName.trim()}" actualizado correctamente.`,
          type: "success",
        });
      } else {
        const payload: CreateDepartmentPayload = { name: deptName.trim() };
        await tenantService.createDepartment(payload);
        setFeedback({
          message: `Departamento "${deptName.trim()}" creado exitosamente.`,
          type: "success",
        });
      }
      setIsDeptModalOpen(false);
      setDeptName("");
      setEditingDept(null);
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al procesar el departamento.";
      setFeedback({ message: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDept = async (dept: DepartmentItem) => {
    if (dept.categories_count && dept.categories_count > 0) {
      setFeedback({
        message: `No se puede eliminar "${dept.name}": contiene ${dept.categories_count} categoría(s) documental(es) asociada(s). Reasigne o elimine primero las categorías.`,
        type: "error",
      });
      return;
    }

    if (
      !window.confirm(
        `¿Está seguro de eliminar el departamento "${dept.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setActionLoadingId(dept.id);
    setFeedback(null);

    try {
      await tenantService.deleteDepartment(dept.id);
      setFeedback({
        message: `Departamento "${dept.name}" eliminado exitosamente.`,
        type: "success",
      });
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al eliminar el departamento.";
      setFeedback({ message: msg, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ==========================================
  // Manejadores de Categorías
  // ==========================================
  const handleOpenCreateCat = () => {
    setEditingCat(null);
    setCatName("");
    setCatDeptId(departments[0]?.id || "");
    setCatDescription("");
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: DocumentCategoryItem) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDeptId(cat.department_id);
    setCatDescription(cat.description || "");
    setIsCatModalOpen(true);
  };

  const handleSubmitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catDeptId) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingCat) {
        const payload: UpdateCategoryPayload = {
          name: catName.trim(),
          department_id: catDeptId,
          description: catDescription.trim() || null,
        };
        await tenantService.updateCategory(editingCat.id, payload);
        setFeedback({
          message: `Categoría "${catName.trim()}" actualizada correctamente.`,
          type: "success",
        });
      } else {
        const payload: CreateCategoryPayload = {
          name: catName.trim(),
          department_id: catDeptId,
          description: catDescription.trim() || null,
        };
        await tenantService.createCategory(payload);
        setFeedback({
          message: `Categoría "${catName.trim()}" creada exitosamente.`,
          type: "success",
        });
      }
      setIsCatModalOpen(false);
      setCatName("");
      setCatDeptId("");
      setCatDescription("");
      setEditingCat(null);
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al procesar la categoría documental.";
      setFeedback({ message: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCat = async (cat: DocumentCategoryItem) => {
    if (cat.documents_count && cat.documents_count > 0) {
      setFeedback({
        message: `No se puede eliminar "${cat.name}": contiene ${cat.documents_count} expediente(s) documental(es) activo(s). Mueva o archive los documentos primero.`,
        type: "error",
      });
      return;
    }

    if (
      !window.confirm(
        `¿Está seguro de eliminar la categoría "${cat.name}"? Esta acción es irreversible.`
      )
    ) {
      return;
    }

    setActionLoadingId(cat.id);
    setFeedback(null);

    try {
      await tenantService.deleteCategory(cat.id);
      setFeedback({
        message: `Categoría "${cat.name}" eliminada exitosamente.`,
        type: "success",
      });
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al eliminar la categoría documental.";
      setFeedback({ message: msg, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ==========================================
  // Columnas: Departamentos
  // ==========================================
  const departmentColumns: ColumnDef<DepartmentItem>[] = [
    {
      header: "DEPARTAMENTO / ÁREA",
      render: (dept) => (
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
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-100 text-sm block">
              {dept.name}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              ID: {dept.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "PERSONAL ASIGNADO",
      align: "center",
      render: (dept) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
          <svg
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          {dept.users_count ?? 0} usuarios
        </span>
      ),
    },
    {
      header: "CATEGORÍAS ASOCIADAS",
      align: "center",
      render: (dept) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
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
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
          {dept.categories_count ?? 0} categorías
        </span>
      ),
    },
    {
      header: "ACCIONES",
      align: "right",
      render: (dept) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEditDept(dept)}
            disabled={actionLoadingId === dept.id}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 hover:border-slate-600"
          >
            Editar
          </button>
          <button
            onClick={() => handleDeleteDept(dept)}
            disabled={actionLoadingId === dept.id}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors border border-red-500/20 hover:border-red-500/30 disabled:opacity-50"
          >
            {actionLoadingId === dept.id ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      ),
    },
  ];

  // ==========================================
  // Columnas: Categorías Documentales
  // ==========================================
  const categoryColumns: ColumnDef<DocumentCategoryItem>[] = [
    {
      header: "CATEGORÍA DOCUMENTAL",
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-100 text-sm block">
              {cat.name}
            </span>
            {cat.description && (
              <p className="text-xs text-slate-400 line-clamp-1 max-w-sm">
                {cat.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "DEPARTAMENTO",
      render: (cat) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          {cat.department?.name || "Sin Departamento"}
        </span>
      ),
    },
    {
      header: "EXPEDIENTES ACTIVOS",
      align: "center",
      render: (cat) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <svg
            className="w-3.5 h-3.5 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
          {cat.documents_count ?? 0} expedientes
        </span>
      ),
    },
    {
      header: "ACCIONES",
      align: "right",
      render: (cat) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEditCat(cat)}
            disabled={actionLoadingId === cat.id}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 hover:border-slate-600"
          >
            Editar
          </button>
          <button
            onClick={() => handleDeleteCat(cat)}
            disabled={actionLoadingId === cat.id}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors border border-red-500/20 hover:border-red-500/30 disabled:opacity-50"
          >
            {actionLoadingId === cat.id ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Feedback / Errores de Restricción Relacional (422) */}
      {feedback && (
        <div
          className={`flex items-start justify-between p-4 rounded-xl text-xs font-medium border transition-all animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                feedback.type === "success" ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Selector de Sub-Pestaña: Departamentos vs Categorías */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("DEPARTMENTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "DEPARTMENTS"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
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
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            </svg>
            <span>Departamentos</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === "DEPARTMENTS"
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {departments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CATEGORIES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "CATEGORIES"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
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
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
            <span>Categorías Documentales</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === "CATEGORIES"
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {categories.length}
            </span>
          </button>
        </div>

        {/* Botón de Acción Principal según pestaña */}
        {activeTab === "DEPARTMENTS" ? (
          <button
            type="button"
            onClick={handleOpenCreateDept}
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
            <span>Nuevo Departamento</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpenCreateCat}
            disabled={departments.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
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
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {/* Contenido: Tabla de Departamentos */}
      {activeTab === "DEPARTMENTS" && (
        <DataTable<DepartmentItem>
          columns={departmentColumns}
          data={departments}
          keyExtractor={(dept) => dept.id}
          searchPlaceholder="Buscar departamentos por nombre..."
          searchPredicate={(dept, q) =>
            dept.name.toLowerCase().includes(q)
          }
          emptyMessage="No se encontraron departamentos registrados en este Tenant."
          isLoading={isLoading}
        />
      )}

      {/* Contenido: Tabla de Categorías Documentales */}
      {activeTab === "CATEGORIES" && (
        <DataTable<DocumentCategoryItem>
          columns={categoryColumns}
          data={categories}
          keyExtractor={(cat) => cat.id}
          searchPlaceholder="Buscar categorías por nombre o departamento..."
          searchPredicate={(cat, q) =>
            cat.name.toLowerCase().includes(q) ||
            Boolean(cat.department?.name.toLowerCase().includes(q)) ||
            Boolean(cat.description?.toLowerCase().includes(q))
          }
          emptyMessage="No se encontraron categorías documentales registradas en este Tenant."
          isLoading={isLoading}
        />
      )}

      {/* ============================================================== */}
      {/* Modal: Crear / Editar Departamento */}
      {/* ============================================================== */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => {
          setIsDeptModalOpen(false);
          setEditingDept(null);
        }}
        title={
          editingDept ? "Editar Departamento" : "Nuevo Departamento Organizacional"
        }
        subtitle="Los departamentos delimitan el acceso y visibilidad de los expedientes bajo control ABAC."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitDept} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre del Departamento <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Ej. Legal & Cumplimiento, Finanzas, Recursos Humanos"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Debe ser único dentro de su organización (máximo 100 caracteres).
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsDeptModalOpen(false);
                setEditingDept(null);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !deptName.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Guardando..."
                : editingDept
                ? "Guardar Cambios"
                : "Crear Departamento"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* Modal: Crear / Editar Categoría Documental */}
      {/* ============================================================== */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => {
          setIsCatModalOpen(false);
          setEditingCat(null);
        }}
        title={
          editingCat
            ? "Editar Categoría Documental"
            : "Nueva Categoría Documental"
        }
        subtitle="Estructura los tipos de documentos y expedientes clasificados en su respectiva área."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitCat} className="space-y-4 pt-2">
          {/* Departamento Asignado */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Departamento Vinculado <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={catDeptId}
              onChange={(e) => setCatDeptId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="" disabled>
                Seleccione un departamento...
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre de la Categoría */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre de la Categoría <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Ej. Contratos Mercantiles, Balances Contables"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Descripción / Criterio de Archivo (Opcional)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Describe el propósito o alcance legal de los documentos que pertenecerán a esta categoría..."
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsCatModalOpen(false);
                setEditingCat(null);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !catName.trim() || !catDeptId}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Guardando..."
                : editingCat
                ? "Guardar Cambios"
                : "Crear Categoría"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
