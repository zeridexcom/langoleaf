"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getLeaderboard,
  getUserRank,
  type LeaderboardEntry,
} from "@/lib/services/gamification-service";

// Query keys
export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (limit?: number) => [...leaderboardKeys.all, "list", limit] as const,
  userRank: () => [...leaderboardKeys.all, "userRank"] as const,
};

/**
 * Hook to fetch leaderboard with current user context
 */
export function useLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: leaderboardKeys.list(limit),
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const [leaderboard, userRank] = await Promise.all([
        getLeaderboard(limit),
        getUserRank(user.id),
      ]);

      return {
        leaderboard,
        userRank,
        currentUserId: user.id,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user's rank on leaderboard
 */
export function useUserRank() {
  return useQuery({
    queryKey: leaderboardKeys.userRank(),
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      return getUserRank(user.id);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch both leaderboard and user rank
 */
export function useLeaderboardWithUser(limit: number = 10) {
  const leaderboardQuery = useLeaderboard(limit);
  const userRankQuery = useUserRank();

  // Find user's entry in leaderboard
  const userEntry =
    leaderboardQuery.data?.leaderboard && leaderboardQuery.data?.userRank
      ? leaderboardQuery.data.leaderboard.find(
          (entry) => entry.rank === leaderboardQuery.data.userRank
        )
      : undefined;

  return {
    leaderboard: leaderboardQuery.data?.leaderboard,
    userRank: leaderboardQuery.data?.userRank,
    currentUserId: leaderboardQuery.data?.currentUserId,
    userEntry,
    isLoading: leaderboardQuery.isLoading,
    isError: leaderboardQuery.isError,
    error: leaderboardQuery.error,
  };
}
