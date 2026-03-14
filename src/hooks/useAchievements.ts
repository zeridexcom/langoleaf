"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAchievements,
  getUserAchievements,
  checkAndAwardAchievement,
  updateAchievementProgress,
  type Achievement,
  type UserAchievement,
} from "@/lib/services/gamification-service";

// Query keys
export const achievementKeys = {
  all: ["achievements"] as const,
  list: () => [...achievementKeys.all, "list"] as const,
  user: (userId?: string) => [...achievementKeys.all, "user", userId] as const,
};

/**
 * Hook to fetch all available achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: achievementKeys.list(),
    queryFn: getAchievements,
    staleTime: 10 * 60 * 1000, // 10 minutes - achievements don't change often
  });
}

/**
 * Hook to fetch user's achievements with progress
 */
export function useUserAchievements(userId?: string) {
  return useQuery({
    queryKey: achievementKeys.user(userId),
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      return getUserAchievements(userId || user.id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}



/**
 * Hook to check and award an achievement
 */
export function useCheckAndAwardAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ achievementCode }: { achievementCode: string }) => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      return checkAndAwardAchievement(user.id, achievementCode);
    },
    onSuccess: () => {
      // Invalidate user achievements
      queryClient.invalidateQueries({ queryKey: achievementKeys.user() });
      // Also invalidate gamification stats
      queryClient.invalidateQueries({ queryKey: ["gamification"] });
    },
  });
}

/**
 * Hook to update achievement progress
 */
export function useUpdateAchievementProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      achievementCode,
      progress,
    }: {
      achievementCode: string;
      progress: number;
    }) => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      return updateAchievementProgress(user.id, achievementCode, progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.user() });
      queryClient.invalidateQueries({ queryKey: ["gamification"] });
    },
  });
}

/**
 * Hook to get achievement statistics
 */
export function useAchievementStats() {
  return useQuery({
    queryKey: [...achievementKeys.all, "stats"],
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Get all achievements
      const allAchievements = await getAchievements();
      const userAchievements = await getUserAchievements(user.id);

      const completed = userAchievements.filter((ua) => ua.completedAt).length;
      const inProgress = userAchievements.filter((ua) => !ua.completedAt).length;
      const notStarted = allAchievements.length - completed - inProgress;

      // Calculate total coins earned from achievements
      const coinsEarned = userAchievements
        .filter((ua) => ua.completedAt && ua.coinRewardClaimed)
        .reduce((sum, ua) => sum + (ua.achievement?.coinReward || 0), 0);

      // Get recently completed achievements
      const recentlyCompleted = userAchievements
        .filter((ua) => ua.completedAt)
        .sort(
          (a, b) =>
            new Date(b.completedAt!).getTime() -
            new Date(a.completedAt!).getTime()
        )
        .slice(0, 5);

      // Get in-progress achievements
      const inProgressAchievements = userAchievements
        .filter((ua) => !ua.completedAt && ua.progress > 0)
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5);

      return {
        total: allAchievements.length,
        completed,
        inProgress,
        notStarted,
        completionRate:
          allAchievements.length > 0
            ? Math.round((completed / allAchievements.length) * 100)
            : 0,
        coinsEarned,
        recentlyCompleted,
        inProgressAchievements,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
