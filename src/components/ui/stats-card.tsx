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
        "bg-white border border-slate-200 rounded-xl p-6 transition-all duration-300 shadow-premium",
        onClick && "cursor-pointer hover:shadow-premium-hover hover:border-slate-300",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-4">
              <div className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{trend.label}</span>
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
    <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-premium flex-1 min-w-[160px]">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border",
          colorVariants[color]
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
