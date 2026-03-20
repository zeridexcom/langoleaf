"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
  onClick?: () => void;
}

const colorVariants = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "primary",
  className,
  onClick,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 shadow-premium",
        onClick && "cursor-pointer hover:shadow-premium-hover hover:border-gray-300",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-3">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-bold",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-sm text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
            colorVariants[color]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Mini stats card for compact layouts
interface MiniStatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "danger" | "info";
}

export function MiniStatsCard({
  label,
  value,
  icon: Icon,
  color = "primary",
}: MiniStatsCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-premium">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border",
          colorVariants[color]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
        <p className="text-lg font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}
