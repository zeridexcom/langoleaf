"use client";

import { useState } from "react";
import { X, AlertTriangle, User, Mail, Phone, Calendar, Eye, GitMerge, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DuplicateStudent } from "@/hooks/useDuplicateCheck";
import { formatDistanceToNow } from "date-fns";

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onView: (studentId: string) => void;
  onMerge: (studentId: string) => void;
  onCancel: () => void;
  emailDuplicate: DuplicateStudent | null;
  phoneDuplicate: DuplicateStudent | null;
  nameMatches: DuplicateStudent[];
}

export function DuplicateWarningModal({
  isOpen,
  onClose,
  onView,
  onMerge,
  onCancel,
  emailDuplicate,
  phoneDuplicate,
  nameMatches,
}: DuplicateWarningModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<DuplicateStudent | null>(null);

  if (!isOpen) return null;

  const allDuplicates = [
    ...(emailDuplicate ? [{ ...emailDuplicate, matchType: "Email" as const }] : []),
    ...(phoneDuplicate ? [{ ...phoneDuplicate, matchType: "Phone" as const }] : []),
    ...nameMatches.map(m => ({ ...m, matchType: "Name" as const })),
  ];

  // Remove duplicates based on student ID
  const uniqueDuplicates = allDuplicates.filter((student, index, self) =>
    index === self.findIndex((s) => s.id === student.id)
  );

  const handleView = () => {
    if (selectedStudent || uniqueDuplicates.length === 1) {
      const student = selectedStudent || uniqueDuplicates[0];
      onView(student.id);
      onClose();
    }
  };

  const handleMerge = () => {
    if (selectedStudent || uniqueDuplicates.length === 1) {
      const student = selectedStudent || uniqueDuplicates[0];
      onMerge(student.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                Potential Duplicate Student Found
              </h2>
              <p className="text-gray-600 mt-1">
                We found existing student(s) that match the information you entered. Please review before proceeding.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {uniqueDuplicates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No duplicates found.</p>
          ) : (
            <div className="space-y-3">
              {uniqueDuplicates.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            student.matchType === "Email" 
                              ? "bg-red-100 text-red-700"
                              : student.matchType === "Phone"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {student.matchType} Match
                            {student.similarity && student.similarity < 100 && ` (${student.similarity}%)`}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            student.status === "enrolled" 
                              ? "bg-emerald-100 text-emerald-700"
                              : student.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {student.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Added {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    {student.program && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{student.program}</span>
                      </div>
                    )}
                    {student.university && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-gray-400">@</span>
                        <span className="truncate">{student.university}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel & Edit
            </Button>
            
            {uniqueDuplicates.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleView}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Student
                </Button>
                
                <Button
                  onClick={handleMerge}
                  className="flex-1"
                >
                  <GitMerge className="w-4 h-4 mr-2" />
                  Update Existing
                </Button>
              </>
            )}
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Click on a student card to select it before viewing or merging
          </p>
        </div>
      </div>
    </div>
  );
}
