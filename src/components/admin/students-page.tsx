"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import {
  GraduationCap,
  Search,
  User,
  Mail,
  Phone,
  Building2,
  BookOpen,
  Clock,
  ArrowRightLeft,
  Loader2,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Student {
  id: string;
  freelancer_id: string;
  freelancer_name: string | null;
  freelancer_email: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  program: string | null;
  university: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Freelancer {
  id: string;
  email: string;
  full_name: string | null;
}

export function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTo, setTransferTo] = useState<string>("");
  const [transferReason, setTransferReason] = useState("");
  const [transferring, setTransferring] = useState(false);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      // Fetch students with freelancer info
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(
          `
          *,
          freelancer:profiles!students_freelancer_id_fkey(id, full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      const formatted = (studentsData || []).map((s: any) => ({
        ...s,
        freelancer_name: s.freelancer?.full_name,
        freelancer_email: s.freelancer?.email,
      }));

      setStudents(formatted);

      // Fetch freelancers for transfer dropdown
      const { data: freelancersData } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("role", "freelancer");

      setFreelancers(freelancersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("students-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTransfer = async () => {
    if (!selectedStudent || !transferTo) {
      toast.error("Please select a freelancer to transfer to");
      return;
    }

    if (transferTo === selectedStudent.freelancer_id) {
      toast.error("Student is already assigned to this freelancer");
      return;
    }

    setTransferring(true);
    try {
      // Update student
      const { error: updateError } = await supabase
        .from("students")
        .update({
          freelancer_id: transferTo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedStudent.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from("activity_feed").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: "student_transferred",
        entity_type: "student",
        entity_id: selectedStudent.id,
        description: `Transferred ${selectedStudent.name} to another freelancer`,
        metadata: {
          from_freelancer: selectedStudent.freelancer_id,
          to_freelancer: transferTo,
          reason: transferReason,
        },
      });

      // Notify old freelancer
      await supabase.from("notifications").insert({
        freelancer_id: selectedStudent.freelancer_id,
        type: "student_transferred",
        title: "Student Transferred",
        message: `${selectedStudent.name} has been transferred to another freelancer. ${transferReason ? `Reason: ${transferReason}` : ""}`,
        data: {
          student_id: selectedStudent.id,
          student_name: selectedStudent.name,
        },
      });

      // Notify new freelancer
      await supabase.from("notifications").insert({
        freelancer_id: transferTo,
        type: "student_assigned",
        title: "New Student Assigned",
        message: `${selectedStudent.name} has been assigned to you.`,
        data: {
          student_id: selectedStudent.id,
          student_name: selectedStudent.name,
        },
      });

      toast.success("Student transferred successfully");
      setShowTransferModal(false);
      setSelectedStudent(null);
      setTransferTo("");
      setTransferReason("");
      fetchData();
    } catch (error) {
      console.error("Error transferring student:", error);
      toast.error("Failed to transfer student");
    } finally {
      setTransferring(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-green-100 text-green-700";
      case "approved":
        return "bg-blue-100 text-blue-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "under_review":
        return "bg-purple-100 text-purple-700";
      case "documents_pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusCounts = {
    all: students.length,
    application_submitted: students.filter((s) => s.status === "application_submitted").length,
    documents_pending: students.filter((s) => s.status === "documents_pending").length,
    under_review: students.filter((s) => s.status === "under_review").length,
    approved: students.filter((s) => s.status === "approved").length,
    enrolled: students.filter((s) => s.status === "enrolled").length,
    rejected: students.filter((s) => s.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Students
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage all students across freelancers
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {students.length} total students
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl w-fit border border-gray-200/50 dark:border-gray-700/50">
          {[
            { value: "all", label: "All" },
            { value: "application_submitted", label: "Submitted" },
            { value: "documents_pending", label: "Docs Pending" },
            { value: "under_review", label: "Under Review" },
            { value: "approved", label: "Approved" },
            { value: "enrolled", label: "Enrolled" },
            { value: "rejected", label: "Rejected" },
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
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
          />
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-gray-900 dark:text-white">No students found</p>
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
                      Date
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                              {student.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                              {student.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {student.email}
                                </span>
                              )}
                            </div>
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
                              {student.program || "N/A"}
                            </p>
                            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{student.university || "N/A"}</span>
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
                              {student.freelancer_name || "Unknown"}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-gray-400">
                              {student.freelancer_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg",
                            getStatusColor(student.status)
                          )}
                        >
                          {student.status?.replace("_", " ") || "submitted"}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-500">
                        {new Date(student.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setShowTransferModal(true);
                          }}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Transfer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Transfer Student
            </h3>

            <div className="space-y-4">
              {/* Current Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                  Current Assignment
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedStudent.name}
                </p>
                <p className="text-sm text-gray-500">
                  Assigned to: {selectedStudent.freelancer_name || "Unknown"}
                </p>
              </div>

              {/* New Freelancer Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transfer to
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a freelancer</option>
                  {freelancers
                    .filter((f) => f.id !== selectedStudent.freelancer_id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.full_name || f.email}
                      </option>
                    ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Enter reason for transfer..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedStudent(null);
                  setTransferTo("");
                  setTransferReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferring || !transferTo}
                className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {transferring ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Confirm Transfer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
