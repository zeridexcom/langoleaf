"use client";

import { useState } from "react";
import { Trash2, Download, CheckSquare, X, ChevronDown } from "lucide-react";
import { Student } from "@/hooks/useStudents";
import { exportStudents, ExportOptions } from "@/lib/utils/export";

interface BulkActionsProps {
  selectedIds: string[];
  students: Student[];
  onClearSelection: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  className?: string;
}

const statusOptions = [
  { value: "lead", label: "Lead" },
  { value: "application_submitted", label: "Application Submitted" },
  { value: "documents_pending", label: "Documents Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "enrolled", label: "Enrolled" },
  { value: "rejected", label: "Rejected" },
];

export function BulkActions({
  selectedIds,
  students,
  onClearSelection,
  onDelete,
  onStatusChange,
  className = "",
}: BulkActionsProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const selectedStudents = students.filter((s) => selectedIds.includes(s.id));

  const handleExport = (format: "csv" | "xlsx" | "json") => {
    const options: ExportOptions = {
      format,
      filename: `students_export_${selectedIds.length}_items`,
    };
    exportStudents(selectedStudents, options);
    setShowExportDropdown(false);
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className={`bg-primary/5 border border-primary/20 rounded-xl p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected
            </p>
            <p className="text-sm text-gray-500">
              Choose an action to perform on selected items
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportDropdown && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>

          {/* Status Change Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Change Status
              <ChevronDown className="w-4 h-4" />
            </button>

            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => {
                      onStatusChange(status.value);
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
