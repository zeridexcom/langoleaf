import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
}

// Query keys
export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...studentKeys.lists(), { filters }] as const,
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
