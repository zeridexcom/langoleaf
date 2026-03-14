"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { cn } from "@/lib/utils/cn";
import { Trophy, Medal, Crown, Sparkles, Users, GraduationCap } from "lucide-react";

interface LeaderboardProps {
  limit?: number;
  showCurrentUser?: boolean;
  className?: string;
}

const rankIcons = [
  { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/20" },
  { icon: Medal, color: "text-gray-300", bg: "bg-gray-300/20" },
  { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/20" },
];

export function Leaderboard({
  limit = 10,
  showCurrentUser = true,
  className,
}: LeaderboardProps) {
  const { data, isLoading } = useLeaderboard(limit);
  const { leaderboard, currentUserId, userRank } = data || {};

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 bg-dark-elevated rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No leaderboard data yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* User's Rank (if not in top) */}
      {showCurrentUser && userRank && userRank > limit && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Your Rank</span>
            <span className="text-lg font-bold text-primary">#{userRank}</span>
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        {leaderboard.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          const isTopThree = entry.rank <= 3;
          const RankIcon = rankIcons[entry.rank - 1]?.icon || Trophy;
          const rankColor = rankIcons[entry.rank - 1]?.color || "text-gray-400";
          const rankBg = rankIcons[entry.rank - 1]?.bg || "bg-gray-400/20";

          return (
            <div
              key={entry.userId}
              className={cn(
                "p-4 rounded-xl border transition-all",
                isCurrentUser
                  ? "bg-primary/10 border-primary/30"
                  : "bg-dark-elevated border-dark-border hover:border-dark-border/80",
                isTopThree && "relative overflow-hidden"
              )}
            >
              {/* Top 3 Glow Effect */}
              {isTopThree && (
                <div
                  className={cn(
                    "absolute inset-0 opacity-20",
                    entry.rank === 1 && "bg-gradient-to-r from-yellow-400/20 to-transparent",
                    entry.rank === 2 && "bg-gradient-to-r from-gray-300/20 to-transparent",
                    entry.rank === 3 && "bg-gradient-to-r from-amber-600/20 to-transparent"
                  )}
                />
              )}

              <div className="relative flex items-center gap-4">
                {/* Rank */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    rankBg
                  )}
                >
                  {isTopThree ? (
                    <RankIcon className={cn("w-5 h-5", rankColor)} />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    entry.fullName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white truncate">
                      {entry.fullName}
                    </h4>
                    {isCurrentUser && (
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                        You
                      </span>
                    )}
                    {entry.rank === 1 && (
                      <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {entry.totalStudents} students
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {entry.totalEnrollments} enrolled
                    </span>
                  </div>
                </div>

                {/* Coins */}
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-[#fbbf24]">
                      {entry.totalCoinsEarned.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#fbbf24]">coins</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    +{entry.coinsThisMonth} this month
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
