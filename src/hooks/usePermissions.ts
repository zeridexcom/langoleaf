import { usePermissionsContext } from "@/providers/PermissionsProvider";
import { PermissionCheck } from "@/types/permissions";

export function usePermissions() {
  return usePermissionsContext();
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
