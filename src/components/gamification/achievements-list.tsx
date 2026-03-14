"use client";

import { useState } from "react";
import { useUserAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils/cn";
import { Check, Lock, Gift, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AchievementsListProps {
  userId?: string;
  showAll?: boolean;
  className?: string;
}

export function AchievementsList({
  userId,
  showAll = false,
  className,
}: AchievementsListProps) {
  const [expanded, setExpanded] = useState(showAll);
  const { data: userAchievements, isLoading } = useUserAchievements(userId);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-dark-elevated rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!userAchievements || userAchievements.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-gray-400">No achievements yet. Keep going! 🎯</p>
      </div>
    );
  }

  const completed = userAchievements.filter((a) => a.completedAt);
  const inProgress = userAchievements.filter((a) => !a.completedAt);
  const displayAchievements = expanded
    ? userAchievements
    : [...completed.slice(0, 3), ...inProgress.slice(0, 2)];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stats Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm text-gray-400">
              <span className="font-semibold text-white">{completed.length}</span> Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm text-gray-400">
              <span className="font-semibold text-white">{inProgress.length}</span> In Progress
            </span>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid gap-3">
        {displayAchievements.map((ua) => {
          const isCompleted = !!ua.completedAt;
          const progressPercent = (ua.progress / ua.achievement.requirementValue) * 100;

          return (
            <div
              key={ua.id}
              className={cn(
                "p-4 rounded-xl border transition-all",
                isCompleted
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-dark-elevated border-dark-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                    isCompleted ? "bg-green-500/20" : "bg-dark-surface"
                  )}
                  style={{
                    boxShadow: isCompleted
                      ? `0 0 20px ${ua.achievement.color}40`
                      : undefined,
                  }}
                >
                  {ua.achievement.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white truncate">
                      {ua.achievement.name}
                    </h4>
                    {isCompleted && (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {ua.achievement.description}
                  </p>

                  {/* Progress Bar */}
                  {!isCompleted && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-gray-400">
                          {ua.progress} / {ua.achievement.requirementValue}
                        </span>
                      </div>
                      <div className="h-1.5 bg-dark-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                          style={{ width: `${Math.min(100, progressPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Reward */}
                  <div className="flex items-center gap-2 mt-2">
                    <Gift className="w-4 h-4 text-[#fbbf24]" />
                    <span className="text-xs text-[#fbbf24]">
                      +{ua.achievement.coinReward} coins
                    </span>
                    {isCompleted && ua.coinRewardClaimed && (
                      <span className="text-xs text-green-500 ml-2">Claimed ✓</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {userAchievements.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 text-gray-400 hover:text-white"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show All ({userAchievements.length - 5} more)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
