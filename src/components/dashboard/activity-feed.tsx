"use client";

import { UserPlus, FileCheck, Coins, Award, AlertCircle, CheckCircle } from "lucide-react";

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
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        message: `Application submitted for ${app.student?.name || "Student"} - ${app.program}`,
      },
      documents_pending: {
        icon: AlertCircle,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        message: `Documents pending for ${app.student?.name || "Student"}`,
      },
      approved: {
        icon: CheckCircle,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
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
    <div className="bg-dark-surface border-2 border-dark-border p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-white uppercase tracking-wide">Recent Applications</h3>
        <a
          href="/applications"
          className="text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
        >
          View All
        </a>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-dark-border">
          <p className="text-slate-400 text-sm font-medium">No applications yet</p>
          <a href="/students/add" className="text-primary hover:text-primary/80 text-xs font-black mt-3 inline-block uppercase tracking-wider border-2 border-primary px-4 py-2 hover:bg-primary/10 transition-colors">
            Add a student to get started
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-dark-elevated border-2 border-dark-border hover:border-primary/30 transition-all"
            >
              <div className={`p-2 border-2 ${activity.bgColor} ${activity.borderColor} flex-shrink-0`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{activity.message}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

