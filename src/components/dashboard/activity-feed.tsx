"use client";

import { UserPlus, FileCheck, Coins, Award, AlertCircle, CheckCircle } from "lucide-react";
import { SectionPanel } from "@/components/ui/design-system";
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
    const statusConfig: Record<string, { icon: any; color: string; bgColor: string; borderColor: string; message: string }> = {
      application_submitted: {
        icon: FileCheck,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        message: `Application submitted for ${app.student?.name || "Student"} - ${app.program}`,
      },
      documents_pending: {
        icon: AlertCircle,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        message: `Documents pending for ${app.student?.name || "Student"}`,
      },
      approved: {
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        message: `Application approved for ${app.student?.name || "Student"} - ${app.university}`,
      },
      enrolled: {
        icon: Award,
        color: "text-primary",
        bgColor: "bg-primary/10",
        borderColor: "border-primary/30",
        message: `Student enrolled: ${app.student?.name || "Student"}`,
      },
    };

    const config = statusConfig[app.status] || statusConfig.application_submitted;

    return {
      id: app.id,
      icon: config.icon,
      color: config.color,
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      message: config.message,
      time: new Date(app.created_at).toLocaleDateString(),
    };
  });

  return (
    <SectionPanel 
      title="Activity Feed"
      action={
        <a
          href="/applications"
          className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-[0.2em]"
        >
          View All
        </a>
      }
    >

      {activities.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">No applications yet</p>
          <a href="/students/add" className="text-primary hover:text-primary/80 text-xs font-black mt-3 inline-block uppercase tracking-wider border border-primary px-4 py-2 hover:bg-primary/10 transition-colors rounded-lg">
            Add a student to get started
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 hover:border-primary/30 transition-all rounded-lg"
            >
              <div className={`p-2 border ${activity.bgColor} ${activity.borderColor} flex-shrink-0 rounded-lg`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
  );
}

