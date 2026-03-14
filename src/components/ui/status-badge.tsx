"use client";

import { cn } from "@/lib/utils/cn";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "dot";
  className?: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  // Student statuses
  lead: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Lead" },
  prospect: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Prospect" },
  active: { color: "bg-green-100 text-green-700 border-green-200", label: "Active" },
  inactive: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Inactive" },
  converted: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Converted" },
  
  // Application statuses
  draft: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Draft" },
  submitted: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Submitted" },
  under_review: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Under Review" },
  documents_pending: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Documents Pending" },
  interview_scheduled: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Interview Scheduled" },
  interview_completed: { color: "bg-cyan-100 text-cyan-700 border-cyan-200", label: "Interview Completed" },
  offer_received: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Offer Received" },
  offer_accepted: { color: "bg-green-100 text-green-700 border-green-200", label: "Offer Accepted" },
  offer_rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Offer Rejected" },
  visa_applied: { color: "bg-violet-100 text-violet-700 border-violet-200", label: "Visa Applied" },
  visa_approved: { color: "bg-green-100 text-green-700 border-green-200", label: "Visa Approved" },
  visa_rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Visa Rejected" },
  enrolled: { color: "bg-primary/10 text-primary border-primary/20", label: "Enrolled" },
  withdrawn: { color: "bg-gray-100 text-gray-500 border-gray-200", label: "Withdrawn" },
  
  // Document statuses
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Pending" },
  uploaded: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Uploaded" },
  verified: { color: "bg-green-100 text-green-700 border-green-200", label: "Verified" },
  rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
  expired: { color: "bg-gray-100 text-gray-500 border-gray-200", label: "Expired" },
  
  // Generic
  success: { color: "bg-green-100 text-green-700 border-green-200", label: "Success" },
  error: { color: "bg-red-100 text-red-700 border-red-200", label: "Error" },
  warning: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Warning" },
  info: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Info" },
};

export function StatusBadge({ 
  status, 
  size = "md", 
  variant = "default",
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.info;
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  if (variant === "dot") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("w-2 h-2 rounded-full", config.color.split(" ")[0])} />
        <span className="text-sm text-gray-700">{config.label}</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizeClasses[size],
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}

// Status progress bar for applications
interface StatusProgressProps {
  currentStatus: string;
  className?: string;
}

const applicationFlow = [
  "draft",
  "submitted",
  "under_review",
  "documents_pending",
  "interview_scheduled",
  "interview_completed",
  "offer_received",
  "offer_accepted",
  "visa_applied",
  "visa_approved",
  "enrolled",
];

export function StatusProgress({ currentStatus, className }: StatusProgressProps) {
  const currentIndex = applicationFlow.indexOf(currentStatus.toLowerCase());
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / applicationFlow.length) * 100 : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
