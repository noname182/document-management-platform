"use client";

import React from "react";

export type KpiAccentColor = "indigo" | "emerald" | "amber" | "slate";

export interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  badge?: string;
  accentColor?: KpiAccentColor;
  progress?: number;
  className?: string;
}

const colorStyles: Record<
  KpiAccentColor,
  {
    badge: string;
    progressBar: string;
    highlight: string;
  }
> = {
  indigo: {
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    progressBar: "bg-indigo-500",
    highlight: "text-indigo-400",
  },
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    progressBar: "bg-emerald-500",
    highlight: "text-emerald-400",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    progressBar: "bg-amber-500",
    highlight: "text-amber-400",
  },
  slate: {
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    progressBar: "bg-slate-500",
    highlight: "text-slate-300",
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  sublabel,
  badge,
  accentColor = "indigo",
  progress,
  className = "",
}) => {
  const styles = colorStyles[accentColor];

  return (
    <div
      className={`p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-col justify-between transition-all hover:border-slate-700 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-slate-400 truncate">{label}</p>
          {badge && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.badge}`}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">
            {value}
          </span>
        </div>

        {sublabel && (
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            {sublabel}
          </p>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-4 pt-2">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${styles.progressBar}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
