"use client";

import React from "react";
import { DataTable, ColumnDef, DataTableTab } from "@/shared";
import { TenantUserItem } from "../types/tenant.types";

interface TenantUsersTableProps {
  users: TenantUserItem[];
  currentUserId?: string;
  isLoading?: boolean;
  onEditUser: (user: TenantUserItem) => void;
  onToggleStatus: (user: TenantUserItem) => void;
  onCreateUser: () => void;
  actionLoadingId?: string | null;
}

const getRoleBadge = (roleId?: string) => {
  switch (roleId) {
    case "TENANT_ADMIN":
      return {
        label: "ADMIN TENANT",
        className: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
        dot: "bg-indigo-400",
      };
    case "APPROVER":
      return {
        label: "APROBADOR",
        className: "bg-sky-500/10 border-sky-500/20 text-sky-300",
        dot: "bg-sky-400",
      };
    case "EDITOR":
      return {
        label: "EDITOR",
        className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
        dot: "bg-emerald-400",
      };
    case "VIEWER":
    default:
      return {
        label: "LECTOR",
        className: "bg-slate-800 border-slate-700 text-slate-300",
        dot: "bg-slate-400",
      };
  }
};

export const TenantUsersTable: React.FC<TenantUsersTableProps> = ({
  users,
  currentUserId,
  isLoading = false,
  onEditUser,
  onToggleStatus,
  onCreateUser,
  actionLoadingId,
}) => {
  const tabs: DataTableTab<TenantUserItem>[] = [
    {
      id: "ALL",
      label: "Todos",
      count: users.length,
      filter: () => true,
    },
    {
      id: "ACTIVE",
      label: "Activos",
      count: users.filter((u) => u.status === "ACTIVE").length,
      filter: (u: TenantUserItem) => u.status === "ACTIVE",
    },
    {
      id: "SUSPENDED",
      label: "Suspendidos",
      count: users.filter((u) => u.status === "SUSPENDED").length,
      filter: (u: TenantUserItem) => u.status === "SUSPENDED",
    },
    {
      id: "ADMINS",
      label: "Administradores",
      count: users.filter((u) =>
        (u.roles || []).some((r) => r.id === "TENANT_ADMIN")
      ).length,
      filter: (u: TenantUserItem) =>
        (u.roles || []).some((r) => r.id === "TENANT_ADMIN"),
    },
  ];

  const columns: ColumnDef<TenantUserItem>[] = [
    {
      header: "USUARIO / CORREO",
      render: (user) => {
        const initials = user.full_name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase())
          .join("");

        const isSelf = user.id === currentUserId;

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 border border-indigo-400/30 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initials || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">
                  {user.full_name}
                </span>
                {isSelf && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-medium">
                    Tú
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-slate-400">
                {user.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "ROL OPERATIVO",
      render: (user) => {
        const roleId = user.roles?.[0]?.id;
        const badge = getRoleBadge(roleId);

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        );
      },
    },
    {
      header: "DEPARTAMENTO",
      render: (user) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/80 text-slate-300">
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
              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
            />
          </svg>
          {user.department?.name || "Global (Sin Dept)"}
        </span>
      ),
    },
    {
      header: "ESTADO",
      align: "center",
      render: (user) => {
        const isActive = user.status === "ACTIVE";
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              isActive
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-red-500/10 text-red-300 border-red-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            {isActive ? "Activo" : "Suspendido"}
          </span>
        );
      },
    },
    {
      header: "FECHA REGISTRO",
      render: (user) => {
        const dateStr = user.created_at
          ? new Date(user.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A";
        return <span className="text-xs text-slate-400">{dateStr}</span>;
      },
    },
    {
      header: "ACCIONES",
      align: "right",
      render: (user) => {
        const isSelf = user.id === currentUserId;
        const isLoadingThis = actionLoadingId === user.id;

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEditUser(user)}
              disabled={isLoadingThis}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 hover:border-slate-600 disabled:opacity-50"
            >
              Editar
            </button>
            <button
              onClick={() => onToggleStatus(user)}
              disabled={isSelf || isLoadingThis}
              title={
                isSelf
                  ? "No puedes suspender tu propia cuenta de administrador"
                  : user.status === "ACTIVE"
                  ? "Suspender acceso al usuario"
                  : "Reactivar acceso al usuario"
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border disabled:opacity-40 disabled:cursor-not-allowed ${
                user.status === "ACTIVE"
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/20 hover:border-red-500/30"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20 hover:border-emerald-500/30"
              }`}
            >
              {isLoadingThis
                ? "Procesando..."
                : user.status === "ACTIVE"
                ? "Suspender"
                : "Activar"}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable<TenantUserItem>
      columns={columns}
      data={users}
      keyExtractor={(u) => u.id}
      tabs={tabs}
      searchPlaceholder="Buscar usuarios por nombre, correo o departamento..."
      searchPredicate={(user, q) =>
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        Boolean(user.department?.name.toLowerCase().includes(q)) ||
        Boolean(user.roles?.some((r) => r.id.toLowerCase().includes(q)))
      }
      headerActions={
        <button
          onClick={onCreateUser}
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
          <span>Nuevo Usuario</span>
        </button>
      }
      emptyMessage="No se encontraron usuarios registrados en la organización."
      isLoading={isLoading}
    />
  );
};
