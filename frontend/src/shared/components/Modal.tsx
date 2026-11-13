"use client";

import React, { useEffect, useCallback } from "react";

export type ModalMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  subtitle?: string;
  maxWidth?: ModalMaxWidth;
  children: React.ReactNode;
}

const maxWidthMap: Record<ModalMaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  badge,
  subtitle,
  maxWidth = "xl",
  children,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

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

      {/* Tarjeta del Modal */}
      <div
        className={`relative w-full ${maxWidthMap[maxWidth]} rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-white z-10 my-8 transition-all animate-fadeIn`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white tracking-tight">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 shrink-0"
            aria-label="Cerrar modal"
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

        {/* Contenido / Body */}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};
