"use client";

import { useState } from "react";
import { X, Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { Student } from "@/hooks/useStudents";
import { exportStudents, ExportOptions, getExportFields } from "@/lib/utils/export";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedIds?: string[];
}

type ExportFormat = "csv" | "xlsx" | "json";

export function ExportDialog({ isOpen, onClose, students, selectedIds }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "name",
    "email",
    "phone",
    "program",
    "university",
    "status",
    "created_at",
  ]);
  const [includeApplications, setIncludeApplications] = useState(false);

  if (!isOpen) return null;

  const allFields = getExportFields();
  const studentsToExport = selectedIds && selectedIds.length > 0
    ? students.filter((s) => selectedIds.includes(s.id))
    : students;

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      filename: `students_export_${studentsToExport.length}_items_${new Date().toISOString().split("T")[0]}`,
      fields: selectedFields,
      includeApplications,
    };
    exportStudents(studentsToExport, options);
    onClose();
  };

  const formatOptions: { value: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
    { value: "xlsx", label: "Excel", icon: FileSpreadsheet, description: "Best for spreadsheet applications" },
    { value: "csv", label: "CSV", icon: FileText, description: "Universal format, works everywhere" },
    { value: "json", label: "JSON", icon: FileJson, description: "For developers and integrations" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Students</h2>
            <p className="text-sm text-gray-500">
              {studentsToExport.length} student{studentsToExport.length !== 1 ? "s" : ""} will be exported
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {formatOptions.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${
                    format === value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`w-8 h-8 ${format === value ? "text-primary" : "text-gray-400"}`} />
                  <div className="text-center">
                    <p className={`font-medium ${format === value ? "text-primary" : "text-gray-900"}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Fields to Include
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFields(allFields.map((f) => f.value))}
                  className="text-xs text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSelectedFields([])}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {allFields.map((field) => (
                <label
                  key={field.value}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.value)}
                    onChange={() => toggleField(field.value)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeApplications}
                onChange={(e) => setIncludeApplications(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Include application data</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedFields.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export {studentsToExport.length} Students
          </button>
        </div>
      </div>
    </div>
  );
}
