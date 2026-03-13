"use client";

import { useState } from "react";
import { 
  MoreHorizontal, 
  FileText, 
  MessageSquare, 
  Upload, 
  Bell,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useStatusHistory } from "@/hooks/useStatusHistory";

interface QuickActionsPanelProps {
  studentId: string;
  currentStatus: string;
  onStatusChange: (status: string) => void;
  onQuickNote: () => void;
  onDocumentUpload: () => void;
  onScheduleReminder: () => void;
}

const statusOptions = [
  { value: "application_submitted", label: "Application Submitted", color: "bg-blue-100 text-blue-700" },
  { value: "documents_pending", label: "Documents Pending", color: "bg-amber-100 text-amber-700" },
  { value: "under_review", label: "Under Review", color: "bg-primary/10 text-primary" },
  { value: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  { value: "enrolled", label: "Enrolled", color: "bg-purple-100 text-purple-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
];

export function QuickActionsPanel({
  studentId,
  currentStatus,
  onStatusChange,
  onQuickNote,
  onDocumentUpload,
  onScheduleReminder,
}: QuickActionsPanelProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const { changeStatus, loading } = useStatusHistory({ studentId });

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setShowStatusDropdown(false);
      return;
    }

    try {
      await changeStatus(newStatus);
      onStatusChange(newStatus);
      setShowStatusDropdown(false);
    } catch (error) {
      console.error("Failed to change status:", error);
    }
  };

  const currentStatusOption = statusOptions.find(s => s.value === currentStatus) || statusOptions[0];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Quick Actions
      </h3>
      
      <div className="space-y-2">
        {/* Status Change Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all",
              currentStatusOption.color,
              "border-current/20 hover:opacity-90"
            )}
          >
            <span className="font-medium text-sm">
              {loading ? "Updating..." : currentStatusOption.label}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              showStatusDropdown && "rotate-180"
            )} />
          </button>

          {showStatusDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={cn(
                    "w-full flex items-center px-4 py-2.5 text-sm text-left transition-colors",
                    status.value === currentStatus
                      ? "bg-gray-50 font-medium"
                      : "hover:bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full mr-3",
                    status.color.split(" ")[0].replace("bg-", "bg-").replace("100", "500")
                  )}></span>
                  {status.label}
                  {status.value === currentStatus && (
                    <span className="ml-auto text-xs text-gray-400">Current</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Note */}
        <button
          onClick={onQuickNote}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <span className="font-medium">Add Quick Note</span>
        </button>

        {/* Document Upload */}
        <button
          onClick={onDocumentUpload}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Upload className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="font-medium">Upload Document</span>
        </button>

        {/* Schedule Reminder */}
        <button
          onClick={onScheduleReminder}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-purple-600" />
          </div>
          <span className="font-medium">Schedule Reminder</span>
        </button>
      </div>
    </div>
  );
}
