"use client";

import { User, ChevronRight } from "lucide-react";
import { SectionPanel } from "@/components/ui/design-system";
import { cn } from "@/lib/utils/cn";

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
  lead: "bg-gray-100 text-gray-600 border border-gray-300",
  application_submitted: "bg-blue-50 text-blue-600 border border-blue-200",
  documents_pending: "bg-amber-50 text-amber-600 border border-amber-200",
  under_review: "bg-primary/10 text-primary border border-primary/30",
  approved: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  enrolled: "bg-primary/10 text-primary border border-primary/30",
  rejected: "bg-red-50 text-red-600 border border-red-200",
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
    <SectionPanel 
      title="Recent Students" 
      action={
        <a
          href="/students"
          className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-1 transition-colors uppercase tracking-[0.2em]"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </a>
      }
    >

      {displayStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
          <p className="font-medium">No students added yet</p>
          <a href="/students/add" className="text-primary hover:text-primary/80 text-xs font-black mt-3 inline-block uppercase tracking-wider border border-primary px-4 py-2 hover:bg-primary/10 transition-colors rounded-lg">
            Add your first student
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {displayStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 hover:border-primary/30 transition-all rounded-lg"
            >
              <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-gray-900 truncate">
                  {student.name}
                </h4>
                <p className="text-xs text-gray-500 truncate font-medium">
                  {student.email}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${statusStyles[student.status] || statusStyles.lead}`}
                >
                  {statusLabels[student.status] || "Lead"}
                </span>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  {new Date(student.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
  );
}

