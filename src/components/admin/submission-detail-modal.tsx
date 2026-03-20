"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Calendar,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { REJECTION_REASONS } from "@/lib/constants/task-constants";

interface Submission {
  id: string;
  status: string;
  submission_data: {
    review_link?: string;
    review_text?: string;
    template_id?: number;
  };
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  reward_credited: boolean;
  task: {
    id: string;
    title: string;
    type: string;
    reward_amount: number;
    description?: string;
    target_url?: string;
  };
  freelancer: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  reviewer?: {
    full_name: string;
    email: string;
  } | null;
}

interface SubmissionDetailModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (submissionId: string, action: "approve" | "reject", reason?: string) => Promise<void>;
  processing: boolean;
}

const statusConfig = {
  submitted: {
    label: "Pending Review",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export function SubmissionDetailModal({
  submission,
  isOpen,
  onClose,
  onAction,
  processing,
}: SubmissionDetailModalProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [customRejectReason, setCustomRejectReason] = useState("");

  if (!isOpen || !submission) return null;

  const config = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.submitted;
  const StatusIcon = config.icon;

  const handleApprove = async () => {
    await onAction(submission.id, "approve");
    onClose();
  };

  const handleReject = async () => {
    const finalReason = rejectReason === "other" ? customRejectReason : rejectReason;
    if (!finalReason || !finalReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    await onAction(submission.id, "reject", finalReason);
    setShowRejectInput(false);
    setRejectReason("");
    setCustomRejectReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Submission Details
              </h2>
              <p className="text-sm text-gray-500">
                Review submission information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border",
                  config.color
                )}
              >
                <StatusIcon className="w-4 h-4" />
                {config.label}
              </span>
              {submission.reward_credited && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Reward Credited
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              ID: {submission.id.slice(0, 8)}...
            </span>
          </div>

          {/* Task Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Task Information
            </h3>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {submission.task.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {submission.task.description || "No description"}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-700 dark:text-green-400">
                  ₹{submission.task.reward_amount}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Type: {submission.task.type.replace("_", " ")}
              </span>
              {submission.task.target_url && (
                <a
                  href={submission.task.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <LinkIcon className="w-3 h-3" />
                  Target URL
                </a>
              )}
            </div>
          </div>

          {/* Freelancer Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Freelancer
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center overflow-hidden">
                {submission.freelancer.avatar_url ? (
                  <img
                    src={submission.freelancer.avatar_url}
                    alt={submission.freelancer.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {submission.freelancer.full_name}
                </h4>
                <p className="text-sm text-gray-500">{submission.freelancer.email}</p>
              </div>
            </div>
          </div>

          {/* Submission Data */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Submission Data
            </h3>
            {submission.submission_data?.review_link ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={submission.submission_data.review_link}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400"
                  />
                  <a
                    href={submission.submission_data.review_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                {submission.submission_data.review_text && (
                  <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {submission.submission_data.review_text}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No submission data available</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Submitted
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(submission.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {submission.reviewed_at && (
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      submission.status === "approved"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    )}
                  >
                    {submission.status === "approved" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {submission.status === "approved" ? "Approved" : "Rejected"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(submission.reviewed_at).toLocaleString()}
                      {submission.reviewer && ` by ${submission.reviewer.full_name}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review Notes */}
          {submission.review_notes && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Rejection Reason
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                {submission.review_notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {submission.status === "submitted" && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {!showRejectInput ? (
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={processing}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve & Credit Reward
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-red-600">
                  Select Rejection Reason
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setRejectReason(reason.value)}
                      className={cn(
                        "text-left px-3 py-2 rounded-xl text-sm transition-colors",
                        rejectReason === reason.value
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-transparent"
                      )}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
                {rejectReason === "other" && (
                  <textarea
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="w-full p-3 border border-red-200 dark:border-red-500/20 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={2}
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason("");
                      setCustomRejectReason("");
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing || (!rejectReason || (rejectReason === "other" && !customRejectReason.trim()))}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Confirm Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
