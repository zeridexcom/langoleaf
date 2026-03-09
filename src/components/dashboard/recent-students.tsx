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
  lead: "bg-slate-700/50 text-slate-400 border-2 border-slate-600",
  application_submitted: "bg-blue-500/20 text-blue-400 border-2 border-blue-500/50",
  documents_pending: "bg-amber-500/20 text-amber-400 border-2 border-amber-500/50",
  under_review: "bg-primary/20 text-primary border-2 border-primary/50",
  approved: "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50",
  enrolled: "bg-primary/20 text-primary border-2 border-primary/50",
  rejected: "bg-red-500/20 text-red-400 border-2 border-red-500/50",
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
    <div className="bg-dark-surface border-2 border-dark-border p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-white uppercase tracking-wide">Recent Students</h3>
        <a
          href="/students"
          className="text-xs font-black text-primary hover:text-primary/80 flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {displayStudents.length === 0 ? (
        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-dark-border">
          <p className="font-medium">No students added yet</p>
          <a href="/students/add" className="text-primary hover:text-primary/80 text-xs font-black mt-3 inline-block uppercase tracking-wider border-2 border-primary px-4 py-2 hover:bg-primary/10 transition-colors">
            Add your first student
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {displayStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 bg-dark-elevated border-2 border-dark-border hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 bg-primary/10 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white truncate">
                  {student.name}
                </h4>
                <p className="text-xs text-slate-400 truncate font-medium">
                  {student.email}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyles[student.status] || statusStyles.lead}`}
                >
                  {statusLabels[student.status] || "Lead"}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
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

