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
    name: "Admin de Organización (TENANT_ADMIN)",
    description: "Control de usuarios, áreas, categorías y liberación de candados.",
  },
  {
    id: "APPROVER",
    name: "Aprobador (APPROVER)",
    description: "Revisión, rollback y auditoría forense de expedientes.",
  },
  {
    id: "EDITOR",
    name: "Editor Documental (EDITOR)",
    description: "Creación, edición, checkout y checkin en sus áreas asignadas.",
  },
  {
    id: "VIEWER",
    name: "Lector / Auditor (VIEWER)",
    description: "Solo lectura y descarga en sus departamentos asignados.",
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
  const [roleIds, setRoleIds] = useState<TenantUserRole[]>(["EDITOR"]);
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
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
        const currentRoles = (initialData.roles?.map((r) => r.id as TenantUserRole) || []);
        setRoleIds(currentRoles.length > 0 ? currentRoles : ["EDITOR"]);

        // Ordenar poniendo el departamento principal primero
        const sortedDepts = [...(initialData.departments || [])].sort(
          (a, b) => Number(Boolean(b.pivot?.is_primary)) - Number(Boolean(a.pivot?.is_primary))
        );
        setDepartmentIds(sortedDepts.map((d) => d.id));
        setStatus(initialData.status);
      } else {
        setFullName("");
        setEmail("");
        setPassword("");
        setRoleIds(["EDITOR"]);
        setDepartmentIds(departments[0]?.id ? [departments[0].id] : []);
        setStatus("ACTIVE");
      }
      setFormError(null);
    }
  }

  const toggleRole = (role: TenantUserRole) => {
    setRoleIds((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleDepartment = (deptId: string) => {
    setDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const setAsPrimaryDepartment = (deptId: string) => {
    setDepartmentIds((prev) => [deptId, ...prev.filter((id) => id !== deptId)]);
  };

  const requiresDepartment = roleIds.includes("EDITOR") || roleIds.includes("VIEWER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (roleIds.length === 0) {
      setFormError("Debe seleccionar al menos un rol operativo para el usuario.");
      return;
    }

    if (requiresDepartment && departmentIds.length === 0) {
      setFormError("Los roles EDITOR y VIEWER requieren obligatoriamente al menos un departamento asignado.");
      return;
    }

    try {
      if (isEditing && initialData) {
        const payload: UpdateUserPayload = {
          full_name: fullName.trim(),
          role_ids: roleIds,
          department_ids: departmentIds,
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
          role_ids: roleIds,
          department_ids: departmentIds,
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
      title={isEditing ? "Editar Perfil, Roles y Áreas ABAC" : "Registrar Nuevo Usuario"}
      subtitle="Asigne múltiples roles operativos y departamentos autorizados (relación N:M)."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
              placeholder="Ej. Dr. Carlos Mendoza Rojas"
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

          {/* Selección Múltiple de Roles */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Roles Operativos Asignados <span className="text-red-400">*</span>{" "}
              <span className="text-slate-500 font-normal">(Puede combinar múltiples roles)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const checked = roleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      checked
                        ? "bg-indigo-500/15 border-indigo-500/50 text-slate-100"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold leading-tight">{role.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {role.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección Múltiple de Departamentos (N:M) */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Departamentos Autorizados (ABAC){" "}
                {requiresDepartment ? (
                  <span className="text-amber-400 font-semibold">* (Mínimo 1)</span>
                ) : (
                  <span className="text-slate-500">(Opcional / Acceso Global)</span>
                )}
              </label>
              {departmentIds.length > 0 && (
                <span className="text-[11px] text-indigo-300">
                  {departmentIds.length} seleccionado(s)
                </span>
              )}
            </div>

            {departments.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-950 border border-slate-800">
                No hay departamentos creados en la organización.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {departments.map((dept) => {
                  const isSelected = departmentIds.includes(dept.id);
                  const isPrimary = departmentIds[0] === dept.id;
                  return (
                    <div
                      key={dept.id}
                      onClick={() => toggleDepartment(dept.id)}
                      className={`cursor-pointer px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-indigo-500/15 border-indigo-500/40 text-slate-100"
                          : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span className="truncate font-medium">{dept.name}</span>
                      </div>

                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAsPrimaryDepartment(dept.id);
                          }}
                          title={isPrimary ? "Departamento principal" : "Marcar como principal"}
                          className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                            isPrimary
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400 hover:text-amber-300"
                          }`}
                        >
                          {isPrimary ? "★ Principal" : "Principal"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Estado del Usuario (Solo al editar) */}
          {isEditing && (
            <div className="sm:col-span-2">
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