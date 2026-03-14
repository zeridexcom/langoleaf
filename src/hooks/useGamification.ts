"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGamificationStats,
  getTransactionHistory,
  awardCoins,
  spendCoins,
  type AwardCoinsInput,
  type CoinTransaction,
} from "@/lib/services/gamification-service";

// Query keys
export const gamificationKeys = {
  all: ["gamification"] as const,
  stats: () => [...gamificationKeys.all, "stats"] as const,
  transactions: (filters?: { type?: string; limit?: number }) =>
    [...gamificationKeys.all, "transactions", filters] as const,
};

/**
 * Hook to fetch user's gamification stats
 */
export function useGamificationStats() {
  return useQuery({
    queryKey: gamificationKeys.stats(),
    queryFn: async () => {
      // Get current user
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      return getGamificationStats(user.id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch transaction history
 */
export function useTransactionHistory(options: {
  type?: "earned" | "spent" | "bonus" | "refund";
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: gamificationKeys.transactions(options),
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      return getTransactionHistory(user.id, options);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to award coins (admin only)
 */
export function useAwardCoins() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: awardCoins,
    onSuccess: () => {
      // Invalidate gamification stats
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
    },
  });
}

/**
 * Hook to spend coins
 */
export function useSpendCoins() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      amount,
      reason,
    }: {
      userId: string;
      amount: number;
      reason: string;
    }) => spendCoins(userId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
    },
  });
}

/**
 * Hook to get current coin balance (real-time)
 */
export function useCoinBalance() {
  return useQuery({
    queryKey: [...gamificationKeys.all, "balance"],
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data } = await supabase
        .from("profiles")
        .select("coins_balance")
        .eq("id", user.id)
        .single();

      return data?.coins_balance || 0;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
