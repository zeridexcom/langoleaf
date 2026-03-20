"use client";

import { useState } from "react";
import { AdminLayout } from "./admin-layout";
import { useActivityFeed } from "@/hooks/useAdminRealtime";
import {
  Activity,
  User,
  FileText,
  GraduationCap,
  MessageSquare,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityFeedPage() {
  const { activities, loading, refresh } = useActivityFeed();
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.action.includes(filter);
  });

  const getActionIcon = (action: string) => {
    if (action.includes("application")) return FileText;
    if (action.includes("document")) return Upload;
    if (action.includes("student")) return GraduationCap;
    if (action.includes("freelancer")) return User;
    if (action.includes("message") || action.includes("ticket"))
      return MessageSquare;
    if (action.includes("approved") || action.includes("resolved"))
      return CheckCircle;
    if (action.includes("rejected")) return XCircle;
    return Activity;
  };

  const getActionColor = (action: string) => {
    if (action.includes("approved") || action.includes("resolved"))
      return "text-green-500 bg-green-50";
    if (action.includes("rejected")) return "text-red-500 bg-red-50";
    if (action.includes("application")) return "text-blue-500 bg-blue-50";
    if (action.includes("document")) return "text-purple-500 bg-purple-50";
    if (action.includes("student")) return "text-orange-500 bg-orange-50";
    if (action.includes("freelancer")) return "text-cyan-500 bg-cyan-50";
    return "text-gray-500 bg-gray-50";
  };

  const getActionText = (action: string): string => {
    const actions: Record<string, string> = {
      application_submitted: "submitted an application",
      application_approved: "approved an application",
      application_rejected: "rejected an application",
      document_uploaded: "uploaded a document",
      document_approved: "approved a document",
      document_rejected: "rejected a document",
      freelancer_registered: "registered as a freelancer",
      student_added: "added a new student",
      student_transferred: "transferred a student",
      status_changed: "changed status",
      message_sent: "sent a message",
      ticket_created: "created a support ticket",
      ticket_resolved: "resolved a support ticket",
    };
    return actions[action] || action.replace(/_/g, " ");
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Activity Feed
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Real-time activity from all users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-green-500 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Updates
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 text-gray-600 dark:text-gray-300",
                  refreshing && "animate-spin"
                )}
              />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Activity" },
            { value: "application", label: "Applications" },
            { value: "document", label: "Documents" },
            { value: "student", label: "Students" },
            { value: "freelancer", label: "Freelancers" },
            { value: "message", label: "Messages" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl transition-colors",
                filter === option.value
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Activity List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <p className="text-sm text-gray-500 mt-3">
                Loading activity feed...
              </p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No activity found</p>
              <p className="text-sm mt-1">
                {filter !== "all"
                  ? "Try selecting a different filter"
                  : "Activity will appear here as users interact with the system"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredActivities.map((activity, index) => {
                const Icon = getActionIcon(activity.action);
                const colorClass = getActionColor(activity.action);

                return (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          colorClass
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">
                                {activity.user_name ||
                                  activity.user_email ||
                                  "System"}
                              </span>
                              <span className="text-gray-500 ml-1">
                                {getActionText(activity.action)}
                              </span>
                            </p>
                            {activity.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatTime(activity.created_at)}
                          </div>
                        </div>

                        {/* Metadata */}
                        {activity.metadata &&
                          Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(activity.metadata).map(
                                ([key, value]) => {
                                  if (
                                    !value ||
                                    typeof value === "object" ||
                                    key === "id"
                                  )
                                    return null;
                                  return (
                                    <span
                                      key={key}
                                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                                    >
                                      {key.replace(/_/g, " ")}: {String(value)}
                                    </span>
                                  );
                                }
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredActivities.length >= 50 && (
          <div className="text-center">
            <button className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Load More
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
