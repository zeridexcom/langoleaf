import { useQuery } from "@tanstack/react-query";
import type { FreelancerDashboardStats, AdminDashboardStats } from "@/types/api";
import { usePermissions } from "./usePermissions";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  freelancer: () => [...dashboardKeys.all, "freelancer"] as const,
  admin: () => [...dashboardKeys.all, "admin"] as const,
};

// Fetch freelancer dashboard stats
async function fetchFreelancerDashboard(): Promise<FreelancerDashboardStats> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
  const data = await response.json();
  return data.data || data;
}

// Fetch admin dashboard stats
async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) throw new Error("Failed to fetch admin dashboard stats");
  const data = await response.json();
  return data.data || data;
}

// Hook that automatically selects the right dashboard based on user role
export function useDashboard() {
  const { isAdmin, isLoading: permissionsLoading } = usePermissions();

  const freelancerQuery = useQuery({
    queryKey: dashboardKeys.freelancer(),
    queryFn: fetchFreelancerDashboard,
    enabled: !permissionsLoading && !isAdmin,
  });

  const adminQuery = useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: fetchAdminDashboard,
    enabled: !permissionsLoading && isAdmin,
  });

  return {
    data: isAdmin ? adminQuery.data : freelancerQuery.data,
    isLoading: permissionsLoading || (isAdmin ? adminQuery.isLoading : freelancerQuery.isLoading),
    isError: isAdmin ? adminQuery.isError : freelancerQuery.isError,
    error: isAdmin ? adminQuery.error : freelancerQuery.error,
    refetch: isAdmin ? adminQuery.refetch : freelancerQuery.refetch,
  };
}

// Hook specifically for freelancer dashboard
export function useFreelancerDashboard() {
  return useQuery({
    queryKey: dashboardKeys.freelancer(),
    queryFn: fetchFreelancerDashboard,
  });
}

// Hook specifically for admin dashboard
export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: fetchAdminDashboard,
  });
}
