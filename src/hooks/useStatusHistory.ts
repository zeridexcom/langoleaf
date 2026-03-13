"use client";

import { useState, useCallback } from "react";

export interface StatusChange {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  reason?: string;
  createdAt: string;
  changedBy: {
    name: string;
    avatar?: string;
  };
}

interface UseStatusHistoryOptions {
  studentId: string;
}

export function useStatusHistory({ studentId }: UseStatusHistoryOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = useCallback(async (newStatus: string, reason?: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/students/${studentId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change status");
      }

      const data = await response.json();
      setError(null);
      return data.statusChange;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change status");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  return {
    changeStatus,
    loading,
    error,
  };
}
