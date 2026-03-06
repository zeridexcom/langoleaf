"use client";

import { Coins, Sparkles } from "lucide-react";

export function CoinsDisplay() {
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
          <p className="text-lg font-bold text-[#fbbf24]">2,450</p>
        </div>
      </div>

      {/* Level Badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#252542] border border-[#2d2d4a] rounded-2xl">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6d28d9] to-[#22d3ee] flex items-center justify-center text-white text-xs font-bold">
          S
        </div>
        <div>
          <p className="text-xs text-gray-400">Agent Level</p>
          <p className="text-sm font-semibold text-white">Silver</p>
        </div>
      </div>
    </div>
  );
}
