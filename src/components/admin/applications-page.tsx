"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  GraduationCap,
  Loader2,
  ExternalLink,
  Filter,
  ChevronDown,
  Building2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Application {
  id: string;
  student_id: string;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  freelancer_id: string;
  freelancer_name: string | null;
  freelancer_email: string | null;
  program: string | null;
  university: string | null;
  status: string;
  commission_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const supabase = createClient();

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          student:students(name, email, phone),
          freelancer:profiles!applications_freelancer_id_fkey(full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((app: any) => ({
        ...app,
        student_name: app.student?.name,
        student_email: app.student?.email,
        student_phone: app.student?.phone,
        freelancer_name: app.freelancer?.full_name,
        freelancer_email: app.freelancer?.email,
      }));

      setApplications(formatted);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("applications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusUpdate = async (newStatus: string, reason?: string) => {
    if (!selectedApp) return;

    setProcessing(selectedApp.id);
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          notes: reason || selectedApp.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedApp.id);

      if (error) throw error;

      // Notify freelancer
      await supabase.from("notifications").insert({
        freelancer_id: selectedApp.freelancer_id,
        type: newStatus === "approved" ? "application_approved" : "application_rejected",
        title: `Application ${newStatus === "approved" ? "Approved" : "Rejected"}`,
        message:
          newStatus === "approved"
            ? `Application for ${selectedApp.student_name} has been approved!`
            : `Application for ${selectedApp.student_name} was rejected. ${reason ? `Reason: ${reason}` : ""}`,
        data: {
          application_id: selectedApp.id,
          student_name: selectedApp.student_name,
          reason: reason,
        },
      });

      toast.success(`Application ${newStatus}`);
      setShowModal(false);
      setSelectedApp(null);
      setRejectReason("");
      fetchApplications();
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    } finally {
      setProcessing(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.program?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.university?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "enrolled":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "under_review":
        return "bg-blue-100 text-blue-700";
      case "documents_pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusCounts = {
    all: applications.length,
    submitted: applications.filter((a) => a.status === "submitted").length,
    under_review: applications.filter((a) => a.status === "under_review").length,
    documents_pending: applications.filter((a) => a.status === "documents_pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    enrolled: applications.filter((a) => a.status === "enrolled").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Applications
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage and review student applications
            </p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl w-fit border border-gray-200/50 dark:border-gray-700/50">
          {[
            { value: "all", label: "All" },
            { value: "submitted", label: "Submitted" },
            { value: "under_review", label: "Under Review" },
            { value: "documents_pending", label: "Docs Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "enrolled", label: "Enrolled" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200",
                statusFilter === option.value
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              )}
            >
              {option.label}
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                statusFilter === option.value ? "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300" : "bg-gray-200/50 dark:bg-gray-700/50 text-gray-400"
              )}>
                {statusCounts[option.value as keyof typeof statusCounts] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students, programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
          />
        </div>

        {/* Applications Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-gray-900 dark:text-white">No applications found</p>
              <p className="text-sm mt-1 font-medium">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">
                      Student
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">
                      Program & Uni
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">
                      Freelancer
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">
                      Status
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">
                      Date applied
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedApp(app);
                        setModalAction(null);
                        setShowModal(true);
                      }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                              {app.student_name || "Unknown"}
                            </p>
                            <p className="text-[11px] font-medium text-gray-500">
                              {app.student_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-gray-100 rounded-lg dark:bg-gray-700 flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white max-w-[200px] truncate">
                              {app.program || "N/A"}
                            </p>
                            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{app.university || "N/A"}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {app.freelancer_name || "Unknown"}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-gray-400">
                              {app.freelancer_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg",
                            getStatusColor(app.status)
                          )}
                        >
                          {app.status?.replace("_", " ") || "submitted"}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-500">
                        {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {app.status !== "approved" &&
                            app.status !== "rejected" &&
                            app.status !== "enrolled" && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setModalAction("approve");
                                    setShowModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setModalAction("reject");
                                    setShowModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {modalAction === "approve"
                ? "Approve Application"
                : modalAction === "reject"
                ? "Reject Application"
                : "Application Details"}
            </h3>

            {/* Application Details */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedApp.student_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedApp.student_email} • {selectedApp.student_phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedApp.program}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedApp.university}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedApp.freelancer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedApp.freelancer_email}
                    </p>
                  </div>
                </div>
              </div>

              {modalAction === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                  />
                </div>
              )}

              {modalAction === "approve" && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Approving this application will notify the freelancer and
                  initiate the enrollment process.
                </p>
              )}

              {!modalAction && selectedApp.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedApp.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApp(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {modalAction ? "Cancel" : "Close"}
              </button>
              {modalAction && (
                <button
                  onClick={() =>
                    handleStatusUpdate(
                      modalAction === "approve" ? "approved" : "rejected",
                      rejectReason
                    )
                  }
                  disabled={
                    processing === selectedApp.id ||
                    (modalAction === "reject" && !rejectReason.trim())
                  }
                  className={cn(
                    "flex-1 px-4 py-2 text-white font-medium rounded-xl transition-colors disabled:opacity-50",
                    modalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {processing === selectedApp.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : modalAction === "approve" ? (
                    "Confirm Approval"
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
