// frontend/src/shared/components/AdminLayout.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService, tokenStorage } from "@/features/auth";
import { AuthUser } from "@/features/auth/types/auth.types";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredPermission?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: AuthUser | null;
  brandName?: string;
  brandAccent?: string;
  consoleSubtitle?: string;
  sectionTitle?: string;
  pageTitle?: string;
  navItems?: NavItem[];
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: "Infraestructura & Tenants",
    href: "/admin",
    requiredPermission: "tenant:manage",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    label: "Bóveda Documental",
    href: "/documents",
    requiredPermission: "doc:read",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
        />
      </svg>
    ),
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  user: initialUser,
  brandName = "Doc",
  brandAccent = "Platform",
  consoleSubtitle,
  sectionTitle = "Panel de Control",
  pageTitle = "Vista General",
  navItems = DEFAULT_NAV_ITEMS,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser] = useState<AuthUser | null>(
    initialUser || tokenStorage.getUser()
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const primaryRole = String(currentUser?.roles?.[0] ?? "USER");
  const tenantLabel =
    consoleSubtitle ||
    (currentUser?.tenant?.slug
      ? currentUser.tenant.slug.replace(/-/g, " ")
      : "Platform Console");

  const initials = (currentUser?.full_name || "US")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.requiredPermission ||
      currentUser?.permissions?.includes(item.requiredPermission)
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // Limpieza local garantizada en authService
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-indigo-500/30">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 flex-col justify-between border-r border-slate-800/80 bg-slate-950/80 p-6 backdrop-blur-xl shrink-0">
        <div>
          <div className="flex items-center gap-3 px-2 pb-6 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/10">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-white block truncate">
                {brandName}
                <span className="text-indigo-400">{brandAccent}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block truncate">
                {tenantLabel}
              </span>
            </div>
          </div>

          <nav className="mt-6 space-y-1.5">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    isActive
                      ? "font-semibold text-white bg-indigo-600/20 border border-indigo-500/30 shadow-xs"
                      : "font-medium text-slate-400 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <span className={isActive ? "text-indigo-400" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Usuario & Logout */}
        <div className="pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.full_name || "Usuario"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser?.email || ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
          </button>
        </div>
      </aside>

      {/* Header Mobile + Drawer */}
      <header className="lg:hidden border-b border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
            <div>
              <span className="font-bold text-white text-sm block">
                {brandName}
                <span className="text-indigo-400">{brandAccent}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                {primaryRole}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="px-4 pb-4 space-y-2 border-t border-slate-800/80 pt-3">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">{sectionTitle}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-indigo-400">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Plataforma Online</span>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {primaryRole}
            </span>
          </div>
        </div>

        <main className="flex-1 p-6 sm:p-8 xl:p-10 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
};