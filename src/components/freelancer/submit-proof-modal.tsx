"use client";

import { useState } from "react";
import { X, CheckCircle, Upload, Link as LinkIcon, FileText, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  submissionId?: string;
  taskTitle: string;
  onSuccess: () => void;
}

export function SubmitProofModal({
  isOpen,
  onClose,
  taskId,
  submissionId,
  taskTitle,
  onSuccess,
}: SubmitProofModalProps) {
  const [loading, setLoading] = useState(false);
  const [reviewLink, setReviewLink] = useState("");
  const [reviewText, setReviewText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewLink.trim()) {
      toast.error("Proof link is required");
      return;
    }

    setLoading(true);
    try {
      // In a real app we'd upload files here
      // For now we'll submit the review link and text
      
      const response = await fetch("/api/tasks/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          submission_id: submissionId, // Passing submission_id if we have one to update
          submission_data: {
            review_link: reviewLink.trim(),
            review_text: reviewText.trim(),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit proof");

      toast.success("Proof submitted successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting proof:", error);
      toast.error(error.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Submit Proof</h2>
              <p className="text-sm text-gray-500">Provide proof of task completion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Task</p>
            <p className="font-medium text-gray-900 dark:text-white">{taskTitle}</p>
          </div>

          <form id="submit-proof-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Proof Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Proof Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={reviewLink}
                onChange={(e) => setReviewLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-gray-500">
                Provide a link to your work, screenshot, or completed submission.
              </p>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Notes
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Any additional information for the reviewer..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows={4}
              />
            </div>

            {/* Warning Note */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Before submitting:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700/80 dark:text-amber-500">
                  <li>Ensure your proof is publicly accessible</li>
                  <li>Double-check all task requirements are met</li>
                  <li>False submissions may lead to account penalties</li>
                </ul>
              </div>
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
              form="submit-proof-form"
              disabled={loading || !reviewLink.trim()}
              className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Proof
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
