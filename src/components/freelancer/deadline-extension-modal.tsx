"use client";

import { useState } from "react";
import { X, Calendar, Clock, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface DeadlineExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  taskTitle: string;
  currentDeadline: string | null;
  onSuccess: () => void;
}

export function DeadlineExtensionModal({
  isOpen,
  onClose,
  submissionId,
  taskTitle,
  currentDeadline,
  onSuccess,
}: DeadlineExtensionModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for the extension");
      return;
    }
    if (!newDeadline) {
      toast.error("Please select a new deadline requested");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tasks/extension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          submissionId,
          reason: reason.trim(),
          newDeadline,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to request extension");

      toast.success("Deadline extension requested successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error requesting extension:", error);
      toast.error(error.message || "Failed to request extension");
    } finally {
      setLoading(false);
    }
  };

  // Min date for new deadline is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request Extension</h2>
              <p className="text-sm text-gray-500">Ask for more time on this task</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:border-gray-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{taskTitle}</p>
            {currentDeadline && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Current deadline: {new Date(currentDeadline).toLocaleDateString()}
              </p>
            )}
          </div>

          <form id="extension-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Deadline Requested <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={minDateString}
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason for Extension <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need more time..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows={4}
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs">
                Your request will be reviewed by an admin. You can only have one active extension request per task.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="extension-form"
              disabled={loading || !reason.trim() || !newDeadline}
              className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                "Request Extension"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
