"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserRole, PermissionCheck, PERMISSIONS } from "@/types/permissions";

interface PermissionsContextType {
  userRole: UserRole | null;
  permissions: PermissionCheck | null;
  isAdmin: boolean;
  isFreelancer: boolean;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  checkPermission: (permission: keyof PermissionCheck) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    // Only set loading if it's the first fetch or we don't have a role
    if (!userRole) {
      setIsLoading(true);
    }
    
    try {
      setError(null);
      const supabase = createClient();
      
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setUserRole(null);
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
      console.error("Unexpected error in PermissionsProvider:", err);
      // Suppress AbortError as it's a known Supabase lock issue that usually self-recovers
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn("Supabase auth lock stolen, retrying will be handled by client.");
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchUserRole();
    
    // Listen for auth changes to refresh permissions
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserRole();
      } else if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const permissions = useMemo(() => (userRole ? PERMISSIONS[userRole] : null), [userRole]);
  const isAdmin = useMemo(() => userRole === "admin", [userRole]);
  const isFreelancer = useMemo(() => userRole === "freelancer", [userRole]);

  const checkPermission = useCallback(
    (permission: keyof PermissionCheck): boolean => {
      if (!permissions) return false;
      return permissions[permission];
    },
    [permissions]
  );

  const value = useMemo(() => ({
    userRole,
    permissions,
    isAdmin,
    isFreelancer,
    isLoading,
    error,
    refreshPermissions: fetchUserRole,
    checkPermission,
  }), [userRole, permissions, isAdmin, isFreelancer, isLoading, error, fetchUserRole, checkPermission]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
