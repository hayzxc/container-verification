"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: Array<"ADMIN" | "INSPECTOR" | "AUDITOR">;
}

export function RoleGate({ children, allowedRoles }: RoleGateProps) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!allowedRoles.includes(user.role)) {
      // Redirect to their respective home
      if (user.role === "ADMIN") router.push("/admin");
      if (user.role === "INSPECTOR") router.push("/inspector");
      if (user.role === "AUDITOR") router.push("/archive");
    }
  }, [user, allowedRoles, router]);

  if (!user || !allowedRoles.includes(user.role)) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
}
