"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, FileText, Loader2, Upload, Download, Eye } from "lucide-react";
import { 
  useDocuments, 
  useStudentDocuments,
  useUploadDocument,
  useDeleteDocument,
  useDocumentDownloadUrl,
} from "@/hooks/useDocuments";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner, SkeletonTable } from "@/components/ui/loading-spinner";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentWithRelations } from "@/types/api";

const documentTypes = [
  { value: "passport", label: "Passport" },
  { value: "transcript", label: "Academic Transcript" },
  { value: "recommendation", label: "Recommendation Letter" },
  { value: "resume", label: "Resume/CV" },
  { value: "ielts", label: "IELTS Score" },
  { value: "toefl", label: "TOEFL Score" },
  { value: "gre", label: "GRE Score" },
  { value: "gmat", label: "GMAT Score" },
  { value: "financial_proof", label: "Financial Proof" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "uploaded", label: "Uploaded" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

function DocumentsContent() {
  const searchParams = useSearchParams();
  
  const studentId = searchParams.get("studentId");
  
  // State
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithRelations | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Queries and Mutations
  const { data: allDocuments, isLoading: isLoadingAll } = useDocuments();
  const { data: studentDocuments, isLoading: isLoadingStudent } = useStudentDocuments(studentId || "");
  
  const documents = studentId ? studentDocuments : allDocuments;
  const isLoading = studentId ? isLoadingStudent : isLoadingAll;
  
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  // Filter documents
  const filteredDocuments = documents?.filter((doc) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const studentName = doc.student?.name || "";
    return (
      studentName.toLowerCase().includes(searchLower) ||
      (doc as any).doc_type?.toLowerCase().includes(searchLower) ||
      doc.file_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Columns for DataTable
  const columns = [
    {
      key: "student",
      header: "Student",
      render: (doc: DocumentWithRelations) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium">
              {doc.student?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{doc.student?.name}</p>
            <p className="text-xs text-gray-500">{doc.student?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "doc_type",
      header: "Document Type",
      render: (doc: DocumentWithRelations) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {documentTypes.find(t => t.value === doc.doc_type)?.label || doc.doc_type}
          </p>
          <p className="text-xs text-gray-500">{doc.file_name}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (doc: DocumentWithRelations) => (
        <StatusBadge status={doc.status} size="sm" />
      ),
    },
    {
      key: "created_at",
      header: "Uploaded",
      render: (doc: DocumentWithRelations) => (
        <span className="text-sm text-gray-500">
          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (doc: DocumentWithRelations) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDocument(doc);
              setShowPreviewDialog(true);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this document?")) {
                deleteDocument.mutate(doc.id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Documents"
        description="Manage student documents and track verification status"
        icon={FileText}
        breadcrumbs={[{ label: "Documents" }]}
        actions={
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search documents..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Start by uploading documents for your students"
          action={{
            label: "Upload Document",
            onClick: () => setShowUploadDialog(true),
          }}
        />
      ) : (
        <DataTable
          data={filteredDocuments}
          columns={columns}
          keyExtractor={(doc) => doc.id}
          selectedIds={selectedIds}
          onSelect={(id, selected) => {
            setSelectedIds((prev) =>
              selected ? [...prev, id] : prev.filter((i) => i !== id)
            );
          }}
          onSelectAll={(selected) => {
            setSelectedIds(selected ? filteredDocuments.map((d) => d.id) : []);
          }}
        />
      )}

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Select a student and document type to upload.
            </p>
            {/* Add form fields here */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowUploadDialog(false)}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Document Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDocument && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Student</p>
                    <p className="font-medium">{selectedDocument.student?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Document Type</p>
                    <p className="font-medium">
                      {documentTypes.find(t => t.value === selectedDocument.doc_type)?.label || selectedDocument.doc_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <StatusBadge status={selectedDocument.status} />
                  </div>
                  <div>
                    <p className="text-gray-500">Uploaded</p>
                    <p className="font-medium">
                      {selectedDocument.created_at ? new Date(selectedDocument.created_at).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-2">File: {selectedDocument.file_name}</p>
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Document preview would appear here</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <DocumentsContent />
    </Suspense>
  );
}
