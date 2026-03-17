"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Loader2,
  User,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Submission {
  id: string;
  status: string;
  submission_data: {
    review_link?: string;
    review_text?: string;
    template_id?: number;
  };
  created_at: string;
  task: {
    id: string;
    title: string;
    reward_amount: number;
  };
  freelancer: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export function TaskVerification() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await fetch("/api/admin/tasks?status=submitted", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setProcessing(submissionId);
    try {
      const response = await fetch("/api/admin/tasks/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          submissionId,
          action: "approve",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve");
      }

      toast.success("Submission approved and reward credited!");
      loadSubmissions();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve submission");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(submissionId);
    try {
      const response = await fetch("/api/admin/tasks/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          submissionId,
          action: "reject",
          reason: rejectReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject");
      }

      toast.success("Submission rejected");
      setShowRejectModal(null);
      setRejectReason("");
      loadSubmissions();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject submission");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          All Caught Up!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          No pending submissions to review
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pending Review Submissions ({submissions.length})
        </h2>
        <Button variant="outline" size="sm" onClick={loadSubmissions}>
          Refresh
        </Button>
      </div>

      {submissions.map((submission) => (
        <Card key={submission.id} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Freelancer Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {submission.freelancer.full_name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {submission.freelancer.email}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {submission.task.title}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    ₹{submission.task.reward_amount}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(submission.created_at).toLocaleString()}
                </div>

                {/* Expandable Review Link */}
                <button
                  onClick={() =>
                    setExpandedId(
                      expandedId === submission.id ? null : submission.id
                    )
                  }
                  className="flex items-center gap-1 mt-3 text-sm text-primary hover:text-primary/80"
                >
                  {expandedId === submission.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  View Review Link
                </button>

                {expandedId === submission.id && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={
                          submission.submission_data.review_link || "No link"
                        }
                        readOnly
                        className="flex-1 text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400"
                      />
                      <a
                        href={submission.submission_data.review_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(submission.id)}
                disabled={processing === submission.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing === submission.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectModal(submission.id)}
                disabled={processing === submission.id}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>

          {/* Reject Modal */}
          {showRejectModal === submission.id && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
              <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                Reason for Rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejecting this submission..."
                className="w-full p-3 border border-red-200 dark:border-red-500/20 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReject(submission.id)}
                  disabled={processing === submission.id}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {processing === submission.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm Reject"
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
