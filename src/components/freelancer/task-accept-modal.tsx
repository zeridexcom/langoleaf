"use client";

import { useState } from "react";
import {
  X,
  CheckCircle,
  Clock,
  Calendar,
  Flag,
  Star,
  Loader2,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  reward_amount: number;
  deadline: string | null;
  priority: string;
  category: string | null;
  admin_question: string | null;
  target_url?: string | null;
}

interface TaskAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  assignmentId?: string;
  onSuccess: () => void;
}

const priorityColors = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  normal: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

export function TaskAcceptModal({ isOpen, onClose, task, assignmentId, onSuccess }: TaskAcceptModalProps) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  if (!isOpen || !task) return null;

  const hasQuestion = task.admin_question && task.admin_question.trim() !== "";

  const handleAccept = async () => {
    if (hasQuestion && !answer.trim()) {
      toast.error("Please answer the question before accepting");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tasks/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          answer: hasQuestion ? answer : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to accept task");

      toast.success("Task accepted successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error accepting task:", error);
      toast.error(error.message || "Failed to accept task");
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
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Accept Task</h2>
              <p className="text-sm text-gray-500">Review and accept this task</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Task Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{task.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{task.description || "No description"}</p>
              </div>
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-lg shrink-0">
                <Star className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-700 dark:text-green-400">₹{task.reward_amount}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              {task.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              <span
                className={cn(
                  "inline-flex px-2 py-0.5 text-xs font-medium rounded-full border",
                  priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.normal
                )}
              >
                <Flag className="w-3 h-3 mr-1" />
                {task.priority}
              </span>
              {task.category && (
                <span className="flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">{task.category}</span>
                </span>
              )}
            </div>
          </div>

          {/* Target URL */}
          {task.target_url && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Target URL</p>
              <a
                href={task.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {task.target_url}
              </a>
            </div>
          )}

          {/* Admin Question */}
          {hasQuestion && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Admin Question</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">{task.admin_question}</p>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Info Note */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium">By accepting this task:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• You commit to completing it by the deadline</li>
                <li>• You can request a deadline extension if needed</li>
                <li>• You can chat with admin for any questions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={loading || (!!hasQuestion && !answer.trim())}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Accept Task
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
