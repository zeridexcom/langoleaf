"use client";

import { FileCheck, Award, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Application {
  id: string;
  program: string;
  university: string;
  status: string;
  created_at: string;
  student?: {
    name: string;
  };
}

interface ActivityFeedProps {
  applications?: Application[];
}

export function ActivityFeed({ applications = [] }: ActivityFeedProps) {
  // Convert applications to activity items
  const activities = applications.slice(0, 5).map((app) => {
    const statusConfig: Record<string, { icon: any; style: string; message: string }> = {
      application_submitted: {
        icon: FileCheck,
        style: "status-submitted",
        message: `Application submitted for ${app.student?.name || "Student"} - ${app.program}`,
      },
      documents_pending: {
        icon: AlertCircle,
        style: "status-pending",
        message: `Documents pending for ${app.student?.name || "Student"}`,
      },
      approved: {
        icon: CheckCircle,
        style: "status-approved",
        message: `Application approved for ${app.student?.name || "Student"} - ${app.university}`,
      },
      enrolled: {
        icon: Award,
        style: "status-enrolled",
        message: `Student enrolled: ${app.student?.name || "Student"}`,
      },
    };

    const config = statusConfig[app.status] || statusConfig.application_submitted;

    return {
      id: app.id,
      icon: config.icon,
      style: config.style,
      message: config.message,
      time: new Date(app.created_at).toLocaleDateString(),
    };
  });

  return (
    <div className="bg-white border-2 border-black">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b-2 border-black">
        <div>
          <span className="text-[#FF3000] font-black text-xs tracking-widest uppercase block mb-1">05. Activity</span>
          <h3 className="text-lg font-black uppercase tracking-tight">Recent Activity</h3>
        </div>
        <a
          href="/applications"
          className="text-xs font-black uppercase tracking-widest text-black hover:text-[#FF3000] transition-colors flex items-center gap-1 group"
        >
          View All
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {/* Content */}
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-black">
            <p className="text-black/60 text-sm font-medium mb-4">No applications yet</p>
            <a 
              href="/students/add" 
              className="inline-flex items-center gap-2 bg-[#FF3000] text-white text-xs font-black uppercase tracking-widest border-2 border-[#FF3000] px-6 py-3 hover:bg-black hover:border-black transition-all duration-150"
            >
              Add Student
            </a>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-4 p-4 border-black hover:bg-[#F2F2F2] transition-all duration-150 group cursor-pointer",
                  index < activities.length - 1 && "border-b-2"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 border-2 flex items-center justify-center flex-shrink-0",
                  activity.style
                )}>
                  <activity.icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-black leading-tight mb-1">{activity.message}</p>
                  <p className="text-xs font-bold text-black/40 uppercase tracking-wider">
                    {activity.time}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-black/20 group-hover:text-[#FF3000] group-hover:translate-x-1 transition-all duration-150 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

