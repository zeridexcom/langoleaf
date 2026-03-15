"use client";

import { Mail, Phone, MapPin, Calendar, Tag } from "lucide-react";
import { Student } from "@/hooks/useStudents";

interface StudentGridProps {
  student: Student;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const statusStyles: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700",
  application_submitted: "bg-blue-100 text-blue-700",
  documents_pending: "bg-amber-100 text-amber-700",
  under_review: "bg-primary/10 text-primary",
  approved: "bg-emerald-100 text-emerald-700",
  enrolled: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
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

export function StudentGrid({ student, isSelected, onSelect }: StudentGridProps) {
  return (
    <a
      href={`/students/${student.id}`}
      className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all block"
    >
      {/* Header with avatar and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(e.target.checked);
              }}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          )}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium">
              {student.full_name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[student.status] || statusStyles.lead}`}
        >
          {statusLabels[student.status] || "Lead"}
        </span>
      </div>

      {/* Name and Email */}
      <h3 className="font-medium text-gray-900 mb-1 truncate">{student.full_name}</h3>
      <p className="text-sm text-gray-500 mb-3 truncate">{student.email}</p>

      {/* Quick Info */}
      <div className="space-y-1.5 mb-3">
        {student.program && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="text-gray-400">Program:</span>
            <span className="truncate">{student.program}</span>
          </div>
        )}
        {student.university && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="text-gray-400">Uni:</span>
            <span className="truncate">{student.university}</span>
          </div>
        )}
        {student.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{student.phone}</span>
          </div>
        )}
      </div>

      {/* Tags - Compact */}
      {student.tags && student.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {student.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {student.tags.length > 2 && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              +{student.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {new Date(student.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        {student.profile_completion !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${student.profile_completion}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{student.profile_completion}%</span>
          </div>
        )}
      </div>
    </a>
  );
}
