"use client";

import { X, RotateCcw, Check, AlertCircle } from "lucide-react";

interface ChangeSummaryItem {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

interface ChangeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  changes: ChangeSummaryItem[];
  studentName: string;
  isSaving?: boolean;
}

export function ChangeSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  changes,
  studentName,
  isSaving = false,
}: ChangeSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Changes</h2>
            <p className="text-sm text-gray-500 mt-1">
              You are about to update <span className="font-medium text-gray-700">{studentName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto p-6">
          {changes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No changes to save</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                {changes.length} field{changes.length !== 1 ? "s" : ""} will be updated:
              </p>
              
              {changes.map((change, index) => (
                <div
                  key={change.field}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {change.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Old Value */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-400 block mb-1">Before</span>
                      <span className="text-sm text-gray-600 line-through decoration-red-400 truncate block">
                        {change.oldValue}
                      </span>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <RotateCcw className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                    
                    {/* New Value */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-400 block mb-1">After</span>
                      <span className="text-sm font-medium text-gray-900 truncate block">
                        {change.newValue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving || changes.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
