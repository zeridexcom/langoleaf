"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText, Image, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DocumentType, documentTypeLabels } from "@/lib/cloudinary/client";

interface DocumentUploadProps {
  studentId: string;
  onUploadComplete?: (document: {
    url: string;
    type: DocumentType;
    publicId: string;
  }) => void;
}

const documentTypes: { value: DocumentType; label: string; icon: any }[] = [
  { value: "photo", label: "Photo", icon: Image },
  { value: "marksheet_10th", label: "10th Marksheet", icon: FileText },
  { value: "marksheet_12th", label: "12th Marksheet", icon: FileText },
  { value: "marksheet_graduation", label: "Graduation Marksheet", icon: FileText },
  { value: "id_proof", label: "ID Proof", icon: FileText },
  { value: "address_proof", label: "Address Proof", icon: FileText },
  { value: "resume", label: "Resume/CV", icon: FileText },
  { value: "experience_certificate", label: "Experience Certificate", icon: FileText },
  { value: "other", label: "Other Document", icon: FileText },
];

export function DocumentUpload({ studentId, onUploadComplete }: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>("photo");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await uploadFile(files[0]);
      }
    },
    [selectedType, studentId]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPG, PNG, PDF");
      setIsUploading(false);
      return;
    }

    if (file.size > maxSize) {
      setError("File too large. Max size: 10MB");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentId);
      formData.append("documentType", selectedType);

      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setSuccess(`${documentTypeLabels[selectedType]} uploaded successfully!`);
      
      if (onUploadComplete) {
        onUploadComplete({
          url: result.document.url,
          type: selectedType,
          publicId: result.document.publicId,
        });
      }

      // Sync to Google Sheets after upload
      await syncToSheets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const syncToSheets = async () => {
    try {
      await fetch("/api/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action: "update" }),
      });
    } catch (error) {
      console.error("Failed to sync to sheets:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Document Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Document Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-600 hover:border-primary/50"
        )}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="document-upload"
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          {isUploading ? (
            <div className="space-y-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uploading {documentTypeLabels[selectedType]}...
              </p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                Drop {documentTypeLabels[selectedType]} here or click to upload
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supported: JPG, PNG, PDF (Max 10MB)
              </p>
            </>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
        </div>
      )}
    </div>
  );
}
