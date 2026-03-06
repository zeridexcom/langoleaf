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
    const statusConfig: Record<string, { icon: any; color: string; bgColor: string; message: string }> = {
      application_submitted: {
        icon: FileCheck,
        color: "text-[#22d3ee]",
        bgColor: "bg-[#22d3ee]/10",
        message: `Application submitted for ${app.student?.name || "Student"} - ${app.program}`,
      },
      documents_pending: {
        icon: AlertCircle,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        message: `Documents pending for ${app.student?.name || "Student"}`,
      },
      approved: {
        icon: CheckCircle,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        message: `Application approved for ${app.student?.name || "Student"} - ${app.university}`,
      },
      enrolled: {
        icon: Award,
        color: "text-[#fbbf24]",
        bgColor: "bg-[#fbbf24]/10",
        message: `Student enrolled: ${app.student?.name || "Student"}`,
      },
    };

    const config = statusConfig[app.status] || statusConfig.application_submitted;

    return {
      id: app.id,
      icon: config.icon,
      color: config.color,
      bgColor: config.bgColor,
      message: config.message,
      time: new Date(app.created_at).toLocaleDateString(),
    };
  });

  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Applications</h3>
        <a
          href="/applications"
          className="text-sm text-[#6d28d9] hover:text-[#a78bfa] transition-colors"
        >
          View All
        </a>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No applications yet</p>
          <a href="/students/add" className="text-[#6d28d9] hover:underline text-sm mt-2 inline-block">
            Add a student to get started
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#252542] transition-colors"
            >
              <div className={`p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">
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

