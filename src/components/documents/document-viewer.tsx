"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Download, FileText, Image as ImageIcon, File, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DocumentViewerProps {
  documentId: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
}

export function DocumentViewer({ documentId, fileName, fileType, onClose }: DocumentViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignedUrl = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      const data = await response.json();
      setSignedUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchSignedUrl();
  }, [fetchSignedUrl]);

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  const isImage = fileType.startsWith("image/");
  const isPDF = fileType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-blue-500" />
            ) : isPDF ? (
              <FileText className="w-5 h-5 text-red-500" />
            ) : (
              <File className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
              {fileName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!signedUrl}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 text-center px-4">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">{error}</p>
              <button
                onClick={fetchSignedUrl}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {isImage && signedUrl ? (
                <img
                  src={signedUrl}
                  alt={fileName}
                  className="max-w-full h-auto mx-auto"
                />
              ) : isPDF && signedUrl ? (
                <iframe
                  src={signedUrl}
                  className="w-full h-[70vh]"
                  title={fileName}
                />
              ) : signedUrl ? (
                <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                  <File className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    This file type cannot be previewed
                  </p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
