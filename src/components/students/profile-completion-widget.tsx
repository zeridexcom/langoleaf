"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  BookOpen,
  Building2,
  Calendar,
  MapPin,
  GraduationCap,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ProfileField {
  name: string;
  label: string;
  icon: React.ElementType;
  isComplete: boolean;
  isRequired: boolean;
}

interface ProfileCompletionWidgetProps {
  student: {
    full_name?: string;
    email?: string;
    phone?: string;
    program?: string;
    university?: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    previous_education?: string;
    avatar_url?: string;
    profile_completion?: number;
  };
  documentsCount: number;
  onEdit: () => void;
}

export function ProfileCompletionWidget({ 
  student, 
  documentsCount,
  onEdit 
}: ProfileCompletionWidgetProps) {
  const [showDetails, setShowDetails] = useState(false);

  const fields: ProfileField[] = [
    { name: "name", label: "Full Name", icon: User, isComplete: !!student.full_name, isRequired: true },
    { name: "email", label: "Email", icon: Mail, isComplete: !!student.email, isRequired: true },
    { name: "phone", label: "Phone", icon: Phone, isComplete: !!student.phone, isRequired: true },
    { name: "program", label: "Program", icon: BookOpen, isComplete: !!student.program, isRequired: true },
    { name: "university", label: "University", icon: Building2, isComplete: !!student.university, isRequired: true },
    { name: "date_of_birth", label: "Date of Birth", icon: Calendar, isComplete: !!student.date_of_birth, isRequired: false },
    { name: "address", label: "Address", icon: MapPin, isComplete: !!(student.address && student.city && student.state), isRequired: false },
    { name: "previous_education", label: "Previous Education", icon: GraduationCap, isComplete: !!student.previous_education, isRequired: false },
    { name: "avatar", label: "Profile Photo", icon: User, isComplete: !!student.avatar_url, isRequired: false },
    { name: "documents", label: "Documents", icon: FileText, isComplete: documentsCount > 0, isRequired: false },
  ];

  const completionPercentage = student.profile_completion || 0;
  const completedFields = fields.filter(f => f.isComplete).length;
  const totalFields = fields.length;
  const missingRequiredFields = fields.filter(f => f.isRequired && !f.isComplete);
  const missingOptionalFields = fields.filter(f => !f.isRequired && !f.isComplete);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 30) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Profile Completion
        </h3>
        <span className={cn(
          "text-lg font-bold",
          completionPercentage >= 80 ? "text-emerald-600" :
          completionPercentage >= 50 ? "text-blue-600" :
          completionPercentage >= 30 ? "text-amber-600" : "text-red-600"
        )}>
          {completionPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div 
          className={cn("h-full transition-all duration-500", getProgressColor(completionPercentage))}
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-600 mb-4">
        {completedFields} of {totalFields} fields completed
        {missingRequiredFields.length > 0 && (
          <span className="text-red-600 block mt-1">
            {missingRequiredFields.length} required fields missing
          </span>
        )}
      </p>

      {/* Missing Fields Details */}
      {(missingRequiredFields.length > 0 || missingOptionalFields.length > 0) && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-3"
        >
          {showDetails ? (
            <>Hide details <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Show missing fields <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}

      {showDetails && (
        <div className="space-y-2 mb-4">
          {missingRequiredFields.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Required</p>
              {missingRequiredFields.map(field => (
                <div key={field.name} className="flex items-center gap-2 text-sm text-gray-700">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <field.icon className="w-4 h-4 text-gray-400" />
                  {field.label}
                </div>
              ))}
            </div>
          )}
          
          {missingOptionalFields.length > 0 && (
            <div className="space-y-1 mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Optional</p>
              {missingOptionalFields.slice(0, 3).map(field => (
                <div key={field.name} className="flex items-center gap-2 text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-gray-300" />
                  <field.icon className="w-4 h-4 text-gray-400" />
                  {field.label}
                </div>
              ))}
              {missingOptionalFields.length > 3 && (
                <p className="text-xs text-gray-400 pl-6">
                  +{missingOptionalFields.length - 3} more
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Complete Button */}
      {completionPercentage < 100 && (
        <button
          onClick={onEdit}
          className="w-full py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          Complete Profile
        </button>
      )}

      {completionPercentage === 100 && (
        <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          Profile Complete!
        </div>
      )}
    </div>
  );
}
