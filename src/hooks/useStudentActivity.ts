"use client";

import { useState, useEffect, useCallback } from "react";

export interface ActivityItem {
  id: string;
  type: "status_change" | "document_upload" | "note_added" | "profile_update" | "application_created";
  title: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface UseStudentActivityOptions {
  studentId: string;
  limit?: number;
  type?: string;
}

export function useStudentActivity({ studentId, limit = 10, type }: UseStudentActivityOptions) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchActivities = useCallback(async (reset = false) => {
    if (!studentId) return;

    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });
      
      if (type) params.append("type", type);

      const response = await fetch(`/api/students/${studentId}/activity?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      
      if (reset) {
        setActivities(data.activities);
        setOffset(limit);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
        setOffset(currentOffset + limit);
      }
      
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [studentId, limit, type, offset]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(false);
    }
  }, [loading, hasMore, fetchActivities]);

  const refresh = useCallback(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities(true);
  }, [studentId, type]);

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
