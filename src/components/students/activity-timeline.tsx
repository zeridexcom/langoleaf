"use client";

import { useState } from "react";
import { 
  RefreshCw, 
  ChevronDown, 
  FileText, 
  MessageSquare, 
  User, 
  CheckCircle, 
  Upload,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useStudentActivity, ActivityItem } from "@/hooks/useStudentActivity";
import { cn } from "@/lib/utils/cn";

interface ActivityTimelineProps {
  studentId: string;
}

const activityIcons: Record<string, React.ElementType> = {
  status_change: CheckCircle,
  document_upload: Upload,
  note_added: MessageSquare,
  profile_update: User,
  application_created: FileText,
};

const activityColors: Record<string, { bg: string; text: string; border: string }> = {
  status_change: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  document_upload: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  note_added: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  profile_update: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  application_created: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
};

const activityTypeLabels: Record<string, string> = {
  status_change: "Status Changes",
  document_upload: "Document Uploads",
  note_added: "Notes Added",
  profile_update: "Profile Updates",
  application_created: "Applications",
};

export function ActivityTimeline({ studentId }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    activities, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = useStudentActivity({ 
    studentId, 
    limit: 10,
    type: filter || undefined,
  });

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter === filter ? "" : newFilter);
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={refresh}
            className="text-primary hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showFilters ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-500"
            )}
            title="Filter activities"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={refresh}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
          {Object.entries(activityTypeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filter === type
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {label}
            </button>
          ))}
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No activities recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <ActivityItemComponent 
              key={activity.id} 
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full mt-4 py-2 text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1 transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          ) : (
            <>
              Load more
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ActivityItemComponent({ 
  activity, 
  isLast 
}: { 
  activity: ActivityItem; 
  isLast: boolean;
}) {
  const Icon = activityIcons[activity.type] || FileText;
  const colors = activityColors[activity.type] || activityColors.application_created;

  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2",
          colors.bg,
          colors.text,
          colors.border
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 my-2"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </span>
        </div>
        
        {activity.user && (
          <div className="flex items-center gap-2 mt-2">
            {activity.user.avatar ? (
              <img
                src={activity.user.avatar}
                alt={activity.user.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                {activity.user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-500">{activity.user.name}</span>
          </div>
        )}

        {activity.metadata?.reason && (
          <p className="text-sm text-gray-500 mt-2 italic">
            Reason: {activity.metadata.reason}
          </p>
        )}
      </div>
    </div>
  );
}
