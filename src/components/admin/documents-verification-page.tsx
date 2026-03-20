"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import {
  Upload,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  FileText,
  Image,
  File,
  Loader2,
  ExternalLink,
  User,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Document {
  id: string;
  student_id: string;
  student_name: string | null;
  freelancer_id: string;
  freelancer_name: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  created_at: string;
}

export function DocumentsVerificationPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const supabase = createClient();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.rpc("get_pending_documents", {
        p_limit: 100,
      });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("documents-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (docId: string) => {
    setProcessing(docId);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ status: "approved" })
        .eq("id", docId);

      if (error) throw error;
      toast.success("Document approved");
      fetchDocuments();
    } catch (error) {
      console.error("Error approving document:", error);
      toast.error("Failed to approve document");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(selectedDoc.id);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ status: "rejected" })
        .eq("id", selectedDoc.id);

      if (error) throw error;

      // Notify freelancer
      await supabase.from("notifications").insert({
        freelancer_id: selectedDoc.freelancer_id,
        type: "document_rejected",
        title: "Document Rejected",
        message: `Your document "${selectedDoc.file_name}" was rejected. Reason: ${rejectReason}`,
        data: {
          document_id: selectedDoc.id,
          reason: rejectReason,
        },
      });

      toast.success("Document rejected");
      setShowRejectModal(false);
      setSelectedDoc(null);
      setRejectReason("");
      fetchDocuments();
    } catch (error) {
      console.error("Error rejecting document:", error);
      toast.error("Failed to reject document");
    } finally {
      setProcessing(null);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
      return Image;
    if (ext === "pdf") return FileText;
    return File;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Verification
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Review and verify uploaded documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full">
              {documents.filter((d) => d.status === "pending").length} Pending
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-900 dark:text-white">
              No documents found
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {statusFilter === "pending"
                ? "No documents pending verification"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.file_name || "");
              return (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
                >
                  {/* File Preview */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
                    {doc.file_url ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center hover:bg-black/10 transition-colors"
                      >
                        <FileIcon className="w-12 h-12 text-gray-400" />
                        <div className="absolute bottom-2 right-2 p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg">
                          <ExternalLink className="w-4 h-4 text-gray-600" />
                        </div>
                      </a>
                    ) : (
                      <FileIcon className="w-12 h-12 text-gray-300" />
                    )}
                    <span
                      className={cn(
                        "absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full",
                        doc.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : doc.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {doc.file_name || "Unnamed Document"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {doc.document_type || "Unknown type"}
                    </p>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{doc.student_name || "Unknown Student"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3.5 h-3.5" />
                        <span>{doc.freelancer_name || "Unknown Freelancer"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {doc.status === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleApprove(doc.id)}
                          disabled={processing === doc.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {processing === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowRejectModal(true);
                          }}
                          disabled={processing === doc.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Reject Document
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Please provide a reason for rejecting this document.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Document is blurry, wrong document type..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedDoc(null);
                    setRejectReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing === selectedDoc.id || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {processing === selectedDoc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
