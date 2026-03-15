"use client";

import { Mail, Phone, Calendar, Tag, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { Student } from "@/hooks/useStudents";

interface StudentCardProps {
  student: Student;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onDelete?: () => void;
}

const statusStyles: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700 border border-gray-200",
  application_submitted: "bg-blue-100 text-blue-700 border border-blue-200",
  documents_pending: "bg-amber-100 text-amber-700 border border-amber-200",
  under_review: "bg-primary/10 text-primary border border-primary/20",
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  enrolled: "bg-purple-100 text-purple-700 border border-purple-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
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

export function StudentCard({ student, isSelected, onSelect, onDelete }: StudentCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header with checkbox and status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          )}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-lg">
              {student.name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[student.status] || statusStyles.lead}`}
        >
          {statusLabels[student.status] || "Lead"}
        </span>
      </div>

      {/* Student Info */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-1">{student.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Mail className="w-3.5 h-3.5" />
          {student.email}
        </div>
        {student.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="w-3.5 h-3.5" />
            {student.phone}
          </div>
        )}
      </div>

      {/* Program & University */}
      {(student.program || student.university) && (
        <div className="mb-4 space-y-1">
          {student.program && (
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Program:</span> {student.program}
            </p>
          )}
          {student.university && (
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">University:</span> {student.university}
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      {student.tags && student.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {student.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {student.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{student.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(student.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1">
          <a
            href={`/students/${student.id}`}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </a>
          <a
            href={`/students/${student.id}/edit`}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-gray-500" />
          </a>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
