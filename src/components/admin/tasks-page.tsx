"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "./admin-layout";
import {
  ClipboardList,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
  ExternalLink,
  Star,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Plus,
  Pencil,
  Trash2,
  Download,
  CheckSquare,
  Square,
  MoreVertical,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { TaskCreateModal } from "./task-create-modal";
import { SubmissionDetailModal } from "./submission-detail-modal";

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
}

interface Task {
  id: string;
  type: string;
  title: string;
  description: string | null;
  reward_amount: number;
  reward_currency: string;
  is_active: boolean;
  auto_assign: boolean;
  target_url: string | null;
  deadline: string | null;
  priority: string;
  category: string | null;
  admin_question: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRewards: number;
}

const statusOptions = [
  { value: "all", label: "All", color: "bg-gray-100 text-gray-700" },
  { value: "submitted", label: "Pending", color: "bg-amber-100 text-amber-700" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
];

const taskTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "push_review", label: "Push Review" },
  { value: "document_upload", label: "Document Upload" },
  { value: "profile_complete", label: "Profile Complete" },
  { value: "referral", label: "Referral" },
  { value: "social_share", label: "Social Share" },
  { value: "feedback", label: "Feedback" },
];

const dateRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

export function TasksPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<"submissions" | "tasks">("submissions");

  // Stats
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRewards: 0,
  });

  const supabase = createClient();

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { from: now.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return { from: weekStart.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: monthStart.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
      case "custom":
        return { from: customDateFrom, to: customDateTo };
      default:
        return { from: "", to: "" };
    }
  }, [dateRange, customDateFrom, customDateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      
      const params = new URLSearchParams({
        fetchType: viewMode,
        status: statusFilter,
        taskType: taskTypeFilter,
        search: searchQuery,
        dateFrom: from,
        dateTo: to,
      });

      const response = await fetch(`/api/admin/tasks?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      if (viewMode === "tasks") {
        setTasks(data.tasks || []);
      } else {
        setSubmissions(data.submissions || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [viewMode, statusFilter, taskTypeFilter, searchQuery, getDateRange, stats]);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("submissions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_submissions",
        },
        () => {
          if (viewMode === "submissions") fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          if (viewMode === "tasks") fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase, viewMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowRejectModal(null);
        setShowBulkRejectModal(false);
        setShowTaskModal(false);
        setShowSubmissionModal(false);
        setSelectedIds([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleApprove = async (submissionId: string) => {
    setProcessing(submissionId);
    try {
      const response = await fetch("/api/admin/tasks/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          action: "approve",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Submission approved and reward credited!");
      fetchData();
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
        body: JSON.stringify({
          submissionId,
          action: "reject",
          reason: rejectReason,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Submission rejected");
      setShowRejectModal(null);
      setRejectReason("");
      fetchData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject submission");
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error("No submissions selected");
      return;
    }

    setProcessing("bulk");
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_approve",
          submissionIds: selectedIds,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      console.error("Error bulk approving:", error);
      toast.error("Failed to approve submissions");
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      toast.error("No submissions selected");
      return;
    }

    if (!bulkRejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing("bulk");
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_reject",
          submissionIds: selectedIds,
          reason: bulkRejectReason,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      setShowBulkRejectModal(false);
      setBulkRejectReason("");
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      console.error("Error bulk rejecting:", error);
      toast.error("Failed to reject submissions");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchData();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleExport = () => {
    const csvData = submissions.map((s) => ({
      ID: s.id,
      Freelancer: s.freelancer.full_name,
      Email: s.freelancer.email,
      Task: s.task.title,
      Type: s.task.type,
      Reward: s.task.reward_amount,
      Status: s.status,
      "Review Link": s.submission_data?.review_link || "",
      "Submitted At": new Date(s.created_at).toLocaleString(),
      "Reviewed At": s.reviewed_at ? new Date(s.reviewed_at).toLocaleString() : "",
    }));

    const headers = Object.keys(csvData[0] || {}).join(",");
    const rows = csvData.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully!");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = submissions
      .filter((s) => s.status === "submitted")
      .map((s) => s.id);
    setSelectedIds((prev) =>
      prev.length === pendingIds.length ? [] : pendingIds
    );
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (taskTypeFilter !== "all") count++;
    if (searchQuery) count++;
    if (dateRange !== "all") count++;
    return count;
  }, [statusFilter, taskTypeFilter, searchQuery, dateRange]);

  const clearFilters = () => {
    setStatusFilter("all");
    setTaskTypeFilter("all");
    setSearchQuery("");
    setDateRange("all");
    setCustomDateFrom("");
    setCustomDateTo("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "submitted":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case "push_review":
        return "bg-blue-100 text-blue-700";
      case "document_upload":
        return "bg-purple-100 text-purple-700";
      case "profile_complete":
        return "bg-green-100 text-green-700";
      case "referral":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Task Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Review submissions and manage tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setViewMode(viewMode === "submissions" ? "tasks" : "submissions");
                setSelectedIds([]);
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              {viewMode === "submissions" ? (
                <>
                  <ClipboardList className="w-4 h-4" />
                  Manage Tasks
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  View Submissions
                </>
              )}
            </button>
            {viewMode === "tasks" && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {viewMode === "submissions" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pending}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.approved}
                  </p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.rejected}
                  </p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{stats.totalRewards.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Rewards</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Task Type Filter */}
              <select
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {taskTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {dateRangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Custom Date Inputs */}
              {dateRange === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear ({activeFiltersCount})
                </button>
              )}

              {/* Export */}
              {viewMode === "submissions" && (
                <button
                  onClick={handleExport}
                  disabled={submissions.length === 0}
                  className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}

              {/* Refresh */}
              <button
                onClick={() => fetchData()}
                className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {viewMode === "submissions" && selectedIds.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-primary" />
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedIds.length} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkApprove}
                disabled={processing === "bulk"}
                className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {processing === "bulk" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve All
              </button>
              <button
                onClick={() => setShowBulkRejectModal(true)}
                disabled={processing === "bulk"}
                className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject All
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : viewMode === "tasks" ? (
          /* Tasks View */
          tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-900 dark:text-white">No tasks yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first task to get started</p>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Reward
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Auto-Assign
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {task.description || "No description"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize",
                            getTaskTypeColor(task.type)
                          )}
                        >
                          {task.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-green-600">₹{task.reward_amount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                            task.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {task.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {task.auto_assign ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Submissions View */
          submissions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p className="font-medium text-gray-900 dark:text-white">All caught up!</p>
              <p className="text-sm text-gray-500 mt-1">No submissions to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All for Pending */}
              {submissions.some((s) => s.status === "submitted") && (
                <div className="flex items-center gap-3 px-1">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {selectedIds.length === submissions.filter((s) => s.status === "submitted").length ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Select all pending ({submissions.filter((s) => s.status === "submitted").length})
                  </button>
                </div>
              )}

              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={cn(
                    "bg-white dark:bg-gray-800 border rounded-2xl p-5 transition-all",
                    selectedIds.includes(submission.id)
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox for pending submissions */}
                    {submission.status === "submitted" && (
                      <button
                        onClick={() => toggleSelect(submission.id)}
                        className="mt-1"
                      >
                        {selectedIds.includes(submission.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* Freelancer Info */}
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              {submission.freelancer.full_name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {submission.freelancer.email}
                            </span>
                            <span
                              className={cn(
                                "inline-flex px-2 py-0.5 text-xs font-medium rounded-full border capitalize",
                                getStatusColor(submission.status)
                              )}
                            >
                              {submission.status === "submitted" ? "Pending" : submission.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize",
                                getTaskTypeColor(submission.task.type)
                              )}
                            >
                              {submission.task.type.replace("_", " ")}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {submission.task.title}
                            </span>
                            <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5" />
                              ₹{submission.task.reward_amount}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(submission.created_at).toLocaleString()}
                            </span>
                            {submission.reviewed_at && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Reviewed {new Date(submission.reviewed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowSubmissionModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {submission.status === "submitted" && (
                            <>
                              <button
                                onClick={() => handleApprove(submission.id)}
                                disabled={processing === submission.id}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {processing === submission.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => setShowRejectModal(submission.id)}
                                disabled={processing === submission.id}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expandable Review Link */}
                      {submission.submission_data?.review_link && (
                        <div className="mt-4">
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === submission.id ? null : submission.id
                              )
                            }
                            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                          >
                            {expandedId === submission.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            View Submission Details
                          </button>

                          {expandedId === submission.id && (
                            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <input
                                  type="text"
                                  value={submission.submission_data.review_link || "No link"}
                                  readOnly
                                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400"
                                />
                                <a
                                  href={submission.submission_data.review_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                              {submission.submission_data.review_text && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {submission.submission_data.review_text}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline Reject Modal */}
                      {showRejectModal === submission.id && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl">
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
                            <button
                              onClick={() => {
                                setShowRejectModal(null);
                                setRejectReason("");
                              }}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReject(submission.id)}
                              disabled={processing === submission.id}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              {processing === submission.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Confirm Reject"
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Reject {selectedIds.length} Submissions
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              All selected submissions will be rejected. Please provide a reason.
            </p>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowBulkRejectModal(false);
                  setBulkRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReject}
                disabled={processing === "bulk" || !bulkRejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing === "bulk" ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Reject All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Create/Edit Modal */}
      <TaskCreateModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSuccess={fetchData}
      />

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
          setSelectedSubmission(null);
        }}
        onAction={async (id, action, reason) => {
          if (action === "approve") {
            await handleApprove(id);
          } else {
            setRejectReason(reason || "");
            await handleReject(id);
          }
        }}
        processing={processing !== null}
      />
    </AdminLayout>
  );
}

