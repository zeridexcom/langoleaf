"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RequiredDocument {
  type: string;
  label: string;
  isUploaded: boolean;
  isVerified?: boolean;
  expiryDate?: string | null;
  isExpiringSoon?: boolean;
}

interface RequiredDocumentsChecklistProps {
  documents: RequiredDocument[];
  onUploadClick: (type: string) => void;
}

export function RequiredDocumentsChecklist({ 
  documents, 
  onUploadClick 
}: RequiredDocumentsChecklistProps) {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const uploadedCount = documents.filter(d => d.isUploaded).length;
  const verifiedCount = documents.filter(d => d.isUploaded && d.isVerified).length;
  const expiringCount = documents.filter(d => d.isExpiringSoon).length;
  const totalCount = documents.length;

  const displayedDocuments = showAll ? documents : documents.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Required Documents
          </h3>
          <span className={cn(
            "px-2 py-0.5 text-xs rounded-full",
            uploadedCount === totalCount 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-amber-100 text-amber-700"
          )}>
            {uploadedCount}/{totalCount}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          !expanded && "-rotate-90"
        )} />
      </button>

      {expiringCount > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {expiringCount} document{expiringCount > 1 ? 's' : ''} expiring soon
            </span>
          </div>
        </div>
      )}

      {expanded && (
        <>
          <div className="space-y-2">
            {displayedDocuments.map((doc) => (
              <DocumentItem 
                key={doc.type} 
                document={doc} 
                onUploadClick={() => onUploadClick(doc.type)}
              />
            ))}
          </div>

          {documents.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1"
            >
              {showAll ? (
                <>Show less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show {documents.length - 5} more <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function DocumentItem({ 
  document, 
  onUploadClick 
}: { 
  document: RequiredDocument; 
  onUploadClick: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl transition-colors",
      document.isUploaded 
        ? "bg-gray-50" 
        : "bg-amber-50/50 border border-amber-200/50"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        document.isUploaded
          ? document.isVerified
            ? "bg-emerald-100 text-emerald-600"
            : "bg-blue-100 text-blue-600"
          : "bg-amber-100 text-amber-600"
      )}>
        {document.isUploaded ? (
          document.isVerified ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          document.isUploaded ? "text-gray-900" : "text-amber-800"
        )}>
          {document.label}
        </p>
        <div className="flex items-center gap-2 text-xs">
          {document.isUploaded ? (
            <>
              <span className={cn(
                document.isVerified ? "text-emerald-600" : "text-blue-600"
              )}>
                {document.isVerified ? "Verified" : "Pending verification"}
              </span>
              {document.expiryDate && (
                <span className={cn(
                  document.isExpiringSoon ? "text-red-600 font-medium" : "text-gray-500"
                )}>
                  • Expires {document.isExpiringSoon ? "soon" : document.expiryDate}
                </span>
              )}
            </>
          ) : (
            <span className="text-amber-600">Required</span>
          )}
        </div>
      </div>

      {!document.isUploaded && (
        <button
          onClick={onUploadClick}
          className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
        >
          Upload
        </button>
      )}
    </div>
  );
}
