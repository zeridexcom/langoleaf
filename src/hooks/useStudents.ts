import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Types
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  program: string | null;
  university: string | null;
  status: string;
  freelancer_id: string;
  created_at: string;
  updated_at: string;
  applications?: any[];
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  previous_education?: string | null;
  work_experience?: string | null;
  source?: string | null;
  tags?: string[];
  profile_completion?: number;
}

export interface StudentFilters {
  search?: string;
  status?: string[];
  program?: string;
  university?: string;
  source?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentSort {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface PaginatedStudentsResponse {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    programs: string[];
    universities: string[];
    sources: string[];
    tags: string[];
  };
}

// Query keys
export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...studentKeys.lists(), { filters }] as const,
  infinite: () => [...studentKeys.all, "infinite"] as const,
  infiniteList: (filters: Record<string, any>) => [...studentKeys.infinite(), { filters }] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

// Fetch all students
async function fetchStudents(): Promise<Student[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("students")
    .select("*, applications(*)")
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch paginated students
async function fetchPaginatedStudents(
  page: number,
  limit: number,
  filters: StudentFilters,
  sort: StudentSort
): Promise<PaginatedStudentsResponse> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("limit", limit.toString());
  params.set("sortBy", sort.sortBy);
  params.set("sortOrder", sort.sortOrder);
  
  if (filters.search) params.set("search", filters.search);
  if (filters.program) params.set("program", filters.program);
  if (filters.university) params.set("university", filters.university);
  if (filters.source) params.set("source", filters.source);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  
  filters.status?.forEach(s => params.append("status", s));
  filters.tags?.forEach(t => params.append("tags", t));

  const response = await fetch(`/api/students?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch students");
  return response.json();
}

// Fetch single student
async function fetchStudent(id: string): Promise<Student> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*, applications(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// Create student
async function createStudent(student: Omit<Student, "id" | "created_at" | "updated_at">): Promise<Student> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(student)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update student
async function updateStudent({ id, ...updates }: Partial<Student> & { id: string }): Promise<Student> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete student
async function deleteStudent(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Check for duplicate email
async function checkDuplicateEmail(email: string, excludeId?: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("students")
    .select("id")
    .eq("email", email)
    .eq("freelancer_id", user.id);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data?.length || 0) > 0;
}

// Check for duplicate phone
async function checkDuplicatePhone(phone: string, excludeId?: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("students")
    .select("id")
    .eq("phone", phone)
    .eq("freelancer_id", user.id);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data?.length || 0) > 0;
}

// Hooks
export function useStudents() {
  return useQuery({
    queryKey: studentKeys.lists(),
    queryFn: fetchStudents,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => fetchStudent(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useCheckDuplicateEmail() {
  return useMutation({
    mutationFn: ({ email, excludeId }: { email: string; excludeId?: string }) => 
      checkDuplicateEmail(email, excludeId),
  });
}

export function useCheckDuplicatePhone() {
  return useMutation({
    mutationFn: ({ phone, excludeId }: { phone: string; excludeId?: string }) => 
      checkDuplicatePhone(phone, excludeId),
  });
}

// Infinite query hook for paginated students
export function useInfiniteStudents(
  filters: StudentFilters,
  sort: StudentSort,
  limit: number = 20
) {
  return useInfiniteQuery({
    queryKey: studentKeys.infiniteList({ ...filters, ...sort }),
    queryFn: ({ pageParam = 1 }) => 
      fetchPaginatedStudents(pageParam, limit, filters, sort),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// Bulk delete students
async function bulkDeleteStudents(ids: string[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .delete()
    .in("id", ids);

  if (error) throw error;
}

// Bulk update student status
async function bulkUpdateStatus(ids: string[], status: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw error;
}

// Bulk operations hooks
export function useBulkDeleteStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) => 
      bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}
