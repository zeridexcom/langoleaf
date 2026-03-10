"use client";

import { useState, useEffect } from "react";
import { FileText, Image, Download, Trash2, ExternalLink, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DocumentType, documentTypeLabels } from "@/lib/cloudinary/client";

export interface Document {
  id: string;
  url: string;
  type: DocumentType;
  typeLabel: string;
  format: string;
  size: number;
  createdAt: string;
  thumbnail?: string;
}

interface DocumentListProps {
  studentId?: string;
  documents?: Document[];
  onRefresh?: () => void;
  onDelete?: (documentId: string) => void;
}

export function DocumentList({ studentId, documents: propDocuments, onRefresh, onDelete }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>(propDocuments || []);
  const [loading, setLoading] = useState(!propDocuments);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propDocuments) {
      setDocuments(propDocuments);
      setLoading(false);
    } else if (studentId) {
      loadDocuments();
    }
  }, [studentId, propDocuments]);

  const loadDocuments = async () => {
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
  };

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (format: string) => {
    if (["jpg", "jpeg", "png"].includes(format.toLowerCase())) {
      return <Image className="w-5 h-5 text-blue-500" />;
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.typeLabel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View"
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
    </div>
  );
}
