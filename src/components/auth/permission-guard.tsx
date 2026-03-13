"use client";

import { ReactNode } from "react";
import { usePermissions, usePermissionCheck } from "@/hooks/usePermissions";
import { PermissionCheck } from "@/types/permissions";
import { Shield, Loader2 } from "lucide-react";

interface PermissionGuardProps {
  permission: keyof PermissionCheck;
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
  loadingComponent,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissionCheck(permission);

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUnauthorizedMessage?: boolean;
}

export function AdminGuard({
  children,
  fallback = null,
  showUnauthorizedMessage = false,
}: AdminGuardProps) {
  const { isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    if (showUnauthorizedMessage) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Shield className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Admin Access Required
          </h3>
          <p className="text-gray-500 max-w-sm">
            You don&apos;t have permission to access this feature. Please contact
            your administrator if you believe this is an error.
          </p>
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  allowedRoles: ("admin" | "freelancer")[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { userRole, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return fallback;
  }

  return <>{children}</>;
}

// HOC version for wrapping components
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: keyof PermissionCheck,
  fallback?: ReactNode
) {
  return function WithPermissionWrapper(props: P) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}

export function withAdminAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithAdminAccessWrapper(props: P) {
    return (
      <AdminGuard fallback={fallback}>
        <WrappedComponent {...props} />
      </AdminGuard>
    );
  };
}
