"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

interface RoleRedirectProps {
  requiredRole: "admin" | "freelancer";
  redirectTo?: string;
  children: React.ReactNode;
}

export function RoleRedirect({
  requiredRole,
  redirectTo = "/dashboard",
  children,
}: RoleRedirectProps) {
  const router = useRouter();
  const { userRole, isLoading } = usePermissions();

  useEffect(() => {
    if (!isLoading && userRole && userRole !== requiredRole) {
      router.push(redirectTo);
    }
  }, [userRole, isLoading, router, requiredRole, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-500 font-medium">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (userRole !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-500 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Specific component for admin-only pages
export function AdminRedirect({
  children,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <RoleRedirect requiredRole="admin" redirectTo={redirectTo}>
      {children}
    </RoleRedirect>
  );
}
