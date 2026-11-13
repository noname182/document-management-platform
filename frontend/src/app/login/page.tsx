"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService, AuthError } from "@/features/auth";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoginCredentials } from "@/features/auth/types/auth.types";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(credentials);
      const user = response.user;
      const isSystemAdmin =
        user.roles.includes("SYSTEM_ADMIN") ||
        user.permissions.includes("tenant:manage") ||
        user.permissions.includes("system:metrics");

      if (isSystemAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      if (error instanceof AuthError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Ocurrió un error inesperado al intentar iniciar sesión."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-950">
      {/* Panel Izquierdo: Fotografía de Data Center & Tipografía Editorial */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white overflow-hidden">
        {/* Fotografía de Fondo (Data Center de Alta Tecnología) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=85')`,
          }}
        />

        {/* Capas de Degradado Oscuro & Gradientes para asegurar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
        <div className="absolute inset-0 bg-indigo-950/25 mix-blend-multiply" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />

        {/* Header Superior: Identidad Corporativa */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/10">
              <svg
                className="w-5 h-5 text-white"
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
            <span className="text-xl font-bold tracking-tight text-white">
              Doc<span className="text-indigo-400">Platform</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Infraestructura Segura v2.4</span>
          </div>
        </div>

        {/* Bloque Central: Tipografía Editorial y Métricas de Alto Nivel */}
        <div className="relative z-10 my-auto py-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold tracking-wider uppercase mb-6">
            GESTIÓN DOCUMENTAL SEGURA
          </div>

          <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Control documental con integridad verificable.
          </h2>

          <p className="mt-6 text-base text-slate-300 leading-relaxed">
            Versionado seguro, bloqueo de edición concurrente y auditoría por organización.
          </p>          
        </div>

        {/* Footer Inferior: Cumplimiento y Garantías */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <div className="flex items-center gap-4">
            <span>ISO/IEC 27001 Ready</span>
            <span className="text-slate-600">•</span>
            <span>AES-256 Encryption</span>
            <span className="text-slate-600">•</span>
            <span>Multi-Tenant Vault</span>
          </div>
          <span>© 2026 Core Infrastructure</span>
        </div>
      </div>

      {/* Panel Derecho: Formulario de Login Limpio y Enfocado */}
      <div className="relative flex flex-col justify-center items-center px-6 py-12 sm:px-12 xl:px-20 bg-slate-950 overflow-hidden">
        {/* Glow sutil en el fondo del formulario */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-8 bg-slate-900/90 p-8 sm:p-10 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          {/* Header Mobile de Marca */}
          <div className="lg:hidden flex items-center gap-2.5 pb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              DP
            </div>
            <span className="font-bold text-white">
              DocPlatform
            </span>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-slate-400">
              Ingresa tus credenciales corporativas para acceder a tu consola.
            </p>
          </div>

          {/* Componente LoginForm */}
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            errorMessage={errorMessage}
            forgotPasswordHref="#"
            registerHref="#"
          />
        </div>
      </div>
    </div>
  );
}
