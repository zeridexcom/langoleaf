"use client";

import { Coins, Sparkles } from "lucide-react";
import { useGamificationStats } from "@/hooks/useGamification";

export function CoinsDisplay() {
  const { data: stats, isLoading } = useGamificationStats();

  const coinBalance = stats?.currentBalance ?? 0;
  const level = stats?.level?.level ?? "bronze";

  const levelLabel =
    level === "platinum"
      ? "Platinum"
      : level === "gold"
      ? "Gold"
      : level === "silver"
      ? "Silver"
      : "Bronze";

  const levelInitial = levelLabel.charAt(0);

  return (
    <div className="flex items-center gap-4">
      {/* Coins Card */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#fbbf24]/20 to-yellow-500/20 border border-[#fbbf24]/30 rounded-2xl">
        <div className="relative">
          <Coins className="w-6 h-6 text-[#fbbf24]" />
          <Sparkles className="w-3 h-3 text-[#fbbf24] absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div>
          <p className="text-xs text-gray-400">Your Coins</p>
          <p className="text-lg font-bold text-[#fbbf24]">
            {isLoading ? "..." : coinBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Level Badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-dark-elevated border border-dark-border rounded-2xl">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
          {levelInitial}
        </div>
        <div>
          <p className="text-xs text-gray-400">Agent Level</p>
          <p className="text-sm font-semibold text-white">
            {isLoading ? "..." : levelLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
