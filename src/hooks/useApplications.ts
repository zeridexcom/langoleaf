import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { 
  Application, 
  ApplicationWithRelations, 
  ApplicationFilters, 
  ApplicationSort,
  PaginatedApplicationsResponse 
} from "@/types/api";

// Query keys
export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...applicationKeys.lists(), { filters }] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  stats: () => [...applicationKeys.all, "stats"] as const,
};

// Fetch all applications
async function fetchApplications(): Promise<ApplicationWithRelations[]> {
  const response = await fetch("/api/applications");
  if (!response.ok) throw new Error("Failed to fetch applications");
  const data = await response.json();
  return data.data?.applications || data.applications || [];
}

// Fetch paginated applications
async function fetchPaginatedApplications(
  page: number,
  limit: number,
  filters: ApplicationFilters,
  sort: ApplicationSort
): Promise<PaginatedApplicationsResponse> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("limit", limit.toString());
  params.set("sortBy", sort.sortBy);
  params.set("sortOrder", sort.sortOrder);
  
  if (filters.search) params.set("search", filters.search);
  if (filters.universityId) params.set("universityId", filters.universityId);
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.studentId) params.set("studentId", filters.studentId);
  
  filters.status?.forEach(s => params.append("status", s));

  const response = await fetch(`/api/applications?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch applications");
  return response.json();
}

// Fetch single application
async function fetchApplication(id: string): Promise<ApplicationWithRelations> {
  const response = await fetch(`/api/applications/${id}`);
  if (!response.ok) throw new Error("Failed to fetch application");
  return response.json();
}

// Create application
async function createApplication(data: {
  studentId: string;
  universityId: string;
  programId: string;
  intakeDate?: string;
}): Promise<Application> {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create application");
  }
  
  return response.json();
}

// Update application status
async function updateApplicationStatus(
  id: string,
  status: string,
  reason?: string
): Promise<Application> {
  const response = await fetch(`/api/applications/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reason }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update status");
  }
  
  return response.json();
}

// Delete application
async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`/api/applications/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) throw new Error("Failed to delete application");
}

// Fetch application stats
async function fetchApplicationStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  conversionRate: number;
}> {
  const response = await fetch("/api/applications/stats");
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

// Hooks
export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.lists(),
    queryFn: fetchApplications,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => fetchApplication(id),
    enabled: !!id,
  });
}

export function usePaginatedApplications(
  page: number,
  limit: number,
  filters: ApplicationFilters,
  sort: ApplicationSort
) {
  return useQuery({
    queryKey: applicationKeys.list({ page, limit, ...filters, ...sort }),
    queryFn: () => fetchPaginatedApplications(page, limit, filters, sort),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updateApplicationStatus(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() });
    },
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: applicationKeys.stats(),
    queryFn: fetchApplicationStats,
  });
}
