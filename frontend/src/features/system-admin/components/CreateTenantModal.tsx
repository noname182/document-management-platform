"use client";

import React, { useState } from "react";
import { CreateTenantPayload } from "../types/system.types";

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTenantPayload) => Promise<void>;
  isLoading?: boolean;
}

const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve tildes
    .replace(/[^a-z0-9 -]/g, "") // Remueve caracteres especiales
    .replace(/\s+/g, "-") // Reemplaza cada espacio con guion en tiempo real
    .replace(/-+/g, "-"); // Colapsa múltiples guiones
};

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    const upperName = val.toUpperCase();
    setName(upperName);
    setSlug(slugify(upperName));
    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(slugify(val));
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "El nombre de la organización es obligatorio.";
    }

    if (!slug.trim()) {
      newErrors.slug = "El slug identificador es obligatorio.";
    } else if (!/^[a-z0-9_-]+$/.test(slug)) {
      newErrors.slug = "El slug solo puede contener letras, números y guiones.";
    }

    if (!adminName.trim()) {
      newErrors.adminName = "El nombre del administrador es obligatorio.";
    }

    if (!adminEmail.trim()) {
      newErrors.adminEmail = "El correo del administrador es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      newErrors.adminEmail = "Ingrese un correo electrónico válido.";
    }

    if (!adminPassword) {
      newErrors.adminPassword = "La contraseña es obligatoria.";
    } else if (adminPassword.length < 8) {
      newErrors.adminPassword = "La contraseña debe tener al menos 8 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate() || isLoading) return;

    try {
      await onSubmit({
        name: name.trim().replace(/\s+/g, " ").toUpperCase(),
        slug: slug.trim().toLowerCase().replace(/^-+|-+$/g, ""),
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
      });

      // Limpiar formulario y cerrar
      setName("");
      setSlug("");
      setIsSlugManuallyEdited(false);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setErrors({});
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Error al aprovisionar la organización.");
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop con desenfoque */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-white z-10 my-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Aprovisionar Nueva Organización</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Atómico
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Crea el Tenant aislado y su primer usuario con rol TENANT_ADMIN.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Mensaje de Error del Servidor */}
        {serverError && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2.5">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 7.5h.01"
              />
            </svg>
            <div className="flex-1">{serverError}</div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre de la Organización */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300">
                Nombre de la Organización
              </label>
              <input
                type="text"
                disabled={isLoading}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="EJ. CORPORACIÓN FINANCIERA GLOBAL"
                className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 text-sm uppercase text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 ${
                  errors.name
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Slug Identificador */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Slug Identificador Único
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Auto-generado
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-mono text-slate-500 select-none">
                  tenant/
                </span>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={slug}
                  placeholder="corporacion-financiera-global"
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-800/80 pl-20 pr-3.5 py-2.5 text-sm font-mono text-indigo-300/90 placeholder:text-slate-600 cursor-not-allowed select-none focus:outline-hidden"
                />
              </div>
              {errors.slug && (
                <p className="text-xs text-red-400">{errors.slug}</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
              Administrador Inicial (TENANT_ADMIN)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre del Admin */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  disabled={isLoading}
                  value={adminName}
                  onChange={(e) => {
                    setAdminName(e.target.value);
                    if (errors.adminName)
                      setErrors((prev) => ({ ...prev, adminName: "" }));
                  }}
                  placeholder="Ej. Ana Morales"
                  className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 ${
                    errors.adminName
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />
                {errors.adminName && (
                  <p className="text-xs text-red-400">{errors.adminName}</p>
                )}
              </div>

              {/* Correo del Admin */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  disabled={isLoading}
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (errors.adminEmail)
                      setErrors((prev) => ({ ...prev, adminEmail: "" }));
                  }}
                  placeholder="admin@organizacion.com"
                  className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 ${
                    errors.adminEmail
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />
                {errors.adminEmail && (
                  <p className="text-xs text-red-400">{errors.adminEmail}</p>
                )}
              </div>

              {/* Contraseña Inicial */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Contraseña Temporal
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (errors.adminPassword)
                        setErrors((prev) => ({ ...prev, adminPassword: "" }));
                    }}
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 ${
                      errors.adminPassword
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.adminPassword && (
                  <p className="text-xs text-red-400">{errors.adminPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Aprovisionando...</span>
                </>
              ) : (
                <span>Crear Organización</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
