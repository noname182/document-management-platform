"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/features/auth";

export default function HomeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser();

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (user.roles?.includes("SYSTEM_ADMIN")) {
      router.replace("/admin");
    } else if (user.roles?.includes("TENANT_ADMIN")) {
      router.replace("/tenant");
    } else {
      router.replace("/documents");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400">
      <span className="text-sm font-medium">Redirigiendo a su consola...</span>
    </div>
  );
}