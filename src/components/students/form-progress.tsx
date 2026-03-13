"use client";

import { useMemo } from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FormSection {
  id: string;
  title: string;
  required: string[];
  optional?: string[];
}

interface FormProgressProps {
  formData: Record<string, any>;
  sections: FormSection[];
  className?: string;
  showSectionProgress?: boolean;
}

export function FormProgress({
  formData,
  sections,
  className,
  showSectionProgress = true,
}: FormProgressProps) {
  const calculateProgress = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    sections.forEach((section) => {
      // Count required fields
      section.required.forEach((field) => {
        totalRequired++;
        const value = formData[field];
        if (isFieldFilled(value)) {
          filledRequired++;
        }
      });

      // Count optional fields
      section.optional?.forEach((field) => {
        totalOptional++;
        const value = formData[field];
        if (isFieldFilled(value)) {
          filledOptional++;
        }
      });
    });

    const requiredProgress = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
    const optionalProgress = totalOptional > 0 ? (filledOptional / totalOptional) * 100 : 0;
    const overallProgress = (requiredProgress * 0.7) + (optionalProgress * 0.3);

    return {
      overall: Math.round(overallProgress),
      required: {
        total: totalRequired,
        filled: filledRequired,
        percentage: Math.round(requiredProgress),
      },
      optional: {
        total: totalOptional,
        filled: filledOptional,
        percentage: Math.round(optionalProgress),
      },
    };
  }, [formData, sections]);

  const sectionProgress = useMemo(() => {
    return sections.map((section) => {
      const requiredFilled = section.required.filter((field) =>
        isFieldFilled(formData[field])
      ).length;
      const optionalFilled = (section.optional || []).filter((field) =>
        isFieldFilled(formData[field])
      ).length;

      const totalFields = section.required.length + (section.optional?.length || 0);
      const filledFields = requiredFilled + optionalFilled;
      const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

      const isComplete = requiredFilled === section.required.length;

      return {
        ...section,
        requiredFilled,
        optionalFilled,
        totalFields,
        filledFields,
        percentage,
        isComplete,
      };
    });
  }, [formData, sections]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-amber-500";
    return "bg-red-500";
  };

  const getProgressText = (percentage: number) => {
    if (percentage >= 80) return "Almost done!";
    if (percentage >= 50) return "Good progress";
    if (percentage >= 25) return "Getting started";
    return "Just started";
  };

  return (
    <div className={cn("bg-white border border-gray-200 rounded-2xl p-6", className)}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Form Completion</h3>
          <span className="text-2xl font-bold text-primary">
            {calculateProgress.overall}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              getProgressColor(calculateProgress.overall)
            )}
            style={{ width: `${calculateProgress.overall}%` }}
          />
        </div>

        <p className="text-sm text-gray-500 mt-2">
          {getProgressText(calculateProgress.overall)} •{" "}
          {calculateProgress.required.filled} of {calculateProgress.required.total} required fields
          {calculateProgress.optional.filled > 0 &&
            ` • ${calculateProgress.optional.filled} optional`}
        </p>
      </div>

      {/* Section Progress */}
      {showSectionProgress && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Sections</h4>
          {sectionProgress.map((section) => (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                section.isComplete ? "bg-emerald-50" : "bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  section.isComplete
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {section.isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">
                    {section.requiredFilled}/{section.required.length}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "font-medium text-sm truncate",
                      section.isComplete ? "text-emerald-900" : "text-gray-700"
                    )}
                  >
                    {section.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      section.isComplete ? "text-emerald-600" : "text-gray-500"
                    )}
                  >
                    {section.percentage}%
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      section.isComplete ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{ width: `${section.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing Required Fields Alert */}
      {calculateProgress.required.percentage < 100 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Please fill in all required fields to complete the form.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to check if a field is filled
function isFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "boolean") return true;
  return true;
}

// Predefined sections for student form
export const STUDENT_FORM_SECTIONS: FormSection[] = [
  {
    id: "personal",
    title: "Personal Information",
    required: ["firstName", "lastName", "email", "phone"],
    optional: ["dateOfBirth", "gender", "nationality", "avatarUrl"],
  },
  {
    id: "contact",
    title: "Contact Details",
    required: [],
    optional: ["address", "city", "state", "pincode"],
  },
  {
    id: "emergency",
    title: "Emergency Contact",
    required: [],
    optional: ["emergencyContactName", "emergencyContactPhone", "emergencyContactRelation"],
  },
  {
    id: "academic",
    title: "Academic Information",
    required: ["program", "university"],
    optional: ["previousEducation"],
  },
  {
    id: "work",
    title: "Work Experience",
    required: [],
    optional: ["workExperience"],
  },
  {
    id: "additional",
    title: "Additional Information",
    required: [],
    optional: ["source", "tags"],
  },
];
