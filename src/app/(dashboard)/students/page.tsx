"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus, MoreVertical, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

const statusStyles: Record<string, string> = {
  application_submitted: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  documents_pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  under_review: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  enrolled: "bg-[#6d28d9]/20 text-[#a78bfa] border border-[#6d28d9]/30",
  rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const statusLabels: Record<string, string> = {
  application_submitted: "Submitted",
  documents_pending: "Docs Pending",
  under_review: "Under Review",
  approved: "Approved",
  enrolled: "Enrolled",
  rejected: "Rejected",
};

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from("students")
          .select("*, applications(*)")
          .eq("freelancer_id", user.id)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setStudents(data || []);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.university?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d28d9]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-gray-400">Manage your students and their applications</p>
        </div>
        <a
          href="/students/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6d28d9] text-white rounded-xl hover:bg-[#6d28d9]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Student
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
        >
          <option value="all">All Status</option>
          <option value="application_submitted">Submitted</option>
          <option value="documents_pending">Docs Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="enrolled">Enrolled</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d4a]">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Student</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Program</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">University</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No students found. Add your first student to get started!
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-[#2d2d4a] last:border-0 hover:bg-[#252542]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#6d28d9]/20 flex items-center justify-center">
                          <span className="text-[#6d28d9] font-medium">
                            {student.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{student.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{student.program}</td>
                    <td className="px-6 py-4 text-sm text-white">{student.university}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[student.status] || statusStyles.application_submitted}`}
                      >
                        {statusLabels[student.status] || "Submitted"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-[#252542] rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

