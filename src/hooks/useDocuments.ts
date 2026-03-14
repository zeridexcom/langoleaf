import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { 
  Document, 
  DocumentWithRelations, 
  DocumentUploadResponse,
  DocumentDownloadResponse
} from "@/types/api";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...documentKeys.lists(), { filters }] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  studentDocs: (studentId: string) => [...documentKeys.all, "student", studentId] as const,
};

// Fetch all documents
async function fetchDocuments(): Promise<DocumentWithRelations[]> {
  const response = await fetch("/api/documents");
  if (!response.ok) throw new Error("Failed to fetch documents");
  const data = await response.json();
  return data.data?.documents || data.documents || [];
}

// Fetch documents by student
async function fetchStudentDocuments(studentId: string): Promise<DocumentWithRelations[]> {
  const response = await fetch(`/api/documents?studentId=${studentId}`);
  if (!response.ok) throw new Error("Failed to fetch student documents");
  const data = await response.json();
  return data.data?.documents || data.documents || [];
}

// Fetch single document
async function fetchDocument(id: string): Promise<DocumentWithRelations> {
  const response = await fetch(`/api/documents/${id}`);
  if (!response.ok) throw new Error("Failed to fetch document");
  return response.json();
}

// Upload document
async function uploadDocument(data: {
  file: File;
  studentId: string;
  docType: string;
  expiryDate?: string;
}): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("studentId", data.studentId);
  formData.append("docType", data.docType);
  if (data.expiryDate) formData.append("expiryDate", data.expiryDate);

  const response = await fetch("/api/documents", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to upload document");
  }

  return response.json();
}

// Update document status
async function updateDocumentStatus(
  id: string,
  status: string
): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update document");
  }

  return response.json();
}

// Delete document
async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Failed to delete document");
}

// Get document download URL
async function getDocumentDownloadUrl(id: string): Promise<DocumentDownloadResponse> {
  const response = await fetch(`/api/documents/${id}/download`);
  if (!response.ok) throw new Error("Failed to get download URL");
  return response.json();
}

// Link document to application
async function linkToApplication(
  documentId: string,
  applicationId: string
): Promise<void> {
  const response = await fetch(`/api/documents/${documentId}/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId }),
  });

  if (!response.ok) throw new Error("Failed to link document");
}

// Hooks
export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.lists(),
    queryFn: fetchDocuments,
  });
}

export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: documentKeys.studentDocs(studentId),
    queryFn: () => fetchStudentDocuments(studentId),
    enabled: !!studentId,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => fetchDocument(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.studentDocs(variables.studentId) 
      });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateDocumentStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.detail(variables.id) 
      });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useDocumentDownloadUrl(id: string) {
  return useQuery({
    queryKey: [...documentKeys.detail(id), "download"],
    queryFn: () => getDocumentDownloadUrl(id),
    enabled: !!id,
  });
}

export function useLinkDocumentToApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, applicationId }: { documentId: string; applicationId: string }) =>
      linkToApplication(documentId, applicationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.detail(variables.documentId) 
      });
    },
  });
}
