"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserRole,
  UserPermissions,
  PermissionCheck,
  PERMISSIONS,
} from "@/types/permissions";

interface UsePermissionsReturn {
  permissions: PermissionCheck | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  isFreelancer: boolean;
  isLoading: boolean;
  error: string | null;
  checkPermission: (permission: keyof PermissionCheck) => boolean;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user role:", profileError);
        setError("Failed to fetch user permissions");
        setUserRole(null);
      } else {
        setUserRole((profile?.role as UserRole) || "freelancer");
      }
    } catch (err) {
      console.error("Unexpected error in usePermissions:", err);
      setError("Unexpected error occurred");
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const permissions = userRole ? PERMISSIONS[userRole] : null;
  const isAdmin = userRole === "admin";
  const isFreelancer = userRole === "freelancer";

  const checkPermission = useCallback(
    (permission: keyof PermissionCheck): boolean => {
      if (!permissions) return false;
      return permissions[permission];
    },
    [permissions]
  );

  return {
    permissions,
    userRole,
    isAdmin,
    isFreelancer,
    isLoading,
    error,
    checkPermission,
    refreshPermissions: fetchUserRole,
  };
}

// Hook specifically for checking if user can access admin features
export function useAdminAccess() {
  const { isAdmin, isLoading, error } = usePermissions();
  return { isAdmin, isLoading, error };
}

// Hook for checking specific permission
export function usePermissionCheck(permission: keyof PermissionCheck) {
  const { checkPermission, isLoading, error } = usePermissions();
  const hasPermission = checkPermission(permission);
  return { hasPermission, isLoading, error };
}
