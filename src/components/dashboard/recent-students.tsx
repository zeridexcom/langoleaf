"use client";

import { User, ChevronRight } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface RecentStudentsProps {
  students?: Student[];
}

const statusStyles: Record<string, string> = {
  lead: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  application_submitted: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  documents_pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  under_review: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  enrolled: "bg-[#6d28d9]/20 text-[#a78bfa] border border-[#6d28d9]/30",
  rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const statusLabels: Record<string, string> = {
  lead: "Lead",
  application_submitted: "Submitted",
  documents_pending: "Docs Pending",
  under_review: "Under Review",
  approved: "Approved",
  enrolled: "Enrolled",
  rejected: "Rejected",
};

export function RecentStudents({ students = [] }: RecentStudentsProps) {
  const displayStudents = students.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2d2d4a] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Students</h3>
        <a
          href="/students"
          className="text-sm text-[#6d28d9] hover:text-[#a78bfa] flex items-center gap-1 transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {displayStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No students added yet</p>
          <a href="/students/add" className="text-[#6d28d9] hover:underline text-sm mt-2 inline-block">
            Add your first student
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {displayStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#252542] rounded-xl hover:bg-gray-100 dark:hover:bg-[#2d2d4a] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#6d28d9]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[#6d28d9]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {student.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {student.email}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[student.status] || statusStyles.lead}`}
                >
                  {statusLabels[student.status] || "Lead"}
                </span>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(student.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
