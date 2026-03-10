"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DocumentUpload, DocumentList } from "@/components/documents";
import type { Document } from "@/components/documents/document-list";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          const { data, error } = await supabase
            .from("documents")
            .select("*")
            .eq("freelancer_id", profile.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          setDocuments(data || []);
        }
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadDocuments();
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    alert(error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage student documents and uploads</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          {showUpload ? "Cancel" : "Upload Document"}
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload New Documents</h2>
          <DocumentUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            category="general"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All Categories</option>
          <option value="academic">Academic</option>
          <option value="id-proof">ID Proof</option>
          <option value="resume">Resume</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DocumentList
          documents={filteredDocuments}
          onRefresh={loadDocuments}
        />
      )}
    </div>
  );
}
