"use client";

import { cn } from "@/lib/utils/cn";
import { Level } from "@/lib/services/gamification-service";

interface LevelBadgeProps {
  level: Level;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const levelConfig: Record<Level, { color: string; bgGradient: string; icon: string }> = {
  bronze: {
    color: "#cd7f32",
    bgGradient: "from-amber-700 to-amber-900",
    icon: "🥉",
  },
  silver: {
    color: "#c0c0c0",
    bgGradient: "from-gray-400 to-gray-600",
    icon: "🥈",
  },
  gold: {
    color: "#ffd700",
    bgGradient: "from-yellow-400 to-yellow-600",
    icon: "🥇",
  },
  platinum: {
    color: "#e5e4e2",
    bgGradient: "from-slate-300 to-slate-500",
    icon: "💎",
  },
};

const sizeConfig = {
  sm: {
    container: "w-8 h-8 text-xs",
    icon: "text-sm",
    label: "text-xs",
  },
  md: {
    container: "w-10 h-10 text-sm",
    icon: "text-base",
    label: "text-sm",
  },
  lg: {
    container: "w-14 h-14 text-base",
    icon: "text-xl",
    label: "text-base",
  },
};

export function LevelBadge({
  level,
  size = "md",
  showLabel = true,
  className,
}: LevelBadgeProps) {
  const config = levelConfig[level];
  const sizes = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
          config.bgGradient,
          sizes.container
        )}
        style={{
          boxShadow: `0 0 12px ${config.color}40`,
        }}
      >
        <span className={sizes.icon}>{config.icon}</span>
      </div>
      {showLabel && (
        <span
          className={cn("font-semibold capitalize", sizes.label)}
          style={{ color: config.color }}
        >
          {level}
        </span>
      )}
    </div>
  );
}

export function LevelProgress({
  level,
  progressPercent,
  coinsToNextLevel,
  className,
}: {
  level: Level;
  progressPercent: number;
  coinsToNextLevel: number;
  className?: string;
}) {
  const config = levelConfig[level];
  const isMaxLevel = level === "platinum";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <LevelBadge level={level} size="sm" />
        {!isMaxLevel && (
          <span className="text-gray-400 text-xs">
            {coinsToNextLevel.toLocaleString()} coins to next level
          </span>
        )}
      </div>

      <div className="relative h-2 bg-dark-elevated rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${config.color}, ${config.color}80)`,
          }}
        />
        {isMaxLevel && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {isMaxLevel ? "Maximum level reached! 🎉" : `${progressPercent}% to next level`}
      </p>
    </div>
  );
}
