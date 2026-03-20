Now let me create the remaining freelancer components:<tool_call>write_file<arg_key>file_path</arg_key><arg_value>D:\freelancer.lango\src\components\freelancer\submit-proof-modal.tsx</arg_value><arg_key>content</arg_key><arg_value>"use client";

import { useState } from "react";
import {
  X,
  Upload,
  CheckCircle,
  Link as LinkIcon,
  Loader2,
  FileText,
  Image,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  reward_amount: number;
  target_url?: string | null;
  admin_question?: string | null;
}

interface Submission {
  id: string;
  task_id: string;
  status: string;
  submission_data: any;
  proof_files: any[];
}

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  submission: Submission | null;
  onSuccess: () => void;
}

export function SubmitProofModal({ isOpen, onClose, task, submission, onSuccess }: SubmitProofModalProps) {
  const [loading, setLoading] = useState(false);
  const [reviewLink, setReviewLink] = useState(submission?.submission_data?.review_link || "");
  const [reviewText, setReviewText] = useState(submission?.submission_data?.review_text || "");
  const [answer, setAnswer] = useState(submission?.submission_data?.answer || "");
  const [proofFiles, setProofFiles] = useState<any[]>(submission?.proof_files || []);

  if (!isOpen || !task) return null;

  const hasQuestion = task.admin_question && task.admin_question.trim() !== "";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setProofFiles((prev) => [
          ...prev,
          {
            name: file.name,
            url: reader.result as string,
            size: file.size,
            type: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reviewLink.trim() && proofFiles.length === 0) {
      toast.error("Please provide a review link or upload proof files");
      return;
    }

    if (hasQuestion && !answer.trim()) {
      toast.error("Please answer the admin's question");
      return;
    }

    if (!submission?.id) {
      toast.error("No submission found");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tasks/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          proofFiles,
          submissionData: {
            review_link: reviewLink,
            review_text: reviewText,
            answer: hasQuestion ? answer : undefined,
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
              <p className="text-sm text-gray-500">{task.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target URL */}
          {task.target_url && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Target URL</p>
              <a
                href={task.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                {task.target_url}
              </a>
            </div>
          )}

          {/* Review Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review / Submission Link
            </label>
            <input
              type="url"
              value={reviewLink}
              onChange={(e) => setReviewLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Any additional details about your submission..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3}
            />
          </div>

          {/* Admin Question */}
          {hasQuestion && (
            <div className="space-y-3">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Admin Question:</p>
                <p className="text-sm text-amber-600 dark:text-amber-300">{task.admin_question}</p>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows={2}
              />
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proof Files (Screenshots, Documents)
            </label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="proof-upload"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
              </label>
            </div>

            {/* Uploaded Files */}
            {proofFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {proofFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {file.type?.startsWith("image/") ? (
                        <Image className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading || (!reviewLink.trim() && proofFiles.length === 0)}
            className="w-full px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
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
  );
}
</arg_value></tool_call>

---

## Summary Metadata
**Update time**: 2026-03-20T06:44:07.108Z 
