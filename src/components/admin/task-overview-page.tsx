"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "./admin-layout";
import {
  ClipboardList,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
  Plus,
  Filter,
  X,
  Calendar,
  Flag,
  Users,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { TaskCreateModal } from "./task-create-modal";
import { REJECTION_REASONS } from "@/lib/constants/task-constants";

interface TaskWithDetails {
  id: string;
  type: string;
  title: string;
  description: string | null;
  reward_amount: number;
  is_active: boolean;
  auto_assign: boolean;
  target_url: string | null;
  deadline: string | null;
  priority: string;
  category: string | null;
  admin_question: string | null;
  created_at: string;
  assignments: TaskAssignment[];
  submissions: TaskSubmission[];
}

interface TaskAssignment {
  id: string;
  task_id: string;
  freelancer_id: string;
  status: string;
  assigned_at: string;
  freelancer?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface TaskSubmission {
  id: string;
  task_id: string;
  freelancer_id: string;
  status: string;
  submission_data: any;
  proof_files: any[];
  deadline_extension_requested: boolean;
  deadline_extension_reason?: string;
  deadline_extension_approved?: boolean;
  new_deadline?: string;
  review_notes?: string;
  created_at: string;
  freelancer?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface TaskChat {
  id: string;
  task_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface Stats {
  totalTasks: number;
  activeTasks: number;
  totalAssignments: number;
  pendingSubmissions: number;
  completedSubmissions: number;
}

const priorityColors = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  normal: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const statusColors: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  accepted: "bg-purple-100 text-purple-700",
  in_progress: "bg-amber-100 text-amber-700",
  submitted: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

export function TaskOverviewPage() {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    activeTasks: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    completedSubmissions: 0,
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<TaskChat[]>([]);
  const [chatTaskId, setChatTaskId] = useState<string | null>(null);
  const [chatSubmissionId, setChatSubmissionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  // Extension review state
  const [showExtensionModal, setShowExtensionModal] = useState<TaskSubmission | null>(null);
  const [processingExtension, setProcessingExtension] = useState(false);

  // Submission review state
  const [showReviewModal, setShowReviewModal] = useState<TaskSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [rejectReason, setRejectReason] = useState("");
  const [customRejectReason, setCustomRejectReason] = useState("");
  const [processingReview, setProcessingReview] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/tasks/overview");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch data");

      setTasks(data.tasks || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load task overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("task-overview-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_assignments" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_submissions" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const loadChats = async (taskId: string, submissionId?: string) => {
    setLoadingChats(true);
    try {
      const params = new URLSearchParams({ taskId });
      if (submissionId) params.append("submissionId", submissionId);

      const response = await fetch(`/api/tasks/chat?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setChatMessages(data.messages || []);
    } catch (error) {
      console.error("Error loading chats:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatTaskId) return;

    setSendingMessage(true);
    try {
      const response = await fetch("/api/tasks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: chatTaskId,
          submissionId: chatSubmissionId,
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setChatMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReviewExtension = async (approved: boolean) => {
    if (!showExtensionModal) return;

    setProcessingExtension(true);
    try {
      const response = await fetch("/api/tasks/extension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: showExtensionModal.id,
          action: "review",
          approved,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(approved ? "Extension approved" : "Extension rejected");
      setShowExtensionModal(null);
      fetchData();
    } catch (error) {
      console.error("Error reviewing extension:", error);
      toast.error("Failed to review extension");
    } finally {
      setProcessingExtension(false);
    }
  };

  const handleReviewSubmission = async () => {
    if (!showReviewModal) return;

    if (reviewAction === "reject" && !rejectReason && !customRejectReason) {
      toast.error("Please select or enter a rejection reason");
      return;
    }

    setProcessingReview(true);
    try {
      const response = await fetch("/api/admin/tasks/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: showReviewModal.id,
          action: reviewAction,
          reason: reviewAction === "reject" ? (rejectReason === "other" ? customRejectReason : rejectReason) : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(reviewAction === "approve" ? "Submission approved" : "Submission rejected");
      setShowReviewModal(null);
      setRejectReason("");
      setCustomRejectReason("");
      fetchData();
    } catch (error) {
      console.error("Error reviewing submission:", error);
      toast.error("Failed to review submission");
    } finally {
      setProcessingReview(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? task.is_active : !task.is_active);
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTaskStats = (task: TaskWithDetails) => {
    const pending = task.submissions.filter((s) => s.status === "submitted").length;
    const approved = task.submissions.filter((s) => s.status === "approved").length;
    const rejected = task.submissions.filter((s) => s.status === "rejected").length;
    const extensions = task.submissions.filter((s) => s.deadline_extension_requested && !s.deadline_extension_approved).length;
    return { pending, approved, rejected, extensions, total: task.submissions.length };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor all tasks, assignments, and submissions</p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</p>
                <p className="text-xs text-gray-500">Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTasks}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAssignments}</p>
                <p className="text-xs text-gray-500">Assignments</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingSubmissions}</p>
                <p className="text-xs text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedSubmissions}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => fetchData()}
                className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-900 dark:text-white">No tasks found</p>
            <p className="text-sm text-gray-500 mt-1">Create your first task to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const taskStats = getTaskStats(task);
              const isExpanded = expandedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
                >
                  {/* Task Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 dark:text-white">{task.title}</h3>
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 text-xs font-medium rounded-full border",
                              priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.normal
                            )}
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority}
                          </span>
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 text-xs font-medium rounded-full",
                              task.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {task.is_active ? "Active" : "Inactive"}
                          </span>
                          {task.auto_assign && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              Auto-assign
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description || "No description"}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {task.type.replace("_", " ")}
                          </span>
                          {task.category && (
                            <span className="flex items-center gap-1">
                              <ClipboardList className="w-3 h-3" />
                              {task.category}
                            </span>
                          )}
                          {task.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                          <span className="font-bold text-green-600">₹{task.reward_amount}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quick Stats */}
                        <div className="flex items-center gap-3 text-xs">
                          {taskStats.extensions > 0 && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              {taskStats.extensions} extension{taskStats.extensions > 1 ? "s" : ""}
                            </span>
                          )}
                          {taskStats.pending > 0 && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                              <Clock className="w-3 h-3" />
                              {taskStats.pending} pending
                            </span>
                          )}
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            {taskStats.approved} done
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-700/30">
                      {/* Pending Extensions */}
                      {task.submissions.filter((s) => s.deadline_extension_requested && !s.deadline_extension_approved).length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-purple-600" />
                            Pending Extension Requests
                          </h4>
                          <div className="space-y-2">
                            {task.submissions
                              .filter((s) => s.deadline_extension_requested && !s.deadline_extension_approved)
                              .map((submission) => (
                                <div
                                  key={submission.id}
                                  className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center overflow-hidden">
                                        {submission.freelancer?.avatar_url ? (
                                          <img src={submission.freelancer.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <User className="w-4 h-4 text-purple-600" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {submission.freelancer?.full_name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-500">{submission.deadline_extension_reason}</p>
                                        <p className="text-xs text-purple-600 mt-1">
                                          New deadline: {submission.new_deadline ? new Date(submission.new_deadline).toLocaleDateString() : "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setShowExtensionModal(submission)}
                                        className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
                                      >
                                        Review
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Pending Submissions */}
                      {task.submissions.filter((s) => s.status === "submitted").length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            Pending Submissions ({task.submissions.filter((s) => s.status === "submitted").length})
                          </h4>
                          <div className="space-y-2">
                            {task.submissions
                              .filter((s) => s.status === "submitted")
                              .map((submission) => (
                                <div
                                  key={submission.id}
                                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center overflow-hidden">
                                        {submission.freelancer?.avatar_url ? (
                                          <img src={submission.freelancer.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <User className="w-4 h-4 text-amber-600" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {submission.freelancer?.full_name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Submitted: {new Date(submission.created_at).toLocaleString()}
                                        </p>
                                        {submission.submission_data?.review_link && (
                                          <a
                                            href={submission.submission_data.review_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                          >
                                            <LinkIcon className="w-3 h-3" />
                                            View submission link
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setChatTaskId(task.id);
                                          setChatSubmissionId(submission.id);
                                          loadChats(task.id, submission.id);
                                        }}
                                        className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                                        title="Chat"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowReviewModal(submission);
                                          setReviewAction("approve");
                                        }}
                                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowReviewModal(submission);
                                          setReviewAction("reject");
                                        }}
                                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Assignments */}
                      {task.assignments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Assignments ({task.assignments.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {task.assignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                    {assignment.freelancer?.avatar_url ? (
                                      <img src={assignment.freelancer.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                      {assignment.freelancer?.full_name || "Unknown"}
                                    </p>
                                    <span
                                      className={cn(
                                        "inline-flex px-2 py-0.5 text-xs font-medium rounded-full",
                                        statusColors[assignment.status] || "bg-gray-100 text-gray-600"
                                      )}
                                    >
                                      {assignment.status.replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {task.assignments.length === 0 && task.submissions.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No assignments or submissions yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Chat Panel */}
        {chatTaskId && (
          <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Chat</h3>
              <button
                onClick={() => {
                  setChatTaskId(null);
                  setChatSubmissionId(null);
                  setChatMessages([]);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {loadingChats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : chatMessages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No messages yet</p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2",
                      msg.sender?.role === "admin" || msg.sender?.role === "super_admin" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] px-3 py-2 rounded-xl text-sm",
                        msg.sender?.role === "admin" || msg.sender?.role === "super_admin"
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      )}
                    >
                      <p>{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extension Review Modal */}
        {showExtensionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Review Extension Request</h3>
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Freelancer:</strong> {showExtensionModal.freelancer?.full_name}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <strong>Reason:</strong> {showExtensionModal.deadline_extension_reason}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    <strong>New Deadline:</strong>{" "}
                    {showExtensionModal.new_deadline ? new Date(showExtensionModal.new_deadline).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowExtensionModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewExtension(false)}
                  disabled={processingExtension}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50"
                >
                  {processingExtension ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Reject"}
                </button>
                <button
                  onClick={() => handleReviewExtension(true)}
                  disabled={processingExtension}
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50"
                >
                  {processingExtension ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submission Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {reviewAction === "approve" ? "Approve Submission" : "Reject Submission"}
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Freelancer:</strong> {showReviewModal.freelancer?.full_name}
                  </p>
                  {showReviewModal.submission_data?.review_link && (
                    <a
                      href={showReviewModal.submission_data.review_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                    >
                      <LinkIcon className="w-3 h-3" />
                      View submission link
                    </a>
                  )}
                </div>

                {reviewAction === "reject" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Rejection Reason
                    </label>
                    <div className="space-y-2">
                      {REJECTION_REASONS.map((reason) => (
                        <button
                          key={reason.value}
                          onClick={() => setRejectReason(reason.value)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors",
                            rejectReason === reason.value
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300"
                              : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
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
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={2}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowReviewModal(null);
                    setRejectReason("");
                    setCustomRejectReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmission}
                  disabled={processingReview}
                  className={cn(
                    "flex-1 px-4 py-2 text-white font-medium rounded-xl disabled:opacity-50",
                    reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {processingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : reviewAction === "approve" ? (
                    "Approve"
                  ) : (
                    "Reject"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Create Modal */}
        <TaskCreateModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSuccess={fetchData}
        />
      </div>
    </AdminLayout>
  );
}