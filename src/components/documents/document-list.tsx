"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  ExternalLink, 
  FolderOpen,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DocumentType, documentTypeLabels } from "@/lib/cloudinary/client";
import { DocumentViewer } from "./document-viewer";

export interface Document {
  id: string;
  url: string;
  type: DocumentType | string;
  typeLabel: string;
  format: string;
  size: number;
  createdAt: string;
  thumbnail?: string;
  status?: "pending" | "verified" | "rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  expiryDate?: string | null;
  isExpiringSoon?: boolean;
}

interface DocumentListProps {
  studentId?: string;
  documents?: Document[];
  onRefresh?: () => void;
  onDelete?: (documentId: string) => void;
  refreshKey?: number;
  onView?: (document: Document) => void;
  showVerification?: boolean;
}

export function DocumentList({ 
  studentId, 
  documents: propDocuments, 
  onRefresh, 
  onDelete, 
  refreshKey,
  onView,
  showVerification = true
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>(propDocuments || []);
  const [loading, setLoading] = useState(!propDocuments);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/documents?studentId=${studentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load documents");
      }

      setDocuments(result.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (propDocuments) {
      setDocuments(propDocuments);
      setLoading(false);
    } else if (studentId) {
      loadDocuments();
    }
  }, [studentId, propDocuments, refreshKey, loadDocuments]);

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments(documents.filter((doc) => doc.id !== documentId));
      
      if (onDelete) {
        onDelete(documentId);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

function VerificationBadge({ status }: { status: string }) {
  const configs = {
    verified: {
      icon: CheckCircle2,
      className: "bg-emerald-100 text-emerald-700",
      label: "Verified"
    },
    pending: {
      icon: Clock,
      className: "bg-amber-100 text-amber-700",
      label: "Pending"
    },
    rejected: {
      icon: XCircle,
      className: "bg-red-100 text-red-700",
      label: "Rejected"
    }
  };

  const config = configs[status as keyof typeof configs] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (format: string) => {
    if (["jpg", "jpeg", "png"].includes(format.toLowerCase())) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-red-500" />;
  };

  const groupDocumentsByType = () => {
    const grouped: Record<string, Document[]> = {};
    documents.forEach((doc) => {
      if (!grouped[doc.type]) {
        grouped[doc.type] = [];
      }
      grouped[doc.type].push(doc);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button
          onClick={loadDocuments}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
        <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Upload documents using the form above
        </p>
      </div>
    );
  }

  const groupedDocs = groupDocumentsByType();

  return (
    <div className="space-y-6">
      {Object.entries(groupedDocs).map(([type, docs]) => (
        <div key={type}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {documentTypeLabels[type as DocumentType] || type}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary/50 transition-colors"
              >
                {/* Thumbnail or Icon */}
                {doc.thumbnail && ["jpg", "jpeg", "png"].includes(doc.format.toLowerCase()) ? (
                  <img
                    src={doc.thumbnail}
                    alt={doc.typeLabel}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    {getFileIcon(doc.format)}
                  </div>
                )}

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {doc.typeLabel}
                    </p>
                    {showVerification && doc.status && (
                      <VerificationBadge status={doc.status} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    {doc.isExpiringSoon && (
                      <>
                        <span>•</span>
                        <span className="text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Expiring soon
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onView ? onView(doc) : setViewingDocument(doc)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={doc.url}
                    download
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer
          documentId={viewingDocument.id}
          fileName={viewingDocument.typeLabel}
          fileType={viewingDocument.format === "pdf" ? "application/pdf" : `image/${viewingDocument.format}`}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}
