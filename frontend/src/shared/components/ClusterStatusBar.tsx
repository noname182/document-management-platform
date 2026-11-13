"use client";

import React from "react";

export interface ClusterNodeInfo {
  id: string;
  name: string;
  status: "ONLINE" | "OFFLINE";
  detail?: string;
}

export interface ClusterStatusBarProps {
  title: string;
  nodes: ClusterNodeInfo[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ClusterStatusBar: React.FC<ClusterStatusBarProps> = ({
  title,
  nodes,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800/80 px-5 py-3 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      {/* Título de la barra */}
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
        <span className="text-xs font-semibold text-white tracking-tight uppercase">
          {title}
        </span>
      </div>

      {/* Lista horizontal de Nodos en una sola fila */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs">
        {nodes.map((node) => {
          const isOnline = node.status === "ONLINE";
          return (
            <div
              key={node.id}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/70 border border-slate-800/80"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline
                    ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"
                    : "bg-red-500 shadow-sm shadow-red-500/50"
                }`}
              />
              <span className="font-medium text-slate-200">{node.name}</span>
              {node.detail && (
                <span className="text-[10px] font-mono text-slate-400 border-l border-slate-800 pl-2">
                  {node.detail}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón de Refresco Opcional */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-950/80 hover:bg-slate-800 hover:text-white border border-slate-800 transition-all disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${
              isRefreshing ? "animate-spin text-indigo-400" : "text-slate-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <span className="hidden sm:inline">
            {isRefreshing ? "Actualizando..." : "Refrescar"}
          </span>
        </button>
      )}
    </div>
  );
};
