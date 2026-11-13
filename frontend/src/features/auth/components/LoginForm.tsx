"use client";

import React, { useState } from "react";
import {
  FormValidationErrors,
  LoginFormProps,
} from "../types/auth.types";

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  errorMessage = null,
  initialValues,
  forgotPasswordHref = "#",
  registerHref,
}) => {
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [password, setPassword] = useState(initialValues?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [rememberMe, setRememberMe] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormValidationErrors = {};

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es requerido.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Ingrese un correo electrónico válido.";
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    await onSubmit({
      email: email.trim(),
      password,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-5">
      {/* Banner de error general del servidor */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 transition-all"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 7.5h.01"
            />
          </svg>
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Campo: Correo Electrónico */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Correo Electrónico
        </label>
        <div className="relative rounded-xl shadow-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="nombre@empresa.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pl-11 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
              errors.email
                ? "border-red-400 focus:border-red-500 focus:ring-red-400/20 dark:border-red-700"
                : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20 dark:border-slate-700 dark:focus:border-indigo-500"
            }`}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Campo: Contraseña */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Contraseña
          </label>
          {forgotPasswordHref && (
            <a
              href={forgotPasswordHref}
              tabIndex={-1}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ¿Olvidó su contraseña?
            </a>
          )}
        </div>
        <div className="relative rounded-xl shadow-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={isLoading}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pl-11 pr-11 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
              errors.password
                ? "border-red-400 focus:border-red-500 focus:ring-red-400/20 dark:border-red-700"
                : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20 dark:border-slate-700 dark:focus:border-indigo-500"
            }`}
          />
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden"
          >
            {showPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600 dark:text-red-400">
            {errors.password}
          </p>
        )}
      </div>

      {/* Recordarme */}
      <div className="flex items-center">
        <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            disabled={isLoading}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600/30 dark:border-slate-700 dark:bg-slate-900"
          />
          <span>Recordar mis datos en este equipo</span>
        </label>
      </div>

      {/* Botón de Enviar con Spinner */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin text-white"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            <span>Iniciando sesión...</span>
          </>
        ) : (
          <span>Iniciar Sesión</span>
        )}
      </button>

      {/* Link de registro opcional */}
      {registerHref && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
          Acceso exclusivo para personal autorizado. Solicita tus credenciales al administrador de tu organización.{" "}
          <a
            href={registerHref}
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Contactar al Administrador
          </a>
        </p>
      )}
    </form>
  );
};
