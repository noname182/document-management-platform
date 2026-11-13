"use client";

import React, { useState, useMemo } from "react";

export interface ColumnDef<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableTab<T> {
  id: string;
  label: string;
  count?: number;
  filter: (item: T) => boolean;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchPredicate?: (item: T, query: string) => boolean;
  tabs?: DataTableTab<T>[];
  headerActions?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = "Buscar...",
  searchPredicate,
  tabs,
  headerActions,
  emptyMessage = "No se encontraron registros",
  isLoading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabId, setActiveTabId] = useState<string>(
    tabs && tabs.length > 0 ? tabs[0].id : "ALL"
  );

  const filteredData = useMemo(() => {
    let result = data;

    // 1. Filtro por pestaña
    if (tabs && tabs.length > 0 && activeTabId !== "ALL") {
      const currentTab = tabs.find((t) => t.id === activeTabId);
      if (currentTab) {
        result = result.filter(currentTab.filter);
      }
    }

    // 2. Filtro por término de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (searchPredicate) {
        result = result.filter((item) => searchPredicate(item, q));
      } else {
        result = result.filter((item) => {
          return Object.values(item as Record<string, unknown>).some((val) =>
            String(val).toLowerCase().includes(q)
          );
        });
      }
    }

    return result;
  }, [data, tabs, activeTabId, searchQuery, searchPredicate]);

  return (
    <div className="space-y-4">
      {/* Barra de Controles: Búsqueda, Pestañas y Acciones */}
      {(searchPredicate || tabs || headerActions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Buscador */}
            {searchPredicate && (
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
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
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {/* Selector de Pestañas / Tabs */}
            {tabs && tabs.length > 0 && (
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
                {tabs.map((tab) => {
                  const isActive = activeTabId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTabId(tab.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-slate-800 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="ml-1.5 opacity-75 font-mono text-[11px]">
                          ({tab.count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones de Encabezado (ej. botones primarios) */}
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      )}

      {/* Contenedor de la Tabla */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800/80">
              <tr>
                {columns.map((col, idx) => {
                  const alignClass =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left";
                  return (
                    <th
                      key={idx}
                      scope="col"
                      className={`px-5 py-3.5 ${alignClass} ${col.className || ""}`}
                    >
                      {col.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    <div className="inline-flex items-center gap-2 text-xs">
                      <svg
                        className="w-4 h-4 animate-spin text-indigo-400"
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
                      <span>Cargando registros...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    <p className="text-sm font-medium text-slate-300">
                      {emptyMessage}
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-slate-500 mt-1">
                        No hay coincidencias para &quot;{searchQuery}&quot;.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {columns.map((col, idx) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";
                      return (
                        <td
                          key={idx}
                          className={`px-5 py-4 ${alignClass} ${col.className || ""}`}
                        >
                          {col.render
                            ? col.render(item)
                            : col.accessor
                            ? String(item[col.accessor] ?? "")
                            : null}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
