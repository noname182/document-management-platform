"use client";

import React, { useState } from "react";
import { Modal } from "@/shared";
import {
  DepartmentItem,
  TenantUserItem,
  CreateUserPayload,
  UpdateUserPayload,
  TenantUserRole,
} from "../types/tenant.types";
import { TenantError } from "../services/tenant.service";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentItem[];
  initialData?: TenantUserItem | null;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateUserPayload) => Promise<void>;
  isLoading?: boolean;
}

const ROLES: { id: TenantUserRole; name: string; description: string }[] = [
  {
    id: "TENANT_ADMIN",
    name: "Administrador de Organización (TENANT_ADMIN)",
    description:
      "Control de usuarios, áreas, categorías y liberación administrativa de candados.",
  },
  {
    id: "APPROVER",
    name: "Aprobador de Expedientes (APPROVER)",
    description:
      "Revisión, aprobación o rechazo de documentos y acceso a bitácora forense.",
  },
  {
    id: "EDITOR",
    name: "Editor Documental (EDITOR)",
    description:
      "Creación, edición, checkout y checkin de expedientes en su departamento.",
  },
  {
    id: "VIEWER",
    name: "Lector / Auditor (VIEWER)",
    description:
      "Solo lectura y descarga de documentos de su departamento asignado.",
  },
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  departments,
  initialData,
  onSubmit,
  onUpdate,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<TenantUserRole>("EDITOR");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);

  const [prevInitialData, setPrevInitialData] = useState<TenantUserItem | null | undefined>(undefined);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(false);

  // Inicializar formulario al abrir o cambiar initialData
  if (initialData !== prevInitialData || isOpen !== prevIsOpen) {
    setPrevInitialData(initialData);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (initialData) {
        setFullName(initialData.full_name);
        setEmail(initialData.email);
        setPassword("");
        const currentRole = (initialData.roles?.[0]?.id as TenantUserRole) || "EDITOR";
        setRoleId(currentRole);
        setDepartmentId(initialData.department_id || initialData.department?.id || "");
        setStatus(initialData.status);
      } else {
        setFullName("");
        setEmail("");
        setPassword("");
        setRoleId("EDITOR");
        setDepartmentId(departments[0]?.id || "");
        setStatus("ACTIVE");
      }
      setFormError(null);
    }
  }

  const requiresDepartment = roleId === "EDITOR" || roleId === "VIEWER";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validación de departamento condicional según ABAC backend
    if (requiresDepartment && !departmentId) {
      setFormError("Los roles EDITOR y VIEWER requieren obligatoriamente un departamento asignado.");
      return;
    }

    try {
      if (isEditing && initialData) {
        const payload: UpdateUserPayload = {
          full_name: fullName.trim(),
          role_id: roleId,
          department_id: departmentId || null,
          status,
        };
        await onUpdate(initialData.id, payload);
      } else {
        if (!password || password.length < 8) {
          setFormError("La contraseña inicial debe tener al menos 8 caracteres.");
          return;
        }

        const payload: CreateUserPayload = {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role_id: roleId,
          department_id: departmentId || null,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof TenantError || err instanceof Error
          ? err.message
          : "Error al guardar el usuario.";
      setFormError(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Perfil y Rol de Usuario" : "Registrar Nuevo Usuario"}
      subtitle="Defina las credenciales, permisos y la pertenencia departamental bajo control ABAC."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Error Alert */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
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
            <span className="leading-relaxed">{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre Completo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre Completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="Ej. Roberto Baldivieso Guzmán"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Correo Electrónico */}
          <div className={isEditing ? "sm:col-span-2" : "sm:col-span-1"}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Correo Electrónico Corporativo <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              disabled={isEditing}
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 disabled:opacity-50 disabled:bg-slate-900/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {isEditing && (
              <p className="mt-1 text-[11px] text-slate-500">
                El correo electrónico corporativo es inmutable para preservar la firma en auditorías forenses.
              </p>
            )}
          </div>

          {/* Contraseña Inicial (Solo al crear) */}
          {!isEditing && (
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contraseña Temporal <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          )}

          {/* Rol del Sistema */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Rol Operativo / Privilegios <span className="text-red-400">*</span>
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value as TenantUserRole)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {ROLES.find((r) => r.id === roleId)?.description}
            </p>
          </div>

          {/* Departamento Asignado */}
          <div className={isEditing ? "sm:col-span-1" : "sm:col-span-2"}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Departamento Asignado{" "}
              {requiresDepartment ? (
                <span className="text-amber-400 font-semibold">* (Obligatorio para {roleId})</span>
              ) : (
                <span className="text-slate-500">(Opcional / Global)</span>
              )}
            </label>
            <select
              required={requiresDepartment}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-sm text-slate-100 focus:outline-none transition-colors ${
                requiresDepartment && !departmentId
                  ? "border-amber-500/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  : "border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              }`}
            >
              <option value="">
                {requiresDepartment
                  ? "-- Seleccione un departamento obligatorio --"
                  : "Sin Departamento Asignado (Acceso Global de Tenant)"}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado del Usuario (Solo al editar) */}
          {isEditing && (
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Estado de la Cuenta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "SUSPENDED")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              >
                <option value="ACTIVE">ACTIVO (Permitido Iniciar Sesión)</option>
                <option value="SUSPENDED">SUSPENDIDO (Acceso Bloqueado)</option>
              </select>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
            disabled={isLoading || !fullName.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isLoading
              ? "Procesando..."
              : isEditing
              ? "Guardar Cambios"
              : "Registrar Usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
